/**
 * Enterprise RBAC catalog — modules, actions, default role templates.
 * Compatible with existing portal nav labels via MODULE_NAV_ALIASES.
 */

export const RBAC_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
  "print",
  "upload",
  "download",
  "assign",
  "manage",
] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];

/** Legacy portal actions subset still used by PortalActionGate. */
export type LegacyPermissionAction =
  | "view"
  | "create"
  | "edit"
  | "export"
  | "delete"
  | "approve";

export const RBAC_MODULES = [
  { key: "dashboard", name: "Dashboard", category: "core" },
  { key: "academic", name: "Academic", category: "academic" },
  { key: "students", name: "Students", category: "academic" },
  { key: "parents", name: "Parents", category: "academic" },
  { key: "admission", name: "Admission", category: "admission" },
  { key: "admissions", name: "Admissions", category: "admission" },
  { key: "teachers", name: "Teachers", category: "staff" },
  { key: "staff", name: "Staff", category: "staff" },
  { key: "staff_hr", name: "Staff & HR", category: "staff" },
  { key: "attendance", name: "Attendance", category: "academic" },
  { key: "timetable", name: "Timetable", category: "academic" },
  { key: "homework", name: "Homework", category: "academic" },
  { key: "examinations", name: "Examinations", category: "academic" },
  { key: "marks", name: "Marks", category: "academic" },
  { key: "report_cards", name: "Report Cards", category: "academic" },
  { key: "library", name: "Library", category: "library" },
  { key: "transport", name: "Transport", category: "transport" },
  { key: "hostel", name: "Hostel", category: "hostel" },
  { key: "mess", name: "Mess", category: "hostel" },
  { key: "fees", name: "Fees", category: "finance" },
  { key: "finance", name: "Finance", category: "finance" },
  { key: "accounts", name: "Accounts", category: "finance" },
  { key: "payroll", name: "Payroll", category: "hr" },
  { key: "inventory", name: "Inventory", category: "inventory" },
  { key: "purchases", name: "Purchases", category: "inventory" },
  { key: "vendors", name: "Vendors", category: "inventory" },
  { key: "events", name: "Events", category: "communication" },
  { key: "notices", name: "Notices", category: "communication" },
  { key: "certificates", name: "Certificates", category: "admission" },
  { key: "id_cards", name: "ID Cards", category: "admission" },
  { key: "rfid", name: "RFID", category: "operations" },
  { key: "visitors", name: "Visitor Management", category: "admission" },
  { key: "communication", name: "Communication", category: "communication" },
  { key: "sms", name: "SMS", category: "communication" },
  { key: "email", name: "Email", category: "communication" },
  { key: "notifications", name: "Notifications", category: "communication" },
  { key: "documents", name: "Documents", category: "operations" },
  { key: "settings", name: "Settings", category: "system" },
  { key: "reports", name: "Reports", category: "analytics" },
  { key: "analytics", name: "Analytics", category: "analytics" },
  { key: "role_management", name: "Role Management", category: "system" },
  { key: "permissions", name: "Permissions", category: "system" },
  { key: "audit_logs", name: "Audit Logs", category: "system" },
  { key: "api", name: "API", category: "system" },
] as const;

export type RbacModuleKey = (typeof RBAC_MODULES)[number]["key"];

export type RecordScope =
  | "all"
  | "branch"
  | "assigned_classes"
  | "own"
  | "children"
  | "department";

export type OverrideEffect = "grant" | "deny";

/** Map human nav labels ↔ module keys for existing sidebar/guards. */
export const MODULE_LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  RBAC_MODULES.map((m) => [m.name.toLowerCase(), m.key])
);

