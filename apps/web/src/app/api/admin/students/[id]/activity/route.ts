import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadStudentActivityLog } from "@/lib/loadStudentActivityLog";

function studentIdFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("students");
  if (idx < 0 || !parts[idx + 1]) return "";
  return decodeURIComponent(parts[idx + 1]);
}

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");
  const studentId = studentIdFromPath(url.pathname);

  if (!schoolSlug) return noStoreJson({ error: "schoolId required" }, { status: 400 });
  if (!studentId) return noStoreJson({ error: "student id required" }, { status: 400 });

  try {
    const activities = await loadStudentActivityLog(ctx.admin, schoolSlug, studentId, {
      academicYear,
      limit: 300,
    });
    return noStoreJson({ activities });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load activity log";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
