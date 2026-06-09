"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap, ArrowRight, BookOpen, CalendarCheck, CreditCard, Bus,
  MessageSquare, ShieldCheck, MapPin, Phone, Mail, Globe, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { API_URL } from "@/lib/api";

const FALLBACK = { name: "SRPT International School", primary_color: "#2563eb", secondary_color: "#1e293b" };

const FEATURES = [
  { icon: CalendarCheck, title: "Attendance & Timetable", desc: "Daily attendance, QR check-in, and class scheduling." },
  { icon: BookOpen, title: "Exams & Report Cards", desc: "Marks entry, grading, and printable report cards." },
  { icon: CreditCard, title: "Fees & Payments", desc: "Invoices, online payments, and receipts." },
  { icon: Bus, title: "Transport & Hostel", desc: "Routes, vehicles, room allocation, and more." },
  { icon: MessageSquare, title: "Real-time Chat", desc: "Instant messaging between staff and management." },
  { icon: ShieldCheck, title: "Roles & Security", desc: "13 role-based dashboards with secure access." },
];

export default function Home() {
  const { user, homeFor } = useAuth();
  const [school, setSchool] = useState(FALLBACK);

  useEffect(() => {
    fetch(`${API_URL}/public/school-info`)
      .then((r) => r.json())
      .then((d) => { if (d && d.name) setSchool({ ...FALLBACK, ...d }); })
      .catch(() => {});
  }, []);

  const primary = school.primary_color || FALLBACK.primary_color;
  const secondary = school.secondary_color || FALLBACK.secondary_color;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {school.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.logo_url} alt="logo" className="h-9 w-9 rounded object-contain" />
            ) : <GraduationCap className="h-8 w-8" style={{ color: primary }} />}
            <span className="font-bold">{school.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/test-credentials">Test Credentials</Link></Button>
            {user ? (
              <Button asChild size="sm" style={{ backgroundColor: primary }}><Link href={homeFor(user.role)}>Dashboard</Link></Button>
            ) : (
              <Button asChild size="sm" style={{ backgroundColor: primary }}><Link href="/login">Sign in</Link></Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center text-white sm:py-28">
          {school.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logo_url} alt="logo" className="mx-auto mb-6 h-20 w-20 rounded-xl bg-white/90 object-contain p-1.5" />
          ) : <GraduationCap className="mx-auto mb-6 h-16 w-16" />}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{school.name}</h1>
          {school.affiliation_board && (
            <p className="mt-2 text-sm uppercase tracking-widest opacity-80">Affiliated to {school.affiliation_board}</p>
          )}
          <p className="mx-auto mt-5 max-w-2xl text-lg opacity-90">
            A complete School Management System — academics, attendance, exams, fees, transport,
            hostel, HR, communication and more, all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90">
              <Link href="/login">Sign in to your dashboard <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/60 bg-transparent text-white hover:bg-white/10">
              <Link href="/test-credentials"><KeyRound className="h-4 w-4" /> View Test Credentials</Link>
            </Button>
          </div>
          {(school.established_year || school.principal_name) && (
            <p className="mt-6 text-sm opacity-75">
              {school.established_year ? `Established ${school.established_year}` : ""}
              {school.established_year && school.principal_name ? " · " : ""}
              {school.principal_name ? `Principal: ${school.principal_name}` : ""}
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold">Everything your school needs</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: `${primary}1a`, color: primary }}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact / footer */}
      <footer style={{ background: secondary }} className="text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              {school.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={school.logo_url} alt="logo" className="h-8 w-8 rounded bg-white/90 object-contain p-0.5" />
              ) : <GraduationCap className="h-7 w-7" />}
              <span className="text-lg font-bold">{school.name}</span>
            </div>
            <p className="mt-3 max-w-sm text-sm opacity-80">
              Empowering students, teachers and parents with a modern, unified school platform.
            </p>
          </div>
          <div className="space-y-2 text-sm opacity-90">
            {school.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> {school.address}</p>}
            {school.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {school.phone}</p>}
            {school.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {school.email}</p>}
            {school.website && (
              <p className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0" />
                <a href={school.website} target="_blank" rel="noreferrer" className="hover:underline">{school.website}</a>
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-xs opacity-70">
          © {school.name} · School Management System
        </div>
      </footer>
    </div>
  );
}
