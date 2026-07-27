import { defaultReportCardTemplate } from "@/lib/documentTemplatesStore";
import { gradeForMarks } from "@/lib/marksGrades";

export type Term1ComponentMarks = {
  pa?: number | null;
  se?: number | null;
  ma?: number | null;
  nb?: number | null;
  t1?: number | null;
  total?: number | null;
  maxMarks?: number | null;
  gradeLabel?: string;
  absent?: boolean;
};

export type Term1ScholasticRow = {
  subject: string;
  pa: number | null;
  se: number | null;
  ma: number | null;
  nb: number | null;
  t1: number | null;
  total: number | null;
  grade: string;
};

export type Term1GradeOnlyRow = {
  subject: string;
  grade: string;
};

export type Term1CoScholasticRow = {
  area: string;
  grade: string;
};

export type Term1ReportCardData = {
  schoolName: string;
  schoolSubtitle1: string;
  schoolSubtitle2: string;
  schoolAddress: string;
  affiliationNo: string;
  udiseCode: string;
  academicYear: string;
  termTitle: string;
  studentName: string;
  admissionNo: string;
  fatherName: string;
  motherName: string;
  classSection: string;
  aadharNo: string;
  dateOfBirth: string;
  house: string;
  residentialAddress: string;
  telephoneNo: string;
  scholastic: Term1ScholasticRow[];
  gradeOnlySubjects: Term1GradeOnlyRow[];
  coScholastic: Term1CoScholasticRow[];
  disciplineGrade: string;
  workingDays: number | null;
  daysPresent: number | null;
  remarks: string;
  generatedOn: string;
  schoolLogoUrl?: string;
  boardLogoUrl?: string;
  showSchoolLogo?: boolean;
  showBoardLogo?: boolean;
};

/** Primary (I–V): SOCIAL + EVS + ICT in scholastic — matches official Term-I card. */
export const TERM1_PRIMARY_CORE_SUBJECTS = [
  "ENGLISH",
  "HINDI",
  "TELUGU",
  "MATHEMATICS",
  "SOCIAL",
  "EVS",
  "ICT",
] as const;

/** Middle (VI–X): SCIENCE + SOCIAL + ICT in scholastic. */
export const TERM1_MIDDLE_CORE_SUBJECTS = [
  "ENGLISH",
  "HINDI",
  "TELUGU",
  "MATHEMATICS",
  "SCIENCE",
  "SOCIAL",
  "ICT",
] as const;

/** @deprecated Prefer term1CoreSubjectsForGrade — kept for callers expecting a default list. */
export const TERM1_CORE_SUBJECTS = TERM1_PRIMARY_CORE_SUBJECTS;

export const TERM1_GRADE_ONLY_SUBJECTS = ["GK", "ROBOTICS", "SPACE"] as const;

export const TERM1_CO_SCHOLASTIC_AREAS = [
  "WORK EDUCATION (OR PRE-VOCATIONAL EDUCATION)",
  "ART EDUCATION",
  "HEALTH & PHYSICAL EDUCATION",
  "SWIMMING",
  "MUSIC",
  "DANCE",
] as const;

export const SCHOLASTIC_GRADE_BANDS = [
  { grade: "A1", range: "90.01-100.00" },
  { grade: "A2", range: "80.01-90.00" },
  { grade: "B1", range: "70.01-80.00" },
  { grade: "B2", range: "60.01-70.00" },
  { grade: "C1", range: "50.01-60.00" },
  { grade: "C2", range: "40.01-50.00" },
  { grade: "D", range: "32.91-40.00" },
  { grade: "E1", range: "20.01-32.90" },
  { grade: "E2", range: "0.00-20.00" },
] as const;

/** Official Term-I card: co-scholastic & discipline on 3-point scale. */
export const CO_SCHOLASTIC_GRADE_POINTS = [
  { grade: "A", point: "3" },
  { grade: "B", point: "2" },
  { grade: "C", point: "1" },
] as const;

const SUBJECT_ALIASES: Record<string, string> = {
  ENGLISH: "ENGLISH",
  HINDI: "HINDI",
  TELUGU: "TELUGU",
  MATHEMATICS: "MATHEMATICS",
  MATHS: "MATHEMATICS",
  MATH: "MATHEMATICS",
  EVS: "EVS",
  "ENVIRONMENTAL STUDIES": "EVS",
  GK: "GK",
  "GENERAL KNOWLEDGE": "GK",
  ICT: "ICT",
  COMPUTER: "ICT",
  COMPUTERS: "ICT",
  "COMPUTER SCIENCE": "ICT",
  ROBOTICS: "ROBOTICS",
  "ROBOTICS CODING": "ROBOTICS",
  SPACE: "SPACE",
  "SPACE ASTRONOMY": "SPACE",
  ASTRONOMY: "SPACE",
  SCIENCE: "SCIENCE",
  SOCIAL: "SOCIAL",
  "SOCIAL SCIENCE": "SOCIAL",
  "SOCIAL STUDIES": "SOCIAL",
  SST: "SOCIAL",
};

