import {
  createSupabaseContext,
  withSupabase,
  type AuthModeWithKey,
  type SupabaseContext,
  type WithSupabaseConfig,
} from "@supabase/server";
import { bridgeSupabaseEnv } from "./env";

function serverConfig(
  auth: AuthModeWithKey | AuthModeWithKey[]
): WithSupabaseConfig {
  return { auth, env: bridgeSupabaseEnv() };
}

/**
 * Next.js App Router adapter for `withSupabase`.
 * Validates auth and provides RLS-scoped (`ctx.supabase`) and admin (`ctx.supabaseAdmin`) clients.
 */
// Database schema types are not generated yet; use a loose client until they are.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSupabaseRoute<Database = any>(
  auth: AuthModeWithKey | AuthModeWithKey[],
  handler: (req: Request, ctx: SupabaseContext<Database>) => Promise<Response>
) {
  const wrapped = withSupabase(serverConfig(auth), handler);
  return (req: Request) => wrapped(req);
}

/** Imperative context creation for route handlers that need custom control flow. */
export async function getSupabaseContext(
  request: Request,
  auth: AuthModeWithKey | AuthModeWithKey[] = "user"
) {
  return createSupabaseContext(request, serverConfig(auth));
}
