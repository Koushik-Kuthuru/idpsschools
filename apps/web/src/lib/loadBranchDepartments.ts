import type { SupabaseClient } from "@supabase/supabase-js";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { loadBranchStaffRecords } from "@/lib/loadBranchStaff";
import {
  addDepartmentToCatalog,
  addDesignationToCatalog,
  catalogFromStaffDerived,
  deleteDepartmentFromCatalog,
  deleteDesignationFromCatalog,
  loadBranchDepartmentsCatalog,
  normalizeDepartmentName,
  normalizeDesignationName,
  saveBranchDepartmentsCatalog,
  slugDepartmentId,
  slugDesignationId,
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

function buildDerivedFromStaff(staff: Record<string, unknown>[]) {
  const counts = aggregateStaffCounts(staff);
  return [...counts.entries()]
    .map(([name, data]) => ({
      id: slugDepartmentId(name),
      name,
      category: data.category,
      staffCount: data.staffCount,
      designations: [...data.designations.entries()]
        .map(([desigName, staffCount]) => ({
          id: slugDesignationId(desigName),
          name: desigName,
          staffCount,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadBranchDepartments(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchDepartmentRow[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  const staff = await loadBranchStaffRecords(admin, schoolSlug, "all", yearName);
  const derived = buildDerivedFromStaff(staff);
  const staffCounts = aggregateStaffCounts(staff);

  let catalog = await loadBranchDepartmentsCatalog(admin, branchId);
  if (catalog.departments.length === 0 && derived.length > 0) {
    catalog = catalogFromStaffDerived(derived);
    await saveBranchDepartmentsCatalog(admin, branchId, catalog);
    catalog = await loadBranchDepartmentsCatalog(admin, branchId);
  }

  return catalog.departments.map((dept) => {
    const stats = staffCounts.get(dept.name);
    const designations = dept.designations.map((item) => ({
      id: item.id,
      name: item.name,
      staffCount: stats?.designations.get(item.name) ?? 0,
    }));

    const staffCount = designations.reduce((sum, d) => sum + d.staffCount, 0) || stats?.staffCount || 0;
    const category =
      dept.name === "TEACHING" || stats?.category === "teaching" ? "teaching" : "non_teaching";

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
}

async function resolveBranchIdOrThrow(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<string> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  return branchId;
}

export async function addBranchDepartment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  name: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await addDepartmentToCatalog(admin, branchId, name);
}

export async function updateBranchDepartment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string,
  name: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await updateDepartmentInCatalog(admin, branchId, departmentId, name);
}

export async function deleteBranchDepartment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await deleteDepartmentFromCatalog(admin, branchId, departmentId);
}

export async function addBranchDesignation(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string,
  name: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await addDesignationToCatalog(admin, branchId, departmentId, name);
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
}

export async function deleteBranchDesignation(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  departmentId: string,
  designationId: string
): Promise<void> {
  const branchId = await resolveBranchIdOrThrow(admin, schoolSlug);
  await deleteDesignationFromCatalog(admin, branchId, departmentId, designationId);
}
