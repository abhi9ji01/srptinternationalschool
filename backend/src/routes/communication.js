import { query, queryOne } from "../db.js";
import { registerCrud } from "../utils/crud.js";
import { ADMINS, ALL_ROLES, STAFF_ROLES } from "../config.js";

export default async function communicationRoutes(app) {
  // ---- ANNOUNCEMENTS ----
  app.get("/announcements", { preHandler: app.authorize(ALL_ROLES) }, async (req) => {
    return query(
      `SELECT a.*, u.name AS posted_by_name FROM announcements a LEFT JOIN users u ON u.id=a.posted_by
       WHERE a.school_id=:sid AND a.is_published=1 AND (a.target_role='all' OR a.target_role=:role)
         AND (a.expiry_date IS NULL OR a.expiry_date >= CURDATE())
       ORDER BY a.publish_date DESC, a.id DESC LIMIT 200`, { sid: req.user.schoolId, role: req.user.role });
  });

  app.post("/announcements", { preHandler: app.authorize([...ADMINS, "teacher"]) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO announcements (school_id, title, content, target_role, posted_by, is_published, publish_date, expiry_date, attachment)
       VALUES (:sid,:title,:content,:role,:by,:pub,:pdate,:exp,:att)`,
      { sid: req.user.schoolId, title: b.title, content: b.content, role: b.target_role || "all", by: req.user.id,
        pub: b.is_published === false ? 0 : 1, pdate: b.publish_date || new Date().toISOString().slice(0, 10), exp: b.expiry_date || null, att: b.attachment || null });
    return reply.code(201).send({ id: r.insertId });
  });

  app.delete("/announcements/:id", { preHandler: app.authorize([...ADMINS, "teacher"]) }, async (req) => {
    await query(`DELETE FROM announcements WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // ---- NOTICE BOARD ----
  registerCrud(app, {
    table: "notice_board", prefix: "/notice-board", roles: ADMINS, readRoles: ALL_ROLES,
    columns: ["title", "content", "category", "is_active", "school_id"], searchColumns: ["title"],
    orderBy: "created_at DESC", schoolScoped: true, defaults: (req) => ({ school_id: req.user.schoolId, posted_by: req.user.id }),
  });

  // ---- EVENTS ----
  registerCrud(app, {
    table: "events", prefix: "/events", roles: ADMINS, readRoles: ALL_ROLES,
    columns: ["title", "description", "event_date", "end_date", "type", "target_audience", "venue", "is_public", "school_id"],
    searchColumns: ["title", "venue"], orderBy: "event_date DESC", schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId, created_by: req.user.id }),
  });

  // ---- DOCUMENTS ----
  registerCrud(app, {
    table: "documents", prefix: "/documents", roles: STAFF_ROLES, readRoles: ALL_ROLES,
    columns: ["title", "file_url", "file_type", "file_size", "category", "related_to_id", "related_to_type", "is_public", "school_id"],
    searchColumns: ["title", "category"], orderBy: "created_at DESC", schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId, uploaded_by: req.user.id }),
  });

  // ---- NOTIFICATIONS ----
  app.get("/notifications", { preHandler: app.authenticate }, async (req) => {
    const notifications = await query(`SELECT * FROM notifications WHERE user_id=:uid ORDER BY created_at DESC LIMIT 50`, { uid: req.user.id });
    return { notifications };
  });

  app.post("/notifications/mark-read", { preHandler: app.authenticate }, async (req) => {
    const b = req.body || {};
    if (b.all) await query(`UPDATE notifications SET is_read=1 WHERE user_id=:uid`, { uid: req.user.id });
    else if (b.id) await query(`UPDATE notifications SET is_read=1 WHERE id=:id AND user_id=:uid`, { id: b.id, uid: req.user.id });
    return { success: true };
  });

  // ---- MESSAGES ----
  app.get("/messages", { preHandler: app.authenticate }, async (req) => {
    const box = req.query.box || "inbox";
    if (box === "sent") {
      return query(
        `SELECT m.*, u.name AS receiver_name FROM messages m JOIN users u ON u.id=m.receiver_id
         WHERE m.sender_id=:uid ORDER BY m.sent_at DESC LIMIT 200`, { uid: req.user.id });
    }
    return query(
      `SELECT m.*, u.name AS sender_name FROM messages m JOIN users u ON u.id=m.sender_id
       WHERE m.receiver_id=:uid ORDER BY m.sent_at DESC LIMIT 200`, { uid: req.user.id });
  });

  app.post("/messages", { preHandler: app.authenticate }, async (req, reply) => {
    const b = req.body || {};
    if (!b.receiver_id) return reply.code(400).send({ error: "receiver_id required" });
    const r = await query(
      `INSERT INTO messages (sender_id, receiver_id, subject, body, parent_message_id) VALUES (:s,:r,:sub,:body,:parent)`,
      { s: req.user.id, r: b.receiver_id, sub: b.subject || null, body: b.body || null, parent: b.parent_message_id || null });
    return reply.code(201).send({ id: r.insertId });
  });

  app.post("/messages/:id/read", { preHandler: app.authenticate }, async (req) => {
    await query(`UPDATE messages SET is_read=1 WHERE id=:id AND receiver_id=:uid`, { id: req.params.id, uid: req.user.id });
    return { success: true };
  });

  // contacts to message (staff + teachers + admins)
  app.get("/messages/contacts", { preHandler: app.authenticate }, async (req) => {
    return query(`SELECT id, name, role FROM users WHERE school_id=:sid AND id!=:uid AND is_active=1 ORDER BY name LIMIT 500`, { sid: req.user.schoolId, uid: req.user.id });
  });
}
