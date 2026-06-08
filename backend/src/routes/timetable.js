import { query, queryOne } from "../db.js";
import { registerCrud } from "../utils/crud.js";
import { ADMINS, ALL_ROLES } from "../config.js";

export default async function timetableRoutes(app) {
  // Grid for a section (or teacher)
  app.get("/timetable", { preHandler: app.authorize(ALL_ROLES) }, async (req) => {
    const p = {}; const where = [];
    if (req.query.section_id) { where.push("p.section_id=:sec"); p.sec = req.query.section_id; }
    if (req.query.teacher_id) { where.push("p.teacher_id=:t"); p.t = req.query.teacher_id; }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT p.*, sub.name AS subject_name, sec.name AS section_name, c.name AS class_name, u.name AS teacher_name
       FROM periods p LEFT JOIN subjects sub ON sub.id=p.subject_id
       LEFT JOIN sections sec ON sec.id=p.section_id LEFT JOIN classes c ON c.id=sec.class_id
       LEFT JOIN teachers t ON t.id=p.teacher_id LEFT JOIN users u ON u.id=t.user_id
       ${w} ORDER BY FIELD(p.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), p.period_number`, p);
  });

  // Create a period with teacher double-booking conflict check
  app.post("/timetable", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    if (b.teacher_id && b.day_of_week && b.period_number) {
      const clash = await queryOne(
        `SELECT p.id, sec.name AS section_name FROM periods p JOIN sections sec ON sec.id=p.section_id
         WHERE p.teacher_id=:t AND p.day_of_week=:d AND p.period_number=:pn AND p.section_id!=:sec`,
        { t: b.teacher_id, d: b.day_of_week, pn: b.period_number, sec: b.section_id || 0 });
      if (clash) return reply.code(409).send({ error: `Teacher already booked in ${clash.section_name} for this period` });
    }
    const r = await query(
      `INSERT INTO periods (section_id, subject_id, teacher_id, period_number, day_of_week, start_time, end_time, duration_minutes, is_before_lunch, academic_year_id)
       VALUES (:sec,:sub,:t,:pn,:day,:st,:et,:dur,:bl,:ay)`,
      { sec: b.section_id, sub: b.subject_id || null, t: b.teacher_id || null, pn: b.period_number, day: b.day_of_week,
        st: b.start_time || null, et: b.end_time || null, dur: b.duration_minutes || null, bl: b.is_before_lunch ? 1 : 0, ay: b.academic_year_id || null });
    return reply.code(201).send({ id: r.insertId });
  });

  app.delete("/timetable/:id", { preHandler: app.authorize(ADMINS) }, async (req) => {
    await query(`DELETE FROM periods WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // Period settings (single per school)
  app.get("/timetable/settings", { preHandler: app.authorize(ALL_ROLES) }, async (req) => {
    return queryOne(`SELECT * FROM period_settings WHERE school_id=:sid LIMIT 1`, { sid: req.user.schoolId });
  });

  app.post("/timetable/settings", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const b = req.body || {};
    const ex = await queryOne(`SELECT id FROM period_settings WHERE school_id=:sid`, { sid: req.user.schoolId });
    if (ex) {
      await query(`UPDATE period_settings SET before_lunch_duration=:bl, after_lunch_duration=:al, lunch_break_start=:ls, lunch_break_end=:le WHERE id=:id`,
        { bl: b.before_lunch_duration || 45, al: b.after_lunch_duration || 30, ls: b.lunch_break_start || null, le: b.lunch_break_end || null, id: ex.id });
      return { success: true, id: ex.id };
    }
    const r = await query(`INSERT INTO period_settings (school_id, before_lunch_duration, after_lunch_duration, lunch_break_start, lunch_break_end) VALUES (:sid,:bl,:al,:ls,:le)`,
      { sid: req.user.schoolId, bl: b.before_lunch_duration || 45, al: b.after_lunch_duration || 30, ls: b.lunch_break_start || null, le: b.lunch_break_end || null });
    return { success: true, id: r.insertId };
  });

  // Online classes
  app.get("/online-classes", { preHandler: app.authorize(ALL_ROLES) }, async (req) => {
    const p = {}; const where = [];
    if (req.query.section_id) { where.push("oc.section_id=:sec"); p.sec = req.query.section_id; }
    if (req.query.teacher_id) { where.push("oc.teacher_id=:t"); p.t = req.query.teacher_id; }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT oc.*, sub.name AS subject_name, sec.name AS section_name, u.name AS teacher_name
       FROM online_classes oc LEFT JOIN subjects sub ON sub.id=oc.subject_id
       LEFT JOIN sections sec ON sec.id=oc.section_id LEFT JOIN teachers t ON t.id=oc.teacher_id LEFT JOIN users u ON u.id=t.user_id
       ${w} ORDER BY oc.scheduled_at DESC LIMIT 200`, p);
  });

  app.post("/online-classes", { preHandler: app.authorize([...ADMINS, "teacher"]) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO online_classes (teacher_id, subject_id, section_id, title, meeting_link, platform, scheduled_at, duration_minutes)
       VALUES (:t,:sub,:sec,:title,:link,:plat,:sched,:dur)`,
      { t: b.teacher_id || null, sub: b.subject_id || null, sec: b.section_id, title: b.title, link: b.meeting_link,
        plat: b.platform || "google_meet", sched: b.scheduled_at, dur: b.duration_minutes || 40 });
    return reply.code(201).send({ id: r.insertId });
  });

  app.put("/online-classes/:id", { preHandler: app.authorize([...ADMINS, "teacher"]) }, async (req) => {
    const b = req.body || {};
    if (b.recording_url !== undefined) await query(`UPDATE online_classes SET recording_url=:r WHERE id=:id`, { r: b.recording_url, id: req.params.id });
    return { success: true };
  });

  app.delete("/online-classes/:id", { preHandler: app.authorize([...ADMINS, "teacher"]) }, async (req) => {
    await query(`DELETE FROM online_classes WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });
}
