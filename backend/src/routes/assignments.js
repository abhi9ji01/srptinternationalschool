import { query, queryOne } from "../db.js";
import { notifyMany, notify } from "../utils/notify.js";
import { ADMINS } from "../config.js";

const TEACH = [...ADMINS, "teacher"];

export default async function assignmentRoutes(app) {
  app.get("/assignments", { preHandler: app.authorize([...TEACH, "student", "parent"]) }, async (req) => {
    const where = [], p = {};
    if (req.query.section_id) { where.push("a.section_id=:sec"); p.sec = req.query.section_id; }
    if (req.query.teacher_id) { where.push("a.teacher_id=:t"); p.t = req.query.teacher_id; }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT a.*, sub.name AS subject_name, sec.name AS section_name, u.name AS teacher_name,
              (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id=a.id) AS submission_count
       FROM assignments a LEFT JOIN subjects sub ON sub.id=a.subject_id
       LEFT JOIN sections sec ON sec.id=a.section_id
       LEFT JOIN teachers t ON t.id=a.teacher_id LEFT JOIN users u ON u.id=t.user_id
       ${w} ORDER BY a.due_date DESC, a.id DESC`, p);
  });

  app.post("/assignments", { preHandler: app.authorize(TEACH) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.title || !b.section_id) return reply.code(400).send({ error: "title and section_id required" });
    const r = await query(
      `INSERT INTO assignments (teacher_id, subject_id, section_id, title, description, file_url, due_date, total_marks)
       VALUES (:t,:sub,:sec,:title,:desc,:file,:due,:tm)`,
      { t: b.teacher_id || null, sub: b.subject_id || null, sec: b.section_id, title: b.title, desc: b.description || null,
        file: b.file_url || null, due: b.due_date || null, tm: b.total_marks || null });
    // notify students of the section
    const users = await query(`SELECT user_id FROM students WHERE section_id=:sec AND is_active=1`, { sec: b.section_id });
    await notifyMany(users.map((u) => u.user_id), { title: "New Assignment", message: b.title, type: "assignment", link: "/student/assignments" });
    return reply.code(201).send({ id: r.insertId });
  });

  app.delete("/assignments/:id", { preHandler: app.authorize(TEACH) }, async (req) => {
    await query(`DELETE FROM assignments WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // Submissions list (teacher view)
  app.get("/assignments/:id/submissions", { preHandler: app.authorize([...TEACH]) }, async (req) => {
    const a = await queryOne(`SELECT * FROM assignments WHERE id=:id`, { id: req.params.id });
    const rows = await query(
      `SELECT st.id AS student_id, u.name, st.roll_number,
              s.id AS submission_id, s.file_url, s.submitted_at, s.marks_obtained, s.feedback, s.status
       FROM students st JOIN users u ON u.id=st.user_id
       LEFT JOIN assignment_submissions s ON s.student_id=st.id AND s.assignment_id=:aid
       WHERE st.section_id=:sec AND st.is_active=1 ORDER BY u.name`,
      { aid: req.params.id, sec: a?.section_id || 0 });
    return { assignment: a, submissions: rows };
  });

  // Student submits
  app.post("/assignments/:id/submit", { preHandler: app.authorize(["student"]) }, async (req, reply) => {
    const b = req.body || {};
    const student = await queryOne(`SELECT id FROM students WHERE user_id=:uid`, { uid: req.user.id });
    if (!student) return reply.code(400).send({ error: "Not a student" });
    const a = await queryOne(`SELECT due_date FROM assignments WHERE id=:id`, { id: req.params.id });
    const late = a?.due_date && new Date() > new Date(a.due_date);
    await query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, file_url, submitted_at, status)
       VALUES (:aid,:sid,:file,NOW(),:status)
       ON DUPLICATE KEY UPDATE file_url=:file, submitted_at=NOW(), status=:status`,
      { aid: req.params.id, sid: student.id, file: b.file_url || null, status: late ? "late" : "submitted" });
    return { success: true, late };
  });

  // Teacher grades a submission
  app.post("/assignments/:id/grade", { preHandler: app.authorize(TEACH) }, async (req, reply) => {
    const b = req.body || {};
    const sub = await queryOne(`SELECT * FROM assignment_submissions WHERE id=:id`, { id: b.submission_id });
    if (!sub) return reply.code(404).send({ error: "Submission not found" });
    await query(`UPDATE assignment_submissions SET marks_obtained=:m, feedback=:f, status='graded' WHERE id=:id`,
      { m: b.marks_obtained, f: b.feedback || null, id: b.submission_id });
    const stu = await queryOne(`SELECT user_id FROM students WHERE id=:id`, { id: sub.student_id });
    if (stu) await notify({ userId: stu.user_id, title: "Assignment Graded", message: `You scored ${b.marks_obtained}.`, type: "assignment", link: "/student/assignments" });
    return { success: true };
  });
}
