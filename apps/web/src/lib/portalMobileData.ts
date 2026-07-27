import type { SupabaseClient } from "@supabase/supabase-js";
import { getSchoolCodeFromSlug, getSchoolUuidFromSlug } from "@/lib/supabase/client";
import { resolveStudentSessionContext } from "@/lib/auth/resolve-student-session";
import { resolveStaffSessionContext } from "@/lib/auth/resolve-staff-session";
import { resolveStaffDataScope } from "@/lib/resolveStaffDataScope";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  loadBranchStudentById,
  loadBranchStudents,
  type BranchStudentDetail,
} from "@/lib/loadBranchStudents";
import {
  teachingLoadsFromYearProfile,
  type BranchStaffDetail,
} from "@/lib/loadBranchStaff";
import {
  loadAllStudentProfiles,
  loadStudentProfileData,
  resolveStudentPhotoUrl,
  saveStudentProfileData,
  type StudentProfileData,
} from "@/lib/studentProfileStore";
import { classScopeKey, parseClassScopeKey } from "@/lib/teacherClassScope";
import { academicYearAprMarRange, calculateAttendanceStats } from "@/utils/attendance";
import {
  extractFeeTransactions,
  hydrateStudentFeeDetailsWithAdmin,
} from "@/lib/studentFeeResolver";
import { hasFeeGridData, nextReceiptNo, monthLabelFromIndex } from "@/lib/feeDepositUtils";
import {
  loadBranchFeePayments,
  upsertBranchFeePayment,
  type BranchFeePaymentRecord,
} from "@/lib/loadBranchFeePayments";
import { getSchoolBranch } from "@/lib/schools";
import type { TransportBusRecord } from "@/lib/branchTransportStore";
import type { TeacherTimetableSnapshot } from "@/lib/teacherTimetableUtils";
import { listTeacherNamesFromDocs, resolveTimetableTeacherLabel } from "@/lib/teacherTimetableUtils";
import { loadBranchTimetables } from "@/lib/loadBranchTimetables";
import { TIMETABLE_TEACHER_ALIASES } from "@/lib/timetableTeacherAliases";

export type MobileTransportInfo = {
  routeNo: string;
  pickupPoint: string;
  vehicleNo?: string;
  inchargeNumber: string;
  driverName: string;
  driverNumber: string;
  destinationAddress: string;
  captainName: string;
  trackingLink: string;
};

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

function attendanceFromDetail(detail: BranchStudentDetail): AttendanceBucket {
  return asRecord(detail.attendance) as AttendanceBucket;
}

function statusForDate(attendance: AttendanceBucket, date: string): "present" | "absent" | "late" | "unmarked" {
  if (attendance.absentDates?.includes(date)) return "absent";
  if (attendance.lateDates?.includes(date)) return "late";
  if (attendance.presentDates?.includes(date)) return "present";
  return "unmarked";
}

/**
 * Attendance % over days actually marked for this student's class
 * (present + half credit for late). Null when nothing has been marked yet,
 * so the UI can show "—" instead of a misleading 0%.
 */
function classAttendancePercent(attendance: AttendanceBucket): number | null {
  const present = attendance.presentDates?.length ?? 0;
  const absent = attendance.absentDates?.length ?? 0;
  const late = attendance.lateDates?.length ?? 0;
  const marked = present + absent + late;
  if (marked === 0) return null;
  return Math.round(((present + late * 0.5) / marked) * 100);
}

export async function loadStudentDetailForAuth(
  admin: SupabaseClient<any>,
  params: { schoolSlug: string; authId: string; email: string | null; academicYear?: string | null }
): Promise<BranchStudentDetail | null> {
  const session = await resolveStudentSessionContext({
    admin,
    authId: params.authId,
    email: params.email,
    schoolSlug: params.schoolSlug,
  });
  if (!session) return null;
  return loadBranchStudentById(admin, params.schoolSlug, session.recordId, params.academicYear);
}

export async function loadSchoolUuid(admin: SupabaseClient<any>, schoolSlug: string): Promise<string | null> {
  return getSchoolUuidFromSlug(schoolSlug);
}

function pickTransportField(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text && text !== "—" && text !== "-" && text.toLowerCase() !== "n/a") return text;
  }
  return "";
}

function studentUsesTransport(td: Record<string, unknown>, detail: BranchStudentDetail): boolean {
  const facility = String(td.facility ?? "").trim().toUpperCase();
  if (facility === "YES") return true;
  if (facility === "NO") return false;
  return Boolean(
    pickTransportField(td.busNo, td.route, td.stoppage, td.driverName, td.driverMobile, detail.busNo, detail.route),
  );
}

export function buildStudentTransportInfo(
  detail: BranchStudentDetail,
  schoolSlug: string,
  fleetBuses: TransportBusRecord[] = [],
): MobileTransportInfo | undefined {
  const td = asRecord(detail.transportDetails);
  if (!studentUsesTransport(td, detail)) return undefined;

  let routeNo = pickTransportField(td.route, td.routeCode, td.routeName, detail.route);
  let vehicleNo = pickTransportField(td.busNo, td.bus_no, td.vehicleNo, detail.busNo);
  const pickupPoint = pickTransportField(td.stoppage, td.pickupPoint, td.pickup, detail.stoppage);
  let driverName = pickTransportField(td.driverName, td.driver_name, detail.driverName);
  let driverNumber = pickTransportField(
    td.driverMobile,
    td.driver_mobile,
    td.driverPhone,
    td.inchargeMobile,
    detail.driverMobile,
  );

  if (fleetBuses.length) {
    const matchedBus =
      fleetBuses.find((bus) => bus.busNo && bus.busNo === vehicleNo) ??
      fleetBuses.find((bus) => bus.route && bus.route === routeNo);
    if (matchedBus) {
      if (!routeNo) routeNo = matchedBus.route;
      if (!vehicleNo) vehicleNo = matchedBus.busNo;
    }
  }

  const branch = getSchoolBranch(schoolSlug);
  const destinationAddress =
    pickTransportField(td.destination, td.schoolAddress, td.schoolDestination) ||
    (branch ? `${branch.name}, ${branch.city}, ${branch.state}` : schoolSlug);

  return {
    routeNo: routeNo || "Not assigned",
    pickupPoint: pickupPoint || "Not assigned",
    vehicleNo: vehicleNo || undefined,
    inchargeNumber: driverNumber || "—",
    driverName: driverName || "Not assigned",
    driverNumber: driverNumber || "—",
    destinationAddress,
    captainName: pickTransportField(td.captainName, td.captain, td.busCaptain) || "—",
    trackingLink: pickTransportField(td.trackingLink, td.trackingUrl, td.gpsLink) || "",
  };
}

export function mapStudentProfileUser(
  detail: BranchStudentDetail,
  schoolSlug: string,
  fleetBuses: TransportBusRecord[] = [],
) {
  const transport = buildStudentTransportInfo(detail, schoolSlug, fleetBuses);
  const hostel = buildStudentHostelInfo(detail);
  return {
    id: String(detail.id),
    name: String(detail.name ?? detail.studentName ?? ""),
    email: String(detail.loginEmail ?? detail.username ?? ""),
    studentId: String(detail.admissionNo ?? detail.admission_number ?? ""),
    grade: String(detail.grade ?? detail.classId ?? ""),
    rollNumber: String(detail.rollNumber ?? detail.admissionNo ?? ""),
    className:
      detail.className && detail.section
        ? `${detail.className}-${detail.section}`
        : detail.grade && detail.section
          ? `${detail.grade}-${detail.section}`
          : String(detail.classId ?? detail.grade ?? ""),
    section: String(detail.section ?? ""),
    schoolName: schoolSlug,
    avatar: resolveStudentPhotoUrl(detail as Record<string, unknown>),
    phone: String(detail.mobileNumber ?? detail.fatherMobile1 ?? ""),
    address: String(detail.address ?? detail.permAddress ?? ""),
    gender: String(detail.gender ?? ""),
    dob: String(detail.dob ?? ""),
    bloodGroup: String(detail.bloodGroup ?? ""),
    parentName: String(detail.fatherName ?? detail.parentName ?? ""),
    parentPhone: String(detail.fatherMobile1 ?? detail.parentPhone ?? ""),
    academicYear: String(detail.academicYear ?? "").trim() || undefined,
    transport,
    hostel: hostel ?? undefined,
  };
}

function buildStudentHostelInfo(detail: BranchStudentDetail) {
  if (!studentIsHostelBoarder(detail)) return null;
  const hostel = asRecord(detail.hostelDetails);
  return {
    block: pickTransportField(hostel.block) || "—",
    roomNo: pickTransportField(hostel.roomNo, hostel.room) || "—",
    bedNo: pickTransportField(hostel.bedNo, hostel.bed) || "—",
    wardenName: pickTransportField(hostel.wardenName, hostel.warden, hostel.inchargeName) || "Hostel Warden",
    wardenPhone:
      pickTransportField(hostel.wardenPhone, hostel.wardenMobile, hostel.phone, hostel.inchargePhone) || "—",
    messTimings: pickTransportField(hostel.messTimings, hostel.mess, hostel.messTiming) || undefined,
  };
}

export async function buildStudentDashboard(
  detail: BranchStudentDetail,
  homeworkCount: number,
  schoolSlug: string,
  admin?: SupabaseClient<any>,
  options?: { announcementCount?: number },
) {
  const attendance = attendanceFromDetail(detail);
  const yearRange = academicYearAprMarRange(
    detail.academicYear != null ? String(detail.academicYear) : null,
  );
  const stats = calculateAttendanceStats(
    attendance.presentDates ?? [],
    attendance.absentDates ?? [],
    attendance.lateDates ?? [],
    yearRange.start,
    yearRange.end,
  );

  let feesDue = 0;
  if (admin) {
    try {
      const fees = await buildStudentFees(detail, schoolSlug, admin);
      feesDue = fees.dueAmount;
    } catch {
      feesDue = 0;
    }
  } else {
    const feeDetails = asRecord(detail.feeDetails);
    const feeGrid = Array.isArray(feeDetails.feeGrid) ? feeDetails.feeGrid : [];
    const gridTotal = feeGrid.reduce((sum, row) => {
      const values = asRecord(row).values;
      if (!Array.isArray(values)) return sum;
      return sum + values.reduce((acc, value) => acc + (Number(value) || 0), 0);
    }, 0);
    const lastYearDue = Number(feeDetails.lastYearDue ?? 0) || 0;
    const paidAmount = Number(feeDetails.paidAmount ?? feeDetails.feePaid ?? 0) || 0;
    feesDue = Math.max(gridTotal + lastYearDue - paidAmount, 0);
  }

  let classesToday = 0;
  let nextClass = "";
  if (admin) {
    try {
      const { loadStudentClassTimetablePeriods } = await import("@/lib/loadBranchTimetables");
      const periods = await loadStudentClassTimetablePeriods(
        admin,
        schoolSlug,
        String(detail.grade ?? detail.classId ?? ""),
        String(detail.section ?? ""),
        detail.academicYear != null ? String(detail.academicYear) : null,
      );
      const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const todayPeriods = periods
        .filter((row) => row.day_of_week === weekday)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      classesToday = todayPeriods.length;
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      const parseHm = (value: string) => {
        const [h, m] = String(value ?? "")
          .split(":")
          .map((part) => Number(part));
        if (!Number.isFinite(h)) return -1;
        return h * 60 + (Number.isFinite(m) ? m : 0);
      };
      const current = todayPeriods.find((row) => {
        const start = parseHm(row.start_time);
        const end = parseHm(row.end_time || row.start_time);
        return start >= 0 && nowMinutes >= start && nowMinutes < end;
      });
      const upcoming = todayPeriods.find((row) => parseHm(row.start_time) > nowMinutes);
      const pick = current ?? upcoming ?? todayPeriods[0];
      if (pick) {
        const label = pick.subject_name;
        const time = pick.start_time ? ` · ${pick.start_time}` : "";
        nextClass = current ? `${label} (now)` : `${label}${time}`;
      }
    } catch {
      // Timetable optional for dashboard.
    }
  }

  let gpa = 0;
  if (admin) {
    try {
      const marks = await buildStudentMarks(detail, admin, schoolSlug);
      gpa = Number(marks.overview.gpa) || 0;
    } catch {
      gpa = 0;
    }
  }

  return {
    studentName: String(detail.name ?? "").split(" ")[0] || "Student",
    schoolName: schoolSlug,
    attendancePercent: stats.percentage,
    attendanceStatus: stats.percentage >= 85 ? "Good standing" : stats.percentage > 0 ? "Needs improvement" : "No records yet",
    classesToday,
    nextClass,
    gpa,
    feesDue,
    notificationCount: Math.max(0, Number(options?.announcementCount ?? 0) || 0) + Math.max(0, homeworkCount),
    announcements: [] as Array<Record<string, unknown>>,
  };
}

