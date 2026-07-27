export const maxDuration = 60;
import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import { resolveStaffSessionForPortal } from "@/lib/auth/resolve-staff-session";
import {
  currentAcademicYearName,
  buildStaffStudentDetail,
  recordBranchStudentFeePayment,
  buildStaffMemberDetail,
  loadStaffMemberPayrollSlips,
  loadStaffMemberLeaves,
  loadBranchPayroll,
  loadStaffOwnPayroll,
} from "@/lib/portalMobileData";
import type { UserRole } from "@/lib/auth/roles";
import {
  loadLeadershipStaff,
  loadLeadershipFinance,
  loadLeadershipDepartments,
  loadLeadershipAnnouncements,
  loadLeadershipNotifications,
  loadLeadershipAttendance,
  loadBranchStaffAttendanceSummary,
  loadBranchLeaveRequests,
} from "@/lib/portalLeadershipData";
import { loadBranchExpenses, saveBranchExpense } from "@/lib/loadBranchExpenses";
import { loadBranchFeePayments } from "@/lib/loadBranchFeePayments";
import {
  loadBranchStudents,
  loadBranchStudentById,
  loadBranchTransportStudents,
} from "@/lib/loadBranchStudents";
import { loadBranchStaffRecordById } from "@/lib/loadBranchStaff";
import { loadBranchHostelStudents } from "@/lib/loadBranchHostel";
import { loadBranchMessMenus, loadBranchMessDishes, saveBranchMessDish, deleteBranchMessDish } from "@/lib/loadBranchMess";
import { saveBranchAnnouncement } from "@/lib/loadBranchAnnouncementsAdmin";
import {
  loadBranchInventoryStock,
  saveBranchInventoryStock,
  deleteBranchInventoryStock,
} from "@/lib/loadBranchInventoryStock";

type StaffResource =
  | "overview"
  | "finance"
  | "expenses"
  | "staff"
  | "departments"
  | "students"
  | "transport"
  | "hostel"
  | "mess"
  | "inventory"
  | "announcements"
  | "notifications"
  | "leaves"
  | "payroll"
  | "profile";

function normalize(value?: string | null): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type StaffProfile = { department?: string; designation?: string };

function supportStaffExtras(profile: StaffProfile): StaffResource[] {
  const text = normalize(profile.designation);
  const dept = normalize(profile.department);
  const extras: StaffResource[] = [];

  if (
    dept.includes("transport") ||
    /\b(driver|conductor|bus|buses incharge|sir driver|bus ayy)\b/.test(text)
  ) {
    extras.push("transport", "students");
  }
  if (dept.includes("hostel") || text.includes("hostel")) {
    extras.push("hostel", "students");
  }
  if (
    dept.includes("mess") ||
    /\b(mess incharge|comm i|comm ii|helper|store incharge)\b/.test(text)
  ) {
    extras.push("mess", "inventory");
  }
  if (dept.includes("security") || text.includes("security")) {
    extras.push("notifications");
  }
  if (dept.includes("medical") || /\b(nurse|medical|compound|doctor)\b/.test(text)) {
    extras.push("students");
  }

  return extras;
}

/** Management department (owners / branch admins) get full access to everything. */
function isManagementProfile(profile: StaffProfile): boolean {
  const dept = normalize(profile.department);
  const text = normalize(profile.designation);
  if (dept.includes("management")) return true;
  return (
    text.includes("branch admin") ||
    text === "administrator" ||
    ((text.includes("ceo") ||
      text.includes("founder") ||
      text.includes("director") ||
      text.includes("owner") ||
      text.includes("chairman")) &&
      !dept.includes("academic"))
  );
}

function hasFullAccess(role: string, profile?: StaffProfile): boolean {
  return role === "admin" || role === "super_admin" || isManagementProfile(profile ?? {});
}

