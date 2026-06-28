export type TeacherProfileTab =
  | "Overview"
  | "Attendance"
  | "Leave Requests"
  | "Payroll & Payslips"
  | "My Expenses"
  | "Complaints & Feedback"
  | "Class Assignments";

export type LeaveRow = {
  id: string;
  type: string;
  from: string;
  to: string;
  days?: number;
  status: string;
};

export type PayslipRow = {
  id: string;
  period: string;
  salary: number;
  tds: number;
  deduct: number;
  net: number;
  status: string;
};

export type StaffExpenseRow = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  vendor: string;
  notes: string;
};

export type ComplaintRow = {
  id: string;
  recipient: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export function formatInr(value: number): string {
  if (!value) return "₹0";
  return value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export function leaveStatusTone(status: string): string {
  if (status === "Approved") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "Rejected") return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

export function expenseStatusTone(status: string): string {
  if (status === "Paid" || status === "Approved") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "Rejected") return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

export function complaintStatusTone(status: string): string {
  if (status === "Resolved" || status === "Closed") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "In Review") return "bg-blue-50 text-blue-800 border-blue-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

export function downloadPayslipText(params: {
  employeeName: string;
  employeeId: string;
  schoolName: string;
  period: string;
  salary: number;
  tds: number;
  deduct: number;
  net: number;
}) {
  const lines = [
    "IDP SCHOOLS — PAYSLIP",
    "====================",
    `School: ${params.schoolName}`,
    `Employee: ${params.employeeName}`,
    `Employee ID: ${params.employeeId}`,
    `Period: ${params.period}`,
    "",
    `Gross Salary: ${formatInr(params.salary)}`,
    `TDS: ${formatInr(params.tds)}`,
    `Other Deductions: ${formatInr(params.deduct)}`,
    `Net Pay: ${formatInr(params.net)}`,
    "",
    `Generated: ${new Date().toLocaleString("en-IN")}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `payslip-${params.period.replace(/\s+/g, "-").toLowerCase()}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function matchesEmployeeRecord(
  data: Record<string, unknown>,
  docId: string,
  uid: string | null,
  employeeId: string,
  name: string | null,
  email: string | null
): boolean {
  const ids = new Set([uid, employeeId, docId].filter(Boolean).map(String));
  const recordEmployeeId = String(data.employeeId ?? data.employee_id ?? "");
  const authUid = String(data.authUid ?? data.auth_uid ?? data.userId ?? data.user_id ?? "");
  if (ids.has(recordEmployeeId) || ids.has(authUid) || ids.has(docId)) return true;
  const recordEmail = String(data.email ?? "").toLowerCase();
  const recordName = String(data.name ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`).toLowerCase().trim();
  if (email && recordEmail && recordEmail === email.toLowerCase()) return true;
  if (name && recordName && recordName.includes(name.toLowerCase())) return true;
  return false;
}