export function buildStudentAttendance(detail: BranchStudentDetail) {
  const attendance = attendanceFromDetail(detail);
  const yearRange = academicYearAprMarRange(
    detail.academicYear != null ? String(detail.academicYear) : null,
  );
  const stats = calculateAttendanceStats(
    attendance.presentDates ?? [],
    attendance.absentDates ?? [],
    attendance.lateDates ?? [],
    yearRange.start,
    yearRange.end,
  );

  const records = [
    ...(attendance.presentDates ?? []).map((date) => ({
      id: `p-${date}`,
      date,
      status: "present" as const,
      remarks: "",
    })),
    ...(attendance.absentDates ?? []).map((date) => ({
      id: `a-${date}`,
      date,
      status: "absent" as const,
      remarks: "",
    })),
    ...(attendance.lateDates ?? []).map((date) => ({
      id: `l-${date}`,
      date,
      status: "late" as const,
      remarks: "",
    })),
  ]
    .filter((row) => {
      const date = String(row.date ?? "").slice(0, 10);
      return date >= yearRange.start && date <= yearRange.end;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const markedTotal = stats.presentDays + stats.absentDays + stats.lateDays;
  const classLabel =
    detail.className && detail.section
      ? `${detail.className}-${detail.section}`
      : detail.grade && detail.section
        ? `${detail.grade}-${detail.section}`
        : String(detail.classId ?? detail.grade ?? "");

  return {
    summary: {
      overallPercent: stats.percentage,
      target: 85,
      present: stats.presentDays,
      absent: stats.absentDays,
      late: stats.lateDays,
      leave: 0,
      month: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
      className: classLabel,
    },
    subjects:
      markedTotal > 0
        ? [
            {
              subject: "Overall",
              percent: stats.percentage,
              present: stats.presentDays,
              total: markedTotal,
            },
          ]
        : ([] as Array<{ subject: string; percent: number; present: number; total: number }>),
    records,
  };
}

type StudentMarkSubject = {
  id: string;
  name: string;
  marks: number;
  maxMarks: number;
  grade: string;
  teacher: string;
};

type StudentExamMarkRow = {
  exam: string;
  subject: string;
  marks: number;
  maxMarks: number;
  grade: string;
  absent?: boolean;
};

type MarksTermKey = "term1" | "term2" | "term3" | "annual";

function subjectIdFromName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-") || "subject";
}

function gradeFromPercent(totalPercent: number) {
  if (totalPercent >= 90) return "A+";
  if (totalPercent >= 80) return "A";
  if (totalPercent >= 70) return "B";
  if (totalPercent > 0) return "C";
  return "—";
}

function gpaFromPercent(totalPercent: number) {
  return Math.round((totalPercent / 25) * 10) / 10;
}

function percentFromSubjects(subjects: StudentMarkSubject[]) {
  const scored = subjects.filter((row) => row.maxMarks > 0);
  if (scored.length === 0) return 0;
  return Math.round(
    scored.reduce((sum, row) => sum + (row.marks / row.maxMarks) * 100, 0) / scored.length
  );
}

/** Map school exam labels (PT1, MA TERM1, SE2, …) into UI term buckets. */
function examToTermKey(exam: string): MarksTermKey {
  const compact = String(exam ?? "")
    .replace(/[\s_-]+/g, "")
    .toUpperCase();
  if (!compact) return "annual";
  if (/(FINAL|ANNUAL|YEAREND)/.test(compact)) return "annual";
  if (/TERM?4|PT4|PPT4|NB4|MA4|SE4|PA4/.test(compact)) return "annual";
  if (/TERM?3|PT3|PPT3|NB3|MA3|SE3|PA3/.test(compact)) return "term3";
  if (/TERM?2|PT2|PPT2|NB2|MA2|SE2|PA2/.test(compact)) return "term2";
  if (/TERM?1|PT1|PPT1|NB1|MA1|SE1|PA1/.test(compact)) return "term1";
  return "annual";
}

function aggregateSubjects(rows: StudentExamMarkRow[]): StudentMarkSubject[] {
  const bySubject = new Map<
    string,
    { id: string; name: string; marks: number; maxMarks: number; grade: string; teacher: string; count: number }
  >();

  for (const row of rows) {
    if (row.absent || row.marks == null || Number.isNaN(Number(row.marks))) continue;
    const subjectName = String(row.subject ?? "").trim() || "Subject";
    const key = subjectName.toUpperCase();
    const maxMarks = Number(row.maxMarks) > 0 ? Number(row.maxMarks) : 100;
    const marks = Number(row.marks) || 0;
    const current = bySubject.get(key) ?? {
      id: subjectIdFromName(subjectName),
      name: subjectName,
      marks: 0,
      maxMarks: 0,
      grade: "",
      teacher: "",
      count: 0,
    };
    current.marks += marks;
    current.maxMarks += maxMarks;
    current.count += 1;
    if (row.grade) current.grade = row.grade;
    bySubject.set(key, current);
  }

  return Array.from(bySubject.values()).map((row) => ({
    id: row.id,
    name: row.name,
    marks: row.count > 0 ? Math.round(row.marks / row.count) : 0,
    maxMarks: row.count > 0 ? Math.round(row.maxMarks / row.count) : 100,
    grade: row.grade,
    teacher: row.teacher,
  }));
}

function termOverviewFromSubjects(subjects: StudentMarkSubject[]) {
  const totalPercent = percentFromSubjects(subjects);
  return {
    gpa: gpaFromPercent(totalPercent),
    grade: gradeFromPercent(totalPercent),
    rank: "—" as const,
    totalPercent,
    subjects: subjects.map((row) => ({
      id: row.id,
      subject: row.name,
      score: row.marks,
      maxScore: row.maxMarks,
      grade: row.grade || gradeFromPercent(
        row.maxMarks > 0 ? Math.round((row.marks / row.maxMarks) * 100) : 0
      ),
      icon: "book",
    })),
  };
}

function extractExamRowsFromProfile(detail: BranchStudentDetail): StudentExamMarkRow[] {
  const yearName = detail.academicYear != null ? String(detail.academicYear) : "";
  const yearEnrollment = asRecord(
    (asRecord(detail.enrollments)[yearName] as Record<string, unknown>) ?? {}
  );
  const rawMarks =
    yearEnrollment.examMarks ??
    detail.examMarks ??
    detail.marks ??
    detail.reportCard ??
    detail.marksData;

  const rows: StudentExamMarkRow[] = [];
  if (Array.isArray(rawMarks)) {
    for (const entry of rawMarks) {
      const row = asRecord(entry);
      if (row.absent) continue;
      const subject = String(row.subject ?? row.name ?? "").trim();
      if (!subject) continue;
      const marksRaw = row.marks ?? row.marksObtained ?? row.score;
      if (marksRaw == null || marksRaw === "") continue;
      rows.push({
        exam: String(row.exam ?? row.examName ?? row.test ?? "Overall"),
        subject,
        marks: Number(marksRaw) || 0,
        maxMarks: Number(row.maxMarks ?? row.total ?? 100) || 100,
        grade: String(row.grade ?? row.gradeLabel ?? ""),
        absent: Boolean(row.absent),
      });
    }
  } else if (rawMarks && typeof rawMarks === "object") {
    for (const [name, value] of Object.entries(asRecord(rawMarks))) {
      const row = asRecord(value);
      const marksRaw = row.marks ?? row.marksObtained ?? value;
      if (marksRaw == null || marksRaw === "") continue;
      rows.push({
        exam: String(row.exam ?? "Overall"),
        subject: name,
        marks: Number(marksRaw) || 0,
        maxMarks: Number(row.maxMarks ?? 100) || 100,
        grade: String(row.grade ?? ""),
      });
    }
  }
  return rows;
}

function normalizeMarksClassToken(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^CLASS\s+/i, "")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s+/g, " ");
}

function finalizeStudentMarksFromExamRows(
  detail: BranchStudentDetail,
  examRows: StudentExamMarkRow[],
) {
  const overallSubjects = aggregateSubjects(examRows);
  const byTerm: Record<MarksTermKey, StudentExamMarkRow[]> = {
    term1: [],
    term2: [],
    term3: [],
    annual: [],
  };
  const byExam = new Map<string, StudentExamMarkRow[]>();
  for (const row of examRows) {
    byTerm[examToTermKey(row.exam)].push(row);
    const examName = String(row.exam ?? "Overall").trim() || "Overall";
    const list = byExam.get(examName) ?? [];
    list.push(row);
    byExam.set(examName, list);
  }

  const term1 = termOverviewFromSubjects(aggregateSubjects(byTerm.term1));
  const term2 = termOverviewFromSubjects(aggregateSubjects(byTerm.term2));
  const term3 = termOverviewFromSubjects(aggregateSubjects(byTerm.term3));
  const annualSubjects = aggregateSubjects(byTerm.annual);
  const annual =
    annualSubjects.length > 0
      ? termOverviewFromSubjects(annualSubjects)
      : termOverviewFromSubjects(overallSubjects);

  const overviewBase = termOverviewFromSubjects(overallSubjects);

  const exams = [...byExam.entries()]
    .map(([name, rows]) => {
      const bucket = termOverviewFromSubjects(aggregateSubjects(rows));
      return {
        id: subjectIdFromName(name),
        name,
        ...bucket,
      };
    })
    .sort((a, b) => compareExamNames(a.name, b.name));

  return {
    overview: {
      ...overviewBase,
      lastUpdated: String(detail.updatedAt ?? ""),
      teacherInCharge: "",
      exams,
      terms: {
        term1,
        term2,
        term3,
        annual,
      },
    },
    subjects: overallSubjects,
  };
}

