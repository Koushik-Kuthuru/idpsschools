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
  super_admin: ["dashboard", "academic", "transport", "hostel", "mess", "staff_hr", "finance", "inventory", "library", "admission", "communication"],
  admin: ["dashboard", "academic", "transport", "hostel", "mess", "staff_hr", "finance", "inventory", "library", "admission", "communication"],
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

export function isPrincipalDesignation(designation?: string | null): boolean {
  const text = String(designation ?? "").trim().toLowerCase();
  return text.includes("principal") && !text.includes("vice");
}

export function getPortalHomePath(
  role: string | null,
  schoolId: string | null,
  designation?: string | null,
): string {
  if (!role || !schoolId) return getRoleHomePath(role, schoolId);
  if (role === "teacher" && isPrincipalDesignation(designation)) {
    return `/schools/${schoolId}/principal`;
  }
  return getRoleHomePath(role, schoolId);
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

export type StaffCategory = "teaching" | "nonTeaching" | "non_teaching";

/** Roles that use the teacher portal (web / mobile). */
export const TEACHER_PORTAL_ROLES: UserRole[] = ["teacher"];

export type TeacherNavId =
  | "dashboard"
  | "students"
  | "attendance"
  | "homework"
  | "materials"
  | "marks"
  | "calendar"
  | "timetable"
  | "leaves"
  | "messages";

const ALL_TEACHER_NAV: TeacherNavId[] = [
  "dashboard",
  "students",
  "attendance",
  "homework",
  "materials",
  "marks",
  "calendar",
  "timetable",
  "leaves",
  "messages",
];

export const TEACHER_NAV_LABELS: Record<TeacherNavId, string> = {
  dashboard: "Dashboard",
  students: "Students",
  attendance: "Attendance",
  homework: "Homework",
  materials: "Study Materials",
  marks: "Marks",
  calendar: "Calendar",
  timetable: "Timetable",
  leaves: "Leaves",
  messages: "Messages",
};

export const ADMIN_NAV_GROUP_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  academic: "Academic",
  transport: "Transport",
  hostel: "Hostel",
  mess: "Mess",
  staff_hr: "Staff & HR",
  finance: "Finance",
  inventory: "Inventory",
  library: "Library",
  admission: "Admission",
  communication: "Communication",
};

export function getAdminModuleLabels(role: UserRole): string[] {
  const groups = ROLE_NAV_GROUPS[role] ?? [];
  return groups.map((id) => ADMIN_NAV_GROUP_LABELS[id] ?? id);
}

export function getTeacherModuleLabels(designation?: string | null): string[] {
  const ids = getTeacherNavIdsForDesignation(designation);
  const list = ids ?? ALL_TEACHER_NAV;
  return list.map((id) => TEACHER_NAV_LABELS[id]);
}

export function getPortalKindLabel(role: UserRole | string): string {
  if (role === "teacher") return "Teacher Portal";
  if (role === "student") return "Student Portal";
  if (role === "staff") return "Staff Portal";
  if (isAdminPortalRole(role)) return "Admin Portal";
  return "Portal";
}

export function getMobileExperienceLabel(designation: string): string | null {
  const text = String(designation ?? "").toLowerCase();
  if (!text) return "Teacher app";
  if (text.includes("academic director")) return "Academic Director app";
  if (text.includes("academic manager") || text.includes("academic administration")) {
    return "Academic Manager app";
  }
  if (text.includes("vice") && text.includes("principal")) return "Vice Principal app";
  if (text.includes("principal")) return "Principal app";
  if (text.includes("coordinator") || text.startsWith("hod") || text.includes("hod ")) {
    return "Coordinator app";
  }
  return "Teacher app";
}

export type DesignationPortalAccess = {
  role: UserRole;
  portalLabel: string;
  modules: string[];
  mobileLabel: string | null;
  loginHint: string;
};

export function getDesignationPortalAccess(
  designation: string,
  department: string,
  category?: StaffCategory
): DesignationPortalAccess {
  const role = inferRoleFromStaff(designation, department, category);
  const portalLabel = getPortalKindLabel(role);

  if (role === "teacher") {
    return {
      role,
      portalLabel,
      modules: getTeacherModuleLabels(designation),
      mobileLabel: getMobileExperienceLabel(designation),
      loginHint: "Employee ID + password",
    };
  }

  if (role === "staff") {
    return {
      role,
      portalLabel,
      modules: ["Dashboard", "Profile", "Leaves", "Announcements", "Documents"],
      mobileLabel: null,
      loginHint: "Employee ID + password (web only)",
    };
  }

  if (isAdminPortalRole(role)) {
    return {
      role,
      portalLabel,
      modules: getAdminModuleLabels(role as UserRole),
      mobileLabel: null,
      loginHint: "Employee ID + password (web admin)",
    };
  }

  return {
    role,
    portalLabel,
    modules: [],
    mobileLabel: null,
    loginHint: "Employee ID + password",
  };
}

