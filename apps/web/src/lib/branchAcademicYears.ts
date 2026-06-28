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

async function readCurrentYearName(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<string | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", SETTINGS_NOTICE_TITLE)
    .maybeSingle();

  if (error?.code === "PGRST205") return null;
  return data?.content?.trim() || null;
}

async function writeCurrentYearName(
  admin: SupabaseClient<any>,
  branchId: string,
  yearName: string
): Promise<void> {
  const { data: existing } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", SETTINGS_NOTICE_TITLE)
    .maybeSingle();

  if (existing?.id) {
    await admin.from("notices").update({ content: yearName }).eq("id", existing.id);
    return;
  }

  await admin.from("notices").insert({
    branch_id: branchId,
    title: SETTINGS_NOTICE_TITLE,
    content: yearName,
    target: "admin",
  });
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
  const [classYears, catalogYears, currentName] = await Promise.all([
    yearsFromClasses(admin, branchId),
    readCatalogYearNames(admin, branchId),
    readCurrentYearName(admin, branchId),
  ]);

  const allNames = [...new Set([...classYears, ...catalogYears])].sort((a, b) =>
    datesFromYearName(b).start_date.localeCompare(datesFromYearName(a).start_date)
  );

  const activeName =
    currentName && allNames.includes(currentName)
      ? currentName
      : allNames.length === 1
        ? allNames[0]
        : classYears.length === 1
          ? classYears[0]
          : null;

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
