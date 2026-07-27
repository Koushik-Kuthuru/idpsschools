import type { DepartmentRecord } from "@/components/admin/hr/DepartmentsManagementView";
import {
  ADMIN_NAV_GROUP_LABELS,
  TEACHER_NAV_LABELS,
  type StaffCategory,
  type TeacherNavId,
  type UserRole,
} from "@/lib/auth/roles";
import {
  pageIdFromLabel,
  resolveDesignationPermissions,
  type BranchPortalPermissions,
  type DesignationPermissionConfig,
  type PagePermission,
  type PermissionAction,
} from "@/lib/portalPermissionsStore";
import { getActiveNavGroup } from "@/components/admin/navigation";
import type { NavGroup } from "@/components/admin/navigation";
import type { TeacherNavItem } from "@/components/erp-teachers/navigation";

export type StaffPermissionContext = {
  fullAccess: boolean;
  portalEnabled: boolean;
  config: DesignationPermissionConfig | null;
  designationId: string | null;
};

const FULL_ACCESS_ROLES = new Set<UserRole | string>(["admin", "super_admin"]);

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function staffCategoryFromDepartment(
  category?: DepartmentRecord["category"]
): StaffCategory | undefined {
  if (category === "teaching") return "teaching";
  if (category === "non_teaching") return "nonTeaching";
  return undefined;
}

export function findDesignationMatch(
  departments: DepartmentRecord[],
  designation: string,
  department: string
): {
  designationId: string;
  designationName: string;
  departmentName: string;
  category?: DepartmentRecord["category"];
} | null {
  const desNorm = normalizeText(designation);
  const deptNorm = normalizeText(department);
  if (!desNorm) return null;

  if (deptNorm) {
    for (const dept of departments) {
      if (normalizeText(dept.name) !== deptNorm) continue;
      for (const item of dept.designations ?? []) {
        if (normalizeText(item.name) === desNorm) {
          return {
            designationId: item.id,
            designationName: item.name,
            departmentName: dept.name,
            category: dept.category,
          };
        }
      }
    }
  }

  for (const dept of departments) {
    for (const item of dept.designations ?? []) {
      if (normalizeText(item.name) === desNorm) {
        return {
          designationId: item.id,
          designationName: item.name,
          departmentName: dept.name,
          category: dept.category,
        };
      }
    }
  }

  return null;
}

export function resolveStaffPermissionContext(params: {
  schoolId: string;
  role: string | null;
  designation?: string | null;
  department?: string | null;
  departments: DepartmentRecord[];
  storedPermissions: BranchPortalPermissions;
}): StaffPermissionContext {
  const role = params.role ?? "";
  if (FULL_ACCESS_ROLES.has(role)) {
    return {
      fullAccess: true,
      portalEnabled: true,
      config: null,
      designationId: null,
    };
  }

  const designation = String(params.designation ?? "").trim();
  const department = String(params.department ?? "").trim();
  const match = findDesignationMatch(params.departments, designation, department);
  const category = staffCategoryFromDepartment(match?.category);

  const designationId =
    match?.designationId ??
    (designation ? `designation:${normalizeText(designation).replace(/[^a-z0-9]+/g, "_")}` : null);

  const config = designationId
    ? resolveDesignationPermissions(
        params.storedPermissions,
        designationId,
        match?.designationName ?? designation,
        match?.departmentName ?? department,
        category
      )
    : null;

  return {
    fullAccess: false,
    portalEnabled: config?.portalEnabled ?? true,
    config,
    designationId,
  };
}

export function getWebModulePermission(
  config: DesignationPermissionConfig | null,
  moduleLabel: string
): PagePermission | null {
  if (!config) return null;
  return config.pages[pageIdFromLabel(moduleLabel, "web")] ?? null;
}

export function isWebModuleAllowed(
  config: DesignationPermissionConfig | null,
  moduleLabel: string,
  action: PermissionAction = "view"
): boolean {
  if (!config?.portalEnabled) return false;
  const permission = getWebModulePermission(config, moduleLabel);
  if (!permission?.enabled || permission.actions.length === 0) return false;
  if (action === "view") return permission.actions.includes("view");
  return permission.actions.includes(action);
}

export function filterAdminNavGroupsByPermissions(
  groups: NavGroup[],
  context: StaffPermissionContext
): NavGroup[] {
  if (context.fullAccess) return groups;
  if (!context.portalEnabled || !context.config) {
    return groups.filter((group) => group.id === "dashboard");
  }

  return groups.filter((group) => {
    const label = ADMIN_NAV_GROUP_LABELS[group.id] ?? group.name;
    return isWebModuleAllowed(context.config, label, "view");
  });
}

