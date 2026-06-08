import { query, queryOne } from "../db.js";
import { registerCrud } from "../utils/crud.js";
import { ADMINS, ALL_ROLES, STAFF_ROLES } from "../config.js";

export default async function academicRoutes(app) {
  // ---- SCHOOLS (super admin) ----
  registerCrud(app, {
    table: "schools",
    prefix: "/schools",
    roles: ["super_admin"],
    readRoles: ALL_ROLES,
    columns: ["name", "code", "address", "phone", "email", "logo_url", "website", "established_year", "principal_name", "affiliation_board"],
    searchColumns: ["name", "code", "city"],
    orderBy: "name ASC",
  });

  // ---- CLASSES ----
  registerCrud(app, {
    table: "classes",
    prefix: "/classes",
    roles: ADMINS,
    readRoles: ALL_ROLES,
    columns: ["name", "school_id"],
    searchColumns: ["name"],
    orderBy: "name ASC",
    schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  // sections of a class (nested)
  app.get("/classes/:id/sections", { preHandler: app.authorize(ALL_ROLES) }, async (req) => {
    return query(
      `SELECT s.*, c.name AS class_name, u.name AS class_teacher_name,
              (SELECT COUNT(*) FROM students st WHERE st.section_id = s.id AND st.is_active=1) AS student_count
       FROM sections s JOIN classes c ON c.id = s.class_id
       LEFT JOIN users u ON u.id = s.class_teacher_id
       WHERE s.class_id = :id ORDER BY s.name`,
      { id: req.params.id }
    );
  });

  // ---- SECTIONS ----
  registerCrud(app, {
    table: "sections",
    prefix: "/sections",
    roles: ADMINS,
    readRoles: ALL_ROLES,
    columns: ["class_id", "name", "class_teacher_id", "capacity"],
    orderBy: "name ASC",
  });

  // all sections with class + teacher names (handy for dropdowns)
  app.get("/sections-detailed", { preHandler: app.authorize(STAFF_ROLES) }, async (req) => {
    return query(
      `SELECT s.id, s.name AS section_name, s.capacity, c.id AS class_id, c.name AS class_name,
              u.name AS class_teacher_name
       FROM sections s JOIN classes c ON c.id = s.class_id
       LEFT JOIN users u ON u.id = s.class_teacher_id
       WHERE c.school_id = :sid ORDER BY c.name, s.name`,
      { sid: req.user.schoolId }
    );
  });

  // ---- SUBJECTS ----
  registerCrud(app, {
    table: "subjects",
    prefix: "/subjects",
    roles: ADMINS,
    readRoles: ALL_ROLES,
    columns: ["name", "code", "class_id", "teacher_id"],
    searchColumns: ["name", "code"],
    orderBy: "name ASC",
  });

  app.get("/subjects-detailed", { preHandler: app.authorize(ALL_ROLES) }, async (req) => {
    return query(
      `SELECT sub.*, c.name AS class_name, u.name AS teacher_name
       FROM subjects sub LEFT JOIN classes c ON c.id = sub.class_id
       LEFT JOIN users u ON u.id = sub.teacher_id
       ORDER BY c.name, sub.name`
    );
  });

  // ---- ACADEMIC YEARS ----
  registerCrud(app, {
    table: "academic_years",
    prefix: "/academic-years",
    roles: ADMINS,
    readRoles: ALL_ROLES,
    columns: ["name", "start_date", "end_date", "is_current", "school_id"],
    orderBy: "start_date DESC",
    schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  // set a year as current (unset others)
  app.post("/academic-years/:id/set-current", { preHandler: app.authorize(ADMINS) }, async (req) => {
    await query(`UPDATE academic_years SET is_current=0 WHERE school_id=:sid`, { sid: req.user.schoolId });
    await query(`UPDATE academic_years SET is_current=1 WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  app.get("/academic-years/current/get", { preHandler: app.authorize(ALL_ROLES) }, async (req) => {
    return queryOne(`SELECT * FROM academic_years WHERE school_id=:sid AND is_current=1 LIMIT 1`, { sid: req.user.schoolId });
  });

  // ---- GRADE CONFIG ----
  registerCrud(app, {
    table: "grade_config",
    prefix: "/grades/config",
    roles: ADMINS,
    readRoles: STAFF_ROLES,
    columns: ["grade_name", "min_percentage", "max_percentage", "grade_point", "remark", "school_id"],
    orderBy: "min_percentage DESC",
    schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  // ---- HOLIDAYS ----
  registerCrud(app, {
    table: "holidays",
    prefix: "/holidays",
    roles: ADMINS,
    readRoles: ALL_ROLES,
    columns: ["name", "date", "type", "school_id"],
    orderBy: "date ASC",
    schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId }),
  });
}
