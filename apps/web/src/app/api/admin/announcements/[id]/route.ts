import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  deleteBranchAnnouncement,
  loadBranchAnnouncementsAdmin,
  saveBranchAnnouncement,
} from "@/lib/loadBranchAnnouncementsAdmin";

export const PATCH = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const id = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );

  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }

    const existing = (await loadBranchAnnouncementsAdmin(supabaseAdmin, schoolSlug)).find(
      (row) => row.id === id
    );
    if (!existing) {
      return noStoreJson({ error: "Announcement not found" }, { status: 404 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const announcement = await saveBranchAnnouncement(supabaseAdmin, schoolSlug, {
      ...existing,
      ...payload,
      id,
    });
    return noStoreJson({ announcement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update announcement";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const id = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    await deleteBranchAnnouncement(supabaseAdmin, schoolSlug, id);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete announcement";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
