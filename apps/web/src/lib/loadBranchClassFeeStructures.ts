import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

export type BranchClassFeeStructureRecord = {
  id: string;
  grade: string;
  academicYear: string;
  status: string;
  feeGrid: Array<{ name: string; method?: string; values: string[] }>;
  remarks?: string | null;
  updatedAt?: string | null;
};

function shapeRow(row: Record<string, unknown>): BranchClassFeeStructureRecord {
  return {
    id: String(row.id ?? ""),
    grade: String(row.grade ?? "").trim(),
    academicYear: String(row.academic_year ?? "").trim(),
    status: String(row.status ?? "Active"),
    feeGrid: Array.isArray(row.fee_grid) ? (row.fee_grid as BranchClassFeeStructureRecord["feeGrid"]) : [],
    remarks: row.remarks != null ? String(row.remarks) : null,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
  };
}

export async function loadBranchClassFeeRecords(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchClassFeeStructureRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  let query = admin
    .from("branch_class_fee_structures")
    .select("id, grade, academic_year, status, fee_grid, remarks, updated_at")
    .eq("branch_id", branchId);

  if (academicYearName) {
    query = query.eq("academic_year", academicYearName);
  }

  const { data, error } = await query.order("grade", { ascending: true });

  if (error) {
    if (error.code === "PGRST205") return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => shapeRow(row as Record<string, unknown>));
}

export async function upsertBranchClassFeeRecord(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  entry: {
    id: string;
    grade: string;
    academicYear: string;
    status?: string;
    feeGrid: BranchClassFeeStructureRecord["feeGrid"];
    remarks?: string | null;
  }
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const now = new Date().toISOString();
  const { error } = await admin.from("branch_class_fee_structures").upsert(
    {
      id: entry.id,
      branch_id: branchId,
      grade: entry.grade,
      academic_year: entry.academicYear,
      status: entry.status ?? "Active",
      fee_grid: entry.feeGrid,
      remarks: entry.remarks ?? null,
      updated_at: now,
    },
    { onConflict: "branch_id,grade,academic_year" }
  );

  if (error) throw new Error(error.message);
}
