import type { SupabaseClient } from "@supabase/supabase-js";
import { getSchoolUuidFromSlug } from "@/lib/supabase/client";
import { resolveStaffDataScope } from "@/lib/resolveStaffDataScope";
import { resolveStaffSessionContext } from "@/lib/auth/resolve-staff-session";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { loadBranchStaffRecords, loadAllStaffProfiles } from "@/lib/loadBranchStaff";
import { loadBranchStudents } from "@/lib/loadBranchStudents";
import { loadBranchFeePayments } from "@/lib/loadBranchFeePayments";
import { loadBranchExpenses } from "@/lib/loadBranchExpenses";
import { loadAllStudentProfiles } from "@/lib/studentProfileStore";
import {
  currentAcademicYearName,
  loadBranchAnnouncements,
  loadBranchEvents,
  loadBranchTimetable,
} from "@/lib/portalMobileData";
import { loadBranchDepartmentsCatalog } from "@/lib/branchDepartmentsStore";
import { calculateAttendanceStats } from "@/utils/attendance";
import { loadBranchMarks, type BranchMarksDoc } from "@/lib/loadBranchMarks";

type AttendanceBucket = {
  presentDates?: string[];
  absentDates?: string[];
  lateDates?: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function attendanceFromProfile(profile: Record<string, unknown>): AttendanceBucket {
  return asRecord(profile.attendance) as AttendanceBucket;
}

function statusForDate(attendance: AttendanceBucket, date: string): "present" | "absent" | "late" | "unmarked" {
  if (attendance.absentDates?.includes(date)) return "absent";
  if (attendance.lateDates?.includes(date)) return "late";
  if (attendance.presentDates?.includes(date)) return "present";
  return "unmarked";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDateRange(from: string | null, to: string | null): string {
  const fromLabel = from
    ? new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";
  const toLabel = to ? new Date(to).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  if (fromLabel && toLabel && fromLabel !== toLabel) return `${fromLabel} – ${toLabel}`;
  return fromLabel || toLabel || "—";
}

function mapLeaveStatus(status: string | null | undefined): "pending" | "approved" | "rejected" {
  const value = String(status ?? "pending").trim().toLowerCase();
  if (value === "approved") return "approved";
  if (value === "rejected" || value === "declined") return "rejected";
  return "pending";
}

export async function assertLeadershipAccess(
  admin: SupabaseClient<any>,
  params: { schoolSlug: string; authId: string; email: string | null; role: string | null }
): Promise<{ allowed: boolean; scope: Awaited<ReturnType<typeof resolveStaffDataScope>> }> {
  const scope = await resolveStaffDataScope(admin, params);
  const allowed = scope.mode === "unrestricted";
  return { allowed, scope };
}

export async function loadBranchLeaveRequests(admin: SupabaseClient<any>, schoolSlug: string) {
  const schoolId = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolId) return [];

  const { data, error } = await admin
    .from("leave_requests")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateBranchLeaveStatus(
  admin: SupabaseClient<any>,
  leaveId: string,
  status: "approved" | "rejected"
) {
  const { data, error } = await admin
    .from("leave_requests")
    .update({ status })
    .eq("id", leaveId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

function mapLeaveRow(
  row: Record<string, unknown>,
  staffDeptByEmployee: Map<string, string>,
  staffPhotoByEmployee: Map<string, string> = new Map()
) {
  const employeeId = String(row.employee_id_ref ?? "");
  const status = mapLeaveStatus(row.status as string);
  const fromDate = String(row.from_date ?? "");
  const toDate = String(row.to_date ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const onLeaveToday =
    status === "approved" &&
    fromDate &&
    toDate &&
    today >= fromDate &&
    today <= toDate;

  return {
    id: String(row.id),
    name: String(row.employee_name ?? "Staff"),
    dept: staffDeptByEmployee.get(employeeId) ?? "—",
    type: String(row.leave_type ?? "Leave"),
    days: String(row.days ?? "—"),
    dates: formatDateRange(fromDate, toDate),
    submitted: relativeTime(String(row.created_at ?? "")),
    status,
    onLeaveToday,
    empId: employeeId || undefined,
    photoUrl: staffPhotoByEmployee.get(employeeId) || "",
    reason: String(row.reason ?? row.remarks ?? "").trim() || undefined,
    contact: String(row.contact ?? row.phone ?? "").trim() || undefined,
    submittedTo: String(row.submitted_to ?? row.submittedTo ?? "").trim() || undefined,
  };
}

export async function loadLeadershipStaff(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
) {
  const staff = await loadBranchStaffRecords(admin, schoolSlug, "all", academicYear);

  const authUids = Array.from(
    new Set(
      staff
        .map((row) => String(row.authUid ?? "").trim())
        .filter(Boolean)
    )
  );

  const avatarByUid = new Map<string, string>();
  if (authUids.length > 0) {
    const { data: users } = await admin.from("users").select("id, avatar_url").in("id", authUids);
    for (const user of users ?? []) {
      const id = String((user as { id?: string }).id ?? "").trim();
      const avatar = String((user as { avatar_url?: string | null }).avatar_url ?? "").trim();
      if (id && avatar) avatarByUid.set(id, avatar);
    }
  }

  const departments = new Set<string>();
  const members = staff.map((row) => {
    const department = String(row.department ?? "General");
    departments.add(department);
    const kind = String(row.staffKind ?? "");
    const category =
      kind === "teaching"
        ? ("Teaching" as const)
        : department.toLowerCase().includes("admin")
          ? ("Admin" as const)
          : department.toLowerCase().includes("support")
            ? ("Support" as const)
            : ("Non-Teaching" as const);

    const authUid = String(row.authUid ?? "").trim();
    const photoUrl =
      String(row.photoUrl ?? "").trim() ||
      (authUid ? avatarByUid.get(authUid) ?? "" : "");

    return {
      id: String(row.id),
      name: String(row.name ?? "Unnamed"),
      role: String(row.designation ?? "Staff"),
      department,
      category,
      status: "present" as const,
      empId: String(row.employeeId ?? row.employee_id ?? row.id),
      joined: String(row.joiningDate ?? row.joinDate ?? ""),
      qualification: String(row.qualification ?? row.qualifications?.[0] ?? ""),
      email: String(row.email ?? ""),
      phone: String(row.phone ?? row.mobile ?? ""),
      rating: 0,
      onProbation: String(row.employmentStatus ?? "").toLowerCase().includes("probation"),
      photoUrl,
      experienceYears:
        typeof row.experienceMonths === "number"
          ? Math.max(0, Math.round(Number(row.experienceMonths) / 12))
          : typeof row.experience_years === "number"
            ? row.experience_years
            : 0,
    };
  });

  const teachingDepartments = Array.from(departments).filter(
    (name) => !["Administration", "Accounts", "Support", "General"].includes(name)
  );

  return {
    staffSummary: {
      total: members.length,
      present: members.length,
      onLeave: 0,
    },
    staffMembers: members,
    staffDepartments: ["All Departments", ...Array.from(departments).sort()],
    teachingDepartments,
  };
}

async function computeSchoolAttendanceRate(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  date: string
): Promise<number> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return 0;

  const [students, profiles] = await Promise.all([
    loadBranchStudents(admin, schoolSlug),
    loadAllStudentProfiles(admin, branchId),
  ]);

  const active = students.filter((row) => row.status === "Active");
  if (!active.length) return 0;

  let present = 0;
  let marked = 0;
  for (const student of active) {
    const profile = asRecord(profiles.get(student.id));
    const attendance = attendanceFromProfile(profile);
    const status = statusForDate(attendance, date);
    if (status === "unmarked") continue;
    marked += 1;
    if (status === "present" || status === "late") present += 1;
  }

  if (!marked) return 0;
  return Math.round((present / marked) * 1000) / 10;
}

/** Branch-wide staff attendance for one date (teachers + non-teaching rows + profile store). */
export async function loadBranchStaffAttendanceSummary(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  date?: string | null
) {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const empty = { present: 0, absent: 0, late: 0, marked: 0, total: 0, rate: 0 };

  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return { date: targetDate, ...empty };

  const [teachersRes, nonTeachingRes, profiles] = await Promise.all([
    admin.from("teachers").select("id, attendance, is_active").eq("branch_id", branchId),
    admin.from("non_teaching_staff").select("id, attendance, is_active").eq("branch_id", branchId),
    loadAllStaffProfiles(admin, branchId),
  ]);

  // If the attendance column isn't available, fall back to profile-only marks.
  const teacherRows =
    teachersRes.error
      ? ((await admin.from("teachers").select("id, is_active").eq("branch_id", branchId)).data ?? [])
      : (teachersRes.data ?? []);
  const nonTeachingRows =
    nonTeachingRes.error
      ? (
          (await admin.from("non_teaching_staff").select("id, is_active").eq("branch_id", branchId))
            .data ?? []
        )
      : (nonTeachingRes.data ?? []);

  const rows = [...teacherRows, ...nonTeachingRows].filter(
    (row) => (row as { is_active?: boolean | null }).is_active !== false
  );

  let present = 0;
  let absent = 0;
  let late = 0;
  for (const row of rows) {
    const rowBucket = attendanceFromProfile(asRecord(row));
    const profileBucket = attendanceFromProfile(
      asRecord(profiles.get(String((row as { id?: unknown }).id)))
    );
    const presentDates = [...(rowBucket.presentDates ?? []), ...(profileBucket.presentDates ?? [])];
    const lateDates = [...(rowBucket.lateDates ?? []), ...(profileBucket.lateDates ?? [])];
    const absentDates = [...(rowBucket.absentDates ?? []), ...(profileBucket.absentDates ?? [])];

    // Explicit present/late wins if the same date appears in both lists.
    if (presentDates.includes(targetDate)) {
      present += 1;
    } else if (lateDates.includes(targetDate)) {
      late += 1;
      present += 1;
    } else if (absentDates.includes(targetDate)) {
      absent += 1;
    }
  }

  const marked = present + absent;
  return {
    date: targetDate,
    present,
    absent,
    late,
    marked,
    total: rows.length,
    rate: marked ? Math.round((present / marked) * 1000) / 10 : 0,
  };
}

export async function loadLeadershipAttendance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null,
  date?: string | null
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  if (!branchId) {
    return {
      attendanceSummary: { present: 0, absent: 0, late: 0, leave: 0, rate: "0%" },
      classAttendance: [],
      chronicAbsentees: [],
    };
  }

  const [students, profiles] = await Promise.all([
    loadBranchStudents(admin, schoolSlug, academicYear),
    loadAllStudentProfiles(admin, branchId),
  ]);

  const active = students.filter((row) => row.status === "Active");
  const classMap = new Map<
    string,
    { class: string; grade: string; present: number; absent: number; total: number }
  >();
  const chronicMap = new Map<string, { id: string; name: string; class: string; days: number }>();

  let present = 0;
  let absent = 0;
  let late = 0;

  for (const student of active) {
    const profile = asRecord(profiles.get(student.id));
    const attendance = attendanceFromProfile(profile);
    const status = statusForDate(attendance, targetDate);
    const classKey = `${student.className}-${student.section}`;
    const bucket = classMap.get(classKey) ?? {
      class: classKey,
      grade: student.className,
      present: 0,
      absent: 0,
      total: 0,
    };
    bucket.total += 1;
    if (status === "present") {
      present += 1;
      bucket.present += 1;
    } else if (status === "late") {
      late += 1;
      present += 1;
      bucket.present += 1;
    } else if (status === "absent") {
      absent += 1;
      bucket.absent += 1;
    }
    classMap.set(classKey, bucket);

    const stats = calculateAttendanceStats(
      attendance.presentDates ?? [],
      attendance.absentDates ?? [],
      attendance.lateDates ?? []
    );
    if (stats.absentDays >= 5) {
      chronicMap.set(student.id, {
        id: student.id,
        name: student.name,
        class: classKey,
        days: stats.absentDays,
      });
    }
  }

  const marked = present + absent;
  const rate = marked ? `${Math.round((present / marked) * 1000) / 10}%` : "0%";

  const classAttendance = Array.from(classMap.values())
    .map((row) => {
      const total = row.total || 1;
      const rowRate = Math.round((row.present / total) * 100);
      return {
        class: row.class,
        grade: row.grade,
        present: row.present,
        absent: row.absent,
        rate: rowRate,
        alert: rowRate < 85,
      };
    })
    .sort((a, b) => a.class.localeCompare(b.class));

  return {
    attendanceSummary: { present, absent, late, leave: 0, rate },
    classAttendance,
    chronicAbsentees: Array.from(chronicMap.values()).sort((a, b) => b.days - a.days).slice(0, 20),
  };
}

export async function loadLeadershipDashboard(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
) {
  const today = new Date().toISOString().slice(0, 10);
  const [students, staffBundle, leaves, announcements, events, attendanceRate] = await Promise.all([
    loadBranchStudents(admin, schoolSlug, academicYear),
    loadLeadershipStaff(admin, schoolSlug, academicYear),
    loadBranchLeaveRequests(admin, schoolSlug),
    loadBranchAnnouncements(admin, schoolSlug),
    loadBranchEvents(admin, schoolSlug),
    computeSchoolAttendanceRate(admin, schoolSlug, today),
  ]);

  const activeStudents = students.filter((row) => row.status === "Active");
  const pendingLeaves = leaves.filter((row) => mapLeaveStatus(row.status as string) === "pending");
  const staffDeptByEmployee = new Map(
    staffBundle.staffMembers.map((row) => [row.empId, String(row.department)])
  );

  const stats = [
    { icon: "group" as const, label: "Enrolled", value: String(activeStudents.length) },
    {
      icon: "fact-check" as const,
      label: "Attendance",
      value: attendanceRate ? `${attendanceRate}%` : "—",
    },
    {
      icon: "badge" as const,
      label: "Staff",
      value: `${staffBundle.staffMembers.length}`,
    },
    {
      icon: "pending-actions" as const,
      label: "Awaiting",
      value: String(pendingLeaves.length),
      highlight: pendingLeaves.length > 0,
    },
  ];

  const priorityApprovals = pendingLeaves.slice(0, 8).map((row) => {
    const name = String(row.employee_name ?? "Staff");
    return {
      id: String(row.id),
      initials: initials(name),
      name,
      detail: `${String(row.leave_type ?? "Leave")} · ${formatDateRange(
        String(row.from_date ?? ""),
        String(row.to_date ?? "")
      )}`,
      type: "leave" as const,
    };
  });

  const latestPosts = announcements.slice(0, 10).map((row) => ({
    id: String(row.id),
    icon: "campaign" as const,
    title: String(row.title ?? "Announcement"),
    preview: String(row.content ?? "").slice(0, 120),
    body: String(row.content ?? ""),
    time: relativeTime(String(row.posted_on ?? "")),
    unread: false,
  }));

  const toAgendaItem = (row: (typeof events)[number]) => {
    const rawDate = String(row.event_date ?? "");
    const dateOnly = rawDate.slice(0, 10);
    let timeLabel = "All day";
    if (rawDate.includes("T") || rawDate.includes(" ")) {
      const parsed = new Date(rawDate);
      if (!Number.isNaN(parsed.getTime())) {
        const hasClock = parsed.getHours() !== 0 || parsed.getMinutes() !== 0;
        if (hasClock) {
          timeLabel = parsed.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }
    }
    return {
      id: String(row.id),
      title: String(row.title ?? "Event"),
      location: String(row.event_type ?? "Campus"),
      time: timeLabel,
      date: dateOnly,
    };
  };

  const todaysEvents = events.filter((row) => String(row.event_date ?? "").slice(0, 10) === today);
  const upcomingEvents = events.filter((row) => {
    const date = String(row.event_date ?? "").slice(0, 10);
    return date >= today;
  });
  const agendaSource = todaysEvents.length > 0 ? todaysEvents : upcomingEvents.slice(0, 6);
  const agendaItems = agendaSource.slice(0, 12).map(toAgendaItem);

  return { stats, priorityApprovals, latestPosts, agendaItems };
}

export async function loadLeadershipAnnouncements(admin: SupabaseClient<any>, schoolSlug: string) {
  const rows = await loadBranchAnnouncements(admin, schoolSlug);
  return rows.map((row) => ({
    id: String(row.id),
    channel: "Announcements" as const,
    category: "General" as const,
    title: String(row.title ?? ""),
    body: String(row.content ?? ""),
    time: relativeTime(String(row.posted_on ?? "")),
    period: "all" as const,
    audience: String(row.target ?? "all"),
    audienceKey: "Staff" as const,
    views: 0,
    notifications: 0,
    pinned: false,
  }));
}

export async function loadLeadershipExams(admin: SupabaseClient<any>, schoolSlug: string) {
  const events = await loadBranchEvents(admin, schoolSlug);
  const exams = events.filter((row) => {
    const type = String(row.event_type ?? "").toLowerCase();
    return type.includes("exam") || type.includes("test") || type.includes("assessment");
  });

  return {
    upcomingExams: exams.map((row) => ({
      id: String(row.id),
      title: String(row.title ?? "Exam"),
      grades: "All",
      term: "Term 1" as const,
      status: "IN PROGRESS" as const,
      dates: String(row.event_date ?? "").slice(0, 10),
      startDate: String(row.event_date ?? "").slice(0, 10),
      endDate: String(row.event_date ?? "").slice(0, 10),
    })),
    exams: exams.map((row) => ({
      id: String(row.id),
      name: String(row.title ?? "Exam"),
      date: String(row.event_date ?? "").slice(0, 10),
      status: "scheduled" as const,
    })),
  };
}

const MONTH_NAME_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseRecordDate(...candidates: Array<string | undefined>): Date | null {
  for (const raw of candidates) {
    const text = String(raw ?? "").trim();
    if (!text) continue;

    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      if (!Number.isNaN(d.getTime())) return d;
    }

    const dmy = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]) - 1;
      let year = Number(dmy[3]);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const excel = text.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/);
    if (excel) {
      const month = MONTH_NAME_INDEX[excel[2].toLowerCase()];
      const year = Number(excel[3] ?? new Date().getFullYear());
      if (month !== undefined) {
        const d = new Date(year, month, Number(excel[1]));
        if (!Number.isNaN(d.getTime())) return d;
      }
    }

    const monthOnly = text.match(/^([A-Za-z]+)(?:\s+(\d{4}))?$/);
    if (monthOnly) {
      const month = MONTH_NAME_INDEX[monthOnly[1].toLowerCase()];
      if (month !== undefined) {
        const year = Number(monthOnly[2] ?? new Date().getFullYear());
        const d = new Date(year, month, 1);
        if (!Number.isNaN(d.getTime())) return d;
      }
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function paymentDate(row: {
  date?: string;
  dateDisplay?: string;
  createdAt?: string;
  feeMonth?: string;
  month?: string;
}): Date | null {
  return (
    parseRecordDate(row.date, row.dateDisplay, row.createdAt) ??
    parseRecordDate(row.feeMonth, row.month)
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Rolling windows so filters always reflect real recent collections
 * (calendar month/quarter can be empty during school breaks).
 */
function periodBounds(now = new Date()) {
  const today = startOfDay(now);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const monthStart = new Date(today);
  monthStart.setDate(today.getDate() - 29);
  const quarterStart = new Date(today);
  quarterStart.setDate(today.getDate() - 89);
  const yearStart = new Date(today);
  yearStart.setDate(today.getDate() - 364);
  return { weekStart, monthStart, quarterStart, yearStart, today };
}

type PeriodKey = "today" | "week" | "month" | "quarter" | "year";

function periodForDate(d: Date, bounds: ReturnType<typeof periodBounds>): PeriodKey[] {
  const day = startOfDay(d);
  const keys: PeriodKey[] = [];
  if (day.getTime() === bounds.today.getTime()) keys.push("today");
  if (day >= bounds.weekStart && day <= bounds.today) keys.push("week");
  if (day >= bounds.monthStart && day <= bounds.today) keys.push("month");
  if (day >= bounds.quarterStart && day <= bounds.today) keys.push("quarter");
  if (day >= bounds.yearStart && day <= bounds.today) keys.push("year");
  return keys;
}

function emptyPeriodStat() {
  return { collected: 0, expenses: 0, paymentsCount: 0, cashCollected: 0, netCollected: 0 };
}

function isCashMode(mode: string): boolean {
  return String(mode ?? "").toLowerCase().includes("cash");
}

function isCancelledStatus(status: string): boolean {
  const value = String(status ?? "").toLowerCase();
  return value === "cancelled" || value === "failed";
}

/** Last N calendar months, oldest first, as { key: 'YYYY-M', label: 'Feb' }. */
function lastMonths(count: number): Array<{ key: string; label: string }> {
  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-IN", { month: "short" }),
    });
  }
  return months;
}

function formatPaymentDate(row: {
  date?: string;
  dateDisplay?: string;
  createdAt?: string;
}): string {
  const display = String(row.dateDisplay ?? "").trim();
  if (display) return display;
  const d = paymentDate(row);
  if (d) {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return String(row.date ?? "").trim() || "—";
}

export async function loadLeadershipFinance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
) {
  const [payments, expenses, students] = await Promise.all([
    loadBranchFeePayments(admin, schoolSlug, {
      academicYear: academicYear ?? null,
      limit: 800,
    }),
    loadBranchExpenses(admin, schoolSlug).catch(() => []),
    loadBranchStudents(admin, schoolSlug, academicYear).catch(() => []),
  ]);
  const total = payments.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const month = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  const studentById = new Map<string, { className: string; section: string }>();
  const studentByAdm = new Map<string, { className: string; section: string }>();
  for (const s of students) {
    const meta = {
      className: String(s.className ?? "").trim(),
      section: String(s.section ?? "").trim().toUpperCase(),
    };
    if (s.id) studentById.set(String(s.id), meta);
    const adm = String(s.admissionNo ?? "").trim().toLowerCase();
    if (adm) studentByAdm.set(adm, meta);
  }

  // Anchor windows to the newest receipt so imported / term-end data still filters usefully
  // (calendar "this month" is often empty during breaks).
  let latestPaymentAt: Date | null = null;
  for (const row of payments) {
    const d = paymentDate(row);
    if (!d) continue;
    if (!latestPaymentAt || d > latestPaymentAt) latestPaymentAt = d;
  }
  const today = startOfDay(new Date());
  const anchor =
    latestPaymentAt && startOfDay(latestPaymentAt) < today
      ? latestPaymentAt
      : latestPaymentAt ?? new Date();

  const months = lastMonths(6);
  const monthIndex = new Map(months.map((m, i) => [m.key, i]));
  const cashFlow = months.map((m) => ({ label: m.label, in: 0, out: 0 }));
  const bounds = periodBounds(anchor);
  const periodStats: Record<PeriodKey, ReturnType<typeof emptyPeriodStat>> = {
    today: emptyPeriodStat(),
    week: emptyPeriodStat(),
    month: emptyPeriodStat(),
    quarter: emptyPeriodStat(),
    year: emptyPeriodStat(),
  };

  for (const row of payments) {
    const amount = Number(row.amount) || 0;
    const cash = isCashMode(row.mode);
    const cancelled = isCancelledStatus(row.status);
    const d = paymentDate(row);
    const apply = (key: PeriodKey) => {
      periodStats[key].collected += amount;
      periodStats[key].paymentsCount += 1;
      if (cash) periodStats[key].cashCollected += amount;
      if (!cancelled) periodStats[key].netCollected += amount;
    };
    if (!d) {
      // Undated receipts still count toward the widest window so filters aren't stuck at 0.
      apply("year");
      continue;
    }
    const idx = monthIndex.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx !== undefined) cashFlow[idx].in += amount;
    for (const key of periodForDate(d, bounds)) apply(key);
  }
  for (const row of expenses) {
    const amount = Number(row.amount) || 0;
    const d = parseRecordDate(row.date);
    if (!d) {
      periodStats.year.expenses += amount;
      continue;
    }
    const idx = monthIndex.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx !== undefined) cashFlow[idx].out += amount;
    for (const key of periodForDate(d, bounds)) {
      periodStats[key].expenses += amount;
    }
  }

  const totalExpenses = expenses.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const cashTotal = payments.reduce(
    (sum, row) => sum + (isCashMode(row.mode) ? Number(row.amount) || 0 : 0),
    0
  );
  const netTotal = payments.reduce(
    (sum, row) => sum + (isCancelledStatus(row.status) ? 0 : Number(row.amount) || 0),
    0
  );

  const classSet = new Set<string>();
  const sectionSet = new Set<string>();

  const shapedPayments = payments.map((row) => {
    const d = paymentDate(row);
    const periods = d ? periodForDate(d, bounds) : (["year"] as PeriodKey[]);
    const txnId = String(row.transNo || row.transactionId || "").trim();
    const studentMeta =
      studentById.get(String(row.studentId ?? "").trim()) ??
      studentByAdm.get(String(row.admissionNo ?? "").trim().toLowerCase());
    const className = studentMeta?.className && studentMeta.className !== "—" ? studentMeta.className : "";
    const section = studentMeta?.section && studentMeta.section !== "—" ? studentMeta.section : "";
    if (className) classSet.add(className);
    if (section) sectionSet.add(section);
    return {
      id: row.id,
      receiptNo: row.receiptNo || row.id,
      student: row.studentName,
      admissionNo: row.admissionNo || "",
      className,
      section,
      amount: `₹ ${Number(row.amount || 0).toLocaleString("en-IN")}`,
      amountRaw: Number(row.amount) || 0,
      date: formatPaymentDate(row),
      dateIso: d ? toLocalIso(d) : "",
      time: String(row.time ?? "").trim(),
      mode: row.mode || "",
      feeMonth: row.feeMonth || row.month || "",
      particular: row.particular || "",
      collectedBy: row.collectedByName || "",
      reference: String(row.reference ?? "").trim(),
      transactionId: txnId,
      status: row.status || "Completed",
      periods,
    };
  });

  const sortClass = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

  return {
    financeOverview: {
      total: `₹ ${total.toLocaleString("en-IN")}`,
      totalRaw: total,
      cashTotal,
      netTotal,
      progress: total > 0 ? 100 : 0,
      target: `₹ ${total.toLocaleString("en-IN")}`,
      balance: "₹ 0",
      month,
      monthCollected: periodStats.month.collected,
      expensesTotal: totalExpenses,
      paymentsCount: payments.length,
    },
    periodStats,
    monthlyTrend: cashFlow.map((m) => ({ label: m.label, amount: m.in })),
    cashFlow,
    filterOptions: {
      classes: [...classSet].sort(sortClass),
      sections: [...sectionSet].sort(sortClass),
    },
    feeCategories: [] as Array<{ label: string; amount: string; percent: number; color: string }>,
    feeDefaulters: [] as Array<{ id: string; name: string; class: string; amount: string; days: number }>,
    recentPayments: shapedPayments.slice(0, 100),
  };
}

