import { query, queryOne } from "../db.js";
import { registerCrud } from "../utils/crud.js";
import { notify } from "../utils/notify.js";
import { ADMINS, ALL_ROLES } from "../config.js";

const SEC = [...ADMINS, "security_guard"];
const CAN = [...ADMINS, "canteen_manager"];

function genPass() {
  return "VP-" + new Date().getFullYear() + "-" + Date.now().toString().slice(-6);
}
function genCert(type) {
  return `${(type || "CERT").toUpperCase()}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export default async function miscRoutes(app) {
  // ---- VISITORS ----
  app.get("/visitors", { preHandler: app.authorize([...SEC]) }, async (req) => {
    const p = { sid: req.user.schoolId }; let extra = "";
    if (req.query.today) extra = "AND DATE(v.created_at)=CURDATE()";
    return query(`SELECT * FROM visitors v WHERE school_id=:sid ${extra} ORDER BY created_at DESC LIMIT 500`, p);
  });

  app.post("/visitors", { preHandler: app.authorize(SEC) }, async (req, reply) => {
    const b = req.body || {};
    const pass = genPass();
    const r = await query(
      `INSERT INTO visitors (school_id, name, phone, email, purpose, whom_to_meet, id_proof_type, id_proof_url, in_time, approved_by, pass_number, photo_url, vehicle_number)
       VALUES (:sid,:name,:phone,:email,:purpose,:whom,:idt,:idu,NOW(),:by,:pass,:photo,:vehicle)`,
      { sid: req.user.schoolId, name: b.name, phone: b.phone || null, email: b.email || null, purpose: b.purpose || null,
        whom: b.whom_to_meet || null, idt: b.id_proof_type || null, idu: b.id_proof_url || null, by: req.user.id,
        pass, photo: b.photo_url || null, vehicle: b.vehicle_number || null });
    return reply.code(201).send({ id: r.insertId, pass_number: pass });
  });

  app.post("/visitors/:id/checkout", { preHandler: app.authorize(SEC) }, async (req) => {
    await query(`UPDATE visitors SET out_time=NOW() WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  app.get("/visitors/:id/pass", { preHandler: app.authorize(SEC) }, async (req) => {
    return queryOne(`SELECT v.*, s.name AS school_name FROM visitors v LEFT JOIN schools s ON s.id=v.school_id WHERE v.id=:id`, { id: req.params.id });
  });

  app.get("/visitors/dashboard", { preHandler: app.authorize(SEC) }, async (req) => {
    return queryOne(
      `SELECT COUNT(*) total_today, SUM(out_time IS NULL) inside
       FROM visitors WHERE school_id=:sid AND DATE(created_at)=CURDATE()`, { sid: req.user.schoolId });
  });

  // ---- DISCIPLINE ----
  app.get("/discipline", { preHandler: app.authorize([...ADMINS, "teacher", "student", "parent"]) }, async (req) => {
    const p = { sid: req.user.schoolId }; const where = ["st.school_id=:sid"];
    if (req.query.student_id) { where.push("dr.student_id=:s"); p.s = req.query.student_id; }
    return query(
      `SELECT dr.*, u.name AS student_name, ru.name AS reported_by_name FROM discipline_records dr
       JOIN students st ON st.id=dr.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN users ru ON ru.id=dr.reported_by WHERE ${where.join(" AND ")} ORDER BY dr.incident_date DESC LIMIT 300`, p);
  });

  app.post("/discipline", { preHandler: app.authorize([...ADMINS, "teacher"]) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO discipline_records (student_id, incident_date, type, category, description, action_taken, reported_by)
       VALUES (:s,:date,:type,:cat,:desc,:action,:by)`,
      { s: b.student_id, date: b.incident_date || new Date().toISOString().slice(0, 10), type: b.type || "negative",
        cat: b.category || null, desc: b.description || null, action: b.action_taken || null, by: req.user.id });
    // notify parents
    if (b.notify_parent) {
      const parents = await query(`SELECT user_id FROM parents WHERE student_id=:s`, { s: b.student_id });
      for (const par of parents) await notify({ userId: par.user_id, title: "Discipline Notice", message: b.description || "A discipline record was added.", type: "discipline", link: "/parent/discipline" });
      await query(`UPDATE discipline_records SET parent_notified=1, parent_notified_at=NOW() WHERE id=:id`, { id: r.insertId });
    }
    return reply.code(201).send({ id: r.insertId });
  });

  // ---- ALUMNI ----
  app.get("/alumni/directory", async (req) => {
    // public directory (verified only)
    return query(`SELECT id, graduation_year, current_occupation, company, university, current_city, linkedin_url FROM alumni WHERE is_verified=1 ORDER BY graduation_year DESC LIMIT 500`);
  });

  app.post("/alumni/register", async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO alumni (student_id, graduation_year, current_occupation, company, higher_education, university, current_city, linkedin_url)
       VALUES (:sid,:yr,:occ,:comp,:he,:uni,:city,:li)`,
      { sid: b.student_id || null, yr: b.graduation_year || null, occ: b.current_occupation || null, comp: b.company || null,
        he: b.higher_education || null, uni: b.university || null, city: b.current_city || null, li: b.linkedin_url || null });
    return reply.code(201).send({ id: r.insertId });
  });

  app.get("/alumni", { preHandler: app.authorize(ADMINS) }, async () => {
    return query(`SELECT * FROM alumni ORDER BY joined_at DESC`);
  });

  app.post("/alumni/:id/verify", { preHandler: app.authorize(ADMINS) }, async (req) => {
    await query(`UPDATE alumni SET is_verified=1 WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // ---- INVENTORY ----
  registerCrud(app, {
    table: "inventory_items", prefix: "/inventory", roles: ADMINS, readRoles: ADMINS,
    columns: ["name", "category", "quantity", "unit", "unit_price", "minimum_stock", "supplier", "location", "school_id"],
    searchColumns: ["name", "category", "supplier"], schoolScoped: true, defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  app.post("/inventory/:id/transaction", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    const item = await queryOne(`SELECT * FROM inventory_items WHERE id=:id`, { id: req.params.id });
    if (!item) return reply.code(404).send({ error: "Item not found" });
    const qty = Number(b.quantity || 0);
    const newQty = b.transaction_type === "out" ? Number(item.quantity) - qty : Number(item.quantity) + qty;
    if (newQty < 0) return reply.code(400).send({ error: "Insufficient stock" });
    await query(`UPDATE inventory_items SET quantity=:q WHERE id=:id`, { q: newQty, id: req.params.id });
    await query(`INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reason, done_by, date, remarks) VALUES (:i,:t,:q,:r,:by,CURDATE(),:rm)`,
      { i: req.params.id, t: b.transaction_type, q: qty, r: b.reason || null, by: req.user.id, rm: b.remarks || null });
    return { success: true, quantity: newQty };
  });

  // ---- CANTEEN ----
  registerCrud(app, {
    table: "canteen_menu", prefix: "/canteen/menu", roles: CAN, readRoles: ALL_ROLES,
    columns: ["item_name", "category", "price", "is_available", "description", "image_url", "school_id"],
    searchColumns: ["item_name", "category"], schoolScoped: true, defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  app.get("/canteen/orders", { preHandler: app.authorize(CAN) }, async (req) => {
    return query(
      `SELECT co.*, u.name AS customer_name FROM canteen_orders co JOIN users u ON u.id=co.user_id
       WHERE u.school_id=:sid ORDER BY co.order_date DESC LIMIT 300`, { sid: req.user.schoolId });
  });

  app.post("/canteen/orders", { preHandler: app.authenticate }, async (req, reply) => {
    const b = req.body || {};
    const items = b.items || [];
    let total = 0;
    for (const it of items) total += Number(it.unit_price) * Number(it.quantity);
    const r = await query(`INSERT INTO canteen_orders (user_id, total_amount, payment_mode, status) VALUES (:u,:t,:pm,'pending')`,
      { u: req.user.id, t: total, pm: b.payment_mode || "cash" });
    for (const it of items) {
      await query(`INSERT INTO canteen_order_items (order_id, menu_item_id, quantity, unit_price) VALUES (:o,:m,:q,:p)`,
        { o: r.insertId, m: it.menu_item_id, q: it.quantity, p: it.unit_price });
    }
    return reply.code(201).send({ id: r.insertId, total });
  });

  app.post("/canteen/orders/:id/status", { preHandler: app.authorize(CAN) }, async (req) => {
    await query(`UPDATE canteen_orders SET status=:s WHERE id=:id`, { s: req.body?.status || "completed", id: req.params.id });
    return { success: true };
  });

  app.get("/canteen/dashboard", { preHandler: app.authorize(CAN) }, async (req) => {
    return queryOne(
      `SELECT COUNT(*) orders_today, COALESCE(SUM(total_amount),0) revenue_today
       FROM canteen_orders co JOIN users u ON u.id=co.user_id WHERE u.school_id=:sid AND DATE(order_date)=CURDATE()`, { sid: req.user.schoolId });
  });

  // ---- CERTIFICATES ----
  app.get("/certificates", { preHandler: app.authorize([...ADMINS, "student", "parent"]) }, async (req) => {
    const p = { sid: req.user.schoolId }; const where = ["st.school_id=:sid"];
    if (req.query.student_id) { where.push("cert.student_id=:s"); p.s = req.query.student_id; }
    return query(
      `SELECT cert.*, u.name AS student_name FROM certificates cert
       JOIN students st ON st.id=cert.student_id JOIN users u ON u.id=st.user_id
       WHERE ${where.join(" AND ")} ORDER BY cert.issued_date DESC`, p);
  });

  app.post("/certificates", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const b = req.body || {};
    const number = genCert(b.type);
    const r = await query(
      `INSERT INTO certificates (student_id, type, certificate_number, issued_date, issued_by, file_url, remarks)
       VALUES (:s,:type,:num,CURDATE(),:by,:file,:rm)`,
      { s: b.student_id, type: b.type || "participation", num: number, by: req.user.id, file: b.file_url || null, rm: b.remarks || null });
    return reply.code(201).send({ id: r.insertId, certificate_number: number });
  });

  // certificate data for printing (e.g. TC)
  app.get("/certificates/:id/data", { preHandler: app.authorize([...ADMINS, "student", "parent"]) }, async (req) => {
    return queryOne(
      `SELECT cert.*, u.name AS student_name, st.admission_number, st.dob, st.father_name, st.mother_name,
              sec.name AS section_name, c.name AS class_name, sch.name AS school_name, sch.address AS school_address
       FROM certificates cert JOIN students st ON st.id=cert.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN sections sec ON sec.id=st.section_id LEFT JOIN classes c ON c.id=sec.class_id
       LEFT JOIN schools sch ON sch.id=st.school_id WHERE cert.id=:id`, { id: req.params.id });
  });
}
