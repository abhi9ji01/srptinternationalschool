"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, clearToken, setUserCookie, getStoredUser, getToken } from "./api";
import { ROLE_HOME } from "./constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    // Revalidate against the backend if a token exists.
    if (getToken()) {
      api.get("/auth/me").then((d) => {
        if (d.user) {
          setUser(d.user);
          setUserCookie(d.user);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, extra = {}) => {
    const data = await api.post("/auth/login", { email, password, ...extra });
    if (data.twoFactor && !data.token) {
      return { twoFactor: true, message: data.message };
    }
    setToken(data.token);
    setUserCookie(data.user);
    setUser(data.user);
    return { user: data.user };
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, homeFor: (r) => ROLE_HOME[r] || "/login" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
