import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  deleteBranchMessDish,
  loadBranchMessDishes,
  saveBranchMessDish,
} from "@/lib/loadBranchMess";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const dishes = await loadBranchMessDishes(supabaseAdmin, schoolSlug);
    return noStoreJson({ dishes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dishes";
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
    const dish = await saveBranchMessDish(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ dish });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save dish";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const dishId = url.searchParams.get("id");

  if (!schoolSlug || !dishId) {
    return noStoreJson({ error: "schoolId and id required" }, { status: 400 });
  }

  try {
    await deleteBranchMessDish(supabaseAdmin, schoolSlug, dishId);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete dish";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
