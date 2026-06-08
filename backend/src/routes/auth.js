import { query, queryOne } from "../db.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { sendEmail, otpEmail, loginOtpEmail } from "../utils/mailer.js";
import { audit, reqMeta } from "../utils/audit.js";
import speakeasy from "speakeasy";

function gen6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function storeOtp(userId, purpose, code, minutes) {
  await query(
    `INSERT INTO otp_codes (user_id, purpose, code, expires_at) VALUES (:uid, :p, :c, DATE_ADD(NOW(), INTERVAL :m MINUTE))`,
    { uid: userId, p: purpose, c: code, m: minutes }
  );
}

async function consumeOtp(userId, purpose, code) {
  const row = await queryOne(
    `SELECT id FROM otp_codes WHERE user_id=:uid AND purpose=:p AND code=:c AND used=0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1`,
    { uid: userId, p: purpose, c: code }
  );
  if (!row) return false;
  await query(`UPDATE otp_codes SET used=1 WHERE id=:id`, { id: row.id });
  return true;
}

export default async function authRoutes(app) {
  // ---- LOGIN ----
  app.post("/auth/login", async (req, reply) => {
    const { email, password, otp, totp } = req.body || {};
    if (!email || !password) return reply.code(400).send({ error: "Email and password required" });

    const user = await queryOne(
      `SELECT id, school_id, name, email, role, password_hash, is_active, profile_photo,
              two_factor_enabled, two_factor_secret
       FROM users WHERE email = :email LIMIT 1`,
      { email: String(email).toLowerCase().trim() }
    );
    if (!user || !user.is_active) return reply.code(401).send({ error: "Invalid credentials" });

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return reply.code(401).send({ error: "Invalid credentials" });

    // ---- Optional 2FA ----
    if (user.two_factor_enabled) {
      // TOTP path (Google Authenticator)
      if (totp && user.two_factor_secret) {
        const valid = speakeasy.totp.verify({ secret: user.two_factor_secret, encoding: "base32", token: totp, window: 1 });
        if (!valid) return reply.code(401).send({ error: "Invalid authenticator code", twoFactor: true });
      } else if (otp) {
        const valid = await consumeOtp(user.id, "login", otp);
        if (!valid) return reply.code(401).send({ error: "Invalid or expired OTP", twoFactor: true });
      } else {
        // No code supplied → send an email OTP and tell the client 2FA is required.
        const code = gen6();
        await storeOtp(user.id, "login", code, 5);
        await sendEmail({ to: user.email, ...loginOtpEmail(code), userId: user.id });
        return reply.code(200).send({ twoFactor: true, message: "OTP sent to your email" });
      }
    }

    await query(`UPDATE users SET last_login = NOW() WHERE id = :id`, { id: user.id });
    await audit({ ...reqMeta(req), schoolId: user.school_id, userId: user.id, action: "login", module: "auth", recordId: user.id });

    const token = app.jwt.sign({ id: user.id, role: user.role, schoolId: user.school_id, name: user.name, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.school_id,
        profilePhoto: user.profile_photo,
      },
    };
  });

  // ---- CURRENT USER ----
  app.get("/auth/me", { preHandler: app.authenticate }, async (req) => {
    const u = await queryOne(
      `SELECT id, school_id AS schoolId, name, email, phone, role, profile_photo AS profilePhoto, two_factor_enabled AS twoFactorEnabled
       FROM users WHERE id = :id`,
      { id: req.user.id }
    );
    return { user: u };
  });

  // ---- CHANGE PASSWORD ----
  app.post("/auth/change-password", { preHandler: app.authenticate }, async (req, reply) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 6) return reply.code(400).send({ error: "New password too short" });
    const user = await queryOne(`SELECT password_hash FROM users WHERE id=:id`, { id: req.user.id });
    const ok = await comparePassword(currentPassword || "", user.password_hash);
    if (!ok) return reply.code(400).send({ error: "Current password is incorrect" });
    await query(`UPDATE users SET password_hash=:h WHERE id=:id`, { h: await hashPassword(newPassword), id: req.user.id });
    return { success: true };
  });

  // ---- FORGOT PASSWORD (request OTP) ----
  app.post("/auth/forgot-password", async (req) => {
    const { email } = req.body || {};
    const user = await queryOne(`SELECT id, email FROM users WHERE email=:e`, { e: String(email || "").toLowerCase().trim() });
    // Always respond success to avoid user enumeration
    if (user) {
      const code = gen6();
      await storeOtp(user.id, "reset", code, 10);
      await sendEmail({ to: user.email, ...otpEmail(code), userId: user.id });
    }
    return { success: true, message: "If the email exists, an OTP has been sent." };
  });

  // ---- RESET PASSWORD (with OTP) ----
  app.post("/auth/reset-password", async (req, reply) => {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) return reply.code(400).send({ error: "Missing fields" });
    if (newPassword.length < 6) return reply.code(400).send({ error: "Password too short" });
    const user = await queryOne(`SELECT id FROM users WHERE email=:e`, { e: String(email).toLowerCase().trim() });
    if (!user) return reply.code(400).send({ error: "Invalid request" });
    const valid = await consumeOtp(user.id, "reset", otp);
    if (!valid) return reply.code(400).send({ error: "Invalid or expired OTP" });
    await query(`UPDATE users SET password_hash=:h WHERE id=:id`, { h: await hashPassword(newPassword), id: user.id });
    return { success: true };
  });

  // ---- 2FA SETUP (TOTP) ----
  app.post("/auth/2fa/setup", { preHandler: app.authenticate }, async (req) => {
    const secret = speakeasy.generateSecret({ name: `SchoolMS (${req.user.email})` });
    await query(`UPDATE users SET two_factor_secret=:s WHERE id=:id`, { s: secret.base32, id: req.user.id });
    return { secret: secret.base32, otpauthUrl: secret.otpauth_url };
  });

  // ---- 2FA VERIFY / ENABLE ----
  app.post("/auth/2fa/verify", { preHandler: app.authenticate }, async (req, reply) => {
    const { token, enable } = req.body || {};
    const user = await queryOne(`SELECT two_factor_secret FROM users WHERE id=:id`, { id: req.user.id });
    if (!user?.two_factor_secret) return reply.code(400).send({ error: "Run setup first" });
    const valid = speakeasy.totp.verify({ secret: user.two_factor_secret, encoding: "base32", token: token || "", window: 1 });
    if (!valid) return reply.code(400).send({ error: "Invalid code" });
    await query(`UPDATE users SET two_factor_enabled=:e WHERE id=:id`, { e: enable ? 1 : 0, id: req.user.id });
    return { success: true, enabled: !!enable };
  });
}
