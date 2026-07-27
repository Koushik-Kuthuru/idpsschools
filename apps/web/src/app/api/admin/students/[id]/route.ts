import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchStudentById, updateBranchStudent } from "@/lib/loadBranchStudents";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const studentId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }
  if (!studentId) {
    return noStoreJson({ error: "student id required" }, { status: 400 });
  }

  try {
    const student = await loadBranchStudentById(supabaseAdmin, schoolSlug, studentId, academicYear);
    if (!student) {
      return noStoreJson({ error: "Student not found" }, { status: 404 });
    }
    return noStoreJson({ student });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load student";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const PATCH = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const studentId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );

  try {
    const body = await req.json();
    const schoolSlug = body.schoolId ?? new URL(req.url).searchParams.get("schoolId");

    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }
    if (!studentId) {
      return noStoreJson({ error: "student id required" }, { status: 400 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const student = await updateBranchStudent(supabaseAdmin, schoolSlug, studentId, payload);

    if (!student) {
      return noStoreJson({ error: "Student not found" }, { status: 404 });
    }

    return noStoreJson({ student });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update student";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
