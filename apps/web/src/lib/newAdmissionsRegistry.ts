import type { SupabaseClient } from "@supabase/supabase-js";

export const NEW_ADMISSIONS_REGISTRY_PREFIX = "__new_admissions_registry__:";

export type NewAdmissionRegistryEntry = {
  sr?: number;
  admissionNo: string;
  admissionDate?: string;
  name?: string;
};

export type NewAdmissionsRegistry = {
  academicYear: string;
  source?: string;
  count?: number;
  seededAt?: string;
  students: NewAdmissionRegistryEntry[];
};

export async function loadNewAdmissionsRegistry(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<NewAdmissionsRegistry | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${NEW_ADMISSIONS_REGISTRY_PREFIX}${academicYear}`)
    .maybeSingle();

  if (error?.code === "PGRST205" || !data?.content) return null;

  try {
    const parsed = JSON.parse(String(data.content)) as NewAdmissionsRegistry;
    if (!Array.isArray(parsed.students) || parsed.students.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function registryAdmissionNoSet(registry: NewAdmissionsRegistry): Set<string> {
  return new Set(
    registry.students
      .map((row) => String(row.admissionNo ?? "").trim())
      .filter(Boolean)
  );
}

export function registryAdmissionDates(registry: NewAdmissionsRegistry): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of registry.students) {
    const adm = String(row.admissionNo ?? "").trim();
    const date = String(row.admissionDate ?? "").trim();
    if (adm && date) map.set(adm, date);
  }
  return map;
}
