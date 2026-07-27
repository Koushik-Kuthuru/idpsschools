import {
  getDesignationPortalAccess,
  type StaffCategory,
  type UserRole,
  isAdminPortalRole,
} from "@/lib/auth/roles";

export type PermissionAction = "view" | "create" | "edit" | "export" | "delete" | "approve";

/** @deprecated Legacy level — migrated on load */
export type PermissionLevel = "none" | "view" | "edit" | "full";

export type PortalPageDef = {
  id: string;
  label: string;
  platform: "web" | "mobile";
};

export type PagePermission = {
  enabled: boolean;
  actions: PermissionAction[];
};

export type DesignationPermissionConfig = {
  portalEnabled: boolean;
  pages: Record<string, PagePermission>;
};

export type BranchPortalPermissions = Record<string, DesignationPermissionConfig>;

export const PERMISSION_ACTIONS: { value: PermissionAction; label: string }[] = [
  { value: "view", label: "View" },
  { value: "create", label: "Create" },
  { value: "edit", label: "Edit" },
  { value: "export", label: "Export" },
  { value: "delete", label: "Delete" },
  { value: "approve", label: "Approve" },
];

const MOBILE_PAGE_LABELS = ["Home", "Classes", "Attendance", "Marks", "Profile", "Messages", "Leaves"];

function pageId(label: string, platform: "web" | "mobile"): string {
  return `${platform}:${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

export function pageIdFromLabel(label: string, platform: "web" | "mobile"): string {
  return pageId(label, platform);
}

function defaultActionsForRole(role: UserRole): PermissionAction[] {
  if (role === "admin" || role === "super_admin") {
    return ["view", "create", "edit", "export", "delete", "approve"];
  }
  if (isAdminPortalRole(role)) {
    return ["view", "create", "edit", "export"];
  }
  if (role === "teacher") {
    return ["view", "edit", "export"];
  }
  return ["view"];
}

function migrateLegacyPermission(
  entry: { enabled?: boolean; level?: PermissionLevel; actions?: PermissionAction[] } | undefined,
  fallback: PermissionAction[]
): PagePermission {
  if (entry?.actions) {
    return {
      enabled: Boolean(entry.enabled && entry.actions.length > 0),
      actions: entry.enabled ? entry.actions : [],
    };
  }
  if (!entry?.enabled || entry.level === "none") {
    return { enabled: false, actions: [] };
  }
  if (entry.level === "view") return { enabled: true, actions: ["view"] };
  if (entry.level === "edit") return { enabled: true, actions: ["view", "edit"] };
  if (entry.level === "full") return { enabled: true, actions: fallback };
  return { enabled: true, actions: fallback };
}

export function getPortalPagesForDesignation(
  designation: string,
  department: string,
  category?: StaffCategory
): PortalPageDef[] {
  const access = getDesignationPortalAccess(designation, department, category);
  const pages: PortalPageDef[] = access.modules.map((label) => ({
    id: pageId(label, "web"),
    label,
    platform: "web",
  }));

  if (access.mobileLabel) {
    for (const label of MOBILE_PAGE_LABELS) {
      pages.push({
        id: pageId(label, "mobile"),
        label,
        platform: "mobile",
      });
    }
  }

  return pages;
}

export function buildDefaultDesignationPermissions(
  designation: string,
  department: string,
  category?: StaffCategory
): DesignationPermissionConfig {
  const access = getDesignationPortalAccess(designation, department, category);
  const actions = defaultActionsForRole(access.role);
  const pages: Record<string, PagePermission> = {};

  for (const page of getPortalPagesForDesignation(designation, department, category)) {
    pages[page.id] = { enabled: true, actions: [...actions] };
  }

  return { portalEnabled: true, pages };
}

function storageKey(schoolId: string) {
  return `portal_permissions_${schoolId}`;
}

export function loadBranchPortalPermissions(schoolId: string): BranchPortalPermissions {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(schoolId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveBranchPortalPermissions(schoolId: string, config: BranchPortalPermissions) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(schoolId), JSON.stringify(config));
}

export function resolveDesignationPermissions(
  stored: BranchPortalPermissions,
  designationId: string,
  designation: string,
  department: string,
  category?: StaffCategory
): DesignationPermissionConfig {
  const defaults = buildDefaultDesignationPermissions(designation, department, category);
  const access = getDesignationPortalAccess(designation, department, category);
  const fallbackActions = defaultActionsForRole(access.role);
  const saved = stored[designationId];
  if (!saved) return defaults;

  const pages = { ...defaults.pages };
  for (const page of getPortalPagesForDesignation(designation, department, category)) {
    const entry = saved.pages?.[page.id];
    pages[page.id] = migrateLegacyPermission(entry, fallbackActions);
  }

  return {
    portalEnabled: saved.portalEnabled ?? defaults.portalEnabled,
    pages,
  };
}

export function getEnabledPageCount(config: DesignationPermissionConfig): number {
  return Object.values(config.pages).filter((p) => p.enabled && p.actions.length > 0).length;
}

export function formatActionsSummary(permission: PagePermission): string {
  if (!permission.enabled || permission.actions.length === 0) return "No access";
  return permission.actions
    .map((action) => PERMISSION_ACTIONS.find((item) => item.value === action)?.label ?? action)
    .join(", ");
}

export function togglePermissionAction(
  permission: PagePermission,
  action: PermissionAction,
  selected: boolean
): PagePermission {
  const set = new Set(permission.actions);
  if (selected) {
    set.add(action);
    if (action !== "view") set.add("view");
  } else {
    set.delete(action);
  }
  const actions = PERMISSION_ACTIONS.map((item) => item.value).filter((value) => set.has(value));
  return {
    enabled: actions.length > 0,
    actions,
  };
}
