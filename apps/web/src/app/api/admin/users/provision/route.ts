import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import {
  buildStaffProvisionInput,
  buildStudentProvisionInput,
  provisionUser,
} from "@/lib/auth/provision";
import {
  callerCanProvisionForSchool,
  ProvisionAuthError,
  verifyProvisionCaller,
} from "@/lib/auth/verify-api-request";
import { inferRoleFromStaff, type UserRole } from "@/lib/auth/roles";

type ProvisionBody = {
  type: "student" | "staff";
  schoolId: string;
  displayName: string;
  password?: string;
  // Student fields
  username?: string;
  studentDocId?: string;
  email?: string;
  // Staff fields
  employeeId?: string;
  roleTitle?: string;
  department?: string;
  category?: "teaching" | "nonTeaching";
  role?: UserRole;
  phone?: string;
};

export async function POST(req: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        {
          error: "Firebase Admin SDK is not configured. Add a service account to enable auto-provisioning.",
          configured: false,
        },
        { status: 503 }
      );
    }

    const caller = await verifyProvisionCaller(req);
    const body = (await req.json()) as ProvisionBody;

    const schoolId = String(body.schoolId || "").trim();
    const displayName = String(body.displayName || "").trim();

    if (!schoolId || !displayName) {
      return NextResponse.json({ error: "schoolId and displayName are required" }, { status: 400 });
    }

    if (!callerCanProvisionForSchool(caller, schoolId)) {
      return NextResponse.json({ error: "You cannot provision users for this school" }, { status: 403 });
    }

    const password =
      String(body.password || "").trim() ||
      `IDPS${Math.floor(1000 + Math.random() * 9000)}`;

    if (body.type === "student") {
      const username = String(body.username || "").trim();
      const studentDocId = String(body.studentDocId || "").trim();
      if (!username || !studentDocId) {
        return NextResponse.json({ error: "username and studentDocId are required for students" }, { status: 400 });
      }

      const input = buildStudentProvisionInput({
        username,
        password,
        displayName,
        schoolId,
        studentDocId,
        email: body.email,
      });

      const result = await provisionUser(input);
      return NextResponse.json({
        ok: true,
        configured: true,
        ...result,
        loginEmail: result.email,
        username,
      });
    }

    if (body.type === "staff") {
      const employeeId = String(body.employeeId || "").trim();
      const roleTitle = String(body.roleTitle || "").trim();
      const department = String(body.department || "").trim();
      if (!employeeId) {
        return NextResponse.json({ error: "employeeId is required for staff" }, { status: 400 });
      }

      const role =
        body.role ??
        inferRoleFromStaff(roleTitle, department, body.category);

      const input = buildStaffProvisionInput({
        employeeId,
        password,
        displayName,
        schoolId,
        role,
        email: body.email,
        phone: body.phone,
        department,
        designation: roleTitle,
      });

      const result = await provisionUser(input);
      return NextResponse.json({
        ok: true,
        configured: true,
        ...result,
        loginEmail: result.email,
        role,
      });
    }

    return NextResponse.json({ error: "type must be 'student' or 'staff'" }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof ProvisionAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Provisioning failed";
    console.error("[provision]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