/** Rough chronological / syllabus order for common IDPS exam codes. */
function compareExamNames(a: string, b: string): number {
  const rank = (name: string) => {
    const c = name.replace(/[\s_-]+/g, "").toUpperCase();
    const patterns: Array<[RegExp, number]> = [
      [/PPT1|NB1|MA1|PA1|SE1|PT1|TERM1|^T1$/, 10],
      [/PPT2|NB2|MA2|PA2|SE2|PT2|TERM2|^T2$/, 20],
      [/PPT3|NB3|MA3|PA3|SE3|PT3|TERM3|^T3$/, 30],
      [/PPT4|NB4|MA4|PA4|SE4|PT4|TERM4|^T4$/, 40],
      [/FINAL|ANNUAL/, 90],
    ];
    for (const [re, score] of patterns) {
      if (re.test(c)) {
        // Prefer MA < PPT < NB < SE < PA within the same term band when possible.
        if (c.startsWith("MA")) return score;
        if (c.startsWith("PPT") || c.startsWith("PT")) return score + 1;
        if (c.startsWith("NB")) return score + 2;
        if (c.startsWith("SE")) return score + 3;
        if (c.startsWith("PA")) return score + 4;
        return score + 5;
      }
    }
    return 50;
  };
  const diff = rank(a) - rank(b);
  return diff !== 0 ? diff : a.localeCompare(b);
}

function buildStudentMarksFromProfile(detail: BranchStudentDetail) {
  return finalizeStudentMarksFromExamRows(detail, extractExamRowsFromProfile(detail));
}

function finalizeStudentMarks(
  detail: BranchStudentDetail,
  subjects: StudentMarkSubject[],
) {
  // Legacy path: subjects without exam labels → treat as overall/annual only.
  return finalizeStudentMarksFromExamRows(
    detail,
    subjects.map((row) => ({
      exam: "Overall",
      subject: row.name,
      marks: row.marks,
      maxMarks: row.maxMarks,
      grade: row.grade,
    })),
  );
}

export async function buildStudentMarks(
  detail: BranchStudentDetail,
  admin?: SupabaseClient<any>,
  schoolSlug?: string,
) {
  const profileRows = extractExamRowsFromProfile(detail);

  if (!admin || !schoolSlug) {
    return finalizeStudentMarksFromExamRows(detail, profileRows);
  }

  try {
    const { loadBranchMarks } = await import("@/lib/loadBranchMarks");
    const marksDocs = await loadBranchMarks(
      admin,
      schoolSlug,
      detail.academicYear != null ? String(detail.academicYear) : null,
    );
    const grade = normalizeMarksClassToken(detail.grade ?? detail.classId ?? "");
    const section = normalizeMarksClassToken(detail.section ?? "");
    const studentId = String(detail.id ?? "");
    const admissionNo = String(detail.admissionNo ?? detail.admission_number ?? "").trim();

    const branchRows: StudentExamMarkRow[] = [];
    for (const doc of marksDocs) {
      const docGrade = normalizeMarksClassToken(doc.grade);
      const docSection = normalizeMarksClassToken(doc.section);
      if (grade && docGrade && docGrade !== grade) continue;
      if (section && docSection && docSection !== section) continue;

      const row = doc.rows.find((entry) => {
        const entryId = String(entry.studentId ?? "");
        const entryAdm = String(entry.admissionNo ?? entry.roll ?? "").trim();
        return (
          (studentId && entryId === studentId) ||
          (admissionNo && entryAdm && entryAdm === admissionNo)
        );
      });
      if (!row || row.absent || row.marks == null) continue;

      branchRows.push({
        exam: String(doc.exam ?? "Overall"),
        subject: String(doc.subject ?? "Subject").trim() || "Subject",
        marks: Number(row.marks) || 0,
        maxMarks: Number(row.maxMarks ?? doc.maxMarks ?? 100) || 100,
        grade: String(row.gradeLabel ?? ""),
      });
    }

    // Prefer notice-store marks docs when present; otherwise profile examMarks.
    const rows = branchRows.length > 0 ? branchRows : profileRows;
    return finalizeStudentMarksFromExamRows(detail, rows);
  } catch (err) {
    console.error("[buildStudentMarks] loadBranchMarks failed", err);
    return finalizeStudentMarksFromExamRows(detail, profileRows);
  }
}

function normalizeClassToken(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^CLASS\s+/i, "")
    .replace(/\s+/g, " ");
}

