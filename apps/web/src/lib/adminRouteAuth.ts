import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolvePortalAuthUser } from "@/lib/auth/resolvePortalAuthUser";
import {
  appendPortalSessionCookies,
  extractPortalRememberMe,
} from "@/lib/auth/portalSessionCookies";

const STAFF_ROLES = new Set([
  "admin",
  "super_admin",
  "principal",
  "teacher",
  "staff",
  "hr",
  "academic_director",
  "academic_manager",
  "operations_manager",
  "coordinator",
  "administrator",
]);

export type AdminRouteUser = {
  authId: string;
  email: string | null;
  role: string | null;
  schoolId: string | null;
};

export async function requireAdminUserFromAuthUser(
  authUser: User,
  admin: SupabaseClient = supabaseAdmin
): Promise<AdminRouteUser | null> {
  const authId = authUser.id;
  const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;

  const { data: profile } = await admin
    .from("users")
    .select("role, email, school_id")
    .eq("id", authId)
    .maybeSingle();

  const role =
    String(profile?.role ?? metadata.role ?? "")
      .trim()
      .toLowerCase() || null;

  if (role === "student") return null;
  if (role && !STAFF_ROLES.has(role) && role !== "student") {
    // Unknown role — still allow if present in users table (legacy titles).
  }

  const metaRole = String(metadata.role ?? "")
    .trim()
    .toLowerCase();
  if (!profile && metaRole === "student") return null;
  if (!profile && !metaRole && !role) return null;

  const schoolFromMeta = String(metadata.school_id ?? "").trim() || null;

  return {
    authId,
    email: authUser.email ?? profile?.email ?? null,
    role: role || metaRole || "staff",
    schoolId: profile?.school_id ? String(profile.school_id) : schoolFromMeta,
  };
}

export function noStoreJson(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return Response.json(data, { ...init, headers });
}

type AdminHandler = (
  req: Request,
  ctx: { admin: SupabaseClient<any>; user: AdminRouteUser }
) => Promise<Response>;

/**
 * Authenticated admin BFF wrapper. Accepts Bearer token or portal session cookies.
 */
export function withAdminRoute(handler: AdminHandler) {
  return async (req: Request) => {
    const resolved = await resolvePortalAuthUser(req);
    if (!resolved) {
      return noStoreJson(
        { error: "Unauthorized", message: "Invalid credentials", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const user = await requireAdminUserFromAuthUser(resolved.user);
    if (!user) {
      return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await handler(req, { admin: supabaseAdmin, user });

    if (resolved.refreshed && resolved.refreshToken && response.status < 400) {
      return appendPortalSessionCookies(response, resolved.accessToken, resolved.refreshToken, {
        rememberMe: extractPortalRememberMe(req),
      });
    }

    return response;
  };
}

/** @deprecated Use requireAdminUserFromAuthUser — kept for any legacy imports. */
export async function requireAdminUser(ctx: {
  userClaims?: { id?: string; email?: string | null } | null;
  supabaseAdmin: SupabaseClient;
}): Promise<AdminRouteUser | null> {
  const authId = ctx.userClaims?.id;
  if (!authId) return null;

  const { data: authUser } = await ctx.supabaseAdmin.auth.admin.getUserById(authId);
  if (!authUser.user) return null;

  return requireAdminUserFromAuthUser(authUser.user, ctx.supabaseAdmin);
}