export function moduleKeyFromLabel(label: string): string {
  const normalized = String(label ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  if (MODULE_LABEL_TO_KEY[normalized]) return MODULE_LABEL_TO_KEY[normalized];
  return normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function moduleLabelFromKey(key: string): string {
  const found = RBAC_MODULES.find((m) => m.key === key);
  return found?.name ?? key;
}

/**
 * Map fine-grained RBAC modules to sidebar nav labels used by
 * ADMIN_NAV_GROUP_LABELS / TEACHER_NAV_LABELS / PortalActionGate.
 * Having students:view should surface the Academic (and Students) pages.
 */
export const MODULE_TO_NAV_LABELS: Record<string, string[]> = {
  dashboard: ["Dashboard"],
  academic: ["Academic"],
  students: ["Academic", "Students"],
  parents: ["Academic"],
  attendance: ["Academic", "Attendance"],
  timetable: ["Academic", "Timetable"],
  homework: ["Academic", "Homework"],
  examinations: ["Academic", "Marks"],
  marks: ["Academic", "Marks"],
  report_cards: ["Academic", "Marks"],
  teachers: ["Staff & HR"],
  staff: ["Staff & HR"],
  staff_hr: ["Staff & HR"],
  payroll: ["Staff & HR", "Finance"],
  finance: ["Finance"],
  fees: ["Finance"],
  accounts: ["Finance"],
  transport: ["Transport"],
  hostel: ["Hostel"],
  mess: ["Mess"],
  inventory: ["Inventory"],
  purchases: ["Inventory"],
  vendors: ["Inventory"],
  library: ["Library"],
  admission: ["Admission"],
  admissions: ["Admission"],
  certificates: ["Admission"],
  id_cards: ["Admission"],
  visitors: ["Admission"],
  rfid: ["Admission"],
  communication: ["Communication", "Messages"],
  notices: ["Communication", "Messages"],
  events: ["Communication"],
  sms: ["Communication"],
  email: ["Communication"],
  notifications: ["Communication"],
  settings: ["Dashboard"],
  role_management: ["Dashboard"],
  permissions: ["Dashboard"],
  reports: ["Finance", "Academic"],
  analytics: ["Dashboard"],
  documents: ["Academic"],
};

/** Nav labels that should be enabled when any of these modules has view access. */
export function navLabelsForModule(moduleKey: string): string[] {
  return MODULE_TO_NAV_LABELS[moduleKey] ?? [moduleLabelFromKey(moduleKey)];
}

export type RoleTemplate = {
  key: string;
  name: string;
  description: string;
  portalRole: string;
  recordScope: RecordScope;
  /** module_key -> actions */
  permissions: Record<string, RbacAction[]>;
};

const ALL_ACTIONS: RbacAction[] = [...RBAC_ACTIONS];
const READ_EXPORT: RbacAction[] = ["view", "export", "print", "download"];
const CRUD: RbacAction[] = ["view", "create", "edit", "export", "print", "download"];
const CRUD_NO_DELETE: RbacAction[] = ["view", "create", "edit", "export", "print", "upload", "download"];
const ACADEMIC_TEACH: RbacAction[] = ["view", "create", "edit", "export", "print", "upload"];

function setMany(modules: string[], actions: RbacAction[]): Record<string, RbacAction[]> {
  return Object.fromEntries(modules.map((m) => [m, [...actions]]));
}

/** Default enterprise role templates seeded per branch. */
export const DEFAULT_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full system access across all modules",
    portalRole: "super_admin",
    recordScope: "all",
    permissions: Object.fromEntries(RBAC_MODULES.map((m) => [m.key, [...ALL_ACTIONS]])),
  },
  {
    key: "admin",
    name: "Admin",
    description: "School administrator with full branch access",
    portalRole: "admin",
    recordScope: "branch",
    permissions: Object.fromEntries(
      RBAC_MODULES.filter((m) => m.key !== "api").map((m) => [m.key, [...ALL_ACTIONS]])
    ),
  },
  {
    key: "principal",
    name: "Principal",
    description: "Academic head — view all, approve results; no financial deletes",
    portalRole: "teacher",
    recordScope: "branch",
    permissions: {
      ...setMany(
        ["dashboard", "academic", "students", "parents", "teachers", "staff", "staff_hr", "attendance", "timetable", "homework", "examinations", "marks", "report_cards", "library", "transport", "hostel", "events", "notices", "certificates", "communication", "reports", "analytics"],
        ["view", "create", "edit", "approve", "export", "print", "download", "assign"]
      ),
      fees: ["view", "export", "print"],
      finance: ["view", "export", "print"],
      accounts: ["view", "export"],
      settings: ["view"],
      admissions: CRUD_NO_DELETE,
      admission: CRUD_NO_DELETE,
    },
  },
  {
    key: "vice_principal",
    name: "Vice Principal",
    description: "Supports principal with academic oversight",
    portalRole: "teacher",
    recordScope: "branch",
    permissions: {
      ...setMany(
        ["dashboard", "academic", "students", "parents", "teachers", "attendance", "timetable", "homework", "examinations", "marks", "report_cards", "notices", "reports"],
        ["view", "create", "edit", "approve", "export", "print"]
      ),
      fees: ["view"],
      settings: ["view"],
    },
  },
  {
    key: "academic_coordinator",
    name: "Academic Coordinator",
    description: "Coordinates academics, timetable, and exams",
    portalRole: "teacher",
    recordScope: "branch",
    permissions: setMany(
      ["dashboard", "academic", "students", "teachers", "attendance", "timetable", "homework", "examinations", "marks", "report_cards", "notices"],
      ACADEMIC_TEACH
    ),
  },
  {
    key: "class_teacher",
    name: "Class Teacher",
    description: "Own class students, attendance, marks, parents — no fees/settings",
    portalRole: "teacher",
    recordScope: "assigned_classes",
    permissions: {
      dashboard: ["view"],
      academic: ["view"],
      students: ["view", "edit", "export", "print"],
      parents: ["view"],
      attendance: ["view", "create", "edit", "export", "print"],
      marks: ["view", "create", "edit", "export", "print"],
      examinations: ["view"],
      report_cards: ["view", "print", "export"],
      homework: ["view", "create", "edit"],
      timetable: ["view"],
      notices: ["view"],
      communication: ["view", "create"],
    },
  },
  {
    key: "subject_teacher",
    name: "Subject Teacher",
    description: "Assigned classes/subjects only",
    portalRole: "teacher",
    recordScope: "assigned_classes",
    permissions: {
      dashboard: ["view"],
      academic: ["view"],
      students: ["view"],
      attendance: ["view"],
      marks: ["view", "create", "edit", "export"],
      examinations: ["view"],
      homework: ["view", "create", "edit"],
      timetable: ["view"],
      notices: ["view"],
    },
  },
  {
    key: "teacher",
    name: "Teacher",
    description: "Standard teaching staff",
    portalRole: "teacher",
    recordScope: "assigned_classes",
    permissions: {
      dashboard: ["view"],
      academic: ["view"],
      students: ["view"],
      attendance: ["view", "edit"],
      marks: ["view", "edit"],
      homework: ["view", "create", "edit"],
      timetable: ["view"],
      notices: ["view"],
    },
  },
  {
    key: "accountant",
    name: "Accountant",
    description: "Fees, expenses, payroll — no academic edits",
    portalRole: "accountant",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      finance: ALL_ACTIONS,
      fees: ALL_ACTIONS,
      accounts: ALL_ACTIONS,
      payroll: CRUD,
      reports: READ_EXPORT,
      students: ["view"],
      transport: ["view"],
    },
  },
  {
    key: "hr",
    name: "HR",
    description: "Employees and payroll — no student marks",
    portalRole: "hr_manager",
    recordScope: "department",
    permissions: {
      dashboard: ["view"],
      staff: ALL_ACTIONS,
      staff_hr: ALL_ACTIONS,
      teachers: CRUD,
      payroll: CRUD,
      reports: READ_EXPORT,
      settings: ["view"],
    },
  },
  {
    key: "receptionist",
    name: "Receptionist",
    description: "Admissions, visitors, certificates, enquiries",
    portalRole: "receptionist",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      admission: CRUD_NO_DELETE,
      admissions: CRUD_NO_DELETE,
      visitors: ALL_ACTIONS,
      certificates: CRUD_NO_DELETE,
      students: ["view", "create"],
      parents: ["view"],
      communication: ["view", "create"],
      notices: ["view"],
    },
  },
  {
    key: "transport_manager",
    name: "Transport Manager",
    description: "Transport fleet, routes, and bus fees view",
    portalRole: "staff",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      transport: ALL_ACTIONS,
      students: ["view"],
      fees: ["view"],
      reports: READ_EXPORT,
    },
  },
  {
    key: "library_staff",
    name: "Library Staff",
    description: "Library management",
    portalRole: "staff",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      library: ALL_ACTIONS,
      students: ["view"],
    },
  },
  {
    key: "inventory_manager",
    name: "Inventory Manager",
    description: "Inventory, purchases, vendors, stock",
    portalRole: "inventory_manager",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      inventory: ALL_ACTIONS,
      purchases: ALL_ACTIONS,
      vendors: ALL_ACTIONS,
      reports: READ_EXPORT,
    },
  },
  {
    key: "store_manager",
    name: "Store Manager",
    description: "Store and stock operations",
    portalRole: "inventory_manager",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      inventory: CRUD_NO_DELETE,
      purchases: ["view", "create", "edit"],
      vendors: ["view"],
    },
  },
  {
    key: "hostel_warden",
    name: "Hostel Warden",
    description: "Hostel and mess management",
    portalRole: "staff",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      hostel: ALL_ACTIONS,
      mess: ALL_ACTIONS,
      students: ["view"],
      attendance: ["view", "edit"],
    },
  },
  {
    key: "security",
    name: "Security",
    description: "Visitors and campus security",
    portalRole: "staff",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      visitors: ALL_ACTIONS,
      rfid: ["view"],
    },
  },
  {
    key: "office_staff",
    name: "Office Staff",
    description: "General office operations",
    portalRole: "staff",
    recordScope: "branch",
    permissions: {
      dashboard: ["view"],
      documents: CRUD,
      communication: ["view", "create"],
      notices: ["view"],
      certificates: ["view", "create", "print"],
    },
  },
  {
    key: "parent",
    name: "Parent",
    description: "Own children only",
    portalRole: "student",
    recordScope: "children",
    permissions: {
      dashboard: ["view"],
      students: ["view"],
      attendance: ["view"],
      marks: ["view"],
      fees: ["view"],
      homework: ["view"],
      notices: ["view"],
      report_cards: ["view", "download"],
    },
  },
  {
    key: "student",
    name: "Student",
    description: "Own profile only",
    portalRole: "student",
    recordScope: "own",
    permissions: {
      dashboard: ["view"],
      attendance: ["view"],
      marks: ["view"],
      homework: ["view"],
      timetable: ["view"],
      fees: ["view"],
      notices: ["view"],
      report_cards: ["view", "download"],
    },
  },
];

