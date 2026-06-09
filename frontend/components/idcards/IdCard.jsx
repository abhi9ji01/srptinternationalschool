"use client";
import { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

/**
 * Printable ID card (credit-card size 85mm × 54mm).
 * Props: card (data from /id-cards/...), style ("style1" vertical | "style2" horizontal).
 * Works for both student and teacher cards (card.type).
 */
const IdCard = forwardRef(function IdCard({ card, style = "style1" }, ref) {
  if (!card) return null;
  const school = card.school || {};
  const primary = school.primary_color || "#2563eb";
  const secondary = school.secondary_color || "#1e293b";
  const isStudent = card.type === "student";

  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");
  const Photo = ({ size }) => (
    <div style={{ width: size, height: size }} className="rounded bg-white/90 overflow-hidden border flex items-center justify-center shrink-0">
      {card.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.photo_url} alt="photo" crossOrigin="anonymous" className="h-full w-full object-cover" />
      ) : <span className="text-[8px] text-slate-400">PHOTO</span>}
    </div>
  );
  const Logo = ({ size }) =>
    school.logo_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={school.logo_url} alt="logo" crossOrigin="anonymous" style={{ width: size, height: size }} className="object-contain bg-white/90 rounded" />
    ) : null;

  // Vertical — 85mm wide × 134mm? No: spec is 85×54 but vertical layout. We keep
  // a portrait-ish card at ~204px × ~320px for readability.
  if (style === "style1") {
    return (
      <div ref={ref} className="bg-white text-slate-800" style={{ width: 280, fontFamily: "Arial, sans-serif" }}>
        <div className="flex items-center gap-2 p-3" style={{ background: primary, color: "#fff" }}>
          <Logo size={34} />
          <div className="leading-tight">
            <p className="font-bold text-sm">{school.school_name}</p>
            <p className="text-[10px] opacity-90">{isStudent ? "Student ID Card" : "Staff ID Card"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 px-4 py-3">
          <Photo size={84} />
          <p className="font-bold text-base text-center leading-tight">{card.name}</p>
          <div className="w-full text-[11px] space-y-0.5">
            {isStudent ? (
              <>
                <Row k="Class" v={`${card.class_name || "—"}${card.section_name ? `-${card.section_name}` : ""}`} />
                <Row k="Roll No" v={card.roll_number} />
                <Row k="Adm No" v={card.admission_number} />
                <Row k="DOB" v={fmt(card.dob)} />
                <Row k="Blood" v={card.blood_group} />
                <Row k="Phone" v={card.guardian_phone} />
              </>
            ) : (
              <>
                <Row k="Emp ID" v={card.employee_id} />
                <Row k="Designation" v={card.designation} />
                <Row k="Department" v={card.department} />
                <Row k="Joined" v={fmt(card.joining_date)} />
                <Row k="Phone" v={card.phone} />
              </>
            )}
          </div>
          <QRCodeCanvas value={card.qr_value || String(card.id)} size={56} />
        </div>
        <div className="px-3 py-1.5 text-center text-[10px]" style={{ background: secondary, color: "#fff" }}>
          {isStudent ? `Valid: ${card.academic_year || "—"}` : school.phone || school.school_name}
        </div>
      </div>
    );
  }

  // Horizontal — landscape 85mm × 54mm (~ 360px × 228px)
  return (
    <div ref={ref} className="bg-white text-slate-800 flex" style={{ width: 360, height: 228, fontFamily: "Arial, sans-serif" }}>
      <div className="flex flex-col items-center justify-between gap-2 p-3" style={{ background: primary, color: "#fff", width: 120 }}>
        <Photo size={72} />
        <QRCodeCanvas value={card.qr_value || String(card.id)} size={56} />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `3px solid ${secondary}` }}>
          <Logo size={26} />
          <p className="font-bold text-xs leading-tight">{school.school_name}</p>
        </div>
        <div className="flex-1 px-3 py-2 text-[11px] space-y-0.5">
          <p className="font-bold text-sm mb-1">{card.name}</p>
          {isStudent ? (
            <>
              <Row k="Class" v={`${card.class_name || "—"}${card.section_name ? `-${card.section_name}` : ""}`} />
              <Row k="Roll" v={card.roll_number} />
              <Row k="Adm No" v={card.admission_number} />
              <Row k="Blood" v={card.blood_group} />
              <Row k="Phone" v={card.guardian_phone} />
            </>
          ) : (
            <>
              <Row k="Emp ID" v={card.employee_id} />
              <Row k="Designation" v={card.designation} />
              <Row k="Department" v={card.department} />
              <Row k="Phone" v={card.phone} />
            </>
          )}
        </div>
        <div className="px-3 py-1 text-[9px] text-center" style={{ background: secondary, color: "#fff" }}>
          {isStudent ? `Valid: ${card.academic_year || "—"}` : (card.email || "")}
        </div>
      </div>
    </div>
  );
});

function Row({ k, v }) {
  return (
    <div className="flex gap-1">
      <span className="text-slate-500 w-[64px] shrink-0">{k}:</span>
      <span className="font-medium truncate">{v || "—"}</span>
    </div>
  );
}

export default IdCard;
