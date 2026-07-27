import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverCacheKey, withServerCache } from "@/lib/serverQueryCache";

/** Request-local dedupe for school UUID lookups. */
export const getCachedSchoolByCode = cache(async (admin: SupabaseClient<any>, code: string) => {
  const { data } = await admin.from("schools").select("id, code, name").eq("code", code).maybeSingle();
  return data;
});

/** Shared catalog: academic years for a school slug. */
export async function getCachedAcademicYears(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<Array<{ id: string; name: string; is_current?: boolean }>> {
  return withServerCache(
    serverCacheKey("catalog", "academic-years", schoolSlug),
    async () => {
      const { getSchoolCodeFromSlug } = await import("@/lib/supabase/client");
      const code = getSchoolCodeFromSlug(schoolSlug);
      if (!code) return [];
      const school = await getCachedSchoolByCode(admin, code);
      if (!school?.id) return [];
      const { data } = await admin
        .from("academic_years")
        .select("id, name, is_current")
        .eq("school_id", school.id)
        .order("name", { ascending: false });
      return (data ?? []) as Array<{ id: string; name: string; is_current?: boolean }>;
    },
    2 * 60_000
  );
}
