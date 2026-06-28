"use client";
import { insertData, buildPath, getTimestamp, db, auth } from "@/lib/db-client";





export type AuditLogStatus = "Success" | "Failed" | "Warning";

export interface AuditLogEvent {
  action: string;
  entity: string;
  details?: string;
  schoolId?: string | null;
  status?: AuditLogStatus;
  metadata?: Record<string, unknown>;
  role?: string | null;
}

export async function logAuditEvent(event: AuditLogEvent) {
  const user = auth.currentUser;
  const payload = {
    action: event.action,
    entity: event.entity,
    details: event.details ?? "",
    status: event.status ?? "Success",
    schoolId: event.schoolId ?? null,
    uid: user?.uid ?? null,
    userName: user?.displayName ?? "Unknown",
    userEmail: user?.email ?? "Unknown",
    role: event.role ?? null,
    metadata: event.metadata ?? {},
    createdAt: getTimestamp(),
  };

  await insertData(buildPath(db, "audit_logs"), payload);
}

