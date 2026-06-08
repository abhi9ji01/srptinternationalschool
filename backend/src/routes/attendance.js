import { query, queryOne } from "../db.js";
import { notifyAbsence, notifyLowAttendance } from "../utils/notify.js";
import { LOW_ATTENDANCE_THRESHOLD, ADMINS, STAFF_ROLES } from "../config.js";

const TEACH = [...ADMINS, "teacher"];

export default async function attendanceRoutes(app) {
  // Roster for a section on a date (with existing marks)
  app.get("/attendance", { preHandler: app.authorize([...TEACH, "accountant"]) }, async (req) => {
    const { section_id, date, period_id } = req.query;
    if (!section_id || !date) return { students: [] };
    const students = await query(
      `SELECT st.id AS student_id, u.name, st.roll_number,
              a.id AS attendance_id, a.status, a.remarks
       FROM students st JOIN users u ON u.id=st.user_id
       LEFT JOIN attendance a ON a.student_id=st.id AND a.date=:date ${period_id ? "AND a.period_id=:pid" : "AND a.period_id IS NULL"}
       WHERE st.section_id=:sec AND st.is_active=1 ORDER BY st.roll_number+0, u.name`,
      period_id ? { date, sec: section_id, pid: period_id } : { date, sec: section_id }
    );
    return { students };
  });

  // Bulk mark/update attendance for a section
  app.post("/attendance/bulk", { preHandler: app.authorize(TEACH) }, async (req, reply) => {
    const { date, period_id, records } = req.body || {};
    if (!date || !Array.isArray(records)) return reply.code(400).send({ error: "date and records[] required" });
    let marked = 0; const absentees = [];
    for (const r of records) {
      const existing = await queryOne(
        `SELECT id FROM attendance WHERE student_id=:sid AND date=:date AND ${period_id ? "period_id=:pid" : "period_id IS NULL"}`,
        period_id ? { sid: r.student_id, date, pid: period_id } : { sid: r.student_id, date });
      if (existing) {
        await query(`UPDATE attendance SET status=:status, remarks=:remarks, marked_by=:by WHERE id=:id`,
          { status: r.status, remarks: r.remarks || null, by: req.user.id, id: existing.id });
      } else {
        await query(
          `INSERT INTO attendance (student_id, period_id, date, status, marked_by, remarks) VALUES (:sid,:pid,:date,:status,:by,:remarks)`,
          { sid: r.student_id, pid: period_id || null, date, status: r.status, by: req.user.id, remarks: r.remarks || null });
      }
      marked++;
      if (r.status === "absent") absentees.push(r.student_id);
    }

    // Auto-notify parents of absentees + low-attendance check (best effort)
    for (const sid of absentees) {
      const stu = await queryOne(`SELECT u.name FROM students st JOIN users u ON u.id=st.user_id WHERE st.id=:id`, { id: sid });
      await notifyAbsence({ studentId: sid, studentName: stu?.name || "Student", date });
      await checkLowAttendance(sid);
    }
    return { success: true, marked, notified: absentees.length };
  });

  // QR scan → mark present
  app.post("/attendance/qr-scan", { preHandler: app.authorize(TEACH) }, async (req, reply) => {
    const { token, date, period_id, status } = req.body || {};
    const qr = await queryOne(`SELECT student_id FROM student_qr_codes WHERE qr_token=:t AND is_active=1`, { t: token });
    if (!qr) return reply.code(404).send({ error: "Invalid QR code" });
    const d = date || new Date().toISOString().slice(0, 10);
    const existing = await queryOne(
      `SELECT id FROM attendance WHERE student_id=:sid AND date=:date AND ${period_id ? "period_id=:pid" : "period_id IS NULL"}`,
      period_id ? { sid: qr.student_id, date: d, pid: period_id } : { sid: qr.student_id, date: d });
    const st = status || "present";
    if (existing) await query(`UPDATE attendance SET status=:s, qr_scanned=1, marked_by=:by WHERE id=:id`, { s: st, by: req.user.id, id: existing.id });
    else await query(`INSERT INTO attendance (student_id,period_id,date,status,marked_by,qr_scanned) VALUES (:sid,:pid,:date,:s,:by,1)`,
      { sid: qr.student_id, pid: period_id || null, date: d, s: st, by: req.user.id });
    const stu = await queryOne(`SELECT u.name, st.roll_number FROM students st JOIN users u ON u.id=st.user_id WHERE st.id=:id`, { id: qr.student_id });
    return { success: true, student: stu, status: st };
  });

  // Attendance report per student (subject-wise + monthly)
  app.get("/attendance/report", { preHandler: app.authorize([...TEACH, "student", "parent", "accountant"]) }, async (req) => {
    const { student_id, section_id } = req.query;
    if (student_id) {
      const summary = await queryOne(
        `SELECT COUNT(*) total, SUM(status='present') present, SUM(status='absent') absent,
                SUM(status='late') late, SUM(status='excused') excused FROM attendance WHERE student_id=:id`, { id: student_id });
      const pct = summary?.total ? Math.round((summary.present / summary.total) * 10000) / 100 : 0;
      const monthly = await query(
        `SELECT DATE_FORMAT(date,'%Y-%m') month, COUNT(*) total, SUM(status='present') present
         FROM attendance WHERE student_id=:id GROUP BY month ORDER BY month`, { id: student_id });
      return { summary, percent: pct, monthly };
    }
    if (section_id) {
      const rows = await query(
        `SELECT st.id AS student_id, u.name, st.roll_number,
                COUNT(a.id) total, SUM(a.status='present') present,
                ROUND(100*SUM(a.status='present')/NULLIF(COUNT(a.id),0),2) percent
         FROM students st JOIN users u ON u.id=st.user_id
         LEFT JOIN attendance a ON a.student_id=st.id
         WHERE st.section_id=:sec AND st.is_active=1 GROUP BY st.id ORDER BY u.name`, { sec: section_id });
      return { students: rows };
    }
    return { students: [] };
  });

  // ---- TEACHER ATTENDANCE ----
  app.get("/teacher-attendance", { preHandler: app.authorize([...ADMINS, "hr_manager", "teacher"]) }, async (req) => {
    const { date } = req.query;
    return query(
      `SELECT t.id AS teacher_id, u.name, t.department, ta.id AS attendance_id, ta.status, ta.remarks
       FROM teachers t JOIN users u ON u.id=t.user_id
       LEFT JOIN teacher_attendance ta ON ta.teacher_id=t.id AND ta.date=:date
       WHERE t.school_id=:sid ORDER BY u.name`, { date: date || new Date().toISOString().slice(0, 10), sid: req.user.schoolId });
  });

  app.post("/teacher-attendance", { preHandler: app.authorize([...ADMINS, "hr_manager"]) }, async (req) => {
    const { date, records } = req.body || {};
    let marked = 0;
    for (const r of records || []) {
      const ex = await queryOne(`SELECT id FROM teacher_attendance WHERE teacher_id=:t AND date=:d`, { t: r.teacher_id, d: date });
      if (ex) await query(`UPDATE teacher_attendance SET status=:s, remarks=:rm, marked_by=:by WHERE id=:id`, { s: r.status, rm: r.remarks || null, by: req.user.id, id: ex.id });
      else await query(`INSERT INTO teacher_attendance (teacher_id,date,status,marked_by,remarks) VALUES (:t,:d,:s,:by,:rm)`,
        { t: r.teacher_id, d: date, s: r.status, by: req.user.id, rm: r.remarks || null });
      marked++;
    }
    return { success: true, marked };
  });
}

// Trigger low-attendance warning when a student dips below the threshold.
async function checkLowAttendance(studentId) {
  const s = await queryOne(`SELECT COUNT(*) total, SUM(status='present') present FROM attendance WHERE student_id=:id`, { id: studentId });
  if (!s?.total || s.total < 5) return;
  const pct = Math.round((s.present / s.total) * 10000) / 100;
  if (pct >= LOW_ATTENDANCE_THRESHOLD) return;
  const stu = await queryOne(`SELECT st.user_id, u.name FROM students st JOIN users u ON u.id=st.user_id WHERE st.id=:id`, { id: studentId });
  const parents = await query(`SELECT user_id FROM parents WHERE student_id=:id`, { id: studentId });
  await notifyLowAttendance({
    studentUserId: stu?.user_id, parentUserIds: parents.map((p) => p.user_id),
    studentName: stu?.name || "Student", percent: pct,
  });
}
