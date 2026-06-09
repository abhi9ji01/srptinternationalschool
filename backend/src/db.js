import mysql from "mysql2/promise";

// Single shared connection pool (mysql2, raw queries — no ORM)
let pool;
export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST || "localhost",
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "school_management",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: false,
      dateStrings: true,
      namedPlaceholders: true,
    });
  }
  return pool;
}

/**
 * Run a parameterized query. Returns rows (SELECT) or result meta (INSERT/UPDATE).
 * @param {string} sql
 * @param {Array|Object} params
 */
export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/** Convenience: returns first row or null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length ? rows[0] : null;
}

/** Run a function inside a transaction. */
export async function transaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
