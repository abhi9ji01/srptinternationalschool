"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "sms_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  // Mirror to a cookie so Next.js middleware can guard routes.
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("sms_user");
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `sms_role=; path=/; max-age=0`;
}

export function setUserCookie(user) {
  if (typeof window === "undefined" || !user) return;
  localStorage.setItem("sms_user", JSON.stringify(user));
  document.cookie = `sms_role=${user.role}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("sms_user"));
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body, headers = {}, isForm = false } = {}) {
  const token = getToken();
  const opts = { method, headers: { ...headers } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    if (isForm) opts.body = body; // FormData
    else {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${API_URL}${path}`, opts);
  if (res.status === 401 && typeof window !== "undefined" && !path.includes("/auth/login")) {
    clearToken();
    if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data;
  }
  if (!res.ok) throw new Error("Request failed");
  return res; // for blobs (downloads)
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", body: formData, isForm: true }),
  // download a file (returns Response so caller can blob())
  download: async (path, filename) => {
    const res = await request(path);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    a.click();
    URL.revokeObjectURL(url);
  },
};

export { API_URL };
