const ACCESS_COOKIE = "idps_portal_at";
const REFRESH_COOKIE = "idps_portal_rt";
const REMEMBER_COOKIE = "idps_portal_remember";

/** Persistent session: 30 days access / 90 days refresh. */
const PERSISTENT_ACCESS_MAX_AGE = 60 * 60 * 24 * 30;
const PERSISTENT_REFRESH_MAX_AGE = 60 * 60 * 24 * 90;

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

function cookieBase(): string {
  return `Path=/; HttpOnly; SameSite=Lax${cookieSecure() ? "; Secure" : ""}`;
}

function maxAgeAttr(maxAgeSeconds: number | null): string {
  // Session cookie when null/0 — cleared when the browser tab/window ends.
  if (maxAgeSeconds == null || maxAgeSeconds <= 0) return "";
  return `; Max-Age=${maxAgeSeconds}`;
}

export type PortalSessionCookieOptions = {
  /** When true, cookies persist across browser restarts. When false, session cookies. */
  rememberMe?: boolean;
};

function agesForRemember(rememberMe: boolean): {
  accessMaxAge: number | null;
  refreshMaxAge: number | null;
} {
  if (rememberMe) {
    return {
      accessMaxAge: PERSISTENT_ACCESS_MAX_AGE,
      refreshMaxAge: PERSISTENT_REFRESH_MAX_AGE,
    };
  }
  return { accessMaxAge: null, refreshMaxAge: null };
}

export function portalSessionCookieHeader(
  accessToken: string,
  refreshToken: string,
  options: PortalSessionCookieOptions | number = {}
): string[] {
  // Back-compat: older callers passed maxAgeSeconds as the 3rd argument.
  const opts: PortalSessionCookieOptions =
    typeof options === "number" ? { rememberMe: options > 0 } : options;
  const rememberMe = opts.rememberMe !== false;
  const { accessMaxAge, refreshMaxAge } = agesForRemember(rememberMe);
  const base = cookieBase();

  return [
    `${ACCESS_COOKIE}=${encodeURIComponent(accessToken)}; ${base}${maxAgeAttr(accessMaxAge)}`,
    `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; ${base}${maxAgeAttr(refreshMaxAge)}`,
    `${REMEMBER_COOKIE}=${rememberMe ? "1" : "0"}; Path=/; SameSite=Lax${cookieSecure() ? "; Secure" : ""}${maxAgeAttr(
      rememberMe ? PERSISTENT_REFRESH_MAX_AGE : null
    )}`,
  ];
}

export function clearPortalSessionCookieHeaders(): string[] {
  const base = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecure() ? "; Secure" : ""}`;
  const rememberClear = `Path=/; SameSite=Lax; Max-Age=0${cookieSecure() ? "; Secure" : ""}`;
  return [
    `${ACCESS_COOKIE}=; ${base}`,
    `${REFRESH_COOKIE}=; ${base}`,
    `${REMEMBER_COOKIE}=; ${rememberClear}`,
  ];
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return null;
}

export function extractPortalAccessToken(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }
  return readCookie(req, ACCESS_COOKIE);
}

export function extractPortalRefreshToken(req: Request): string | null {
  return readCookie(req, REFRESH_COOKIE);
}

export function extractPortalRememberMe(req: Request): boolean {
  const value = readCookie(req, REMEMBER_COOKIE);
  if (value === "0" || value === "false") return false;
  // Default to persistent when the flag cookie is missing (legacy sessions).
  return true;
}

export function appendPortalSessionCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
  options: PortalSessionCookieOptions = {}
): Response {
  const headers = new Headers(response.headers);
  for (const cookie of portalSessionCookieHeader(accessToken, refreshToken, options)) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function appendClearPortalSessionCookies(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const cookie of clearPortalSessionCookieHeaders()) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
