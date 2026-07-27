import type { SupabaseClient } from "@supabase/supabase-js";
import { noStoreJson, type AdminRouteUser } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  hasEffectivePermission,
  resolveEffectivePermissions,
  serializeEffective,
  type EffectivePermissions,
} from "@/lib/rbac/resolve";

const effectiveCache = new Map<string, { expires: number; value: EffectivePermissions }>();
const CACHE_TTL_MS = 60_000;

function cacheKey(branchId: string, userId: string) {
  return `${branchId}:${userId}`;
}

export function invalidateRbacCache(branchId?: string, userId?: string) {
  if (!branchId) {
    effectiveCache.clear();
    return;
  }
  if (userId) {
    effectiveCache.delete(cacheKey(branchId, userId));
    return;
  }
  for (const key of effectiveCache.keys()) {
    if (key.startsWith(`${branchId}:`)) effectiveCache.delete(key);
  }
}

export async function getCachedEffectivePermissions(params: {
  admin: SupabaseClient<any>;
  branchId: string;
  userId: string;
  portalRole?: string | null;
  designation?: string | null;
}): Promise<EffectivePermissions> {
  const key = cacheKey(params.branchId, params.userId);
  const hit = effectiveCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  try {
    const value = await resolveEffectivePermissions(params);
    effectiveCache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Tables not migrated yet — keep ERP usable for admins.
    if (/rbac_|schema cache|does not exist/i.test(message)) {
      const portalRole = String(params.portalRole ?? "").toLowerCase();
      const fallback =
        portalRole === "admin" || portalRole === "super_admin"
          ? ({
              fullAccess: true,
              portalEnabled: true,
              roleIds: [],
              roleNames: [portalRole],
              recordScopes: ["branch" as const],
              allowed: {},
              inherited: [],
              granted: [],
              denied: [],
            } satisfies EffectivePermissions)
          : ({
              fullAccess: false,
              portalEnabled: true,
              roleIds: [],
              roleNames: [],
              recordScopes: [],
              allowed: {},
              inherited: [],
              granted: [],
              denied: [],
            } satisfies EffectivePermissions);
      return fallback;
    }
    throw err;
  }
}

export async function loadUserDesignation(
  admin: SupabaseClient<any>,
  userId: string,
  branchId?: string
): Promise<string | null> {
  // Prefer staff profile notice (authUid) — auth_uid columns are not on all projects.
  if (branchId) {
    try {
      const { resolvePortalStaffUser } = await import("@/lib/rbac/resolvePortalUser");
      // Search notices for this authUid via teachers/non_teaching lookup is expensive;
      // scan profile notices that store authUid.
      const { data: notices } = await admin
        .from("notices")
        .select("content")
        .eq("branch_id", branchId)
        .like("title", "__staff_profile__:%")
        .ilike("content", `%"authUid":"${userId}"%`)
        .limit(1);
      const content = notices?.[0]?.content;
      if (content) {
        try {
          const profile = JSON.parse(String(content)) as Record<string, unknown>;
          const years = profile.years as Record<string, { designation?: string }> | undefined;
          if (years && typeof years === "object") {
            const yearKeys = Object.keys(years).sort().reverse();
            for (const y of yearKeys) {
              const d = String(years[y]?.designation ?? "").trim();
              if (d) return d;
            }
          }
          const top = String(profile.designation ?? "").trim();
          if (top) return top;
        } catch {
          // ignore parse
        }
      }
      void resolvePortalStaffUser;
    } catch {
      // ignore
    }
  }

  try {
    const { data: teacher } = await admin
      .from("teachers")
      .select("id")
      .eq("auth_uid", userId)
      .limit(1)
      .maybeSingle();
    if (teacher?.id && branchId) {
      const { loadStaffProfileData } = await import("@/lib/loadBranchStaff");
      const { resolveStaffYearProfile } = await import("@/lib/staffProfileStore");
      const profile = await loadStaffProfileData(admin, branchId, String(teacher.id));
      const year = resolveStaffYearProfile(profile, null);
      if (year.designation) return String(year.designation);
    }
  } catch {
    // auth_uid column may not exist
  }

  return null;
}

/**
 * Enforce module/action permission for an admin API handler context.
 * Returns a 403 Response when unauthorized, otherwise null.
 */
export async function denyUnlessPermission(params: {
  admin: SupabaseClient<any>;
  user: AdminRouteUser;
  schoolSlug: string;
  module: string;
  action: string;
}): Promise<Response | null> {
  const branchId = await resolveBranchUuid(params.admin, params.schoolSlug);
  if (!branchId) {
    return noStoreJson({ error: "School branch not found" }, { status: 404 });
  }

  const designation = await loadUserDesignation(params.admin, params.user.authId);
  const effective = await getCachedEffectivePermissions({
    admin: params.admin,
    branchId,
    userId: params.user.authId,
    portalRole: params.user.role,
    designation,
  });

  if (hasEffectivePermission(effective, params.module, params.action)) {
    return null;
  }

  return noStoreJson(
    {
      error: "Forbidden",
      message: `Missing permission: ${params.module}.${params.action}`,
      code: "PERMISSION_DENIED",
      required: { module: params.module, action: params.action },
    },
    { status: 403 }
  );
}

/** Convenience wrapper matching the requested hasPermission(module, action) API. */
export async function hasPermission(params: {
  admin: SupabaseClient<any>;
  user: AdminRouteUser;
  schoolSlug: string;
  module: string;
  action: string;
}): Promise<boolean> {
  const denied = await denyUnlessPermission(params);
  return denied == null;
}

export { serializeEffective };
