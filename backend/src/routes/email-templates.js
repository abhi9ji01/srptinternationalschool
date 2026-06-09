import { query, queryOne } from "../db.js";
import { audit, reqMeta } from "../utils/audit.js";
import { sendEmail } from "../utils/mailer.js";
import { ADMINS } from "../config.js";
import { SAMPLE_VARS, renderTemplate } from "../lib/template-vars.js";

const TYPES = ["welcome", "fee_receipt", "fee_reminder", "attendance_alert", "marks_published",
  "exam_schedule", "password_reset", "announcement", "custom"];

export default async function emailTemplateRoutes(app) {
  // LIST
  app.get("/email-templates", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const params = { sid: req.user.schoolId };
    let extra = "";
    if (req.query.type) { extra = " AND type=:type"; params.type = req.query.type; }
    const rows = await query(
      `SELECT id, name, subject, type, is_active, updated_at, created_at
       FROM email_templates WHERE school_id=:sid ${extra} ORDER BY updated_at DESC`, params);
    return { data: rows, total: rows.length };
  });

  // GET one (full body)
  app.get("/email-templates/:id", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const t = await queryOne(`SELECT * FROM email_templates WHERE id=:id AND school_id=:sid`,
      { id: req.params.id, sid: req.user.schoolId });
    if (!t) return reply.code(404).send({ error: "Template not found" });
    if (typeof t.variables === "string") { try { t.variables = JSON.parse(t.variables); } catch { t.variables = []; } }
    return t;
  });

  // CREATE
  app.post("/email-templates", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.name || !b.subject || !b.html_body) return reply.code(400).send({ error: "name, subject and html_body are required" });
    const type = TYPES.includes(b.type) ? b.type : "custom";
    const r = await query(
      `INSERT INTO email_templates (school_id, name, subject, type, html_body, variables, created_by)
       VALUES (:sid, :name, :subject, :type, :body, :vars, :uid)`,
      { sid: req.user.schoolId, name: b.name, subject: b.subject, type, body: b.html_body,
        vars: JSON.stringify(b.variables || []), uid: req.user.id });
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "create", module: "email_templates", recordId: r.insertId, newValue: { name: b.name } });
    return reply.code(201).send({ id: r.insertId, success: true });
  });

  // UPDATE
  app.put("/email-templates/:id", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const t = await queryOne(`SELECT id FROM email_templates WHERE id=:id AND school_id=:sid`, { id: req.params.id, sid: req.user.schoolId });
    if (!t) return reply.code(404).send({ error: "Template not found" });
    const b = req.body || {};
    const set = [], p = { id: req.params.id };
    if (b.name !== undefined) { set.push("name=:name"); p.name = b.name; }
    if (b.subject !== undefined) { set.push("subject=:subject"); p.subject = b.subject; }
    if (b.type !== undefined) { set.push("type=:type"); p.type = TYPES.includes(b.type) ? b.type : "custom"; }
    if (b.html_body !== undefined) { set.push("html_body=:body"); p.body = b.html_body; }
    if (b.variables !== undefined) { set.push("variables=:vars"); p.vars = JSON.stringify(b.variables || []); }
    if (b.is_active !== undefined) { set.push("is_active=:active"); p.active = b.is_active ? 1 : 0; }
    if (set.length) await query(`UPDATE email_templates SET ${set.join(", ")} WHERE id=:id`, p);
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "update", module: "email_templates", recordId: Number(req.params.id) });
    return { success: true };
  });

  // DELETE
  app.delete("/email-templates/:id", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const t = await queryOne(`SELECT id FROM email_templates WHERE id=:id AND school_id=:sid`, { id: req.params.id, sid: req.user.schoolId });
    if (!t) return reply.code(404).send({ error: "Template not found" });
    await query(`DELETE FROM email_templates WHERE id=:id`, { id: req.params.id });
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "delete", module: "email_templates", recordId: Number(req.params.id) });
    return { success: true };
  });

  // SEND TEST (to the admin's own email, with sample variable values)
  app.post("/email-templates/:id/send-test", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const t = await queryOne(`SELECT * FROM email_templates WHERE id=:id AND school_id=:sid`, { id: req.params.id, sid: req.user.schoolId });
    if (!t) return reply.code(404).send({ error: "Template not found" });
    const me = await queryOne(`SELECT email FROM users WHERE id=:id`, { id: req.user.id });
    if (!me?.email) return reply.code(400).send({ error: "Your account has no email address" });
    const school = await queryOne(`SELECT name, logo_url FROM schools WHERE id=:id`, { id: req.user.schoolId });
    const vars = { ...SAMPLE_VARS, school_name: school?.name || SAMPLE_VARS.school_name, school_logo: school?.logo_url || "" };
    const r = await sendEmail({
      to: me.email, userId: req.user.id,
      subject: `[TEST] ${renderTemplate(t.subject, vars)}`,
      html: renderTemplate(t.html_body, vars),
    });
    if (r.status === "failed") return reply.code(502).send({ error: r.error || "Email failed" });
    if (r.status === "pending") return reply.code(503).send({ error: "SMTP is not configured on the server" });
    return { success: true, message: `Test email sent to ${me.email}` };
  });

  // SEND to recipients
  app.post("/email-templates/send", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.template_id || !Array.isArray(b.recipient_ids) || !b.recipient_ids.length) {
      return reply.code(400).send({ error: "template_id and recipient_ids[] are required" });
    }
    const t = await queryOne(`SELECT * FROM email_templates WHERE id=:id AND school_id=:sid`, { id: b.template_id, sid: req.user.schoolId });
    if (!t) return reply.code(404).send({ error: "Template not found" });
    const school = await queryOne(`SELECT name, logo_url FROM schools WHERE id=:id`, { id: req.user.schoolId });

    const placeholders = b.recipient_ids.map((_, i) => `:r${i}`).join(",");
    const rp = {}; b.recipient_ids.forEach((id, i) => { rp[`r${i}`] = id; });
    rp.sid = req.user.schoolId;
    const recipients = await query(
      `SELECT id, name, email FROM users WHERE id IN (${placeholders}) AND school_id=:sid AND email IS NOT NULL`, rp);

    let sent = 0, failed = 0;
    for (const u of recipients) {
      const vars = {
        ...(b.variable_values || {}),
        student_name: (b.variable_values || {}).student_name || u.name,
        school_name: school?.name || "",
        school_logo: school?.logo_url || "",
      };
      const r = await sendEmail({
        to: u.email, userId: u.id,
        subject: renderTemplate(t.subject, vars),
        html: renderTemplate(t.html_body, vars),
      });
      if (r.status === "sent") sent++; else failed++;
    }
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "send", module: "email_templates", recordId: Number(b.template_id), newValue: { sent, failed } });
    return { success: true, sent, failed, total: recipients.length };
  });
}
