import crypto from "crypto";

let instance;

/** Lazily create a Razorpay instance; null when keys missing. */
export function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  if (!instance) {
    const Razorpay = require("razorpay");
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

/** Create an order (amount in rupees → converted to paise). */
export async function createOrder({ amount, receipt, notes = {} }) {
  const rp = getRazorpay();
  if (!rp) throw new Error("Razorpay keys are not configured");
  return rp.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency: "INR",
    receipt,
    notes,
  });
}

/** Verify the checkout signature server-side. */
export function verifySignature({ orderId, paymentId, signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

/** Verify a webhook payload signature. */
export function verifyWebhook(body, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}
