/** Available email-template variables and their sample values (for previews/tests). */
export const SAMPLE_VARS = {
  student_name: "Aarav Sharma",
  parent_name: "Mr. Rajesh Sharma",
  class_name: "Class 10",
  section_name: "A",
  school_name: "SRPT International School",
  school_logo: "",
  fee_amount: "₹12,500",
  due_date: "2025-07-15",
  receipt_number: "RCPT-2025-001",
  exam_date: "2025-07-01",
  subject_name: "Mathematics",
  marks_obtained: "85",
  total_marks: "100",
  grade: "A",
  teacher_name: "Mrs. Priya Nair",
  password: "Temp@1234",
  login_url: "http://localhost:3000/login",
  current_date: "2025-06-09",
};

export const AVAILABLE_VARS = Object.keys(SAMPLE_VARS);

/** Replace {{var}} tokens in `html` using `values` (falling back to "" for unknowns). */
export function renderTemplate(html = "", values = {}) {
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    values[key] != null ? String(values[key]) : ""
  );
}
