"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken } from "@/lib/api";

const SchoolContext = createContext(null);

const FALLBACK = {
  name: "SRPT International School",
  logo_url: null,
  address: "",
  phone: "",
  email: "",
  principal_name: "",
  primary_color: "#2563eb",
  secondary_color: "#1e293b",
};

/**
 * Loads school branding once (name, logo, colors, contact) and shares it
 * across the app: navbar, report cards, ID cards, print headers, emails.
 */
export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const d = await api.get("/school-info");
      if (d && d.name) setSchool({ ...FALLBACK, ...d });
    } catch { /* keep fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SchoolContext.Provider value={{ school, loading, refresh, setSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) return { school: FALLBACK, loading: false, refresh: () => {}, setSchool: () => {} };
  return ctx;
}
