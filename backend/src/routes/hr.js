import { query, queryOne, transaction } from "../db.js";
import { hashPassword } from "../utils/password.js";
import { registerCrud } from "../utils/crud.js";
import { notify } from "../utils/notify.js";
import { ADMINS } from "../config.js";

const HR = [...ADMINS, "hr_manager"];

export default async function hrRoutes(app) {
  // ---- STAFF (+user) ----
  app.get("/hr/staff", { preHandler: app.authorize(HR) }, async (req) => {
    const p = { sid: req.user.schoolId };
    let extra = "";
    if (req.query.search) { extra = "AND (u.name LIKE :q OR s.employee_id LIKE :q OR s.department LIKE :q)"; p.q = `%${req.query.search}%`; }
    return query(
      `SELECT s.*, u.name, u.email, u.phone, u.role, u.is_active
       FROM staff s JOIN users u ON u.id=s.user_id WHERE s.school_id=:sid ${extra} ORDER BY u.name`, p);
  });

  app.get("/hr/staff/:id", { preHandler: app.authorize(HR) }, async (req, reply) => {
    const s = await queryOne(`SELECT s.*, u.name, u.email, u.phone, u.role FROM staff s JOIN users u ON u.id=s.user_id WHERE s.id=:id`, { id: req.params.id });
    if (!s) return reply.code(404).send({ error: "Not found" });
    const payroll = await query(`SELECT * FROM payroll WHERE staff_id=:id ORDER BY year DESC, month DESC LIMIT 12`, { id: req.params.id });
    const leaves = await query(`SELECT la.*, lt.name AS leave_type FROM leave_applications la LEFT JOIN leave_types lt ON lt.id=la.leave_type_id WHERE la.staff_id=:id ORDER BY la.applied_at DESC`, { id: req.params.id });
    return { ...s, payroll, leaves };
  });

  app.post("/hr/staff", { preHandler: app.authorize(HR) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.name || !b.email) return reply.code(400).send({ error: "name and email required" });
    try {
      const id = await transaction(async (conn) => {
        const pwd = await hashPassword(b.password || "staff123");
        const [u] = await conn.execute(`INSERT INTO users (school_id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,?)`,
          [req.user.schoolId, b.name, b.email.toLowerCase(), b.phone || null, pwd, b.role || "hr_manager"]);
        const [s] = await conn.execute(
          `INSERT INTO staff (user_id,school_id,employee_id,department,designation,employment_type,joining_date,basic_salary,bank_account,ifsc_code,pan_number,address,emergency_contact)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [u.insertId, req.user.schoolId, b.employee_id || null, b.department || null, b.designation || null, b.employment_type || "full_time",
           b.joining_date || null, b.basic_salary || 0, b.bank_account || null, b.ifsc_code || null, b.pan_number || null, b.address || null, b.emergency_contact || null]);
        return s.insertId;
      });
      return reply.code(201).send({ id, success: true });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") return reply.code(409).send({ error: "Email or employee ID exists" });
      throw e;
    }
  });

  app.put("/hr/staff/:id", { preHandler: app.authorize(HR) }, async (req) => {
    const b = req.body || {};
    const f = ["employee_id", "department", "designation", "employment_type", "joining_date", "basic_salary", "bank_account", "ifsc_code", "pan_number", "address", "emergency_contact"];
    const set = [], p = { id: req.params.id };
    f.forEach((k) => { if (b[k] !== undefined) { set.push(`${k}=:${k}`); p[k] = b[k] === "" ? null : b[k]; } });
    if (set.length) await query(`UPDATE staff SET ${set.join(", ")} WHERE id=:id`, p);
    return { success: true };
  });

  // ---- LEAVE TYPES ----
  registerCrud(app, {
    table: "leave_types", prefix: "/hr/leave-types", roles: HR, readRoles: HR,
    columns: ["name", "days_allowed", "is_paid", "school_id"], schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  // ---- LEAVE APPLICATIONS ----
  app.get("/hr/leaves", { preHandler: app.authorize([...HR, "teacher"]) }, async (req) => {
    const p = {}; const where = [];
    if (req.query.staff_id) { where.push("la.staff_id=:sid"); p.sid = req.query.staff_id; }
    if (req.query.status) { where.push("la.status=:st"); p.st = req.query.status; }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT la.*, lt.name AS leave_type, u.name AS staff_name FROM leave_applications la
       LEFT JOIN leave_types lt ON lt.id=la.leave_type_id
       JOIN staff s ON s.id=la.staff_id JOIN users u ON u.id=s.user_id ${w} ORDER BY la.applied_at DESC`, p);
  });

  // apply for leave (staff/teacher)
  app.post("/hr/leaves", { preHandler: app.authenticate }, async (req, reply) => {
    const b = req.body || {};
    let staffId = b.staff_id;
    if (!staffId) {
      const s = await queryOne(`SELECT id FROM staff WHERE user_id=:uid`, { uid: req.user.id });
      staffId = s?.id;
    }
    if (!staffId) return reply.code(400).send({ error: "No staff record for user" });
    const r = await query(
      `INSERT INTO leave_applications (staff_id, leave_type_id, from_date, to_date, total_days, reason)
       VALUES (:s,:lt,:from,:to,:days,:reason)`,
      { s: staffId, lt: b.leave_type_id || null, from: b.from_date, to: b.to_date, days: b.total_days || 1, reason: b.reason || null });
    return reply.code(201).send({ id: r.insertId });
  });

  // approve/reject (adjusts leave balance on approval)
  app.post("/hr/leaves/:id/decision", { preHandler: app.authorize(HR) }, async (req, reply) => {
    const { status } = req.body || {};
    const la = await queryOne(`SELECT * FROM leave_applications WHERE id=:id`, { id: req.params.id });
    if (!la) return reply.code(404).send({ error: "Not found" });
    await query(`UPDATE leave_applications SET status=:st, approved_by=:by WHERE id=:id`, { st: status, by: req.user.id, id: req.params.id });
    if (status === "approved" && la.leave_type_id) {
      const bal = await queryOne(`SELECT * FROM leave_balances WHERE staff_id=:s AND leave_type_id=:lt ORDER BY id DESC LIMIT 1`, { s: la.staff_id, lt: la.leave_type_id });
      if (bal) {
        const used = Number(bal.used_days) + Number(la.total_days);
        await query(`UPDATE leave_balances SET used_days=:u, remaining_days=:r WHERE id=:id`, { u: used, r: Number(bal.total_days) - used, id: bal.id });
      }
    }
    const staff = await queryOne(`SELECT user_id FROM staff WHERE id=:id`, { id: la.staff_id });
    if (staff) await notify({ userId: staff.user_id, title: `Leave ${status}`, message: `Your leave request was ${status}.`, type: "leave" });
    return { success: true };
  });

  // ---- LEAVE BALANCES ----
  app.get("/hr/leave-balances", { preHandler: app.authorize(HR) }, async (req) => {
    return query(
      `SELECT lb.*, u.name AS staff_name, lt.name AS leave_type FROM leave_balances lb
       JOIN staff s ON s.id=lb.staff_id JOIN users u ON u.id=s.user_id
       LEFT JOIN leave_types lt ON lt.id=lb.leave_type_id WHERE s.school_id=:sid ORDER BY u.name`, { sid: req.user.schoolId });
  });

  app.post("/hr/leave-balances", { preHandler: app.authorize(HR) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO leave_balances (staff_id, leave_type_id, academic_year_id, total_days, used_days, remaining_days)
       VALUES (:s,:lt,:ay,:total,0,:total)`,
      { s: b.staff_id, lt: b.leave_type_id, ay: b.academic_year_id || null, total: b.total_days || 0 });
    return reply.code(201).send({ id: r.insertId });
  });

  // ---- PAYROLL ----
  app.get("/hr/payroll", { preHandler: app.authorize(HR) }, async (req) => {
    const p = { sid: req.user.schoolId }; const where = ["s.school_id=:sid"];
    if (req.query.month) { where.push("pr.month=:m"); p.m = req.query.month; }
    if (req.query.year) { where.push("pr.year=:y"); p.y = req.query.year; }
    return query(
      `SELECT pr.*, u.name AS staff_name, s.employee_id, s.department FROM payroll pr
       JOIN staff s ON s.id=pr.staff_id JOIN users u ON u.id=s.user_id WHERE ${where.join(" AND ")} ORDER BY u.name`, p);
  });

  // Generate payroll for a month with deductions
  app.post("/hr/payroll/generate", { preHandler: app.authorize(HR) }, async (req) => {
    const { month, year } = req.body || {};
    const staff = await query(`SELECT * FROM staff WHERE school_id=:sid`, { sid: req.user.schoolId });
    let generated = 0;
    for (const s of staff) {
      const exists = await queryOne(`SELECT id FROM payroll WHERE staff_id=:s AND month=:m AND year=:y`, { s: s.id, m: month, y: year });
      if (exists) continue;
      const basic = Number(s.basic_salary || 0);
      const hra = Math.round(basic * 0.2);
      const da = Math.round(basic * 0.1);
      const pf = Math.round(basic * 0.12);
      const esi = basic <= 21000 ? Math.round(basic * 0.0075) : 0;
      const tds = basic > 50000 ? Math.round(basic * 0.1) : 0;
      // LOP from absences in the month
      const absRow = await queryOne(
        `SELECT COUNT(*) lop FROM teacher_attendance ta JOIN teachers t ON t.id=ta.teacher_id
         WHERE t.user_id=:uid AND ta.status='absent' AND MONTH(ta.date)=:m AND YEAR(ta.date)=:y`,
        { uid: s.user_id, m: month, y: year });
      const lopDays = absRow?.lop || 0;
      const perDay = basic / 30;
      const lopDeduction = Math.round(perDay * lopDays);
      const net = Math.round(basic + hra + da - pf - esi - tds - lopDeduction);
      await query(
        `INSERT INTO payroll (staff_id,month,year,basic_salary,hra,da,other_allowances,tds,pf,esi,lop_days,lop_deduction,net_salary,status)
         VALUES (:s,:m,:y,:basic,:hra,:da,0,:tds,:pf,:esi,:lopd,:lopded,:net,'pending')`,
        { s: s.id, m: month, y: year, basic, hra, da, tds, pf, esi, lopd: lopDays, lopded: lopDeduction, net });
      generated++;
    }
    return { success: true, generated };
  });

  app.post("/hr/payroll/:id/pay", { preHandler: app.authorize(HR) }, async (req) => {
    await query(`UPDATE payroll SET status='paid', payment_date=CURDATE(), payment_mode=:m WHERE id=:id`, { m: req.body?.payment_mode || "bank", id: req.params.id });
    return { success: true };
  });

  // Salary slip data
  app.get("/hr/payroll/:id/slip", { preHandler: app.authorize(HR) }, async (req) => {
    return queryOne(
      `SELECT pr.*, u.name AS staff_name, s.employee_id, s.designation, s.department, s.bank_account, s.pan_number, sch.name AS school_name
       FROM payroll pr JOIN staff s ON s.id=pr.staff_id JOIN users u ON u.id=s.user_id
       LEFT JOIN schools sch ON sch.id=s.school_id WHERE pr.id=:id`, { id: req.params.id });
  });
}
