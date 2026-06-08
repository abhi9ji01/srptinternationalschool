// Shared backend constants: roles, route-access policy, grades, fees.

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

export const ALL_ROLES = Object.values(ROLES);

// Convenience role groups for route guards.
export const ADMINS = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
export const STAFF_ROLES = [
  ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.ACCOUNTANT,
  ROLES.LIBRARIAN, ROLES.TRANSPORT_MANAGER, ROLES.HOSTEL_WARDEN,
  ROLES.HR_MANAGER, ROLES.SECURITY_GUARD, ROLES.CANTEEN_MANAGER, ROLES.HEALTH_OFFICER,
];

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

export function gradeFromPercentage(percentage, gradeConfig = DEFAULT_GRADES) {
  const p = Number(percentage || 0);
  const m = gradeConfig.find((g) => p >= Number(g.min_percentage) && p <= Number(g.max_percentage));
  return m ? m.grade_name : "F";
}
