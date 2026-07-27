import type { SupabaseContext } from "@supabase/server";

export async function requirePortalUser(ctx: SupabaseContext<any>) {
  const authId = ctx.userClaims?.id;
  if (!authId) return null;

  const { data: profile } = await ctx.supabaseAdmin
    .from("users")
    .select("role, email")
    .eq("id", authId)
    .maybeSingle();

  return {
    authId,
    email: ctx.userClaims?.email ?? profile?.email ?? null,
    role: profile?.role ?? null,
  };
}

export function requireSchoolSlug(req: Request): string | null {
  return new URL(req.url).searchParams.get("schoolId");
}
