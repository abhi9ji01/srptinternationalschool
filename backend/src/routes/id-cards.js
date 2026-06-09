import { query, queryOne } from "../db.js";
import { ADMINS, STAFF_ROLES } from "../config.js";

/**
 * ID card data endpoints. Cards are rendered (and exported to PDF) on the
 * client; these endpoints return the data needed to render them.
 */
export default async function idCardRoutes(app) {
  async function schoolBranding(sid) {
    return queryOne(
      `SELECT name AS school_name, logo_url, address, phone, primary_color, secondary_color FROM schools WHERE id=:id`,
      { id: sid }
    );
  }

  async function studentCard(studentId, sid) {
    const s = await queryOne(
      `SELECT s.id, u.name AS name, s.admission_number, s.roll_number, s.dob, s.blood_group,
              s.guardian_phone, s.address, s.photo_url, u.profile_photo,
              sec.name AS section_name, c.name AS class_name, ay.name AS academic_year
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN sections sec ON sec.id = s.section_id
       LEFT JOIN classes c ON c.id = sec.class_id
       LEFT JOIN academic_years ay ON ay.id = s.academic_year_id
       WHERE s.id = :id AND s.school_id = :sid`,
      { id: studentId, sid }
    );
    if (!s) return null;
    const school = await schoolBranding(sid);
    return {
      type: "student",
      id: s.id,
      name: s.name,
      photo_url: s.photo_url || s.profile_photo || null,
      class_name: s.class_name,
      section_name: s.section_name,
      roll_number: s.roll_number,
      admission_number: s.admission_number,
      dob: s.dob,
      blood_group: s.blood_group,
      guardian_phone: s.guardian_phone,
      address: s.address,
      academic_year: s.academic_year,
      qr_value: `STUDENT:${s.id}`,
      school,
    };
  }

  async function teacherCard(teacherId, sid) {
    const t = await queryOne(
      `SELECT t.id, u.name AS name, t.employee_id, t.designation, t.department,
              u.phone, u.email, t.photo_url, u.profile_photo, t.joining_date
       FROM teachers t JOIN users u ON u.id = t.user_id
       WHERE t.id = :id AND t.school_id = :sid`,
      { id: teacherId, sid }
    );
    if (!t) return null;
    const school = await schoolBranding(sid);
    return {
      type: "teacher",
      id: t.id,
      name: t.name,
      photo_url: t.photo_url || t.profile_photo || null,
      employee_id: t.employee_id,
      designation: t.designation,
      department: t.department,
      phone: t.phone,
      email: t.email,
      joining_date: t.joining_date,
      qr_value: `TEACHER:${t.id}`,
      school,
    };
  }

  app.get("/id-cards/student/:studentId", { preHandler: app.authorize(STAFF_ROLES) }, async (req, reply) => {
    const card = await studentCard(req.params.studentId, req.user.schoolId);
    if (!card) return reply.code(404).send({ error: "Student not found" });
    return card;
  });

  app.get("/id-cards/teacher/:teacherId", { preHandler: app.authorize(STAFF_ROLES) }, async (req, reply) => {
    const card = await teacherCard(req.params.teacherId, req.user.schoolId);
    if (!card) return reply.code(404).send({ error: "Teacher not found" });
    return card;
  });

  // Bulk: returns an array of card data; the client renders and exports a
  // combined PDF (no server-side headless renderer in this stack).
  app.post("/id-cards/bulk-download", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    if (!["student", "teacher"].includes(b.type) || !Array.isArray(b.ids) || !b.ids.length) {
      return reply.code(400).send({ error: "type and ids[] are required" });
    }
    const fn = b.type === "student" ? studentCard : teacherCard;
    const cards = [];
    for (const id of b.ids.slice(0, 200)) {
      const c = await fn(id, req.user.schoolId);
      if (c) cards.push(c);
    }
    return { data: cards, total: cards.length };
  });
}
