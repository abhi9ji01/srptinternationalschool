# Frontend — Next.js (App Router, JavaScript)

UI for the School Management System. Talks to the Fastify backend over REST; auth via backend-issued JWT stored in `localStorage` (mirrored to cookies so `middleware.js` can guard routes).

## Setup

```bash
cp .env.example .env.local      # NEXT_PUBLIC_API_URL + NEXT_PUBLIC_RAZORPAY_KEY_ID
npm install
npm run dev                     # http://localhost:3000
```

> The backend must be running (default `http://localhost:5000/api`).

## Structure

```
app/                      App Router pages
  (auth)/login/...        login, forgot/reset password
  admin/ teacher/ ...     per-role pages (each starts with <AppShell allow={[roles]}>)
  announcements/ events/ messages/ profile/ notifications/   shared pages
lib/
  api.js                  fetch wrapper (adds Bearer token, handles 401, file downloads)
  auth-context.jsx        AuthProvider / useAuth (login, logout, current user)
  constants.js            roles, labels, ROLE_HOME, ROUTE_ACCESS
  navigation.js           role-based sidebar items
components/
  ui/                     shadcn/ui primitives
  shared/                 Sidebar, Navbar, AppShell, DataTable, StatCard, ChartCard, etc.
middleware.js             cookie-based route guard (redirect to /login or /unauthorized)
public/manifest.json, sw.js   PWA
```

## Auth flow

1. `useAuth().login(email, password)` → `POST /auth/login`, stores token + user.
2. `middleware.js` reads `sms_token` / `sms_role` cookies to gate `/admin`, `/teacher`, … prefixes.
3. `<AppShell allow={[...]}>` does a second client-side role check and renders the sidebar/navbar shell.

## PWA icons

Add `public/icons/icon-192.png` and `public/icons/icon-512.png` to enable install prompts
(the manifest references them).
