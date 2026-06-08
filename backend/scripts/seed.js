import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const conn = await mysql.createConnection({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "school_management",
  multipleStatements: true,
});

const q = async (sql, params = []) => (await conn.execute(sql, params))[0];
const hash = (p) => bcrypt.hashSync(p, 10);
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const qrToken = (id) => `STU-${id}-${crypto.randomBytes(6).toString("hex")}`;

async function clear() {
  const tables = [
    "otp_codes", "notification_logs", "audit_logs", "student_qr_codes", "ptm_slots", "ptm_sessions",
    "events", "discipline_records", "visitors", "canteen_order_items", "canteen_orders", "canteen_menu",
    "inventory_transactions", "inventory_items", "alumni", "medical_visits", "health_records", "documents",
    "online_classes", "notice_board", "notifications", "messages", "announcements", "leave_balances",
    "leave_applications", "leave_types", "payroll", "staff", "hostel_fees", "hostel_allocations",
    "hostel_rooms", "hostels", "student_transport", "vehicles", "transport_routes", "library_members",
    "book_issues", "books", "expenses", "payment_gateway_logs", "fee_payments", "fee_invoices",
    "fee_structures", "fee_categories", "report_cards", "grade_config", "exam_marks", "exam_schedule",
    "exams", "assignment_submissions", "assignments", "attendance", "teacher_attendance", "holidays",
    "period_settings", "periods", "certificates", "promotions", "parents", "students", "teacher_assignments",
    "teachers", "academic_years", "subjects", "sections", "classes", "users", "schools",
  ];
  await conn.query("SET FOREIGN_KEY_CHECKS=0");
  for (const t of tables) await conn.query(`TRUNCATE TABLE ${t}`);
  await conn.query("SET FOREIGN_KEY_CHECKS=1");
  console.log("✓ Cleared existing data");
}

