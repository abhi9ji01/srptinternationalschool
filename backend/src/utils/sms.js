import { query } from "../db.js";

let twilioClient;

function getTwilio() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  if (!twilioClient) {
    // Lazy require so the app builds without twilio configured.
    const twilio = require("twilio");
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

/**
 * Send an SMS via Twilio (or MSG91 fallback) and log it.
 * Degrades gracefully when not configured.
 */
export async function sendSMS({ to, message, userId = null }) {
  let status = "sent";
  let error = null;
  try {
    const client = getTwilio();
    if (client && process.env.TWILIO_PHONE_NUMBER) {
      await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to });
    } else if (process.env.MSG91_AUTH_KEY) {
      await sendViaMsg91(to, message);
    } else {
      status = "pending";
      console.warn("[sms] No SMS provider configured — message queued only:", to);
    }
  } catch (e) {
    status = "failed";
    error = e.message;
    console.error("[sms] send failed:", e.message);
  }
  try {
    await query(
      `INSERT INTO notification_logs (user_id, type, recipient, subject, message, status, sent_at, error_message)
       VALUES (:userId, 'sms', :to, NULL, :message, :status, NOW(), :error)`,
      { userId, to, message, status, error }
    );
  } catch (_) {}
  return { status, error };
}

async function sendViaMsg91(to, message) {
  const url = "https://api.msg91.com/api/v5/flow/";
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: process.env.MSG91_AUTH_KEY },
    body: JSON.stringify({
      sender: process.env.MSG91_SENDER_ID,
      template_id: process.env.MSG91_TEMPLATE_ID,
      recipients: [{ mobiles: to, message }],
    }),
  });
}
