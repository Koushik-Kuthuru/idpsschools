import type { SupabaseEnv } from "@supabase/server";
import { resolveEnv } from "@supabase/server/core";

/**
 * Bridges Next.js env names to @supabase/server's expected SUPABASE_* variables.
 * Prefer explicit SUPABASE_* vars; fall back to legacy NEXT_PUBLIC_* / service role names.
 */
export function bridgeSupabaseEnv(): Partial<SupabaseEnv> {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    undefined;

  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    undefined;

  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    undefined;

  const jwksUrl =
    process.env.SUPABASE_JWKS_URL ??
    (url ? `${url.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json` : undefined);

  return {
    url,
    publishableKeys: publishableKey ? { default: publishableKey } : {},
    secretKeys: secretKey ? { default: secretKey } : {},
    jwks: jwksUrl ? new URL(jwksUrl) : null,
  };
}

export function getSupabaseEnv() {
  return resolveEnv(bridgeSupabaseEnv());
}
