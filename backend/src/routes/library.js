import { query, queryOne } from "../db.js";
import { registerCrud } from "../utils/crud.js";
import { LIBRARY_FINE_PER_DAY, LIBRARY_ISSUE_DAYS, ADMINS } from "../config.js";

const LIB = [...ADMINS, "librarian"];

export default async function libraryRoutes(app) {
  // ---- BOOKS ----
  registerCrud(app, {
    table: "books", prefix: "/library/books", roles: LIB, readRoles: [...LIB, "student", "teacher"],
    columns: ["title", "author", "isbn", "publisher", "category", "total_copies", "available_copies", "location", "publication_year", "price", "school_id"],
    searchColumns: ["title", "author", "isbn", "category"], orderBy: "title ASC",
    schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId, available_copies: req.body?.total_copies || 1 }),
  });

  // ---- ISSUE ----
  app.post("/library/issue", { preHandler: app.authorize(LIB) }, async (req, reply) => {
    const b = req.body || {};
    const book = await queryOne(`SELECT * FROM books WHERE id=:id`, { id: b.book_id });
    if (!book) return reply.code(404).send({ error: "Book not found" });
    if (Number(book.available_copies) <= 0) return reply.code(400).send({ error: "No copies available" });
    const issueDate = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + LIBRARY_ISSUE_DAYS * 86400000).toISOString().slice(0, 10);
    const r = await query(
      `INSERT INTO book_issues (book_id, issued_to_id, issued_to_type, issue_date, due_date, status, issued_by)
       VALUES (:b,:to,:type,:id,:due,'issued',:by)`,
      { b: b.book_id, to: b.issued_to_id, type: b.issued_to_type || "student", id: issueDate, due, by: req.user.id });
    await query(`UPDATE books SET available_copies=available_copies-1 WHERE id=:id`, { id: b.book_id });
    return reply.code(201).send({ id: r.insertId, due_date: due });
  });

  // ---- RETURN (computes fine) ----
  app.post("/library/return", { preHandler: app.authorize(LIB) }, async (req, reply) => {
    const b = req.body || {};
    const issue = await queryOne(`SELECT * FROM book_issues WHERE id=:id AND status!='returned'`, { id: b.issue_id });
    if (!issue) return reply.code(404).send({ error: "Active issue not found" });
    const returnDate = new Date();
    const dueDate = new Date(issue.due_date);
    const overdueDays = Math.max(0, Math.ceil((returnDate - dueDate) / 86400000));
    const fine = overdueDays * LIBRARY_FINE_PER_DAY;
    await query(
      `UPDATE book_issues SET return_date=:rd, status='returned', fine_amount=:fine, fine_paid=:paid WHERE id=:id`,
      { rd: returnDate.toISOString().slice(0, 10), fine, paid: b.fine_paid ? 1 : 0, id: b.issue_id });
    await query(`UPDATE books SET available_copies=available_copies+1 WHERE id=:id`, { id: issue.book_id });
    return { success: true, fine, overdueDays };
  });

  // ---- ISSUES list (with names) ----
  app.get("/library/issues", { preHandler: app.authorize(LIB) }, async (req) => {
    // mark overdue
    await query(`UPDATE book_issues SET status='overdue' WHERE status='issued' AND due_date < CURDATE()`);
    const where = []; const p = {};
    if (req.query.status) { where.push("bi.status=:st"); p.st = req.query.status; }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT bi.*, bk.title AS book_title, bk.isbn,
              CASE WHEN bi.issued_to_type='student' THEN su.name ELSE tu.name END AS member_name
       FROM book_issues bi JOIN books bk ON bk.id=bi.book_id
       LEFT JOIN students st ON st.id=bi.issued_to_id AND bi.issued_to_type='student' LEFT JOIN users su ON su.id=st.user_id
       LEFT JOIN teachers t ON t.id=bi.issued_to_id AND bi.issued_to_type='teacher' LEFT JOIN users tu ON tu.id=t.user_id
       ${w} ORDER BY bi.issue_date DESC LIMIT 500`, p);
  });

  // ---- MEMBERS ----
  app.get("/library/members", { preHandler: app.authorize(LIB) }, async (req) => {
    return query(
      `SELECT lm.*, u.name, u.email, u.role FROM library_members lm JOIN users u ON u.id=lm.user_id
       WHERE u.school_id=:sid ORDER BY u.name`, { sid: req.user.schoolId });
  });

  app.post("/library/members", { preHandler: app.authorize(LIB) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO library_members (user_id, member_type, membership_date, max_books_allowed) VALUES (:u,:t,CURDATE(),:max)`,
      { u: b.user_id, t: b.member_type || "student", max: b.max_books_allowed || 3 });
    return reply.code(201).send({ id: r.insertId });
  });

  // ---- REPORTS ----
  app.get("/library/reports", { preHandler: app.authorize(LIB) }, async (req) => {
    const stats = await queryOne(
      `SELECT (SELECT COUNT(*) FROM books WHERE school_id=:sid) total_books,
              (SELECT COALESCE(SUM(total_copies),0) FROM books WHERE school_id=:sid) total_copies,
              (SELECT COUNT(*) FROM book_issues WHERE status='issued') issued,
              (SELECT COUNT(*) FROM book_issues WHERE status='overdue') overdue,
              (SELECT COALESCE(SUM(fine_amount),0) FROM book_issues WHERE fine_paid=1) fines_collected`, { sid: req.user.schoolId });
    const byCategory = await query(`SELECT category, COUNT(*) cnt FROM books WHERE school_id=:sid GROUP BY category`, { sid: req.user.schoolId });
    return { stats, byCategory };
  });
}
