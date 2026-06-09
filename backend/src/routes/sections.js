import { query, queryOne } from "../db.js";
import { audit, reqMeta } from "../utils/audit.js";
import { ADMINS } from "../config.js";

/**
 * Class sections CRUD.
 *
 * NOTE: in this schema `sections.class_teacher_id` references `users(id)`
 * (not teachers.id) — consistent with the existing teacher-assignment flow —
 * so the frontend passes a teacher's user_id here.
 */
export default async function sectionRoutes(app) {
  // Confirm the class belongs to the caller's school; returns the row or null.
  async function ownedClass(classId, schoolId) {
    return queryOne(`SELECT * FROM classes WHERE id=:id AND school_id=:sid`, { id: classId, sid: schoolId });
  }

  // NOTE: the LIST route `GET /classes/:id/sections` already exists in
  // academics.js (returns class_teacher_name + student_count) and is reused
  // by the frontend. It is intentionally NOT redefined here to avoid a
  // duplicate-route error at boot.

  // CREATE section
  app.post("/classes/:classId/sections", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const cls = await ownedClass(req.params.classId, req.user.schoolId);
    if (!cls) return reply.code(404).send({ error: "Class not found" });
    const b = req.body || {};
    const name = (b.name || "").trim();
    if (!name) return reply.code(400).send({ error: "Section name is required" });

    const dup = await queryOne(
      `SELECT id FROM sections WHERE class_id=:cid AND name=:name`,
      { cid: req.params.classId, name }
    );
    if (dup) return reply.code(409).send({ error: `Section "${name}" already exists in this class` });

    try {
      const r = await query(
        `INSERT INTO sections (class_id, name, capacity, class_teacher_id)
         VALUES (:cid, :name, :cap, :ct)`,
        { cid: req.params.classId, name, cap: b.capacity || 40, ct: b.class_teacher_id || null }
      );
      await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "create", module: "sections", recordId: r.insertId, newValue: { class_id: cls.id, name } });
      return reply.code(201).send(await queryOne(`SELECT * FROM sections WHERE id=:id`, { id: r.insertId }));
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") return reply.code(409).send({ error: `Section "${name}" already exists in this class` });
      throw e;
    }
  });

  // UPDATE section
  app.put("/classes/:classId/sections/:sectionId", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const cls = await ownedClass(req.params.classId, req.user.schoolId);
    if (!cls) return reply.code(404).send({ error: "Class not found" });
    const sec = await queryOne(`SELECT * FROM sections WHERE id=:id AND class_id=:cid`, { id: req.params.sectionId, cid: req.params.classId });
    if (!sec) return reply.code(404).send({ error: "Section not found" });
    const b = req.body || {};

    if (b.name !== undefined && b.name.trim() && b.name.trim() !== sec.name) {
      const dup = await queryOne(`SELECT id FROM sections WHERE class_id=:cid AND name=:name AND id<>:id`,
        { cid: req.params.classId, name: b.name.trim(), id: req.params.sectionId });
      if (dup) return reply.code(409).send({ error: `Section "${b.name.trim()}" already exists in this class` });
    }

    const set = [], p = { id: req.params.sectionId };
    if (b.name !== undefined && b.name.trim()) { set.push("name=:name"); p.name = b.name.trim(); }
    if (b.capacity !== undefined) { set.push("capacity=:cap"); p.cap = b.capacity || 40; }
    if (b.class_teacher_id !== undefined) { set.push("class_teacher_id=:ct"); p.ct = b.class_teacher_id || null; }
    if (set.length) {
      try {
        await query(`UPDATE sections SET ${set.join(", ")} WHERE id=:id`, p);
      } catch (e) {
        if (e.code === "ER_DUP_ENTRY") return reply.code(409).send({ error: "Section name already exists in this class" });
        throw e;
      }
    }
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "update", module: "sections", recordId: Number(req.params.sectionId), oldValue: sec });
    return queryOne(`SELECT * FROM sections WHERE id=:id`, { id: req.params.sectionId });
  });

  // DELETE section (blocked if students are enrolled)
  app.delete("/classes/:classId/sections/:sectionId", { preHandler: app.authorize(ADMINS) }, async (req, reply) => {
    const cls = await ownedClass(req.params.classId, req.user.schoolId);
    if (!cls) return reply.code(404).send({ error: "Class not found" });
    const sec = await queryOne(`SELECT * FROM sections WHERE id=:id AND class_id=:cid`, { id: req.params.sectionId, cid: req.params.classId });
    if (!sec) return reply.code(404).send({ error: "Section not found" });

    const cnt = await queryOne(`SELECT COUNT(*) AS n FROM students WHERE section_id=:id`, { id: req.params.sectionId });
    if (cnt && Number(cnt.n) > 0) {
      return reply.code(409).send({ error: "Cannot delete section with enrolled students. Reassign students first.", student_count: Number(cnt.n) });
    }
    await query(`DELETE FROM sections WHERE id=:id`, { id: req.params.sectionId });
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "delete", module: "sections", recordId: Number(req.params.sectionId), oldValue: sec });
    return { success: true };
  });
}
