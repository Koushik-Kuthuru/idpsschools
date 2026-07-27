import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { bridgeSupabaseEnv } from "./env";

/**
 * Service-role client that bypasses RLS.
 *
 * Intentionally NOT module-cached. A long-lived Next.js/Turbopack process can
 * keep a stale client that silently returns empty RLS-filtered rows after HMR
 * or env reloads — which breaks portal login with "account_not_found".
 * createClient is cheap (HTTP per query); freshness matters more than reuse.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const env = bridgeSupabaseEnv();
  const url = env.url;
  const key = env.secretKeys?.default;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase admin credentials (SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** @deprecated Prefer getSupabaseAdmin() — kept for existing imports. */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return Reflect.get(client, prop, receiver);
  },
});
