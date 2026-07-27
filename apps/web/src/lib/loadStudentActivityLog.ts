import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { loadBranchFeePayments } from "@/lib/loadBranchFeePayments";
import { loadStudentProfileData } from "@/lib/studentProfileStore";

export type StudentActivityLogEntry = {
  id: string;
  date: string;
  module: string;
  message: string;
  user: string;
  createdAt: string;
};

function formatWhen(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isTransportFee(text: string) {
  return /transport|bus|conveyance/i.test(text);
}

function collectProfileArrays(
  profile: Record<string, unknown>,
  year: string
): {
  discountLog: unknown[];
  feeTransactions: unknown[];
  transportHistory: unknown[];
} {
  const yearEnrollment =
    year && profile.enrollments && typeof profile.enrollments === "object"
      ? asRecord((profile.enrollments as Record<string, unknown>)[year])
      : {};

  const feeDetails = asRecord(profile.feeDetails);
  const yearFeeDetails = asRecord(yearEnrollment.feeDetails);

  const discountLog = [
    ...(Array.isArray(profile.discountLog) ? profile.discountLog : []),
    ...(Array.isArray(yearEnrollment.discountLog) ? yearEnrollment.discountLog : []),
    ...(Array.isArray(feeDetails.discountLog) ? feeDetails.discountLog : []),
    ...(Array.isArray(yearFeeDetails.discountLog) ? yearFeeDetails.discountLog : []),
  ];

  const feeTransactions = [
    ...(Array.isArray(profile.feeTransactions) ? profile.feeTransactions : []),
    ...(Array.isArray(profile.transactions) ? profile.transactions : []),
    ...(Array.isArray(yearEnrollment.feeTransactions) ? yearEnrollment.feeTransactions : []),
    ...(Array.isArray(feeDetails.feeTransactions) ? feeDetails.feeTransactions : []),
    ...(Array.isArray(yearFeeDetails.feeTransactions) ? yearFeeDetails.feeTransactions : []),
  ];

  const transportHistory = [
    ...(Array.isArray(profile.transportHistory) ? profile.transportHistory : []),
    ...(Array.isArray(yearEnrollment.transportHistory) ? yearEnrollment.transportHistory : []),
  ];

  return { discountLog, feeTransactions, transportHistory };
}

export async function loadStudentActivityLog(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  studentId: string,
  options: { academicYear?: string | null; limit?: number | null } = {}
): Promise<StudentActivityLogEntry[]> {
  const sid = String(studentId ?? "").trim();
  if (!sid) return [];

  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const year = String(options.academicYear ?? "").trim();
  const limit = options.limit != null && Number.isFinite(options.limit) ? Number(options.limit) : 200;
  const entries: StudentActivityLogEntry[] = [];

  const [payments, profile] = await Promise.all([
    loadBranchFeePayments(admin, schoolSlug, {
      studentId: sid,
      limit: 300,
    }),
    loadStudentProfileData(admin, branchId, sid),
  ]);

  for (const pay of payments) {
    const particular = String(pay.particular ?? pay.feeMonth ?? "Fee").trim() || "Fee";
    const transport = isTransportFee(`${particular} ${pay.feeMonth ?? ""} ${pay.remark ?? ""}`);
    const createdAt = String(pay.createdAt || pay.date || "");
    entries.push({
      id: `fee:${pay.id}`,
      date: formatWhen(createdAt || pay.date),
      module: transport ? "Transport Fee" : "Fee Payment",
      message: `Paid ${money(pay.amount)} via ${pay.mode || "—"} for ${particular}${
        pay.receiptNo ? ` (Receipt ${pay.receiptNo})` : ""
      }${pay.status ? ` · ${pay.status}` : ""}`,
      user: String(pay.collectedByName || "System"),
      createdAt: createdAt || pay.date || "",
    });
  }

  const profileBags = collectProfileArrays(profile as Record<string, unknown>, year);

  profileBags.discountLog.forEach((raw, idx) => {
    const row = asRecord(raw);
    const createdAt = String(row.date ?? row.createdAt ?? "");
    const amount = Number(row.amount ?? 0);
    const remark = String(row.remark ?? row.particular ?? row.message ?? "Discount applied").trim();
    const transport = isTransportFee(remark);
    entries.push({
      id: `discount:${idx}:${createdAt}:${amount}`,
      date: formatWhen(createdAt),
      module: transport ? "Transport Discount" : "Fee Discount",
      message: `${remark}${amount ? ` · ${money(amount)}` : ""}`,
      user: String(row.user ?? row.changedBy ?? "Admin"),
      createdAt: createdAt || `discount-${idx}`,
    });
  });

  profileBags.feeTransactions.forEach((raw, idx) => {
    const row = asRecord(raw);
    const createdAt = String(row.date ?? row.createdAt ?? row.paidOn ?? "");
    const amount = Number(row.amount ?? row.paid ?? 0);
    const particular = String(row.particular ?? row.feeMonth ?? row.remark ?? "Fee").trim();
    const receipt = String(row.receiptNo ?? row.id ?? "").trim();
    if (receipt && payments.some((p) => String(p.id) === receipt || String(p.receiptNo) === receipt)) {
      return;
    }
    const transport = isTransportFee(`${particular} ${row.remark ?? ""}`);
    entries.push({
      id: `feeTx:${idx}:${createdAt}:${amount}`,
      date: formatWhen(createdAt),
      module: transport ? "Transport Fee" : "Fee Transaction",
      message: `${particular}${amount ? ` · ${money(amount)}` : ""}${
        row.mode ? ` via ${String(row.mode)}` : ""
      }`,
      user: String(row.collectedByName ?? row.user ?? "System"),
      createdAt: createdAt || `feeTx-${idx}`,
    });
  });

  profileBags.transportHistory.forEach((raw, idx) => {
    const row = asRecord(raw);
    const createdAt = String(row.date ?? row.createdAt ?? "");
    entries.push({
      id: `transport:${String(row.id ?? idx)}:${createdAt}`,
      date: formatWhen(createdAt),
      module: "Transport",
      message: String(row.message ?? row.remark ?? "Transport / fee details updated"),
      user: String(row.user ?? "Admin"),
      createdAt: createdAt || `transport-${idx}`,
    });
  });

  entries.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return entries.slice(0, limit);
}
