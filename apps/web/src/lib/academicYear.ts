import { supabase, getSchoolUuidFromSlug } from "@/lib/supabase/client";

export type AcademicYearRow = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

/** Load all academic years for a school slug. */
export async function listAcademicYears(schoolSlug: string): Promise<AcademicYearRow[]> {
  const schoolUuid = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolUuid) return [];

  const { data, error } = await supabase
    .from("academic_years")
    .select("id, name, start_date, end_date, is_current")
    .eq("school_id", schoolUuid)
    .order("start_date", { ascending: false });

  if (error) {
    console.warn("listAcademicYears:", error.message);
    return [];
  }
  return (data ?? []) as AcademicYearRow[];
}

/** Load the current academic year for a school slug (e.g. idpscherukupalli). */
export async function getCurrentAcademicYear(schoolSlug: string): Promise<AcademicYearRow | null> {
  const schoolUuid = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolUuid) return null;

  const { data, error } = await supabase
    .from("academic_years")
    .select("id, name, start_date, end_date, is_current")
    .eq("school_id", schoolUuid)
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    console.warn("getCurrentAcademicYear:", error.message);
    return null;
  }
  return data as AcademicYearRow | null;
}

/** Fallback: most recent academic year by start_date when none marked current. */
export async function getActiveAcademicYear(schoolSlug: string): Promise<AcademicYearRow | null> {
  const current = await getCurrentAcademicYear(schoolSlug);
  if (current) return current;

  const schoolUuid = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolUuid) return null;

  const { data, error } = await supabase
    .from("academic_years")
    .select("id, name, start_date, end_date, is_current")
    .eq("school_id", schoolUuid)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("getActiveAcademicYear:", error.message);
    return null;
  }
  return data as AcademicYearRow | null;
}
