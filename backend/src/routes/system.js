import { query, queryOne } from "../db.js";
import { buildExcel } from "../utils/excel.js";
import JSZip from "jszip";
import { ADMINS } from "../config.js";
import { uploadBuffer, deleteFromCloudinary } from "../lib/upload.js";
import { cloudinaryEnabled } from "../lib/cloudinary.js";
import { sendEmail } from "../utils/mailer.js";
import { sendSMS } from "../utils/sms.js";

export default async function systemRoutes(app) {
  // ---- AUDIT LOGS (super admin) ----
  app.get("/audit-logs", { preHandler: app.authorize(["super_admin", "admin"]) }, async (req) => {
    const p = { sid: req.user.schoolId }; let extra = "";
    if (req.query.module) { extra += " AND al.module=:m"; p.m = req.query.module; }
    if (req.query.action) { extra += " AND al.action=:a"; p.a = req.query.action; }
    return query(
      `SELECT al.*, u.name AS user_name FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id
       WHERE (al.school_id=:sid OR al.school_id IS NULL) ${extra} ORDER BY al.created_at DESC LIMIT 500`, p);
  });

  app.get("/audit-logs/export", { preHandler: app.authorize(["super_admin", "admin"]) }, async (req, reply) => {
    const rows = await query(
      `SELECT al.created_at, u.name AS user, al.action, al.module, al.record_id, al.ip_address
       FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id WHERE al.school_id=:sid ORDER BY al.created_at DESC LIMIT 5000`, { sid: req.user.schoolId });
    const buf = buildExcel(rows, "AuditLogs");
    reply.header("Content-Disposition", "attachment; filename=audit_logs.xlsx");
    reply.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return reply.send(buf);
  });

  // ---- SETTINGS (school info) ----
  app.get("/settings", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const school = await queryOne(`SELECT * FROM schools WHERE id=:id`, { id: req.user.schoolId });
    const grades = await query(`SELECT * FROM grade_config WHERE school_id=:sid ORDER BY min_percentage DESC`, { sid: req.user.schoolId });
    const periodSettings = await queryOne(`SELECT * FROM period_settings WHERE school_id=:sid`, { sid: req.user.schoolId });
    return { school, grades, periodSettings };
  });

  app.put("/settings", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const b = req.body || {};
    const f = ["name", "address", "phone", "email", "logo_url", "website", "principal_name",
      "affiliation_board", "established_year", "primary_color", "secondary_color"];
    const set = [], p = { id: req.user.schoolId };
    f.forEach((k) => { if (b[k] !== undefined) { set.push(`${k}=:${k}`); p[k] = b[k]; } });
    if (set.length) await query(`UPDATE schools SET ${set.join(", ")} WHERE id=:id`, p);
    return { success: true };
  });

  // ---- SCHOOL LOGO (Cloudinary) ----
  app.post("/settings/logo", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    if (!cloudinaryEnabled()) return reply.code(503).send({ error: "File storage is not configured. Set CLOUDINARY_* env variables." });
    const part = await req.file({ limits: { fileSize: 1 * 1024 * 1024 } });
    if (!part) return reply.code(400).send({ error: "No file provided" });
    if (!part.mimetype.startsWith("image/")) return reply.code(415).send({ error: "Logo must be an image" });
    let buffer;
    try { buffer = await part.toBuffer(); }
    catch { return reply.code(413).send({ error: "Logo exceeds the 1MB limit" }); }
    if (part.file.truncated) return reply.code(413).send({ error: "Logo exceeds the 1MB limit" });

    const school = await queryOne(`SELECT logo_public_id FROM schools WHERE id=:id`, { id: req.user.schoolId });
    const result = await uploadBuffer(buffer, "school-logo", { filename: part.filename });
    await query(`UPDATE schools SET logo_url=:url, logo_public_id=:pid WHERE id=:id`,
      { url: result.url, pid: result.public_id, id: req.user.schoolId });
    // Best-effort cleanup of the previous logo.
    if (school?.logo_public_id) await deleteFromCloudinary(school.logo_public_id, "image");
    return { logo_url: result.url, logo_public_id: result.public_id };
  });

  // ---- PUBLIC SCHOOL INFO (no auth) — used by the landing page ----
  app.get("/public/school-info", async () => {
    const s = await queryOne(
      `SELECT name, address, phone, email, website, logo_url, principal_name,
              affiliation_board, established_year, primary_color, secondary_color
       FROM schools ORDER BY id ASC LIMIT 1`);
    return s || {};
  });

  // ---- PUBLIC SCHOOL BRANDING (any authenticated user) ----
  // Used by SchoolContext for the navbar, report cards, ID cards, print headers.
  app.get("/school-info", { preHandler: app.authenticate }, async (req) => {
    const s = await queryOne(
      `SELECT id, name, address, phone, email, website, logo_url, principal_name,
              affiliation_board, established_year, primary_color, secondary_color
       FROM schools WHERE id=:id`, { id: req.user.schoolId });
    return s || {};
  });

  // ---- TEST EMAIL / SMS (sends to the admin's own contact) ----
  app.post("/settings/test-email", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const me = await queryOne(`SELECT email, name FROM users WHERE id=:id`, { id: req.user.id });
    if (!me?.email) return reply.code(400).send({ error: "Your account has no email address" });
    const r = await sendEmail({
      to: me.email, userId: req.user.id,
      subject: "SMTP Test Email",
      html: `<p>Hello ${me.name},</p><p>This is a test email confirming your SMTP settings are working.</p>`,
      text: "This is a test email confirming your SMTP settings are working.",
    });
    if (r.status === "failed") return reply.code(502).send({ error: r.error || "Email failed" });
    if (r.status === "pending") return reply.code(503).send({ error: "SMTP is not configured on the server" });
    return { success: true, message: `Test email sent to ${me.email}` };
  });

  app.post("/settings/test-sms", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const me = await queryOne(`SELECT phone, name FROM users WHERE id=:id`, { id: req.user.id });
    if (!me?.phone) return reply.code(400).send({ error: "Your account has no phone number" });
    const r = await sendSMS({ to: me.phone, userId: req.user.id, message: "Test SMS from your School MS — provider is working." });
    if (r.status === "failed") return reply.code(502).send({ error: r.error || "SMS failed" });
    if (r.status === "pending") return reply.code(503).send({ error: "No SMS provider is configured on the server" });
    return { success: true, message: `Test SMS sent to ${me.phone}` };
  });

  // ---- BACKUP (export key tables as a ZIP of Excel files) ----
  app.get("/backup/export", { preHandler: app.authorize(["super_admin", "admin"]) }, async (req, reply) => {
    const sid = req.user.schoolId;
    const zip = new JSZip();
    const dumps = {
      students: `SELECT st.*, u.name, u.email FROM students st JOIN users u ON u.id=st.user_id WHERE st.school_id=${Number(sid)}`,
      teachers: `SELECT t.*, u.name, u.email FROM teachers t JOIN users u ON u.id=t.user_id WHERE t.school_id=${Number(sid)}`,
      fee_payments: `SELECT fp.* FROM fee_payments fp JOIN students st ON st.id=fp.student_id WHERE st.school_id=${Number(sid)}`,
      attendance: `SELECT a.* FROM attendance a JOIN students st ON st.id=a.student_id WHERE st.school_id=${Number(sid)} LIMIT 20000`,
      exam_marks: `SELECT em.* FROM exam_marks em JOIN students st ON st.id=em.student_id WHERE st.school_id=${Number(sid)}`,
    };
    for (const [name, sql] of Object.entries(dumps)) {
      try {
        const rows = await query(sql);
        zip.file(`${name}.xlsx`, buildExcel(rows, name));
      } catch (e) {
        zip.file(`${name}_error.txt`, e.message);
      }
    }
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    reply.header("Content-Disposition", `attachment; filename=backup_${Date.now()}.zip`);
    reply.type("application/zip");
    return reply.send(buf);
  });

  // ---- PROFILE (self) ----
  app.put("/profile", { preHandler: app.authenticate }, async (req) => {
    const b = req.body || {};
    const f = ["name", "phone", "profile_photo"];
    const set = [], p = { id: req.user.id };
    f.forEach((k) => { if (b[k] !== undefined) { set.push(`${k}=:${k}`); p[k] = b[k]; } });
    if (set.length) await query(`UPDATE users SET ${set.join(", ")} WHERE id=:id`, p);
    return { success: true };
  });

  // NOTE: the generic POST /upload now lives in routes/upload.js (Cloudinary).
  // The old local-disk handler was removed as part of the Cloudinary migration.

  // ---- SMS / EMAIL manual send + logs ----
  app.get("/notification-logs", { preHandler: app.authorize(ADMINS) }, async () => {
    return query(`SELECT * FROM notification_logs ORDER BY id DESC LIMIT 300`);
  });
}
