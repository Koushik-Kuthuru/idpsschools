import { createClient } from "@supabase/supabase-js";
import { bridgeSupabaseEnv } from "./env";

const env = bridgeSupabaseEnv();

/** Service-role client that bypasses RLS. Prefer `ctx.supabaseAdmin` in route handlers. */
export const supabaseAdmin = createClient(env.url!, env.secretKeys!.default!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
