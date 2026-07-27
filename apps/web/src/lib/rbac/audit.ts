import type { SupabaseClient } from "@supabase/supabase-js";

export type RbacAuditEvent = {
  branchId: string | null;
  actorUserId: string | null;
  targetUserId?: string | null;
  targetRoleId?: string | null;
  eventType: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function requestAuditMeta(req: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");
  return { ipAddress, userAgent };
}

export async function writeRbacAuditLog(
  admin: SupabaseClient<any>,
  event: RbacAuditEvent
): Promise<void> {
  const { error } = await admin.from("rbac_audit_logs").insert({
    branch_id: event.branchId,
    actor_user_id: event.actorUserId,
    target_user_id: event.targetUserId ?? null,
    target_role_id: event.targetRoleId ?? null,
    event_type: event.eventType,
    old_value: event.oldValue ?? null,
    new_value: event.newValue ?? null,
    ip_address: event.ipAddress ?? null,
    user_agent: event.userAgent ?? null,
  });
  if (error) {
    console.warn("[rbac audit]", error.message);
  }
}
