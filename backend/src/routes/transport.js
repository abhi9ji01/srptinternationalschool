import { query, queryOne } from "../db.js";
import { registerCrud } from "../utils/crud.js";
import { ADMINS } from "../config.js";

const TR = [...ADMINS, "transport_manager"];

export default async function transportRoutes(app) {
  // ---- ROUTES ----
  registerCrud(app, {
    table: "transport_routes", prefix: "/transport/routes", roles: TR, readRoles: [...TR, "student", "parent"],
    columns: ["route_name", "start_point", "end_point", "stops", "distance_km", "monthly_charge", "school_id"],
    searchColumns: ["route_name"], orderBy: "route_name", schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  // ---- VEHICLES (with expiry alerts) ----
  registerCrud(app, {
    table: "vehicles", prefix: "/transport/vehicles", roles: TR, readRoles: TR,
    columns: ["vehicle_number", "vehicle_type", "capacity", "driver_name", "driver_phone", "driver_license", "route_id", "is_active", "insurance_expiry", "fitness_expiry", "school_id"],
    searchColumns: ["vehicle_number", "driver_name"], orderBy: "vehicle_number", schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  app.get("/transport/expiry-alerts", { preHandler: app.authorize(TR) }, async (req) => {
    return query(
      `SELECT *, DATEDIFF(insurance_expiry, CURDATE()) AS insurance_days, DATEDIFF(fitness_expiry, CURDATE()) AS fitness_days
       FROM vehicles WHERE school_id=:sid AND (insurance_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR fitness_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
       ORDER BY insurance_expiry`, { sid: req.user.schoolId });
  });

  // ---- STUDENT TRANSPORT ASSIGNMENT ----
  app.get("/transport/students", { preHandler: app.authorize([...TR, "accountant"]) }, async (req) => {
    const p = { sid: req.user.schoolId }; let extra = "";
    if (req.query.route_id) { extra = "AND stp.route_id=:r"; p.r = req.query.route_id; }
    return query(
      `SELECT stp.*, u.name AS student_name, r.route_name, v.vehicle_number
       FROM student_transport stp JOIN students st ON st.id=stp.student_id JOIN users u ON u.id=st.user_id
       LEFT JOIN transport_routes r ON r.id=stp.route_id LEFT JOIN vehicles v ON v.id=stp.vehicle_id
       WHERE st.school_id=:sid ${extra} ORDER BY u.name`, p);
  });

  app.post("/transport/assign", { preHandler: app.authorize(TR) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO student_transport (student_id, route_id, vehicle_id, pickup_stop, drop_stop, pickup_time, drop_time, monthly_fee)
       VALUES (:s,:r,:v,:pu,:dr,:put,:drt,:fee)`,
      { s: b.student_id, r: b.route_id || null, v: b.vehicle_id || null, pu: b.pickup_stop || null, dr: b.drop_stop || null,
        put: b.pickup_time || null, drt: b.drop_time || null, fee: b.monthly_fee || 0 });
    return reply.code(201).send({ id: r.insertId });
  });

  app.delete("/transport/students/:id", { preHandler: app.authorize(TR) }, async (req) => {
    await query(`DELETE FROM student_transport WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  // student's own transport detail
  app.get("/transport/my", { preHandler: app.authorize(["student", "parent"]) }, async (req) => {
    const studentId = req.query.student_id;
    return queryOne(
      `SELECT stp.*, r.route_name, r.stops, v.vehicle_number, v.driver_name, v.driver_phone
       FROM student_transport stp LEFT JOIN transport_routes r ON r.id=stp.route_id LEFT JOIN vehicles v ON v.id=stp.vehicle_id
       WHERE stp.student_id=:sid ORDER BY stp.id DESC LIMIT 1`, { sid: studentId });
  });

  app.get("/transport/dashboard", { preHandler: app.authorize(TR) }, async (req) => {
    return queryOne(
      `SELECT (SELECT COUNT(*) FROM vehicles WHERE school_id=:sid AND is_active=1) vehicles,
              (SELECT COUNT(*) FROM transport_routes WHERE school_id=:sid) routes,
              (SELECT COUNT(*) FROM student_transport stp JOIN students st ON st.id=stp.student_id WHERE st.school_id=:sid) students`, { sid: req.user.schoolId });
  });
}