/** Which resources each server role may read. `admin`/`super_admin` see everything. */
const ROLE_RESOURCES: Record<string, StaffResource[]> = {
  accountant: ["overview", "finance", "expenses", "students", "announcements", "leaves", "payroll", "profile"],
  hr_manager: ["overview", "staff", "departments", "leaves", "announcements", "payroll", "profile"],
  inventory_manager: ["overview", "inventory", "mess", "expenses", "announcements", "profile"],
  admission_officer: ["overview", "students", "announcements", "profile"],
  receptionist: ["overview", "students", "announcements", "notifications", "profile"],
  tech_team: ["overview", "announcements", "profile"],
  staff: ["overview", "announcements", "leaves", "payroll", "profile"],
};

const ALL_RESOURCES: StaffResource[] = [
  "overview", "finance", "expenses", "staff", "departments", "students",
  "transport", "hostel", "mess", "inventory", "announcements",
  "notifications", "leaves", "payroll", "profile",
];

function resourcesForStaff(role: string, profile?: StaffProfile): StaffResource[] {
  if (hasFullAccess(role, profile)) return ALL_RESOURCES;
  const base = ROLE_RESOURCES[role] ?? ["overview", "announcements", "profile"];
  if (role !== "staff") return base;
  return [...new Set([...base, ...supportStaffExtras(profile ?? {})])];
}

function canManageInventory(role: string, profile?: StaffProfile): boolean {
  if (role === "inventory_manager" || hasFullAccess(role, profile)) return true;
  if (role !== "staff") return false;
  const extras = supportStaffExtras(profile ?? {});
  return extras.includes("inventory") || extras.includes("mess");
}

type OverviewPayment = {
  id?: string | number | null;
  studentName?: string | null;
  admissionNo?: string | null;
  amount?: number | string | null;
  mode?: string | null;
  date?: string | null;
  time?: string | null;
  collectedByName?: string | null;
  createdAt?: string | null;
  receiptNo?: string | null;
};

function buildCollectionsPayload(payments: OverviewPayment[], today: string) {
  const collected = payments.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const todayCollected = payments
    .filter((r) => String(r.date ?? r.createdAt ?? "").slice(0, 10) === today)
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const weekDays: Array<{ date: string; day: string; label: string; amount: number }> = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - offset);
    const iso = d.toISOString().slice(0, 10);
    const day = d.toLocaleDateString("en-IN", { weekday: "short" });
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const amount = payments
      .filter((r) => String(r.date ?? r.createdAt ?? "").slice(0, 10) === iso)
      .reduce((s, r) => s + (Number(r.amount) || 0), 0);
    weekDays.push({ date: iso, day, label, amount });
  }
  const weekTotal = weekDays.reduce((s, d) => s + d.amount, 0);

  return {
    today: todayCollected,
    total: collected,
    weekTotal,
    week: weekDays,
    recent: payments.slice(0, 5).map((p) => ({
      id: String(p.id ?? ""),
      studentName: String(p.studentName ?? "Student"),
      admissionNo: String(p.admissionNo ?? ""),
      amount: Number(p.amount) || 0,
      mode: String(p.mode ?? ""),
      date: String(p.date ?? ""),
      time: String(p.time ?? ""),
      collectedByName: String(p.collectedByName ?? ""),
      createdAt: String(p.createdAt ?? ""),
      receiptNo: String(p.receiptNo ?? ""),
    })),
  };
}

async function countPendingLeaves(
  admin: import("@supabase/supabase-js").SupabaseClient<any>,
  schoolSlug: string,
) {
  try {
    const leaves = await loadBranchLeaveRequests(admin, schoolSlug);
    return (leaves ?? []).filter((row) =>
      String((row as { status?: string }).status ?? "").toLowerCase().includes("pend"),
    ).length;
  } catch (err) {
    console.error("[staff/overview] leave count failed", err);
    return 0;
  }
}

function canRecordFeePayment(role: string, profile?: StaffProfile): boolean {
  return role === "accountant" || hasFullAccess(role, profile);
}

