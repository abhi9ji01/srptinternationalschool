import { query, queryOne } from "../db.js";
import { registerCrud } from "../utils/crud.js";
import { ADMINS } from "../config.js";

const HOS = [...ADMINS, "hostel_warden"];

export default async function hostelRoutes(app) {
  registerCrud(app, {
    table: "hostels", prefix: "/hostel/hostels", roles: HOS, readRoles: HOS,
    columns: ["name", "type", "total_rooms", "warden_id", "school_id"], schoolScoped: true,
    defaults: (req) => ({ school_id: req.user.schoolId }),
  });

  // ROOMS (with occupancy)
  app.get("/hostel/rooms", { preHandler: app.authorize(HOS) }, async (req) => {
    const p = {}; let extra = "";
    if (req.query.hostel_id) { extra = "WHERE hr.hostel_id=:h"; p.h = req.query.hostel_id; }
    return query(
      `SELECT hr.*, h.name AS hostel_name,
              (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.room_id=hr.id AND ha.status='active') AS occupied
       FROM hostel_rooms hr JOIN hostels h ON h.id=hr.hostel_id ${extra} ORDER BY hr.room_number`, p);
  });

  app.post("/hostel/rooms", { preHandler: app.authorize(HOS) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(
      `INSERT INTO hostel_rooms (hostel_id, room_number, capacity, type, monthly_fee, floor, is_available)
       VALUES (:h,:rn,:cap,:type,:fee,:floor,1)`,
      { h: b.hostel_id, rn: b.room_number, cap: b.capacity || 1, type: b.type || "single", fee: b.monthly_fee || 0, floor: b.floor || null });
    return reply.code(201).send({ id: r.insertId });
  });

  // ALLOCATE (capacity check)
  app.post("/hostel/allocate", { preHandler: app.authorize(HOS) }, async (req, reply) => {
    const b = req.body || {};
    const room = await queryOne(`SELECT * FROM hostel_rooms WHERE id=:id`, { id: b.room_id });
    if (!room) return reply.code(404).send({ error: "Room not found" });
    const occ = await queryOne(`SELECT COUNT(*) c FROM hostel_allocations WHERE room_id=:id AND status='active'`, { id: b.room_id });
    if (Number(occ.c) >= Number(room.capacity)) return reply.code(400).send({ error: "Room is at full capacity" });
    const r = await query(
      `INSERT INTO hostel_allocations (student_id, room_id, check_in_date, monthly_fee, status)
       VALUES (:s,:room,CURDATE(),:fee,'active')`,
      { s: b.student_id, room: b.room_id, fee: b.monthly_fee || room.monthly_fee });
    if (Number(occ.c) + 1 >= Number(room.capacity)) await query(`UPDATE hostel_rooms SET is_available=0 WHERE id=:id`, { id: b.room_id });
    return reply.code(201).send({ id: r.insertId });
  });

  app.post("/hostel/allocations/:id/vacate", { preHandler: app.authorize(HOS) }, async (req) => {
    const a = await queryOne(`SELECT * FROM hostel_allocations WHERE id=:id`, { id: req.params.id });
    if (a) {
      await query(`UPDATE hostel_allocations SET status='vacated', check_out_date=CURDATE() WHERE id=:id`, { id: req.params.id });
      await query(`UPDATE hostel_rooms SET is_available=1 WHERE id=:id`, { id: a.room_id });
    }
    return { success: true };
  });

  app.get("/hostel/students", { preHandler: app.authorize(HOS) }, async (req) => {
    return query(
      `SELECT ha.*, u.name AS student_name, hr.room_number, h.name AS hostel_name
       FROM hostel_allocations ha JOIN students st ON st.id=ha.student_id JOIN users u ON u.id=st.user_id
       JOIN hostel_rooms hr ON hr.id=ha.room_id JOIN hostels h ON h.id=hr.hostel_id
       WHERE h.school_id=:sid AND ha.status='active' ORDER BY u.name`, { sid: req.user.schoolId });
  });

  // FEES
  app.get("/hostel/fees", { preHandler: app.authorize(HOS) }, async (req) => {
    return query(
      `SELECT hf.*, u.name AS student_name, hr.room_number FROM hostel_fees hf
       JOIN hostel_allocations ha ON ha.id=hf.allocation_id JOIN students st ON st.id=ha.student_id JOIN users u ON u.id=st.user_id
       JOIN hostel_rooms hr ON hr.id=ha.room_id ORDER BY hf.due_date DESC LIMIT 500`);
  });

  app.post("/hostel/fees", { preHandler: app.authorize(HOS) }, async (req, reply) => {
    const b = req.body || {};
    const r = await query(`INSERT INTO hostel_fees (allocation_id, month, amount, due_date, status) VALUES (:a,:m,:amt,:due,'pending')`,
      { a: b.allocation_id, m: b.month, amt: b.amount, due: b.due_date || null });
    return reply.code(201).send({ id: r.insertId });
  });

  app.post("/hostel/fees/:id/pay", { preHandler: app.authorize(HOS) }, async (req) => {
    await query(`UPDATE hostel_fees SET status='paid', paid_date=CURDATE() WHERE id=:id`, { id: req.params.id });
    return { success: true };
  });

  app.get("/hostel/dashboard", { preHandler: app.authorize(HOS) }, async (req) => {
    return queryOne(
      `SELECT (SELECT COUNT(*) FROM hostels WHERE school_id=:sid) hostels,
              (SELECT COUNT(*) FROM hostel_rooms hr JOIN hostels h ON h.id=hr.hostel_id WHERE h.school_id=:sid) rooms,
              (SELECT COUNT(*) FROM hostel_allocations ha JOIN hostel_rooms hr ON hr.id=ha.room_id JOIN hostels h ON h.id=hr.hostel_id WHERE h.school_id=:sid AND ha.status='active') occupied`, { sid: req.user.schoolId });
  });
}
