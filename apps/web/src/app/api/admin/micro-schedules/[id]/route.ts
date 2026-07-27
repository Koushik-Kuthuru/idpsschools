import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  deleteBranchMicroSchedule,
  loadBranchMicroScheduleById,
  saveBranchMicroSchedule,
} from "@/lib/loadBranchMicroSchedules";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const docId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const schedule = await loadBranchMicroScheduleById(supabaseAdmin, schoolSlug, docId);
    if (!schedule) {
      return noStoreJson({ error: "Micro schedule not found" }, { status: 404 });
    }
    return noStoreJson({ schedule });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load micro schedule";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const PATCH = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const docId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );

  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const schedule = await saveBranchMicroSchedule(supabaseAdmin, schoolSlug, {
      ...payload,
      id: docId,
    });
    return noStoreJson({ schedule });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update micro schedule";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const docId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    await deleteBranchMicroSchedule(supabaseAdmin, schoolSlug, docId);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete micro schedule";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
