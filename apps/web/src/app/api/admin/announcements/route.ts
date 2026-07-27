import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  loadBranchAnnouncementsAdmin,
  saveBranchAnnouncement,
} from "@/lib/loadBranchAnnouncementsAdmin";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const announcements = await loadBranchAnnouncementsAdmin(supabaseAdmin, schoolSlug);
    return noStoreJson({ announcements });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load announcements";
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
    const announcement = await saveBranchAnnouncement(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ announcement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save announcement";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
