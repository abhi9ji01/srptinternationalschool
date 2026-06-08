import { query } from "../db.js";

/**
 * Write an audit log entry. Never throws — auditing must not break business flow.
 */
export async function audit({
  schoolId = null,
  userId = null,
  action,
  module,
  recordId = null,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await query(
      `INSERT INTO audit_logs (school_id, user_id, action, module, record_id, old_value, new_value, ip_address, user_agent)
       VALUES (:schoolId, :userId, :action, :module, :recordId, :oldValue, :newValue, :ipAddress, :userAgent)`,
      {
        schoolId,
        userId,
        action,
        module,
        recordId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
      }
    );
  } catch (e) {
    console.error("[audit] failed:", e.message);
  }
}

/** Extract caller IP + UA from a Fastify request. */
export function reqMeta(req) {
  const h = req.headers || {};
  return {
    ipAddress: (h["x-forwarded-for"] || "").split(",")[0] || req.ip || null,
    userAgent: h["user-agent"] || null,
  };
}
