import {
  calculateAttendanceStats,
  classifyAttendanceDay,
  getAttendanceStatusForDate,
} from "@/utils/attendance";

export type LiveActivity = {
  id: string;
  text: string;
  time: string;
  href: string;
  ts: number;
};

export function toMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof val === "object" && val !== null && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate().getTime();
  }
  const t = new Date(val as string | number).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function relTime(val: unknown): string {
  if (!val) return "Recently";
  const ts = toMillis(val);
  if (!ts) return "Recently";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-IN");
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function isInCurrentMonth(val: unknown): boolean {
  const ts = toMillis(val);
  if (!ts) return false;
  const d = new Date(ts);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return key === currentMonthKey();
}

export function parseDateKey(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  const ts = toMillis(val);
  if (!ts) return "";
  return new Date(ts).toISOString().split("T")[0];
}

export type DashboardActivity = {
  id: string;
  text: string;
  time: string;
  href: string;
};

export function mergeLiveActivities(items: LiveActivity[], limit = 8): DashboardActivity[] {
  const seen = new Set<string>();
  return items
    .filter((item) => item.ts > 0 && item.text.trim().length > 0)
    .sort((a: any, b: any) => b.ts - a.ts)
    .filter((item) => {
      const key = `${item.id}-${item.ts}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ id, text, time, href }) => ({ id, text, time, href }));
}

export function mapActivityDoc(
  id: string,
  data: Record<string, unknown>,
  base: string
): LiveActivity | null {
  if (data.seed === true || data.live === false) return null;
  const ts = toMillis(data.createdAt);
  if (!ts) return null;
  const text = String(data.text ?? data.title ?? "").trim();
  if (!text) return null;
  return {
    id: `activity-${id}`,
    text,
    time: relTime(data.createdAt),
    href: String(data.href ?? base),
    ts,
  };
}

export function mapPaymentDoc(id: string, data: Record<string, unknown>, base: string): LiveActivity | null {
  const ts = toMillis(data.createdAt ?? data.date);
  if (!ts) return null;
  const amount = Number(data.amount) || 0;
  const student = String(data.studentName ?? data.student ?? "Student").trim();
  return {
    id: `payment-${id}`,
    text: `Payment recorded — ${student} (₹${amount.toLocaleString("en-IN")})`,
    time: relTime(data.createdAt ?? data.date),
    href: `${base}/finance/payments`,
    ts,
  };
}

export function mapLeaveDoc(id: string, data: Record<string, unknown>, base: string): LiveActivity | null {
  const ts = toMillis(data.createdAt ?? data.updatedAt);
  if (!ts) return null;
  const name = String(data.employeeName ?? data.name ?? "Staff").trim();
  const type = String(data.leaveType ?? data.type ?? "Leave").trim();
  const status = String(data.status ?? "Pending");
  return {
    id: `leave-${id}`,
    text: `Leave ${status.toLowerCase()} — ${name} (${type})`,
    time: relTime(data.createdAt),
    href: `${base}/hr/leaves`,
    ts,
  };
}

export function mapApplicationDoc(id: string, data: Record<string, unknown>, base: string): LiveActivity | null {
  const ts = toMillis(data.createdAt);
  if (!ts) return null;
  const name = String(data.studentName ?? data.name ?? "Applicant").trim();
  return {
    id: `application-${id}`,
    text: `Admission application — ${name}`,
    time: relTime(data.createdAt),
    href: `${base}/admission/applications`,
    ts,
  };
}

export function mapExpenseDoc(id: string, data: Record<string, unknown>, base: string): LiveActivity | null {
  const ts = toMillis(data.createdAt ?? data.date ?? data.updatedAt);
  if (!ts) return null;
  const desc = String(data.title ?? data.description ?? data.category ?? "Expense").trim();
  return {
    id: `expense-${id}`,
    text: `Expense claim — ${desc}`,
    time: relTime(data.createdAt),
    href: `${base}/finance/expenses`,
    ts,
  };
}

export function mapEventCreatedDoc(id: string, data: Record<string, unknown>, base: string): LiveActivity | null {
  const ts = toMillis(data.createdAt ?? data.date);
  if (!ts) return null;
  const title = String(data.title ?? "Event").trim();
  return {
    id: `event-${id}`,
    text: `Event scheduled — ${title}`,
    time: relTime(data.createdAt),
    href: `${base}/academic/calendar`,
    ts,
  };
}

export function mapMessageDoc(id: string, data: Record<string, unknown>, base: string): LiveActivity | null {
  const ts = toMillis(data.createdAt);
  if (!ts) return null;
  const subject = String(data.subject ?? data.title ?? "Message").trim();
  return {
    id: `message-${id}`,
    text: `Message sent — ${subject}`,
    time: relTime(data.createdAt),
    href: `${base}/communication/messages`,
    ts,
  };
}

export function mapStudentDoc(id: string, data: Record<string, unknown>, base: string): LiveActivity | null {
  const ts = toMillis(data.createdAt ?? data.enrolledAt);
  if (!ts) return null;
  const name = `${String(data.firstName ?? "").trim()} ${String(data.lastName ?? "").trim()}`.trim() || "New student";
  return {
    id: `student-${id}`,
    text: `Student enrolled — ${name}`,
    time: relTime(data.createdAt ?? data.enrolledAt),
    href: `${base}/academic/students/${encodeURIComponent(id)}/profile`,
    ts,
  };
}

export function computeStudentAttendancePercent(
  students: Array<Record<string, unknown>>,
  holidays: string[]
): number {
  if (students.length === 0) return 0;
  const sum = students.reduce((acc, s) => {
    const stats = calculateAttendanceStats(
      (s.attendance as { presentDates?: string[] })?.presentDates ?? [],
      (s.attendance as { absentDates?: string[] })?.absentDates ?? [],
      (s.attendance as { lateDates?: string[] })?.lateDates ?? [],
      undefined,
      undefined,
      holidays
    );
    return acc + stats.percentage;
  }, 0);
  return Math.round(sum / students.length);
}

/** Today's marked attendance; falls back to term average when today is unmarked. */
export function computeTodayStudentAttendancePercent(
  students: Array<Record<string, unknown>>,
  today: string,
  holidays: string[]
): number {
  const active = students.filter((s) => String(s.status ?? "Active") !== "Inactive");
  if (active.length === 0) return 0;

  const dayInfo = classifyAttendanceDay(
    today,
    holidays.map((date) => ({ date }))
  );
  if (!dayInfo.canMark) return 0;

  let marked = 0;
  let present = 0;
  for (const s of active) {
    const att = s.attendance as
      | { presentDates?: string[]; absentDates?: string[]; lateDates?: string[] }
      | undefined;
    const status = getAttendanceStatusForDate(att, today);
    if (status !== "None") marked++;
    if (status === "P" || status === "HD") present++;
  }

  if (marked === 0) {
    return computeStudentAttendancePercent(active, holidays);
  }
  return Math.round((present / active.length) * 100);
}

export function isUpcomingEvent(dateVal: unknown, today: string): boolean {
  const key = parseDateKey(dateVal);
  return key.length > 0 && key >= today;
}

export type TransportHostelMetrics = {
  totalBuses: number;
  activeRoutes: number;
  studentsUsingTransport: number;
  driversAssigned: number;
  driverAttendancePct: number;
  transportFeePending: number;
  hostelStudents: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  roomOccupancyPct: number;
  hostelFeePending: number;
};

function sumFeeRowForMonth(
  feeGrid: Array<{ name?: string; values?: unknown[] }> | undefined,
  keyword: string,
  monthIndex: number
): number {
  if (!Array.isArray(feeGrid)) return 0;
  const row = feeGrid.find((r) => String(r.name ?? "").toUpperCase().includes(keyword));
  if (!row || !Array.isArray(row.values)) return 0;
  return Number(row.values[monthIndex]) || 0;
}

export function computeTransportHostelMetrics(
  students: Array<Record<string, unknown>>,
  monthIndex = new Date().getMonth()
): Omit<
  TransportHostelMetrics,
  "totalBuses" | "activeRoutes" | "driverAttendancePct" | "totalBeds" | "occupiedBeds"
> & {
  busNos: Set<string>;
  routeNames: Set<string>;
  driverNames: Set<string>;
} {
  const busNos = new Set<string>();
  const routeNames = new Set<string>();
  const driverNames = new Set<string>();
  let studentsUsingTransport = 0;
  let transportFeePending = 0;
  let hostelStudents = 0;
  let hostelFeePending = 0;

  for (const s of students) {
    const td = s.transportDetails as Record<string, unknown> | undefined;
    if (td && String(td.facility ?? "").toUpperCase() === "YES") {
      studentsUsingTransport++;
      const bus = String(td.busNo ?? "").trim();
      if (bus && bus !== "--") busNos.add(bus);
      const route = String(td.route ?? "").trim();
      if (route && !["NO TRANSPORT", "NO TRANSPORT.", "--"].includes(route.toUpperCase())) {
        routeNames.add(route);
      }
      const driver = String(td.driverName ?? "").trim();
      if (driver) driverNames.add(driver);

      const fees = td.fees;
      if (Array.isArray(fees)) {
        transportFeePending += Number(fees[monthIndex]) || 0;
      }
    }

    if (String(s.studentType ?? "").toLowerCase() === "boarder") {
      hostelStudents++;
    }

    const feeDetails = s.feeDetails as { feeGrid?: Array<{ name?: string; values?: unknown[] }> } | undefined;
    hostelFeePending += sumFeeRowForMonth(feeDetails?.feeGrid, "HOSTEL", monthIndex);
  }

  return {
    busNos,
    routeNames,
    driverNames,
    studentsUsingTransport,
    driversAssigned: driverNames.size,
    transportFeePending,
    hostelStudents,
    vacantBeds: 0,
    roomOccupancyPct: 0,
    hostelFeePending,
  };
}
