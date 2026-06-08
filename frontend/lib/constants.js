// Central place for roles, enums and config-style constants.

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  ACCOUNTANT: "accountant",
  LIBRARIAN: "librarian",
  TRANSPORT_MANAGER: "transport_manager",
  HOSTEL_WARDEN: "hostel_warden",
  HR_MANAGER: "hr_manager",
  SECURITY_GUARD: "security_guard",
  CANTEEN_MANAGER: "canteen_manager",
  HEALTH_OFFICER: "health_officer",
};

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  accountant: "Accountant",
  librarian: "Librarian",
  transport_manager: "Transport Manager",
  hostel_warden: "Hostel Warden",
  hr_manager: "HR Manager",
  security_guard: "Security Guard",
  canteen_manager: "Canteen Manager",
  health_officer: "Health Officer",
};

// Landing route per role after login.
export const ROLE_HOME = {
  super_admin: "/admin/dashboard",
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
  accountant: "/accountant/dashboard",
  librarian: "/library/dashboard",
  transport_manager: "/transport/dashboard",
  hostel_warden: "/hostel/dashboard",
  hr_manager: "/hr/dashboard",
  security_guard: "/visitor/dashboard",
  canteen_manager: "/canteen/dashboard",
  health_officer: "/health/dashboard",
};

// Which roles may access a path prefix. super_admin & admin can reach most areas.
export const ROUTE_ACCESS = {
  "/admin": ["super_admin", "admin"],
  "/teacher": ["super_admin", "admin", "teacher"],
  "/student": ["super_admin", "admin", "student"],
  "/parent": ["super_admin", "admin", "parent"],
  "/accountant": ["super_admin", "admin", "accountant"],
  "/library": ["super_admin", "admin", "librarian"],
  "/transport": ["super_admin", "admin", "transport_manager"],
  "/hostel": ["super_admin", "admin", "hostel_warden"],
  "/hr": ["super_admin", "admin", "hr_manager"],
  "/health": ["super_admin", "admin", "health_officer"],
  "/visitor": ["super_admin", "admin", "security_guard"],
  "/canteen": ["super_admin", "admin", "canteen_manager"],
  "/alumni": ["super_admin", "admin", "student", "parent"],
};

export const ATTENDANCE_STATUS = ["present", "absent", "late", "excused"];
export const PAYMENT_MODES = ["cash", "online", "cheque", "upi"];
export const INVOICE_STATUS = ["pending", "partial", "paid", "overdue"];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const LIBRARY_FINE_PER_DAY = Number(process.env.LIBRARY_FINE_PER_DAY || 2);
export const LOW_ATTENDANCE_THRESHOLD = Number(process.env.LOW_ATTENDANCE_THRESHOLD || 75);
export const LIBRARY_ISSUE_DAYS = 14;
export const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 5);

export const DEFAULT_GRADES = [
  { grade_name: "A+", min_percentage: 90, max_percentage: 100, grade_point: 10, remark: "Outstanding" },
  { grade_name: "A", min_percentage: 80, max_percentage: 89.99, grade_point: 9, remark: "Excellent" },
  { grade_name: "B+", min_percentage: 70, max_percentage: 79.99, grade_point: 8, remark: "Very Good" },
  { grade_name: "B", min_percentage: 60, max_percentage: 69.99, grade_point: 7, remark: "Good" },
  { grade_name: "C", min_percentage: 50, max_percentage: 59.99, grade_point: 6, remark: "Average" },
  { grade_name: "D", min_percentage: 40, max_percentage: 49.99, grade_point: 5, remark: "Pass" },
  { grade_name: "F", min_percentage: 0, max_percentage: 39.99, grade_point: 0, remark: "Fail" },
];