const ROMAN_GRADE: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
};

export function parseGradeNumber(grade: string): number | null {
  const s = String(grade || "")
    .trim()
    .toUpperCase()
    .replace(/GRADE\s*/g, "");
  const digits = s.match(/\d+/);
  if (digits) {
    const n = Number(digits[0]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const roman = s.match(/^(XII|XI|IX|X|VIII|VII|VI|V|IV|III|II|I)\b/);
  if (roman) return ROMAN_GRADE[roman[1]] ?? null;
  return null;
}

/** Scholastic subject order for Term-I cards (grades I–X). */
export function term1CoreSubjectsForGrade(grade: string): readonly string[] {
  const n = parseGradeNumber(grade);
  if (n != null && n >= 6) return TERM1_MIDDLE_CORE_SUBJECTS;
  return TERM1_PRIMARY_CORE_SUBJECTS;
}

export function normalizeReportSubject(subject: string): string {
  const key = String(subject || "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return SUBJECT_ALIASES[key] || key;
}

export function gradeForTerm1Percent(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return "";
  if (pct >= 90.01) return "A1";
  if (pct >= 80.01) return "A2";
  if (pct >= 70.01) return "B1";
  if (pct >= 60.01) return "B2";
  if (pct >= 50.01) return "C1";
  if (pct >= 40.01) return "C2";
  if (pct >= 32.91) return "D";
  if (pct >= 20.01) return "E1";
  return "E2";
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function parseComponentMarks(row: Record<string, unknown> | null | undefined): Term1ComponentMarks {
  if (!row) return {};
  const components = (row.components as Record<string, unknown> | undefined) || {};
  return {
    pa: numOrNull(row.pa ?? row.PA ?? components.pa ?? components.PA),
    se: numOrNull(row.se ?? row.SE ?? components.se ?? components.SE),
    ma: numOrNull(row.ma ?? row.MA ?? components.ma ?? components.MA),
    nb: numOrNull(row.nb ?? row.NB ?? components.nb ?? components.NB),
    t1: numOrNull(row.t1 ?? row.T1 ?? components.t1 ?? components.T1),
    total: numOrNull(row.total ?? row.TOTAL ?? row.marks),
    maxMarks: numOrNull(row.maxMarks ?? row.max_marks),
    gradeLabel: String(row.gradeLabel ?? row.grade ?? "").trim(),
    absent: Boolean(row.absent),
  };
}

export function toScholasticRow(subject: string, raw: Term1ComponentMarks): Term1ScholasticRow {
  const pa = raw.pa ?? null;
  const se = raw.se ?? null;
  const ma = raw.ma ?? null;
  const nb = raw.nb ?? null;
  let t1 = raw.t1 ?? null;
  let total = raw.total ?? null;
  const maxMarks = raw.maxMarks && raw.maxMarks > 0 ? raw.maxMarks : 100;

  const hasComponents = [pa, se, ma, nb, t1].some((v) => typeof v === "number");
  if (hasComponents) {
    const internals = [pa, se, ma, nb].reduce<number>(
      (sum, v) => sum + (typeof v === "number" ? v : 0),
      0
    );
    const term = typeof t1 === "number" ? t1 : 0;
    if (total == null) total = Math.round((internals + term) * 100) / 100;
  } else if (total != null && maxMarks !== 100) {
    // Imported aggregate (e.g. /50) → scale to TOTAL/100 for the card
    total = Math.round((total / maxMarks) * 1000) / 10;
  }

  let grade = String(raw.gradeLabel || "").trim().toUpperCase();
  if (!grade && typeof total === "number") {
    grade = gradeForTerm1Percent(total);
  }
  if (!grade && typeof total === "number") {
    grade = String(gradeForMarks(total, 100));
  }
  if (raw.absent) grade = "AB";

  return {
    subject,
    pa,
    se,
    ma,
    nb,
    t1,
    total,
    grade,
  };
}

export function formatReportDate(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) {
    // Already human-readable?
    return String(isoOrDate);
  }
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function defaultTerm1SchoolMeta(schoolId?: string) {
  const t = defaultReportCardTemplate(schoolId || "idpscherukupalli");
  return {
    schoolName: t.schoolName,
    schoolSubtitle1: t.schoolSubtitle1,
    schoolSubtitle2: t.schoolSubtitle2,
    schoolAddress: t.schoolAddress,
    affiliationNo: t.affiliationNo,
    udiseCode: t.udiseCode,
    schoolLogoUrl: t.schoolLogoUrl,
    boardLogoUrl: t.boardLogoUrl,
    showSchoolLogo: t.showSchoolLogo,
    showBoardLogo: t.showBoardLogo,
    defaultTermTitle: t.defaultTermTitle,
  };
}

export function sumColumn(rows: Term1ScholasticRow[], key: keyof Term1ScholasticRow): number | null {
  const values = rows
    .map((r) => r[key])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
}

export function columnPercent(
  rows: Term1ScholasticRow[],
  key: keyof Term1ScholasticRow,
  maxPerSubject: number
): number | null {
  const values = rows
    .map((r) => r[key])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!values.length || maxPerSubject <= 0) return null;
  const denom = values.length * maxPerSubject;
  return Math.round((values.reduce((a, b) => a + b, 0) / denom) * 10000) / 100;
}

export function overallGradeFromTotalPercent(pct: number | null): string {
  return gradeForTerm1Percent(pct);
}

export function emptyCoScholastic(): Term1CoScholasticRow[] {
  return TERM1_CO_SCHOLASTIC_AREAS.map((area) => ({ area, grade: "" }));
}

export function emptyGradeOnly(): Term1GradeOnlyRow[] {
  return TERM1_GRADE_ONLY_SUBJECTS.map((subject) => ({ subject, grade: "" }));
}

export function isTerm1GradeOnlySubject(subject: string): boolean {
  const n = normalizeReportSubject(subject);
  return (TERM1_GRADE_ONLY_SUBJECTS as readonly string[]).includes(n);
}

export type ExamComponentSlot = "pa" | "se" | "ma" | "nb" | "t1";

/** Map 2023–24 style exam names (PPT1, SE2, MA3, Term 1, …) → component column + period (1 or 2). */
export function parseExamComponent(examName: string): {
  slot: ExamComponentSlot | null;
  period: 1 | 2 | null;
} {
  const raw = String(examName ?? "").trim();
  const compact = raw.replace(/\s+/g, "").toUpperCase();

  const numSlot = (prefix: string, slot: ExamComponentSlot) => {
    const m = compact.match(new RegExp(`^${prefix}(\\d+)$`));
    if (!m) return null;
    const n = Number(m[1]);
    if (n !== 1 && n !== 2) return null;
    return { slot, period: n as 1 | 2 };
  };

  const ppt = numSlot("PPT", "pa") ?? numSlot("PT", "pa") ?? numSlot("PA", "pa");
  if (ppt) return ppt;

  const se = numSlot("SE", "se");
  if (se) return se;

  const ma = numSlot("MA", "ma");
  if (ma) return ma;

  const nb = numSlot("NB", "nb");
  if (nb) return nb;

  if (/^TERM[-\s]*1$|^T1$|^TERM1$/i.test(compact) || /^TERM\s*1$/i.test(raw)) {
    return { slot: "t1", period: 1 };
  }
  if (/^TERM[-\s]*2$|^T2$|^TERM2$/i.test(compact) || /^TERM\s*2$/i.test(raw)) {
    return { slot: "t1", period: 2 };
  }

  return { slot: null, period: null };
}

function applyComponentMark(
  target: Term1ComponentMarks,
  slot: ExamComponentSlot,
  row: Record<string, unknown>,
  doc: Record<string, unknown>
) {
  const marks = numOrNull(row.marks);
  target[slot] = marks;
  const maxMarks = numOrNull(row.maxMarks ?? doc.maxMarks);
  if (maxMarks != null) target.maxMarks = maxMarks;
  const gradeLabel = String(row.gradeLabel ?? row.grade ?? "").trim();
  if (gradeLabel && slot === "t1") target.gradeLabel = gradeLabel;
  if (row.absent) target.absent = Boolean(row.absent);
}

/**
 * Merge marks docs for a class/section into PA / SE / MA / NB / TERM columns
 * (period 1 = Terminal-I, period 2 = Terminal-II half).
 */
export function collectTermComponentsByStudent(
  marksDocs: Array<
    Record<string, unknown> & {
      exam?: string;
      subject?: string;
      maxMarks?: number | null;
      rows?: Record<string, unknown>[];
    }
  >,
  period: 1 | 2
): Map<string, Map<string, Term1ComponentMarks>> {
  const byStudentSubject = new Map<string, Map<string, Term1ComponentMarks>>();

  for (const doc of marksDocs) {
    const { slot, period: examPeriod } = parseExamComponent(String(doc.exam ?? ""));
    if (!slot || examPeriod !== period) continue;

    const subject = normalizeReportSubject(String(doc.subject ?? ""));

    for (const row of doc.rows ?? []) {
      const studentId = String(row.studentId ?? "").trim();
      if (!studentId) continue;

      if (!byStudentSubject.has(studentId)) byStudentSubject.set(studentId, new Map());
      const subjectMap = byStudentSubject.get(studentId)!;

      if (!subjectMap.has(subject)) subjectMap.set(subject, {});
      applyComponentMark(subjectMap.get(subject)!, slot, row, doc);
    }
  }

  return byStudentSubject;
}
