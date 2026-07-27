import type { SupabaseClient } from "@supabase/supabase-js";
import { withServerCache } from "@/lib/serverQueryCache";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";

export const FEE_PAID_UNPAID_REGISTRY_PREFIX = "__fee_paid_unpaid_registry__:";

export type FeePaidUnpaidListKind = "paid" | "unpaid";

export type FeePaidUnpaidRow = {
  sr: number;
  admissionNo: string;
  studentName: string;
  oldNew: string;
  className: string;
  section: string;
  fatherName: string;
  visibilityStatus: string;
  mobile: string;
  lastYearDue: number;
  lastYearDuePaid: number;
  feeDue: number;
  feePaid: number;
  balance: number;
  list: FeePaidUnpaidListKind;
  studentId?: string;
};

export type FeePaidUnpaidRegistry = {
  academicYear: string;
  source?: {
    paid?: string;
    unpaid?: string;
  };
  seededAt?: string;
  counts?: {
    paid: number;
    unpaid: number;
  };
  students: FeePaidUnpaidRow[];
};

export type FeePaidUnpaidTotals = {
  lastYearDue: number;
  lastYearDuePaid: number;
  feeDue: number;
  feePaid: number;
  balance: number;
  students: number;
};

function parseAmount(value: unknown): number {
  const n = Number.parseInt(String(value ?? "0").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function feePaidUnpaidRegistryTitle(academicYear: string): string {
  return `${FEE_PAID_UNPAID_REGISTRY_PREFIX}${academicYear}`;
}

export function sumFeePaidUnpaidRows(rows: FeePaidUnpaidRow[]): FeePaidUnpaidTotals {
  return rows.reduce(
    (acc, row) => {
      acc.lastYearDue += row.lastYearDue;
      acc.lastYearDuePaid += row.lastYearDuePaid;
      acc.feeDue += row.feeDue;
      acc.feePaid += row.feePaid;
      acc.balance += row.balance;
      acc.students += 1;
      return acc;
    },
    {
      lastYearDue: 0,
      lastYearDuePaid: 0,
      feeDue: 0,
      feePaid: 0,
      balance: 0,
      students: 0,
    }
  );
}

async function resolveYearName(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYearName?: string | null
): Promise<string | null> {
  const requested = String(academicYearName ?? "").trim();
  if (requested) return requested;
  const years = await listBranchAcademicYears(admin, branchId);
  return years[0]?.name ?? null;
}

export async function loadFeePaidUnpaidRegistryNotice(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<FeePaidUnpaidRegistry | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", feePaidUnpaidRegistryTitle(academicYear))
    .maybeSingle();

  if (error?.code === "PGRST205" || !data?.content) return null;

  try {
    const parsed = JSON.parse(String(data.content)) as FeePaidUnpaidRegistry;
    if (!Array.isArray(parsed.students) || parsed.students.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Build paid/unpaid report rows from year-scoped feeDetails when no Excel registry exists.
 * Paid list = Fee Paid > 0; Unpaid list = Fee Due > 0 and Fee Paid = 0.
 */
export async function buildFeePaidUnpaidFromProfiles(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<FeePaidUnpaidRegistry> {
  const { loadStudentEnrollmentIndexForYear, loadStudentProfilesByIds } = await import(
    "@/lib/studentProfileStore"
  );

  const enrollments = await loadStudentEnrollmentIndexForYear(admin, branchId, academicYear);
  const studentIds = [...enrollments.keys()];
  const profiles = await loadStudentProfilesByIds(admin, branchId, studentIds);

  const byId = new Map<
    string,
    { id: string; admission_no: string; full_name: string; parent_phone: string | null; parent_name: string | null }
  >();
  for (let i = 0; i < studentIds.length; i += 100) {
    const chunk = studentIds.slice(i, i + 100);
    const { data: students } = await admin
      .from("students")
      .select("id, admission_no, full_name, parent_phone, parent_name")
      .eq("branch_id", branchId)
      .in("id", chunk);
    for (const row of students ?? []) {
      byId.set(String(row.id), row);
    }
  }

  const rows: FeePaidUnpaidRow[] = [];

  for (const id of studentIds) {
    const profile = profiles.get(id);
    const enrollment = (profile?.enrollments?.[academicYear] ?? {}) as Record<string, unknown>;
    const feeDetails = (enrollment.feeDetails ?? {}) as Record<string, unknown>;
    const feeDue = parseAmount(feeDetails.feePayable ?? feeDetails.feeDue);
    const feePaid = parseAmount(feeDetails.feePaid);
    const balance = parseAmount(
      feeDetails.balanceDue ?? Math.max(0, feeDue - feePaid)
    );
    const paymentStatus = String(feeDetails.paymentStatus ?? "").toLowerCase();

    const isUnpaid =
      paymentStatus === "unpaid" ||
      paymentStatus === "pending" ||
      (feeDue > 0 && feePaid <= 0);
    const isPaidList =
      feePaid > 0 ||
      paymentStatus === "paid" ||
      paymentStatus === "partial";

    if (!isPaidList && !isUnpaid) continue;

    const student = byId.get(id);
    const meta = enrollments.get(id);
    rows.push({
      sr: 0,
      admissionNo: String(student?.admission_no ?? "").trim(),
      studentName: String(student?.full_name ?? "").trim(),
      oldNew: String(feeDetails.feeStatus ?? enrollment.feeStatus ?? "").trim() || "—",
      className: String(meta?.className ?? enrollment.className ?? "").trim(),
      section: String(meta?.section ?? enrollment.section ?? "").trim(),
      fatherName: String(
        meta?.fatherName ?? enrollment.fatherName ?? student?.parent_name ?? ""
      ).trim(),
      visibilityStatus: String(feeDetails.visibilityStatus ?? "LIVE").trim() || "LIVE",
      mobile: String(
        feeDetails.mobile ??
          enrollment.fatherMobile1 ??
          enrollment.mobileNumber ??
          student?.parent_phone ??
          ""
      ).trim(),
      lastYearDue: parseAmount(
        feeDetails.lastYearDue ??
          (Array.isArray((feeDetails.feeGrid as any[]))
            ? (feeDetails.feeGrid as Array<{ name?: string; values?: unknown[] }>).find((r) =>
                String(r.name ?? "").toUpperCase().includes("LAST YEAR")
              )?.values?.[0]
            : 0)
      ),
      lastYearDuePaid: parseAmount(feeDetails.lastYearDuePaid),
      feeDue,
      feePaid,
      balance,
      list: isUnpaid && feePaid <= 0 ? "unpaid" : "paid",
      studentId: id,
    });
  }

  rows.sort((a, b) => {
    const classCmp = a.className.localeCompare(b.className);
    if (classCmp !== 0) return classCmp;
    return a.studentName.localeCompare(b.studentName);
  });
  rows.forEach((row, index) => {
    row.sr = index + 1;
  });

  const paid = rows.filter((r) => r.list === "paid").length;
  const unpaid = rows.filter((r) => r.list === "unpaid").length;

  return {
    academicYear,
    seededAt: new Date().toISOString(),
    source: { paid: "feeDetails", unpaid: "feeDetails" },
    counts: { paid, unpaid },
    students: rows,
  };
}

export async function loadBranchFeePaidUnpaid(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<{
  academicYear: string;
  paid: FeePaidUnpaidRow[];
  unpaid: FeePaidUnpaidRow[];
  paidTotals: FeePaidUnpaidTotals;
  unpaidTotals: FeePaidUnpaidTotals;
  source: "registry" | "profiles" | "empty";
}> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) {
    return {
      academicYear: String(academicYearName ?? ""),
      paid: [],
      unpaid: [],
      paidTotals: sumFeePaidUnpaidRows([]),
      unpaidTotals: sumFeePaidUnpaidRows([]),
      source: "empty",
    };
  }

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) {
    return {
      academicYear: "",
      paid: [],
      unpaid: [],
      paidTotals: sumFeePaidUnpaidRows([]),
      unpaidTotals: sumFeePaidUnpaidRows([]),
      source: "empty",
    };
  }

  return withServerCache(`fee-paid-unpaid|v2|${branchId}|${yearName}`, async () => {
    const registry = await loadFeePaidUnpaidRegistryNotice(admin, branchId, yearName);
    const payload =
      registry ?? (await buildFeePaidUnpaidFromProfiles(admin, branchId, yearName));

    // AccEvate paid/unpaid Excel often leaves Last Year Due blank (0). Fill from
    // year feeDetails / headwise APR so students with prior-year dues still show them.
    // Also append students who have last-year dues but are missing from the Excel lists.
    const { loadStudentEnrollmentIndexForYear, loadStudentProfilesByIds } = await import(
      "@/lib/studentProfileStore"
    );
    const enrollments = await loadStudentEnrollmentIndexForYear(admin, branchId, yearName);
    const allIds = [...enrollments.keys()];
    const profiles = await loadStudentProfilesByIds(admin, branchId, allIds);

    const byAdmStudent = new Map<string, { id: string; admission_no: string; full_name: string; parent_phone: string | null; parent_name: string | null }>();
    for (let i = 0; i < allIds.length; i += 100) {
      const chunk = allIds.slice(i, i + 100);
      const { data } = await admin
        .from("students")
        .select("id, admission_no, full_name, parent_phone, parent_name")
        .eq("branch_id", branchId)
        .in("id", chunk);
      for (const row of data ?? []) {
        byAdmStudent.set(String(row.admission_no), row as any);
        byAdmStudent.set(String(row.id), row as any);
      }
    }

    const seenAdm = new Set(
      payload.students.map((r) => String(r.admissionNo ?? "").trim()).filter(Boolean)
    );

    for (const row of payload.students) {
      if (!row.studentId) {
        const hit = byAdmStudent.get(row.admissionNo);
        if (hit) row.studentId = hit.id;
      }
      if (!row.studentId) continue;
      const profile = profiles.get(row.studentId);
      const enrollment = (profile?.enrollments?.[yearName] ?? {}) as Record<string, unknown>;
      const feeDetails = (enrollment.feeDetails ?? {}) as Record<string, unknown>;
      const grid = Array.isArray(feeDetails.feeGrid)
        ? (feeDetails.feeGrid as Array<{ name?: string; values?: unknown[] }>)
        : [];
      const lyFromGrid = parseAmount(
        grid.find((r) => String(r.name ?? "").toUpperCase().includes("LAST YEAR"))?.values?.[0]
      );
      const ly = parseAmount(feeDetails.lastYearDue) || lyFromGrid;
      const lyPaid = parseAmount(feeDetails.lastYearDuePaid);
      if (ly > 0) row.lastYearDue = ly;
      if (feeDetails.lastYearDuePaid != null || lyPaid > 0) row.lastYearDuePaid = lyPaid;
    }

    for (const id of allIds) {
      const profile = profiles.get(id);
      const enrollment = (profile?.enrollments?.[yearName] ?? {}) as Record<string, unknown>;
      const feeDetails = (enrollment.feeDetails ?? {}) as Record<string, unknown>;
      const grid = Array.isArray(feeDetails.feeGrid)
        ? (feeDetails.feeGrid as Array<{ name?: string; values?: unknown[] }>)
        : [];
      const lyFromGrid = parseAmount(
        grid.find((r) => String(r.name ?? "").toUpperCase().includes("LAST YEAR"))?.values?.[0]
      );
      const ly = parseAmount(feeDetails.lastYearDue) || lyFromGrid;
      if (ly <= 0) continue;
      const student = byAdmStudent.get(id);
      const adm = String(student?.admission_no ?? "").trim();
      if (!adm || seenAdm.has(adm)) continue;
      const feeDue = parseAmount(feeDetails.feePayable ?? feeDetails.feeDue) || ly;
      const feePaid = parseAmount(feeDetails.feePaid);
      const lyPaid = parseAmount(feeDetails.lastYearDuePaid);
      const meta = enrollments.get(id);
      payload.students.push({
        sr: payload.students.length + 1,
        admissionNo: adm,
        studentName: String(student?.full_name ?? "").trim(),
        oldNew: String(feeDetails.feeStatus ?? "").trim() || "—",
        className: String(meta?.className ?? enrollment.className ?? "").trim(),
        section: String(meta?.section ?? enrollment.section ?? "").trim(),
        fatherName: String(meta?.fatherName ?? student?.parent_name ?? "").trim(),
        visibilityStatus: String(feeDetails.visibilityStatus ?? "LIVE").trim() || "LIVE",
        mobile: String(student?.parent_phone ?? "").trim(),
        lastYearDue: ly,
        lastYearDuePaid: lyPaid,
        feeDue,
        feePaid,
        balance: Math.max(0, feeDue - feePaid),
        list: feePaid > 0 ? "paid" : "unpaid",
        studentId: id,
      });
      seenAdm.add(adm);
    }

    const paid = payload.students
      .filter((r) => r.list === "paid")
      .sort((a, b) => a.sr - b.sr || a.studentName.localeCompare(b.studentName));
    const unpaid = payload.students
      .filter((r) => r.list === "unpaid")
      .sort((a, b) => a.sr - b.sr || a.studentName.localeCompare(b.studentName));

    return {
      academicYear: yearName,
      paid,
      unpaid,
      paidTotals: sumFeePaidUnpaidRows(paid),
      unpaidTotals: sumFeePaidUnpaidRows(unpaid),
      source: registry ? "registry" : "profiles",
    };
  }, 60_000);
}
