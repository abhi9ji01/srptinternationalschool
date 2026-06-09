import { query, queryOne } from "../db.js";
import { ADMINS, STAFF_ROLES } from "../config.js";

const MANAGERS = [...ADMINS, "hr_manager"];
// Roles that can be the *target* of a review (employees).
const REVIEWABLE_ROLES = STAFF_ROLES;

export default async function reviewRoutes(app) {
  // Who the caller may review (+ their existing review, for prefill).
  app.get("/reviews/targets", { preHandler: app.authenticate }, async (req) => {
    const { id: uid, role, schoolId } = req.user;
    let rows;
    if (role === "student") {
      rows = await query(
        `SELECT DISTINCT u.id, u.name, u.role, t.designation,
                GROUP_CONCAT(DISTINCT subj.name ORDER BY subj.name SEPARATOR ', ') AS subjects
         FROM students st
         JOIN teacher_assignments ta ON ta.section_id = st.section_id
         JOIN teachers t ON t.id = ta.teacher_id
         JOIN users u ON u.id = t.user_id
         LEFT JOIN subjects subj ON subj.id = ta.subject_id
         WHERE st.user_id = :uid AND u.is_active = 1
         GROUP BY u.id, u.name, u.role, t.designation`, { uid });
    } else if (role === "parent") {
      rows = await query(
        `SELECT DISTINCT u.id, u.name, u.role, t.designation,
                GROUP_CONCAT(DISTINCT subj.name ORDER BY subj.name SEPARATOR ', ') AS subjects
         FROM parents p
         JOIN students st ON st.id = p.student_id
         JOIN teacher_assignments ta ON ta.section_id = st.section_id
         JOIN teachers t ON t.id = ta.teacher_id
         JOIN users u ON u.id = t.user_id
         LEFT JOIN subjects subj ON subj.id = ta.subject_id
         WHERE p.user_id = :uid AND u.is_active = 1
         GROUP BY u.id, u.name, u.role, t.designation`, { uid });
    } else if (MANAGERS.includes(role)) {
      rows = await query(
        `SELECT u.id, u.name, u.role, NULL AS designation, NULL AS subjects
         FROM users u WHERE u.school_id = :sid AND u.is_active = 1 AND u.id <> :uid
           AND u.role IN (${REVIEWABLE_ROLES.map((_, i) => `:r${i}`).join(",")})
         ORDER BY u.name`,
        REVIEWABLE_ROLES.reduce((p, r, i) => ({ ...p, [`r${i}`]: r }), { sid: schoolId, uid }));
    } else {
      // any other staff role → may review teachers
      rows = await query(
        `SELECT u.id, u.name, u.role, t.designation, NULL AS subjects
         FROM teachers t JOIN users u ON u.id = t.user_id
         WHERE u.school_id = :sid AND u.is_active = 1 AND u.id <> :uid ORDER BY u.name`, { sid: schoolId, uid });
    }

    // attach the caller's existing review per target
    const mine = await query(`SELECT target_user_id, rating, comment FROM reviews WHERE reviewer_id = :uid`, { uid });
    const byTarget = new Map(mine.map((m) => [m.target_user_id, m]));
    return rows.map((r) => ({ ...r, my_rating: byTarget.get(r.id)?.rating ?? null, my_comment: byTarget.get(r.id)?.comment ?? null }));
  });

  // Create or update a review (one per reviewer→target).
  app.post("/reviews", { preHandler: app.authenticate }, async (req, reply) => {
    const b = req.body || {};
    const target = Number(b.target_user_id);
    const rating = Number(b.rating);
    if (!target || target === req.user.id) return reply.code(400).send({ error: "Invalid target" });
    if (!(rating >= 1 && rating <= 5)) return reply.code(400).send({ error: "Rating must be 1-5" });

    const t = await queryOne(`SELECT id, role FROM users WHERE id = :id AND school_id = :sid`, { id: target, sid: req.user.schoolId });
    if (!t || !REVIEWABLE_ROLES.includes(t.role)) return reply.code(400).send({ error: "Target is not a reviewable employee" });

    await query(
      `INSERT INTO reviews (school_id, reviewer_id, target_user_id, rating, comment, category, is_anonymous)
       VALUES (:sid,:rev,:tgt,:rating,:comment,:cat,:anon)
       ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment), category=VALUES(category), is_anonymous=VALUES(is_anonymous)`,
      { sid: req.user.schoolId, rev: req.user.id, tgt: target, rating, comment: b.comment || null, cat: b.category || null, anon: b.is_anonymous ? 1 : 0 });
    return reply.code(201).send({ success: true });
  });

  // The caller's OWN received reviews (employee self-view). Anonymity respected.
  app.get("/reviews/received", { preHandler: app.authenticate }, async (req) => {
    const agg = await queryOne(
      `SELECT COUNT(*) AS count, ROUND(AVG(rating),2) AS average FROM reviews WHERE target_user_id = :uid`, { uid: req.user.id });
    const list = await query(
      `SELECT r.id, r.rating, r.comment, r.category, r.created_at,
              CASE WHEN r.is_anonymous = 1 THEN NULL ELSE u.name END AS reviewer_name, r.is_anonymous
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.target_user_id = :uid ORDER BY r.created_at DESC LIMIT 100`, { uid: req.user.id });
    return { average: agg?.average || 0, count: agg?.count || 0, reviews: list };
  });

  // Admin/HR: reviews about a specific employee.
  app.get("/reviews/about/:userId", { preHandler: app.authorize(MANAGERS) }, async (req) => {
    const agg = await queryOne(`SELECT COUNT(*) AS count, ROUND(AVG(rating),2) AS average FROM reviews WHERE target_user_id = :id`, { id: req.params.userId });
    const list = await query(
      `SELECT r.id, r.rating, r.comment, r.category, r.created_at, r.is_anonymous, u.name AS reviewer_name, u.role AS reviewer_role
       FROM reviews r JOIN users u ON u.id = r.reviewer_id WHERE r.target_user_id = :id ORDER BY r.created_at DESC`, { id: req.params.userId });
    return { average: agg?.average || 0, count: agg?.count || 0, reviews: list };
  });

  // Admin/HR: average rating leaderboard across employees.
  app.get("/reviews/summary", { preHandler: app.authorize(MANAGERS) }, async (req) => {
    return query(
      `SELECT u.id, u.name, u.role, COUNT(r.id) AS reviews, ROUND(AVG(r.rating),2) AS average
       FROM users u JOIN reviews r ON r.target_user_id = u.id
       WHERE u.school_id = :sid GROUP BY u.id, u.name, u.role ORDER BY average DESC, reviews DESC`, { sid: req.user.schoolId });
  });
}
