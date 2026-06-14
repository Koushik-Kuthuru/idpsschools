import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { studentLoginEmail, staffLoginEmail } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/roles";

export type ProvisionUserInput = {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  schoolId: string;
  linkedId?: string;
  linkedCollection?: string;
  phone?: string;
  department?: string;
  designation?: string;
};

export type ProvisionUserResult = {
  uid: string;
  email: string;
  created: boolean;
  password: string;
};

export async function provisionUser(input: ProvisionUserInput): Promise<ProvisionUserResult> {
  const auth = getAdminAuth();
  const db = getAdminDb();

  const email = input.email.trim().toLowerCase();
  let uid: string;
  let created = false;

  try {
    const createdUser = await auth.createUser({
      email,
      password: input.password,
      displayName: input.displayName,
      emailVerified: true,
      disabled: false,
    });
    uid = createdUser.uid;
    created = true;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/email-already-exists") {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      await auth.updateUser(uid, {
        password: input.password,
        displayName: input.displayName,
        disabled: false,
      });
    } else {
      throw err;
    }
  }

  const now = new Date().toISOString();

  await db.doc(`user_roles/${uid}`).set(
    {
      id: uid,
      email,
      displayName: input.displayName,
      role: input.role,
      schoolId: input.schoolId,
      linkedId: input.linkedId ?? null,
      linkedCollection: input.linkedCollection ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  await db.doc(`users/${uid}`).set(
    {
      displayName: input.displayName,
      email,
      phone: input.phone ?? "",
      department: input.department ?? "",
      designation: input.designation ?? "",
      schoolId: input.schoolId,
      role: input.role,
      updatedAt: now,
    },
    { merge: true }
  );

  return { uid, email, created, password: input.password };
}

export function buildStudentProvisionInput(opts: {
  username: string;
  password: string;
  displayName: string;
  schoolId: string;
  studentDocId: string;
  email?: string;
}): ProvisionUserInput {
  const loginEmail = opts.email?.includes("@")
    ? opts.email
    : studentLoginEmail(opts.username, opts.schoolId);

  return {
    email: loginEmail,
    password: opts.password,
    displayName: opts.displayName,
    role: "student",
    schoolId: opts.schoolId,
    linkedId: opts.studentDocId,
    linkedCollection: "students",
  };
}

export function buildStaffProvisionInput(opts: {
  employeeId: string;
  password: string;
  displayName: string;
  schoolId: string;
  role: UserRole;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
}): ProvisionUserInput {
  return {
    email: staffLoginEmail(opts.employeeId, opts.schoolId, opts.email),
    password: opts.password,
    displayName: opts.displayName,
    role: opts.role,
    schoolId: opts.schoolId,
    linkedId: opts.employeeId,
    linkedCollection: "employees",
    phone: opts.phone,
    department: opts.department,
    designation: opts.designation,
  };
}