/** Subjects for the student's class — timetable catalog, then marks, then homework subjects. */
export async function buildStudentSubjects(
  detail: BranchStudentDetail,
  schoolSlug: string,
  admin: SupabaseClient<any>,
) {
  const grade = String(detail.grade ?? detail.classId ?? detail.className ?? "").trim();
  const section = String(detail.section ?? "").trim();
  const academicYear = detail.academicYear != null ? String(detail.academicYear) : null;
  const wantGrade = normalizeClassToken(grade);
  const wantSection = normalizeClassToken(section);

  const byKey = new Map<
    string,
    { id: string; name: string; teacher: string; description: string; weeklyPeriods: number }
  >();

  const addSubject = (input: {
    id?: string;
    name: string;
    teacher?: string;
    description?: string;
    weeklyPeriods?: number;
  }) => {
    const name = String(input.name ?? "").trim();
    if (!name || /^(break|lunch|assembly|free)$/i.test(name)) return;
    const key = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    if (!key) return;
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.teacher && input.teacher) existing.teacher = String(input.teacher).trim();
      if (!existing.weeklyPeriods && input.weeklyPeriods) {
        existing.weeklyPeriods = Number(input.weeklyPeriods) || 0;
      }
      return;
    }
    byKey.set(key, {
      id: String(input.id ?? key.toLowerCase()),
      name,
      teacher: String(input.teacher ?? "").trim(),
      description: String(input.description ?? "").trim(),
      weeklyPeriods: Number(input.weeklyPeriods ?? 0) || 0,
    });
  };

  // 1) Branch subjects catalog for this class/year (built from timetable when available).
  try {
    const { loadBranchSubjects } = await import("@/lib/loadBranchSubjects");
    const { subjectDisplayName } = await import("@/lib/subjectStore");
    const all = await loadBranchSubjects(admin, schoolSlug, academicYear);
    for (const row of all) {
      const rowGrade = normalizeClassToken(row.classId);
      const rowSection = normalizeClassToken(row.section);
      if (wantGrade && rowGrade && rowGrade !== wantGrade) continue;
      if (wantSection && rowSection && rowSection !== wantSection) continue;
      addSubject({
        id: row.id,
        name: subjectDisplayName(row.name) || row.name,
        teacher: row.teacherName || row.teachers[0] || "",
        description: row.description,
        weeklyPeriods: row.weeklyPeriods,
      });
    }
  } catch (err) {
    console.error("[buildStudentSubjects] loadBranchSubjects failed", err);
  }

  // 2) Class timetable cells (covers missing catalog rows).
  try {
    const { loadStudentClassTimetablePeriods } = await import("@/lib/loadBranchTimetables");
    const { subjectDisplayName } = await import("@/lib/subjectStore");
    const periods = await loadStudentClassTimetablePeriods(
      admin,
      schoolSlug,
      grade,
      section,
      academicYear,
    );
    for (const period of periods) {
      addSubject({
        id: period.subject_name.toLowerCase().replace(/\s+/g, "-"),
        name: subjectDisplayName(period.subject_name) || period.subject_name,
        teacher: period.teacher_name,
      });
    }
  } catch (err) {
    console.error("[buildStudentSubjects] timetable failed", err);
  }

  // 3) Marks subjects as last resort.
  if (byKey.size === 0) {
    try {
      const marks = await buildStudentMarks(detail, admin, schoolSlug);
      for (const row of marks.subjects) {
        addSubject({
          id: row.id,
          name: row.name,
          teacher: row.teacher,
        });
      }
    } catch {
      // optional
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export async function buildStudentFees(
  detail: BranchStudentDetail,
  schoolSlug?: string,
  admin?: SupabaseClient<any>,
) {
  let feeDetails = asRecord(detail.feeDetails);

  // Prefer class / hydrated fee grid when the student record has no structure saved.
  if (schoolSlug && admin) {
    try {
      const hydrated = await hydrateStudentFeeDetailsWithAdmin(
        admin,
        detail as Record<string, unknown>,
        schoolSlug,
        String(detail.academicYear ?? "").trim() || null,
      );
      if (hasFeeGridData(hydrated.feeGrid)) {
        feeDetails = {
          ...feeDetails,
          ...hydrated,
          category: String(feeDetails.category ?? hydrated.feeCategory ?? "GENERAL"),
          status: String(feeDetails.status ?? hydrated.feeStatus ?? hydrated.paymentStatus ?? ""),
          discountRemarks: String(
            feeDetails.discountRemarks ?? hydrated.discRemark ?? feeDetails.remarks ?? "",
          ),
          lastYearDue: feeDetails.lastYearDue ?? hydrated.lastYearDue ?? 0,
          paidAmount:
            Number(feeDetails.paidAmount ?? 0) ||
            Number(hydrated.feePaid ?? 0) ||
            0,
        };
      }
    } catch (err) {
      console.error("[buildStudentFees] hydrate failed", err);
    }
  }

  const feeGrid = Array.isArray(feeDetails.feeGrid) ? feeDetails.feeGrid : [];
  const structure = feeGrid
    .map((row, index) => {
      const item = asRecord(row);
      const values = Array.isArray(item.values) ? item.values : [];
      const amount = values.reduce((sum, value) => sum + (Number(value) || 0), 0);
      return {
        label: String(item.particular ?? item.name ?? `Fee ${index + 1}`),
        amount,
      };
    })
    .filter((row) => row.amount > 0);

  const gridTotal = structure.reduce((sum, item) => sum + item.amount, 0);
  const lastYearDue = Number(feeDetails.lastYearDue ?? 0) || 0;
  const totalFees = Math.max(gridTotal + lastYearDue, 0);

  const transactions = extractFeeTransactions(
    { feeDetails: { ...asRecord(detail.feeDetails), ...feeDetails } } as Record<string, unknown>,
    {
      id: detail.id ? String(detail.id) : undefined,
      admissionNo: detail.admissionNo ? String(detail.admissionNo) : undefined,
      name: detail.name ? String(detail.name) : undefined,
    },
  );
  const paidFromTransactions = transactions.reduce((sum, row) => sum + row.amount, 0);
  const paidAmount = Number(feeDetails.paidAmount ?? 0) || paidFromTransactions;
  const dueAmount = Math.max(totalFees - paidAmount, 0);

  const recentPayments = transactions
    .map((tx) => ({
      id: tx.id,
      period: tx.month || tx.particular || "Fee payment",
      paidOn: tx.dateDisplay || tx.date || "—",
      amount: tx.amount,
      status:
        tx.status?.toLowerCase() === "pending"
          ? ("pending" as const)
          : tx.status?.toLowerCase() === "failed"
            ? ("failed" as const)
            : ("success" as const),
      transactionId: tx.reference || undefined,
      receiptNumber: tx.receiptNo || undefined,
      method: tx.mode || undefined,
      dateTime: tx.time ? `${tx.date} ${tx.time}` : tx.date,
    }))
    .sort((a, b) => String(b.paidOn).localeCompare(String(a.paidOn)));

  const dueDate = String(feeDetails.dueDate ?? feeDetails.nextDueDate ?? "Contact school");

  return {
    totalFees,
    paidAmount,
    dueAmount,
    dueDate,
    category: String(feeDetails.category ?? feeDetails.feeCategory ?? "GENERAL"),
    feeStatus: String(feeDetails.status ?? feeDetails.feeStatus ?? feeDetails.paymentStatus ?? ""),
    lastYearDue,
    discountRemarks: String(feeDetails.discountRemarks ?? feeDetails.discRemark ?? ""),
    structure,
    recentPayments,
  };
}

/** Staff/management student profile — mirrors admin overview sections without sensitive IDs. */
export async function buildStaffStudentDetail(
  detail: BranchStudentDetail,
  schoolSlug: string,
  admin?: SupabaseClient<any>,
) {
  const str = (...values: unknown[]) => {
    for (const value of values) {
      const text = String(value ?? "").trim();
      if (text && text !== "—" && text.toLowerCase() !== "n/a") return text;
    }
    return "";
  };
  const fees = await buildStudentFees(detail, schoolSlug, admin);
  const attendance = buildStudentAttendance(detail);
  const marks = await buildStudentMarks(detail, admin, schoolSlug);
  const transport = buildStudentTransportInfo(detail, schoolSlug) ?? null;
  const className = str(detail.grade, detail.classId, (detail as Record<string, unknown>).className);
  const section = str(detail.section);

  return {
    id: str(detail.id),
    name: str(detail.name, detail.studentName) || "Student",
    className,
    section,
    admissionNo: str(detail.admissionNo, detail.admission_number),
    roll: str(detail.rollNumber, detail.admissionNo, detail.admission_number),
    status: detail.status === "Inactive" ? "Inactive" : "Active",
    photoUrl: resolveStudentPhotoUrl(detail as Record<string, unknown>) || "",
    academicYear: str(detail.academicYear),
    dob: str(detail.dob),
    gender: str(detail.gender),
    bloodGroup: str(detail.bloodGroup),
    studentType: str(detail.studentType),
    house: str(detail.house),
    stream: str(detail.stream),
    medium: str(detail.medium),
    address: str(detail.address, detail.permAddress),
    city: str(detail.permCity, detail.city),
    state: str(detail.permState, detail.state),
    email: str(detail.contactEmail, detail.email),
    fatherName: str(detail.fatherName, detail.parentName),
    fatherPhone: str(detail.fatherMobile1, detail.parentPhone, detail.mobileNumber),
    motherName: str(detail.motherName),
    motherPhone: str(detail.motherMobile1),
    guardianName: str(detail.guardianName),
    guardianPhone: str(detail.guardianMobile1),
    fees: {
      category: fees.category || "GENERAL",
      feeStatus: fees.feeStatus || "—",
      lastYearDue: fees.lastYearDue,
      discountRemarks: fees.discountRemarks,
      totalFees: fees.totalFees,
      paidAmount: fees.paidAmount,
      dueAmount: fees.dueAmount,
      dueDate: fees.dueDate,
      structure: fees.structure,
      recentPayments: fees.recentPayments.slice(0, 40),
    },
    attendance: {
      percent: attendance.summary.overallPercent,
      present: attendance.summary.present,
      absent: attendance.summary.absent,
      late: attendance.summary.late,
      records: attendance.records.slice(0, 90),
    },
    transport,
    hostel: buildStaffHostelInfo(detail, fees),
    marks: {
      totalPercent: marks.overview.totalPercent,
      grade: marks.overview.grade,
      subjects: (marks.subjects ?? []).slice(0, 30).map((row, index) => ({
        id: String(row.id ?? index),
        name: String(row.name ?? `Subject ${index + 1}`),
        marks: Number(row.marks ?? 0),
        maxMarks: Number(row.maxMarks ?? 100),
        grade: String(row.grade ?? ""),
        percent: Math.round(
          (Number(row.marks ?? 0) / Math.max(Number(row.maxMarks ?? 100), 1)) * 100,
        ),
      })),
    },
    schoolSlug,
  };
}

export async function recordBranchStudentFeePayment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  input: {
    studentId: string;
    amount: number;
    mode: string;
    feeMonth?: string;
    remark?: string;
    transactionId?: string;
    academicYear?: string | null;
    collectedByName?: string;
    collectedById?: string;
  },
) {
  const studentId = String(input.studentId ?? "").trim();
  const amount = Math.round(Number(input.amount) || 0);
  if (!studentId) throw new Error("Student id required");
  if (amount <= 0) throw new Error("Enter a valid amount");

  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const academicYear =
    String(input.academicYear ?? "").trim() ||
    (await currentAcademicYearName(admin, schoolSlug)) ||
    undefined;
  const detail = await loadBranchStudentById(admin, schoolSlug, studentId, academicYear);
  if (!detail) throw new Error("Student not found");

  const existingPayments = await loadBranchFeePayments(admin, schoolSlug, {
    academicYear,
    studentId,
    admissionNo: String(detail.admissionNo ?? ""),
    limit: 500,
  });
  const receiptNo = nextReceiptNo(
    existingPayments.map((row) => ({
      id: row.id,
      receiptNo: row.receiptNo,
      month: row.month,
      date: row.date,
      amount: row.amount,
      mode: row.mode,
      fine: 0,
      status: row.status,
    })),
  );
  const payId = `RCP-${receiptNo}`;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const feeMonth =
    String(input.feeMonth ?? "").trim() ||
    monthLabelFromIndex(now.getMonth());
  const mode = String(input.mode ?? "Cash").trim() || "Cash";
  const transactionId = String(input.transactionId ?? "").trim();
  const remark = String(input.remark ?? "").trim();
  const studentName = String(detail.name ?? detail.studentName ?? "Student").trim();
  const admissionNo = String(detail.admissionNo ?? "").trim();

  const payment: BranchFeePaymentRecord = {
    id: payId,
    receiptNo,
    studentId,
    studentName,
    admissionNo,
    amount,
    mode,
    feeMonth,
    month: feeMonth,
    date: today,
    dateDisplay: now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    time,
    status: "Completed",
    remark: remark || undefined,
    collectedByName: String(input.collectedByName ?? "Staff").trim() || "Staff",
    reference: input.collectedById ? String(input.collectedById) : undefined,
    particular: "Fee payment",
    academicYear,
    transNo: transactionId || undefined,
    transactionId: transactionId || undefined,
    createdAt: now.toISOString(),
  };

  await upsertBranchFeePayment(admin, schoolSlug, payment);

  const profile = await loadStudentProfileData(admin, branchId, studentId);
  const feeDetails = asRecord(profile.feeDetails ?? detail.feeDetails);
  const existingTx = Array.isArray(feeDetails.feeTransactions) ? feeDetails.feeTransactions : [];
  const previousPaid =
    Number(feeDetails.paidAmount ?? feeDetails.paid ?? feeDetails.feePaid ?? 0) || 0;
  const paidAmount = previousPaid + amount;

  const txRow = {
    id: payId,
    receiptNo,
    amount,
    mode,
    feeMonth,
    month: feeMonth,
    date: today,
    dateDisplay: payment.dateDisplay,
    time,
    status: "Completed",
    remark: remark || undefined,
    transactionId: transactionId || undefined,
    transNo: transactionId || undefined,
    collectedByName: payment.collectedByName,
    academicYear,
    particular: "Fee payment",
    createdAt: payment.createdAt,
  };

  await saveStudentProfileData(admin, branchId, studentId, {
    ...profile,
    feeDetails: {
      ...feeDetails,
      feeTransactions: [txRow, ...existingTx],
      paidAmount,
      paid: paidAmount,
      feePaid: paidAmount,
    },
  });

  const refreshed = await loadBranchStudentById(admin, schoolSlug, studentId, academicYear);
  if (!refreshed) throw new Error("Could not reload student after payment");

  return {
    payment,
    student: await buildStaffStudentDetail(refreshed, schoolSlug, admin),
  };
}

function studentIsHostelBoarder(detail: BranchStudentDetail): boolean {
  const typeKey = String(detail.studentType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (
    typeKey === "boarder" ||
    typeKey === "hostel" ||
    typeKey.includes("boarder") ||
    typeKey.includes("hostel")
  ) {
    return true;
  }
  const hostel = asRecord(detail.hostelDetails);
  return Boolean(
    pickTransportField(hostel.roomNo, hostel.room, hostel.block, hostel.bedNo, hostel.bed),
  );
}

function hostelFeeStatus(total: number, paid: number): 'Paid' | 'Partial' | 'Pending' {
  if (total <= 0) return 'Pending';
  if (paid <= 0) return 'Pending';
  if (paid >= total) return 'Paid';
  return 'Partial';
}

function sumStructureByKeywords(
  structure: Array<{ label: string; amount: number }>,
  keywords: string[],
): number {
  return structure.reduce((sum, row) => {
    const name = row.label.toUpperCase();
    if (!keywords.some((keyword) => name.includes(keyword))) return sum;
    return sum + row.amount;
  }, 0);
}

function buildStaffHostelInfo(
  detail: BranchStudentDetail,
  fees?: Awaited<ReturnType<typeof buildStudentFees>>,
) {
  if (!studentIsHostelBoarder(detail)) return null;
  const hostel = asRecord(detail.hostelDetails);
  const feeDetails = asRecord(detail.feeDetails);
  const structure = fees?.structure ?? [];

  const sumFee = (keywords: string[]) => {
    const fromStructure = sumStructureByKeywords(structure, keywords);
    if (fromStructure > 0) return fromStructure;

    const feeGrid = Array.isArray(feeDetails.feeGrid) ? feeDetails.feeGrid : [];
    return feeGrid.reduce((sum, row) => {
      const item = asRecord(row);
      const name = String(item.particular ?? item.name ?? "").toUpperCase();
      if (!keywords.some((k) => name.includes(k))) return sum;
      const values = Array.isArray(item.values) ? item.values : [];
      return sum + values.reduce((acc, value) => acc + (Number(value) || 0), 0);
    }, 0);
  };

  const hostelFeeTotal = sumFee(["HOSTEL"]);
  const foodFeeTotal = sumFee(["FOOD"]);
  const laundryFeeTotal = sumFee(["LAUNDRY"]);
  const totalDue = hostelFeeTotal + foodFeeTotal + laundryFeeTotal;
  const hostelFeePaid =
    Number(feeDetails.paid ?? feeDetails.paidAmount ?? fees?.paidAmount ?? 0) || 0;
  const pendingDue = Math.max(totalDue - hostelFeePaid, 0);

  return {
    studentType: String(detail.studentType ?? "Hostel").trim() || "Hostel",
    roomNo: pickTransportField(hostel.roomNo, hostel.room) || "—",
    block: pickTransportField(hostel.block) || "—",
    bedNo: pickTransportField(hostel.bedNo, hostel.bed) || "—",
    localNumber: pickTransportField(
      hostel.localNumber,
      hostel.localPhone,
      detail.mobileNumber,
      detail.permMobile,
    ) || "—",
    hostelFeeTotal,
    foodFeeTotal,
    laundryFeeTotal,
    hostelFeePaid,
    totalDue,
    pendingDue,
    feeStatus: hostelFeeStatus(totalDue, hostelFeePaid),
  };
}

function maskAccountNumber(value: string): string {
  const digits = value.replace(/\s+/g, "");
  if (digits.length <= 4) return digits || "—";
  return `${"•".repeat(Math.min(digits.length - 4, 8))}${digits.slice(-4)}`;
}

export async function loadStaffMemberPayrollSlips(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  employeeId: string,
  employeeName?: string,
) {
  const schoolId = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolId) return [];

  const { data, error } = await admin
    .from("payroll")
    .select(
      "id, employee_id_ref, employee_name, role, salary, tds, deductions, net_salary, status, period, created_at",
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return [];

  const empKey = String(employeeId ?? "").trim().toLowerCase();
  const nameKey = String(employeeName ?? "").trim().toLowerCase();
  const rows = (data ?? []).filter((row) => {
    const ref = String(row.employee_id_ref ?? "").trim().toLowerCase();
    const name = String(row.employee_name ?? "").trim().toLowerCase();
    return (empKey && ref === empKey) || (nameKey && name === nameKey);
  });

  return rows.slice(0, 36).map((row) => {
    const salary = Number(row.salary ?? 0);
    const tds = Number(row.tds ?? 0);
    const otherDeductions = Number(row.deductions ?? 0);
    const netSalary = Number(row.net_salary ?? salary - tds - otherDeductions);
    const rawStatus = String(row.status ?? "pending").trim().toLowerCase();
    const status =
      rawStatus === "credited" || rawStatus === "paid" || rawStatus === "processed"
        ? ("credited" as const)
        : ("processing" as const);

    return {
      id: String(row.id),
      month: String(row.period ?? "Payroll period"),
      baseSalary: salary,
      tds,
      otherDeductions,
      deductions: tds + otherDeductions,
      netSalary,
      status,
      creditedDate: status === "credited" ? String(row.created_at ?? "") : undefined,
      createdAt: String(row.created_at ?? ""),
    };
  });
}

export async function loadStaffMemberLeaves(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  employeeId: string,
  employeeName?: string,
) {
  const schoolId = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolId) return [];

  const { data, error } = await admin
    .from("leave_requests")
    .select("id, employee_id_ref, employee_name, leave_type, from_date, to_date, reason, status, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return [];

  const empKey = String(employeeId ?? "").trim().toLowerCase();
  const nameKey = String(employeeName ?? "").trim().toLowerCase();

  return (data ?? [])
    .filter((row) => {
      const ref = String(row.employee_id_ref ?? "").trim().toLowerCase();
      const name = String(row.employee_name ?? "").trim().toLowerCase();
      return (empKey && ref === empKey) || (nameKey && name === nameKey);
    })
    .slice(0, 60)
    .map((row) => ({
      id: String(row.id),
      leaveType: String(row.leave_type ?? "Leave"),
      fromDate: String(row.from_date ?? ""),
      toDate: String(row.to_date ?? ""),
      reason: String(row.reason ?? ""),
      status: String(row.status ?? "pending").trim().toLowerCase(),
      appliedAt: String(row.created_at ?? ""),
    }));
}

/** Management staff profile — Overview + Salary (mirrors student detail, fees → salaries). */
export function buildStaffMemberDetail(
  detail: BranchStaffDetail,
  slips: Awaited<ReturnType<typeof loadStaffMemberPayrollSlips>> = [],
  leaves: Awaited<ReturnType<typeof loadStaffMemberLeaves>> = [],
) {
  const staff = asRecord(detail.staff);
  const profile = asRecord(detail.profile);
  const str = (...values: unknown[]) => {
    for (const value of values) {
      const text = String(value ?? "").trim();
      if (text && text !== "—" && text.toLowerCase() !== "n/a") return text;
    }
    return "";
  };

  const kind = detail.staffKind;
  const department = str(staff.department, profile.department) || "General";
  const category =
    kind === "teaching"
      ? "Teaching"
      : department.toLowerCase().includes("admin")
        ? "Admin"
        : department.toLowerCase().includes("support")
          ? "Support"
          : "Non-Teaching";

  const baseMonthly =
    Number(staff.baseSalaryMonthlyInr ?? profile.baseSalaryMonthlyInr ?? staff.baseSalary ?? profile.baseSalary ?? 0) ||
    Number(slips[0]?.baseSalary ?? 0) ||
    0;

  const credited = slips.filter((s) => s.status === "credited");
  const latestNet = slips[0]?.netSalary ?? baseMonthly;

  const bankName = str(profile.bankName, staff.bankName);
  const accountNumber = str(profile.accountNumber, staff.accountNumber, profile.bankAccount);
  const ifscCode = str(profile.ifscCode, staff.ifscCode, profile.ifsc);
  const bank =
    bankName || accountNumber || ifscCode
      ? {
          bankName: bankName || "—",
          accountNumber: accountNumber ? maskAccountNumber(accountNumber) : "—",
          ifscCode: ifscCode || "—",
        }
      : null;

  const subjectsRaw = staff.subjects;
  const subjects = Array.isArray(subjectsRaw)
    ? subjectsRaw.map((s) => String(s).trim()).filter(Boolean)
    : str(staff.subject, staff.subjects)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    id: str(staff.id),
    name: str(staff.name) || "Staff",
    role: str(staff.designation, staff.role) || "Staff",
    department,
    category,
    empId: str(staff.employeeId, staff.employee_id, staff.empCode, staff.id),
    phone: str(staff.phone, staff.mobile),
    email: str(staff.email),
    photoUrl: str(staff.photoUrl, profile.photoUrl, profile.photo_url, profile.avatarUrl),
    status: str(staff.status) || "Active",
    joined: str(staff.joiningDate, staff.joinDate, staff.joined),
    employmentType: str(staff.employmentType, profile.employmentStatus) || "Full-Time",
    qualification: str(
      staff.qualification,
      Array.isArray(staff.qualifications) ? staff.qualifications[0] : "",
      profile.qualification,
    ),
    gender: str(staff.gender, profile.gender),
    dob: str(staff.dob, profile.dob),
    bloodGroup: str(staff.bloodGroup, profile.bloodGroup),
    subjects,
    classes: str(staff.classes),
    classTeacher: str(staff.classTeacher, profile.classTeacher),
    academicYear: str(staff.academicYear),
    staffKind: kind,
    salary: {
      baseMonthly,
      latestNet,
      creditedCount: credited.length,
      slips,
    },
    leaves: {
      total: leaves.length,
      approved: leaves.filter((leave) => leave.status.includes("approv")).length,
      pending: leaves.filter((leave) => leave.status.includes("pend")).length,
      rejected: leaves.filter((leave) => leave.status.includes("reject")).length,
      records: leaves,
    },
    bank,
    teachingLoads: teachingLoadsFromYearProfile(detail.profile),
    emergencyPerson: str(staff.emergencyPerson, profile.emergencyPerson),
    emergencyContact: str(staff.emergencyContact, profile.emergencyContact),
  };
}

export async function loadHomeworkForSchool(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  filters?: { grade?: string; section?: string; includeDrafts?: boolean }
) {
  const code = getSchoolCodeFromSlug(schoolSlug);
  if (!code) return [];

  const { data: school } = await admin.from("schools").select("id").eq("code", code).maybeSingle();
  if (!school?.id) return [];

  const grade = String(filters?.grade ?? "").trim();
  const section = String(filters?.section ?? "").trim();

  let query = admin
    .from("homework")
    .select(
      "id, title, subject, subject_name, grade, section, due_date, assigned_date, status, description, instructions, school_id, teacher_id"
    )
    .eq("school_id", school.id)
    .order("assigned_date", { ascending: false })
    .limit(100);

  if (!filters?.includeDrafts) query = query.neq("status", "draft");
  if (grade) query = query.eq("grade", grade);
  if (section) query = query.eq("section", section);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function loadBranchEvents(admin: SupabaseClient<any>, schoolSlug: string) {
  const schoolId = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolId) return [];

  const { data } = await admin
    .from("events")
    .select("id, title, event_type, event_date, created_at")
    .eq("school_id", schoolId)
    .order("event_date", { ascending: true });

  return (data ?? []).map((row) => {
    const eventDate = String(row.event_date ?? "").slice(0, 10);
    return {
      ...row,
      event_date: eventDate || row.event_date,
      event_type: String(row.event_type ?? "event"),
      title: String(row.title ?? "").trim() || "Untitled",
    };
  });
}

export async function loadBranchTimetable(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  teacherName?: string | null,
  academicYear?: string | null,
  dayFilter?: string | null
) {
  const { loadTeacherTimetablePeriods } = await import("@/lib/loadBranchTimetables");
  if (!teacherName?.trim()) return [];
  return loadTeacherTimetablePeriods(admin, schoolSlug, teacherName, academicYear, dayFilter);
}

type AnnouncementContent = {
  body: string;
  priority?: string;
  category?: string;
  contentType?: string;
  homeworkId?: string;
  classKey?: string;
  className?: string;
  grade?: string;
  section?: string;
  subject?: string;
  teacherName?: string;
  teacherId?: string;
  linkUrl?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaType?: string;
  postedAt?: string;
};

function parseAnnouncementContent(content: unknown): AnnouncementContent {
  const raw = String(content ?? "");
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.body != null) {
      const record = parsed as Record<string, unknown>;
      return {
        body: String(record.body ?? ""),
        priority: record.priority ? String(record.priority) : undefined,
        category: record.category ? String(record.category) : undefined,
        contentType: record.contentType ? String(record.contentType) : undefined,
        homeworkId: record.homeworkId ? String(record.homeworkId) : undefined,
        classKey: record.classKey ? String(record.classKey) : undefined,
        className: record.className ? String(record.className) : undefined,
        grade: record.grade ? String(record.grade) : undefined,
        section: record.section ? String(record.section) : undefined,
        subject: record.subject ? String(record.subject) : undefined,
        teacherName: record.teacherName ? String(record.teacherName) : undefined,
        teacherId: record.teacherId ? String(record.teacherId) : undefined,
        linkUrl: record.linkUrl ? String(record.linkUrl) : undefined,
        mediaUrl: record.mediaUrl ? String(record.mediaUrl) : undefined,
        mediaName: record.mediaName ? String(record.mediaName) : undefined,
        mediaType: record.mediaType ? String(record.mediaType) : undefined,
        postedAt: record.postedAt ? String(record.postedAt) : undefined,
      };
    }
  } catch {
    // plain text
  }
  return { body: raw };
}

