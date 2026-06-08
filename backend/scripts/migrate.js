import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const dbName = process.env.DATABASE_NAME || "school_management";
  const base = {
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    multipleStatements: true,
  };

  // 1. Ensure database exists
  const root = await mysql.createConnection(base);
  await root.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await root.end();
  console.log(`✓ Database "${dbName}" ready`);

  // 2. Run schema
  const conn = await mysql.createConnection({ ...base, database: dbName });
  const schema = fs.readFileSync(path.join(__dirname, "..", "sql", "schema.sql"), "utf8");
  await conn.query(schema);
  await conn.end();
  console.log("✓ Schema applied (all tables created)");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