export async function loadLeadershipDepartments(admin: SupabaseClient<any>, schoolSlug: string) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return { departments: [] };

  const catalog = await loadBranchDepartmentsCatalog(admin, branchId);
  const staff = await loadBranchStaffRecords(admin, schoolSlug, "all");

  const departments = catalog.departments.map((dept) => {
    const deptStaff = staff.filter((row) => String(row.department ?? "") === dept.name);
    return {
      id: dept.id,
      name: dept.name,
      hod: deptStaff.find((row) => String(row.designation ?? "").toLowerCase().includes("hod"))?.name ?? "—",
      teachers: deptStaff.map((row) => String(row.name ?? "")),
      staffCount: deptStaff.length,
      status: "Active" as const,
    };
  });

  return { departments };
}

export async function loadLeadershipNotifications(admin: SupabaseClient<any>, schoolSlug: string) {
  const [announcements, leaves] = await Promise.all([
    loadBranchAnnouncements(admin, schoolSlug),
    loadBranchLeaveRequests(admin, schoolSlug),
  ]);

  const fromLeaves = leaves
    .filter((row) => mapLeaveStatus(row.status as string) === "pending")
    .slice(0, 10)
    .map((row) => ({
      id: `leave-${row.id}`,
      title: `Leave request — ${String(row.employee_name ?? "Staff")}`,
      body: `${String(row.leave_type ?? "Leave")} · ${formatDateRange(
        String(row.from_date ?? ""),
        String(row.to_date ?? "")
      )}`,
      type: "approval" as const,
      time: relativeTime(String(row.created_at ?? "")),
      groupLabel: "Leave approvals",
      read: false,
      createdAt: String(row.created_at ?? ""),
    }));

  const fromAnnouncements = announcements.slice(0, 15).map((row) => ({
    id: `ann-${row.id}`,
    title: String(row.title ?? "Announcement"),
    body: String(row.content ?? "").slice(0, 160),
    type: "academic" as const,
    time: relativeTime(String(row.posted_on ?? "")),
    groupLabel: "Announcements",
    read: false,
    createdAt: String(row.posted_on ?? ""),
  }));

  return { notifications: [...fromLeaves, ...fromAnnouncements] };
}

