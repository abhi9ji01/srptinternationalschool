-- ============================================================
-- SCHOOL MANAGEMENT SYSTEM — FULL MySQL SCHEMA
-- Engine: InnoDB, charset utf8mb4
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------- MULTI-BRANCH ----------
CREATE TABLE IF NOT EXISTS schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(150),
  logo_url VARCHAR(255),
  website VARCHAR(150),
  established_year INT,
  principal_name VARCHAR(150),
  affiliation_board VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- AUTH & USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin','admin','teacher','student','parent','accountant',
            'librarian','transport_manager','hostel_warden','hr_manager',
            'security_guard','canteen_manager','health_officer') NOT NULL,
  profile_photo VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_school (school_id),
  INDEX idx_users_role (role),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ACADEMIC STRUCTURE ----------
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  class_teacher_id INT,
  capacity INT DEFAULT 40,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (class_teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30),
  class_id INT,
  teacher_id INT,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS academic_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TEACHER MANAGEMENT ----------
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  employee_id VARCHAR(50) UNIQUE,
  qualification VARCHAR(200),
  joining_date DATE,
  department VARCHAR(100),
  designation VARCHAR(100),
  salary DECIMAL(12,2),
  address TEXT,
  emergency_contact VARCHAR(30),
  school_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT,
  role ENUM('class_teacher','subject_teacher') NOT NULL,
  academic_year_id INT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- STUDENT MANAGEMENT ----------
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  admission_number VARCHAR(50) UNIQUE,
  section_id INT,
  roll_number VARCHAR(20),
  dob DATE,
  gender ENUM('male','female','other'),
  blood_group VARCHAR(5),
  address TEXT,
  father_name VARCHAR(150),
  mother_name VARCHAR(150),
  guardian_phone VARCHAR(30),
  admission_date DATE,
  academic_year_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  school_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  student_id INT,
  relation VARCHAR(50),
  occupation VARCHAR(100),
  annual_income DECIMAL(12,2),
  address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- PROMOTION & CERTIFICATES ----------
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  from_section_id INT,
  to_section_id INT,
  academic_year_id INT,
  status ENUM('promoted','failed','detained') NOT NULL,
  promoted_by INT,
  remarks TEXT,
  promoted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  type ENUM('TC','LC','migration','participation','merit','sports','cultural') NOT NULL,
  certificate_number VARCHAR(80) UNIQUE,
  issued_date DATE,
  issued_by INT,
  file_url VARCHAR(255),
  remarks TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TIMETABLE & PERIODS ----------
