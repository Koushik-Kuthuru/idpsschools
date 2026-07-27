import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveSchoolUuid } from "@/lib/resolveSchoolUuid";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  setBranchCurrentAcademicYear,
  syncBranchCurrentAcademicYearName,
} from "@/lib/branchAcademicYears";
import { invalidateServerCache } from "@/lib/serverQueryCache";

function invalidateAcademicYearCaches() {
  invalidateServerCache("catalog|academic-years");
  invalidateServerCache(`students|`);
  invalidateServerCache(`student-detail|`);
  invalidateServerCache(`staff|`);
  invalidateServerCache(`transport-students|`);
}

/** Set the active academic year for a school (only one is_current=true per school). */
export const PATCH = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  let body: { schoolId?: string; academicYearId?: string };

  try {
    body = await req.json();
  } catch {
    return noStoreJson({ error: "Invalid JSON body" }, { status: 400 });
  }

  const schoolSlug = body.schoolId?.trim();
  const academicYearId = body.academicYearId?.trim();
  if (!schoolSlug || !academicYearId) {
    return noStoreJson({ error: "schoolId and academicYearId are required" }, { status: 400 });
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
        return noStoreJson({ error: clearError.message }, { status: 500 });
      }

      const { data, error } = await supabaseAdmin
        .from("academic_years")
        .update({ is_current: true })
        .eq("id", academicYearId)
        .select("id, name, start_date, end_date, is_current, created_at")
        .single();

      if (!error) {
        // Student portal resolves year via branch notices / listBranchAcademicYears —
        // keep that in sync with schools.academic_years.is_current.
        if (data?.name) {
          await syncBranchCurrentAcademicYearName(
            supabaseAdmin,
            { schoolSlug },
            String(data.name)
          );
        }
        invalidateAcademicYearCaches();
        return noStoreJson({ year: data });
      }
      if (error.code !== "PGRST205") {
        return noStoreJson({ error: error.message }, { status: 500 });
      }
    } else if (yearError && yearError.code !== "PGRST205") {
      return noStoreJson({ error: yearError.message }, { status: 500 });
    }
  }

  const branchId = await resolveBranchUuid(supabaseAdmin, schoolSlug);
  if (!branchId) {
    return noStoreJson({ error: "School not found" }, { status: 404 });
  }

  try {
    const year = await setBranchCurrentAcademicYear(supabaseAdmin, branchId, academicYearId);
    invalidateAcademicYearCaches();
    return noStoreJson({ year });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to set active academic year";
    const status = message.includes("not found") ? 404 : 500;
    return noStoreJson({ error: message }, { status });
  }
});
