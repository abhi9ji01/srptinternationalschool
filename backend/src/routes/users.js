import { query, queryOne } from "../db.js";
import { hashPassword } from "../utils/password.js";
import { audit, reqMeta } from "../utils/audit.js";
import { ADMINS } from "../config.js";

/**
 * Admin-managed user passwords.
 *
 * SECURITY NOTE: `password_plain_temp` deliberately stores the plaintext
 * password so an admin can copy it once and hand it to the staff member.
 * It is a one-time value: the GET endpoint clears it immediately after read.
 * This is an intentional product decision for manual credential handover and
 * is restricted to admin / super_admin only.
 */
export default async function userAdminRoutes(app) {
  // Staff directory for the password-management page.
  app.get("/admin/users", { preHandler: app.authorize(ADMINS) }, async (req) => {
    const params = { sid: req.user.schoolId };
    let extra = "";
    if (req.query.role) { extra += " AND u.role = :role"; params.role = req.query.role; }
    if (req.query.search) { extra += " AND (u.name LIKE :q OR u.email LIKE :q)"; params.q = `%${req.query.search}%`; }
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.password_changed_at,
              (u.password_plain_temp IS NOT NULL) AS has_temp_password
       FROM users u
       WHERE u.school_id = :sid AND u.role NOT IN ('student','parent') ${extra}
       ORDER BY u.role, u.name`,
      params
    );
    return { data: rows, total: rows.length };
  });

  // Set a user's password (and stash the plaintext for one-time admin retrieval).
  app.put("/admin/users/:userId/password", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const u = await queryOne(`SELECT id, name, role FROM users WHERE id=:id AND school_id=:sid`, { id: req.params.userId, sid: req.user.schoolId });
    if (!u) return reply.code(404).send({ error: "User not found" });
    // Only a super_admin may change a super_admin's password.
    if (u.role === "super_admin" && req.user.role !== "super_admin") {
      return reply.code(403).send({ error: "Admins cannot change a Super Admin's password." });
    }
    const newPassword = (req.body || {}).new_password;
    if (!newPassword || String(newPassword).length < 6) {
      return reply.code(400).send({ error: "Password must be at least 6 characters" });
    }
    const hash = await hashPassword(String(newPassword));
    await query(
      `UPDATE users SET password_hash=:h, password_plain_temp=:p, password_changed_at=NOW() WHERE id=:id`,
      { h: hash, p: String(newPassword), id: u.id }
    );
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "password_reset", module: "users", recordId: u.id, newValue: { for: u.name } });
    return { success: true, message: "Password updated" };
  });

  // One-time retrieval of the plaintext password; cleared immediately after read.
  app.get("/admin/users/:userId/password-temp", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const u = await queryOne(`SELECT id, role, password_plain_temp FROM users WHERE id=:id AND school_id=:sid`, { id: req.params.userId, sid: req.user.schoolId });
    if (!u) return reply.code(404).send({ error: "User not found" });
    if (u.role === "super_admin" && req.user.role !== "super_admin") {
      return reply.code(403).send({ error: "Admins cannot view a Super Admin's password." });
    }
    if (!u.password_plain_temp) return reply.code(404).send({ error: "No password available to view. It may have already been viewed." });
    const password = u.password_plain_temp;
    await query(`UPDATE users SET password_plain_temp=NULL WHERE id=:id`, { id: u.id });
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "password_view", module: "users", recordId: u.id });
    return { password };
  });
}