async function loadOverview(
  admin: import("@supabase/supabase-js").SupabaseClient<any>,
  schoolSlug: string,
  role: string,
  academicYear: string | null,
  profile?: StaffProfile,
) {
  const cards: Array<{ icon: string; label: string; value: string; tone: string }> = [];

  // Management / branch admin: consolidated full-branch snapshot.
  if (hasFullAccess(role, profile)) {
    const today = new Date().toISOString().slice(0, 10);
    const emptyAttendanceSide = {
      present: 0,
      absent: 0,
      late: 0,
      marked: 0,
      total: 0,
      rate: 0,
    };

    // Core branch stats first — keep dashboard usable even if attendance extras fail.
    const [payments, expenses, students, staff] = await Promise.all([
      loadBranchFeePayments(admin, schoolSlug, { academicYear, limit: 500 }),
      loadBranchExpenses(admin, schoolSlug),
      loadBranchStudents(admin, schoolSlug, academicYear),
      loadLeadershipStaff(admin, schoolSlug, academicYear),
    ]);

    const collected = payments.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const spent = expenses.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const activeStudents = students.filter((s) => s.status === "Active").length;

    cards.push(
      { icon: "payments", label: "Fees collected", value: `₹${collected.toLocaleString("en-IN")}`, tone: "primary" },
      { icon: "receipt_long", label: "Expenses", value: `₹${spent.toLocaleString("en-IN")}`, tone: "error" },
      { icon: "groups", label: "Students", value: String(students.length), tone: "secondary" },
      { icon: "badge", label: "Staff", value: String(staff.staffMembers.length), tone: "tertiary" },
    );

    let attendance = {
      date: today,
      students: { ...emptyAttendanceSide, total: activeStudents },
      staff: { ...emptyAttendanceSide, total: staff.staffMembers.length },
    };
    let pendingLeaves = 0;

    try {
      const [studentAttendance, staffAttendance, leaves] = await Promise.all([
        loadLeadershipAttendance(admin, schoolSlug, academicYear, today),
        loadBranchStaffAttendanceSummary(admin, schoolSlug, today),
        loadBranchLeaveRequests(admin, schoolSlug),
      ]);
      const sSummary = studentAttendance?.attendanceSummary ?? {
        present: 0,
        absent: 0,
        late: 0,
      };
      const sMarked = Number(sSummary.present ?? 0) + Number(sSummary.absent ?? 0);
      attendance = {
        date: today,
        students: {
          present: Number(sSummary.present ?? 0),
          absent: Number(sSummary.absent ?? 0),
          late: Number(sSummary.late ?? 0),
          marked: sMarked,
          total: activeStudents,
          rate: sMarked ? Math.round((Number(sSummary.present ?? 0) / sMarked) * 1000) / 10 : 0,
        },
        staff: {
          present: Number(staffAttendance?.present ?? 0),
          absent: Number(staffAttendance?.absent ?? 0),
          late: Number(staffAttendance?.late ?? 0),
          marked: Number(staffAttendance?.marked ?? 0),
          total: Number(staffAttendance?.total ?? staff.staffMembers.length),
          rate: Number(staffAttendance?.rate ?? 0),
        },
      };
      pendingLeaves = (leaves ?? []).filter((row) =>
        String((row as { status?: string }).status ?? "").toLowerCase().includes("pend"),
      ).length;
    } catch (err) {
      console.error("[staff/overview] attendance extras failed", err);
    }

    return {
      cards,
      attendance,
      collections: buildCollectionsPayload(payments, today),
      pendingLeaves,
    };
  }

  if (role === "accountant") {
    const today = new Date().toISOString().slice(0, 10);
    const [payments, expenses, pendingLeaves] = await Promise.all([
      loadBranchFeePayments(admin, schoolSlug, { academicYear, limit: 500 }),
      loadBranchExpenses(admin, schoolSlug),
      countPendingLeaves(admin, schoolSlug),
    ]);
    const collections = buildCollectionsPayload(payments, today);
    const spent = expenses.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const pending = expenses.filter((r) => r.status === "Pending").length;
    cards.push(
      {
        icon: "payments",
        label: "Collected",
        value: `₹${collections.total.toLocaleString("en-IN")}`,
        tone: "primary",
      },
      {
        icon: "today",
        label: "Today",
        value: `₹${collections.today.toLocaleString("en-IN")}`,
        tone: "secondary",
      },
      {
        icon: "receipt_long",
        label: "Expenses",
        value: `₹${spent.toLocaleString("en-IN")}`,
        tone: "error",
      },
      {
        icon: "pending_actions",
        label: "Pending",
        value: String(pending),
        tone: pending > 0 ? "error" : "tertiary",
      },
    );
    return { cards, collections, pendingLeaves };
  }

  if (role === "hr_manager") {
    const staff = await loadLeadershipStaff(admin, schoolSlug, academicYear);
    const teaching = staff.staffMembers.filter((m) => m.category === "Teaching").length;
    const nonTeaching = staff.staffMembers.length - teaching;
    cards.push(
      { icon: "groups", label: "Total staff", value: String(staff.staffMembers.length), tone: "primary" },
      { icon: "school", label: "Teaching", value: String(teaching), tone: "secondary" },
      { icon: "engineering", label: "Non-teaching", value: String(nonTeaching), tone: "tertiary" },
    );
  }

  if (role === "inventory_manager") {
    const [dishes, menus, stock] = await Promise.all([
      loadBranchMessDishes(admin, schoolSlug),
      loadBranchMessMenus(admin, schoolSlug),
      loadBranchInventoryStock(admin, schoolSlug),
    ]);
    const lowStock = stock.filter((s) => s.status === "Low Stock" || s.status === "Out of Stock").length;
    cards.push(
      { icon: "inventory_2", label: "Stock items", value: String(stock.length), tone: "primary" },
      { icon: "warning", label: "Low / out", value: String(lowStock), tone: lowStock > 0 ? "error" : "secondary" },
      { icon: "restaurant", label: "Mess dishes", value: String(dishes.length), tone: "tertiary" },
    );
  }

  if (role === "admission_officer" || role === "receptionist") {
    const students = await loadBranchStudents(admin, schoolSlug, academicYear);
    const active = students.filter((s) => s.status === "Active").length;
    cards.push(
      { icon: "groups", label: "Students", value: String(students.length), tone: "primary" },
      { icon: "how_to_reg", label: "Active", value: String(active), tone: "secondary" },
    );
  }

  if (role === "staff") {
    const extras = supportStaffExtras(profile ?? {});
    if (extras.includes("transport")) {
      const riders = await loadBranchTransportStudents(admin, schoolSlug, academicYear);
      const using = riders.filter((r) => r.usesTransport).length;
      const routes = new Set(riders.map((r) => r.route).filter((r) => r && r !== "—")).size;
      cards.push(
        { icon: "directions_bus", label: "Riders", value: String(using), tone: "primary" },
        { icon: "route", label: "Routes", value: String(routes), tone: "secondary" },
      );
    }
    if (extras.includes("hostel")) {
      const residents = await loadBranchHostelStudents(admin, schoolSlug, academicYear);
      cards.push(
        { icon: "hotel", label: "Residents", value: String(residents.length), tone: "primary" },
        {
          icon: "payments",
          label: "Fee pending",
          value: String(residents.filter((r) => r.feeStatus === "Pending").length),
          tone: "error",
        },
      );
    }
    if (extras.includes("mess")) {
      const [dishes, menus] = await Promise.all([
        loadBranchMessDishes(admin, schoolSlug),
        loadBranchMessMenus(admin, schoolSlug),
      ]);
      cards.push(
        { icon: "restaurant", label: "Dishes", value: String(dishes.length), tone: "primary" },
        { icon: "menu_book", label: "Menus", value: String(menus.length), tone: "secondary" },
      );
    }
    if (extras.includes("students") && !extras.includes("transport") && !extras.includes("hostel")) {
      const students = await loadBranchStudents(admin, schoolSlug, academicYear);
      cards.push({ icon: "groups", label: "Students", value: String(students.length), tone: "primary" });
    }
  }

  return { cards };
}

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const auth = await requirePortalUser(ctx);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  const staff = await resolveStaffSessionForPortal({
    admin: ctx.supabaseAdmin,
    authId: auth.authId,
    email: auth.email,
    schoolSlug,
  });

  const role: UserRole | string = staff?.role ?? auth.role ?? "staff";
  const profile: StaffProfile = {
    department: staff?.department,
    designation: staff?.designation,
  };
  const allowed = resourcesForStaff(role, profile);

  const url = new URL(req.url);
  const resource = (url.searchParams.get("resource") ?? "overview") as StaffResource;

  if (!allowed.includes(resource)) {
    return Response.json({ error: "Forbidden", resource, role }, { status: 403 });
  }

  const academicYear =
    url.searchParams.get("academicYear") ??
    (await currentAcademicYearName(ctx.supabaseAdmin, schoolSlug));

  try {
    switch (resource) {
      case "overview": {
        const overview = await loadOverview(
          ctx.supabaseAdmin,
          schoolSlug,
          role,
          academicYear,
          profile,
        );
        return Response.json({ overview, role, allowed });
      }
      case "finance": {
        const finance = await loadLeadershipFinance(ctx.supabaseAdmin, schoolSlug, academicYear);
        return Response.json(finance);
      }
      case "expenses": {
        const expenses = await loadBranchExpenses(ctx.supabaseAdmin, schoolSlug);
        return Response.json({ expenses });
      }
      case "staff": {
        const staffId = url.searchParams.get("staffId")?.trim();
        if (staffId) {
          const detail = await loadBranchStaffRecordById(ctx.supabaseAdmin, schoolSlug, staffId, {
            academicYearName: academicYear,
          });
          if (!detail) {
            return Response.json({ error: "Staff not found" }, { status: 404 });
          }
          const empId = String(
            detail.staff.employeeId ?? detail.staff.employee_id ?? detail.staff.id ?? "",
          ).trim();
          const name = String(detail.staff.name ?? "").trim();
          const [slips, leaves] = await Promise.all([
            loadStaffMemberPayrollSlips(ctx.supabaseAdmin, schoolSlug, empId, name),
            loadStaffMemberLeaves(ctx.supabaseAdmin, schoolSlug, empId, name),
          ]);
          return Response.json({
            staff: buildStaffMemberDetail(detail, slips, leaves),
          });
        }
        const staffBundle = await loadLeadershipStaff(ctx.supabaseAdmin, schoolSlug, academicYear);
        return Response.json(staffBundle);
      }
      case "departments": {
        const departments = await loadLeadershipDepartments(ctx.supabaseAdmin, schoolSlug);
        return Response.json(departments);
      }
      case "students": {
        const studentId = url.searchParams.get("studentId")?.trim();
        if (studentId) {
          const detail = await loadBranchStudentById(
            ctx.supabaseAdmin,
            schoolSlug,
            studentId,
            academicYear,
          );
          if (!detail) {
            return Response.json({ error: "Student not found" }, { status: 404 });
          }
          return Response.json({
            student: await buildStaffStudentDetail(detail, schoolSlug, ctx.supabaseAdmin),
          });
        }
        const students = await loadBranchStudents(ctx.supabaseAdmin, schoolSlug, academicYear);
        return Response.json({ students });
      }
      case "transport": {
        const students = await loadBranchTransportStudents(ctx.supabaseAdmin, schoolSlug, academicYear);
        return Response.json({ students });
      }
      case "hostel": {
        const students = await loadBranchHostelStudents(ctx.supabaseAdmin, schoolSlug, academicYear);
        return Response.json({ students });
      }
      case "mess": {
        const [menus, dishes] = await Promise.all([
          loadBranchMessMenus(ctx.supabaseAdmin, schoolSlug),
          loadBranchMessDishes(ctx.supabaseAdmin, schoolSlug),
        ]);
        return Response.json({ menus, dishes });
      }
      case "inventory": {
        const [stock, dishes] = await Promise.all([
          loadBranchInventoryStock(ctx.supabaseAdmin, schoolSlug),
          loadBranchMessDishes(ctx.supabaseAdmin, schoolSlug),
        ]);
        return Response.json({ stock, dishes });
      }
      case "announcements": {
        const announcements = await loadLeadershipAnnouncements(ctx.supabaseAdmin, schoolSlug);
        return Response.json({ announcements });
      }
      case "notifications": {
        const payload = await loadLeadershipNotifications(ctx.supabaseAdmin, schoolSlug);
        return Response.json(payload);
      }
      case "leaves": {
        const allLeaves = await loadBranchLeaveRequests(ctx.supabaseAdmin, schoolSlug);
        const employeeId = String(staff?.employeeId ?? "").trim().toLowerCase();
        const leaves =
          role === "staff" && employeeId
            ? allLeaves.filter((row) => {
                const ref = String(row.employee_id_ref ?? "").trim().toLowerCase();
                return ref === employeeId;
              })
            : allLeaves;
        return Response.json({ leaves });
      }
      case "payroll": {
        if (hasFullAccess(role, profile) || role === "accountant" || role === "hr_manager") {
          const payroll = await loadBranchPayroll(ctx.supabaseAdmin, schoolSlug);
          return Response.json({ payroll, scope: "branch" });
        }
        const payroll = await loadStaffOwnPayroll(
          ctx.supabaseAdmin,
          schoolSlug,
          auth.authId,
          auth.email,
        );
        return Response.json({ payroll, scope: "self" });
      }
      case "profile": {
        const { loadTeacherProfileForPortal } = await import("@/lib/loadTeacherProfile");
        const { data: userRow } = await ctx.supabaseAdmin
          .from("users")
          .select("full_name, phone, avatar_url")
          .eq("id", auth.authId)
          .maybeSingle();
        const teacherProfile = await loadTeacherProfileForPortal(
          ctx.supabaseAdmin,
          schoolSlug,
          auth.authId,
          auth.email,
          String(userRow?.full_name ?? staff?.displayName ?? ""),
          userRow?.phone ?? null,
          userRow?.avatar_url ?? null,
          academicYear
        );
        return Response.json({
          profile: {
            name: teacherProfile.name || staff?.displayName || "Staff",
            role: teacherProfile.designation || staff?.designation || role,
            department: teacherProfile.department || staff?.department || "",
            empId: teacherProfile.employeeId || staff?.employeeId || "",
            email: teacherProfile.email || auth.email || "",
            phone: teacherProfile.phone || "",
            qualification: teacherProfile.qualification || "",
            joined: teacherProfile.joinedDate || "",
            photoUrl: teacherProfile.photoURL || "",
            experienceYears: teacherProfile.experienceYears,
            status: teacherProfile.status,
            employment: staff?.staffKind === "teaching" ? "Teaching" : "Non-Teaching",
            serverRole: role,
          },
        });
      }
      default:
        return Response.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load data";
    return Response.json({ error: message }, { status: 500 });
  }
});

