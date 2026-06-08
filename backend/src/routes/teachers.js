import { query, queryOne, transaction } from "../db.js";
import { hashPassword } from "../utils/password.js";
import { audit, reqMeta } from "../utils/audit.js";
import { ADMINS, STAFF_ROLES } from "../config.js";

export default async function teacherRoutes(app) {
  // LIST
  app.get("/teachers", { preHandler: app.authorize(STAFF_ROLES) }, async (req) => {
    const params = { sid: req.user.schoolId };
    let extra = "";
    if (req.query.search) { extra = "AND (u.name LIKE :q OR t.employee_id LIKE :q OR t.department LIKE :q)"; params.q = `%${req.query.search}%`; }
    const rows = await query(
      `SELECT t.*, u.name, u.email, u.phone, u.is_active, u.profile_photo
       FROM teachers t JOIN users u ON u.id=t.user_id
       WHERE t.school_id=:sid ${extra} ORDER BY u.name`, params);
    return { data: rows, total: rows.length };
  });

  // GET one with assignments
  app.get("/teachers/:id", { preHandler: app.authorize(STAFF_ROLES) }, async (req, reply) => {
    const t = await queryOne(
      `SELECT t.*, u.name, u.email, u.phone, u.profile_photo FROM teachers t JOIN users u ON u.id=t.user_id WHERE t.id=:id`, { id: req.params.id });
    if (!t) return reply.code(404).send({ error: "Not found" });
    const assignments = await query(
      `SELECT ta.*, sec.name AS section_name, c.name AS class_name, sub.name AS subject_name
       FROM teacher_assignments ta
       LEFT JOIN sections sec ON sec.id=ta.section_id LEFT JOIN classes c ON c.id=sec.class_id
       LEFT JOIN subjects sub ON sub.id=ta.subject_id WHERE ta.teacher_id=:id`, { id: req.params.id });
    return { ...t, assignments };
  });

  // CREATE teacher (+user)
  app.post("/teachers", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.name || !b.email) return reply.code(400).send({ error: "name and email required" });
    try {
      const id = await transaction(async (conn) => {
        const pwd = await hashPassword(b.password || "teacher123");
        const [u] = await conn.execute(`INSERT INTO users (school_id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,'teacher')`,
          [req.user.schoolId, b.name, b.email.toLowerCase(), b.phone || null, pwd]);
        const [t] = await conn.execute(
          `INSERT INTO teachers (user_id,employee_id,qualification,joining_date,department,designation,salary,address,emergency_contact,school_id)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [u.insertId, b.employee_id || null, b.qualification || null, b.joining_date || null, b.department || null,
           b.designation || null, b.salary || null, b.address || null, b.emergency_contact || null, req.user.schoolId]);
        return t.insertId;
      });
      await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "create", module: "teachers", recordId: id, newValue: { name: b.name } });
      return reply.code(201).send(await queryOne(`SELECT * FROM teachers WHERE id=:id`, { id }));
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") return reply.code(409).send({ error: "Email or employee ID already exists" });
      throw e;
    }
  });

  app.put("/teachers/:id", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const t = await queryOne(`SELECT * FROM teachers WHERE id=:id`, { id: req.params.id });
    if (!t) return reply.code(404).send({ error: "Not found" });
    const b = req.body || {};
    const tf = ["employee_id", "qualification", "joining_date", "department", "designation", "salary", "address", "emergency_contact"];
    const set = [], p = { id: req.params.id };
    tf.forEach((f) => { if (b[f] !== undefined) { set.push(`${f}=:${f}`); p[f] = b[f] === "" ? null : b[f]; } });
    if (set.length) await query(`UPDATE teachers SET ${set.join(", ")} WHERE id=:id`, p);
    const uf = [], up = { uid: t.user_id };
    ["name", "phone", "profile_photo", "is_active"].forEach((f) => { if (b[f] !== undefined) { uf.push(`${f}=:${f}`); up[f] = b[f]; } });
    if (uf.length) await query(`UPDATE users SET ${uf.join(", ")} WHERE id=:uid`, up);
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "update", module: "teachers", recordId: Number(req.params.id), oldValue: t });
    return queryOne(`SELECT * FROM teachers WHERE id=:id`, { id: req.params.id });
  });

  app.delete("/teachers/:id", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const t = await queryOne(`SELECT user_id FROM teachers WHERE id=:id`, { id: req.params.id });
    if (t) await query(`UPDATE users SET is_active=0 WHERE id=:uid`, { uid: t.user_id });
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "deactivate", module: "teachers", recordId: Number(req.params.id) });
    return { success: true };
  });

  // ASSIGN teacher to section/subject
  app.post("/teachers/assign", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.teacher_id || !b.section_id) return reply.code(400).send({ error: "teacher_id and section_id required" });
    const r = await query(
      `INSERT INTO teacher_assignments (teacher_id, section_id, subject_id, role, academic_year_id)
       VALUES (:t,:s,:sub,:role,:ay)`,
      { t: b.teacher_id, s: b.section_id, sub: b.subject_id || null, role: b.role || "subject_teacher", ay: b.academic_year_id || null });
    // If class_teacher, also set on section
    if (b.role === "class_teacher") {
      const u = await queryOne(`SELECT user_id FROM teachers WHERE id=:id`, { id: b.teacher_id });
      if (u) await query(`UPDATE sections SET class_teacher_id=:uid WHERE id=:sid`, { uid: u.user_id, sid: b.section_id });
    }
    return reply.code(201).send({ id: r.insertId, success: true });
  });

  app.get("/teachers/assignments/all", { preHandler: app.authorize(STAFF_ROLES) }, async (req) => {
    return query(
      `SELECT ta.*, u.name AS teacher_name, sec.name AS section_name, c.name AS class_name, sub.name AS subject_name
       FROM teacher_assignments ta JOIN teachers t ON t.id=ta.teacher_id JOIN users u ON u.id=t.user_id
       LEFT JOIN sections sec ON sec.id=ta.section_id LEFT JOIN classes c ON c.id=sec.class_id
       LEFT JOIN subjects sub ON sub.id=ta.subject_id WHERE t.school_id=:sid ORDER BY u.name`, { sid: req.user.schoolId });
  });

  app.delete("/teachers/assign/:id", { preHandler: app.authorize(ADMINS) }, async (req) => {
    await query(`DELETE FROM teacher_assignments WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // ---- PARENTS list/CRUD-lite ----
  app.get("/parents", { preHandler: app.authorize(ADMINS) }, async (req) => {
    return query(
      `SELECT p.*, u.name, u.email, u.phone, su.name AS student_name
       FROM parents p JOIN users u ON u.id=p.user_id
       LEFT JOIN students st ON st.id=p.student_id LEFT JOIN users su ON su.id=st.user_id
       WHERE u.school_id=:sid ORDER BY u.name`, { sid: req.user.schoolId });
  });

  app.post("/parents", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.name || !b.email) return reply.code(400).send({ error: "name and email required" });
    try {
      const id = await transaction(async (conn) => {
        const pwd = await hashPassword(b.password || "parent123");
        const [u] = await conn.execute(`INSERT INTO users (school_id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,'parent')`,
          [req.user.schoolId, b.name, b.email.toLowerCase(), b.phone || null, pwd]);
        const [p] = await conn.execute(`INSERT INTO parents (user_id,student_id,relation,occupation,annual_income,address) VALUES (?,?,?,?,?,?)`,
          [u.insertId, b.student_id || null, b.relation || "Guardian", b.occupation || null, b.annual_income || null, b.address || null]);
        return p.insertId;
      });
      return reply.code(201).send({ id, success: true });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") return reply.code(409).send({ error: "Email already exists" });
      throw e;
    }
  });
}
