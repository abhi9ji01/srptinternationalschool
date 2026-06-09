"use client";
import { forwardRef } from "react";

function gradeColor(g = "") {
  const x = g.toUpperCase();
  if (x.startsWith("A")) return "#16a34a";
  if (x.startsWith("B")) return "#2563eb";
  if (x.startsWith("C")) return "#d97706";
  if (x.startsWith("D")) return "#ea580c";
  return "#dc2626";
}
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

/**
 * Printable report card. Props:
 *   data: { student, school, subjects[], overall }
 *   style: "style1" (Classic) | "style2" (Modern)
 */
const ReportCard = forwardRef(function ReportCard({ data, style = "style1" }, ref) {
  if (!data) return null;
  const { student = {}, school = {}, subjects = [], overall = {} } = data;
  const primary = school.primary_color || "#2563eb";
  const secondary = school.secondary_color || "#1e293b";
  const photo = student.photo_url || student.profile_photo || null;

  const Header = (
    <div className="flex items-center gap-4">
      {school.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={school.logo_url} alt="logo" crossOrigin="anonymous" className="h-16 w-16 object-contain" />
      ) : <div className="h-16 w-16 rounded bg-slate-200" />}
      <div className="text-center flex-1">
        <h1 className="text-2xl font-bold" style={{ color: style === "style1" ? "inherit" : "#fff" }}>{school.name}</h1>
        <p className="text-xs opacity-90">{school.address} {school.phone ? `| ${school.phone}` : ""}</p>
        {school.affiliation_board && <p className="text-xs opacity-90">Affiliated to {school.affiliation_board}</p>}
      </div>
    </div>
  );

  const StudentInfo = (
    <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Info k="Name" v={student.name} />
        <Info k="Roll No" v={student.roll_number} />
        <Info k="Class" v={`${student.class_name || "—"}${student.section_name ? ` - ${student.section_name}` : ""}`} />
        <Info k="Adm No" v={student.admission_number} />
        <Info k="DOB" v={fmt(student.dob)} />
        <Info k="Blood" v={student.blood_group} />
      </div>
      <div className="h-24 w-20 rounded border bg-slate-50 flex items-center justify-center overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="student" crossOrigin="anonymous" className="h-full w-full object-cover" />
        ) : <span className="text-[10px] text-slate-400">PHOTO</span>}
      </div>
    </div>
  );

  const Footer = (
    <div className="grid grid-cols-3 gap-4 pt-10 text-center text-xs">
      <div><div className="border-t pt-1">Class Teacher</div></div>
      <div><div className="border-t pt-1">School Stamp</div></div>
      <div><div className="border-t pt-1">Principal{school.principal_name ? ` (${school.principal_name})` : ""}</div></div>
    </div>
  );

  const resultLabel = String(overall.result || "pass").toUpperCase();

  // ---------- STYLE 1: CLASSIC ----------
  if (style === "style1") {
    return (
      <div ref={ref} className="bg-white text-slate-900 p-8 mx-auto" style={{ width: 794, fontFamily: "Georgia, serif" }}>
        {Header}
        <div className="my-3 text-center font-semibold tracking-wide border-y py-1">
          PROGRESS REPORT {student.academic_year || ""}
        </div>
        {StudentInfo}
        <table className="w-full mt-4 text-sm border-collapse">
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <Th>Subject</Th><Th right>Max</Th><Th right>Obtained</Th><Th right>%</Th><Th>Grade</Th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr key={i} className="border-b">
                <Td>{s.subject_name}</Td><Td right>{s.total}</Td><Td right>{s.obtained}</Td>
                <Td right>{s.percentage}%</Td><Td><b style={{ color: gradeColor(s.grade) }}>{s.grade}</b></Td>
              </tr>
            ))}
            {subjects.length === 0 && <tr><Td colSpan={5}>No marks recorded</Td></tr>}
            <tr className="font-bold border-t-2">
              <Td>Total</Td><Td right>{overall.total_marks}</Td><Td right>{overall.obtained_marks}</Td>
              <Td right>{overall.percentage}%</Td><Td>{overall.grade}</Td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 text-sm space-y-1">
          <p>Attendance: <b>{overall.attendance_percent}%</b></p>
          <p>Result: <b>{resultLabel}</b></p>
        </div>
        <div className="mt-4 text-sm space-y-2">
          <Remark label="Class Teacher's Remarks" value={overall.class_teacher_remarks} />
          <Remark label="Principal's Remarks" value={overall.principal_remarks} />
        </div>
        {Footer}
      </div>
    );
  }

  // ---------- STYLE 2: MODERN ----------
  return (
    <div ref={ref} className="bg-white text-slate-900 mx-auto" style={{ width: 794, fontFamily: "Arial, sans-serif" }}>
      <div className="p-6" style={{ background: primary, color: "#fff" }}>{Header}</div>
      <div className="p-6 space-y-5">
        <div className="rounded-lg p-4" style={{ background: "#f8fafc", borderLeft: `5px solid ${secondary}` }}>{StudentInfo}</div>

        <div className="space-y-2">
          {subjects.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm" style={{ background: i % 2 ? "#f8fafc" : "#fff", padding: "6px 10px", borderRadius: 6 }}>
              <span className="w-40 font-medium">{s.subject_name}</span>
              <div className="flex-1 h-2.5 rounded bg-slate-200 overflow-hidden">
                <div style={{ width: `${Math.min(100, s.percentage)}%`, background: gradeColor(s.grade), height: "100%" }} />
              </div>
              <span className="w-20 text-right">{s.obtained}/{s.total}</span>
              <span className="w-10 text-right">{s.percentage}%</span>
              <span className="px-2 py-0.5 rounded-full text-white text-xs" style={{ background: gradeColor(s.grade) }}>{s.grade}</span>
            </div>
          ))}
          {subjects.length === 0 && <p className="text-sm text-slate-500">No marks recorded</p>}
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <Stat label="Percentage" value={`${overall.percentage}%`} color={primary} />
          <Stat label="Grade" value={overall.grade} color={gradeColor(overall.grade)} />
          <Stat label="Attendance" value={`${overall.attendance_percent}%`} color={secondary} />
          <Stat label="Result" value={resultLabel} color={overall.result === "fail" || overall.result === "detained" ? "#dc2626" : "#16a34a"} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <RemarkCard label="Class Teacher's Remarks" value={overall.class_teacher_remarks} accent={primary} />
          <RemarkCard label="Principal's Remarks" value={overall.principal_remarks} accent={secondary} />
        </div>
        {Footer}
      </div>
    </div>
  );
});

const Info = ({ k, v }) => (<div><span className="text-slate-500">{k}: </span><span className="font-medium">{v || "—"}</span></div>);
const Th = ({ children, right }) => <th className={`border px-2 py-1 ${right ? "text-right" : "text-left"}`}>{children}</th>;
const Td = ({ children, right, colSpan }) => <td colSpan={colSpan} className={`border px-2 py-1 ${right ? "text-right" : ""}`}>{children}</td>;
const Remark = ({ label, value }) => (
  <div><span className="text-slate-500">{label}: </span><span>{value || "_______________________________"}</span></div>
);
const Stat = ({ label, value, color }) => (
  <div className="rounded-lg border p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-bold" style={{ color }}>{value}</p></div>
);
const RemarkCard = ({ label, value, accent }) => (
  <div className="rounded-lg p-3" style={{ background: "#f8fafc", borderTop: `3px solid ${accent}` }}>
    <p className="text-xs font-semibold mb-1">{label}</p>
    <p className="text-sm text-slate-700 min-h-[40px]">{value || "—"}</p>
  </div>
);

export default ReportCard;
