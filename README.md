# School Management System

A production-ready, multi-branch School Management System with a **separate Node.js backend** and a **Next.js frontend**.

```
school-management/
├── backend/     Fastify REST API · MySQL (mysql2, raw queries) · JWT auth
└── frontend/    Next.js (JavaScript) · shadcn/ui · Recharts · PWA
```

The two are **independent projects** (each with its own `package.json` and `.env`). The frontend talks to the backend over REST and authenticates with a backend-issued **JWT**.

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Fastify, mysql2 (raw SQL, no ORM), JWT (`@fastify/jwt`), bcryptjs |
| Database  | MySQL 8 |
| Payments  | Razorpay (orders, signature verify, webhook) |
| Email/SMS | Nodemailer, Twilio / MSG91 |
| Files     | `@fastify/multipart`, xlsx (Excel import/export), qrcode, speakeasy (2FA TOTP), jszip (backup) |
| Frontend  | Next.js 14 (App Router, JS only), shadcn/ui, Tailwind, Recharts, react-to-print, html5-qrcode |

## Roles (13)

Super Admin · Admin · Teacher · Student · Parent · Accountant · Librarian ·
Transport Manager · Hostel Warden · HR Manager · Security Guard · Canteen Manager · Health Officer

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env          # set DB credentials + JWT_SECRET (+ Razorpay/SMTP/Twilio if used)
npm install
npm run db:setup              # creates DB, runs schema.sql, seeds demo data
npm run dev                   # API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                   # app on http://localhost:3000
```

Open http://localhost:3000 and log in with any demo account below.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@school.com | super123 |
| Admin | admin@school.com | admin123 |
| Teacher | teacher@school.com | teacher123 |
| Student | student@school.com | student123 |
| Parent | parent@school.com | parent123 |
| Accountant | accountant@school.com | accountant123 |
| Librarian | librarian@school.com | librarian123 |
| HR Manager | hr@school.com | hr123 |
| Hostel Warden | warden@school.com | warden123 |
| Transport | transport@school.com | transport123 |
| Health Officer | health@school.com | health123 |
| Security | security@school.com | security123 |
| Canteen | canteen@school.com | canteen123 |

## Key Features

- **Auth & RBAC** — JWT login, role-based route guards (backend `authorize()` + frontend middleware), optional 2FA (email OTP + TOTP), forgot/reset password via OTP.
- **Academics** — classes, sections, subjects, academic years, weekly timetable with teacher double-booking conflict check.
- **Attendance** — per-period marking, QR scanning, auto SMS to parents on absence, low-attendance (<75%) auto-warnings.
- **Exams** — exams, auto-graded marks (validated against totals), report cards, hall tickets, Excel marks import.
- **Fees** — fee structure, bulk invoice generation, **Razorpay** online payments (order → checkout → signature verify → receipt) + webhook, overdue auto-flag & notify, Excel export.
- **Library / Transport / Hostel / HR-Payroll / Health / Visitors / Canteen / Inventory / Alumni / Discipline / PTM** — full modules.
- **Analytics** — Recharts dashboards per role.
- **PWA** — installable, offline shell, push-ready service worker.
- **Audit logs** — every create/update/delete recorded.

## Notes

- Razorpay/SMTP/Twilio are **optional** — without keys the app runs and those integrations degrade gracefully (payments disabled, emails/SMS logged as `pending`).
- All database access uses **parameterized raw SQL** via `mysql2` (no ORM).
- See `backend/README.md` and `frontend/README.md` for project-specific details.
