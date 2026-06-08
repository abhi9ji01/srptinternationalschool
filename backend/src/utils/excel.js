import * as XLSX from "xlsx";

/** Parse an uploaded xlsx/csv buffer into an array of row objects. */
export function parseExcel(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

/** Build an xlsx Buffer from an array of row objects. */
export function buildExcel(rows, sheetName = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(rows || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/** Build a downloadable template (header-only) workbook. */
export function buildTemplate(headers, sheetName = "Template") {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export const STUDENT_IMPORT_HEADERS = [
  "name",
  "email",
  "phone",
  "admission_number",
  "roll_number",
  "dob",
  "gender",
  "blood_group",
  "father_name",
  "mother_name",
  "guardian_phone",
  "address",
];

export const MARKS_IMPORT_HEADERS = ["admission_number", "student_name", "marks_obtained", "is_absent"];
