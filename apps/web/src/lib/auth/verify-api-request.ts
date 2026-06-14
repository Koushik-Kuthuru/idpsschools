import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { UserRole } from "@/lib/auth/roles";

export type VerifiedCaller = {
  uid: string;
  role: UserRole | "super_admin";
  schoolId: string | null;
};

export async function verifyProvisionCaller(req: Request): Promise<VerifiedCaller> {
  if (!isFirebaseAdminConfigured()) {
    throw new ProvisionAuthError("Firebase Admin is not configured on the server", 503);
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    throw new ProvisionAuthError("Missing authorization token", 401);
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    throw new ProvisionAuthError("Invalid or expired token", 401);
  }

  const superDoc = await db.doc(`super_admin_users/${uid}`).get();
  if (superDoc.exists) {
    return { uid, role: "super_admin", schoolId: "all" };
  }

  const roleDoc = await db.doc(`user_roles/${uid}`).get();
  if (!roleDoc.exists) {
    throw new ProvisionAuthError("No role assigned to this account", 403);
  }

  const data = roleDoc.data() ?? {};
  const role = String(data.role ?? "");
  const schoolId = data.schoolId ? String(data.schoolId) : null;

  if (role !== "admin" && role !== "super_admin" && role !== "hr_manager" && role !== "tech_team") {
    throw new ProvisionAuthError("Only admins can provision user accounts", 403);
  }

  return { uid, role: role as UserRole, schoolId };
}

export class ProvisionAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function callerCanProvisionForSchool(caller: VerifiedCaller, targetSchoolId: string): boolean {
  if (caller.role === "super_admin") return true;
  return caller.schoolId === targetSchoolId;
}
