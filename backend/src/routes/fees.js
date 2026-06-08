import { query, queryOne } from "../db.js";
import { createOrder, verifySignature, verifyWebhook } from "../utils/razorpay.js";
import { notifyFeeOverdue } from "../utils/notify.js";
import { audit, reqMeta } from "../utils/audit.js";
import { registerCrud } from "../utils/crud.js";
import { ADMINS } from "../config.js";

const ACC = [...ADMINS, "accountant"];
const PAY_VIEW = [...ACC, "student", "parent"];

function genReceipt() {
  return "RCPT-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1000);
}

export default async function feeRoutes(app) {
  // ---- FEE CATEGORIES ----
  registerCrud(app, {
    table: "fee_categories", prefix: "/fees/categories", roles: ACC, readRoles: ACC,
    columns: ["name", "description", "is_recurring", "frequency", "school_id"],
    searchColumns: ["name"], schoolScoped: true, defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  // ---- FEE STRUCTURE ----
  app.get("/fees/structure", { preHandler: app.authorize(ACC) }, async (req) => {
    return query(
      `SELECT fs.*, c.name AS class_name, fc.name AS category_name, fc.frequency
       FROM fee_structures fs JOIN classes c ON c.id=fs.class_id JOIN fee_categories fc ON fc.id=fs.fee_category_id
       WHERE c.school_id=:sid ORDER BY c.name`, { sid: req.user.schoolId });
  });

  app.post("/fees/structure", { preHandler: app.authorize(ACC) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO fee_structures (class_id, fee_category_id, amount, due_date, academic_year_id)
       VALUES (:c,:cat,:amt,:due,:ay)`,
      { c: b.class_id, cat: b.fee_category_id, amt: b.amount, due: b.due_date || null, ay: b.academic_year_id || null });
    return reply.code(201).send({ id: r.insertId });
  });

  app.delete("/fees/structure/:id", { preHandler: app.authorize(ACC) }, async (req) => {
    await query(`DELETE FROM fee_structures WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // ---- INVOICES ----
  app.get("/fees/invoices", { preHandler: app.authorize(PAY_VIEW) }, async (req) => {
    const where = [], p = {};
    if (req.query.student_id) { where.push("fi.student_id=:sid"); p.sid = req.query.student_id; }
    if (req.query.status) { where.push("fi.status=:st"); p.st = req.query.status; }
    where.push("st.school_id=:school"); p.school = req.user.schoolId;
    const w = `WHERE ${where.join(" AND ")}`;
    return query(
      `SELECT fi.*, u.name AS student_name, fc.name AS category_name
       FROM fee_invoices fi JOIN students st ON st.id=fi.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN fee_categories fc ON fc.id=fi.fee_category_id ${w} ORDER BY fi.due_date DESC, fi.id DESC LIMIT 500`, p);
  });

  app.get("/fees/invoices/:id", { preHandler: app.authorize(PAY_VIEW) }, async (req) => {
    const inv = await queryOne(
      `SELECT fi.*, u.name AS student_name, st.admission_number, fc.name AS category_name
       FROM fee_invoices fi JOIN students st ON st.id=fi.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN fee_categories fc ON fc.id=fi.fee_category_id WHERE fi.id=:id`, { id: req.params.id });
    const payments = await query(`SELECT * FROM fee_payments WHERE invoice_id=:id ORDER BY payment_date DESC`, { id: req.params.id });
    return { ...inv, payments };
  });

  app.post("/fees/invoices", { preHandler: app.authorize(ACC) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO fee_invoices (student_id, fee_category_id, amount, due_date, balance, status, academic_year_id)
       VALUES (:s,:cat,:amt,:due,:amt,'pending',:ay)`,
      { s: b.student_id, cat: b.fee_category_id || null, amt: b.amount, due: b.due_date || null, ay: b.academic_year_id || null });
    return reply.code(201).send({ id: r.insertId });
  });

  // BULK generate invoices for a class from fee structure
  app.post("/fees/invoices/generate-bulk", { preHandler: app.authorize(ACC) }, async (req) => {
    const { class_id, fee_category_id, academic_year_id } = req.body || {};
    const struct = await queryOne(
      `SELECT * FROM fee_structures WHERE class_id=:c AND fee_category_id=:cat ${academic_year_id ? "AND academic_year_id=:ay" : ""} ORDER BY id DESC LIMIT 1`,
      academic_year_id ? { c: class_id, cat: fee_category_id, ay: academic_year_id } : { c: class_id, cat: fee_category_id });
    if (!struct) return { error: "No fee structure found", created: 0 };
    const students = await query(
      `SELECT st.id FROM students st JOIN sections sec ON sec.id=st.section_id
       WHERE sec.class_id=:c AND st.is_active=1`, { c: class_id });
    let created = 0;
    for (const s of students) {
      // skip if an unpaid invoice for this category already exists
      const exists = await queryOne(`SELECT id FROM fee_invoices WHERE student_id=:s AND fee_category_id=:cat AND status!='paid'`, { s: s.id, cat: fee_category_id });
      if (exists) continue;
      await query(
        `INSERT INTO fee_invoices (student_id, fee_category_id, amount, due_date, balance, status, academic_year_id)
         VALUES (:s,:cat,:amt,:due,:amt,'pending',:ay)`,
        { s: s.id, cat: fee_category_id, amt: struct.amount, due: struct.due_date || null, ay: academic_year_id || null });
      created++;
    }
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "bulk_generate", module: "fee_invoices", newValue: { class_id, created } });
    return { success: true, created };
  });

  // OVERDUE list + notify
  app.get("/fees/invoices/overdue", { preHandler: app.authorize(ACC) }, async (req) => {
    // mark overdue first
    await query(`UPDATE fee_invoices fi JOIN students st ON st.id=fi.student_id
                 SET fi.status='overdue' WHERE fi.status IN ('pending','partial') AND fi.due_date < CURDATE() AND st.school_id=:sid`, { sid: req.user.schoolId });
    return query(
      `SELECT fi.*, u.name AS student_name, fc.name AS category_name
       FROM fee_invoices fi JOIN students st ON st.id=fi.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN fee_categories fc ON fc.id=fi.fee_category_id
       WHERE st.school_id=:sid AND fi.status='overdue' ORDER BY fi.due_date`, { sid: req.user.schoolId });
  });

  app.post("/fees/invoices/notify-overdue", { preHandler: app.authorize(ACC) }, async (req) => {
    const overdue = await query(
      `SELECT fi.id, fi.student_id, fi.balance, u.name FROM fee_invoices fi
       JOIN students st ON st.id=fi.student_id JOIN users u ON u.id=st.user_id
       WHERE st.school_id=:sid AND fi.status='overdue'`, { sid: req.user.schoolId });
    for (const o of overdue) await notifyFeeOverdue({ studentId: o.student_id, studentName: o.name, amount: o.balance });
    return { success: true, notified: overdue.length };
  });

  // ---- PAYMENTS (offline) ----
  app.post("/fees/payments", { preHandler: app.authorize(ACC) }, async (req, reply) => {
    const b = req.body || {};
    const inv = await queryOne(`SELECT * FROM fee_invoices WHERE id=:id`, { id: b.invoice_id });
    if (!inv) return reply.code(404).send({ error: "Invoice not found" });
    const amount = Number(b.amount);
    const receipt = genReceipt();
    await query(
      `INSERT INTO fee_payments (invoice_id, student_id, amount, payment_mode, transaction_id, received_by, receipt_number, is_online)
       VALUES (:inv,:sid,:amt,:mode,:txn,:by,:rcpt,0)`,
      { inv: b.invoice_id, sid: inv.student_id, amt: amount, mode: b.payment_mode || "cash", txn: b.transaction_id || null, by: req.user.id, rcpt: receipt });
    await applyPayment(inv, amount);
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "payment", module: "fee_payments", recordId: inv.id, newValue: { amount, receipt } });
    return reply.code(201).send({ success: true, receipt_number: receipt });
  });

  // Receipt data
  app.get("/fees/payments/:id/receipt", { preHandler: app.authorize(PAY_VIEW) }, async (req) => {
    return queryOne(
      `SELECT fp.*, u.name AS student_name, st.admission_number, sch.name AS school_name, sch.address AS school_address,
              fc.name AS category_name
       FROM fee_payments fp JOIN students st ON st.id=fp.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN schools sch ON sch.id=st.school_id
       LEFT JOIN fee_invoices fi ON fi.id=fp.invoice_id LEFT JOIN fee_categories fc ON fc.id=fi.fee_category_id
       WHERE fp.id=:id`, { id: req.params.id });
  });

  app.get("/fees/payments", { preHandler: app.authorize(ACC) }, async (req) => {
    return query(
      `SELECT fp.*, u.name AS student_name FROM fee_payments fp
       JOIN students st ON st.id=fp.student_id JOIN users u ON u.id=st.user_id
       WHERE st.school_id=:sid ORDER BY fp.payment_date DESC LIMIT 500`, { sid: req.user.schoolId });
  });

  // ---- RAZORPAY ----
  app.post("/fees/razorpay/create-order", { preHandler: app.authorize([...ACC, "student", "parent"]) }, async (req, reply) => {
    const { invoice_id } = req.body || {};
    const inv = await queryOne(`SELECT * FROM fee_invoices WHERE id=:id`, { id: invoice_id });
    if (!inv) return reply.code(404).send({ error: "Invoice not found" });
    if (Number(inv.balance) <= 0) return reply.code(400).send({ error: "Invoice already paid" });
    try {
      const order = await createOrder({ amount: inv.balance, receipt: `inv_${inv.id}`, notes: { invoice_id: inv.id } });
      await query(`INSERT INTO payment_gateway_logs (invoice_id, gateway, order_id, amount, status, response_json) VALUES (:inv,'razorpay',:oid,:amt,'created',:json)`,
        { inv: inv.id, oid: order.id, amt: inv.balance, json: JSON.stringify(order) });
      return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID };
    } catch (e) {
      return reply.code(500).send({ error: e.message });
    }
  });

  app.post("/fees/razorpay/verify", { preHandler: app.authorize([...ACC, "student", "parent"]) }, async (req, reply) => {
    const { invoice_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const valid = verifySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
    if (!valid) {
      await query(`INSERT INTO payment_gateway_logs (invoice_id,gateway,order_id,payment_id,status) VALUES (:inv,'razorpay',:oid,:pid,'signature_failed')`,
        { inv: invoice_id, oid: razorpay_order_id, pid: razorpay_payment_id });
      return reply.code(400).send({ error: "Signature verification failed" });
    }
    const inv = await queryOne(`SELECT * FROM fee_invoices WHERE id=:id`, { id: invoice_id });
    if (!inv) return reply.code(404).send({ error: "Invoice not found" });
    const amount = Number(inv.balance);
    const receipt = genReceipt();
    await query(
      `INSERT INTO fee_payments (invoice_id, student_id, amount, payment_mode, transaction_id, receipt_number, gateway_order_id, gateway_payment_id, gateway_signature, is_online)
       VALUES (:inv,:sid,:amt,'online',:txn,:rcpt,:oid,:pid,:sig,1)`,
      { inv: invoice_id, sid: inv.student_id, amt: amount, txn: razorpay_payment_id, rcpt: receipt, oid: razorpay_order_id, pid: razorpay_payment_id, sig: razorpay_signature });
    await applyPayment(inv, amount);
    await query(`INSERT INTO payment_gateway_logs (invoice_id,gateway,order_id,payment_id,amount,status) VALUES (:inv,'razorpay',:oid,:pid,:amt,'paid')`,
      { inv: invoice_id, oid: razorpay_order_id, pid: razorpay_payment_id, amt: amount });
    return { success: true, receipt_number: receipt };
  });

  // Razorpay webhook (no auth — verified via signature). Registered without prefix guard.
  app.post("/fees/razorpay/webhook", { config: { rawBody: true } }, async (req, reply) => {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const ok = secret ? verifyWebhook(JSON.stringify(req.body), signature, secret) : true;
    if (!ok) return reply.code(400).send({ error: "Invalid webhook signature" });
    const event = req.body?.event;
    if (event === "payment.captured") {
      const pay = req.body.payload?.payment?.entity;
      const invId = pay?.notes?.invoice_id;
      if (invId) {
        const inv = await queryOne(`SELECT * FROM fee_invoices WHERE id=:id`, { id: invId });
        if (inv && inv.status !== "paid") {
          await applyPayment(inv, Number(inv.balance));
          await query(`INSERT INTO payment_gateway_logs (invoice_id,gateway,payment_id,amount,status,response_json) VALUES (:inv,'razorpay',:pid,:amt,'webhook_captured',:json)`,
            { inv: invId, pid: pay.id, amt: pay.amount / 100, json: JSON.stringify(pay) });
        }
      }
    }
    return { received: true };
  });

  app.get("/fees/gateway-logs", { preHandler: app.authorize(ACC) }, async () => {
    return query(`SELECT * FROM payment_gateway_logs ORDER BY id DESC LIMIT 300`);
  });

  // ---- EXPENSES ----
  registerCrud(app, {
    table: "expenses", prefix: "/expenses", roles: ACC, readRoles: ACC,
    columns: ["title", "category", "amount", "expense_date", "paid_to", "payment_mode", "description", "receipt_url", "school_id"],
    searchColumns: ["title", "category", "paid_to"], orderBy: "expense_date DESC",
    schoolScoped: true, defaults: (req) => ({ school_id: req.user.schoolId, approved_by: req.user.id }),
  });
}

// Apply a payment to an invoice, updating paid/balance/status.
async function applyPayment(inv, amount) {
  const paid = Number(inv.paid_amount) + amount;
  const balance = Math.max(0, Number(inv.amount) - paid);
  const status = balance <= 0 ? "paid" : "partial";
  await query(`UPDATE fee_invoices SET paid_amount=:paid, balance=:bal, status=:st WHERE id=:id`,
    { paid, bal: balance, st: status, id: inv.id });
}