export function slugifyRoleKey(name: string): string {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

/** Match a staff designation name to a default role template. */
export function matchRoleTemplate(designation: string): RoleTemplate | null {
  const text = String(designation ?? "")
    .trim()
    .toLowerCase();
  if (!text) return null;

  if (text.includes("super admin")) return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "super_admin")!;
  if (text === "admin" || text.includes("administrator"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "admin")!;
  if (text.includes("vice principal") || text.includes("vice-principal"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "vice_principal")!;
  if (text.includes("principal")) return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "principal")!;
  if (text.includes("class teacher") || text.includes("class teacher"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "class_teacher")!;
  if (text.includes("subject teacher"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "subject_teacher")!;
  if (text.includes("coordinator") || text.includes("academic"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "academic_coordinator")!;
  if (text.includes("account")) return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "accountant")!;
  if (text.includes("reception")) return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "receptionist")!;
  if (text === "hr" || text.includes("human resource") || text.includes("hr manager"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "hr")!;
  if (text.includes("transport"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "transport_manager")!;
  if (text.includes("librar")) return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "library_staff")!;
  if (text.includes("inventory") || text.includes("store keeper"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "inventory_manager")!;
  if (text.includes("store")) return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "store_manager")!;
  if (text.includes("hostel") || text.includes("warden"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "hostel_warden")!;
  if (text.includes("security") || text.includes("guard"))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "security")!;
  if (text.includes("teacher") || text.includes("faculty") || /\b(tgt|pgt|prt|ntt)\b/.test(text))
    return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "teacher")!;
  if (text.includes("parent")) return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "parent")!;
  if (text.includes("student")) return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "student")!;

  return DEFAULT_ROLE_TEMPLATES.find((r) => r.key === "office_staff")!;
}
