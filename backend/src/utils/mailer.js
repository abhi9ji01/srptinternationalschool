import nodemailer from "nodemailer";
import { query } from "../db.js";

let transporter;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

/**
 * Send an email and log the attempt to notification_logs.
 * Degrades gracefully when SMTP is not configured.
 */
export async function sendEmail({ to, subject, html, text, userId = null }) {
  const t = getTransporter();
  let status = "sent";
  let error = null;
  try {
    if (!t) {
      status = "pending";
      console.warn("[mailer] SMTP not configured — email queued only:", subject);
    } else {
      await t.sendMail({
        from: process.env.SMTP_FROM || "no-reply@school.com",
        to,
        subject,
        text: text || undefined,
        html: html || undefined,
      });
    }
  } catch (e) {
    status = "failed";
    error = e.message;
    console.error("[mailer] send failed:", e.message);
  }
  try {
    await query(
      `INSERT INTO notification_logs (user_id, type, recipient, subject, message, status, sent_at, error_message)
       VALUES (:userId, 'email', :to, :subject, :message, :status, NOW(), :error)`,
      { userId, to, subject, message: text || html || "", status, error }
    );
  } catch (_) {}
  return { status, error };
}

export function otpEmail(otp) {
  return {
    subject: "Your password reset OTP",
    html: `<p>Your OTP for password reset is <b style="font-size:20px">${otp}</b>. It is valid for 10 minutes.</p>`,
    text: `Your OTP is ${otp}. Valid for 10 minutes.`,
  };
}

export function loginOtpEmail(otp) {
  return {
    subject: "Your login verification code",
    html: `<p>Your 2FA login code is <b style="font-size:20px">${otp}</b>. It expires in 5 minutes.</p>`,
    text: `Your login code is ${otp}.`,
  };
}
