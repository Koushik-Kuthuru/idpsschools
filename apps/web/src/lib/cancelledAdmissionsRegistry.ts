import type { SupabaseClient } from "@supabase/supabase-js";

export const CANCELLED_ADMISSIONS_REGISTRY_PREFIX = "__cancelled_admissions_registry__:";

export type CancelledAdmissionRegistryEntry = {
  sr?: number;
  admissionNo: string;
  name?: string;
  mobile?: string;
};

export type CancelledAdmissionsRegistry = {
  academicYear: string;
  source?: string;
  count?: number;
  seededAt?: string;
  students: CancelledAdmissionRegistryEntry[];
};

export async function loadCancelledAdmissionsRegistry(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<CancelledAdmissionsRegistry | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${CANCELLED_ADMISSIONS_REGISTRY_PREFIX}${academicYear}`)
    .maybeSingle();

  if (error?.code === "PGRST205" || !data?.content) return null;

  try {
    const parsed = JSON.parse(String(data.content)) as CancelledAdmissionsRegistry;
    if (!Array.isArray(parsed.students) || parsed.students.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function cancelledRegistryAdmissionNoSet(
  registry: CancelledAdmissionsRegistry
): Set<string> {
  return new Set(
    registry.students
      .map((row) => String(row.admissionNo ?? "").trim())
      .filter(Boolean)
  );
}

export async function saveCancelledAdmissionsRegistry(
  admin: SupabaseClient<any>,
  branchId: string,
  registry: CancelledAdmissionsRegistry
): Promise<void> {
  const year = String(registry.academicYear ?? "").trim();
  if (!year) throw new Error("academicYear required");
  const title = `${CANCELLED_ADMISSIONS_REGISTRY_PREFIX}${year}`;
  const payload = {
    ...registry,
    academicYear: year,
    count: registry.students.length,
    seededAt: registry.seededAt || new Date().toISOString(),
  };
  const content = JSON.stringify(payload);

  const { data: existing } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "admin",
  });
  if (error) throw new Error(error.message);
}
