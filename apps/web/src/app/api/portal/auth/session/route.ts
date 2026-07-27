import { resolvePortalAuthUser } from "@/lib/auth/resolvePortalAuthUser";
import {
  appendClearPortalSessionCookies,
  appendPortalSessionCookies,
  extractPortalRememberMe,
} from "@/lib/auth/portalSessionCookies";

/**
 * Restore a browser session from HttpOnly portal cookies.
 * Used on page reload so Supabase client storage can be rehydrated.
 */
export async function GET(req: Request) {
  const resolved = await resolvePortalAuthUser(req);
  if (!resolved) {
    return appendClearPortalSessionCookies(
      Response.json({ authenticated: false }, { status: 401 })
    );
  }

  const rememberMe = extractPortalRememberMe(req);
  const body = {
    authenticated: true,
    access_token: resolved.accessToken,
    refresh_token: resolved.refreshToken,
    rememberMe,
    user: {
      id: resolved.user.id,
      email: resolved.user.email ?? null,
    },
  };

  let response = Response.json(body);
  if (resolved.refreshToken) {
    response = appendPortalSessionCookies(response, resolved.accessToken, resolved.refreshToken, {
      rememberMe,
    });
  }
  return response;
}