export async function loadLeadershipVpDashboard(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
) {
  const dashboard = await loadLeadershipDashboard(admin, schoolSlug, academicYear);
  const [leaves, events, attendance] = await Promise.all([
    loadBranchLeaveRequests(admin, schoolSlug),
    loadBranchEvents(admin, schoolSlug),
    loadLeadershipAttendance(admin, schoolSlug, academicYear),
  ]);

  const pendingLeaves = leaves.filter((row) => mapLeaveStatus(row.status as string) === "pending");

  const dashboardStats = [
    { icon: "groups" as const, label: "Students", value: dashboard.stats[0]?.value ?? "0", colorKey: "primary" as const },
    {
      icon: "gavel" as const,
      label: "Pending leaves",
      value: String(pendingLeaves.length),
      colorKey: "tertiary" as const,
    },
    { icon: "event" as const, label: "Events", value: String(events.length), colorKey: "secondary" as const },
    {
      icon: "campaign" as const,
      label: "Attendance",
      value: attendance.attendanceSummary.rate,
      colorKey: "error" as const,
    },
  ];

  const initialPriorityActions = pendingLeaves.slice(0, 3).map((row, index) => ({
    id: String(row.id),
    title: `${String(row.employee_name ?? "Staff")} — leave`,
    subtitle: formatDateRange(String(row.from_date ?? ""), String(row.to_date ?? "")),
    accent: index === 0 ? "#FEF3C7" : "#E0F2FE",
    iconBg: index === 0 ? "#F59E0B" : "#0EA5E9",
    iconColor: "#FFFFFF",
    icon: "assignment-ind" as const,
    cta: "Review",
    ctaFilled: index === 0,
    route: "LeaveApprovals" as const,
  }));

  const initialTodayOverview = [
    {
      icon: "percent" as const,
      label: "Attendance rate",
      value: attendance.attendanceSummary.rate,
      colorKey: "primary" as const,
      route: "StaffManagement" as const,
    },
    {
      icon: "gavel" as const,
      label: "Pending approvals",
      value: String(pendingLeaves.length),
      colorKey: "tertiary" as const,
      route: "LeaveApprovals" as const,
    },
  ];

  const initialRecentActivity = dashboard.latestPosts.slice(0, 5).map((post) => ({
    id: post.id,
    text: post.title,
    time: post.time,
    source: "Announcements",
    dot: "primary" as const,
  }));

  return { dashboardStats, initialPriorityActions, initialTodayOverview, initialRecentActivity };
}

