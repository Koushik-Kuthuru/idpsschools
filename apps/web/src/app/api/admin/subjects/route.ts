import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchSubjects, saveBranchSubject } from "@/lib/loadBranchSubjects";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const academicYear = url.searchParams.get("academicYear");
    const subjects = await loadBranchSubjects(supabaseAdmin, schoolSlug, academicYear);
    return noStoreJson({ subjects });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load subjects";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const subject = await saveBranchSubject(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ subject });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save subject";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