export async function loadBranchAnnouncements(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  options?: { limit?: number }
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const { data } = await admin
    .from("notices")
    .select("id, title, content, posted_on, target")
    .eq("branch_id", branchId)
    .neq("target", "system")
    .order("posted_on", { ascending: false })
    .limit(Math.max(1, Math.min(options?.limit ?? 100, 200)));

  return (data ?? [])
    .filter((row) => !String(row.title ?? "").startsWith("__"))
    .map((row) => {
      const parsed = parseAnnouncementContent(row.content);
      return {
        ...row,
        ...parsed,
        content: parsed.body,
      };
    });
}

function notificationRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Real teacher alerts: pending attendance + school announcements (no mock rows). */
export async function loadTeacherNotifications(
  admin: SupabaseClient<any>,
  params: {
    schoolSlug: string;
    authId: string;
    email: string | null;
    role: string | null;
    academicYear?: string | null;
  }
) {
  const { schoolSlug, authId, email, role, academicYear } = params;
  const teacherName = await resolveTeacherTimetableName(
    admin,
    schoolSlug,
    authId,
    email,
    academicYear
  );

  const [announcements, classes, periods] = await Promise.all([
    loadBranchAnnouncements(admin, schoolSlug),
    loadTeacherClasses(admin, schoolSlug, authId, email, role, academicYear, {
      includeStudents: false,
    }),
    loadBranchTimetable(admin, schoolSlug, teacherName, academicYear),
  ]);

  const { classKeysDueForAttendance } = await import("@/lib/teacherTimetableUtils");
  const dueKeys = classKeysDueForAttendance(periods);

  const attendanceAlerts = classes
    .filter((row) => dueKeys.has(row.id))
    .map((row) => ({
      id: `attendance-${row.id}`,
      title: `Attendance pending · ${String(row.name).replace(/^CLASS\s+/i, "")}`,
      body: "Mark attendance for this class from your timetable period.",
      type: "urgent" as const,
      timestamp: notificationRelativeTime(new Date().toISOString()),
      read: false,
    }));

  const announcementAlerts = announcements.slice(0, 30).map((row) => ({
    id: `ann-${row.id}`,
    title: String(row.title ?? "Announcement"),
    body: String(row.content ?? "").slice(0, 180),
    type: "academic" as const,
    timestamp: notificationRelativeTime(String(row.posted_on ?? "")),
    read: false,
  }));

  return [...attendanceAlerts, ...announcementAlerts];
}