export async function loadLeadershipAcademicDirectorDashboard(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
) {
  const [attendance, students, staffBundle, exams] = await Promise.all([
    loadLeadershipAttendance(admin, schoolSlug, academicYear),
    loadBranchStudents(admin, schoolSlug, academicYear),
    loadLeadershipStaff(admin, schoolSlug, academicYear),
    loadLeadershipExams(admin, schoolSlug),
  ]);

  const activeStudents = students.filter((row) => row.status === "Active");
  const rateNum = parseFloat(attendance.attendanceSummary.rate) || 0;

  return {
    academicHealth: {
      score: Math.min(100, Math.round(rateNum)),
      growth: "",
      attendance: attendance.attendanceSummary.rate,
      examPass: "—",
      syllabus: "—",
      teacherScore: `${staffBundle.staffMembers.length}`,
    },
    initialPriorityActions: exams.upcomingExams.slice(0, 3).map((exam, index) => ({
      id: exam.id,
      title: exam.title,
      sub: exam.dates,
      tone: (index === 0 ? "error" : "warning") as "error" | "warning",
      actionLabel: "View",
      kind: "exam-upload" as const,
      icon: "upload-file" as const,
      examId: exam.id,
    })),
    studentKpis: [
      { label: 'Total students', value: String(activeStudents.length), delta: '' },
      { label: 'At risk', value: String(attendance.chronicAbsentees.length), delta: '', negative: true },
      { label: 'Avg attendance', value: attendance.attendanceSummary.rate, delta: '' },
    ],
    atRiskStudents: attendance.chronicAbsentees.map((row) => ({
      name: row.name,
      className: row.class,
      risk: `${row.days} absences`,
      avatar: '',
    })),
    gradePerformance: attendance.classAttendance.map((row) => ({
      label: row.grade,
      percent: row.rate,
    })),
  };
}

