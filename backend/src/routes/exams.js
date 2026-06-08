import { query, queryOne } from "../db.js";
import { gradeFromPercentage, ADMINS, STAFF_ROLES } from "../config.js";
import { parseExcel, buildTemplate, MARKS_IMPORT_HEADERS } from "../utils/excel.js";
import { notifyMany } from "../utils/notify.js";

const TEACH = [...ADMINS, "teacher"];

async function gradeConfig(schoolId) {
  const rows = await query(`SELECT grade_name, min_percentage, max_percentage FROM grade_config WHERE school_id=:sid ORDER BY min_percentage DESC`, { sid: schoolId });
  return rows.length ? rows : undefined;
}

export default async function examRoutes(app) {
  // LIST exams (optionally by section/subject)
  app.get("/exams", { preHandler: app.authorize([...TEACH, "student", "parent"]) }, async (req) => {
    const where = [], p = {};
    if (req.query.section_id) { where.push("e.section_id=:sec"); p.sec = req.query.section_id; }
    if (req.query.subject_id) { where.push("e.subject_id=:sub"); p.sub = req.query.subject_id; }
    if (req.query.teacher_id) { where.push("e.teacher_id=:t"); p.t = req.query.teacher_id; }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT e.*, sub.name AS subject_name, sec.name AS section_name, c.name AS class_name
       FROM exams e LEFT JOIN subjects sub ON sub.id=e.subject_id
       LEFT JOIN sections sec ON sec.id=e.section_id LEFT JOIN classes c ON c.id=sec.class_id
       ${w} ORDER BY e.exam_date DESC, e.id DESC`, p);
  });

  app.post("/exams", { preHandler: app.authorize(TEACH) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.name || !b.section_id) return reply.code(400).send({ error: "name and section_id required" });
    const r = await query(
      `INSERT INTO exams (name,type,section_id,subject_id,teacher_id,total_marks,passing_marks,exam_date,academic_year_id)
       VALUES (:name,:type,:sec,:sub,:t,:tm,:pm,:date,:ay)`,
      { name: b.name, type: b.type || "unit_test", sec: b.section_id, sub: b.subject_id || null, t: b.teacher_id || null,
        tm: b.total_marks || 100, pm: b.passing_marks || 35, date: b.exam_date || null, ay: b.academic_year_id || null });
    return reply.code(201).send({ id: r.insertId, success: true });
  });

  app.put("/exams/:id", { preHandler: app.authorize(TEACH) }, async (req) => {
    const b = req.body || {};
    const f = ["name", "type", "subject_id", "total_marks", "passing_marks", "exam_date"];
    const set = [], p = { id: req.params.id };
    f.forEach((k) => { if (b[k] !== undefined) { set.push(`${k}=:${k}`); p[k] = b[k]; } });
    if (set.length) await query(`UPDATE exams SET ${set.join(", ")} WHERE id=:id`, p);
    return { success: true };
  });

  app.delete("/exams/:id", { preHandler: app.authorize(TEACH) }, async (req) => {
    await query(`DELETE FROM exams WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // Marks roster for an exam (all section students + existing marks)
  app.get("/exams/:id/marks", { preHandler: app.authorize([...TEACH, "student", "parent"]) }, async (req, reply) => {
    const exam = await queryOne(`SELECT * FROM exams WHERE id=:id`, { id: req.params.id });
    if (!exam) return reply.code(404).send({ error: "Exam not found" });
    const rows = await query(
      `SELECT st.id AS student_id, u.name, st.roll_number,
              em.id AS mark_id, em.marks_obtained, em.grade, em.is_absent, em.remarks
       FROM students st JOIN users u ON u.id=st.user_id
       LEFT JOIN exam_marks em ON em.student_id=st.id AND em.exam_id=:eid
       WHERE st.section_id=:sec AND st.is_active=1 ORDER BY st.roll_number+0, u.name`,
      { eid: req.params.id, sec: exam.section_id });
    return { exam, students: rows };
  });

  // Save marks (auto-grade + validate against total + notify)
  app.post("/exams/:id/marks", { preHandler: app.authorize(TEACH) }, async (req, reply) => {
    const exam = await queryOne(`SELECT * FROM exams WHERE id=:id`, { id: req.params.id });
    if (!exam) return reply.code(404).send({ error: "Exam not found" });
    const gc = await gradeConfig(req.user.schoolId);
    const { marks } = req.body || {};
    let saved = 0; const errors = [];
    for (const m of marks || []) {
      const isAbsent = !!m.is_absent;
      let obtained = isAbsent ? null : Number(m.marks_obtained);
      if (!isAbsent) {
        if (isNaN(obtained)) continue;
        if (obtained > Number(exam.total_marks)) { errors.push({ student_id: m.student_id, error: "Exceeds total marks" }); continue; }
        if (obtained < 0) obtained = 0;
      }
      const pct = isAbsent ? 0 : (obtained / Number(exam.total_marks)) * 100;
      const grade = isAbsent ? "AB" : gradeFromPercentage(pct, gc);
      await query(
        `INSERT INTO exam_marks (exam_id, student_id, marks_obtained, grade, remarks, is_absent)
         VALUES (:eid,:sid,:mo,:grade,:rm,:ab)
         ON DUPLICATE KEY UPDATE marks_obtained=:mo, grade=:grade, remarks=:rm, is_absent=:ab`,
        { eid: req.params.id, sid: m.student_id, mo: obtained, grade, rm: m.remarks || null, ab: isAbsent ? 1 : 0 });
      saved++;
    }
    // notify students marks are published
    const userIds = await query(
      `SELECT st.user_id FROM exam_marks em JOIN students st ON st.id=em.student_id WHERE em.exam_id=:eid`, { eid: req.params.id });
    await notifyMany(userIds.map((r) => r.user_id), { title: "Marks Published", message: `Marks for "${exam.name}" are now available.`, type: "exam", link: "/student/marks" });
    return { success: true, saved, errors };
  });

  // Marks import template
  app.get("/exams/marks/template", { preHandler: app.authorize(TEACH) }, async (req, reply) => {
    const buf = buildTemplate(MARKS_IMPORT_HEADERS, "Marks");
    reply.header("Content-Disposition", "attachment; filename=marks_template.xlsx");
    reply.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return reply.send(buf);
  });

  // Marks import via Excel
  app.post("/exams/:id/marks/import", { preHandler: app.authorize(TEACH) }, async (req, reply) => {
    const exam = await queryOne(`SELECT * FROM exams WHERE id=:id`, { id: req.params.id });
    if (!exam) return reply.code(404).send({ error: "Exam not found" });
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No file uploaded" });
    const rows = parseExcel(await data.toBuffer());
    const gc = await gradeConfig(req.user.schoolId);
    let saved = 0; const errors = [];
    for (const [i, r] of rows.entries()) {
      const stu = await queryOne(`SELECT id FROM students WHERE admission_number=:adm AND school_id=:sid`, { adm: r.admission_number, sid: req.user.schoolId });
      if (!stu) { errors.push({ row: i + 2, error: "Student not found: " + r.admission_number }); continue; }
      const isAbsent = String(r.is_absent).toLowerCase() === "yes" || r.is_absent === 1 || r.is_absent === true;
      const obtained = isAbsent ? null : Number(r.marks_obtained);
      if (!isAbsent && (isNaN(obtained) || obtained > Number(exam.total_marks))) { errors.push({ row: i + 2, error: "Invalid marks" }); continue; }
      const pct = isAbsent ? 0 : (obtained / Number(exam.total_marks)) * 100;
      await query(
        `INSERT INTO exam_marks (exam_id,student_id,marks_obtained,grade,is_absent) VALUES (:e,:s,:m,:g,:a)
         ON DUPLICATE KEY UPDATE marks_obtained=:m, grade=:g, is_absent=:a`,
        { e: req.params.id, s: stu.id, m: obtained, g: isAbsent ? "AB" : gradeFromPercentage(pct, gc), a: isAbsent ? 1 : 0 });
      saved++;
    }
    return { saved, failed: errors.length, errors };
  });

  // ---- EXAM SCHEDULE ----
  app.get("/exams/schedule", { preHandler: app.authorize([...TEACH, "student", "parent"]) }, async (req) => {
    const where = [], p = {};
    if (req.query.section_id) { where.push("es.section_id=:sec"); p.sec = req.query.section_id; }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT es.*, sub.name AS subject_name, sec.name AS section_name, u.name AS invigilator_name
       FROM exam_schedule es LEFT JOIN subjects sub ON sub.id=es.subject_id
       LEFT JOIN sections sec ON sec.id=es.section_id LEFT JOIN users u ON u.id=es.invigilator_id
       ${w} ORDER BY es.exam_date, es.start_time`, p);
  });

  app.post("/exams/schedule", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO exam_schedule (academic_year_id,exam_type,subject_id,section_id,exam_date,start_time,end_time,room_number,invigilator_id)
       VALUES (:ay,:type,:sub,:sec,:date,:st,:et,:room,:inv)`,
      { ay: b.academic_year_id || null, type: b.exam_type || "final", sub: b.subject_id || null, sec: b.section_id || null,
        date: b.exam_date || null, st: b.start_time || null, et: b.end_time || null, room: b.room_number || null, inv: b.invigilator_id || null });
    return reply.code(201).send({ id: r.insertId });
  });

  app.delete("/exams/schedule/:id", { preHandler: app.authorize(ADMINS) }, async (req) => {
    await query(`DELETE FROM exam_schedule WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // Hall ticket data for a student
  app.get("/exams/hall-tickets/:studentId", { preHandler: app.authorize([...TEACH, "student", "parent"]) }, async (req) => {
    const student = await queryOne(
      `SELECT st.id, st.admission_number, st.roll_number, u.name, sec.name AS section_name, c.name AS class_name, sch.name AS school_name
       FROM students st JOIN users u ON u.id=st.user_id
       LEFT JOIN sections sec ON sec.id=st.section_id LEFT JOIN classes c ON c.id=sec.class_id
       LEFT JOIN schools sch ON sch.id=st.school_id WHERE st.id=:id`, { id: req.params.studentId });
    const schedule = await query(
      `SELECT es.*, sub.name AS subject_name FROM exam_schedule es LEFT JOIN subjects sub ON sub.id=es.subject_id
       WHERE es.section_id=:sec ORDER BY es.exam_date, es.start_time`, { sec: student?.section_id || 0 });
    return { student, schedule };
  });
}
