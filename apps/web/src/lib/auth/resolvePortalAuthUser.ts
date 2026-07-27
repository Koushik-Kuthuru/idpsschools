import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  extractPortalAccessToken,
  extractPortalRefreshToken,
} from "@/lib/auth/portalSessionCookies";

export type ResolvedPortalSession = {
  user: User;
  accessToken: string;
  refreshToken: string | null;
  refreshed: boolean;
};

/** Resolve the signed-in user from Bearer header or portal session cookies. */
export async function resolvePortalAuthUser(
  req: Request
): Promise<ResolvedPortalSession | null> {
  let accessToken = extractPortalAccessToken(req);
  if (!accessToken) return null;

  const initialRefreshToken = extractPortalRefreshToken(req);
  const first = await supabaseAdmin.auth.getUser(accessToken);
  if (first.data.user) {
    return {
      user: first.data.user,
      accessToken,
      refreshToken: initialRefreshToken,
      refreshed: false,
    };
  }

  if (!initialRefreshToken) return null;

  const refreshed = await supabaseAdmin.auth.refreshSession({ refresh_token: initialRefreshToken });
  accessToken = refreshed.data.session?.access_token?.trim() ?? "";
  const nextRefreshToken = refreshed.data.session?.refresh_token?.trim() ?? initialRefreshToken;
  if (!accessToken) return null;

  const second = await supabaseAdmin.auth.getUser(accessToken);
  if (!second.data.user) return null;

  return {
    user: second.data.user,
    accessToken,
    refreshToken: nextRefreshToken,
    refreshed: true,
  };
}