async function main() {
  await clear();

  // ---- SCHOOL ----
  const [school] = [await q(
    `INSERT INTO schools (name, code, address, phone, email, website, established_year, principal_name, affiliation_board)
     VALUES ('Delhi Public School','DPS001','Sector 24, Rohini, New Delhi','011-27654321','info@dps.edu','https://dps.edu',1985,'Dr. Anil Kumar','CBSE')`,
  )];
  const schoolId = school.insertId;
  console.log("✓ School created");

  // ---- USERS (one per role) ----
  const demo = [
    ["Super Admin", "superadmin@school.com", "super123", "super_admin"],
    ["School Admin", "admin@school.com", "admin123", "admin"],
    ["Rajesh Sharma", "teacher@school.com", "teacher123", "teacher"],
    ["Priya Verma", "teacher2@school.com", "teacher123", "teacher"],
    ["Aarav Student", "student@school.com", "student123", "student"],
    ["Parent Kumar", "parent@school.com", "parent123", "parent"],
    ["Sunil Accountant", "accountant@school.com", "accountant123", "accountant"],
    ["Meera Librarian", "librarian@school.com", "librarian123", "librarian"],
    ["Vikram HR", "hr@school.com", "hr123", "hr_manager"],
    ["Warden Singh", "warden@school.com", "warden123", "hostel_warden"],
    ["Transport Head", "transport@school.com", "transport123", "transport_manager"],
    ["Dr. Health", "health@school.com", "health123", "health_officer"],
    ["Guard Ram", "security@school.com", "security123", "security_guard"],
    ["Canteen Boss", "canteen@school.com", "canteen123", "canteen_manager"],
  ];
  const userId = {};
  for (const [name, email, pwd, role] of demo) {
    const r = await q(`INSERT INTO users (school_id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,?)`,
      [schoolId, name, email, "9" + Math.floor(100000000 + Math.random() * 899999999), hash(pwd), role]);
    userId[email] = r.insertId;
  }
  console.log("✓ Demo accounts created (14 roles)");

  // ---- ACADEMIC YEAR ----
  const ay = (await q(`INSERT INTO academic_years (school_id,name,start_date,end_date,is_current) VALUES (?,?,?,?,1)`,
    [schoolId, "2025-2026", "2025-04-01", "2026-03-31"])).insertId;

  // ---- GRADE CONFIG ----
  const grades = [["A+", 90, 100, 10, "Outstanding"], ["A", 80, 89.99, 9, "Excellent"], ["B+", 70, 79.99, 8, "Very Good"],
    ["B", 60, 69.99, 7, "Good"], ["C", 50, 59.99, 6, "Average"], ["D", 40, 49.99, 5, "Pass"], ["F", 0, 39.99, 0, "Fail"]];
  for (const g of grades) await q(`INSERT INTO grade_config (school_id,grade_name,min_percentage,max_percentage,grade_point,remark) VALUES (?,?,?,?,?,?)`, [schoolId, ...g]);

  await q(`INSERT INTO period_settings (school_id,before_lunch_duration,after_lunch_duration,lunch_break_start,lunch_break_end) VALUES (?,?,?,?,?)`,
    [schoolId, 45, 30, "12:00:00", "12:30:00"]);

  // ---- CLASSES, SECTIONS, SUBJECTS ----
  const subjectNames = ["English", "Mathematics", "Science", "Social Studies", "Computer Science"];
  const classes = [];
  for (const cname of ["Class 10", "Class 11", "Class 12"]) {
    const cid = (await q(`INSERT INTO classes (school_id,name) VALUES (?,?)`, [schoolId, cname])).insertId;
    const sections = [];
    for (const sname of ["A", "B"]) {
      const secId = (await q(`INSERT INTO sections (class_id,name,capacity) VALUES (?,?,40)`, [cid, sname])).insertId;
      sections.push({ id: secId, name: sname });
    }
    const subjects = [];
    for (const sub of subjectNames) {
      const subId = (await q(`INSERT INTO subjects (name,code,class_id,teacher_id) VALUES (?,?,?,?)`,
        [sub, sub.slice(0, 3).toUpperCase() + cid, cid, null])).insertId;
      subjects.push({ id: subId, name: sub });
    }
    classes.push({ id: cid, name: cname, sections, subjects });
  }
  console.log("✓ 3 classes, 6 sections, 15 subjects created");

  // ---- TEACHERS ----
  const teacherUsers = [userId["teacher@school.com"], userId["teacher2@school.com"]];
  const extraTeachers = [["Anita Desai", "anita.t@school.com"], ["Mohan Lal", "mohan.t@school.com"], ["Geeta Rao", "geeta.t@school.com"]];
  for (const [n, e] of extraTeachers) {
    const r = await q(`INSERT INTO users (school_id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,'teacher')`,
      [schoolId, n, e, "9" + Math.floor(100000000 + Math.random() * 899999999), hash("teacher123")]);
    teacherUsers.push(r.insertId);
  }
  const teacherIds = [];
  for (const [i, uid] of teacherUsers.entries()) {
    const r = await q(
      `INSERT INTO teachers (user_id,employee_id,qualification,joining_date,department,designation,salary,school_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [uid, "EMP" + (1000 + i), rand(["M.Sc B.Ed", "M.A B.Ed", "M.Tech", "Ph.D"]), "2020-06-01",
       rand(["Science", "Mathematics", "Languages", "Computer"]), "Senior Teacher", 45000 + i * 3000, schoolId]);
    teacherIds.push(r.insertId);
  }

  // assign class teachers + subject teachers for Class 10
  const class10 = classes[0];
  for (const [i, sec] of class10.sections.entries()) {
    const tid = teacherIds[i % teacherIds.length];
    await q(`INSERT INTO teacher_assignments (teacher_id,section_id,role,academic_year_id) VALUES (?,?, 'class_teacher',?)`, [tid, sec.id, ay]);
    const tuid = teacherUsers[i % teacherUsers.length];
    await q(`UPDATE sections SET class_teacher_id=? WHERE id=?`, [tuid, sec.id]);
    for (const [j, sub] of class10.subjects.entries()) {
      await q(`INSERT INTO teacher_assignments (teacher_id,section_id,subject_id,role,academic_year_id) VALUES (?,?,?, 'subject_teacher',?)`,
        [teacherIds[j % teacherIds.length], sec.id, sub.id, ay]);
      await q(`UPDATE subjects SET teacher_id=? WHERE id=?`, [teacherUsers[j % teacherUsers.length], sub.id]);
    }
  }
  console.log("✓ 5 teachers + assignments created");

  // ---- STUDENTS (10 per section) + PARENTS ----
  const first = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Anika", "Riya", "Myra", "Sara", "Kiara"];
  const last = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Nair", "Iyer", "Das"];
  let admCounter = 1;
  const allStudents = [];
  // Make the demo student account the first student of Class 10-A
  for (const cls of classes) {
    for (const sec of cls.sections) {
      for (let i = 0; i < 10; i++) {
        const isDemo = cls.id === class10.id && sec.name === "A" && i === 0;
        let uid;
        if (isDemo) uid = userId["student@school.com"];
        else {
          const name = `${rand(first)} ${rand(last)}`;
          uid = (await q(`INSERT INTO users (school_id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,'student')`,
            [schoolId, name, `student${admCounter}@school.com`, "9" + Math.floor(100000000 + Math.random() * 899999999), hash("student123")])).insertId;
        }
        const sid = (await q(
          `INSERT INTO students (user_id,admission_number,section_id,roll_number,dob,gender,blood_group,father_name,mother_name,guardian_phone,admission_date,academic_year_id,school_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [uid, "ADM" + String(2000 + admCounter), sec.id, String(i + 1), "2008-0" + ((i % 9) + 1) + "-15",
           rand(["male", "female"]), rand(["A+", "B+", "O+", "AB+"]), rand(last) + " (Father)", rand(last) + " (Mother)",
           "9" + Math.floor(100000000 + Math.random() * 899999999), "2025-04-01", ay, schoolId])).insertId;
        await q(`INSERT INTO student_qr_codes (student_id,qr_token) VALUES (?,?)`, [sid, qrToken(sid)]);

        // parent: demo parent linked to demo student, otherwise create
        let puid;
        if (isDemo) {
          puid = userId["parent@school.com"];
        } else {
          puid = (await q(`INSERT INTO users (school_id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,'parent')`,
            [schoolId, "Parent of " + admCounter, `parent${admCounter}@school.com`, "9" + Math.floor(100000000 + Math.random() * 899999999), hash("parent123")])).insertId;
        }
        await q(`INSERT INTO parents (user_id,student_id,relation,occupation,annual_income) VALUES (?,?,?,?,?)`,
          [puid, sid, "Father", rand(["Engineer", "Doctor", "Business", "Teacher"]), 500000 + admCounter * 1000]);

        allStudents.push({ id: sid, sectionId: sec.id, classId: cls.id, uid });
        admCounter++;
      }
    }
  }
  console.log(`✓ ${allStudents.length} students + parents created`);

  // ---- TIMETABLE for Class 10-A (Mon–Sat, 8 periods) ----
  const sec10A = class10.sections.find((s) => s.name === "A");
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const day of days) {
    for (let pn = 1; pn <= 8; pn++) {
      const beforeLunch = pn <= 4;
      const sub = class10.subjects[(pn - 1) % class10.subjects.length];
      const tid = teacherIds[(pn - 1) % teacherIds.length];
      const startHour = 8 + (pn - 1);
      await q(
        `INSERT INTO periods (section_id,subject_id,teacher_id,period_number,day_of_week,start_time,end_time,duration_minutes,is_before_lunch,academic_year_id)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [sec10A.id, sub.id, tid, pn, day, `${String(startHour).padStart(2, "0")}:00:00`, `${String(startHour).padStart(2, "0")}:45:00`,
         beforeLunch ? 45 : 30, beforeLunch ? 1 : 0, ay]);
    }
  }
  console.log("✓ Full timetable for Class 10-A created");

  // ---- ATTENDANCE (last 20 days for Class 10-A students) ----
  const c10aStudents = allStudents.filter((s) => s.sectionId === sec10A.id);
  for (let d = 0; d < 20; d++) {
    const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    for (const s of c10aStudents) {
      const status = Math.random() < 0.9 ? "present" : rand(["absent", "late"]);
      await q(`INSERT INTO attendance (student_id,date,status,marked_by) VALUES (?,?,?,?)`, [s.id, date, status, teacherUsers[0]]);
    }
  }
  console.log("✓ Attendance records created");

  // ---- EXAMS + MARKS (for Class 10-A) ----
  for (const sub of class10.subjects) {
    const exam = (await q(
      `INSERT INTO exams (name,type,section_id,subject_id,teacher_id,total_marks,passing_marks,exam_date,academic_year_id)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [`Unit Test 1 - ${sub.name}`, "unit_test", sec10A.id, sub.id, teacherIds[0], 50, 18, "2025-08-15", ay])).insertId;
    for (const s of c10aStudents) {
      const marks = Math.floor(20 + Math.random() * 30);
      const pct = (marks / 50) * 100;
      const grade = grades.find((g) => pct >= g[1] && pct <= g[2])[0];
      await q(`INSERT INTO exam_marks (exam_id,student_id,marks_obtained,grade,is_absent) VALUES (?,?,?,?,0)`, [exam, s.id, marks, grade]);
    }
    // exam schedule
    await q(`INSERT INTO exam_schedule (academic_year_id,exam_type,subject_id,section_id,exam_date,start_time,end_time,room_number,invigilator_id) VALUES (?,?,?,?,?,?,?,?,?)`,
      [ay, "final", sub.id, sec10A.id, "2026-03-10", "10:00:00", "13:00:00", "Room 101", teacherUsers[0]]);
  }
  console.log("✓ Exams, marks & schedule created");

  // ---- ASSIGNMENTS (2 per subject) ----
  for (const sub of class10.subjects) {
    for (let a = 1; a <= 2; a++) {
      await q(`INSERT INTO assignments (teacher_id,subject_id,section_id,title,description,due_date,total_marks) VALUES (?,?,?,?,?,?,?)`,
        [teacherIds[0], sub.id, sec10A.id, `${sub.name} Assignment ${a}`, `Complete chapter ${a} exercises.`,
         new Date(Date.now() + a * 7 * 86400000).toISOString().slice(0, 19).replace("T", " "), 20]);
    }
  }
  console.log("✓ Assignments created");

  // ---- FEES ----
  const tuition = (await q(`INSERT INTO fee_categories (school_id,name,description,is_recurring,frequency) VALUES (?,?,?,1,'quarterly')`,
    [schoolId, "Tuition Fee", "Quarterly tuition fee"])).insertId;
  const transportCat = (await q(`INSERT INTO fee_categories (school_id,name,description,is_recurring,frequency) VALUES (?,?,?,1,'monthly')`,
    [schoolId, "Transport Fee", "Monthly bus fee"])).insertId;
  for (const cls of classes) {
    await q(`INSERT INTO fee_structures (class_id,fee_category_id,amount,due_date,academic_year_id) VALUES (?,?,?,?,?)`,
      [cls.id, tuition, 15000, "2025-07-15", ay]);
  }
  // 1 paid + 1 pending invoice per student
  for (const s of allStudents) {
    const paid = (await q(`INSERT INTO fee_invoices (student_id,fee_category_id,amount,due_date,paid_amount,balance,status,academic_year_id) VALUES (?,?,?,?,?,?,?,?)`,
      [s.id, tuition, 15000, "2025-07-15", 15000, 0, "paid", ay])).insertId;
    await q(`INSERT INTO fee_payments (invoice_id,student_id,amount,payment_mode,receipt_number,received_by,is_online) VALUES (?,?,?,?,?,?,0)`,
      [paid, s.id, 15000, "cash", "RCPT-" + s.id + "-" + Math.floor(Math.random() * 9999), userId["accountant@school.com"]]);
    await q(`INSERT INTO fee_invoices (student_id,fee_category_id,amount,due_date,paid_amount,balance,status,academic_year_id) VALUES (?,?,?,?,?,?,?,?)`,
      [s.id, tuition, 15000, "2025-10-15", 0, 15000, "pending", ay]);
  }
  // expenses
  for (const ex of [["Electricity Bill", "Utilities", 25000], ["Stationery Purchase", "Supplies", 12000], ["Building Maintenance", "Maintenance", 50000]]) {
    await q(`INSERT INTO expenses (school_id,title,category,amount,expense_date,paid_to,payment_mode,approved_by) VALUES (?,?,?,?,?,?,?,?)`,
      [schoolId, ex[0], ex[1], ex[2], "2025-09-01", "Vendor", "cheque", userId["accountant@school.com"]]);
  }
  console.log("✓ Fee structure, invoices, payments & expenses created");

  // ---- LIBRARY (10 books, 3 issued) ----
  const bookTitles = [["The Alchemist", "Paulo Coelho"], ["Wings of Fire", "A.P.J Abdul Kalam"], ["NCERT Mathematics 10", "NCERT"],
    ["Physics Fundamentals", "H.C Verma"], ["A Brief History of Time", "Stephen Hawking"], ["To Kill a Mockingbird", "Harper Lee"],
    ["The Diary of a Young Girl", "Anne Frank"], ["Chemistry Class 10", "NCERT"], ["English Grammar", "Wren & Martin"], ["Indian History", "Bipan Chandra"]];
  const bookIds = [];
  for (const [t, a] of bookTitles) {
    const bid = (await q(`INSERT INTO books (school_id,title,author,isbn,category,total_copies,available_copies,publication_year,price) VALUES (?,?,?,?,?,?,?,?,?)`,
      [schoolId, t, a, "978" + Math.floor(1000000000 + Math.random() * 8999999999), rand(["Fiction", "Reference", "Textbook", "Biography"]), 5, 5, 2018, 350])).insertId;
    bookIds.push(bid);
  }
  for (let i = 0; i < 3; i++) {
    const issueDate = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    await q(`INSERT INTO book_issues (book_id,issued_to_id,issued_to_type,issue_date,due_date,status,issued_by) VALUES (?,?,?,?,?, 'issued',?)`,
      [bookIds[i], c10aStudents[i].id, "student", issueDate, due, userId["librarian@school.com"]]);
    await q(`UPDATE books SET available_copies=available_copies-1 WHERE id=?`, [bookIds[i]]);
  }
  await q(`INSERT INTO library_members (user_id,member_type,membership_date,max_books_allowed) VALUES (?,?,CURDATE(),3)`, [userId["student@school.com"], "student"]);
  console.log("✓ Library: 10 books, 3 issued");

  // ---- TRANSPORT (2 routes, vehicles, 5 students each) ----
  const routes = [];
  for (const [rn, sp, ep, charge] of [["Route A - North", "Rohini", "School", 1500], ["Route B - South", "Dwarka", "School", 1800]]) {
    const rid = (await q(`INSERT INTO transport_routes (school_id,route_name,start_point,end_point,stops,distance_km,monthly_charge) VALUES (?,?,?,?,?,?,?)`,
      [schoolId, rn, sp, ep, "Stop1, Stop2, Stop3", 12, charge])).insertId;
    const vid = (await q(`INSERT INTO vehicles (school_id,vehicle_number,vehicle_type,capacity,driver_name,driver_phone,route_id,insurance_expiry,fitness_expiry) VALUES (?,?,?,?,?,?,?,?,?)`,
      [schoolId, "DL01AB" + (1000 + rid), "Bus", 40, "Driver " + rid, "9" + Math.floor(100000000 + Math.random() * 899999999), rid, "2026-08-01", "2026-06-15"])).insertId;
    routes.push({ rid, vid });
  }
  for (let i = 0; i < 10; i++) {
    const r = routes[i < 5 ? 0 : 1];
    await q(`INSERT INTO student_transport (student_id,route_id,vehicle_id,pickup_stop,drop_stop,monthly_fee) VALUES (?,?,?,?,?,?)`,
      [allStudents[i].id, r.rid, r.vid, "Stop1", "School", 1500]);
  }
  console.log("✓ Transport: 2 routes, 2 buses, 10 students assigned");

  // ---- HOSTEL (1 hostel, 5 rooms, 3 allocated) ----
  const hostelId = (await q(`INSERT INTO hostels (school_id,name,type,total_rooms,warden_id) VALUES (?,?,?,?,?)`,
    [schoolId, "Boys Hostel", "boys", 5, userId["warden@school.com"]])).insertId;
  const roomIds = [];
  for (let i = 1; i <= 5; i++) {
    roomIds.push((await q(`INSERT INTO hostel_rooms (hostel_id,room_number,capacity,type,monthly_fee,floor,is_available) VALUES (?,?,?,?,?,?,1)`,
      [hostelId, "R" + (100 + i), 3, "triple", 5000, "Floor 1"])).insertId);
  }
  for (let i = 0; i < 3; i++) {
    const aid = (await q(`INSERT INTO hostel_allocations (student_id,room_id,check_in_date,monthly_fee,status) VALUES (?,?,CURDATE(),?, 'active')`,
      [allStudents[i].id, roomIds[i], 5000])).insertId;
    await q(`INSERT INTO hostel_fees (allocation_id,month,amount,due_date,status) VALUES (?,?,?,?, 'pending')`, [aid, "2025-09", 5000, "2025-09-10"]);
  }
  console.log("✓ Hostel: 5 rooms, 3 allocated");

  // ---- HR: STAFF + LEAVE TYPES + PAYROLL (3 months) ----
  const staffUsers = [userId["hr@school.com"], userId["accountant@school.com"], userId["librarian@school.com"]];
  const staffIds = [];
  for (const [i, uid] of staffUsers.entries()) {
    const sid = (await q(`INSERT INTO staff (user_id,school_id,employee_id,department,designation,employment_type,joining_date,basic_salary,bank_account,ifsc_code,pan_number) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [uid, schoolId, "STF" + (100 + i), rand(["Administration", "Finance", "Library"]), "Officer", "full_time", "2021-01-01", 40000 + i * 5000, "1234567890" + i, "HDFC0001234", "ABCDE1234F"])).insertId;
    staffIds.push(sid);
  }
  // also create staff rows for teachers so payroll covers them
  const leaveTypes = [];
  for (const [n, days, paid] of [["Casual Leave", 12, 1], ["Sick Leave", 10, 1], ["Earned Leave", 15, 1], ["Unpaid Leave", 0, 0]]) {
    leaveTypes.push((await q(`INSERT INTO leave_types (school_id,name,days_allowed,is_paid) VALUES (?,?,?,?)`, [schoolId, n, days, paid])).insertId);
  }
  for (const sid of staffIds) {
    for (const lt of leaveTypes) {
      const total = 12;
      await q(`INSERT INTO leave_balances (staff_id,leave_type_id,academic_year_id,total_days,used_days,remaining_days) VALUES (?,?,?,?,?,?)`, [sid, lt, ay, total, 2, total - 2]);
    }
    // payroll for last 3 months
    const now = new Date();
    for (let m = 0; m < 3; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const basic = 40000;
      await q(`INSERT INTO payroll (staff_id,month,year,basic_salary,hra,da,tds,pf,esi,lop_days,lop_deduction,net_salary,status,payment_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [sid, d.getMonth() + 1, d.getFullYear(), basic, 8000, 4000, 0, 4800, 300, 0, 0, 46900, m === 0 ? "pending" : "paid", m === 0 ? null : d.toISOString().slice(0, 10)]);
    }
  }
  await q(`INSERT INTO leave_applications (staff_id,leave_type_id,from_date,to_date,total_days,reason,status) VALUES (?,?,?,?,?,?, 'pending')`,
    [staffIds[0], leaveTypes[0], "2025-10-01", "2025-10-02", 2, "Personal work"]);
  console.log("✓ HR: staff, leave types, balances, 3 months payroll");

  // ---- ANNOUNCEMENTS, NOTICES, EVENTS ----
  for (const [t, c] of [["Annual Day 2025", "Annual day celebrations on 20th December."], ["Holiday Notice", "School closed for Diwali."], ["Exam Schedule Released", "Final exam timetable is now available."]]) {
    await q(`INSERT INTO announcements (school_id,title,content,target_role,posted_by,is_published,publish_date) VALUES (?,?,?,?,?,1,CURDATE())`, [schoolId, t, c, "all", userId["admin@school.com"]]);
  }
  for (const [t, c] of [["Fee Reminder", "Q2 fees due by 15th October."], ["PTM Announcement", "Parent teacher meeting this Saturday."]]) {
    await q(`INSERT INTO notice_board (school_id,title,content,category,posted_by) VALUES (?,?,?,?,?)`, [schoolId, t, c, "General", userId["admin@school.com"]]);
  }
  for (const [t, type, date] of [["Sports Day", "sports", "2025-12-05"], ["Science Exhibition", "academic", "2025-11-20"], ["Cultural Fest", "cultural", "2026-01-15"]]) {
    await q(`INSERT INTO events (school_id,title,description,event_date,type,target_audience,venue,created_by,is_public) VALUES (?,?,?,?,?,?,?,?,1)`,
      [schoolId, t, t + " event", date, type, "all", "School Ground", userId["admin@school.com"]]);
  }
  await q(`INSERT INTO holidays (school_id,name,date,type) VALUES (?,?,?,?),(?,?,?,?)`,
    [schoolId, "Diwali", "2025-10-20", "national", schoolId, "Republic Day", "2026-01-26", "national"]);

  // ---- VISITORS (5) ----
  for (let i = 1; i <= 5; i++) {
    await q(`INSERT INTO visitors (school_id,name,phone,purpose,whom_to_meet,id_proof_type,in_time,approved_by,pass_number) VALUES (?,?,?,?,?,?,NOW(),?,?)`,
      [schoolId, "Visitor " + i, "98765432" + i, rand(["Admission Enquiry", "Meet Teacher", "Fee Payment"]), "Admin Office", "Aadhar", userId["security@school.com"], "VP-2025-" + (100 + i)]);
  }

  // ---- DISCIPLINE (3) ----
  for (let i = 0; i < 3; i++) {
    await q(`INSERT INTO discipline_records (student_id,incident_date,type,category,description,action_taken,reported_by) VALUES (?,?,?,?,?,?,?)`,
      [c10aStudents[i].id, "2025-09-1" + i, rand(["positive", "negative"]), rand(["Behavior", "Academic", "Sports"]),
       "Sample discipline incident description.", "Counseling provided", teacherUsers[0]]);
  }

  // ---- PTM (2 sessions with slots) ----
  for (let s = 1; s <= 2; s++) {
    const ses = (await q(`INSERT INTO ptm_sessions (school_id,title,date,academic_year_id,created_by) VALUES (?,?,?,?,?)`,
      [schoolId, "PTM Session " + s, "2025-1" + s + "-05", ay, userId["admin@school.com"]])).insertId;
    for (let sl = 0; sl < 4; sl++) {
      await q(`INSERT INTO ptm_slots (ptm_session_id,teacher_id,start_time,end_time,status) VALUES (?,?,?,?, 'available')`,
        [ses, teacherIds[0], `${10 + sl}:00:00`, `${10 + sl}:30:00`]);
    }
  }

  // ---- HEALTH, CANTEEN, INVENTORY, ALUMNI ----
  for (let i = 0; i < 5; i++) {
    await q(`INSERT INTO health_records (student_id,blood_group,height,weight,last_checkup_date) VALUES (?,?,?,?,?)`,
      [c10aStudents[i].id, rand(["A+", "B+", "O+"]), 150 + i, 45 + i, "2025-07-01"]);
  }
  for (const [n, cat, price] of [["Veg Sandwich", "Snacks", 40], ["Samosa", "Snacks", 15], ["Cold Coffee", "Beverages", 50], ["Thali", "Meals", 80]]) {
    await q(`INSERT INTO canteen_menu (school_id,item_name,category,price,is_available) VALUES (?,?,?,?,1)`, [schoolId, n, cat, price]);
  }
  for (const [n, cat, qty, unit] of [["Whiteboard Marker", "Stationery", 200, "pcs"], ["A4 Paper Ream", "Stationery", 50, "ream"], ["Football", "Sports", 15, "pcs"]]) {
    await q(`INSERT INTO inventory_items (school_id,name,category,quantity,unit,unit_price,minimum_stock) VALUES (?,?,?,?,?,?,?)`, [schoolId, n, cat, qty, unit, 25, 10]);
  }
  await q(`INSERT INTO alumni (graduation_year,current_occupation,company,university,current_city,is_verified) VALUES (?,?,?,?,?,1),(?,?,?,?,?,0)`,
    [2018, "Software Engineer", "Google", "IIT Delhi", "Bangalore", 2019, "Doctor", "AIIMS", "AIIMS Delhi", "Delhi"]);

  // ---- SAMPLE NOTIFICATIONS ----
  await q(`INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)`,
    [userId["student@school.com"], "Welcome!", "Welcome to the School Management System.", "info"]);
  await q(`INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)`,
    [userId["parent@school.com"], "Fee Reminder", "Q2 fees are due soon.", "fee"]);

  console.log("\n========================================");
  console.log("✅ SEED COMPLETE");
  console.log("========================================");
  console.log("Login with any of these (password shown):");
  demo.forEach(([n, e, p, r]) => console.log(`  ${r.padEnd(18)} ${e.padEnd(28)} ${p}`));
  console.log("========================================\n");
  await conn.end();
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
