/**
 * Role definitions, home paths, and navigation access for the school ERP.
 */

export type UserRole =
  | "super_admin"
  | "admin"
  | "teacher"
  | "student"
  | "accountant"
  | "hr_manager"
  | "inventory_manager"
  | "admission_officer"
  | "receptionist"
  | "tech_team"
  | "staff";

/** Roles that use the admin portal shell (with filtered sidebar). */
export const ADMIN_PORTAL_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "accountant",
  "hr_manager",
  "inventory_manager",
  "admission_officer",
  "receptionist",
  "tech_team",
];

/** Nav group IDs each role can see in the admin portal. */
export const ROLE_NAV_GROUPS: Record<UserRole, string[]> = {
  super_admin: ["dashboard", "academic", "transport", "staff_hr", "finance", "inventory", "admission", "communication"],
  admin: ["dashboard", "academic", "transport", "staff_hr", "finance", "inventory", "admission", "communication"],
  accountant: ["dashboard", "finance"],
  hr_manager: ["dashboard", "staff_hr"],
  inventory_manager: ["dashboard", "inventory"],
  admission_officer: ["dashboard", "admission"],
  receptionist: ["dashboard", "admission", "communication"],
  tech_team: ["dashboard"],
  teacher: [],
  student: [],
  staff: [],
};

export function isAdminPortalRole(role: string | null): boolean {
  return role !== null && ADMIN_PORTAL_ROLES.includes(role as UserRole);
}

export function getRoleHomePath(role: string | null, schoolId: string | null): string {
  if (!role) return "/login";
  if (role === "super_admin") return "/super-admin";
  if (!schoolId) return "/login";

  switch (role) {
    case "admin":
    case "accountant":
    case "hr_manager":
    case "inventory_manager":
    case "admission_officer":
    case "receptionist":
    case "tech_team":
      return `/schools/${schoolId}/admin`;
    case "teacher":
      return `/schools/${schoolId}/teachers`;
    case "student":
      return `/schools/${schoolId}/students`;
    case "staff":
      return `/schools/${schoolId}/staff`;
    default:
      return `/schools/${schoolId}/admin`;
  }
}

export function generatePortalPassword(): string {
  return `IDPS${Math.floor(1000 + Math.random() * 9000)}`;
}

export function studentLoginEmail(username: string, schoolId: string): string {
  const safe = String(username || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return `${safe}@${schoolId}.student.idps.in`;
}

export function staffLoginEmail(employeeId: string, schoolId: string, providedEmail?: string): string {
  const email = String(providedEmail || "").trim().toLowerCase();
  if (email.includes("@")) return email;
  const safe = String(employeeId || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return `${safe}@${schoolId}.staff.idps.in`;
}

export function inferRoleFromStaff(
  roleTitle: string,
  department: string,
  category?: "teaching" | "nonTeaching"
): UserRole {
  const role = String(roleTitle || "").toLowerCase();
  const dept = String(department || "").toLowerCase();

  const isTeaching =
    category === "teaching" ||
    role.includes("teacher") ||
    role.includes("tutor") ||
    role.includes("professor") ||
    role.includes("lecturer") ||
    role.includes("faculty") ||
    dept === "academic" ||
    dept === "academics";

  if (isTeaching) return "teacher";

  if (role.includes("accountant") || role.includes("finance") || dept.includes("finance")) return "accountant";
  if (role.includes("hr") || dept.includes("hr") || dept.includes("human resource")) return "hr_manager";
  if (role.includes("inventory") || role.includes("store") || dept.includes("inventory")) return "inventory_manager";
  if (role.includes("admission") || dept.includes("admission")) return "admission_officer";
  if (role.includes("reception") || role.includes("front office") || dept.includes("reception")) return "receptionist";
  if (role.includes("it") || role.includes("tech") || dept.includes("it") || dept.includes("technology")) return "tech_team";

  return "staff";
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Branch Admin",
    teacher: "Teacher",
    student: "Student",
    accountant: "Finance Team",
    hr_manager: "HR Manager",
    inventory_manager: "Inventory Manager",
    admission_officer: "Admission Officer",
    receptionist: "Receptionist",
    tech_team: "Tech Team",
    staff: "Staff",
  };
  return labels[role] ?? role;
}
