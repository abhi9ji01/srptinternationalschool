"use client";
// Simple localStorage cart for the school shop.
const KEY = "shop_cart";

export function getCart() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-changed"));
}

export function addToCart(item) {
  const cart = getCart();
  // Same product + size → bump quantity.
  const idx = cart.findIndex((c) => c.product_id === item.product_id && (c.size || null) === (item.size || null));
  if (idx >= 0) cart[idx].quantity += item.quantity || 1;
  else cart.push({ ...item, quantity: item.quantity || 1 });
  save(cart);
}

export function updateCart(index, patch) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index] = { ...cart[index], ...patch };
  save(cart);
}

export function removeFromCart(index) {
  const cart = getCart().filter((_, i) => i !== index);
  save(cart);
}

export function clearCart() { save([]); }

export function cartCount() {
  return getCart().reduce((n, c) => n + (Number(c.quantity) || 0), 0);
}
