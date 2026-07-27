import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AcademicYearRecord = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  created_at?: string;
};

const SETTINGS_NOTICE_TITLE = "__config__:current_academic_year";
const CATALOG_NOTICE_PREFIX = "__academic_year__:";

export function stableAcademicYearId(branchId: string, name: string): string {
  const hash = createHash("sha256").update(`academic-year:${branchId}:${name}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function academicYearNameFromId(branchId: string, id: string, names: string[]): string | null {
  return names.find((name) => stableAcademicYearId(branchId, name) === id) ?? null;
}

export function datesFromYearName(name: string): { start_date: string; end_date: string } {
  const short = name.match(/^(\d{4})-(\d{2})$/);
  if (short) {
    const endYear = short[2].length === 2 ? `20${short[2]}` : short[2];
    return { start_date: `${short[1]}-06-01`, end_date: `${endYear}-05-31` };
  }
  const long = name.match(/^(\d{4})-(\d{4})$/);
  if (long) {
    return { start_date: `${long[1]}-06-01`, end_date: `${long[2]}-05-31` };
  }
  const y = new Date().getFullYear();
  return { start_date: `${y}-06-01`, end_date: `${y + 1}-05-31` };
}

async function schoolIdForBranch(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<string | null> {
  const { data, error } = await admin.from("branches").select("school_id").eq("id", branchId).maybeSingle();
  if (error?.code === "PGRST205") return null;
  if (error) return null;
  return data?.school_id ? String(data.school_id) : null;
}

/** Active year from schools.academic_years (admin Settings source of truth when table exists). */
async function readTableCurrentYearName(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<string | null> {
  const schoolId = await schoolIdForBranch(admin, branchId);
  if (!schoolId) return null;

  const { data, error } = await admin
    .from("academic_years")
    .select("name")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (error?.code === "PGRST205") return null;
  if (error) return null;
  return String(data?.name ?? "").trim() || null;
}

/**
 * Read the branch active year. Uses limit(1) because historical bugs created
 * many duplicate `__config__:current_academic_year` notice rows; maybeSingle()
 * fails on duplicates and caused a silent fallback to the newest year (2026-27).
 */
async function readCurrentYearName(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<string | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", SETTINGS_NOTICE_TITLE)
    .order("id", { ascending: false })
    .limit(1);

  if (error?.code === "PGRST205") return null;
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return String(row?.content ?? "").trim() || null;
}

/** Persist active year for student/portal loaders — one notice row per branch. */
export async function writeCurrentYearName(
  admin: SupabaseClient<any>,
  branchId: string,
  yearName: string
): Promise<void> {
  const name = yearName.trim();
  if (!name) return;

  const { data: existingRows, error: listError } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", SETTINGS_NOTICE_TITLE)
    .order("id", { ascending: false });

  if (listError && listError.code !== "PGRST205") {
    throw new Error(listError.message);
  }

  const rows = existingRows ?? [];
  const keepId = rows[0]?.id ? String(rows[0].id) : null;
  const extras = rows.slice(1).map((row) => String(row.id)).filter(Boolean);

  if (keepId) {
    const { error: updateError } = await admin
      .from("notices")
      .update({ content: name })
      .eq("id", keepId);
    if (updateError) throw new Error(updateError.message);
  } else {
    const { error: insertError } = await admin.from("notices").insert({
      branch_id: branchId,
      title: SETTINGS_NOTICE_TITLE,
      content: name,
      target: "admin",
    });
    if (insertError) throw new Error(insertError.message);
  }

  // Remove duplicate config rows so future reads stay deterministic.
  for (let i = 0; i < extras.length; i += 50) {
    const chunk = extras.slice(i, i + 50);
    const { error: deleteError } = await admin.from("notices").delete().in("id", chunk);
    if (deleteError) throw new Error(deleteError.message);
  }
}

/**
 * Keep branch notice in sync when admin flips schools.academic_years.is_current.
 * Student portal APIs resolve the active year via listBranchAcademicYears (notice + table).
 */
export async function syncBranchCurrentAcademicYearName(
  admin: SupabaseClient<any>,
  schoolSlugOrBranchId: { branchId?: string | null; schoolSlug?: string | null },
  yearName: string
): Promise<void> {
  const name = yearName.trim();
  if (!name) return;

  let branchId = schoolSlugOrBranchId.branchId?.trim() || null;
  if (!branchId && schoolSlugOrBranchId.schoolSlug) {
    const { resolveBranchUuid } = await import("@/lib/resolveBranchUuid");
    branchId = await resolveBranchUuid(admin, schoolSlugOrBranchId.schoolSlug);
  }
  if (!branchId) return;
  await writeCurrentYearName(admin, branchId, name);
}

async function readCatalogYearNames(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<string[]> {
  const { data, error } = await admin
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${CATALOG_NOTICE_PREFIX}%`);

  if (error?.code === "PGRST205") return [];
  return (data ?? [])
    .map((row) => String(row.content ?? row.title?.replace(CATALOG_NOTICE_PREFIX, "") ?? "").trim())
    .filter(Boolean);
}

