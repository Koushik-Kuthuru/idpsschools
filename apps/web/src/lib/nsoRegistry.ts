import type { SupabaseClient } from "@supabase/supabase-js";

export const NSO_REGISTRY_PREFIX = "__nso_registry__:";

export type NsoRegistryEntry = {
  sr?: number;
  admissionNo: string;
  name?: string;
  nsoDate?: string;
  nsoRemark?: string;
};

export type NsoRegistry = {
  academicYear: string;
  source?: string;
  count?: number;
  seededAt?: string;
  students: NsoRegistryEntry[];
};

export async function loadNsoRegistry(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<NsoRegistry | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${NSO_REGISTRY_PREFIX}${academicYear}`)
    .maybeSingle();

  if (error?.code === "PGRST205" || !data?.content) return null;

  try {
    const parsed = JSON.parse(String(data.content)) as NsoRegistry;
    if (!Array.isArray(parsed.students) || parsed.students.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function nsoRegistryAdmissionNoSet(registry: NsoRegistry): Set<string> {
  return new Set(
    registry.students.map((row) => String(row.admissionNo ?? "").trim()).filter(Boolean)
  );
}

export function nsoRegistryByAdmissionNo(registry: NsoRegistry): Map<string, NsoRegistryEntry> {
  const map = new Map<string, NsoRegistryEntry>();
  for (const row of registry.students) {
    const adm = String(row.admissionNo ?? "").trim();
    if (adm) map.set(adm, row);
  }
  return map;
}
