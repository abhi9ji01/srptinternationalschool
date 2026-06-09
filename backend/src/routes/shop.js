import { query, queryOne, transaction } from "../db.js";
import { audit, reqMeta } from "../utils/audit.js";
import { notify, notifyMany } from "../utils/notify.js";
import { sendEmail } from "../utils/mailer.js";
import { deleteFromCloudinary } from "../lib/upload.js";
import { uniquePurchaseCode, uniqueOrderNumber } from "../lib/shop-codes.js";
import { ADMINS } from "../config.js";

const MANAGE = [...ADMINS, "accountant"]; // product/order management + delivery
const BUYERS = ["student", "parent"];
const LOW_STOCK = 5;

function parseJson(v, fallback = null) {
  if (v == null) return fallback;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return fallback; }
}
const J = (v) => JSON.stringify(v ?? null);

export default async function shopRoutes(app) {
  // ============ CATEGORIES ============
  app.get("/shop/categories", { preHandler: app.authenticate }, async (req) => {
    const p = { sid: req.user.schoolId };
    let extra = "";
    if (req.query.type) { extra = " AND type=:type"; p.type = req.query.type; }
    return query(`SELECT * FROM shop_categories WHERE school_id=:sid ${extra} ORDER BY name`, p);
  });

  app.post("/shop/categories", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.name || !b.type) return reply.code(400).send({ error: "name and type are required" });
    const r = await query(
      `INSERT INTO shop_categories (school_id, name, type, description) VALUES (:sid,:name,:type,:desc)`,
      { sid: req.user.schoolId, name: b.name, type: b.type, desc: b.description || null });
    return reply.code(201).send({ id: r.insertId, success: true });
  });

  app.put("/shop/categories/:id", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const c = await queryOne(`SELECT id FROM shop_categories WHERE id=:id AND school_id=:sid`, { id: req.params.id, sid: req.user.schoolId });
    if (!c) return reply.code(404).send({ error: "Category not found" });
    const b = req.body || {};
    const set = [], p = { id: req.params.id };
    ["name", "type", "description", "is_active"].forEach((f) => { if (b[f] !== undefined) { set.push(`${f}=:${f}`); p[f] = b[f]; } });
    if (set.length) await query(`UPDATE shop_categories SET ${set.join(", ")} WHERE id=:id`, p);
    return { success: true };
  });

  app.delete("/shop/categories/:id", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const used = await queryOne(`SELECT COUNT(*) n FROM shop_products WHERE category_id=:id`, { id: req.params.id });
    if (used && Number(used.n) > 0) return reply.code(409).send({ error: "Cannot delete: products exist in this category" });
    await query(`DELETE FROM shop_categories WHERE id=:id AND school_id=:sid`, { id: req.params.id, sid: req.user.schoolId });
    return { success: true };
  });

  // ============ PRODUCTS (management) ============
  function shapeProduct(p) {
    return { ...p, images: parseJson(p.images, []), cloudinary_public_ids: parseJson(p.cloudinary_public_ids, []), sizes: parseJson(p.sizes, null) };
  }

  app.get("/shop/products", { preHandler: app.authorize(MANAGE) }, async (req) => {
    const p = { sid: req.user.schoolId }; const where = ["sp.school_id=:sid"];
    if (req.query.type) { where.push("sp.type=:type"); p.type = req.query.type; }
    if (req.query.category_id) { where.push("sp.category_id=:cat"); p.cat = req.query.category_id; }
    if (req.query.active_only === "true") where.push("sp.is_active=1");
    const rows = await query(
      `SELECT sp.*, sc.name AS category_name FROM shop_products sp
       LEFT JOIN shop_categories sc ON sc.id=sp.category_id
       WHERE ${where.join(" AND ")} ORDER BY sp.created_at DESC`, p);
    return rows.map(shapeProduct);
  });

  app.get("/shop/products/:id", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const p = await queryOne(
      `SELECT sp.*, sc.name AS category_name FROM shop_products sp
       LEFT JOIN shop_categories sc ON sc.id=sp.category_id WHERE sp.id=:id AND sp.school_id=:sid`,
      { id: req.params.id, sid: req.user.schoolId });
    if (!p) return reply.code(404).send({ error: "Product not found" });
    return shapeProduct(p);
  });

  app.post("/shop/products", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const b = req.body || {};
    if (!b.name || b.price == null || !b.category_id || !b.type) {
      return reply.code(400).send({ error: "name, price, category_id and type are required" });
    }
    const images = b.images || [];
    const r = await query(
      `INSERT INTO shop_products
         (school_id, category_id, name, description, price, stock_quantity, is_unlimited_stock, type,
          images, thumbnail_url, cloudinary_public_ids, sizes, course_duration, course_start_date,
          course_end_date, course_instructor, is_active, created_by)
       VALUES (:sid,:cat,:name,:desc,:price,:stock,:unlimited,:type,:images,:thumb,:pids,:sizes,
               :dur,:start,:end,:instr,:active,:by)`,
      {
        sid: req.user.schoolId, cat: b.category_id, name: b.name, desc: b.description || null,
        price: b.price, stock: b.stock_quantity || 0, unlimited: b.is_unlimited_stock ? 1 : 0, type: b.type,
        images: J(images), thumb: b.thumbnail_url || images[0] || null, pids: J(b.cloudinary_public_ids || []),
        sizes: b.sizes ? J(b.sizes) : null, dur: b.course_duration || null, start: b.course_start_date || null,
        end: b.course_end_date || null, instr: b.course_instructor || null,
        active: b.is_active === false ? 0 : 1, by: req.user.id,
      });
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "create", module: "shop_products", recordId: r.insertId, newValue: { name: b.name } });
    return reply.code(201).send({ id: r.insertId, success: true });
  });

  app.put("/shop/products/:id", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const prod = await queryOne(`SELECT * FROM shop_products WHERE id=:id AND school_id=:sid`, { id: req.params.id, sid: req.user.schoolId });
    if (!prod) return reply.code(404).send({ error: "Product not found" });
    const b = req.body || {};

    // Remove images that were dropped from the list (clean up Cloudinary).
    if (b.cloudinary_public_ids !== undefined) {
      const oldIds = parseJson(prod.cloudinary_public_ids, []);
      const newIds = b.cloudinary_public_ids || [];
      for (const pid of oldIds.filter((x) => !newIds.includes(x))) await deleteFromCloudinary(pid, "image");
    }

    const fields = {
      name: "name", description: "description", price: "price", category_id: "category_id",
      type: "type", stock_quantity: "stock_quantity", course_duration: "course_duration",
      course_start_date: "course_start_date", course_end_date: "course_end_date",
      course_instructor: "course_instructor", thumbnail_url: "thumbnail_url",
    };
    const set = [], p = { id: req.params.id };
    for (const [key, col] of Object.entries(fields)) {
      if (b[key] !== undefined) { set.push(`${col}=:${key}`); p[key] = b[key] === "" ? null : b[key]; }
    }
    if (b.is_unlimited_stock !== undefined) { set.push("is_unlimited_stock=:unl"); p.unl = b.is_unlimited_stock ? 1 : 0; }
    if (b.is_active !== undefined) { set.push("is_active=:act"); p.act = b.is_active ? 1 : 0; }
    if (b.images !== undefined) { set.push("images=:images"); p.images = J(b.images || []); }
    if (b.cloudinary_public_ids !== undefined) { set.push("cloudinary_public_ids=:pids"); p.pids = J(b.cloudinary_public_ids || []); }
    if (b.sizes !== undefined) { set.push("sizes=:sizes"); p.sizes = b.sizes ? J(b.sizes) : null; }
    if (set.length) await query(`UPDATE shop_products SET ${set.join(", ")} WHERE id=:id`, p);
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "update", module: "shop_products", recordId: Number(req.params.id) });
    return { success: true };
  });

  app.delete("/shop/products/:id", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const prod = await queryOne(`SELECT * FROM shop_products WHERE id=:id AND school_id=:sid`, { id: req.params.id, sid: req.user.schoolId });
    if (!prod) return reply.code(404).send({ error: "Product not found" });
    await query(`UPDATE shop_products SET is_active=0 WHERE id=:id`, { id: req.params.id });
    for (const pid of parseJson(prod.cloudinary_public_ids, [])) await deleteFromCloudinary(pid, "image");
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "delete", module: "shop_products", recordId: Number(req.params.id) });
    return { success: true };
  });

  // ============ STORE (buyers) ============
  app.get("/shop/store", { preHandler: app.authorize([...BUYERS, ...MANAGE]) }, async (req) => {
    const p = { sid: req.user.schoolId }; const where = ["sp.school_id=:sid", "sp.is_active=1", "(sp.is_unlimited_stock=1 OR sp.stock_quantity>0)"];
    if (req.query.category_id) { where.push("sp.category_id=:cat"); p.cat = req.query.category_id; }
    if (req.query.search) { where.push("sp.name LIKE :q"); p.q = `%${req.query.search}%`; }
    const rows = (await query(
      `SELECT sp.*, sc.name AS category_name FROM shop_products sp
       LEFT JOIN shop_categories sc ON sc.id=sp.category_id
       WHERE ${where.join(" AND ")} ORDER BY sp.type, sp.name`, p)).map(shapeProduct);
    return { all: rows, dress: rows.filter((r) => r.type === "dress"), course: rows.filter((r) => r.type === "course"), other: rows.filter((r) => r.type === "other") };
  });

  app.get("/shop/store/:id", { preHandler: app.authorize([...BUYERS, ...MANAGE]) }, async (req, reply) => {
    const p = await queryOne(
      `SELECT sp.*, sc.name AS category_name FROM shop_products sp
       LEFT JOIN shop_categories sc ON sc.id=sp.category_id WHERE sp.id=:id AND sp.school_id=:sid AND sp.is_active=1`,
      { id: req.params.id, sid: req.user.schoolId });
    if (!p) return reply.code(404).send({ error: "Product not available" });
    return shapeProduct(p);
  });

  // ============ ORDERS (buyers) ============
  app.post("/shop/orders", { preHandler: app.authorize(BUYERS) }, async (req, reply) => {
    const b = req.body || {};
    if (!Array.isArray(b.items) || !b.items.length) return reply.code(400).send({ error: "items[] is required" });
    if (!["online", "cash", "upi"].includes(b.payment_mode)) return reply.code(400).send({ error: "Invalid payment_mode" });

    try {
      const result = await transaction(async (conn) => {
        // Validate + price every item server-side.
        const prepared = [];
        let total = 0;
        for (const it of b.items) {
          const [[prod]] = await conn.execute(`SELECT * FROM shop_products WHERE id=? AND school_id=? AND is_active=1`, [it.product_id, req.user.schoolId]);
          if (!prod) throw new Error("A product in your cart is no longer available");
          const qty = Math.max(1, Number(it.quantity) || 1);
          if (!prod.is_unlimited_stock && prod.stock_quantity < qty) throw new Error(`Insufficient stock for ${prod.name}`);
          const line = Number(prod.price) * qty;
          total += line;
          prepared.push({ prod, qty, size: it.size || null, line });
        }

        const orderNumber = await uniqueOrderNumber(conn);
        const [ord] = await conn.execute(
          `INSERT INTO shop_orders (school_id, order_number, buyer_id, buyer_type, total_amount, payment_mode, payment_status, overall_status, notes)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [req.user.schoolId, orderNumber, req.user.id, req.user.role, total, b.payment_mode,
           b.payment_mode === "cash" ? "pending" : "paid", "confirmed", b.notes || null]);
        const orderId = ord.insertId;

        const codes = [];
        for (const { prod, qty, size, line } of prepared) {
          const code = await uniquePurchaseCode(conn);
          codes.push({ code, name: prod.name });
          await conn.execute(
            `INSERT INTO shop_order_items (order_id, product_id, product_name, product_type, size, quantity, unit_price, total_price, purchase_code, status)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [orderId, prod.id, prod.name, prod.type, size, qty, prod.price, line, code, "confirmed"]);
          if (!prod.is_unlimited_stock) await conn.execute(`UPDATE shop_products SET stock_quantity=stock_quantity-? WHERE id=?`, [qty, prod.id]);
        }
        return { orderId, orderNumber, total, codes, productIds: prepared.map((x) => x.prod.id) };
      });

      // Post-commit side effects (notifications, email, low-stock alerts).
      const codeList = result.codes.map((c) => c.code).join(", ");
      await notify({ userId: req.user.id, title: "Order Placed", message: `Your order ${result.orderNumber} is placed. Purchase code(s): ${codeList}`, type: "shop", link: `/${req.user.role}/shop/orders/${result.orderId}` });
      const me = await queryOne(`SELECT email, name FROM users WHERE id=:id`, { id: req.user.id });
      if (me?.email) {
        await sendEmail({
          to: me.email, userId: req.user.id, subject: `Order ${result.orderNumber} placed`,
          html: `<p>Hi ${me.name},</p><p>Your order <b>${result.orderNumber}</b> has been placed. Show these purchase codes to the accountant to collect your items:</p>
                 <ul>${result.codes.map((c) => `<li><b>${c.code}</b> — ${c.name}</li>`).join("")}</ul>`,
        });
      }
      await lowStockAlerts(app, req.user.schoolId, result.productIds);

      return reply.code(201).send({ success: true, order_id: result.orderId, order_number: result.orderNumber });
    } catch (e) {
      return reply.code(400).send({ error: e.message || "Could not place order" });
    }
  });

  app.get("/shop/orders/my", { preHandler: app.authorize(BUYERS) }, async (req) => {
    const orders = await query(`SELECT * FROM shop_orders WHERE buyer_id=:id ORDER BY ordered_at DESC`, { id: req.user.id });
    for (const o of orders) o.items = await query(`SELECT * FROM shop_order_items WHERE order_id=:oid`, { oid: o.id });
    return orders;
  });

  app.get("/shop/orders/my/:orderId", { preHandler: app.authorize(BUYERS) }, async (req, reply) => {
    const o = await queryOne(`SELECT * FROM shop_orders WHERE id=:id AND buyer_id=:uid`, { id: req.params.orderId, uid: req.user.id });
    if (!o) return reply.code(404).send({ error: "Order not found" });
    o.items = await query(`SELECT * FROM shop_order_items WHERE order_id=:oid`, { oid: o.id });
    return o;
  });

  // ============ ORDERS (management) ============
  app.get("/shop/orders", { preHandler: app.authorize(MANAGE) }, async (req) => {
    const p = { sid: req.user.schoolId }; const where = ["o.school_id=:sid"];
    if (req.query.status) { where.push("o.overall_status=:st"); p.st = req.query.status; }
    if (req.query.date_from) { where.push("DATE(o.ordered_at)>=:df"); p.df = req.query.date_from; }
    if (req.query.date_to) { where.push("DATE(o.ordered_at)<=:dt"); p.dt = req.query.date_to; }
    if (req.query.search) { where.push("(o.order_number LIKE :q OR u.name LIKE :q)"); p.q = `%${req.query.search}%`; }
    let typeJoin = "";
    if (req.query.type) { typeJoin = "JOIN shop_order_items oi2 ON oi2.order_id=o.id AND oi2.product_type=:type"; p.type = req.query.type; }
    return query(
      `SELECT DISTINCT o.*, u.name AS buyer_name,
              (SELECT COUNT(*) FROM shop_order_items oi WHERE oi.order_id=o.id) AS items_count
       FROM shop_orders o JOIN users u ON u.id=o.buyer_id ${typeJoin}
       WHERE ${where.join(" AND ")} ORDER BY o.ordered_at DESC LIMIT 500`, p);
  });

  app.get("/shop/orders/:orderId", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const o = await queryOne(
      `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email, u.phone AS buyer_phone
       FROM shop_orders o JOIN users u ON u.id=o.buyer_id WHERE o.id=:id AND o.school_id=:sid`,
      { id: req.params.orderId, sid: req.user.schoolId });
    if (!o) return reply.code(404).send({ error: "Order not found" });
    o.items = await query(`SELECT * FROM shop_order_items WHERE order_id=:oid`, { oid: o.id });
    return o;
  });

  app.put("/shop/orders/:orderId/status", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const valid = ["pending", "confirmed", "partially_delivered", "completed", "cancelled"];
    const status = (req.body || {}).overall_status;
    if (!valid.includes(status)) return reply.code(400).send({ error: "Invalid status" });
    const o = await queryOne(`SELECT id FROM shop_orders WHERE id=:id AND school_id=:sid`, { id: req.params.orderId, sid: req.user.schoolId });
    if (!o) return reply.code(404).send({ error: "Order not found" });
    await query(`UPDATE shop_orders SET overall_status=:st WHERE id=:id`, { st: status, id: req.params.orderId });
    return { success: true };
  });

  // ============ VERIFY / DELIVER (accountant + admin) ============
  app.post("/shop/verify-code", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const code = ((req.body || {}).purchase_code || "").trim().toUpperCase();
    if (!code) return reply.code(400).send({ error: "purchase_code is required" });
    const item = await queryOne(
      `SELECT oi.*, o.order_number, o.ordered_at, o.buyer_id, o.buyer_type, o.school_id,
              o.payment_status, o.overall_status AS order_status
       FROM shop_order_items oi JOIN shop_orders o ON o.id=oi.order_id
       WHERE oi.purchase_code=:c AND o.school_id=:sid`, { c: code, sid: req.user.schoolId });
    if (!item) return reply.code(404).send({ error: "Invalid code. No order found for this code." });

    const buyer = await queryOne(`SELECT id, name, profile_photo FROM users WHERE id=:id`, { id: item.buyer_id });
    const student = await queryOne(
      `SELECT st.roll_number, st.photo_url, st.admission_number, sec.name AS section_name, c.name AS class_name
       FROM students st LEFT JOIN sections sec ON sec.id=st.section_id LEFT JOIN classes c ON c.id=sec.class_id
       WHERE st.user_id=:uid`, { uid: item.buyer_id });
    let deliveredByName = null;
    if (item.delivered_by) deliveredByName = (await queryOne(`SELECT name FROM users WHERE id=:id`, { id: item.delivered_by }))?.name;

    await query(`INSERT INTO purchase_code_scans (purchase_code, order_item_id, scanned_by, action) VALUES (:c,:i,:by,'verified')`,
      { c: code, i: item.id, by: req.user.id });

    return {
      found: true,
      already_delivered: item.status === "delivered",
      delivered_at: item.delivered_at,
      delivered_by_name: deliveredByName,
      item: {
        id: item.id, purchase_code: item.purchase_code, product_name: item.product_name, product_type: item.product_type,
        size: item.size, quantity: item.quantity, unit_price: item.unit_price, total_price: item.total_price,
        status: item.status, order_number: item.order_number, ordered_at: item.ordered_at, payment_status: item.payment_status,
      },
      buyer: {
        name: buyer?.name, photo: student?.photo_url || buyer?.profile_photo || null, buyer_type: item.buyer_type,
        class_name: student?.class_name || null, section_name: student?.section_name || null,
        roll_number: student?.roll_number || null, admission_number: student?.admission_number || null,
      },
    };
  });

  app.post("/shop/deliver", { preHandler: app.authorize(MANAGE) }, async (req, reply) => {
    const code = ((req.body || {}).purchase_code || "").trim().toUpperCase();
    if (!code) return reply.code(400).send({ error: "purchase_code is required" });
    const item = await queryOne(
      `SELECT oi.*, o.id AS order_id, o.buyer_id, o.school_id FROM shop_order_items oi
       JOIN shop_orders o ON o.id=oi.order_id WHERE oi.purchase_code=:c AND o.school_id=:sid`,
      { c: code, sid: req.user.schoolId });
    if (!item) return reply.code(404).send({ error: "Invalid code" });
    if (item.status === "delivered") return reply.code(409).send({ error: "This item was already delivered", delivered_at: item.delivered_at });
    if (item.status === "cancelled") return reply.code(409).send({ error: "This item was cancelled" });

    await query(`UPDATE shop_order_items SET status='delivered', delivered_by=:by, delivered_at=NOW(), delivery_notes=:notes WHERE id=:id`,
      { by: req.user.id, notes: (req.body || {}).delivery_notes || null, id: item.id });
    await query(`INSERT INTO purchase_code_scans (purchase_code, order_item_id, scanned_by, action, notes) VALUES (:c,:i,:by,'delivered',:notes)`,
      { c: code, i: item.id, by: req.user.id, notes: (req.body || {}).delivery_notes || null });

    // Roll the parent order status up.
    const counts = await queryOne(
      `SELECT COUNT(*) total, SUM(status='delivered') delivered, SUM(status='cancelled') cancelled
       FROM shop_order_items WHERE order_id=:oid`, { oid: item.order_id });
    let overall = "partially_delivered";
    if (Number(counts.delivered) + Number(counts.cancelled) >= Number(counts.total)) overall = "completed";
    await query(`UPDATE shop_orders SET overall_status=:st WHERE id=:oid`, { st: overall, oid: item.order_id });

    const me = await queryOne(`SELECT name FROM users WHERE id=:id`, { id: req.user.id });
    await notify({ userId: item.buyer_id, title: "Item Delivered", message: `Your ${item.product_name} has been delivered. Collected via ${me?.name || "accountant"}.`, type: "shop", link: `/student/shop/orders/${item.order_id}` });

    return { success: true, overall_status: overall };
  });

  // ============ REPORTS ============
  app.get("/shop/reports", { preHandler: app.authorize(MANAGE) }, async (req) => {
    const sid = req.user.schoolId;
    const totals = await queryOne(
      `SELECT COUNT(*) total_orders,
              COALESCE(SUM(total_amount),0) total_revenue,
              SUM(DATE(ordered_at)=CURDATE()) orders_today
       FROM shop_orders WHERE school_id=:sid`, { sid });
    const monthRevenue = await queryOne(
      `SELECT COALESCE(SUM(total_amount),0) revenue FROM shop_orders
       WHERE school_id=:sid AND MONTH(ordered_at)=MONTH(CURDATE()) AND YEAR(ordered_at)=YEAR(CURDATE())`, { sid });
    const pendingPickups = await queryOne(
      `SELECT COUNT(*) n FROM shop_order_items oi JOIN shop_orders o ON o.id=oi.order_id
       WHERE o.school_id=:sid AND oi.status IN ('confirmed','ready')`, { sid });
    const deliveredToday = await queryOne(
      `SELECT COUNT(*) n FROM shop_order_items oi JOIN shop_orders o ON o.id=oi.order_id
       WHERE o.school_id=:sid AND oi.status='delivered' AND DATE(oi.delivered_at)=CURDATE()`, { sid });
    const productCounts = await query(
      `SELECT type, COUNT(*) n FROM shop_products WHERE school_id=:sid AND is_active=1 GROUP BY type`, { sid });
    const lowStock = await query(
      `SELECT id, name, stock_quantity, type FROM shop_products
       WHERE school_id=:sid AND is_active=1 AND is_unlimited_stock=0 AND stock_quantity<:low ORDER BY stock_quantity`, { sid, low: LOW_STOCK });
    const recentOrders = await query(
      `SELECT o.*, u.name AS buyer_name FROM shop_orders o JOIN users u ON u.id=o.buyer_id
       WHERE o.school_id=:sid ORDER BY o.ordered_at DESC LIMIT 10`, { sid });
    return {
      total_orders: Number(totals.total_orders), total_revenue: Number(totals.total_revenue),
      orders_today: Number(totals.orders_today || 0), month_revenue: Number(monthRevenue.revenue),
      pending_pickups: Number(pendingPickups.n), delivered_today: Number(deliveredToday.n),
      product_counts: productCounts.reduce((a, r) => ({ ...a, [r.type]: Number(r.n) }), {}),
      low_stock: lowStock, recent_orders: recentOrders,
    };
  });

  // Pending pickups list (confirmed/ready, not delivered) for the accountant.
  app.get("/shop/pending", { preHandler: app.authorize(MANAGE) }, async (req) => {
    return query(
      `SELECT oi.id, oi.purchase_code, oi.product_name, oi.size, oi.quantity, oi.status,
              o.order_number, o.ordered_at, u.name AS buyer_name,
              DATEDIFF(CURDATE(), DATE(o.ordered_at)) AS days_waiting
       FROM shop_order_items oi JOIN shop_orders o ON o.id=oi.order_id JOIN users u ON u.id=o.buyer_id
       WHERE o.school_id=:sid AND oi.status IN ('confirmed','ready')
       ORDER BY o.ordered_at ASC`, { sid: req.user.schoolId });
  });
}

// Notify admins + accountants when a product drops below the low-stock threshold.
async function lowStockAlerts(app, schoolId, productIds) {
  if (!productIds?.length) return;
  const ph = productIds.map((_, i) => `:p${i}`).join(",");
  const params = productIds.reduce((a, id, i) => ({ ...a, [`p${i}`]: id }), { low: LOW_STOCK });
  const low = await query(
    `SELECT id, name, stock_quantity FROM shop_products WHERE id IN (${ph}) AND is_unlimited_stock=0 AND stock_quantity<:low`, params);
  if (!low.length) return;
  const staff = await query(`SELECT id FROM users WHERE school_id=:sid AND role IN ('admin','super_admin','accountant') AND is_active=1`, { sid: schoolId });
  const ids = staff.map((s) => s.id);
  for (const prod of low) {
    await notifyMany(ids, { title: "Low Stock Alert", message: `${prod.name} is low on stock (${prod.stock_quantity} left).`, type: "shop", link: "/admin/shop/products" });
  }
}