async function yearsFromClasses(admin: SupabaseClient<any>, branchId: string): Promise<string[]> {
  const { data, error } = await admin
    .from("classes")
    .select("academic_year")
    .eq("branch_id", branchId);

  if (error?.code === "PGRST205") return [];
  return [...new Set((data ?? []).map((row) => String(row.academic_year ?? "").trim()).filter(Boolean))];
}

export async function listBranchAcademicYears(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<AcademicYearRecord[]> {
  const [classYears, catalogYears, noticeCurrent, tableCurrent] = await Promise.all([
    yearsFromClasses(admin, branchId),
    readCatalogYearNames(admin, branchId),
    readCurrentYearName(admin, branchId),
    readTableCurrentYearName(admin, branchId),
  ]);

  const allNames = [
    ...new Set(
      [...classYears, ...catalogYears, tableCurrent, noticeCurrent].filter(Boolean) as string[]
    ),
  ].sort((a, b) => datesFromYearName(b).start_date.localeCompare(datesFromYearName(a).start_date));

  // Prefer schools.academic_years.is_current when present; otherwise branch notice.
  const activeName =
    (tableCurrent && allNames.includes(tableCurrent) ? tableCurrent : null) ??
    (noticeCurrent && allNames.includes(noticeCurrent) ? noticeCurrent : null) ??
    (allNames.length === 1 ? allNames[0] : null) ??
    (classYears.length === 1 ? classYears[0] : null);

  return allNames.map((name) => {
    const dates = datesFromYearName(name);
    return {
      id: stableAcademicYearId(branchId, name),
      name,
      start_date: dates.start_date,
      end_date: dates.end_date,
      is_current: activeName === name,
    };
  });
}

export async function createBranchAcademicYear(
  admin: SupabaseClient<any>,
  branchId: string,
  input: { name: string; start_date?: string; end_date?: string; setAsCurrent?: boolean }
): Promise<AcademicYearRecord> {
  const name = input.name.trim();
  const existing = await listBranchAcademicYears(admin, branchId);
  if (existing.some((y) => y.name === name)) {
    throw new Error("An academic year with this name already exists");
  }

  await admin.from("notices").insert({
    branch_id: branchId,
    title: `${CATALOG_NOTICE_PREFIX}${name}`,
    content: name,
    target: "admin",
  });

  if (input.setAsCurrent !== false) {
    await writeCurrentYearName(admin, branchId, name);
  }

  const dates = datesFromYearName(name);
  return {
    id: stableAcademicYearId(branchId, name),
    name,
    start_date: input.start_date?.trim() || dates.start_date,
    end_date: input.end_date?.trim() || dates.end_date,
    is_current: input.setAsCurrent !== false,
  };
}

export async function setBranchCurrentAcademicYear(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYearId: string
): Promise<AcademicYearRecord> {
  const years = await listBranchAcademicYears(admin, branchId);
  const name = academicYearNameFromId(
    branchId,
    academicYearId,
    years.map((y) => y.name)
  );
  if (!name) {
    throw new Error("Academic year not found for this school");
  }

  await writeCurrentYearName(admin, branchId, name);

  const match = years.find((y) => y.name === name)!;
  return { ...match, is_current: true };
}

export async function getBranchCurrentAcademicYearName(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<string | null> {
  const years = await listBranchAcademicYears(admin, branchId);
  return years.find((y) => y.is_current)?.name ?? null;
}
