import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  deleteBranchHostelRoom,
  loadBranchHostelRooms,
  saveBranchHostelRoom,
} from "@/lib/loadBranchHostel";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const rooms = await loadBranchHostelRooms(supabaseAdmin, schoolSlug);
    return noStoreJson({ rooms });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load rooms";
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
    const room = await saveBranchHostelRoom(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ room });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save room";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const roomId = url.searchParams.get("id");

  if (!schoolSlug || !roomId) {
    return noStoreJson({ error: "schoolId and id required" }, { status: 400 });
  }

  try {
    await deleteBranchHostelRoom(supabaseAdmin, schoolSlug, roomId);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete room";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