export const POST = withSupabaseRoute("user", async (req, ctx) => {
  const auth = await requirePortalUser(ctx);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  const staff = await resolveStaffSessionForPortal({
    admin: ctx.supabaseAdmin,
    authId: auth.authId,
    email: auth.email,
    schoolSlug,
  });
  const role: string = staff?.role ?? auth.role ?? "staff";
  const profile: StaffProfile = {
    department: staff?.department,
    designation: staff?.designation,
  };

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const action = String(body.action ?? "");

  try {
    if (action === "create-expense") {
      if (!["accountant", "inventory_manager"].includes(role) && !hasFullAccess(role, profile)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const expense = await saveBranchExpense(ctx.supabaseAdmin, schoolSlug, {
        title: String(body.title ?? ""),
        category: String(body.category ?? "Other"),
        amount: Number(body.amount) || 0,
        date: String(body.date ?? new Date().toISOString().slice(0, 10)),
        vendor: String(body.vendor ?? ""),
        notes: String(body.notes ?? ""),
        department: String(body.department ?? staff?.department ?? ""),
        paymentMode: String(body.paymentMode ?? "Cash"),
        status: "Pending",
      });
      return Response.json({ expense });
    }

    if (action === "create-announcement") {
      if (!["receptionist", "hr_manager"].includes(role) && !hasFullAccess(role, profile)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const announcement = await saveBranchAnnouncement(ctx.supabaseAdmin, schoolSlug, {
        title: String(body.title ?? ""),
        content: String(body.content ?? ""),
        target: (body.target as never) ?? "all",
        priority: (body.priority as never) ?? "normal",
        category: String(body.category ?? "General"),
      });
      return Response.json({ announcement });
    }

    if (action === "save-stock") {
      if (!canManageInventory(role, profile)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const item = await saveBranchInventoryStock(ctx.supabaseAdmin, schoolSlug, {
        id: body.id ? String(body.id) : undefined,
        name: String(body.name ?? ""),
        category: String(body.category ?? "General"),
        quantity: Number(body.quantity) || 0,
        unit: String(body.unit ?? "pcs"),
        reorderLevel: Number(body.reorderLevel) || 10,
      });
      return Response.json({ item });
    }

    if (action === "delete-stock") {
      if (!canManageInventory(role, profile)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      await deleteBranchInventoryStock(ctx.supabaseAdmin, schoolSlug, String(body.id ?? ""));
      return Response.json({ ok: true });
    }

    if (action === "save-dish") {
      if (!canManageInventory(role, profile)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const dish = await saveBranchMessDish(ctx.supabaseAdmin, schoolSlug, {
        id: body.id ? String(body.id) : undefined,
        name: String(body.name ?? ""),
        category: (body.category as "breakfast" | "lunch" | "snacks" | "dinner" | "general" | undefined) ?? "general",
        cuisine: String(body.cuisine ?? ""),
        ingredients: String(body.ingredients ?? ""),
        recipe: String(body.recipe ?? ""),
        prepTime: String(body.prepTime ?? ""),
        servings: String(body.servings ?? ""),
        notes: String(body.notes ?? ""),
        isActive: body.isActive !== false,
      });
      return Response.json({ dish });
    }

    if (action === "record-fee-payment") {
      if (!canRecordFeePayment(role, profile)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const result = await recordBranchStudentFeePayment(ctx.supabaseAdmin, schoolSlug, {
        studentId: String(body.studentId ?? ""),
        amount: Number(body.amount) || 0,
        mode: String(body.mode ?? "Cash"),
        feeMonth: body.feeMonth ? String(body.feeMonth) : undefined,
        remark: body.remark ? String(body.remark) : undefined,
        transactionId: body.transactionId ? String(body.transactionId) : undefined,
        academicYear: body.academicYear ? String(body.academicYear) : undefined,
        collectedByName: String(staff?.displayName ?? auth.email?.split("@")[0] ?? "Staff"),
        collectedById: staff?.employeeId ? String(staff.employeeId) : undefined,
      });
      return Response.json(result);
    }

    if (action === "delete-dish") {
      if (!canManageInventory(role, profile)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      await deleteBranchMessDish(ctx.supabaseAdmin, schoolSlug, String(body.id ?? ""));
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save";
    return Response.json({ error: message }, { status: 500 });
  }
});
