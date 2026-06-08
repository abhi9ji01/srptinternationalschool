import { query, queryOne } from "../db.js";
import { buildExcel } from "../utils/excel.js";
import JSZip from "jszip";
import { ADMINS } from "../config.js";

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
    const f = ["name", "address", "phone", "email", "logo_url", "website", "principal_name", "affiliation_board", "established_year"];
    const set = [], p = { id: req.user.schoolId };
    f.forEach((k) => { if (b[k] !== undefined) { set.push(`${k}=:${k}`); p[k] = b[k]; } });
    if (set.length) await query(`UPDATE schools SET ${set.join(", ")} WHERE id=:id`, p);
    return { success: true };
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

  // ---- GENERIC FILE UPLOAD ----
  app.post("/upload", { preHandler: app.authenticate }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No file" });
    const fs = await import("node:fs");
    const path = await import("node:path");
    const safe = Date.now() + "-" + data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dest = path.join(app.uploadDir, safe);
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(dest);
      data.file.pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
    });
    return { url: `/uploads/${safe}`, filename: data.filename };
  });

  // ---- SMS / EMAIL manual send + logs ----
  app.get("/notification-logs", { preHandler: app.authorize(ADMINS) }, async () => {
    return query(`SELECT * FROM notification_logs ORDER BY id DESC LIMIT 300`);
  });
}
