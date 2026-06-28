import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadBranchStudentById, updateBranchStudent } from "@/lib/loadBranchStudents";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await context.params;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }
  if (!studentId) {
    return Response.json({ error: "student id required" }, { status: 400 });
  }

  try {
    const student = await loadBranchStudentById(supabaseAdmin, schoolSlug, studentId, academicYear);
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }
    return Response.json({ student });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load student";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await context.params;

  try {
    const body = await req.json();
    const schoolSlug = body.schoolId ?? new URL(req.url).searchParams.get("schoolId");

    if (!schoolSlug) {
      return Response.json({ error: "schoolId required" }, { status: 400 });
    }
    if (!studentId) {
      return Response.json({ error: "student id required" }, { status: 400 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const student = await updateBranchStudent(supabaseAdmin, schoolSlug, studentId, payload);

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    return Response.json({ student });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update student";
    return Response.json({ error: message }, { status: 500 });
  }
}