export async function loadLeadershipAcademicManagerDashboard(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
) {
  const [events, timetable, leaves] = await Promise.all([
    loadBranchEvents(admin, schoolSlug),
    loadBranchTimetable(admin, schoolSlug),
    loadBranchLeaveRequests(admin, schoolSlug),
  ]);

  const pendingLeaves = leaves.filter((row) => mapLeaveStatus(row.status as string) === "pending");

  return {
    kpiCards: [
      { label: "Upcoming events", value: String(events.length), sub: "This term", tone: "primary" as const },
      { label: "Timetable slots", value: String(timetable.length), sub: "Configured", tone: "tertiary" as const },
      { label: "Leave requests", value: String(pendingLeaves.length), sub: "Pending", tone: "error" as const },
    ],
    initialPriorityTasks: pendingLeaves.slice(0, 3).map((row, index) => ({
      id: String(row.id),
      title: `Approve leave — ${String(row.employee_name ?? "Staff")}`,
      tone: (index === 0 ? "error" : "tertiary") as "error" | "tertiary",
      kind: "substitution" as const,
      actionLabel: "Review",
    })),
    initialCalendarEvents: events.slice(0, 8).map((row, index) => {
      const date = new Date(String(row.event_date ?? ""));
      return {
        id: String(row.id),
        title: String(row.title ?? "Event"),
        hour: date.getHours(),
        minute: date.getMinutes(),
        location: String(row.event_type ?? "Campus"),
        tone: (index % 3 === 0 ? "primary" : index % 3 === 1 ? "tertiary" : "error") as
          | "primary"
          | "tertiary"
          | "error",
        dayOffset: 0,
      };
    }),
    upcomingExams: events
      .filter((row) => String(row.event_type ?? "").toLowerCase().includes("exam"))
      .map((row) => ({
        id: String(row.id),
        title: String(row.title ?? "Exam"),
        date: String(row.event_date ?? "").slice(0, 10),
        grades: "All",
      })),
    staffList: (await loadLeadershipStaff(admin, schoolSlug, academicYear)).staffMembers.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.role,
      classes: row.department,
      status: "available" as const,
    })),
  };
}

