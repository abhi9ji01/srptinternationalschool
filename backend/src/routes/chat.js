import { query, queryOne } from "../db.js";
import { canChat } from "../socket/chat.js";

const CHAT_ROLES = ["super_admin", "admin", "teacher", "hr_manager", "transport_manager",
  "hostel_warden", "canteen_manager", "health_officer", "librarian", "accountant", "security_guard"];

export default async function chatRoutes(app) {
  const isOnline = (id) => Boolean(app.onlineUsers && app.onlineUsers.has(Number(id)));

  // Contacts: who the current user is allowed to chat with, with presence + unread.
  app.get("/chat/contacts", { preHandler: app.authorize(CHAT_ROLES) }, async (req) => {
    const sid = req.user.schoolId;
    // Roles this user may message — derived from canChat() so the list and the
    // send-gate can never disagree.
    const targetRoles = CHAT_ROLES.filter((r) => canChat(req.user.role, r));
    const roleParams = {};
    targetRoles.forEach((r, i) => { roleParams[`cr${i}`] = r; });
    const roleClause = targetRoles.length
      ? `u.role IN (${targetRoles.map((_, i) => `:cr${i}`).join(",")})`
      : `1=0`;
    const rows = await query(
      `SELECT u.id, u.name, u.role, u.profile_photo,
              cc.last_message_at, COALESCE(cc.unread_count,0) AS unread_count,
              (SELECT message FROM chat_messages m
                 WHERE (m.sender_id=u.id AND m.receiver_id=:me) OR (m.sender_id=:me AND m.receiver_id=u.id)
                 ORDER BY m.id DESC LIMIT 1) AS last_message
       FROM users u
       LEFT JOIN chat_contacts cc ON cc.user_id=:me AND cc.contact_id=u.id
       WHERE u.school_id=:sid AND u.id<>:me AND u.is_active=1 AND ${roleClause}
       ORDER BY cc.last_message_at IS NULL, cc.last_message_at DESC, u.name`,
      { me: req.user.id, sid, ...roleParams });
    const contacts = rows
      .filter((r) => canChat(req.user.role, r.role))
      .map((r) => ({ ...r, is_online: isOnline(r.id) }));
    return { data: contacts, total: contacts.length };
  });

  // Conversation with :userId (paginated, newest-last). Marks incoming as read.
  app.get("/chat/messages/:userId", { preHandler: app.authorize(CHAT_ROLES) }, async (req, reply) => {
    const other = await queryOne(`SELECT id, role FROM users WHERE id=:id AND school_id=:sid`, { id: req.params.userId, sid: req.user.schoolId });
    if (!other) return reply.code(404).send({ error: "User not found" });
    if (!canChat(req.user.role, other.role)) return reply.code(403).send({ error: "Not allowed to chat with this user" });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, parseInt(req.query.limit || "50", 10));
    const offset = (page - 1) * limit;
    const rows = await query(
      `SELECT id, sender_id, receiver_id, message, type, file_url, is_read, read_at, created_at
       FROM chat_messages
       WHERE (sender_id=:me AND receiver_id=:other) OR (sender_id=:other AND receiver_id=:me)
       ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`,
      { me: req.user.id, other: other.id });

    // Mark messages from the other user as read + reset the unread counter.
    await query(`UPDATE chat_messages SET is_read=1, read_at=NOW() WHERE receiver_id=:me AND sender_id=:other AND is_read=0`,
      { me: req.user.id, other: other.id });
    await query(`UPDATE chat_contacts SET unread_count=0 WHERE user_id=:me AND contact_id=:other`,
      { me: req.user.id, other: other.id });

    return { data: rows.reverse(), page, limit };
  });

  // Total unread (for the navbar badge).
  app.get("/chat/unread-count", { preHandler: app.authorize(CHAT_ROLES) }, async (req) => {
    const r = await queryOne(`SELECT COUNT(*) AS n FROM chat_messages WHERE receiver_id=:me AND is_read=0`, { me: req.user.id });
    return { unread: Number(r?.n || 0) };
  });
}
