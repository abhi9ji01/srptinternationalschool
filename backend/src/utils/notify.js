import { query } from "../db.js";
import { sendSMS } from "./sms.js";
import { sendEmail } from "./mailer.js";

/** Create an in-app notification (bell icon). */
export async function notify({ userId, title, message, type = "info", link = null }) {
  if (!userId) return;
  await query(
    `INSERT INTO notifications (user_id, title, message, type, link) VALUES (:userId, :title, :message, :type, :link)`,
    { userId, title, message, type, link }
  );
}

/** Notify many users at once. */
export async function notifyMany(userIds, payload) {
  await Promise.all((userIds || []).filter(Boolean).map((id) => notify({ ...payload, userId: id })));
}

/**
 * Compose an absence alert to the parent: in-app + SMS.
 */
export async function notifyAbsence({ studentId, studentName, date }) {
  const parents = await query(
    `SELECT u.id AS user_id, u.phone FROM parents p JOIN users u ON u.id = p.user_id WHERE p.student_id = :sid`,
    { sid: studentId }
  );
  const msg = `Dear Parent, your ward ${studentName} was marked ABSENT on ${date}. - School`;
  for (const p of parents) {
    await notify({ userId: p.user_id, title: "Absence Alert", message: msg, type: "attendance" });
    if (p.phone) await sendSMS({ to: p.phone, message: msg, userId: p.user_id });
  }
}

/** Low attendance warning to student + parents. */
export async function notifyLowAttendance({ studentUserId, parentUserIds, studentName, percent }) {
  const msg = `Low attendance warning: ${studentName} is at ${percent}% (below threshold). Please ensure regular attendance.`;
  await notify({ userId: studentUserId, title: "Low Attendance", message: msg, type: "attendance" });
  await notifyMany(parentUserIds, { title: "Low Attendance", message: msg, type: "attendance" });
}

/** Overdue fee reminder to parents (in-app + SMS + email). */
export async function notifyFeeOverdue({ studentId, studentName, amount }) {
  const parents = await query(
    `SELECT u.id AS user_id, u.phone, u.email FROM parents p JOIN users u ON u.id = p.user_id WHERE p.student_id = :sid`,
    { sid: studentId }
  );
  const msg = `Fee Overdue: An invoice of Rs.${amount} for ${studentName} is overdue. Kindly pay at the earliest.`;
  for (const p of parents) {
    await notify({ userId: p.user_id, title: "Fee Overdue", message: msg, type: "fee", link: "/parent/fees" });
    if (p.phone) await sendSMS({ to: p.phone, message: msg, userId: p.user_id });
    if (p.email) await sendEmail({ to: p.email, subject: "Fee Overdue Reminder", text: msg, userId: p.user_id });
  }
}
