import { query, queryOne } from "../db.js";
import { ADMINS, STAFF_ROLES } from "../config.js";

const MANAGERS = [...ADMINS, "hr_manager"];
const LATE_AFTER = "09:30:00"; // check-ins after this are marked "late"

export default async function employeeAttendanceRoutes(app) {
  // ---- SELF SERVICE ----
  // Today's own record (drives the check-in/out widget state).
  app.get("/employee-attendance/today", { preHandler: app.authenticate }, async (req) => {
    return (await queryOne(`SELECT * FROM employee_attendance WHERE user_id=:uid AND date=CURDATE()`, { uid: req.user.id })) || null;
  });

  app.post("/employee-attendance/check-in", { preHandler: app.authenticate }, async (req, reply) => {
    const existing = await queryOne(`SELECT id, check_in FROM employee_attendance WHERE user_id=:uid AND date=CURDATE()`, { uid: req.user.id });
    if (existing?.check_in) return reply.code(409).send({ error: "Already checked in today" });
    if (existing) {
      await query(`UPDATE employee_attendance SET check_in=CURTIME(), status=IF(CURTIME()>:late,'late','present'), marked_by=:uid WHERE id=:id`,
        { late: LATE_AFTER, uid: req.user.id, id: existing.id });
    } else {
      await query(
        `INSERT INTO employee_attendance (school_id,user_id,date,status,check_in,marked_by)
         VALUES (:sid,:uid,CURDATE(),IF(CURTIME()>:late,'late','present'),CURTIME(),:uid)`,
        { sid: req.user.schoolId, uid: req.user.id, late: LATE_AFTER });
    }
    return { success: true };
  });

  app.post("/employee-attendance/check-out", { preHandler: app.authenticate }, async (req, reply) => {
    const existing = await queryOne(`SELECT id, check_in FROM employee_attendance WHERE user_id=:uid AND date=CURDATE()`, { uid: req.user.id });
    if (!existing?.check_in) return reply.code(400).send({ error: "Check in first" });
    await query(`UPDATE employee_attendance SET check_out=CURTIME() WHERE id=:id`, { id: existing.id });
    return { success: true };
  });

  // Own history for a month.
  app.get("/employee-attendance/my", { preHandler: app.authenticate }, async (req) => {
    const p = { uid: req.user.id };
    const where = ["user_id=:uid"];
    if (req.query.month) { where.push("MONTH(date)=:m"); p.m = req.query.month; }
    if (req.query.year) { where.push("YEAR(date)=:y"); p.y = req.query.year; }
    return query(`SELECT * FROM employee_attendance WHERE ${where.join(" AND ")} ORDER BY date DESC LIMIT 60`, p);
  });

  // ---- HR / ADMIN ----
  // All employees with their status for a given date (unmarked → null status).
  app.get("/employee-attendance", { preHandler: app.authorize(MANAGERS) }, async (req) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const rolePh = STAFF_ROLES.map((_, i) => `:r${i}`).join(",");
    const p = STAFF_ROLES.reduce((acc, r, i) => ({ ...acc, [`r${i}`]: r }), { sid: req.user.schoolId, d: date });
    return query(
      `SELECT u.id AS user_id, u.name, u.role, ea.id AS attendance_id, ea.status, ea.check_in, ea.check_out, ea.remarks
       FROM users u
       LEFT JOIN employee_attendance ea ON ea.user_id=u.id AND ea.date=:d
       WHERE u.school_id=:sid AND u.is_active=1 AND u.role IN (${rolePh})
       ORDER BY u.name`, p);
  });

  // Mark / override one employee for a date (upsert).
  app.post("/employee-attendance/mark", { preHandler: app.authorize(MANAGERS) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.user_id || !b.date || !b.status) return reply.code(400).send({ error: "user_id, date, status required" });
    await query(
      `INSERT INTO employee_attendance (school_id,user_id,date,status,remarks,marked_by)
       VALUES (:sid,:uid,:date,:status,:remarks,:by)
       ON DUPLICATE KEY UPDATE status=VALUES(status), remarks=VALUES(remarks), marked_by=VALUES(marked_by)`,
      { sid: req.user.schoolId, uid: b.user_id, date: b.date, status: b.status, remarks: b.remarks || null, by: req.user.id });
    return { success: true };
  });

  // Monthly summary per employee (present/absent/late counts).
  app.get("/employee-attendance/summary", { preHandler: app.authorize(MANAGERS) }, async (req) => {
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();
    return query(
      `SELECT u.id AS user_id, u.name, u.role,
              SUM(ea.status='present') AS present, SUM(ea.status='late') AS late,
              SUM(ea.status='absent') AS absent, SUM(ea.status='half_day') AS half_day, SUM(ea.status='leave') AS leave_days
       FROM users u
       LEFT JOIN employee_attendance ea ON ea.user_id=u.id AND MONTH(ea.date)=:m AND YEAR(ea.date)=:y
       WHERE u.school_id=:sid AND u.is_active=1 AND u.role IN (${STAFF_ROLES.map((_, i) => `:r${i}`).join(",")})
       GROUP BY u.id, u.name, u.role ORDER BY u.name`,
      STAFF_ROLES.reduce((acc, r, i) => ({ ...acc, [`r${i}`]: r }), { sid: req.user.schoolId, m: month, y: year }));
  });
}
