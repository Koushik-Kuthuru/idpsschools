import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  deleteBranchMessFeedback,
  loadBranchMessFeedback,
  saveBranchMessFeedback,
} from "@/lib/loadBranchMess";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const feedback = await loadBranchMessFeedback(supabaseAdmin, schoolSlug);
    return noStoreJson({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load feedback";
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
    const feedback = await saveBranchMessFeedback(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save feedback";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const feedbackId = url.searchParams.get("id");

  if (!schoolSlug || !feedbackId) {
    return noStoreJson({ error: "schoolId and id required" }, { status: 400 });
  }

  try {
    await deleteBranchMessFeedback(supabaseAdmin, schoolSlug, feedbackId);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete feedback";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
