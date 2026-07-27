import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { assignBranchHostelRoom } from "@/lib/loadBranchHostel";

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const studentId = String(body.studentId ?? "").trim();
    const block = String(body.block ?? "").trim();
    const roomNo = String(body.roomNo ?? "").trim();

    if (!schoolSlug || !studentId) {
      return noStoreJson({ error: "schoolId and studentId required" }, { status: 400 });
    }

    await assignBranchHostelRoom(supabaseAdmin, schoolSlug, studentId, { block, roomNo });
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to assign room";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
