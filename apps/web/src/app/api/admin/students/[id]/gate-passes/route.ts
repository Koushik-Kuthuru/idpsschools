import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchGatePasses, saveBranchGatePass } from "@/lib/loadBranchGatePasses";

function studentIdFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  // .../students/{id}/gate-passes
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
    const passes = await loadBranchGatePasses(ctx.admin, schoolSlug, {
      studentId,
      academicYear,
      limit: 500,
    });
    return noStoreJson({ passes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load gate passes";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const studentId = studentIdFromPath(new URL(req.url).pathname);
    if (!schoolSlug) return noStoreJson({ error: "schoolId required" }, { status: 400 });
    if (!studentId) return noStoreJson({ error: "student id required" }, { status: 400 });

    const pass = await saveBranchGatePass(ctx.admin, schoolSlug, {
      id: String(body.id || crypto.randomUUID()),
      studentId,
      studentName: String(body.studentName ?? ""),
      admissionNo: String(body.admissionNo ?? ""),
      grade: String(body.grade ?? ""),
      section: String(body.section ?? ""),
      academicYear: String(body.academicYear ?? ""),
      type: String(body.type ?? "Early Departure"),
      date: String(body.date ?? new Date().toISOString().slice(0, 10)),
      time: String(body.time ?? ""),
      takenBy: String(body.takenBy ?? ""),
      relation: String(body.relation ?? "Guardian"),
      mobile: String(body.mobile ?? ""),
      message: String(body.message ?? ""),
      confirmed: Boolean(body.confirmed),
      confirmedAt: body.confirmed ? new Date().toISOString() : null,
      photo: String(body.photo ?? ""),
      createdAt: String(body.createdAt || new Date().toISOString()),
      createdByName: String(body.createdByName ?? "Admin"),
    });

    return noStoreJson({ pass });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save gate pass";
    return noStoreJson({ error: message }, { status: 400 });
  }
});

export const PATCH = withAdminRoute(async (req, ctx) => {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const studentId = studentIdFromPath(new URL(req.url).pathname);
    const passId = String(body.id ?? "").trim();
    if (!schoolSlug || !studentId || !passId) {
      return noStoreJson({ error: "schoolId, student id and id required" }, { status: 400 });
    }

    const existing = (
      await loadBranchGatePasses(ctx.admin, schoolSlug, { studentId, limit: 500 })
    ).find((p) => p.id === passId);

    if (!existing) return noStoreJson({ error: "Gate pass not found" }, { status: 404 });

    const pass = await saveBranchGatePass(ctx.admin, schoolSlug, {
      ...existing,
      confirmed: body.confirmed != null ? Boolean(body.confirmed) : existing.confirmed,
      confirmedAt:
        body.confirmed === true
          ? new Date().toISOString()
          : body.confirmed === false
            ? null
            : existing.confirmedAt,
      message: body.message != null ? String(body.message) : existing.message,
      photo: body.photo != null ? String(body.photo) : existing.photo,
    });

    return noStoreJson({ pass });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update gate pass";
    return noStoreJson({ error: message }, { status: 400 });
  }
});