export async function loadTeacherScopedStudents(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  authId: string,
  email: string | null,
  role: string | null,
  academicYear?: string | null
) {
  let scope = await resolveStaffDataScope(admin, { schoolSlug, authId, email, role });
  const rows = await loadBranchStudents(admin, schoolSlug, academicYear);
  const { filterStudentsByStaffScope } = await import("@/lib/resolveStaffDataScope");

  // Profile/schema often lack classLoads; fall back to timetable classes (same as My Classes UI).
  if (scope.mode === "none" || (scope.mode === "class" && scope.classKeys.length === 0)) {
    const teacherName = await resolveTeacherTimetableName(
      admin,
      schoolSlug,
      authId,
      email,
      academicYear
    );
    const periods = await loadBranchTimetable(admin, schoolSlug, teacherName, academicYear);
    const { parseClassFromSubject } = await import("@/lib/teacherTimetableUtils");
    const keys = new Set<string>();
    for (const period of periods) {
      if ((period as { isBreak?: boolean }).isBreak) continue;
      const parsed = parseClassFromSubject(String((period as { subject_name?: string }).subject_name ?? ""));
      if (!parsed) continue;
      keys.add(classScopeKey(parsed.grade, parsed.section));
    }
    if (keys.size) {
      scope = {
        ...scope,
        mode: "class",
        classKeys: Array.from(keys),
      };
    }
  }

  return filterStudentsByStaffScope(
    rows.map((row) => ({
      ...row,
      classId: row.className,
      grade: row.className,
    })),
    scope
  );
}

export async function loadTeacherClasses(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  authId: string,
  email: string | null,
  role: string | null,
  academicYear?: string | null,
  options?: { includeStudents?: boolean }
) {
  const includeStudents = options?.includeStudents !== false;
  const students = await loadTeacherScopedStudents(admin, schoolSlug, authId, email, role, academicYear);
  const today = new Date().toISOString().slice(0, 10);
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  // Skip branch-wide profile scan when the client only needs class meta/counts.
  const profiles =
    includeStudents && branchId
      ? await loadAllStudentProfiles(admin, branchId)
      : new Map<string, StudentProfileData>();

  type ClassBucket = {
    id: string;
    name: string;
    grade: string;
    section: string;
    students: Array<{
      id: string;
      name: string;
      rollNo: string;
      className: string;
      avatarUrl: string;
      attendancePercent: number | null;
    }>;
    markedCount: number;
    studentCount: number;
  };

  const classMap = new Map<string, ClassBucket>();

  for (const row of students) {
    const key = classScopeKey(row.className, row.section);
    let bucket = classMap.get(key);
    if (!bucket) {
      bucket = {
        id: key,
        name: `${row.className}-${row.section}`,
        grade: row.className,
        section: row.section,
        students: [],
        markedCount: 0,
        studentCount: 0,
      };
      classMap.set(key, bucket);
    }

    bucket.studentCount += 1;

    if (!includeStudents) continue;

    const profile = profiles.get(String(row.id)) ?? {};
    const profileRecord = profile as Record<string, unknown>;
    const attendance = attendanceFromDetail(profileRecord as BranchStudentDetail);
    const dayStatus = statusForDate(attendance, today);
    bucket.students.push({
      id: row.id,
      name: row.name,
      rollNo: String(row.roll || row.admissionNo || "—"),
      className: `${row.className}-${row.section}`,
      avatarUrl: resolveStudentPhotoUrl(profileRecord),
      attendancePercent: classAttendancePercent(attendance),
    });
    if (dayStatus !== "unmarked") bucket.markedCount += 1;
  }

  return Array.from(classMap.values()).map((bucket) => ({
    id: bucket.id,
    name: bucket.name,
    grade: bucket.grade,
    section: bucket.section,
    studentCount: includeStudents ? bucket.students.length : bucket.studentCount,
    attendanceStatus:
      includeStudents &&
      bucket.students.length > 0 &&
      bucket.markedCount === bucket.students.length
        ? ("completed" as const)
        : ("pending" as const),
    students: includeStudents
      ? bucket.students.sort((a, b) => a.name.localeCompare(b.name))
      : [],
  }));
}

export type TeacherStudentPageRow = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  classKey: string;
  avatarUrl: string;
  attendancePercent: number | null;
  parentName?: string;
  parentPhone?: string;
};

export async function loadTeacherStudentsPage(
  admin: SupabaseClient<any>,
  params: {
    schoolSlug: string;
    authId: string;
    email: string | null;
    role: string | null;
    academicYear?: string | null;
    classKey?: string | null;
    q?: string | null;
    page?: number | null;
    limit?: number | null;
  }
) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));
  const classKey = params.classKey?.trim() || null;
  const query = String(params.q ?? "")
    .trim()
    .toLowerCase();

  const scoped = await loadTeacherScopedStudents(
    admin,
    params.schoolSlug,
    params.authId,
    params.email,
    params.role,
    params.academicYear
  );

  let filtered = scoped.map((row) => ({
    ...row,
    classKey: classScopeKey(row.className, row.section),
    classLabel: `${row.className}-${row.section}`,
  }));

  if (classKey) {
    filtered = filtered.filter((row) => row.classKey === classKey);
  }

  if (query) {
    filtered = filtered.filter((row) => {
      const name = String(row.name ?? "").toLowerCase();
      const roll = String(row.roll ?? row.admissionNo ?? "").toLowerCase();
      return name.includes(query) || roll.includes(query);
    });
  }

  filtered.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const total = filtered.length;
  const start = (page - 1) * limit;
  const pageRows = filtered.slice(start, start + limit);

  const branchId = await resolveBranchUuid(admin, params.schoolSlug);
  const { loadStudentProfilesByIds } = await import("@/lib/studentProfileStore");
  const profiles = branchId
    ? await loadStudentProfilesByIds(
        admin,
        branchId,
        pageRows.map((row) => String(row.id))
      )
    : new Map<string, StudentProfileData>();

  const pickParentText = (...values: unknown[]) => {
    for (const value of values) {
      const text = String(value ?? "").trim();
      if (text && text !== "—" && text.toLowerCase() !== "n/a") return text;
    }
    return "";
  };

  const students: TeacherStudentPageRow[] = pageRows.map((row) => {
    const profile = profiles.get(String(row.id)) ?? {};
    const profileRecord = profile as Record<string, unknown>;
    const attendance = attendanceFromDetail(profileRecord as BranchStudentDetail);
    const enrollment = asRecord(
      asRecord(profileRecord.enrollments)[String(params.academicYear ?? "")] ?? {}
    );
    // Prefer enrollment/profile, but skip empty/"—" so students.parent_name|phone still win.
    const parentName = pickParentText(
      enrollment.fatherName,
      profileRecord.fatherName,
      row.fatherName
    );
    const parentPhone = pickParentText(
      enrollment.fatherMobile1,
      enrollment.mobileNumber,
      profileRecord.fatherMobile1,
      profileRecord.mobileNumber,
      row.parentPhone
    );
    return {
      id: String(row.id),
      name: String(row.name ?? "Unnamed"),
      rollNo: String(row.roll || row.admissionNo || "—"),
      className: row.classLabel,
      classKey: row.classKey,
      avatarUrl: resolveStudentPhotoUrl(profileRecord),
      attendancePercent: classAttendancePercent(attendance),
      parentName: parentName || undefined,
      parentPhone: parentPhone || undefined,
    };
  });

  return {
    students,
    page,
    limit,
    total,
    hasMore: start + students.length < total,
  };
}

export type TeacherStudentDetailPayload = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  classKey: string;
  avatarUrl: string;
  attendancePercent: number | null;
  avgMarks: number | null;
  parentName: string;
  parentPhone: string;
  motherName?: string;
  address?: string;
  gender?: string;
  dob?: string;
  attendanceRecords: Array<{
    id: string;
    date: string;
    status: "present" | "absent" | "late";
  }>;
  marks: Array<{
    id: string;
    exam: string;
    subject: string;
    marks: number | null;
    maxMarks: number;
    gradeLabel?: string;
    absent?: boolean;
  }>;
};

