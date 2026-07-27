import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  deleteBranchMessMenu,
  loadBranchMessMenu,
  loadBranchMessMenus,
  saveBranchMessMenu,
} from "@/lib/loadBranchMess";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const weekStart = url.searchParams.get("weekStart");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    if (weekStart) {
      const menu = await loadBranchMessMenu(supabaseAdmin, schoolSlug, weekStart);
      return noStoreJson({ menu });
    }

    const menus = await loadBranchMessMenus(supabaseAdmin, schoolSlug);
    return noStoreJson({ menus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load menu";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const weekStart = String(body.weekStart ?? "").trim();
    if (!schoolSlug || !weekStart) {
      return noStoreJson({ error: "schoolId and weekStart required" }, { status: 400 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const menu = await saveBranchMessMenu(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ menu });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save menu";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const weekStart = url.searchParams.get("weekStart");

  if (!schoolSlug || !weekStart) {
    return noStoreJson({ error: "schoolId and weekStart required" }, { status: 400 });
  }

  try {
    await deleteBranchMessMenu(supabaseAdmin, schoolSlug, weekStart);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete menu";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
