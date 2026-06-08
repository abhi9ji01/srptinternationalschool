# Backend — Fastify REST API

Standalone Node.js API for the School Management System. MySQL via `mysql2` (raw parameterized SQL), JWT auth, role-based authorization.

## Setup

```bash
cp .env.example .env       # configure DB + JWT_SECRET
npm install
npm run db:migrate         # create database + tables from sql/schema.sql
npm run db:seed            # insert demo data (14 accounts, classes, fees, etc.)
# or both at once:
npm run db:setup
npm run dev                # http://localhost:5000  (npm start for production)
```

## Structure

```
server.js                  Fastify bootstrap (CORS, multipart, static uploads, error handler)
src/
  db.js                    mysql2 pool + query/queryOne/transaction helpers
  config.js                roles, role groups, grade config
  auth/index.js            @fastify/jwt plugin → app.authenticate / app.authorize(roles)
  utils/                   password, mailer, sms, razorpay, qr, excel, audit, notify, crud
  routes/                  one file per module, registered in routes/index.js
sql/schema.sql             full MySQL schema (~50 tables)
scripts/migrate.js         creates DB + applies schema
scripts/seed.js            demo data
```

## Auth

- `POST /api/auth/login` → `{ token, user }`. If 2FA is enabled, returns `{ twoFactor: true }` and emails an OTP; resend with `otp` (or `totp` for Google Authenticator).
- Send the token as `Authorization: Bearer <token>` on every request.
- `app.authorize([roles])` is the per-route guard; `app.authenticate` only checks a valid token.

## Key endpoints (prefix `/api`)

`auth/*`, `students`, `teachers`, `parents`, `classes`, `sections`, `subjects`, `academic-years`,
`timetable`, `attendance/bulk`, `attendance/qr-scan`, `exams/:id/marks`, `assignments`,
`fees/invoices`, `fees/razorpay/create-order`, `fees/razorpay/verify`, `library/*`, `transport/*`,
`hostel/*`, `hr/*`, `health/*`, `visitors`, `discipline`, `ptm/*`, `events`, `announcements`,
`messages`, `notifications`, `certificates`, `reports/dashboard/:role`, `audit-logs`, `backup/export`.

## Integrations (optional)

Razorpay, SMTP (Nodemailer), Twilio/MSG91 are all optional — missing keys degrade gracefully
(payments disabled, email/SMS recorded in `notification_logs` as `pending`).
