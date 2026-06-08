import { query, queryOne } from "../db.js";
import { ADMINS } from "../config.js";

const HLT = [...ADMINS, "health_officer"];

export default async function healthRoutes(app) {
  // RECORDS (one per student, upsert)
  app.get("/health/records", { preHandler: app.authorize(HLT) }, async (req) => {
    const p = { sid: req.user.schoolId }; let extra = "";
    if (req.query.search) { extra = "AND u.name LIKE :q"; p.q = `%${req.query.search}%`; }
    return query(
      `SELECT hr.*, u.name AS student_name, st.admission_number, sec.name AS section_name, c.name AS class_name
       FROM health_records hr JOIN students st ON st.id=hr.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN sections sec ON sec.id=st.section_id LEFT JOIN classes c ON c.id=sec.class_id
       WHERE st.school_id=:sid ${extra} ORDER BY u.name`, p);
  });

  app.get("/health/records/:studentId", { preHandler: app.authorize([...HLT, "student", "parent"]) }, async (req) => {
    const record = await queryOne(`SELECT * FROM health_records WHERE student_id=:id ORDER BY id DESC LIMIT 1`, { id: req.params.studentId });
    const visits = await query(`SELECT * FROM medical_visits WHERE student_id=:id ORDER BY visit_date DESC`, { id: req.params.studentId });
    return { record, visits };
  });

  app.post("/health/records", { preHandler: app.authorize(HLT) }, async (req, reply) => {
    const b = req.body || {};
    const existing = await queryOne(`SELECT id FROM health_records WHERE student_id=:id`, { id: b.student_id });
    const fields = { blood_group: b.blood_group, height: b.height, weight: b.weight, allergies: b.allergies,
      medical_conditions: b.medical_conditions, doctor_name: b.doctor_name, doctor_phone: b.doctor_phone,
      emergency_contact: b.emergency_contact, last_checkup_date: b.last_checkup_date, notes: b.notes };
    if (existing) {
      const set = Object.keys(fields).map((k) => `${k}=:${k}`).join(", ");
      await query(`UPDATE health_records SET ${set} WHERE id=:id`, { ...fields, id: existing.id });
      return { success: true, id: existing.id };
    }
    const r = await query(
      `INSERT INTO health_records (student_id, blood_group, height, weight, allergies, medical_conditions, doctor_name, doctor_phone, emergency_contact, last_checkup_date, notes)
       VALUES (:student_id,:blood_group,:height,:weight,:allergies,:medical_conditions,:doctor_name,:doctor_phone,:emergency_contact,:last_checkup_date,:notes)`,
      { student_id: b.student_id, ...fields });
    return reply.code(201).send({ id: r.insertId });
  });

  // MEDICAL VISITS
  app.get("/health/visits", { preHandler: app.authorize(HLT) }, async (req) => {
    const p = { sid: req.user.schoolId }; let extra = "";
    if (req.query.date) { extra = "AND mv.visit_date=:d"; p.d = req.query.date; }
    return query(
      `SELECT mv.*, u.name AS student_name FROM medical_visits mv
       JOIN students st ON st.id=mv.student_id JOIN users u ON u.id=st.user_id
       WHERE st.school_id=:sid ${extra} ORDER BY mv.visit_date DESC LIMIT 300`, p);
  });

  app.post("/health/visits", { preHandler: app.authorize(HLT) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO medical_visits (student_id, visit_date, symptoms, diagnosis, treatment, doctor, follow_up_date, notes, medicine_given)
       VALUES (:s,:date,:sym,:diag,:treat,:doc,:fu,:notes,:med)`,
      { s: b.student_id, date: b.visit_date || new Date().toISOString().slice(0, 10), sym: b.symptoms || null, diag: b.diagnosis || null,
        treat: b.treatment || null, doc: b.doctor || null, fu: b.follow_up_date || null, notes: b.notes || null, med: b.medicine_given || null });
    return reply.code(201).send({ id: r.insertId });
  });

  app.get("/health/dashboard", { preHandler: app.authorize(HLT) }, async (req) => {
    const stats = await queryOne(
      `SELECT (SELECT COUNT(*) FROM medical_visits mv JOIN students st ON st.id=mv.student_id WHERE st.school_id=:sid AND mv.visit_date=CURDATE()) today_visits,
              (SELECT COUNT(*) FROM health_records hr JOIN students st ON st.id=hr.student_id WHERE st.school_id=:sid) records,
              (SELECT COUNT(*) FROM medical_visits mv JOIN students st ON st.id=mv.student_id WHERE st.school_id=:sid AND mv.follow_up_date>=CURDATE()) followups`, { sid: req.user.schoolId });
    return stats;
  });
}
