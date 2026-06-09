import { Server } from "socket.io";
import { query, queryOne } from "../db.js";

// Leadership can reach every staff member (and be reached by them).
export const CHAT_LEADERSHIP = ["super_admin", "admin", "hr_manager"];

/**
 * Chat hierarchy (staff-only; students/parents use Messages/announcements):
 *   • Leadership (super_admin, admin, hr_manager) ↔ ANY staff member.
 *   • Any staff member ↔ leadership (everyone can reach Admin & HR).
 *   • Same-role peers ↔ each other (e.g. teacher↔teacher).
 * Single source of truth for both the socket gate and the REST contact list.
 */
export function canChat(a, b) {
  const isStaff = (r) => !["student", "parent"].includes(r);
  if (!isStaff(a) || !isStaff(b)) return false;
  if (CHAT_LEADERSHIP.includes(a) || CHAT_LEADERSHIP.includes(b)) return true;
  return a === b; // same-role peers
}

/**
 * Attach Socket.io to the Fastify server and wire chat handlers.
 * Decorates the app with `io` and `onlineUsers` (Map<userId, Set<socketId>>)
 * so REST routes can read presence.
 */
export function initChat(app) {
  const io = new Server(app.server, {
    cors: {
      origin: (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
      credentials: true,
    },
  });

  const onlineUsers = new Map(); // userId -> Set<socketId>
  app.decorate("io", io);
  app.decorate("onlineUsers", onlineUsers);

  const addOnline = (userId, socketId) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
    return onlineUsers.get(userId).size === 1; // first connection → newly online
  };
  const removeOnline = (userId, socketId) => {
    const set = onlineUsers.get(userId);
    if (!set) return false;
    set.delete(socketId);
    if (set.size === 0) { onlineUsers.delete(userId); return true; } // last connection → offline
    return false;
  };
  const emitToUser = (userId, event, payload) => {
    const set = onlineUsers.get(userId);
    if (set) for (const sid of set) io.to(sid).emit(event, payload);
  };

  io.on("connection", (socket) => {
    let user = null;

    async function authenticate(token) {
      try {
        const payload = app.jwt.verify(token);
        user = { id: payload.id, role: payload.role, schoolId: payload.schoolId, name: payload.name };
        socket.join(`user:${user.id}`);
        const newlyOnline = addOnline(user.id, socket.id);
        socket.emit("authenticated", { user_id: user.id, role: user.role });
        socket.emit("online_users", { user_ids: [...onlineUsers.keys()] });
        if (newlyOnline) socket.broadcast.emit("user_online", { user_id: user.id });
      } catch {
        socket.emit("auth_error", { error: "Invalid token" });
        socket.disconnect(true);
      }
    }

    // Token may arrive via handshake auth or an explicit event.
    if (socket.handshake.auth?.token) authenticate(socket.handshake.auth.token);
    socket.on("authenticate", (data) => authenticate(data?.token));

    socket.on("send_message", async (data, ack) => {
      if (!user) return;
      const toId = Number(data?.to_user_id);
      const text = (data?.message || "").toString().trim();
      if (!toId || !text) return;
      const recipient = await queryOne(`SELECT id, role, school_id FROM users WHERE id=:id`, { id: toId });
      if (!recipient || !canChat(user.role, recipient.role)) {
        socket.emit("chat_error", { error: "You are not allowed to message this user" });
        return;
      }
      const sid = user.schoolId || recipient.school_id;
      const r = await query(
        `INSERT INTO chat_messages (school_id, sender_id, receiver_id, message, type, file_url)
         VALUES (:sid,:from,:to,:msg,:type,:file)`,
        { sid, from: user.id, to: toId, msg: text, type: data.type || "text", file: data.file_url || null });

      // Maintain contact rollups for both directions.
      await query(
        `INSERT INTO chat_contacts (school_id, user_id, contact_id, last_message_at, unread_count)
         VALUES (:sid,:u,:c,NOW(),0) ON DUPLICATE KEY UPDATE last_message_at=NOW()`,
        { sid, u: user.id, c: toId });
      await query(
        `INSERT INTO chat_contacts (school_id, user_id, contact_id, last_message_at, unread_count)
         VALUES (:sid,:u,:c,NOW(),1) ON DUPLICATE KEY UPDATE last_message_at=NOW(), unread_count=unread_count+1`,
        { sid, u: toId, c: user.id });

      const message = {
        id: r.insertId, sender_id: user.id, receiver_id: toId, message: text,
        type: data.type || "text", file_url: data.file_url || null, is_read: false,
        created_at: new Date().toISOString(),
      };
      emitToUser(toId, "receive_message", message);
      socket.emit("receive_message", message); // echo to sender (other tabs + self)
      if (typeof ack === "function") ack(message);
    });

    socket.on("typing", (data) => { if (user && data?.to_user_id) emitToUser(Number(data.to_user_id), "typing_indicator", { from_user_id: user.id, is_typing: true }); });
    socket.on("stop_typing", (data) => { if (user && data?.to_user_id) emitToUser(Number(data.to_user_id), "typing_indicator", { from_user_id: user.id, is_typing: false }); });

    socket.on("mark_read", async (data) => {
      if (!user || !Array.isArray(data?.message_ids) || !data.message_ids.length) return;
      const ids = data.message_ids.map(Number).filter(Boolean);
      if (!ids.length) return;
      const ph = ids.map((_, i) => `:m${i}`).join(",");
      const p = { uid: user.id }; ids.forEach((id, i) => { p[`m${i}`] = id; });
      await query(`UPDATE chat_messages SET is_read=1, read_at=NOW() WHERE id IN (${ph}) AND receiver_id=:uid`, p);
      // Notify the senders.
      const rows = await query(`SELECT DISTINCT sender_id FROM chat_messages WHERE id IN (${ph})`, p);
      for (const row of rows) emitToUser(row.sender_id, "read_receipt", { message_ids: ids, read_by: user.id });
    });

    socket.on("disconnect", () => {
      if (!user) return;
      const offline = removeOnline(user.id, socket.id);
      if (offline) socket.broadcast.emit("user_offline", { user_id: user.id });
    });
  });

  return io;
}
