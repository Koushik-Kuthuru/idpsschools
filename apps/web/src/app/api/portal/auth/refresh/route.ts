import { createClient } from "@supabase/supabase-js";
import { bridgeSupabaseEnv } from "@/lib/supabase/env";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const refreshToken = String(body.refresh_token ?? body.refreshToken ?? "").trim();
    if (!refreshToken) {
      return Response.json({ error: "refresh_token required" }, { status: 400 });
    }

    const env = bridgeSupabaseEnv();
    const client = createClient(env.url!, env.publishableKeys!.default!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      return Response.json({ error: "Session refresh failed" }, { status: 401 });
    }

    return Response.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in ?? 3600,
      token_type: data.session.token_type ?? "bearer",
    });
  } catch {
    return Response.json({ error: "Session refresh failed" }, { status: 401 });
  }
}
