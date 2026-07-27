import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  loadBranchClasses,
  loadBranchStudentsByCohort,
  type StudentListCohort,
} from "@/lib/loadBranchStudents";

function parseCohort(raw: string | null): StudentListCohort {
  if (raw === "new-admissions" || raw === "nso" || raw === "cancelled") return raw;
  return "enrolled";
}

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");
  const cohort = parseCohort(url.searchParams.get("cohort"));

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const limitRaw = url.searchParams.get("limit");
    const offsetRaw = url.searchParams.get("offset");
    const limit = limitRaw != null ? Math.min(Math.max(Number(limitRaw) || 0, 0), 2000) : 0;
    const offset = offsetRaw != null ? Math.max(Number(offsetRaw) || 0, 0) : 0;

    const [students, classes] = await Promise.all([
      loadBranchStudentsByCohort(supabaseAdmin, schoolSlug, academicYear, cohort),
      loadBranchClasses(supabaseAdmin, schoolSlug, academicYear),
    ]);

    const total = students.length;
    const page =
      limit > 0 ? students.slice(offset, offset + limit) : students;

    return noStoreJson({
      cohort,
      students: page,
      classes,
      ...(limit > 0 ? { total, limit, offset, hasMore: offset + page.length < total } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load students";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
