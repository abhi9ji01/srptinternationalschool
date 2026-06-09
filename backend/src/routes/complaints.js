import { query, queryOne } from "../db.js";
import { notify } from "../utils/notify.js";
import { ADMINS } from "../config.js";

const MANAGERS = [...ADMINS, "hr_manager"];

export default async function complaintRoutes(app) {
  // Raise a complaint (any authenticated user).
  app.post("/complaints", { preHandler: app.authenticate }, async (req, reply) => {
    const b = req.body || {};
    if (!b.subject) return reply.code(400).send({ error: "Subject required" });
    const r = await query(
      `INSERT INTO complaints (school_id, raised_by, against_user_id, category, subject, description, priority)
       VALUES (:sid,:by,:against,:cat,:subj,:desc,:prio)`,
      { sid: req.user.schoolId, by: req.user.id, against: b.against_user_id || null, cat: b.category || null,
        subj: b.subject, desc: b.description || null, prio: b.priority || "medium" });
    // Alert managers of a new complaint.
    const mgrs = await query(
      `SELECT id FROM users WHERE school_id=:sid AND is_active=1 AND role IN ('admin','super_admin','hr_manager')`, { sid: req.user.schoolId });
    for (const m of mgrs) await notify({ userId: m.id, title: "New complaint", message: b.subject, type: "complaint", link: "/admin/complaints" });
    return reply.code(201).send({ id: r.insertId });
  });

  // List: managers see all (with ?status filter); everyone else sees their own.
  app.get("/complaints", { preHandler: app.authenticate }, async (req) => {
    const p = { sid: req.user.schoolId };
    const where = ["c.school_id=:sid"];
    if (!MANAGERS.includes(req.user.role)) { where.push("c.raised_by=:me"); p.me = req.user.id; }
    if (req.query.status) { where.push("c.status=:st"); p.st = req.query.status; }
    return query(
      `SELECT c.*, ru.name AS raised_by_name, au.name AS against_name, asg.name AS assigned_name
       FROM complaints c
       JOIN users ru ON ru.id=c.raised_by
       LEFT JOIN users au ON au.id=c.against_user_id
       LEFT JOIN users asg ON asg.id=c.assigned_to
       WHERE ${where.join(" AND ")} ORDER BY c.created_at DESC LIMIT 300`, p);
  });

  app.get("/complaints/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const c = await queryOne(
      `SELECT c.*, ru.name AS raised_by_name, au.name AS against_name, asg.name AS assigned_name
       FROM complaints c JOIN users ru ON ru.id=c.raised_by
       LEFT JOIN users au ON au.id=c.against_user_id LEFT JOIN users asg ON asg.id=c.assigned_to
       WHERE c.id=:id`, { id: req.params.id });
    if (!c) return reply.code(404).send({ error: "Not found" });
    if (!MANAGERS.includes(req.user.role) && c.raised_by !== req.user.id) return reply.code(403).send({ error: "Forbidden" });
    return c;
  });

  // Managers: update status / assignment / resolution.
  app.post("/complaints/:id/status", { preHandler: app.authorize(MANAGERS) }, async (req, reply) => {
    const b = req.body || {};
    const c = await queryOne(`SELECT * FROM complaints WHERE id=:id`, { id: req.params.id });
    if (!c) return reply.code(404).send({ error: "Not found" });
    const status = b.status || c.status;
    const resolvedAt = ["resolved", "closed"].includes(status) ? new Date().toISOString().slice(0, 19).replace("T", " ") : null;
    await query(
      `UPDATE complaints SET status=:st, assigned_to=:asg, resolution=:res, resolved_at=:ra WHERE id=:id`,
      { st: status, asg: b.assigned_to ?? c.assigned_to, res: b.resolution ?? c.resolution, ra: resolvedAt, id: req.params.id });
    await notify({ userId: c.raised_by, title: `Complaint ${status}`, message: `Your complaint "${c.subject}" is now ${status}.`, type: "complaint", link: "/complaints" });
    return { success: true };
  });
}