export async function loadLeadershipProfile(
  admin: SupabaseClient<any>,
  params: { schoolSlug: string; authId: string; email: string | null }
) {
  const staff = await resolveStaffSessionContext({
    admin,
    authId: params.authId,
    email: params.email,
    schoolSlug: params.schoolSlug,
  });
  if (!staff) return null;

  const branchId = await resolveBranchUuid(admin, params.schoolSlug);
  const years = branchId ? await listBranchAcademicYears(admin, branchId) : [];
  const [students, staffBundle] = await Promise.all([
    loadBranchStudents(admin, params.schoolSlug),
    loadLeadershipStaff(admin, params.schoolSlug),
  ]);

  const member = staffBundle.staffMembers.find(
    (row) =>
      row.empId === staff.employeeId ||
      (params.email && row.email.toLowerCase() === params.email.toLowerCase())
  );

  return {
    name: staff.displayName,
    shortName: staff.displayName.split(" ").slice(-1)[0] ?? staff.displayName,
    role: staff.designation,
    school: params.schoolSlug,
    empId: staff.employeeId,
    yearsExp: member?.experienceYears ?? 0,
    students: students.filter((row) => row.status === "Active").length,
    staff: staffBundle.staffMembers.length,
    email: member?.email || params.email || "",
    phone: member?.phone || "",
    qualification: member?.qualification || "",
    joined: member?.joined || "",
    photoUrl: member?.photoUrl || "",
    employment: staff.staffKind === "teaching" ? "Teaching" : "Non-Teaching",
    academicYear: years.find((y) => y.is_current)?.name ?? years[0]?.name ?? "",
  };
}

