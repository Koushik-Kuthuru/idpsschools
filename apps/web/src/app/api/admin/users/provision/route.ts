import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  provisionStaffPortalUser,
  provisionStudentPortalUser,
} from "@/lib/auth/provision";
import type { ProvisionStaffPayload, ProvisionStudentPayload } from "@/lib/auth/provision-client";

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const type = String(body.type ?? "").trim();

    if (type === "student") {
      const payload = body as ProvisionStudentPayload;
      const result = await provisionStudentPortalUser(supabaseAdmin, {
        type: "student",
        schoolId: String(payload.schoolId ?? ""),
        displayName: String(payload.displayName ?? ""),
        username: String(payload.username ?? ""),
        studentDocId: String(payload.studentDocId ?? ""),
        password: String(payload.password ?? ""),
        email: payload.email ? String(payload.email) : undefined,
      });
      return noStoreJson(result, { status: result.ok ? 200 : 400 });
    }

    if (type === "staff") {
      const payload = body as ProvisionStaffPayload;
      const result = await provisionStaffPortalUser(supabaseAdmin, {
        type: "staff",
        schoolId: String(payload.schoolId ?? ""),
        displayName: String(payload.displayName ?? ""),
        employeeId: String(payload.employeeId ?? ""),
        roleTitle: String(payload.roleTitle ?? ""),
        department: String(payload.department ?? ""),
        password: String(payload.password ?? ""),
        email: payload.email ? String(payload.email) : undefined,
        phone: payload.phone ? String(payload.phone) : undefined,
        category: payload.category,
      });
      return noStoreJson(result, { status: result.ok ? 200 : 400 });
    }

    return noStoreJson({ error: "type must be student or staff" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provisioning failed";
    return noStoreJson({ ok: false, configured: true, error: message }, { status: 500 });
  }
});
