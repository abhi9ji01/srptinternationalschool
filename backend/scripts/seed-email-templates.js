import "dotenv/config";
import mysql from "mysql2/promise";

/** Seed 5 default email templates for every school that has none. */
const TEMPLATES = [
  {
    name: "Welcome - Student", type: "welcome",
    subject: "Welcome to {{school_name}}",
    variables: ["school_name", "school_logo", "student_name", "login_url", "password"],
    html_body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <div style="text-align:center"><img src="{{school_logo}}" alt="logo" style="max-height:70px"/></div>
  <h2 style="color:#2563eb">Welcome to {{school_name}}!</h2>
  <p>Dear {{student_name}},</p>
  <p>Your account has been created. You can log in using the credentials below:</p>
  <ul><li><b>Login URL:</b> {{login_url}}</li><li><b>Temporary Password:</b> {{password}}</li></ul>
  <p>Please change your password after your first login.</p>
  <p>Warm regards,<br/>{{school_name}}</p>
</div>`,
  },
  {
    name: "Fee Reminder", type: "fee_reminder",
    subject: "Fee Due Reminder - {{school_name}}",
    variables: ["school_name", "parent_name", "student_name", "fee_amount", "due_date", "login_url"],
    html_body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#dc2626">Fee Payment Reminder</h2>
  <p>Dear {{parent_name}},</p>
  <p>This is a reminder that a fee of <b>{{fee_amount}}</b> for {{student_name}} is due on <b>{{due_date}}</b>.</p>
  <p><a href="{{login_url}}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Pay Now</a></p>
  <p>Regards,<br/>{{school_name}}</p>
</div>`,
  },
  {
    name: "Attendance Alert", type: "attendance_alert",
    subject: "Attendance Alert for {{student_name}}",
    variables: ["student_name", "parent_name", "current_date", "school_name"],
    html_body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#d97706">Attendance Alert</h2>
  <p>Dear {{parent_name}},</p>
  <p>Your ward <b>{{student_name}}</b> was marked <b>absent</b> on {{current_date}}.</p>
  <p>If this is unexpected, please contact the school office.</p>
  <p>Regards,<br/>{{school_name}}</p>
</div>`,
  },
  {
    name: "Marks Published", type: "marks_published",
    subject: "Exam Results Published",
    variables: ["student_name", "subject_name", "marks_obtained", "total_marks", "grade", "login_url", "school_name"],
    html_body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#16a34a">Results Published</h2>
  <p>Dear {{student_name}},</p>
  <p>Your results have been published. Summary for {{subject_name}}:</p>
  <p style="font-size:18px"><b>{{marks_obtained}}/{{total_marks}}</b> — Grade <b>{{grade}}</b></p>
  <p><a href="{{login_url}}">View your full report card</a></p>
  <p>Regards,<br/>{{school_name}}</p>
</div>`,
  },
  {
    name: "Password Reset", type: "password_reset",
    subject: "Your Login Credentials",
    variables: ["student_name", "password", "login_url", "school_name"],
    html_body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#2563eb">Your Login Credentials</h2>
  <p>Dear {{student_name}},</p>
  <p>Your password has been reset. Use the following to sign in:</p>
  <ul><li><b>New Password:</b> {{password}}</li><li><b>Login URL:</b> {{login_url}}</li></ul>
  <p>Regards,<br/>{{school_name}}</p>
</div>`,
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "school_management",
  });

  const [schools] = await conn.query(`SELECT id FROM schools`);
  let seeded = 0;
  for (const s of schools) {
    const [existing] = await conn.query(`SELECT COUNT(*) AS n FROM email_templates WHERE school_id=?`, [s.id]);
    if (existing[0].n > 0) { console.log(`· school ${s.id} already has templates, skipping`); continue; }
    for (const t of TEMPLATES) {
      await conn.query(
        `INSERT INTO email_templates (school_id, name, subject, type, html_body, variables) VALUES (?,?,?,?,?,?)`,
        [s.id, t.name, t.subject, t.type, t.html_body, JSON.stringify(t.variables)]
      );
    }
    seeded++;
    console.log(`✓ seeded 5 templates for school ${s.id}`);
  }
  await conn.end();
  console.log(`\nDone. Seeded ${seeded} school(s).`);
  process.exit(0);
}

main().catch((e) => { console.error("Seed failed:", e.message); process.exit(1); });