const SUBJECT_COLORS = ["#144835", "#0d9488", "#b45309", "#1d4ed8", "#7c3aed", "#be123c", "#047857"];

function matchesAcademicTerm(exam: string, term: string | null | undefined): boolean {
  if (!term) return true;
  const examText = String(exam ?? "").toLowerCase();
  const termText = String(term).toLowerCase();
  if (examText.includes(termText)) return true;
  if (termText.includes("term 1") && /(term\s*1|pt\s*1|unit\s*1|mid[- ]?term\s*1)/i.test(examText)) return true;
  if (termText.includes("term 2") && /(term\s*2|pt\s*2|unit\s*2|mid[- ]?term\s*2)/i.test(examText)) return true;
  if (termText.includes("term 3") && /(term\s*3|pt\s*3|unit\s*3|final|annual)/i.test(examText)) return true;
  return false;
}

function rowPercent(marks: number | null | undefined, maxMarks: number | null | undefined): number | null {
  if (marks == null || Number.isNaN(Number(marks))) return null;
  const max = Number(maxMarks) > 0 ? Number(maxMarks) : 100;
  return Math.max(0, Math.min(100, (Number(marks) / max) * 100));
}

function classifyPercent(pct: number): "distinction" | "first" | "pass" | "fail" {
  if (pct >= 75) return "distinction";
  if (pct >= 60) return "first";
  if (pct >= 35) return "pass";
  return "fail";
}