CREATE TABLE IF NOT EXISTS periods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  subject_id INT,
  teacher_id INT,
  period_number INT,
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
  start_time TIME,
  end_time TIME,
  duration_minutes INT,
  is_before_lunch BOOLEAN DEFAULT TRUE,
  academic_year_id INT,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS period_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  before_lunch_duration INT DEFAULT 45,
  after_lunch_duration INT DEFAULT 30,
  lunch_break_start TIME,
  lunch_break_end TIME,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(150),
  date DATE,
  type ENUM('national','school','exam'),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ATTENDANCE ----------
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  period_id INT,
  date DATE NOT NULL,
  status ENUM('present','absent','late','excused') NOT NULL,
  marked_by INT,
  remarks VARCHAR(255),
  qr_scanned BOOLEAN DEFAULT FALSE,
  INDEX idx_att_student_date (student_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS teacher_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present','absent','late','half_day') NOT NULL,
  marked_by INT,
  remarks VARCHAR(255),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- EXAMINATION & MARKS ----------
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('unit_test','midterm','final','assignment') NOT NULL,
  section_id INT,
  subject_id INT,
  teacher_id INT,
  total_marks INT DEFAULT 100,
  passing_marks INT DEFAULT 35,
  exam_date DATE,
  academic_year_id INT,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT,
  exam_type ENUM('unit_test','midterm','final','assignment'),
  subject_id INT,
  section_id INT,
  exam_date DATE,
  start_time TIME,
  end_time TIME,
  room_number VARCHAR(30),
  invigilator_id INT,
  hall_ticket_generated BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  marks_obtained DECIMAL(6,2),
  grade VARCHAR(5),
  remarks VARCHAR(255),
  is_absent BOOLEAN DEFAULT FALSE,
  UNIQUE KEY uq_exam_student (exam_id, student_id),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grade_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  grade_name VARCHAR(5),
  min_percentage DECIMAL(5,2),
  max_percentage DECIMAL(5,2),
  grade_point DECIMAL(4,2),
  remark VARCHAR(100),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS report_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  academic_year_id INT,
  section_id INT,
  total_marks DECIMAL(8,2),
  obtained_marks DECIMAL(8,2),
  percentage DECIMAL(5,2),
  grade VARCHAR(5),
  `rank` INT,
  attendance_percent DECIMAL(5,2),
  is_published BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ASSIGNMENTS ----------
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT,
  subject_id INT,
  section_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_url VARCHAR(255),
  due_date DATETIME,
  total_marks INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  file_url VARCHAR(255),
  submitted_at DATETIME,
  marks_obtained DECIMAL(6,2),
  feedback TEXT,
  status ENUM('pending','submitted','graded','late') DEFAULT 'pending',
  UNIQUE KEY uq_submission (assignment_id, student_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- FEES & FINANCE ----------
CREATE TABLE IF NOT EXISTS fee_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  frequency ENUM('monthly','quarterly','yearly','one_time') DEFAULT 'one_time',
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  fee_category_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE,
  academic_year_id INT,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  fee_category_id INT,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2),
  status ENUM('pending','partial','paid','overdue') DEFAULT 'pending',
  academic_year_id INT,
  INDEX idx_inv_student (student_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  student_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_mode ENUM('cash','online','cheque','upi') DEFAULT 'cash',
  transaction_id VARCHAR(120),
  received_by INT,
  receipt_number VARCHAR(80) UNIQUE,
  gateway_order_id VARCHAR(120),
  gateway_payment_id VARCHAR(120),
  gateway_signature VARCHAR(255),
  is_online BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_gateway_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT,
  gateway VARCHAR(50) DEFAULT 'razorpay',
  order_id VARCHAR(120),
  payment_id VARCHAR(120),
  amount DECIMAL(12,2),
  status VARCHAR(50),
  response_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(200),
  category VARCHAR(100),
  amount DECIMAL(12,2),
  expense_date DATE,
  paid_to VARCHAR(150),
  payment_mode VARCHAR(50),
  approved_by INT,
  description TEXT,
  receipt_url VARCHAR(255),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- LIBRARY ----------
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(150),
  isbn VARCHAR(30),
  publisher VARCHAR(150),
  category VARCHAR(100),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  location VARCHAR(100),
  publication_year INT,
  price DECIMAL(10,2),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS book_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  issued_to_id INT NOT NULL,
  issued_to_type ENUM('student','teacher') NOT NULL,
  issue_date DATE,
  due_date DATE,
  return_date DATE,
  status ENUM('issued','returned','overdue') DEFAULT 'issued',
  fine_amount DECIMAL(10,2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT FALSE,
  issued_by INT,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS library_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  member_type ENUM('student','teacher') DEFAULT 'student',
  membership_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  max_books_allowed INT DEFAULT 3,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TRANSPORT ----------
CREATE TABLE IF NOT EXISTS transport_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  route_name VARCHAR(150),
  start_point VARCHAR(150),
  end_point VARCHAR(150),
  stops TEXT,
  distance_km DECIMAL(8,2),
  monthly_charge DECIMAL(10,2),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  vehicle_number VARCHAR(30),
  vehicle_type VARCHAR(50),
  capacity INT,
  driver_name VARCHAR(120),
  driver_phone VARCHAR(30),
  driver_license VARCHAR(60),
  route_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  insurance_expiry DATE,
  fitness_expiry DATE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_transport (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  route_id INT,
  vehicle_id INT,
  pickup_stop VARCHAR(150),
  drop_stop VARCHAR(150),
  pickup_time TIME,
  drop_time TIME,
  monthly_fee DECIMAL(10,2),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- HOSTEL ----------
CREATE TABLE IF NOT EXISTS hostels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(150),
  type ENUM('boys','girls','co-ed'),
  total_rooms INT,
  warden_id INT,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  room_number VARCHAR(30),
  capacity INT,
  type ENUM('single','double','triple','dormitory'),
  monthly_fee DECIMAL(10,2),
  floor VARCHAR(20),
  is_available BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  room_id INT NOT NULL,
  check_in_date DATE,
  check_out_date DATE,
  monthly_fee DECIMAL(10,2),
  status ENUM('active','vacated') DEFAULT 'active',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES hostel_rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  allocation_id INT NOT NULL,
  month VARCHAR(20),
  amount DECIMAL(10,2),
  due_date DATE,
  paid_date DATE,
  status ENUM('pending','paid') DEFAULT 'pending',
  FOREIGN KEY (allocation_id) REFERENCES hostel_allocations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- HR & PAYROLL ----------
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  school_id INT,
  employee_id VARCHAR(50) UNIQUE,
  department VARCHAR(100),
  designation VARCHAR(100),
  employment_type ENUM('full_time','part_time','contract') DEFAULT 'full_time',
  joining_date DATE,
  basic_salary DECIMAL(12,2),
  bank_account VARCHAR(40),
  ifsc_code VARCHAR(20),
  pan_number VARCHAR(20),
  address TEXT,
  emergency_contact VARCHAR(30),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payroll (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  month INT,
  year INT,
  basic_salary DECIMAL(12,2),
  hra DECIMAL(12,2) DEFAULT 0,
  da DECIMAL(12,2) DEFAULT 0,
  other_allowances DECIMAL(12,2) DEFAULT 0,
  tds DECIMAL(12,2) DEFAULT 0,
  pf DECIMAL(12,2) DEFAULT 0,
  esi DECIMAL(12,2) DEFAULT 0,
  lop_days INT DEFAULT 0,
  lop_deduction DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2),
  payment_date DATE,
  payment_mode VARCHAR(50),
  status ENUM('pending','paid') DEFAULT 'pending',
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leave_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(80),
  days_allowed INT,
  is_paid BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leave_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  leave_type_id INT,
  from_date DATE,
  to_date DATE,
  total_days INT,
  reason TEXT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by INT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  leave_type_id INT,
  academic_year_id INT,
  total_days INT,
  used_days INT DEFAULT 0,
  remaining_days INT,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- COMMUNICATION ----------
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(200),
  content TEXT,
  target_role VARCHAR(50) DEFAULT 'all',
  posted_by INT,
  is_published BOOLEAN DEFAULT TRUE,
  publish_date DATE,
  expiry_date DATE,
  attachment VARCHAR(255),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  subject VARCHAR(200),
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parent_message_id INT,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200),
  message TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id, is_read),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notice_board (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(200),
  content TEXT,
  category VARCHAR(80),
  posted_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ONLINE CLASSES ----------
CREATE TABLE IF NOT EXISTS online_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT,
  subject_id INT,
  section_id INT,
  title VARCHAR(200),
  meeting_link VARCHAR(255),
  platform ENUM('google_meet','zoom','teams') DEFAULT 'google_meet',
  scheduled_at DATETIME,
  duration_minutes INT,
  recording_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- DOCUMENTS ----------
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(200),
  file_url VARCHAR(255),
  file_type VARCHAR(50),
  file_size INT,
  category VARCHAR(80),
  uploaded_by INT,
  related_to_id INT,
  related_to_type VARCHAR(50),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- HEALTH ----------
CREATE TABLE IF NOT EXISTS health_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  blood_group VARCHAR(5),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  allergies TEXT,
  medical_conditions TEXT,
  doctor_name VARCHAR(120),
  doctor_phone VARCHAR(30),
  emergency_contact VARCHAR(30),
  last_checkup_date DATE,
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS medical_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  visit_date DATE,
  symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  doctor VARCHAR(120),
  follow_up_date DATE,
  notes TEXT,
  medicine_given TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ALUMNI ----------
CREATE TABLE IF NOT EXISTS alumni (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  graduation_year INT,
  current_occupation VARCHAR(150),
  company VARCHAR(150),
  higher_education VARCHAR(150),
  university VARCHAR(150),
  current_city VARCHAR(100),
  linkedin_url VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- INVENTORY ----------
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(150),
  category VARCHAR(80),
  quantity INT DEFAULT 0,
  unit VARCHAR(30),
  unit_price DECIMAL(10,2),
  minimum_stock INT DEFAULT 0,
  supplier VARCHAR(150),
  location VARCHAR(100),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  transaction_type ENUM('in','out') NOT NULL,
  quantity INT,
  reason VARCHAR(150),
  done_by INT,
  date DATE,
  remarks TEXT,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- CANTEEN ----------
CREATE TABLE IF NOT EXISTS canteen_menu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  item_name VARCHAR(150),
  category VARCHAR(80),
  price DECIMAL(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  description TEXT,
  image_url VARCHAR(255),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS canteen_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2),
  payment_mode VARCHAR(50),
  status ENUM('pending','completed','cancelled') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS canteen_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT,
  quantity INT,
  unit_price DECIMAL(10,2),
  FOREIGN KEY (order_id) REFERENCES canteen_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES canteen_menu(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- VISITOR MANAGEMENT ----------
CREATE TABLE IF NOT EXISTS visitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(150),
  phone VARCHAR(30),
  email VARCHAR(150),
  purpose VARCHAR(200),
  whom_to_meet VARCHAR(150),
  id_proof_type VARCHAR(50),
  id_proof_url VARCHAR(255),
  in_time DATETIME,
  out_time DATETIME,
  approved_by INT,
  pass_number VARCHAR(50),
  photo_url VARCHAR(255),
  vehicle_number VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- DISCIPLINE ----------
CREATE TABLE IF NOT EXISTS discipline_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  incident_date DATE,
  type ENUM('positive','negative') NOT NULL,
  category VARCHAR(100),
  description TEXT,
  action_taken TEXT,
  reported_by INT,
  parent_notified BOOLEAN DEFAULT FALSE,
  parent_notified_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- EVENTS ----------
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(200),
  description TEXT,
  event_date DATE,
  end_date DATE,
  type ENUM('academic','sports','cultural','exam','holiday','other') DEFAULT 'other',
  target_audience VARCHAR(80) DEFAULT 'all',
  venue VARCHAR(150),
  created_by INT,
  is_public BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- PTM ----------
CREATE TABLE IF NOT EXISTS ptm_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(200),
  date DATE,
  academic_year_id INT,
  created_by INT,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ptm_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ptm_session_id INT NOT NULL,
  teacher_id INT,
  start_time TIME,
  end_time TIME,
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by_parent_id INT,
  student_id INT,
  remarks TEXT,
  status ENUM('available','booked','completed') DEFAULT 'available',
  FOREIGN KEY (ptm_session_id) REFERENCES ptm_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- AUDIT LOGS ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT,
  user_id INT,
  action VARCHAR(50),
  module VARCHAR(80),
  record_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(60),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_school (school_id),
  INDEX idx_audit_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- QR ATTENDANCE ----------
CREATE TABLE IF NOT EXISTS student_qr_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  qr_token VARCHAR(120) UNIQUE,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- SMS & EMAIL LOGS ----------
CREATE TABLE IF NOT EXISTS notification_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  type ENUM('sms','email') NOT NULL,
  recipient VARCHAR(150),
  subject VARCHAR(200),
  message TEXT,
  status ENUM('sent','failed','pending') DEFAULT 'pending',
  sent_at DATETIME,
  error_message TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- OTP CODES (password reset + 2FA login) ----------
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  purpose ENUM('login','reset') NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_user (user_id, purpose),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
