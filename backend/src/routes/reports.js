import { query, queryOne } from "../db.js";
import { buildExcel } from "../utils/excel.js";
import { ADMINS, STAFF_ROLES } from "../config.js";

export default async function reportRoutes(app) {
  // ---- ADMIN DASHBOARD ----
  app.get("/reports/dashboard/admin", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const sid = req.user.schoolId;
    const stats = await queryOne(
      `SELECT (SELECT COUNT(*) FROM students WHERE school_id=:sid AND is_active=1) students,
              (SELECT COUNT(*) FROM teachers WHERE school_id=:sid) teachers,
              (SELECT COUNT(*) FROM users WHERE school_id=:sid AND role='parent') parents,
              (SELECT COUNT(*) FROM classes WHERE school_id=:sid) classes,
              (SELECT COALESCE(SUM(paid_amount),0) FROM fee_invoices fi JOIN students st ON st.id=fi.student_id WHERE st.school_id=:sid) fees_collected,
              (SELECT COALESCE(SUM(balance),0) FROM fee_invoices fi JOIN students st ON st.id=fi.student_id WHERE st.school_id=:sid AND fi.status!='paid') fees_pending`,
      { sid });
    const enrollment = await query(
      `SELECT DATE_FORMAT(admission_date,'%Y-%m') month, COUNT(*) count FROM students
       WHERE school_id=:sid AND admission_date IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 12`, { sid });
    const feeByMonth = await query(
      `SELECT DATE_FORMAT(fp.payment_date,'%Y-%m') month, SUM(fp.amount) total FROM fee_payments fp
       JOIN students st ON st.id=fp.student_id WHERE st.school_id=:sid GROUP BY month ORDER BY month DESC LIMIT 12`, { sid });
    const attendanceByDay = await query(
      `SELECT a.date, ROUND(100*SUM(a.status='present')/COUNT(*),1) percent FROM attendance a
       JOIN students st ON st.id=a.student_id WHERE st.school_id=:sid AND a.date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       GROUP BY a.date ORDER BY a.date`, { sid });
    const subjectPerformance = await query(
      `SELECT sub.name AS subject, ROUND(AVG(100*em.marks_obtained/e.total_marks),1) avg_pct
       FROM exam_marks em JOIN exams e ON e.id=em.exam_id JOIN subjects sub ON sub.id=e.subject_id
       JOIN sections sec ON sec.id=e.section_id JOIN classes c ON c.id=sec.class_id
       WHERE c.school_id=:sid AND em.is_absent=0 GROUP BY sub.name ORDER BY avg_pct DESC LIMIT 8`, { sid });
    return { stats, enrollment: enrollment.reverse(), feeByMonth: feeByMonth.reverse(), attendanceByDay, subjectPerformance };
  });

  // ---- TEACHER DASHBOARD ----
  app.get("/reports/dashboard/teacher", { preHandler: app.authorize(["teacher", ...ADMINS]) }, async (req) => {
    const teacher = await queryOne(`SELECT id FROM teachers WHERE user_id=:uid`, { uid: req.user.id });
    const tid = teacher?.id || 0;
    const today = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
    const periods = await query(
      `SELECT p.*, sub.name AS subject_name, sec.name AS section_name, c.name AS class_name
       FROM periods p LEFT JOIN subjects sub ON sub.id=p.subject_id LEFT JOIN sections sec ON sec.id=p.section_id
       LEFT JOIN classes c ON c.id=sec.class_id WHERE p.teacher_id=:t AND p.day_of_week=:d ORDER BY p.period_number`, { t: tid, d: today });
    const stats = await queryOne(
      `SELECT (SELECT COUNT(DISTINCT section_id) FROM teacher_assignments WHERE teacher_id=:t) sections,
              (SELECT COUNT(*) FROM assignments WHERE teacher_id=:t) assignments,
              (SELECT COUNT(*) FROM exams WHERE teacher_id=:t) exams`, { t: tid });
    const classAvg = await query(
      `SELECT e.name AS exam, ROUND(AVG(100*em.marks_obtained/e.total_marks),1) avg_pct
       FROM exams e JOIN exam_marks em ON em.exam_id=e.id WHERE e.teacher_id=:t AND em.is_absent=0 GROUP BY e.id ORDER BY e.exam_date DESC LIMIT 8`, { t: tid });
    return { periods, stats, classAvg: classAvg.reverse(), teacherId: tid };
  });

  // ---- STUDENT DASHBOARD ----
  app.get("/reports/dashboard/student", { preHandler: app.authorize(["student"]) }, async (req) => {
    const student = await queryOne(`SELECT * FROM students WHERE user_id=:uid`, { uid: req.user.id });
    const sid = student?.id || 0;
    const today = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
    const periods = await query(
      `SELECT p.*, sub.name AS subject_name, u.name AS teacher_name FROM periods p
       LEFT JOIN subjects sub ON sub.id=p.subject_id LEFT JOIN teachers t ON t.id=p.teacher_id LEFT JOIN users u ON u.id=t.user_id
       WHERE p.section_id=:sec AND p.day_of_week=:d ORDER BY p.period_number`, { sec: student?.section_id || 0, d: today });
    const att = await queryOne(`SELECT COUNT(*) total, SUM(status='present') present FROM attendance WHERE student_id=:id`, { id: sid });
    const marksTrend = await query(
      `SELECT e.name AS exam, ROUND(100*em.marks_obtained/e.total_marks,1) pct FROM exam_marks em
       JOIN exams e ON e.id=em.exam_id WHERE em.student_id=:id AND em.is_absent=0 ORDER BY e.exam_date LIMIT 10`, { id: sid });
    return {
      student, periods, marksTrend,
      attendancePercent: att?.total ? Math.round((att.present / att.total) * 1000) / 10 : 0,
      studentId: sid,
    };
  });

  // ---- PARENT DASHBOARD ----
  app.get("/reports/dashboard/parent", { preHandler: app.authorize(["parent"]) }, async (req) => {
    const children = await query(
      `SELECT st.id, u.name, sec.name AS section_name, c.name AS class_name,
              (SELECT ROUND(100*SUM(status='present')/NULLIF(COUNT(*),0),1) FROM attendance WHERE student_id=st.id) attendance_pct,
              (SELECT COALESCE(SUM(balance),0) FROM fee_invoices WHERE student_id=st.id AND status!='paid') fee_due
       FROM parents p JOIN students st ON st.id=p.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN sections sec ON sec.id=st.section_id LEFT JOIN classes c ON c.id=sec.class_id
       WHERE p.user_id=:uid`, { uid: req.user.id });
    return { children };
  });

  // ---- ACCOUNTANT DASHBOARD ----
  app.get("/reports/dashboard/accountant", { preHandler: app.authorize([...ADMINS, "accountant"]) }, async (req) => {
    const sid = req.user.schoolId;
    const stats = await queryOne(
      `SELECT (SELECT COALESCE(SUM(paid_amount),0) FROM fee_invoices fi JOIN students st ON st.id=fi.student_id WHERE st.school_id=:sid) collected,
              (SELECT COALESCE(SUM(balance),0) FROM fee_invoices fi JOIN students st ON st.id=fi.student_id WHERE st.school_id=:sid AND fi.status IN ('pending','partial')) pending,
              (SELECT COALESCE(SUM(balance),0) FROM fee_invoices fi JOIN students st ON st.id=fi.student_id WHERE st.school_id=:sid AND fi.status='overdue') overdue,
              (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE school_id=:sid) expenses`, { sid });
    const collectionVsExpense = await query(
      `SELECT m.month,
        (SELECT COALESCE(SUM(fp.amount),0) FROM fee_payments fp JOIN students st ON st.id=fp.student_id WHERE st.school_id=:sid AND DATE_FORMAT(fp.payment_date,'%Y-%m')=m.month) collection,
        (SELECT COALESCE(SUM(e.amount),0) FROM expenses e WHERE e.school_id=:sid AND DATE_FORMAT(e.expense_date,'%Y-%m')=m.month) expense
       FROM (SELECT DISTINCT DATE_FORMAT(payment_date,'%Y-%m') month FROM fee_payments ORDER BY month DESC LIMIT 6) m ORDER BY m.month`, { sid });
    const paymentModes = await query(
      `SELECT fp.payment_mode mode, COUNT(*) count, SUM(fp.amount) total FROM fee_payments fp
       JOIN students st ON st.id=fp.student_id WHERE st.school_id=:sid GROUP BY fp.payment_mode`, { sid });
    return { stats, collectionVsExpense, paymentModes };
  });

  // ---- HR DASHBOARD ----
  app.get("/reports/dashboard/hr", { preHandler: app.authorize([...ADMINS, "hr_manager"]) }, async (req) => {
    const sid = req.user.schoolId;
    const stats = await queryOne(
      `SELECT (SELECT COUNT(*) FROM staff WHERE school_id=:sid) staff,
              (SELECT COUNT(*) FROM leave_applications la JOIN staff s ON s.id=la.staff_id WHERE s.school_id=:sid AND la.status='pending') pending_leaves,
              (SELECT COUNT(*) FROM payroll pr JOIN staff s ON s.id=pr.staff_id WHERE s.school_id=:sid AND pr.status='pending') pending_payroll`, { sid });
    const byDept = await query(`SELECT department, COUNT(*) count FROM staff WHERE school_id=:sid GROUP BY department`, { sid });
    const leaveDist = await query(
      `SELECT lt.name, COUNT(*) count FROM leave_applications la JOIN leave_types lt ON lt.id=la.leave_type_id
       JOIN staff s ON s.id=la.staff_id WHERE s.school_id=:sid GROUP BY lt.name`, { sid });
    return { stats, byDept, leaveDist };
  });

  // ---- DETAILED REPORTS ----
  app.get("/reports/attendance", { preHandler: app.authorize(STAFF_ROLES) }, async (req) => {
    const sid = req.user.schoolId;
    const bySection = await query(
      `SELECT c.name AS class_name, sec.name AS section_name,
              ROUND(100*SUM(a.status='present')/NULLIF(COUNT(a.id),0),1) percent, COUNT(DISTINCT a.student_id) students
       FROM attendance a JOIN students st ON st.id=a.student_id JOIN sections sec ON sec.id=st.section_id JOIN classes c ON c.id=sec.class_id
       WHERE st.school_id=:sid GROUP BY sec.id ORDER BY c.name, sec.name`, { sid });
    const lowAttendance = await query(
      `SELECT u.name, c.name AS class_name, sec.name AS section_name,
              ROUND(100*SUM(a.status='present')/NULLIF(COUNT(a.id),0),1) percent
       FROM attendance a JOIN students st ON st.id=a.student_id JOIN users u ON u.id=st.user_id
       JOIN sections sec ON sec.id=st.section_id JOIN classes c ON c.id=sec.class_id
       WHERE st.school_id=:sid GROUP BY st.id HAVING percent < 75 ORDER BY percent LIMIT 50`, { sid });
    return { bySection, lowAttendance };
  });

  app.get("/reports/performance", { preHandler: app.authorize(STAFF_ROLES) }, async (req) => {
    const sid = req.user.schoolId;
    const bySubject = await query(
      `SELECT sub.name AS subject, ROUND(AVG(100*em.marks_obtained/e.total_marks),1) avg_pct,
              SUM(em.marks_obtained >= e.passing_marks) pass_count, COUNT(*) total
       FROM exam_marks em JOIN exams e ON e.id=em.exam_id JOIN subjects sub ON sub.id=e.subject_id
       JOIN sections sec ON sec.id=e.section_id JOIN classes c ON c.id=sec.class_id
       WHERE c.school_id=:sid AND em.is_absent=0 GROUP BY sub.name`, { sid });
    const topStudents = await query(
      `SELECT u.name, ROUND(AVG(100*em.marks_obtained/e.total_marks),1) avg_pct FROM exam_marks em
       JOIN exams e ON e.id=em.exam_id JOIN students st ON st.id=em.student_id JOIN users u ON u.id=st.user_id
       WHERE st.school_id=:sid AND em.is_absent=0 GROUP BY st.id ORDER BY avg_pct DESC LIMIT 10`, { sid });
    return { bySubject, topStudents };
  });

  app.get("/reports/finance", { preHandler: app.authorize([...ADMINS, "accountant"]) }, async (req) => {
    const sid = req.user.schoolId;
    const summary = await queryOne(
      `SELECT (SELECT COALESCE(SUM(paid_amount),0) FROM fee_invoices fi JOIN students st ON st.id=fi.student_id WHERE st.school_id=:sid) total_collected,
              (SELECT COALESCE(SUM(balance),0) FROM fee_invoices fi JOIN students st ON st.id=fi.student_id WHERE st.school_id=:sid AND fi.status!='paid') total_pending,
              (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE school_id=:sid) total_expense`, { sid });
    const expensesByCategory = await query(`SELECT category, SUM(amount) total FROM expenses WHERE school_id=:sid GROUP BY category`, { sid });
    return { summary, expensesByCategory };
  });

  // Excel export of finance
  app.get("/reports/finance/export", { preHandler: app.authorize([...ADMINS, "accountant"]) }, async (req, reply) => {
    const rows = await query(
      `SELECT fp.receipt_number, u.name AS student, fp.amount, fp.payment_mode, fp.payment_date, fp.is_online
       FROM fee_payments fp JOIN students st ON st.id=fp.student_id JOIN users u ON u.id=st.user_id
       WHERE st.school_id=:sid ORDER BY fp.payment_date DESC`, { sid: req.user.schoolId });
    const buf = buildExcel(rows, "Payments");
    reply.header("Content-Disposition", "attachment; filename=finance_report.xlsx");
    reply.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return reply.send(buf);
  });
}
