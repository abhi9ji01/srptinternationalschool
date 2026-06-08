import { query, queryOne } from "../db.js";
import { notify } from "../utils/notify.js";
import { ADMINS } from "../config.js";

export default async function ptmRoutes(app) {
  app.get("/ptm/sessions", { preHandler: app.authenticate }, async (req) => {
    return query(`SELECT * FROM ptm_sessions WHERE school_id=:sid ORDER BY date DESC`, { sid: req.user.schoolId });
  });

  app.post("/ptm/sessions", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(`INSERT INTO ptm_sessions (school_id, title, date, academic_year_id, created_by) VALUES (:sid,:title,:date,:ay,:by)`,
      { sid: req.user.schoolId, title: b.title, date: b.date, ay: b.academic_year_id || null, by: req.user.id });
    return reply.code(201).send({ id: r.insertId });
  });

  app.get("/ptm/slots", { preHandler: app.authenticate }, async (req) => {
    const p = {}; const where = [];
    if (req.query.session_id) { where.push("ps.ptm_session_id=:s"); p.s = req.query.session_id; }
    if (req.query.teacher_id) { where.push("ps.teacher_id=:t"); p.t = req.query.teacher_id; }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT ps.*, u.name AS teacher_name, su.name AS student_name FROM ptm_slots ps
       LEFT JOIN teachers t ON t.id=ps.teacher_id LEFT JOIN users u ON u.id=t.user_id
       LEFT JOIN students st ON st.id=ps.student_id LEFT JOIN users su ON su.id=st.user_id
       ${w} ORDER BY ps.start_time`, p);
  });

  app.post("/ptm/slots", { preHandler: app.authorize([...ADMINS, "teacher"]) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO ptm_slots (ptm_session_id, teacher_id, start_time, end_time, status) VALUES (:s,:t,:st,:et,'available')`,
      { s: b.ptm_session_id, t: b.teacher_id, st: b.start_time, et: b.end_time });
    return reply.code(201).send({ id: r.insertId });
  });

  // Parent books a slot
  app.post("/ptm/slots/book", { preHandler: app.authorize(["parent", ...ADMINS]) }, async (req, reply) => {
    const b = req.body || {};
    const slot = await queryOne(`SELECT * FROM ptm_slots WHERE id=:id`, { id: b.slot_id });
    if (!slot) return reply.code(404).send({ error: "Slot not found" });
    if (slot.is_booked) return reply.code(400).send({ error: "Slot already booked" });
    await query(`UPDATE ptm_slots SET is_booked=1, booked_by_parent_id=:p, student_id=:s, status='booked', remarks=:rm WHERE id=:id`,
      { p: req.user.id, s: b.student_id || null, rm: b.remarks || null, id: b.slot_id });
    // notify teacher
    const t = await queryOne(`SELECT user_id FROM teachers WHERE id=:id`, { id: slot.teacher_id });
    if (t) await notify({ userId: t.user_id, title: "PTM Slot Booked", message: "A parent booked a PTM slot with you.", type: "ptm", link: "/teacher/ptm" });
    return { success: true };
  });
}
