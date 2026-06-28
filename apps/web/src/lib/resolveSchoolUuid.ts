import type { SupabaseClient } from "@supabase/supabase-js";
import { getSchoolCodeFromSlug, getSchoolSlugFromCode } from "@/lib/supabase/client";
import { SCHOOL_BRANCHES } from "@/lib/schools";

const BRANCH_NAMES: Record<string, { name: string; city: string; state: string }> = {
  "IDPS-CHER": { name: "IDPS Cherukupalli", city: "Cherukupalli", state: "Andhra Pradesh" },
  "IDPS-KALA": { name: "IDPS Kalaburagi", city: "Kalaburagi", state: "Karnataka" },
};

export async function resolveSchoolUuid(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  options: { createIfMissing?: boolean } = { createIfMissing: true }
): Promise<string | null> {
  const code = getSchoolCodeFromSlug(schoolSlug);
  if (!code) return null;

  const { data, error } = await admin.from("schools").select("id").eq("code", code).maybeSingle();
  if (error?.code === "PGRST205") return null;
  if (error) {
    console.error("resolveSchoolUuid:", error.message);
    return null;
  }
  if (data?.id) return data.id;

  if (!options.createIfMissing) return null;

  const meta = BRANCH_NAMES[code] ?? {
    name: SCHOOL_BRANCHES.find((b) => b.id === schoolSlug)?.name ?? code,
    city: "",
    state: "",
  };

  const { data: created, error: insertError } = await admin
    .from("schools")
    .insert({
      name: meta.name,
      code,
      city: meta.city || null,
      state: meta.state || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("resolveSchoolUuid insert:", insertError.message);
    return null;
  }
  return created?.id ?? null;
}

export { getSchoolSlugFromCode };
