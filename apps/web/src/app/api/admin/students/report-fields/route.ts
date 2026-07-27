import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchStudentsReportFields } from "@/lib/loadBranchStudents";

export const POST = withAdminRoute(async (req, ctx) => {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const academicYear = String(body.academicYear ?? "").trim() || null;
    const studentIds = Array.isArray(body.studentIds)
      ? body.studentIds.map((id: unknown) => String(id ?? "").trim()).filter(Boolean)
      : [];

    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }
    if (!studentIds.length) {
      return noStoreJson({ profiles: {} });
    }
    if (studentIds.length > 500) {
      return noStoreJson({ error: "Too many studentIds (max 500)" }, { status: 400 });
    }

    const profiles = await loadBranchStudentsReportFields(
      ctx.admin,
      schoolSlug,
      studentIds,
      academicYear
    );

    return noStoreJson({ profiles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load student report fields";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
