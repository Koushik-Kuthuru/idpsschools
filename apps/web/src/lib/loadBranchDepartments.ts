import type { SupabaseClient } from "@supabase/supabase-js";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { loadBranchStaffRecords } from "@/lib/loadBranchStaff";
import { withServerCache, invalidateServerCache } from "@/lib/serverQueryCache";
import {
  addDepartmentToCatalog,
  addDesignationToCatalog,
  deleteDepartmentFromCatalog,
  deleteDesignationFromCatalog,
  loadBranchDepartmentsCatalog,
  normalizeDepartmentName,
  normalizeDesignationName,
  updateDepartmentInCatalog,
  updateDesignationInCatalog,
} from "@/lib/branchDepartmentsStore";

export type BranchDesignationRow = {
  id: string;
  name: string;
  staffCount: number;
};

export type BranchDepartmentRow = {
  id: string;
  name: string;
  subtitle: string;
  category: "teaching" | "non_teaching";
  designations: BranchDesignationRow[];
  designationSummary: string;
  hodName: string | null;
  staffCount: number;
  status: "Active" | "Inactive";
};

async function resolveYearName(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYearName?: string | null
): Promise<string | null> {
  let yearName = academicYearName?.trim() || null;
  if (!yearName) {
    const years = await listBranchAcademicYears(admin, branchId);
    yearName = years.find((y) => y.is_current)?.name ?? years[0]?.name ?? null;
  }
  return yearName;
}

function aggregateStaffCounts(
  staff: Record<string, unknown>[]
): Map<string, { staffCount: number; designations: Map<string, number>; category: "teaching" | "non_teaching" }> {
  const map = new Map<
    string,
    { staffCount: number; designations: Map<string, number>; category: "teaching" | "non_teaching" }
  >();

  for (const member of staff) {
    const deptName = normalizeDepartmentName(String(member.department ?? "General"));
    const designation = normalizeDesignationName(String(member.designation ?? "Staff"));
    const kind = member.staffKind === "teaching" ? "teaching" : "non_teaching";

    if (!map.has(deptName)) {
      map.set(deptName, { staffCount: 0, designations: new Map(), category: kind });
    }

    const dept = map.get(deptName)!;
    dept.staffCount += 1;
    dept.designations.set(designation, (dept.designations.get(designation) ?? 0) + 1);
  }

  return map;
}

export async function loadBranchDepartments(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null,
  options?: { includeCounts?: boolean }
): Promise<BranchDepartmentRow[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const includeCounts = options?.includeCounts !== false;
  const yearName = await resolveYearName(admin, branchId, academicYearName);

  return withServerCache(
    `departments|${branchId}|${yearName ?? ""}|counts:${includeCounts ? 1 : 0}`,
    async () => {
      const catalog = await loadBranchDepartmentsCatalog(admin, branchId);

      let staffCounts: ReturnType<typeof aggregateStaffCounts> | null = null;
      if (includeCounts) {
        const staff = await loadBranchStaffRecords(admin, schoolSlug, "all", yearName);
        staffCounts = aggregateStaffCounts(staff);
      }

      return catalog.departments.map((dept) => {
        const stats = staffCounts?.get(dept.name);
        const designations = dept.designations.map((item) => ({
          id: item.id,
          name: item.name,
          staffCount: stats?.designations.get(item.name) ?? 0,
        }));

        const staffCount = designations.reduce((sum, d) => sum + d.staffCount, 0) || stats?.staffCount || 0;
        const category =
          dept.category === "teaching" || dept.category === "non_teaching"
            ? dept.category
            : stats?.category === "teaching"
              ? "teaching"
              : "non_teaching";

        return {
          id: dept.id,
          name: dept.name,
          subtitle: `${designations.length} designation${designations.length === 1 ? "" : "s"}`,
          category,
          designations,
          designationSummary: designations.map((d) => d.name).join(", "),
          hodName: null,
          staffCount,
          status: "Active" as const,
        };
      });
    },
    includeCounts ? 60_000 : 120_000
  );
}

async function resolveBranchIdOrThrow(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<string> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  return branchId;
}

function bustDepartmentCaches(branchId: string) {
  invalidateServerCache(`departments|${branchId}`);
  invalidateServerCache(`staff|${branchId}`);
}

export async function addBranchDepartment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  name: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await addDepartmentToCatalog(admin, branchId, name);
  bustDepartmentCaches(branchId);
}

export async function updateBranchDepartment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string,
  name: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await updateDepartmentInCatalog(admin, branchId, departmentId, name);
  bustDepartmentCaches(branchId);
}

export async function deleteBranchDepartment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await deleteDepartmentFromCatalog(admin, branchId, departmentId);
  bustDepartmentCaches(branchId);
}

export async function addBranchDesignation(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string,
  name: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await addDesignationToCatalog(admin, branchId, departmentId, name);
  bustDepartmentCaches(branchId);
}

export async function updateBranchDesignation(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string,
  designationId: string,
  name: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await updateDesignationInCatalog(admin, branchId, departmentId, designationId, name);
  bustDepartmentCaches(branchId);
}

export async function deleteBranchDesignation(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string,
  designationId: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await deleteDesignationFromCatalog(admin, branchId, departmentId, designationId);
  bustDepartmentCaches(branchId);
}
