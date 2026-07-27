import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  deleteBranchSubject,
  loadBranchSubjectById,
  saveBranchSubject,
} from "@/lib/loadBranchSubjects";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const subjectId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }
  if (!subjectId) {
    return noStoreJson({ error: "subject id required" }, { status: 400 });
  }

  try {
    const subject = await loadBranchSubjectById(supabaseAdmin, schoolSlug, subjectId);
    if (!subject) {
      return noStoreJson({ error: "Subject not found" }, { status: 404 });
    }
    return noStoreJson({ subject });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load subject";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const PATCH = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const subjectId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );

  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }
    if (!subjectId) {
      return noStoreJson({ error: "subject id required" }, { status: 400 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const subject = await saveBranchSubject(supabaseAdmin, schoolSlug, {
      ...payload,
      id: subjectId,
    });
    return noStoreJson({ subject });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update subject";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const subjectId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }
  if (!subjectId) {
    return noStoreJson({ error: "subject id required" }, { status: 400 });
  }

  try {
    await deleteBranchSubject(supabaseAdmin, schoolSlug, subjectId);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete subject";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