function compareGradeLabel(a: string, b: string): number {
  const roman: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
    xi: 11,
    xii: 12,
  };
  const token = (value: string) =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/^grade\s+/i, "")
      .replace(/\s+/g, "");
  const num = (value: string) => {
    const key = token(value);
    if (roman[key] != null) return roman[key];
    const match = key.match(/(\d+)/);
    return match ? Number(match[1]) : 999;
  };
  return num(a) - num(b) || a.localeCompare(b);
}

export async function loadLeadershipAcademicPerformance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null,
  term?: string | null
) {
  const docs = await loadBranchMarks(admin, schoolSlug, academicYear);
  const filtered = docs.filter((doc) => matchesAcademicTerm(doc.exam, term));
  const source = filtered.length > 0 || !term ? filtered : docs;

  type StudentAgg = {
    name: string;
    grade: string;
    percents: number[];
  };

  const byStudent = new Map<string, StudentAgg>();
  const bySubject = new Map<string, number[]>();
  const byGrade = new Map<string, number[]>();
  let distinction = 0;
  let firstClass = 0;
  let pass = 0;
  let fail = 0;
  let scoredRows = 0;

  const pushScore = (doc: BranchMarksDoc, studentKey: string, name: string, pct: number) => {
    scoredRows += 1;
    const bucket = classifyPercent(pct);
    if (bucket === "distinction") distinction += 1;
    else if (bucket === "first") firstClass += 1;
    else if (bucket === "pass") pass += 1;
    else fail += 1;

    const subject = String(doc.subject ?? "General").trim() || "General";
    const grade = String(doc.grade ?? "—").trim() || "—";
    if (!bySubject.has(subject)) bySubject.set(subject, []);
    bySubject.get(subject)!.push(pct);
    if (!byGrade.has(grade)) byGrade.set(grade, []);
    byGrade.get(grade)!.push(pct);

    const existing = byStudent.get(studentKey) ?? { name, grade, percents: [] };
    existing.percents.push(pct);
    if (!existing.name && name) existing.name = name;
    if (!existing.grade || existing.grade === "—") existing.grade = grade;
    byStudent.set(studentKey, existing);
  };

  for (const doc of source) {
    const defaultMax = Number(doc.maxMarks) > 0 ? Number(doc.maxMarks) : 100;
    for (const row of doc.rows) {
      if (row.absent) continue;
      const pct = rowPercent(row.marks, row.maxMarks ?? defaultMax);
      if (pct == null) continue;
      const studentKey =
        String(row.studentId || row.admissionNo || row.roll || row.studentName || "").trim() ||
        `${doc.id}-${row.studentName ?? "student"}`;
      pushScore(doc, studentKey, String(row.studentName ?? "Student").trim() || "Student", pct);
    }
  }

  const overallPassRate =
    scoredRows > 0 ? Number((((distinction + firstClass + pass) / scoredRows) * 100).toFixed(1)) : null;

  const subjectPerformance = Array.from(bySubject.entries())
    .map(([subject, values], index) => {
      const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
      return {
        subject,
        percent: Math.round(avg),
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
        entries: values.length,
      };
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 10);

  const gradePerformance = Array.from(byGrade.entries())
    .map(([grade, values]) => {
      const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
      const passCount = values.filter((n) => n >= 35).length;
      const passPct = Math.round((passCount / values.length) * 100);
      const trend: "up" | "down" | "flat" = avg >= 70 ? "up" : avg < 50 ? "down" : "flat";
      return {
        grade,
        avg: `${avg.toFixed(1)}%`,
        pass: `${passPct}%`,
        trend,
        entries: values.length,
      };
    })
    .sort((a, b) => compareGradeLabel(a.grade, b.grade));

  const schoolToppers = Array.from(byStudent.values())
    .map((student) => {
      const avg = student.percents.reduce((sum, n) => sum + n, 0) / student.percents.length;
      return {
        name: student.name,
        grade: student.grade.startsWith("Grade") ? student.grade : `Grade ${student.grade}`,
        score: `${avg.toFixed(1)}%`,
        avg,
      };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8)
    .map((row, index) => ({
      name: row.name,
      grade: row.grade,
      score: row.score,
      medal: (index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : "gold") as
        | "gold"
        | "silver"
        | "bronze",
    }));

  const examsCovered = new Set(source.map((doc) => String(doc.exam || "").trim()).filter(Boolean)).size;
  const subjectsCovered = bySubject.size;

  return {
    term: term ?? "All",
    hasData: scoredRows > 0,
    docsCount: source.length,
    overview: {
      passRate: overallPassRate == null ? "—" : `${overallPassRate}%`,
      passRateValue: overallPassRate,
      distinction,
      firstClass,
      pass,
      fail,
      scoredRows,
      examsCovered,
      subjectsCovered,
    },
    subjectPerformance,
    gradePerformance,
    schoolToppers,
  };
}

export function mapLeadershipLeaves(
  rows: Record<string, unknown>[],
  staffDeptByEmployee: Map<string, string>,
  staffPhotoByEmployee: Map<string, string> = new Map()
) {
  return rows.map((row) => mapLeaveRow(row, staffDeptByEmployee, staffPhotoByEmployee));
}