/** Teacher-portal nav items allowed per designation. `null` = full access. */
export function getTeacherNavIdsForDesignation(designation?: string | null): TeacherNavId[] | null {
  const title = String(designation ?? "").trim().toLowerCase();
  if (!title) return null;

  if (
    title.includes("principal") ||
    title.includes("vice-principal") ||
    title.includes("vice principal") ||
    title.includes("academic director") ||
    (title.includes("academic") && title.includes("manager"))
  ) {
    return null;
  }

  if (title.startsWith("hod") || title.includes("hod ")) {
    return ALL_TEACHER_NAV;
  }

  if (
    title.includes("physical director") ||
    title.includes("trainer") ||
    title.includes("dance") ||
    title.includes("music") ||
    title.includes("yoga") ||
    title.includes("swimming")
  ) {
    return ["dashboard", "students", "attendance", "calendar", "timetable", "leaves", "messages"];
  }

  return null;
}

function normalizeStaffCategory(category?: StaffCategory): "teaching" | "non_teaching" | undefined {
  if (category === "teaching") return "teaching";
  if (category === "nonTeaching" || category === "non_teaching") return "non_teaching";
  return undefined;
}

/** Map HR designation + department to portal role (login redirect + sidebar access). */
export function inferRoleFromStaff(
  roleTitle: string,
  department: string,
  category?: StaffCategory
): UserRole {
  const title = String(roleTitle ?? "").trim().toLowerCase();
  const dept = String(department ?? "").trim().toLowerCase();
  const cat = normalizeStaffCategory(category);

  if (
    /\b(principal|vice[- ]?principal|academic director)\b/.test(title) ||
    (/\bacademic\b/.test(title) && /\b(manager|administration)\b/.test(title)) ||
    dept.includes("academic administration")
  ) {
    return "teacher";
  }

  const teachingDept =
    dept === "teaching" ||
    dept === "academics" ||
    dept === "academic" ||
    dept === "hod teaching" ||
    dept === "teaching support" ||
    dept === "robotics" ||
    dept === "space" ||
    dept.includes("games and activities") ||
    dept.includes("academic administration");

  const teachingTitle =
    /\b(teacher|tutor|professor|lecturer|faculty|phonics)\b/.test(title) ||
    /\b(pgt|prt|tgt)\b/.test(title) ||
    /^hod\b/.test(title) ||
    title.includes("hod ") ||
    title.includes("mother teacher") ||
    title.includes("robotics") ||
    title.includes("space lab") ||
    title.includes("space faculty") ||
    /\bpet\b/.test(title) ||
    title.includes("physical director") ||
    title.includes("dance") ||
    title.includes("music") ||
    (title.includes("art") && title.includes("craft")) ||
    title.includes("librarian") ||
    title.includes("assistant teacher") ||
    title.includes("asst teacher");

  if (cat === "teaching" || teachingDept || teachingTitle) {
    return "teacher";
  }

  if (dept.includes("games and activities")) {
    return "teacher";
  }

  if (/\b(accountant|finance|fee collection)\b/.test(title) || dept.includes("finance")) {
    return "accountant";
  }
  if (
    /\b(hr|human resource|recruiter|recruitment)\b/.test(title) ||
    dept.includes("recruitment") ||
    dept.includes("human resource")
  ) {
    return "hr_manager";
  }
  if (
    /\b(store|inventory|books incharge|uniforms|mess incharge)\b/.test(title) ||
    dept.includes("books and uniforms") ||
    dept === "mess"
  ) {
    return "inventory_manager";
  }
  if (/\badmission\b/.test(title) || dept.includes("admission")) {
    return "admission_officer";
  }
  if (/\b(receptionist|reception|front office)\b/.test(title) || dept.includes("reception")) {
    return "receptionist";
  }
  if (/\bclerk\b/.test(title) && dept.includes("non teaching")) {
    return "receptionist";
  }
  if (
    /\b(it|tech|network admin|computer operator|app support)\b/.test(title) ||
    dept === "computer" ||
    dept === "school app"
  ) {
    return "tech_team";
  }
  if (/\bbranch admin\b/.test(title) || (title === "admin" && dept.includes("management"))) {
    return "admin";
  }
  if (dept === "management" && /\b(ceo|director|founder)\b/.test(title)) {
    return "admin";
  }

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

/** Branch-aware login page for post-logout redirect. */
export function getPortalLoginPath(schoolId?: string | null, role?: string | null): string {
  if (role === "super_admin") return "/login/super-admin";
  if (schoolId === "idpscherukupalli") return "/login/cherupalli";
  if (schoolId === "idpskalaburagi") return "/login/kalaburagi";
  return "/login";
}
