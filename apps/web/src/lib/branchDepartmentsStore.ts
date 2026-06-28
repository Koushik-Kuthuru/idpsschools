import type { SupabaseClient } from "@supabase/supabase-js";

export const BRANCH_DEPARTMENTS_NOTICE_TITLE = "__branch_departments_catalog__";

export type CatalogDesignation = {
  id: string;
  name: string;
};

export type CatalogDepartment = {
  id: string;
  name: string;
  designations: CatalogDesignation[];
};

export type BranchDepartmentsCatalog = {
  departments: CatalogDepartment[];
  updatedAt?: string;
};

type DbDepartment = {
  id: string;
  branch_id: string;
  slug: string;
  name: string;
  category: string | null;
  hod_name: string | null;
  status: string;
};

type DbDesignation = {
  id: string;
  branch_id: string;
  department_id: string;
  slug: string;
  name: string;
  status: string;
};

export function normalizeDepartmentName(name: string): string {
  return String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function normalizeDesignationName(name: string): string {
  return normalizeDepartmentName(name);
}

export function slugDepartmentId(name: string): string {
  return (
    normalizeDepartmentName(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "department"
  );
}

export function slugDesignationId(name: string): string {
  return (
    normalizeDesignationName(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "designation"
  );
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || /departments|designations|schema cache/i.test(error.message ?? "");
}

async function loadNoticesCatalog(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<BranchDepartmentsCatalog> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", BRANCH_DEPARTMENTS_NOTICE_TITLE)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.content) return { departments: [] };

  try {
    const parsed = JSON.parse(String(data.content));
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.departments)) {
      return { departments: [] };
    }
    return parsed as BranchDepartmentsCatalog;
  } catch {
    return { departments: [] };
  }
}

async function countBranchDepartments(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<number | null> {
  const { count, error } = await admin
    .from("departments")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId);

  if (isMissingTableError(error)) return null;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function persistCatalogToDb(
  admin: SupabaseClient<any>,
  branchId: string,
  catalog: BranchDepartmentsCatalog
): Promise<void> {
  for (const dept of catalog.departments) {
    const normalizedName = normalizeDepartmentName(dept.name);
    const slug = dept.id || slugDepartmentId(normalizedName);

    const { data: inserted, error: deptError } = await admin
      .from("departments")
      .upsert(
        {
          branch_id: branchId,
          slug,
          name: normalizedName,
          status: "Active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "branch_id,slug" }
      )
      .select("id")
      .single();

    if (deptError) throw new Error(deptError.message);

    for (const item of dept.designations) {
      const desigName = normalizeDesignationName(item.name);
      const desigSlug = item.id || slugDesignationId(desigName);
      const { error: desigError } = await admin.from("designations").upsert(
        {
          branch_id: branchId,
          department_id: inserted.id,
          slug: desigSlug,
          name: desigName,
          status: "Active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "department_id,slug" }
      );
      if (desigError) throw new Error(desigError.message);
    }
  }
}

export async function migrateNoticesCatalogToDbIfNeeded(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<void> {
  const count = await countBranchDepartments(admin, branchId);
  if (count === null || count > 0) return;

  const catalog = await loadNoticesCatalog(admin, branchId);
  if (catalog.departments.length === 0) return;

  await persistCatalogToDb(admin, branchId, catalog);
}

export async function loadBranchDepartmentsCatalog(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<BranchDepartmentsCatalog> {
  await migrateNoticesCatalogToDbIfNeeded(admin, branchId);

  const { data: departments, error: deptError } = await admin
    .from("departments")
    .select("id, slug, name")
    .eq("branch_id", branchId)
    .order("name", { ascending: true });

  if (isMissingTableError(deptError)) {
    return loadNoticesCatalog(admin, branchId);
  }
  if (deptError) throw new Error(deptError.message);

  const deptRows = (departments ?? []) as Pick<DbDepartment, "id" | "slug" | "name">[];
  if (deptRows.length === 0) return { departments: [] };

  const deptIds = deptRows.map((d) => d.id);
  const { data: designations, error: desigError } = await admin
    .from("designations")
    .select("department_id, slug, name")
    .eq("branch_id", branchId)
    .in("department_id", deptIds)
    .order("name", { ascending: true });

  if (desigError) throw new Error(desigError.message);

  const desigByDept = new Map<string, CatalogDesignation[]>();
  for (const row of (designations ?? []) as Pick<DbDesignation, "department_id" | "slug" | "name">[]) {
    const list = desigByDept.get(row.department_id) ?? [];
    list.push({ id: row.slug, name: row.name });
    desigByDept.set(row.department_id, list);
  }

  return {
    departments: deptRows.map((dept) => ({
      id: dept.slug,
      name: dept.name,
      designations: desigByDept.get(dept.id) ?? [],
    })),
    updatedAt: new Date().toISOString(),
  };
}

export async function saveBranchDepartmentsCatalog(
  admin: SupabaseClient<any>,
  branchId: string,
  catalog: BranchDepartmentsCatalog
): Promise<void> {
  const count = await countBranchDepartments(admin, branchId);
  if (count === null) {
    throw new Error(
      "departments table not found — run supabase/migrations/20260627140000_departments_designations.sql"
    );
  }

  const { data: existingDepts, error: loadError } = await admin
    .from("departments")
    .select("id, slug")
    .eq("branch_id", branchId);

  if (loadError) throw new Error(loadError.message);

  const existingSlugs = new Set((existingDepts ?? []).map((d) => d.slug as string));
  const nextSlugs = new Set(catalog.departments.map((d) => d.id));

  for (const slug of existingSlugs) {
    if (!nextSlugs.has(slug)) {
      const row = (existingDepts ?? []).find((d) => d.slug === slug);
      if (row?.id) {
        const { error } = await admin.from("departments").delete().eq("id", row.id);
        if (error) throw new Error(error.message);
      }
    }
  }

  await persistCatalogToDb(admin, branchId, catalog);
}

export function catalogFromStaffDerived(
  derived: Array<{
    id: string;
    name: string;
    designations: Array<{ name: string }>;
  }>
): BranchDepartmentsCatalog {
  return {
    departments: derived.map((dept) => ({
      id: dept.id,
      name: normalizeDepartmentName(dept.name),
      designations: dept.designations.map((d) => ({
        id: slugDesignationId(d.name),
        name: normalizeDesignationName(d.name),
      })),
    })),
  };
}

async function getDepartmentBySlug(
  admin: SupabaseClient<any>,
  branchId: string,
  departmentSlug: string
): Promise<DbDepartment | null> {
  const { data, error } = await admin
    .from("departments")
    .select("*")
    .eq("branch_id", branchId)
    .eq("slug", departmentSlug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DbDepartment | null) ?? null;
}

async function getDesignationBySlug(
  admin: SupabaseClient<any>,
  branchId: string,
  departmentUuid: string,
  designationSlug: string
): Promise<DbDesignation | null> {
  const { data, error } = await admin
    .from("designations")
    .select("*")
    .eq("branch_id", branchId)
    .eq("department_id", departmentUuid)
    .eq("slug", designationSlug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DbDesignation | null) ?? null;
}

export async function addDepartmentToCatalog(
  admin: SupabaseClient<any>,
  branchId: string,
  name: string
): Promise<void> {
  const normalized = normalizeDepartmentName(name);
  if (!normalized) throw new Error("Department name is required");

  const slug = slugDepartmentId(normalized);
  const existing = await getDepartmentBySlug(admin, branchId, slug);
  if (existing) throw new Error("Department already exists");

  const { data: nameConflict } = await admin
    .from("departments")
    .select("id")
    .eq("branch_id", branchId)
    .eq("name", normalized)
    .maybeSingle();

  if (nameConflict) throw new Error("Department already exists");

  const { error } = await admin.from("departments").insert({
    branch_id: branchId,
    slug,
    name: normalized,
    status: "Active",
  });

  if (error) throw new Error(error.message);
}

export async function updateDepartmentInCatalog(
  admin: SupabaseClient<any>,
  branchId: string,
  departmentSlug: string,
  name: string
): Promise<void> {
  const normalized = normalizeDepartmentName(name);
  if (!normalized) throw new Error("Department name is required");

  const dept = await getDepartmentBySlug(admin, branchId, departmentSlug);
  if (!dept) throw new Error("Department not found");

  const nextSlug = slugDepartmentId(normalized);

  const { data: slugConflict } = await admin
    .from("departments")
    .select("id")
    .eq("branch_id", branchId)
    .eq("slug", nextSlug)
    .neq("id", dept.id)
    .maybeSingle();

  if (slugConflict) throw new Error("Another department with this name already exists");

  const { data: nameConflict } = await admin
    .from("departments")
    .select("id")
    .eq("branch_id", branchId)
    .eq("name", normalized)
    .neq("id", dept.id)
    .maybeSingle();

  if (nameConflict) throw new Error("Another department with this name already exists");

  const { error } = await admin
    .from("departments")
    .update({
      slug: nextSlug,
      name: normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dept.id);

  if (error) throw new Error(error.message);
}

export async function deleteDepartmentFromCatalog(
  admin: SupabaseClient<any>,
  branchId: string,
  departmentSlug: string
): Promise<void> {
  const dept = await getDepartmentBySlug(admin, branchId, departmentSlug);
  if (!dept) return;

  const { error } = await admin.from("departments").delete().eq("id", dept.id);
  if (error) throw new Error(error.message);
}

export async function addDesignationToCatalog(
  admin: SupabaseClient<any>,
  branchId: string,
  departmentSlug: string,
  name: string
): Promise<void> {
  const normalized = normalizeDesignationName(name);
  if (!normalized) throw new Error("Designation name is required");

  const dept = await getDepartmentBySlug(admin, branchId, departmentSlug);
  if (!dept) throw new Error("Department not found");

  const slug = slugDesignationId(normalized);
  const existing = await getDesignationBySlug(admin, branchId, dept.id, slug);
  if (existing) throw new Error("Designation already exists in this department");

  const { data: nameConflict } = await admin
    .from("designations")
    .select("id")
    .eq("department_id", dept.id)
    .eq("name", normalized)
    .maybeSingle();

  if (nameConflict) throw new Error("Designation already exists in this department");

  const { error } = await admin.from("designations").insert({
    branch_id: branchId,
    department_id: dept.id,
    slug,
    name: normalized,
    status: "Active",
  });

  if (error) throw new Error(error.message);
}

export async function updateDesignationInCatalog(
  admin: SupabaseClient<any>,
  branchId: string,
  departmentSlug: string,
  designationSlug: string,
  name: string
): Promise<void> {
  const normalized = normalizeDesignationName(name);
  if (!normalized) throw new Error("Designation name is required");

  const dept = await getDepartmentBySlug(admin, branchId, departmentSlug);
  if (!dept) throw new Error("Department not found");

  const desig = await getDesignationBySlug(admin, branchId, dept.id, designationSlug);
  if (!desig) throw new Error("Designation not found");

  const nextSlug = slugDesignationId(normalized);

  const { data: slugConflict } = await admin
    .from("designations")
    .select("id")
    .eq("department_id", dept.id)
    .eq("slug", nextSlug)
    .neq("id", desig.id)
    .maybeSingle();

  if (slugConflict) throw new Error("Another designation with this name already exists");

  const { data: nameConflict } = await admin
    .from("designations")
    .select("id")
    .eq("department_id", dept.id)
    .eq("name", normalized)
    .neq("id", desig.id)
    .maybeSingle();

  if (nameConflict) throw new Error("Another designation with this name already exists");

  const { error } = await admin
    .from("designations")
    .update({
      slug: nextSlug,
      name: normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", desig.id);

  if (error) throw new Error(error.message);
}

export async function deleteDesignationFromCatalog(
  admin: SupabaseClient<any>,
  branchId: string,
  departmentSlug: string,
  designationSlug: string
): Promise<void> {
  const dept = await getDepartmentBySlug(admin, branchId, departmentSlug);
  if (!dept) return;

  const desig = await getDesignationBySlug(admin, branchId, dept.id, designationSlug);
  if (!desig) return;

  const { error } = await admin.from("designations").delete().eq("id", desig.id);
  if (error) throw new Error(error.message);
}

// Legacy in-memory helpers kept for tests/scripts that build catalogs before persisting.
export function addDepartmentToCatalogInMemory(
  catalog: BranchDepartmentsCatalog,
  name: string
): BranchDepartmentsCatalog {
  const normalized = normalizeDepartmentName(name);
  if (!normalized) throw new Error("Department name is required");
  const id = slugDepartmentId(normalized);
  if (catalog.departments.some((d) => d.id === id || d.name === normalized)) {
    throw new Error("Department already exists");
  }
  return {
    departments: [...catalog.departments, { id, name: normalized, designations: [] }].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  };
}

export function updateDepartmentInCatalogInMemory(
  catalog: BranchDepartmentsCatalog,
  departmentId: string,
  name: string
): BranchDepartmentsCatalog {
  const normalized = normalizeDepartmentName(name);
  if (!normalized) throw new Error("Department name is required");
  const nextId = slugDepartmentId(normalized);
  if (
    catalog.departments.some((d) => d.id !== departmentId && (d.id === nextId || d.name === normalized))
  ) {
    throw new Error("Another department with this name already exists");
  }
  return {
    departments: catalog.departments
      .map((d) => (d.id === departmentId ? { ...d, id: nextId, name: normalized } : d))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function deleteDepartmentFromCatalogInMemory(
  catalog: BranchDepartmentsCatalog,
  departmentId: string
): BranchDepartmentsCatalog {
  return { departments: catalog.departments.filter((d) => d.id !== departmentId) };
}

export function addDesignationToCatalogInMemory(
  catalog: BranchDepartmentsCatalog,
  departmentId: string,
  name: string
): BranchDepartmentsCatalog {
  const normalized = normalizeDesignationName(name);
  if (!normalized) throw new Error("Designation name is required");
  const dept = catalog.departments.find((d) => d.id === departmentId);
  if (!dept) throw new Error("Department not found");
  const id = slugDesignationId(normalized);
  if (dept.designations.some((d) => d.id === id || d.name === normalized)) {
    throw new Error("Designation already exists in this department");
  }
  return {
    departments: catalog.departments.map((d) =>
      d.id === departmentId
        ? {
            ...d,
            designations: [...d.designations, { id, name: normalized }].sort((a, b) =>
              a.name.localeCompare(b.name)
            ),
          }
        : d
    ),
  };
}

export function updateDesignationInCatalogInMemory(
  catalog: BranchDepartmentsCatalog,
  departmentId: string,
  designationId: string,
  name: string
): BranchDepartmentsCatalog {
  const normalized = normalizeDesignationName(name);
  if (!normalized) throw new Error("Designation name is required");
  const dept = catalog.departments.find((d) => d.id === departmentId);
  if (!dept) throw new Error("Department not found");
  const nextId = slugDesignationId(normalized);
  if (
    dept.designations.some((d) => d.id !== designationId && (d.id === nextId || d.name === normalized))
  ) {
    throw new Error("Another designation with this name already exists");
  }
  return {
    departments: catalog.departments.map((d) =>
      d.id === departmentId
        ? {
            ...d,
            designations: d.designations
              .map((item) => (item.id === designationId ? { id: nextId, name: normalized } : item))
              .sort((a, b) => a.name.localeCompare(b.name)),
          }
        : d
    ),
  };
}

export function deleteDesignationFromCatalogInMemory(
  catalog: BranchDepartmentsCatalog,
  departmentId: string,
  designationId: string
): BranchDepartmentsCatalog {
  return {
    departments: catalog.departments.map((d) =>
      d.id === departmentId
        ? { ...d, designations: d.designations.filter((item) => item.id !== designationId) }
        : d
    ),
  };
}
