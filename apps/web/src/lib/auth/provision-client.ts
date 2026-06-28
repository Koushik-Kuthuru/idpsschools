import { auth, db } from "@/lib/db-client";



export type ProvisionStudentPayload = {
  type: "student";
  schoolId: string;
  displayName: string;
  username: string;
  studentDocId: string;
  password: string;
  email?: string;
};

export type ProvisionStaffPayload = {
  type: "staff";
  schoolId: string;
  displayName: string;
  employeeId: string;
  roleTitle: string;
  department: string;
  password: string;
  email?: string;
  phone?: string;
  category?: "teaching" | "nonTeaching";
};

export type ProvisionResponse = {
  ok?: boolean;
  configured?: boolean;
  uid?: string;
  email?: string;
  loginEmail?: string;
  password?: string;
  role?: string;
  error?: string;
};

export async function provisionPortalUser(
  payload: ProvisionStudentPayload | ProvisionStaffPayload
): Promise<ProvisionResponse> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

  const res = await fetch("/api/admin/users/provision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as ProvisionResponse;
  if (!res.ok) {
    return { ...json, error: json.error || `Provisioning failed (${res.status})` };
  }
  return json;
}
