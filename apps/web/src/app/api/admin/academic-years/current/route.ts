import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveSchoolUuid } from "@/lib/resolveSchoolUuid";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { setBranchCurrentAcademicYear } from "@/lib/branchAcademicYears";

/** Set the active academic year for a school (only one is_current=true per school). */
export async function PATCH(req: Request) {
  let body: { schoolId?: string; academicYearId?: string };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const schoolSlug = body.schoolId?.trim();
  const academicYearId = body.academicYearId?.trim();
  if (!schoolSlug || !academicYearId) {
    return Response.json({ error: "schoolId and academicYearId are required" }, { status: 400 });
  }

  const schoolUuid = await resolveSchoolUuid(supabaseAdmin, schoolSlug, { createIfMissing: false });
  if (schoolUuid) {
    const { data: year, error: yearError } = await supabaseAdmin
      .from("academic_years")
      .select("id")
      .eq("id", academicYearId)
      .eq("school_id", schoolUuid)
      .maybeSingle();

    if (!yearError && year?.id) {
      const { error: clearError } = await supabaseAdmin
        .from("academic_years")
        .update({ is_current: false })
        .eq("school_id", schoolUuid);

      if (clearError) {
        return Response.json({ error: clearError.message }, { status: 500 });
      }

      const { data, error } = await supabaseAdmin
        .from("academic_years")
        .update({ is_current: true })
        .eq("id", academicYearId)
        .select("id, name, start_date, end_date, is_current, created_at")
        .single();

      if (!error) {
        return Response.json({ year: data });
      }
      if (error.code !== "PGRST205") {
        return Response.json({ error: error.message }, { status: 500 });
      }
    } else if (yearError && yearError.code !== "PGRST205") {
      return Response.json({ error: yearError.message }, { status: 500 });
    }
  }

  const branchId = await resolveBranchUuid(supabaseAdmin, schoolSlug);
  if (!branchId) {
    return Response.json({ error: "School not found" }, { status: 404 });
  }

  try {
    const year = await setBranchCurrentAcademicYear(supabaseAdmin, branchId, academicYearId);
    return Response.json({ year });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to set active academic year";
    const status = message.includes("not found") ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}
