import { query, queryOne } from "../db.js";
import { audit, reqMeta } from "../utils/audit.js";
import { ADMINS, STAFF_ROLES, gradeFromPercentage } from "../config.js";

const READ_ROLES = [...STAFF_ROLES, "student", "parent"];

export default async function reportCardRoutes(app) {
  // Full report-card dataset for a student + academic year.
  app.get("/report-cards/:studentId/:academicYearId", { preHandler: app.authorize(READ_ROLES) }, async (req, reply) => {
    const { studentId, academicYearId } = req.params;
    const student = await queryOne(
      `SELECT st.id, u.name, st.photo_url, u.profile_photo, st.roll_number, st.admission_number,
              st.dob, st.address, st.blood_group, sec.name AS section_name, c.name AS class_name, st.school_id
       FROM students st JOIN users u ON u.id=st.user_id
       LEFT JOIN sections sec ON sec.id=st.section_id LEFT JOIN classes c ON c.id=sec.class_id
       WHERE st.id=:id AND st.school_id=:sid`,
      { id: studentId, sid: req.user.schoolId });
    if (!student) return reply.code(404).send({ error: "Student not found" });

    const card = await queryOne(
      `SELECT * FROM report_cards WHERE student_id=:id AND (academic_year_id=:ay OR :ay=0) ORDER BY id DESC LIMIT 1`,
      { id: studentId, ay: Number(academicYearId) || 0 });

    // Students/parents may only view a published card.
    if (["student", "parent"].includes(req.user.role) && !(card && card.is_published)) {
      return reply.code(403).send({ error: "Report card is not yet published" });
    }

    const marks = await query(
      `SELECT sub.name AS subject_name, e.total_marks, em.marks_obtained, em.is_absent
       FROM exam_marks em JOIN exams e ON e.id=em.exam_id
       LEFT JOIN subjects sub ON sub.id=e.subject_id
       WHERE em.student_id=:id ORDER BY sub.name`, { id: studentId });

    // Aggregate per subject.
    const map = new Map();
    for (const m of marks) {
      const key = m.subject_name || "—";
      const cur = map.get(key) || { subject_name: key, total: 0, obtained: 0 };
      cur.total += Number(m.total_marks || 0);
      cur.obtained += Number(m.is_absent ? 0 : (m.marks_obtained || 0));
      map.set(key, cur);
    }
    const subjects = [...map.values()].map((s) => {
      const percentage = s.total ? Math.round((s.obtained / s.total) * 10000) / 100 : 0;
      return { ...s, percentage, grade: gradeFromPercentage(percentage) };
    });

    const totalMarks = subjects.reduce((a, s) => a + s.total, 0);
    const obtainedMarks = subjects.reduce((a, s) => a + s.obtained, 0);
    const percentage = totalMarks ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

    const att = await queryOne(`SELECT COUNT(*) total, SUM(status='present') present FROM attendance WHERE student_id=:id`, { id: studentId });
    const attendancePercent = att?.total ? Math.round((att.present / att.total) * 10000) / 100 : 0;

    const school = await queryOne(
      `SELECT name, logo_url, address, phone, email, principal_name, affiliation_board, primary_color, secondary_color
       FROM schools WHERE id=:id`, { id: req.user.schoolId });

    return {
      student,
      school,
      subjects,
      overall: {
        total_marks: totalMarks,
        obtained_marks: obtainedMarks,
        percentage,
        grade: gradeFromPercentage(percentage),
        rank: card?.rank ?? null,
        attendance_percent: card?.attendance_percent ?? attendancePercent,
        result: card?.result || "pass",
        class_teacher_remarks: card?.class_teacher_remarks || "",
        principal_remarks: card?.principal_remarks || "",
        template_style: card?.template_style || "style1",
        is_published: Boolean(card?.is_published),
      },
      report_card_id: card?.id || null,
    };
  });

  // Update remarks / result / template style / publish state.
  app.put("/report-cards/:id/remarks", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const card = await queryOne(`SELECT * FROM report_cards WHERE id=:id`, { id: req.params.id });
    if (!card) return reply.code(404).send({ error: "Report card not found. Publish/generate it first." });
    const b = req.body || {};
    const set = [], p = { id: req.params.id };
    if (b.class_teacher_remarks !== undefined) { set.push("class_teacher_remarks=:ct"); p.ct = b.class_teacher_remarks; }
    if (b.principal_remarks !== undefined) { set.push("principal_remarks=:pr"); p.pr = b.principal_remarks; }
    if (b.result !== undefined) { set.push("result=:res"); p.res = ["pass", "fail", "promoted", "detained"].includes(b.result) ? b.result : "pass"; }
    if (b.template_style !== undefined) { set.push("template_style=:ts"); p.ts = b.template_style === "style2" ? "style2" : "style1"; }
    if (b.is_published !== undefined) { set.push("is_published=:pub"); p.pub = b.is_published ? 1 : 0; }
    if (set.length) await query(`UPDATE report_cards SET ${set.join(", ")} WHERE id=:id`, p);
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "update", module: "report_cards", recordId: Number(req.params.id) });
    return { success: true };
  });
}
