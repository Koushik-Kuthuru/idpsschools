import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  loadPortalStaffUsers,
  loadPortalStudentUsers,
  resetPortalUserPassword,
} from "@/lib/loadPortalUsers";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const [staffResult, studentsResult] = await Promise.allSettled([
      loadPortalStaffUsers(supabaseAdmin, schoolSlug, academicYear),
      loadPortalStudentUsers(supabaseAdmin, schoolSlug, academicYear),
    ]);

    const staff = staffResult.status === "fulfilled" ? staffResult.value : [];
    const students = studentsResult.status === "fulfilled" ? studentsResult.value : [];

    const errors = [
      staffResult.status === "rejected"
        ? staffResult.reason instanceof Error
          ? staffResult.reason.message
          : "Failed to load staff"
        : null,
      studentsResult.status === "rejected"
        ? studentsResult.reason instanceof Error
          ? studentsResult.reason.message
          : "Failed to load students"
        : null,
    ].filter(Boolean);

    // Only hard-fail when both sides failed and we have nothing to show.
    if (!staff.length && !students.length && errors.length) {
      return noStoreJson({ error: errors.join(" · ") }, { status: 500 });
    }

    return noStoreJson({
      staff,
      students,
      ...(errors.length ? { warnings: errors } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load portal users";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const type = String(body.type ?? "").trim();
    const recordId = String(body.recordId ?? "").trim();
    const password = body.password ? String(body.password) : undefined;
    const academicYear = body.academicYear ? String(body.academicYear) : undefined;

    if (!schoolSlug || !recordId) {
      return noStoreJson({ error: "schoolId and recordId are required" }, { status: 400 });
    }

    if (type !== "staff" && type !== "student") {
      return noStoreJson({ error: "type must be staff or student" }, { status: 400 });
    }

    const result = await resetPortalUserPassword(supabaseAdmin, {
      schoolSlug,
      type,
      recordId,
      password,
      academicYear,
    });

    return noStoreJson(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Password reset failed";
    return noStoreJson({ ok: false, configured: true, error: message }, { status: 500 });
  }
});