export async function loadTeacherStudentDetail(
  admin: SupabaseClient<any>,
  params: {
    schoolSlug: string;
    authId: string;
    email: string | null;
    role: string | null;
    studentId: string;
    academicYear?: string | null;
  }
): Promise<TeacherStudentDetailPayload | null> {
  const scoped = await loadTeacherScopedStudents(
    admin,
    params.schoolSlug,
    params.authId,
    params.email,
    params.role,
    params.academicYear
  );
  const scopedRow = scoped.find((row) => String(row.id) === String(params.studentId));
  if (!scopedRow) return null;

  const { loadBranchStudentById } = await import("@/lib/loadBranchStudents");
  const detail = await loadBranchStudentById(
    admin,
    params.schoolSlug,
    params.studentId,
    params.academicYear
  );
  if (!detail) return null;

  const profileRecord = detail as Record<string, unknown>;
  const attendance = attendanceFromDetail(detail);
  const attendancePercent = classAttendancePercent(attendance);

  const attendanceRecords = [
    ...(attendance.presentDates ?? []).map((date) => ({
      id: `p-${date}`,
      date,
      status: "present" as const,
    })),
    ...(attendance.absentDates ?? []).map((date) => ({
      id: `a-${date}`,
      date,
      status: "absent" as const,
    })),
    ...(attendance.lateDates ?? []).map((date) => ({
      id: `l-${date}`,
      date,
      status: "late" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const grade = String(detail.className ?? detail.grade ?? scopedRow.className ?? "").trim();
  const section = String(detail.section ?? scopedRow.section ?? "").trim();
  const classKey = classScopeKey(grade, section);

  // Prefer subjects this teacher teaches for the student's class.
  let teacherSubjects = new Set<string>();
  try {
    const { loadTeacherProfileForPortal } = await import("@/lib/loadTeacherProfile");
    const profile = await loadTeacherProfileForPortal(
      admin,
      params.schoolSlug,
      params.authId,
      params.email,
      "",
      null,
      null,
      params.academicYear
    );
    const classLabel = `${grade}-${section}`.toUpperCase();
    for (const load of profile.teachingLoads ?? []) {
      const loadClass = String(load.classSection ?? "")
        .replace(/^CLASS\s+/i, "")
        .trim()
        .toUpperCase();
      if (!loadClass) continue;
      if (
        loadClass === classLabel ||
        loadClass === `${grade} · ${section}`.toUpperCase() ||
        loadClass.includes(classLabel)
      ) {
        const subject = String(load.subject ?? "").trim();
        if (subject && !/^homeroom$/i.test(subject)) teacherSubjects.add(subject.toUpperCase());
      }
    }
  } catch {
    // Fall through — show all class marks when subject scope is unavailable.
  }

  const { loadBranchMarks } = await import("@/lib/loadBranchMarks");
  const marksDocs = await loadBranchMarks(admin, params.schoolSlug, params.academicYear);
  const marks = marksDocs
    .filter((doc) => {
      const docGrade = String(doc.grade ?? "").trim();
      const docSection = String(doc.section ?? "").trim();
      if (docGrade && grade && docGrade.toUpperCase() !== grade.toUpperCase()) return false;
      if (docSection && section && docSection.toUpperCase() !== section.toUpperCase()) return false;
      if (teacherSubjects.size > 0) {
        const subject = String(doc.subject ?? "").trim().toUpperCase();
        if (subject && !teacherSubjects.has(subject)) return false;
      }
      return true;
    })
    .flatMap((doc) => {
      const row = doc.rows.find((entry) => String(entry.studentId) === String(params.studentId));
      if (!row) return [];
      const maxMarks = Number(row.maxMarks ?? doc.maxMarks ?? 100) || 100;
      return [
        {
          id: `${doc.id}-${params.studentId}`,
          exam: String(doc.exam ?? "Exam"),
          subject: String(doc.subject ?? "Subject"),
          marks: row.absent ? null : row.marks == null ? null : Number(row.marks),
          maxMarks,
          gradeLabel: row.gradeLabel ? String(row.gradeLabel) : undefined,
          absent: Boolean(row.absent),
        },
      ];
    })
    .sort((a, b) => a.exam.localeCompare(b.exam) || a.subject.localeCompare(b.subject));

  const scored = marks.filter((row) => row.marks != null && !row.absent) as Array<{
    marks: number;
    maxMarks: number;
  }>;
  const avgMarks =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, row) => sum + (row.marks / Math.max(row.maxMarks, 1)) * 100, 0) /
            scored.length
        )
      : null;

  const pickText = (...values: unknown[]) => {
    for (const value of values) {
      const text = String(value ?? "").trim();
      if (text && text !== "—" && text.toLowerCase() !== "n/a") return text;
    }
    return "";
  };

  // Direct students-table columns as a final fallback (parent_name / parent_phone).
  let tableParentName = "";
  let tableParentPhone = "";
  let tablePhotoUrl = "";
  let tableAddress = "";
  try {
    const branchId = await resolveBranchUuid(admin, params.schoolSlug);
    if (branchId) {
      const { data: studentRow } = await admin
        .from("students")
        .select("parent_name, parent_phone, photo_url, address")
        .eq("id", params.studentId)
        .eq("branch_id", branchId)
        .maybeSingle();
      tableParentName = String(studentRow?.parent_name ?? "").trim();
      tableParentPhone = String(studentRow?.parent_phone ?? "").trim();
      tablePhotoUrl = String(studentRow?.photo_url ?? "").trim();
      tableAddress = String(studentRow?.address ?? "").trim();
    }
  } catch {
    // Keep profile-derived values.
  }

  const parentName = pickText(
    detail.fatherName,
    detail.parentName,
    profileRecord.fatherName,
    profileRecord.parentName,
    profileRecord.parent_name,
    tableParentName,
    scopedRow.fatherName
  );
  const parentPhone = pickText(
    detail.fatherMobile1,
    detail.parentPhone,
    detail.mobileNumber,
    detail.permMobile,
    profileRecord.fatherMobile1,
    profileRecord.mobileNumber,
    profileRecord.permMobile,
    profileRecord.parent_phone,
    tableParentPhone,
    scopedRow.parentPhone
  );

  return {
    id: String(detail.id),
    name: String(detail.name ?? detail.studentName ?? "Unnamed"),
    rollNo: String(detail.rollNumber ?? detail.roll ?? detail.admissionNo ?? "—"),
    className: grade && section ? `${grade}-${section}` : String(detail.classId ?? "—"),
    classKey,
    avatarUrl: resolveStudentPhotoUrl({
      ...profileRecord,
      photo_url: pickText(profileRecord.photo_url, profileRecord.photo, tablePhotoUrl),
      photo: pickText(profileRecord.photo, tablePhotoUrl),
    }),
    attendancePercent,
    avgMarks,
    parentName: parentName || "—",
    parentPhone: parentPhone || "—",
    motherName: pickText(detail.motherName, profileRecord.motherName) || undefined,
    address:
      pickText(
        detail.address,
        detail.permAddress,
        profileRecord.permAddress,
        profileRecord.address,
        tableAddress
      ) || undefined,
    gender: pickText(detail.gender) || undefined,
    dob: pickText(detail.dob) || undefined,
    attendanceRecords,
    marks,
  };
}

export async function loadTeacherAttendanceRoster(
  admin: SupabaseClient<any>,
  params: {
    schoolSlug: string;
    authId: string;
    email: string | null;
    role: string | null;
    classKey?: string | null;
    date?: string | null;
    academicYear?: string | null;
  }
) {
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const students = await loadTeacherScopedStudents(
    admin,
    params.schoolSlug,
    params.authId,
    params.email,
    params.role,
    params.academicYear
  );

  const filtered = params.classKey
    ? students.filter((row) => classScopeKey(row.className, row.section) === params.classKey)
    : students;

  const branchId = await resolveBranchUuid(admin, params.schoolSlug);
  const profiles = branchId ? await loadAllStudentProfiles(admin, branchId) : new Map<string, StudentProfileData>();

  const roster = filtered.map((row) => {
    const profile = profiles.get(String(row.id)) ?? {};
    const profileRecord = profile as Record<string, unknown>;
    const attendance = attendanceFromDetail(profileRecord as BranchStudentDetail);
    const dayStatus = statusForDate(attendance, date);
    return {
      id: row.id,
      name: row.name,
      rollNo: row.roll || row.admissionNo,
      className: `${row.className}-${row.section}`,
      classId: row.className,
      section: row.section,
      avatarUrl: resolveStudentPhotoUrl(profileRecord),
      attendancePercent: classAttendancePercent(attendance),
      status:
        dayStatus === "absent" ? "absent" : dayStatus === "late" ? "late" : ("present" as const),
    };
  });

  return roster;
}

export type TeacherAttendanceHistoryRow = {
  id: string;
  date: string;
  className: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
  synced: boolean;
};

export async function loadTeacherAttendanceHistory(
  admin: SupabaseClient<any>,
  params: {
    schoolSlug: string;
    authId: string;
    email: string | null;
    role: string | null;
    classKey?: string | null;
    academicYear?: string | null;
  }
): Promise<TeacherAttendanceHistoryRow[]> {
  const students = await loadTeacherScopedStudents(
    admin,
    params.schoolSlug,
    params.authId,
    params.email,
    params.role,
    params.academicYear
  );
  const filtered = params.classKey
    ? students.filter((row) => classScopeKey(row.className, row.section) === params.classKey)
    : students;
  const branchId = await resolveBranchUuid(admin, params.schoolSlug);
  const profiles = branchId
    ? await loadAllStudentProfiles(admin, branchId)
    : new Map<string, StudentProfileData>();
  const counts = new Map<
    string,
    { present: number; absent: number; late: number; className: string }
  >();

  for (const student of filtered) {
    const profile = profiles.get(String(student.id)) ?? {};
    const attendance = attendanceFromDetail(profile as BranchStudentDetail);
    const className = `${student.className}-${student.section}`;
    const add = (date: string, status: "present" | "absent" | "late") => {
      const value = String(date ?? "").slice(0, 10);
      if (!value) return;
      const key = params.classKey ? value : `${classScopeKey(student.className, student.section)}|${value}`;
      const row = counts.get(key) ?? { present: 0, absent: 0, late: 0, className };
      row[status] += 1;
      counts.set(key, row);
    };
    for (const date of attendance.presentDates ?? []) add(date, "present");
    for (const date of attendance.absentDates ?? []) add(date, "absent");
    for (const date of attendance.lateDates ?? []) add(date, "late");
  }

  return Array.from(counts.entries())
    .map(([key, row]) => {
      const date = key.includes("|") ? key.slice(key.lastIndexOf("|") + 1) : key;
      const total = row.present + row.absent + row.late;
      return {
        id: `${row.className}-${date}`,
        date,
        className: row.className,
        present: row.present,
        absent: row.absent,
        late: row.late,
        total,
        percentage: total > 0 ? Math.round(((row.present + row.late * 0.5) / total) * 100) : 0,
        synced: true,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.className.localeCompare(b.className));
}

export async function saveTeacherAttendance(
  admin: SupabaseClient<any>,
  params: {
    schoolSlug: string;
    authId: string;
    email: string | null;
    role: string | null;
    date: string;
    records: Array<{ studentId: string; status: "present" | "absent" | "late" }>;
  }
) {
  const branchId = await resolveBranchUuid(admin, params.schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const scope = await resolveStaffDataScope(admin, {
    schoolSlug: params.schoolSlug,
    authId: params.authId,
    email: params.email,
    role: params.role,
  });
  const allowedStudents = await loadTeacherScopedStudents(
    admin,
    params.schoolSlug,
    params.authId,
    params.email,
    params.role
  );
  const allowedIds = new Set(allowedStudents.map((row) => row.id));

  for (const record of params.records) {
    if (!allowedIds.has(record.studentId)) continue;

    const profile = await loadStudentProfileData(admin, branchId, record.studentId);
    const attendance = attendanceFromDetail(profile as BranchStudentDetail);
    const presentDates = (attendance.presentDates ?? []).filter((value) => value !== params.date);
    const absentDates = (attendance.absentDates ?? []).filter((value) => value !== params.date);
    const lateDates = (attendance.lateDates ?? []).filter((value) => value !== params.date);

    if (record.status === "present") presentDates.push(params.date);
    if (record.status === "absent") absentDates.push(params.date);
    if (record.status === "late") lateDates.push(params.date);

    const nextProfile: StudentProfileData = {
      ...profile,
      attendance: {
        ...attendance,
        presentDates,
        absentDates,
        lateDates,
        lastUpdated: new Date().toISOString(),
      },
    };
    await saveStudentProfileData(admin, branchId, record.studentId, nextProfile);
  }

  return { success: true, scopeMode: scope.mode };
}

export async function loadTeacherLeaves(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  authId: string
) {
  const schoolId = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolId) return [];

  const staff = await resolveStaffSessionContext({
    admin,
    authId,
    email: null,
    schoolSlug,
  });
  if (!staff) return [];

  const { data } = await admin
    .from("leave_requests")
    .select("*")
    .eq("school_id", schoolId)
    .eq("employee_id_ref", staff.employeeId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function loadStaffOwnPayroll(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  authId: string,
  email: string | null
) {
  const schoolId = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolId) return [];

  const staff = await resolveStaffSessionContext({
    admin,
    authId,
    email,
    schoolSlug,
  });
  if (!staff) return [];

  const { data, error } = await admin
    .from("payroll")
    .select(
      "id, employee_id_ref, employee_name, role, salary, tds, deductions, net_salary, status, period, created_at"
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const identityKeys = new Set(
    [staff.employeeId, staff.recordId, authId]
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean)
  );
  const displayName = staff.displayName.trim().toLowerCase();
  const ownRows = (data ?? []).filter((row) => {
    const employeeRef = String(row.employee_id_ref ?? "").trim().toLowerCase();
    const employeeName = String(row.employee_name ?? "").trim().toLowerCase();
    return (
      identityKeys.has(employeeRef) ||
      (Boolean(displayName) && Boolean(employeeName) && employeeName === displayName)
    );
  });

  return ownRows.slice(0, 60).map((row) => {
    const salary = Number(row.salary ?? 0);
    const tds = Number(row.tds ?? 0);
    const otherDeductions = Number(row.deductions ?? 0);
    const netSalary = Number(row.net_salary ?? salary - tds - otherDeductions);
    const rawStatus = String(row.status ?? "pending").trim().toLowerCase();
    const status =
      rawStatus === "credited" || rawStatus === "paid" || rawStatus === "processed"
        ? "credited"
        : "processing";

    return {
      id: String(row.id),
      employeeId: String(row.employee_id_ref ?? staff.employeeId),
      employeeName: String(row.employee_name ?? staff.displayName),
      role: String(row.role ?? staff.designation),
      month: String(row.period ?? "Payroll period"),
      baseSalary: salary,
      allowances: 0,
      grossSalary: salary,
      tds,
      otherDeductions,
      deductions: tds + otherDeductions,
      netSalary,
      status,
      creditedDate: status === "credited" ? String(row.created_at ?? "") : undefined,
      expectedDate: status === "processing" ? String(row.created_at ?? "") : undefined,
      createdAt: String(row.created_at ?? ""),
    };
  });
}

/** Branch-wide payroll slips for management / HR / accounts. */
export async function loadBranchPayroll(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  limit = 120,
) {
  const schoolId = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolId) return [];

  const { data, error } = await admin
    .from("payroll")
    .select(
      "id, employee_id_ref, employee_name, role, salary, tds, deductions, net_salary, status, period, created_at",
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const salary = Number(row.salary ?? 0);
    const tds = Number(row.tds ?? 0);
    const otherDeductions = Number(row.deductions ?? 0);
    const netSalary = Number(row.net_salary ?? salary - tds - otherDeductions);
    const rawStatus = String(row.status ?? "pending").trim().toLowerCase();
    const status =
      rawStatus === "credited" || rawStatus === "paid" || rawStatus === "processed"
        ? "credited"
        : "processing";

    return {
      id: String(row.id),
      employeeId: String(row.employee_id_ref ?? ""),
      employeeName: String(row.employee_name ?? "Staff"),
      role: String(row.role ?? ""),
      month: String(row.period ?? "Payroll period"),
      baseSalary: salary,
      tds,
      otherDeductions,
      deductions: tds + otherDeductions,
      netSalary,
      status,
      creditedDate: status === "credited" ? String(row.created_at ?? "") : undefined,
      createdAt: String(row.created_at ?? ""),
    };
  });
}

const DEFAULT_LEAVE_QUOTAS: Record<string, { label: string; total: number }> = {
  casual: { label: "Casual Leave", total: 12 },
  sick: { label: "Sick Leave", total: 12 },
  annual: { label: "Annual Leave", total: 24 },
  special: { label: "Special Leave", total: 3 },
  compensatory: { label: "Compensatory Leave", total: 0 },
};

function normalizeLeaveTypeKey(value: unknown): string {
  const raw = String(value ?? "casual")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, " ");
  if (raw.includes("sick")) return "sick";
  if (raw.includes("annual") || raw.includes("earned") || raw.includes("privilege")) return "annual";
  if (raw.includes("special") || raw.includes("maternity") || raw.includes("paternity")) return "special";
  if (raw.includes("comp")) return "compensatory";
  if (raw.includes("casual")) return "casual";
  return raw.split(" ")[0] || "casual";
}

function inclusiveLeaveDays(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate.slice(0, 10)}T00:00:00Z`);
  const to = Date.parse(`${(toDate || fromDate).slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return 0;
  return Math.floor((to - from) / 86_400_000) + 1;
}

export async function loadTeacherLeaveBalance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  authId: string
) {
  const leaves = await loadTeacherLeaves(admin, schoolSlug, authId);
  const usedByType = new Map<string, number>();

  for (const row of leaves) {
    const status = String(row.status ?? "").trim().toLowerCase();
    if (status !== "approved") continue;
    const type = normalizeLeaveTypeKey(row.leave_type ?? row.type);
    const days = inclusiveLeaveDays(
      String(row.from_date ?? row.start_date ?? ""),
      String(row.to_date ?? row.end_date ?? "")
    );
    if (days <= 0) continue;
    usedByType.set(type, (usedByType.get(type) ?? 0) + days);
  }

  return Object.entries(DEFAULT_LEAVE_QUOTAS).map(([type, meta]) => {
    const used = usedByType.get(type) ?? 0;
    const remaining = Math.max(0, meta.total - used);
    return {
      type,
      label: meta.label,
      total: meta.total,
      used,
      remaining,
    };
  });
}

