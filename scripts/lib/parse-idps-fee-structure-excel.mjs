import XLSX from "xlsx";

const FEE_MONTHS = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];
const MONTH_INDEX = Object.fromEntries(FEE_MONTHS.map((m, i) => [m, i]));

const STANDARD_FEE_ROWS = [
  { name: "LAST YEAR DUE", method: "-" },
  { name: "ADMISSION FEE", method: "ONE TIME" },
  { name: "TUITION FEE", method: "QUARTERLY" },
  { name: "HOSTEL FEE", method: "QUARTERLY" },
  { name: "IIT FEE", method: "-" },
  { name: "OLYMPIAD FEE", method: "-" },
  { name: "EXCURSION FEE", method: "-" },
  { name: "CURRICULUM FEE", method: "-" },
  { name: "FOOD FEE", method: "-" },
  { name: "MISCELLANEOUS", method: "-" },
  { name: "LAUNDRY FEE", method: "-" },
  { name: "CO-SPARK FEE", method: "-" },
  { name: "TRANSPORT FEE", method: "QUARTERLY" },
];

/** Excel class label → branch grade name (Classes page). */
export const EXCEL_CLASS_TO_BRANCH_GRADE = {
  Nursery: "Nursery",
  LKG: "PP1 (LKG)",
  UKG: "PP2 (UKG)",
  "PP1 (LKG)": "PP1 (LKG)",
  "PP2 (UKG)": "PP2 (UKG)",
  "Class I": "I",
  "Class II": "II",
  "Class III": "III",
  "Class IV": "IV",
  "Class V": "V",
  "Class VI": "VI",
  "Class VII": "VII",
  "Class VIII": "VIII",
  "Class IX": "IX",
  "Class X": "X",
  "Class XI (MPC)": "XI (MPC)",
  "Class XI (BiPC)": "XI (BiPC)",
  "Class XI (MEC)": "XI (MEC)",
  "Class XI (NDA)": "XI + NDA",
  "Class XII": "XII",
};

function zeros() {
  return Array(12).fill("0");
}

function parseNum(value) {
  if (value == null || value === "") return 0;
  const n = Number.parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function setMonth(values, month, amount) {
  if (!amount) return;
  values[MONTH_INDEX[month]] = String(amount);
}

export function excelClassToBranchGrade(excelClass) {
  const label = String(excelClass ?? "").trim();
  if (!label) return "";
  if (EXCEL_CLASS_TO_BRANCH_GRADE[label]) return EXCEL_CLASS_TO_BRANCH_GRADE[label];
  return label.replace(/^Class\s+/i, "").trim();
}

export function gradeDocId(grade) {
  return grade
    .trim()
    .replaceAll("/", "-")
    .replace(/\s+/g, "-")
    .replace(/\+/g, "-plus-");
}

export function buildFeeGridFromExcelRow(row) {
  const admission = zeros();
  const tuition = zeros();
  const hostel = zeros();

  setMonth(admission, "APR", row.admission);
  setMonth(tuition, "JUN", row.tuitionJun);
  setMonth(tuition, "JUL", row.tuitionJul);
  setMonth(tuition, "OCT", row.tuitionOct);
  setMonth(tuition, "JAN", row.tuitionJan);
  setMonth(hostel, "JUN", row.hostelJun);
  setMonth(hostel, "OCT", row.hostelOct);
  setMonth(hostel, "JAN", row.hostelJan);

  const amountsByName = {
    "LAST YEAR DUE": zeros(),
    "ADMISSION FEE": admission,
    "TUITION FEE": tuition,
    "HOSTEL FEE": hostel,
  };

  return STANDARD_FEE_ROWS.map((fee) => ({
    name: fee.name,
    method: fee.method,
    values: amountsByName[fee.name] ? [...amountsByName[fee.name]] : zeros(),
  }));
}

function findFeeStructureSheet(workbook) {
  const byName =
    workbook.SheetNames.find((name) => /fee structure/i.test(name)) ??
    workbook.SheetNames[0];
  return workbook.Sheets[byName];
}

function readMainSheetRows(workbook) {
  const sheet = findFeeStructureSheet(workbook);
  if (!sheet) return [];

  const table = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const rows = [];

  for (let i = 1; i < table.length; i += 1) {
    const line = table[i];
    const excelClass = String(line[0] ?? "").trim();
    if (!excelClass) continue;

    rows.push({
      excelClass,
      grade: excelClassToBranchGrade(excelClass),
      admission: parseNum(line[1]),
      tuitionJun: parseNum(line[2]),
      tuitionJul: parseNum(line[3]),
      tuitionOct: parseNum(line[4]),
      tuitionJan: parseNum(line[5]),
      hostelJun: parseNum(line[7]),
      hostelOct: parseNum(line[8]),
      hostelJan: parseNum(line[9]),
      remarks: String(line[12] ?? "").trim() || undefined,
    });
  }

  return rows;
}

export function classFeeStructureId(grade, academicYear) {
  return `${gradeDocId(grade)}-${academicYear}`;
}

export function parseIdpsFeeStructureExcel(filePath, academicYear = "2026-27") {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const parsedRows = readMainSheetRows(workbook);

  return parsedRows.map((row) => ({
    id: classFeeStructureId(row.grade, academicYear),
    grade: row.grade,
    excelClass: row.excelClass,
    academicYear,
    status: "Active",
    remarks: row.remarks,
    feeGrid: buildFeeGridFromExcelRow(row),
  }));
}
