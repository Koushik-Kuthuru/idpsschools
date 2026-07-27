import { normalizeBranchSlug } from "@/lib/resolveBranchUuid";
import { inferRoleFromStaff } from "@/lib/auth/roles";
import type { ResolvedPortalAccount } from "@/lib/auth/portal-credentials";

export type DemoStaffLogin = {
  employeeId: string;
  designation: string;
  displayName: string;
  roleTitle: string;
  department: string;
  staffKind: "teaching" | "non_teaching";
  category: "teaching" | "nonTeaching";
};

/** Demo credentials shown on the staff mobile login screen (password = employee ID). */
export const DEMO_STAFF_LOGINS: DemoStaffLogin[] = [
  {
    employeeId: "TCH001",
    designation: "Teacher",
    displayName: "Demo Teacher",
    roleTitle: "Teacher",
    department: "Academic",
    staffKind: "teaching",
    category: "teaching",
  },
  {
    employeeId: "PRI001",
    designation: "Principal",
    displayName: "Demo Principal",
    roleTitle: "Principal",
    department: "Academic Administration",
    staffKind: "teaching",
    category: "teaching",
  },
  {
    employeeId: "VPR001",
    designation: "Vice Principal",
    displayName: "Demo Vice Principal",
    roleTitle: "Vice Principal",
    department: "Academic Administration",
    staffKind: "teaching",
    category: "teaching",
  },
  {
    employeeId: "COO001",
    designation: "Academic Coordinator",
    displayName: "Demo Academic Coordinator",
    roleTitle: "Academic Coordinator",
    department: "Academic",
    staffKind: "teaching",
    category: "teaching",
  },
  {
    employeeId: "ADM001",
    designation: "Administrator",
    displayName: "Demo Administrator",
    roleTitle: "Administrator",
    department: "Management",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "MGR001",
    designation: "Manager",
    displayName: "Demo Manager",
    roleTitle: "Manager",
    department: "Operations",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "ACD001",
    designation: "Academic Director",
    displayName: "Demo Academic Director",
    roleTitle: "Academic Director",
    department: "Academic Administration",
    staffKind: "teaching",
    category: "teaching",
  },
  {
    employeeId: "ACM001",
    designation: "Academic Manager",
    displayName: "Demo Academic Manager",
    roleTitle: "Academic Manager",
    department: "Academic Administration",
    staffKind: "teaching",
    category: "teaching",
  },
  {
    employeeId: "ACC001",
    designation: "Accountant",
    displayName: "Demo Accountant",
    roleTitle: "Accountant",
    department: "Finance",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "HRM001",
    designation: "HR Manager",
    displayName: "Demo HR Manager",
    roleTitle: "HR Manager",
    department: "Human Resource",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "INV001",
    designation: "Inventory Manager",
    displayName: "Demo Inventory Manager",
    roleTitle: "Inventory Manager",
    department: "Books and Uniforms",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "ADO001",
    designation: "Admission Officer",
    displayName: "Demo Admission Officer",
    roleTitle: "Admission Officer",
    department: "Admission",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "REC001",
    designation: "Receptionist",
    displayName: "Demo Receptionist",
    roleTitle: "Receptionist",
    department: "Reception",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "TEC001",
    designation: "Tech Team",
    displayName: "Demo Tech Team",
    roleTitle: "IT Support",
    department: "Computer",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "GST001",
    designation: "General Staff",
    displayName: "Demo General Staff",
    roleTitle: "General Staff",
    department: "Non Teaching",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "MGT001",
    designation: "Management",
    displayName: "Demo Management",
    roleTitle: "Director",
    department: "Management",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "TRN001",
    designation: "Transport Staff",
    displayName: "Demo Transport Staff",
    roleTitle: "Driver",
    department: "Transport",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "HST001",
    designation: "Hostel Staff",
    displayName: "Demo Hostel Staff",
    roleTitle: "Hostel Incharge",
    department: "Hostel",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "MES001",
    designation: "Mess Staff",
    displayName: "Demo Mess Staff",
    roleTitle: "Mess Incharge",
    department: "Mess",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "SEC001",
    designation: "Security Staff",
    displayName: "Demo Security Staff",
    roleTitle: "Security",
    department: "Security",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
  {
    employeeId: "MED001",
    designation: "Medical Staff",
    displayName: "Demo Medical Staff",
    roleTitle: "Nurse",
    department: "Medical",
    staffKind: "non_teaching",
    category: "nonTeaching",
  },
];

const DEMO_BY_ID = new Map(
  DEMO_STAFF_LOGINS.map((entry) => [entry.employeeId.toUpperCase(), entry])
);

export function findDemoStaffLogin(identifier: string): DemoStaffLogin | null {
  const key = String(identifier ?? "").trim().toUpperCase();
  if (!key) return null;
  return DEMO_BY_ID.get(key) ?? null;
}

export function isDemoStaffIdentifier(identifier: string): boolean {
  return findDemoStaffLogin(identifier) != null;
}

export function demoStaffPasswordAccepted(identifier: string, password: string): boolean {
  const demo = findDemoStaffLogin(identifier);
  if (!demo) return false;
  const entered = String(password ?? "").trim();
  if (!entered) return false;
  return entered.toUpperCase() === demo.employeeId.toUpperCase();
}

export function resolveDemoStaffAccount(
  identifier: string,
  schoolSlug?: string | null
): ResolvedPortalAccount | null {
  const demo = findDemoStaffLogin(identifier);
  if (!demo) return null;

  const slug =
    normalizeBranchSlug(schoolSlug ?? "") ??
    schoolSlug?.trim() ??
    "idpscherukupalli";

  return {
    kind: "staff",
    schoolSlug: slug,
    recordId: `demo-${demo.employeeId}`,
    displayName: demo.displayName,
    username: demo.employeeId,
    role: inferRoleFromStaff(demo.roleTitle, demo.department, demo.category),
    staffKind: demo.staffKind,
    department: demo.department,
    roleTitle: demo.roleTitle,
  };
}
