import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { resolveStaffDataScope } from "@/lib/resolveStaffDataScope";
import { resolveStaffSessionContext } from "@/lib/auth/resolve-staff-session";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const userId = ctx.userClaims?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolSlug = new URL(req.url).searchParams.get("schoolId");
  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  const { data: profile } = await ctx.supabaseAdmin
    .from("users")
    .select("role, email")
    .eq("id", userId)
    .maybeSingle();

  const staffSession = await resolveStaffSessionContext({
    admin: ctx.supabaseAdmin,
    authId: userId,
    email: profile?.email ?? null,
    schoolSlug,
  });

  const scope = await resolveStaffDataScope(ctx.supabaseAdmin, {
    schoolSlug,
    authId: userId,
    email: profile?.email ?? null,
    role: profile?.role ?? null,
  });

  return Response.json({
    isUnrestricted: scope.mode === "unrestricted",
    mode: scope.mode,
    classKeys: scope.classKeys,
    busNos: scope.busNos,
    routes: scope.routes,
    designation: scope.designation,
    department: scope.department,
    displayName: staffSession?.displayName ?? null,
  });
});