function asDateList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim().slice(0, 10))
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
}

function readAttendanceBucket(source: unknown): {
  presentDates: string[];
  absentDates: string[];
  lateDates: string[];
} {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return { presentDates: [], absentDates: [], lateDates: [] };
  }
  const record = source as Record<string, unknown>;
  return {
    presentDates: asDateList(record.presentDates ?? record.present_dates),
    absentDates: asDateList(record.absentDates ?? record.absent_dates),
    lateDates: asDateList(record.lateDates ?? record.late_dates),
  };
}

export async function loadStaffOwnAttendance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  authId: string,
  email: string | null
) {
  const staff = await resolveStaffSessionContext({
    admin,
    authId,
    email,
    schoolSlug,
  });
  if (!staff) {
    return {
      employeeId: "",
      displayName: "",
      today: new Date().toISOString().slice(0, 10),
      todayStatus: "unmarked" as const,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      percent: 0,
      presentDates: [] as string[],
      absentDates: [] as string[],
      lateDates: [] as string[],
      recent: [] as Array<{ date: string; status: "present" | "absent" | "late" }>,
    };
  }

  const table = staff.staffKind === "teaching" ? "teachers" : "non_teaching_staff";
  const { data: row } = await admin.from(table).select("*").eq("id", staff.recordId).maybeSingle();

  const branchId = await resolveBranchUuid(admin, schoolSlug);
  let profileAttendance: unknown = null;
  if (branchId) {
    const { loadStaffProfileData } = await import("@/lib/loadBranchStaff");
    const profile = await loadStaffProfileData(admin, branchId, staff.recordId);
    profileAttendance = (profile as Record<string, unknown>).attendance;
  }

  const fromRow = readAttendanceBucket((row as Record<string, unknown> | null)?.attendance);
  const fromProfile = readAttendanceBucket(profileAttendance);

  const presentSet = new Set([...fromRow.presentDates, ...fromProfile.presentDates]);
  const absentSet = new Set([...fromRow.absentDates, ...fromProfile.absentDates]);
  const lateSet = new Set([...fromRow.lateDates, ...fromProfile.lateDates]);

  // Prefer explicit present/late over absent when dates collide.
  for (const date of presentSet) {
    absentSet.delete(date);
  }
  for (const date of lateSet) {
    absentSet.delete(date);
    presentSet.delete(date);
  }

  const presentDates = Array.from(presentSet).sort((a, b) => b.localeCompare(a));
  const absentDates = Array.from(absentSet).sort((a, b) => b.localeCompare(a));
  const lateDates = Array.from(lateSet).sort((a, b) => b.localeCompare(a));

  const today = new Date().toISOString().slice(0, 10);
  const todayStatus = lateSet.has(today)
    ? ("late" as const)
    : presentSet.has(today)
      ? ("present" as const)
      : absentSet.has(today)
        ? ("absent" as const)
        : ("unmarked" as const);

  const marked = presentDates.length + absentDates.length + lateDates.length;
  const presentLike = presentDates.length + lateDates.length;
  const percent = marked > 0 ? Math.round((presentLike / marked) * 100) : 0;

  const recent = [
    ...presentDates.map((date) => ({ date, status: "present" as const })),
    ...absentDates.map((date) => ({ date, status: "absent" as const })),
    ...lateDates.map((date) => ({ date, status: "late" as const })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 60);

  return {
    employeeId: staff.employeeId,
    displayName: staff.displayName,
    today,
    todayStatus,
    presentCount: presentDates.length,
    absentCount: absentDates.length,
    lateCount: lateDates.length,
    percent,
    presentDates,
    absentDates,
    lateDates,
    recent,
  };
}

export function buildTeacherDashboard(params: {
  classes: Awaited<ReturnType<typeof loadTeacherClasses>>;
  homework: unknown[];
  announcements: unknown[];
  timetableSnapshot?: TeacherTimetableSnapshot;
  focusClass?: { label: string; absentCount: number };
  upcomingExams?: number;
}) {
  const snapshot = params.timetableSnapshot;
  const focusLabel =
    params.focusClass?.label ??
    snapshot?.currentClassLabel ??
    params.classes[0]?.name?.replace(/^(\d+)-(\w+)$/i, "$1-$2") ??
    "—";

  return {
    classesToday: snapshot?.classesToday ?? 0,
    nextClass: snapshot?.nextClass ?? "—",
    nextClassTime: snapshot?.nextClassTime ?? "",
    currentClassLabel: focusLabel,
    currentClassKey: snapshot?.currentClassKey ?? null,
    inSession: snapshot?.inSession ?? false,
    absentToday: params.focusClass?.absentCount ?? 0,
    assignmentsToReview: params.homework.length,
    avgClassScore: 0,
    unreadAlerts: 0,
    upcomingExams: params.upcomingExams ?? 0,
    announcements: params.announcements.slice(0, 3),
  };
}

export async function resolveTeacherDisplayName(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  authId: string,
  email: string | null
): Promise<string> {
  const staff = await resolveStaffSessionContext({
    admin,
    authId,
    email,
    schoolSlug,
  });

  const { data: userRow } = await admin
    .from("users")
    .select("full_name")
    .eq("id", authId)
    .maybeSingle();

  return String(userRow?.full_name ?? staff?.displayName ?? "").trim();
}

export async function resolveTeacherTimetableName(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  authId: string,
  email: string | null,
  termKey?: string | null
): Promise<string> {
  const { resolveTimetableTermKey } = await import("@/lib/loadBranchTimetables");

  const staff = await resolveStaffSessionContext({
    admin,
    authId,
    email,
    schoolSlug,
  });

  const { data: userRow } = await admin
    .from("users")
    .select("full_name")
    .eq("id", authId)
    .maybeSingle();

  const emailLocal = String(email ?? "")
    .split("@")[0]
    ?.trim()
    .toLowerCase();

  const fullName = String(userRow?.full_name ?? staff?.displayName ?? "").trim();
  const employeeId = String(staff?.employeeId ?? emailLocal ?? "").trim();
  const term = await resolveTimetableTermKey(
    admin,
    schoolSlug,
    termKey ?? (await currentAcademicYearName(admin, schoolSlug))
  );
  const docs = await loadBranchTimetables(admin, schoolSlug, term);
  const timetableTeacherNames = listTeacherNamesFromDocs(docs);

  const resolved = resolveTimetableTeacherLabel({
    fullName,
    employeeId,
    displayName: staff?.displayName ?? fullName,
    timetableTeacherNames,
    aliases: TIMETABLE_TEACHER_ALIASES,
  });

  return resolved ?? fullName;
}

export async function currentAcademicYearName(admin: SupabaseClient<any>, schoolSlug: string) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;
  const years = await listBranchAcademicYears(admin, branchId);
  return years.find((year) => year.is_current)?.name ?? years[0]?.name ?? null;
}
