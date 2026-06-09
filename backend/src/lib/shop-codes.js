import { queryOne } from "../db.js";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** SCH-{YEAR}-{RANDOM6}, e.g. SCH-2025-A3F9K2 — one per order item. */
export function generatePurchaseCode() {
  const year = new Date().getFullYear();
  let code = "";
  for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `SCH-${year}-${code}`;
}

/** ORD-{YEAR}-{6DIGITS}, e.g. ORD-2025-001234 — one per order. */
export function generateOrderNumber() {
  const year = new Date().getFullYear();
  const n = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
  return `ORD-${year}-${n}`;
}

/** Generate a purchase code guaranteed unique in shop_order_items. */
export async function uniquePurchaseCode(conn = null) {
  for (let i = 0; i < 20; i++) {
    const code = generatePurchaseCode();
    const exists = conn
      ? (await conn.execute(`SELECT id FROM shop_order_items WHERE purchase_code=?`, [code]))[0][0]
      : await queryOne(`SELECT id FROM shop_order_items WHERE purchase_code=:c`, { c: code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique purchase code");
}

/** Generate an order number guaranteed unique in shop_orders. */
export async function uniqueOrderNumber(conn = null) {
  for (let i = 0; i < 20; i++) {
    const num = generateOrderNumber();
    const exists = conn
      ? (await conn.execute(`SELECT id FROM shop_orders WHERE order_number=?`, [num]))[0][0]
      : await queryOne(`SELECT id FROM shop_orders WHERE order_number=:n`, { n: num });
    if (!exists) return num;
  }
  throw new Error("Could not generate a unique order number");
}
