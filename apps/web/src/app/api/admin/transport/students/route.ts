import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchTransportStudents } from "@/lib/loadBranchStudents";
import {
  filterStudentsByStaffScope,
  resolveStaffDataScope,
} from "@/lib/resolveStaffDataScope";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const userId = ctx.user.authId;

  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role, email")
      .eq("id", userId)
      .maybeSingle();

    const scope = await resolveStaffDataScope(supabaseAdmin, {
      schoolSlug,
      authId: userId,
      email: profile?.email ?? null,
      role: profile?.role ?? null,
    });

    const students = await loadBranchTransportStudents(supabaseAdmin, schoolSlug, academicYear);
    const scoped = filterStudentsByStaffScope(
      students.map((row) => ({
        ...row,
        grade: row.className,
        classId: row.className,
      })),
      scope
    );

    return noStoreJson({ students: scoped, scopeMode: scope.mode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load transport students";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
