export type TestScheduleStatus = "upcoming" | "live" | "completed" | "unscheduled";

export type TestResultStats = {
  totalStudents: number;
  markedCount: number;
  passed: number;
  failed: number;
  passPct: number;
  hasMarks: boolean;
};

const PASS_MARKS = 35;

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTestScheduleStatus(
  startDate?: string,
  endDate?: string,
  today: Date = new Date()
): TestScheduleStatus {
  if (!startDate && !endDate) return "unscheduled";
  const start = startDate ? parseDateOnly(startDate) : null;
  const end = endDate ? parseDateOnly(endDate) : start;
  const t = startOfDay(today);
  if (end && t > startOfDay(end)) return "completed";
  if (start && t < startOfDay(start)) return "upcoming";
  return "live";
}

export function statusLabel(status: TestScheduleStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "upcoming":
      return "Upcoming";
    case "completed":
      return "Completed";
    default:
      return "Unscheduled";
  }
}

type StudentRow = { id: string; grade: string; section: string };
type MarksRow = { studentId: string; marks: number | "" };
type MarksDoc = {
  exam: string;
  grade: string;
  section: string;
  subject?: string;
  rows?: MarksRow[];
};

export function computeTestResultStats(
  testName: string,
  classId: string,
  section: string,
  students: StudentRow[],
  marksDocs: MarksDoc[],
  subjectsFilter?: string[]
): TestResultStats {
  const totalStudents = students.filter(
    (s) => s.grade === classId && s.section === section
  ).length;

  const subjectSet =
    subjectsFilter && subjectsFilter.length > 0
      ? new Set(subjectsFilter.map((s) => s.trim()).filter(Boolean))
      : null;

  const relevant = marksDocs.filter((m) => {
    if (
      String(m.exam || "").trim() !== testName ||
      String(m.grade || "").trim() !== classId ||
      String(m.section || "").trim().toUpperCase() !== section
    ) {
      return false;
    }
    if (!subjectSet) return true;
    const subject = String(m.subject || "").trim();
    return subjectSet.has(subject);
  });

  const marksByStudent = new Map<string, number[]>();
  relevant.forEach((doc) => {
    (doc.rows || []).forEach((row) => {
      if (typeof row.marks === "number" && Number.isFinite(row.marks)) {
        const list = marksByStudent.get(row.studentId) ?? [];
        list.push(row.marks);
        marksByStudent.set(row.studentId, list);
      }
    });
  });

  let passed = 0;
  let failed = 0;
  marksByStudent.forEach((marks) => {
    const avg = marks.reduce((sum, m) => sum + m, 0) / marks.length;
    if (avg >= PASS_MARKS) passed += 1;
    else failed += 1;
  });

  const markedCount = passed + failed;
  return {
    totalStudents,
    markedCount,
    passed,
    failed,
    passPct: markedCount > 0 ? Math.round((passed / markedCount) * 100) : 0,
    hasMarks: markedCount > 0,
  };
}

export function statusSortOrder(status: TestScheduleStatus): number {
  switch (status) {
    case "live":
      return 0;
    case "upcoming":
      return 1;
    case "completed":
      return 2;
    default:
      return 3;
  }
}