export function filterTeacherNavigationByPermissions(
  items: TeacherNavItem[],
  context: StaffPermissionContext
): TeacherNavItem[] {
  if (context.fullAccess) return items;
  if (!context.portalEnabled || !context.config) {
    return items.filter((item) => item.id === "dashboard");
  }

  return items.filter((item) => {
    const label = TEACHER_NAV_LABELS[item.id];
    return isWebModuleAllowed(context.config, label, "view");
  });
}

export function canAccessAdminPath(
  pathname: string,
  schoolId: string,
  context: StaffPermissionContext
): boolean {
  if (context.fullAccess) return true;

  const adminBase = `/schools/${schoolId}/admin`;
  if (!pathname.startsWith(adminBase)) return true;

  if (!context.portalEnabled) {
    return pathname === adminBase || pathname === `${adminBase}/`;
  }

  if (pathname === adminBase || pathname === `${adminBase}/`) {
    return isWebModuleAllowed(context.config, "Dashboard", "view");
  }

  if (pathname.startsWith(`${adminBase}/settings`)) {
    return false;
  }

  const group = getActiveNavGroup(pathname, schoolId);
  if (!group) return false;

  const label = ADMIN_NAV_GROUP_LABELS[group.id] ?? group.name;
  const required = pathRequiresAction(pathname);
  if (required) {
    return isWebModuleAllowed(context.config, label, required);
  }
  return isWebModuleAllowed(context.config, label, "view");
}

export function canAccessTeacherPath(
  pathname: string,
  schoolId: string,
  context: StaffPermissionContext
): boolean {
  if (context.fullAccess) return true;

  const teacherBase = `/schools/${schoolId}/teachers`;
  if (!pathname.startsWith(teacherBase)) return true;

  if (pathname.startsWith(`${teacherBase}/profile`)) {
    return true;
  }

  if (!context.portalEnabled) {
    return pathname === teacherBase || pathname === `${teacherBase}/`;
  }

  if (pathname === teacherBase || pathname === `${teacherBase}/`) {
    return isWebModuleAllowed(context.config, "Dashboard", "view");
  }

  const suffix = pathname.slice(teacherBase.length).replace(/^\//, "");
  const segment = suffix.split("/")[0] as TeacherNavId | undefined;
  if (!segment) return true;

  const navId = segment as TeacherNavId;
  if (!(navId in TEACHER_NAV_LABELS)) return false;

  const label = TEACHER_NAV_LABELS[navId];
  const required = pathRequiresAction(pathname);
  if (required) {
    return isWebModuleAllowed(context.config, label, required);
  }
  return isWebModuleAllowed(context.config, label, "view");
}

export function hasPageAction(
  context: StaffPermissionContext,
  moduleLabel: string,
  action: PermissionAction
): boolean {
  if (context.fullAccess) return true;
  if (!context.config) return false;
  return isWebModuleAllowed(context.config, moduleLabel, action);
}

export function resolveWebModuleLabelForPath(
  pathname: string,
  schoolId: string,
  portal: "admin" | "teacher"
): string | null {
  if (portal === "admin") {
    const adminBase = `/schools/${schoolId}/admin`;
    if (!pathname.startsWith(adminBase)) return null;
    if (pathname === adminBase || pathname === `${adminBase}/`) return "Dashboard";
    const group = getActiveNavGroup(pathname, schoolId);
    if (!group) return null;
    return ADMIN_NAV_GROUP_LABELS[group.id] ?? group.name;
  }

  const teacherBase = `/schools/${schoolId}/teachers`;
  if (!pathname.startsWith(teacherBase)) return null;
  if (pathname.startsWith(`${teacherBase}/profile`)) return null;
  if (pathname === teacherBase || pathname === `${teacherBase}/`) return "Dashboard";

  const suffix = pathname.slice(teacherBase.length).replace(/^\//, "");
  const segment = suffix.split("/")[0] as TeacherNavId | undefined;
  if (!segment || !(segment in TEACHER_NAV_LABELS)) return null;
  return TEACHER_NAV_LABELS[segment as TeacherNavId];
}

function pathRequiresAction(pathname: string): PermissionAction | null {
  if (/\/new(?:\/|$)/.test(pathname)) return "create";
  if (/\/edit(?:\/|$)/.test(pathname)) return "edit";
  return null;
}
