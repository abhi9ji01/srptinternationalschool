import QRCode from "qrcode";
import crypto from "crypto";

/** Generate a unique opaque token for a student QR code. */
export function generateQrToken(studentId) {
  return `STU-${studentId}-${crypto.randomBytes(8).toString("hex")}`;
}

/** Return a data-URL PNG for the given payload. */
export async function qrDataUrl(payload) {
  return QRCode.toDataURL(String(payload), { width: 280, margin: 2 });
}
