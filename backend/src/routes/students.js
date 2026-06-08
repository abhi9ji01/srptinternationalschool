import { query, queryOne, transaction } from "../db.js";
import { hashPassword } from "../utils/password.js";
import { audit, reqMeta } from "../utils/audit.js";
import { generateQrToken, qrDataUrl } from "../utils/qr.js";
import { parseExcel, buildExcel, buildTemplate, STUDENT_IMPORT_HEADERS } from "../utils/excel.js";
import { notify } from "../utils/notify.js";
import { ADMINS, STAFF_ROLES } from "../config.js";

const STUDENT_READ = [...ADMINS, "teacher", "accountant", "librarian", "hostel_warden", "transport_manager", "health_officer"];

export default async function studentRoutes(app) {
  // LIST students with user + section + class
  app.get("/students", { preHandler: app.authorize(STUDENT_READ) }, async (req) => {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, parseInt(req.query.limit || "50", 10));
    const offset = (page - 1) * limit;
    const where = ["st.school_id = :sid"];
    const params = { sid: req.user.schoolId };
    if (req.query.section_id) { where.push("st.section_id = :sec"); params.sec = req.query.section_id; }
    if (req.query.search) {
      where.push("(u.name LIKE :q OR st.admission_number LIKE :q OR st.roll_number LIKE :q)");
      params.q = `%${req.query.search}%`;
    }
    const w = `WHERE ${where.join(" AND ")}`;
    const rows = await query(
      `SELECT st.*, u.name, u.email, u.phone, u.is_active AS user_active, u.profile_photo,
              sec.name AS section_name, c.name AS class_name
       FROM students st JOIN users u ON u.id = st.user_id
       LEFT JOIN sections sec ON sec.id = st.section_id
       LEFT JOIN classes c ON c.id = sec.class_id
       ${w} ORDER BY u.name LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const total = await queryOne(`SELECT COUNT(*) AS total FROM students st JOIN users u ON u.id=st.user_id ${w}`, params);
    return { data: rows, page, limit, total: total?.total || 0 };
  });

  // GET one full profile
  app.get("/students/:id", { preHandler: app.authorize([...STUDENT_READ, "student", "parent"]) }, async (req, reply) => {
    const s = await queryOne(
      `SELECT st.*, u.name, u.email, u.phone, u.profile_photo, sec.name AS section_name, c.name AS class_name
       FROM students st JOIN users u ON u.id = st.user_id
       LEFT JOIN sections sec ON sec.id = st.section_id
       LEFT JOIN classes c ON c.id = sec.class_id WHERE st.id = :id`,
      { id: req.params.id }
    );
    if (!s) return reply.code(404).send({ error: "Not found" });
    const parents = await query(`SELECT p.*, u.name, u.email, u.phone FROM parents p JOIN users u ON u.id=p.user_id WHERE p.student_id=:id`, { id: req.params.id });
    return { ...s, parents };
  });

  // CREATE student (+ user, + optional parent)
  app.post("/students", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.name || !b.email) return reply.code(400).send({ error: "name and email required" });
    try {
      const id = await transaction(async (conn) => {
        const pwd = await hashPassword(b.password || "student123");
        const [u] = await conn.execute(
          `INSERT INTO users (school_id, name, email, phone, password_hash, role) VALUES (?,?,?,?,?,'student')`,
          [req.user.schoolId, b.name, b.email.toLowerCase(), b.phone || null, pwd]
        );
        const userId = u.insertId;
        const [s] = await conn.execute(
          `INSERT INTO students (user_id, admission_number, section_id, roll_number, dob, gender, blood_group, address,
             father_name, mother_name, guardian_phone, admission_date, academic_year_id, school_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [userId, b.admission_number || null, b.section_id || null, b.roll_number || null, b.dob || null, b.gender || null,
           b.blood_group || null, b.address || null, b.father_name || null, b.mother_name || null, b.guardian_phone || null,
           b.admission_date || null, b.academic_year_id || null, req.user.schoolId]
        );
        const studentId = s.insertId;
        // qr token
        await conn.execute(`INSERT INTO student_qr_codes (student_id, qr_token) VALUES (?,?)`, [studentId, generateQrToken(studentId)]);
        // optional parent
        if (b.parent_name && b.parent_email) {
          const ppwd = await hashPassword(b.parent_password || "parent123");
          const [pu] = await conn.execute(
            `INSERT INTO users (school_id, name, email, phone, password_hash, role) VALUES (?,?,?,?,?,'parent')`,
            [req.user.schoolId, b.parent_name, b.parent_email.toLowerCase(), b.guardian_phone || null, ppwd]
          );
          await conn.execute(`INSERT INTO parents (user_id, student_id, relation, address) VALUES (?,?,?,?)`,
            [pu.insertId, studentId, b.parent_relation || "Guardian", b.address || null]);
        }
        return studentId;
      });
      await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "create", module: "students", recordId: id, newValue: { name: b.name } });
      const created = await queryOne(`SELECT * FROM students WHERE id=:id`, { id });
      return reply.code(201).send(created);
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") return reply.code(409).send({ error: "Email or admission number already exists" });
      throw e;
    }
  });

  // UPDATE student (+ user fields)
  app.put("/students/:id", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const s = await queryOne(`SELECT * FROM students WHERE id=:id`, { id: req.params.id });
    if (!s) return reply.code(404).send({ error: "Not found" });
    const b = req.body || {};
    const sf = ["admission_number", "section_id", "roll_number", "dob", "gender", "blood_group", "address",
      "father_name", "mother_name", "guardian_phone", "admission_date", "academic_year_id", "is_active"];
    const set = [], params = { id: req.params.id };
    sf.forEach((f) => { if (b[f] !== undefined) { set.push(`${f}=:${f}`); params[f] = b[f] === "" ? null : b[f]; } });
    if (set.length) await query(`UPDATE students SET ${set.join(", ")} WHERE id=:id`, params);
    // user fields
    const uf = [], up = { uid: s.user_id };
    ["name", "phone", "profile_photo"].forEach((f) => { if (b[f] !== undefined) { uf.push(`${f}=:${f}`); up[f] = b[f]; } });
    if (b.is_active !== undefined) { uf.push("is_active=:is_active"); up.is_active = b.is_active; }
    if (uf.length) await query(`UPDATE users SET ${uf.join(", ")} WHERE id=:uid`, up);
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "update", module: "students", recordId: Number(req.params.id), oldValue: s, newValue: b });
    return queryOne(`SELECT * FROM students WHERE id=:id`, { id: req.params.id });
  });

  // DEACTIVATE (soft delete)
  app.delete("/students/:id", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const s = await queryOne(`SELECT user_id FROM students WHERE id=:id`, { id: req.params.id });
    if (s) {
      await query(`UPDATE students SET is_active=0 WHERE id=:id`, { id: req.params.id });
      await query(`UPDATE users SET is_active=0 WHERE id=:uid`, { uid: s.user_id });
    }
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "deactivate", module: "students", recordId: Number(req.params.id) });
    return { success: true };
  });

  // REPORT CARD (aggregate marks per subject + attendance)
  app.get("/students/:id/report-card", { preHandler: app.authorize([...STUDENT_READ, "student", "parent"]) }, async (req) => {
    const id = req.params.id;
    const student = await queryOne(
      `SELECT st.*, u.name, sec.name AS section_name, c.name AS class_name
       FROM students st JOIN users u ON u.id=st.user_id
       LEFT JOIN sections sec ON sec.id=st.section_id LEFT JOIN classes c ON c.id=sec.class_id WHERE st.id=:id`, { id });
    const marks = await query(
      `SELECT e.id AS exam_id, e.name AS exam_name, e.type, e.total_marks, e.passing_marks,
              sub.name AS subject_name, em.marks_obtained, em.grade, em.is_absent
       FROM exam_marks em JOIN exams e ON e.id=em.exam_id
       LEFT JOIN subjects sub ON sub.id=e.subject_id
       WHERE em.student_id=:id ORDER BY sub.name, e.exam_date`, { id });
    const att = await queryOne(
      `SELECT COUNT(*) total, SUM(status='present') present FROM attendance WHERE student_id=:id`, { id });
    const attendancePercent = att?.total ? Math.round((att.present / att.total) * 10000) / 100 : 0;
    const totalMarks = marks.reduce((a, m) => a + Number(m.total_marks || 0), 0);
    const obtained = marks.reduce((a, m) => a + Number(m.marks_obtained || 0), 0);
    const percentage = totalMarks ? Math.round((obtained / totalMarks) * 10000) / 100 : 0;
    const card = await queryOne(`SELECT * FROM report_cards WHERE student_id=:id ORDER BY id DESC LIMIT 1`, { id });
    return { student, marks, attendancePercent, totalMarks, obtained, percentage, published: card?.is_published || false, card };
  });

  // PUBLISH report card
  app.post("/students/:id/report-card/publish", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const id = req.params.id;
    const b = req.body || {};
    await query(
      `INSERT INTO report_cards (student_id, academic_year_id, section_id, total_marks, obtained_marks, percentage, grade, \`rank\`, attendance_percent, is_published)
       VALUES (:sid,:ay,:sec,:tm,:om,:pct,:grade,:rank,:att,1)`,
      { sid: id, ay: b.academic_year_id || null, sec: b.section_id || null, tm: b.total_marks || 0, om: b.obtained_marks || 0,
        pct: b.percentage || 0, grade: b.grade || null, rank: b.rank || null, att: b.attendance_percent || 0 });
    const stu = await queryOne(`SELECT user_id, (SELECT name FROM users WHERE id=user_id) name FROM students WHERE id=:id`, { id });
    if (stu) await notify({ userId: stu.user_id, title: "Report Card Published", message: "Your report card is now available.", type: "exam", link: "/student/report-card" });
    return { success: true };
  });

  // QR CODE (data URL)
  app.get("/students/:id/qr-code", { preHandler: app.authorize([...STUDENT_READ, "student", "parent"]) }, async (req) => {
    let row = await queryOne(`SELECT qr_token FROM student_qr_codes WHERE student_id=:id AND is_active=1 ORDER BY id DESC LIMIT 1`, { id: req.params.id });
    if (!row) {
      const token = generateQrToken(req.params.id);
      await query(`INSERT INTO student_qr_codes (student_id, qr_token) VALUES (:id,:t)`, { id: req.params.id, t: token });
      row = { qr_token: token };
    }
    return { token: row.qr_token, dataUrl: await qrDataUrl(row.qr_token) };
  });

  // BULK PROMOTION
  app.post("/students/promote/bulk", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const { promotions, academic_year_id } = req.body || {};
    let promoted = 0, detained = 0;
    for (const p of promotions || []) {
      await query(
        `INSERT INTO promotions (student_id, from_section_id, to_section_id, academic_year_id, status, promoted_by, remarks)
         VALUES (:sid,:from,:to,:ay,:status,:by,:remarks)`,
        { sid: p.student_id, from: p.from_section_id || null, to: p.to_section_id || null, ay: academic_year_id || null,
          status: p.status || "promoted", by: req.user.id, remarks: p.remarks || null });
      if (p.status === "promoted" && p.to_section_id) {
        await query(`UPDATE students SET section_id=:sec WHERE id=:sid`, { sec: p.to_section_id, sid: p.student_id });
        promoted++;
      } else detained++;
    }
    return { success: true, promoted, detained };
  });

  // IMPORT TEMPLATE download
  app.get("/students/import/template", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const buf = buildTemplate(STUDENT_IMPORT_HEADERS, "Students");
    reply.header("Content-Disposition", "attachment; filename=students_template.xlsx");
    reply.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return reply.send(buf);
  });

  // IMPORT via Excel (multipart)
  app.post("/students/import/excel", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No file uploaded" });
    const buf = await data.toBuffer();
    const rows = parseExcel(buf);
    const sectionId = data.fields?.section_id?.value || null;
    let created = 0; const errors = [];
    for (const [i, r] of rows.entries()) {
      try {
        if (!r.name || !r.email) { errors.push({ row: i + 2, error: "Missing name/email" }); continue; }
        await transaction(async (conn) => {
          const pwd = await hashPassword("student123");
          const [u] = await conn.execute(`INSERT INTO users (school_id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,'student')`,
            [req.user.schoolId, r.name, String(r.email).toLowerCase(), r.phone || null, pwd]);
          const [s] = await conn.execute(
            `INSERT INTO students (user_id,admission_number,section_id,roll_number,dob,gender,blood_group,father_name,mother_name,guardian_phone,address,school_id,admission_date)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURDATE())`,
            [u.insertId, r.admission_number || null, sectionId, r.roll_number || null, r.dob || null, r.gender || null,
             r.blood_group || null, r.father_name || null, r.mother_name || null, r.guardian_phone || null, r.address || null, req.user.schoolId]);
          await conn.execute(`INSERT INTO student_qr_codes (student_id,qr_token) VALUES (?,?)`, [s.insertId, generateQrToken(s.insertId)]);
        });
        created++;
      } catch (e) {
        errors.push({ row: i + 2, error: e.code === "ER_DUP_ENTRY" ? "Duplicate email/admission no." : e.message });
      }
    }
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "import", module: "students", newValue: { created, failed: errors.length } });
    return { created, failed: errors.length, errors };
  });

  // EXPORT students to Excel
  app.get("/students/export/excel", { preHandler: app.authorize(STUDENT_READ) }, async (req, reply) => {
    const rows = await query(
      `SELECT u.name, u.email, u.phone, st.admission_number, st.roll_number, st.gender, st.dob,
              c.name AS class, sec.name AS section, st.father_name, st.mother_name, st.guardian_phone
       FROM students st JOIN users u ON u.id=st.user_id
       LEFT JOIN sections sec ON sec.id=st.section_id LEFT JOIN classes c ON c.id=sec.class_id
       WHERE st.school_id=:sid ORDER BY u.name`, { sid: req.user.schoolId });
    const buf = buildExcel(rows, "Students");
    reply.header("Content-Disposition", "attachment; filename=students.xlsx");
    reply.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return reply.send(buf);
  });
}
