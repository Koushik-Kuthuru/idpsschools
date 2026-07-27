import type { SupabaseClient } from "@supabase/supabase-js";

export const SIBLING_REGISTRY_PREFIX = "__sibling_registry__:";

export type SiblingMember = {
  admissionNo: string;
  name?: string;
  className?: string;
  section?: string;
  fatherName?: string;
};

export type SiblingGroup = {
  sr: number;
  fatherName?: string;
  members: SiblingMember[];
};

export type SiblingRegistry = {
  academicYear: string;
  source?: string;
  count?: number;
  seededAt?: string;
  groups: SiblingGroup[];
};

export async function loadSiblingRegistry(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<SiblingRegistry | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${SIBLING_REGISTRY_PREFIX}${academicYear}`)
    .maybeSingle();

  if (error?.code === "PGRST205" || !data?.content) return null;
  try {
    const parsed = JSON.parse(String(data.content)) as SiblingRegistry;
    if (!Array.isArray(parsed.groups) || parsed.groups.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}
