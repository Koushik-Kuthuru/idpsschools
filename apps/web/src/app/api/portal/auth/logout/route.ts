import { appendClearPortalSessionCookies } from "@/lib/auth/portalSessionCookies";

export async function POST() {
  return appendClearPortalSessionCookies(
    Response.json({ success: true }, { status: 200 })
  );
}
