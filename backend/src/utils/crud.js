import { query, queryOne } from "../db.js";
import { audit, reqMeta } from "./audit.js";

/**
 * Register standard REST CRUD endpoints for a table.
 *
 * options:
 *   table          DB table name
 *   prefix         route prefix, e.g. "/classes"
 *   roles          roles allowed to WRITE (create/update/delete)
 *   readRoles      roles allowed to READ (defaults to roles)
 *   columns        writable columns (whitelist) for insert/update
 *   searchColumns  columns used by ?search=
 *   orderBy        default ORDER BY clause (without "ORDER BY")
 *   schoolScoped   if true, filter & set school_id from the JWT
 *   defaults       function(req) => object of forced column values on insert
 */
export function registerCrud(app, opts) {
  const {
    table,
    prefix,
    roles = [],
    readRoles = roles,
    columns = [],
    searchColumns = [],
    orderBy = "id DESC",
    schoolScoped = false,
    defaults = null,
  } = opts;

  // LIST (paginated + searchable)
  app.get(prefix, { preHandler: app.authorize(readRoles) }, async (req) => {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, parseInt(req.query.limit || "50", 10));
    const offset = (page - 1) * limit;
    const where = [];
    const params = {};

    if (schoolScoped && req.user.schoolId) {
      where.push("school_id = :schoolId");
      params.schoolId = req.user.schoolId;
    }
    if (req.query.search && searchColumns.length) {
      const ors = searchColumns.map((c, i) => `${c} LIKE :s${i}`);
      searchColumns.forEach((_, i) => (params[`s${i}`] = `%${req.query.search}%`));
      where.push(`(${ors.join(" OR ")})`);
    }
    // arbitrary equality filters: ?filter[col]=val
    if (req.query.filter && typeof req.query.filter === "object") {
      Object.entries(req.query.filter).forEach(([k, v], i) => {
        if (columns.includes(k) || ["section_id", "class_id", "student_id", "status"].includes(k)) {
          where.push(`${k} = :f${i}`);
          params[`f${i}`] = v;
        }
      });
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await query(
      `SELECT * FROM ${table} ${whereSql} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const totalRow = await queryOne(`SELECT COUNT(*) AS total FROM ${table} ${whereSql}`, params);
    return { data: rows, page, limit, total: totalRow?.total || 0 };
  });

  // GET ONE
  app.get(`${prefix}/:id`, { preHandler: app.authorize(readRoles) }, async (req, reply) => {
    const row = await queryOne(`SELECT * FROM ${table} WHERE id = :id`, { id: req.params.id });
    if (!row) return reply.code(404).send({ error: "Not found" });
    return row;
  });

  // CREATE
  app.post(prefix, { preHandler: app.authorize(roles) }, async (req, reply) => {
    const body = pick(req.body || {}, columns);
    if (schoolScoped && req.user.schoolId && columns.includes("school_id") === false) {
      // school_id forced even if not in columns whitelist
      body.school_id = req.user.schoolId;
    }
    if (defaults) Object.assign(body, defaults(req));
    const keys = Object.keys(body);
    if (!keys.length) return reply.code(400).send({ error: "No valid fields" });
    const cols = keys.join(", ");
    const placeholders = keys.map((k) => `:${k}`).join(", ");
    const result = await query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, body);
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "create", module: table, recordId: result.insertId, newValue: body });
    const created = await queryOne(`SELECT * FROM ${table} WHERE id = :id`, { id: result.insertId });
    return reply.code(201).send(created);
  });

  // UPDATE
  app.put(`${prefix}/:id`, { preHandler: app.authorize(roles) }, async (req, reply) => {
    const old = await queryOne(`SELECT * FROM ${table} WHERE id = :id`, { id: req.params.id });
    if (!old) return reply.code(404).send({ error: "Not found" });
    const body = pick(req.body || {}, columns);
    const keys = Object.keys(body);
    if (!keys.length) return reply.code(400).send({ error: "No valid fields" });
    const setSql = keys.map((k) => `${k} = :${k}`).join(", ");
    await query(`UPDATE ${table} SET ${setSql} WHERE id = :id`, { ...body, id: req.params.id });
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "update", module: table, recordId: Number(req.params.id), oldValue: old, newValue: body });
    return queryOne(`SELECT * FROM ${table} WHERE id = :id`, { id: req.params.id });
  });

  // DELETE
  app.delete(`${prefix}/:id`, { preHandler: app.authorize(roles) }, async (req, reply) => {
    const old = await queryOne(`SELECT * FROM ${table} WHERE id = :id`, { id: req.params.id });
    if (!old) return reply.code(404).send({ error: "Not found" });
    await query(`DELETE FROM ${table} WHERE id = :id`, { id: req.params.id });
    await audit({ ...reqMeta(req), schoolId: req.user.schoolId, userId: req.user.id, action: "delete", module: table, recordId: Number(req.params.id), oldValue: old });
    return { success: true };
  });
}

export function pick(obj, allowed) {
  const out = {};
  for (const k of allowed) {
    if (obj[k] !== undefined) out[k] = obj[k] === "" ? null : obj[k];
  }
  return out;
}
