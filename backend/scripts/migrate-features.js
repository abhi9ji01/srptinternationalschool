import "dotenv/config";
import mysql from "mysql2/promise";

/**
 * Idempotent migration for the new feature set (sections, passwords, cloudinary,
 * email templates, id cards, report cards, school settings, chat).
 *
 * Safe to run multiple times: every ADD COLUMN / ADD INDEX is guarded by an
 * information_schema check (MySQL has no "ADD COLUMN IF NOT EXISTS"), and new
 * tables use CREATE TABLE IF NOT EXISTS.
 *
 *   npm run db:migrate:features
 */

const dbName = process.env.DATABASE_NAME || "school_management";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: dbName,
    multipleStatements: true,
  });

  const columnExists = async (table, column) => {
    const [r] = await conn.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=? LIMIT 1`,
      [dbName, table, column]
    );
    return r.length > 0;
  };
  const indexExists = async (table, index) => {
    const [r] = await conn.query(
      `SELECT 1 FROM information_schema.statistics WHERE table_schema=? AND table_name=? AND index_name=? LIMIT 1`,
      [dbName, table, index]
    );
    return r.length > 0;
  };
  const addColumn = async (table, column, definition) => {
    if (await columnExists(table, column)) { console.log(`  · ${table}.${column} exists`); return; }
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
    console.log(`  ✓ ${table}.${column} added`);
  };
  const addIndex = async (table, index, definition) => {
    if (await indexExists(table, index)) { console.log(`  · index ${table}.${index} exists`); return; }
    try {
      await conn.query(`ALTER TABLE \`${table}\` ADD ${definition}`);
      console.log(`  ✓ index ${table}.${index} added`);
    } catch (e) {
      // A unique key can fail if existing data already violates it — warn, don't abort.
      console.warn(`  ! index ${table}.${index} skipped: ${e.message}`);
    }
  };

  console.log("Feature 1 — sections");
  await addColumn("sections", "created_at", "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  await addIndex("sections", "unique_section", "UNIQUE KEY unique_section (class_id, name)");

  console.log("Feature 2 — staff password management");
  await addColumn("users", "password_plain_temp", "password_plain_temp VARCHAR(255) DEFAULT NULL");
  await addColumn("users", "password_changed_at", "password_changed_at DATETIME DEFAULT NULL");

  console.log("Feature 3 — cloudinary uploads");
  await addColumn("users", "cloudinary_public_id", "cloudinary_public_id VARCHAR(255) DEFAULT NULL");
  await addColumn("teachers", "photo_url", "photo_url VARCHAR(500) DEFAULT NULL");
  await addColumn("teachers", "cloudinary_public_id", "cloudinary_public_id VARCHAR(255) DEFAULT NULL");
  await addColumn("students", "photo_url", "photo_url VARCHAR(500) DEFAULT NULL");
  await addColumn("students", "cloudinary_public_id", "cloudinary_public_id VARCHAR(255) DEFAULT NULL");
  await addColumn("schools", "logo_public_id", "logo_public_id VARCHAR(255) DEFAULT NULL");

  console.log("Feature 6 — report card templates");
  await addColumn("report_cards", "class_teacher_remarks", "class_teacher_remarks TEXT DEFAULT NULL");
  await addColumn("report_cards", "principal_remarks", "principal_remarks TEXT DEFAULT NULL");
  await addColumn("report_cards", "result", "result ENUM('pass','fail','promoted','detained') DEFAULT 'pass'");
  await addColumn("report_cards", "template_style", "template_style ENUM('style1','style2') DEFAULT 'style1'");

  console.log("Feature 7 — school appearance");
  await addColumn("schools", "primary_color", "primary_color VARCHAR(20) DEFAULT '#2563eb'");
  await addColumn("schools", "secondary_color", "secondary_color VARCHAR(20) DEFAULT '#1e293b'");

  console.log("Feature 4 — email templates");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      school_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      type ENUM('welcome','fee_receipt','fee_reminder','attendance_alert','marks_published',
                'exam_schedule','password_reset','announcement','custom') NOT NULL,
      html_body LONGTEXT NOT NULL,
      variables JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email_templates_school (school_id),
      FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  console.log("  ✓ email_templates ready");

  console.log("Feature 8 — chat");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      school_id INT NOT NULL,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      type ENUM('text','file','image') DEFAULT 'text',
      file_url VARCHAR(500),
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_pair (sender_id, receiver_id),
      INDEX idx_chat_receiver (receiver_id, is_read),
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS chat_contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      school_id INT NOT NULL,
      user_id INT NOT NULL,
      contact_id INT NOT NULL,
      last_message_at TIMESTAMP NULL,
      unread_count INT DEFAULT 0,
      UNIQUE KEY unique_contact (user_id, contact_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  console.log("  ✓ chat_messages + chat_contacts ready");

  await conn.end();
  console.log("\n✓ Feature migration complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Feature migration failed:", e.message);
  process.exit(1);
});
