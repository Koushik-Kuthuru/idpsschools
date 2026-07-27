import {
  CO_SCHOLASTIC_GRADE_POINTS as TERM1_CO_POINTS,
  SCHOLASTIC_GRADE_BANDS,
  defaultTerm1SchoolMeta,
  emptyCoScholastic,
  emptyGradeOnly,
  gradeForTerm1Percent,
  normalizeReportSubject,
  parseComponentMarks,
  toScholasticRow,
  type Term1ComponentMarks,
  type Term1CoScholasticRow,
  type Term1GradeOnlyRow,
  type Term1ScholasticRow,
} from "@/lib/term1ReportCard";

export {
  SCHOLASTIC_GRADE_BANDS,
  normalizeReportSubject,
  parseComponentMarks,
  toScholasticRow,
  gradeForTerm1Percent,
  emptyCoScholastic,
  emptyGradeOnly,
};

export const TERM2_CORE_SUBJECTS = [
  "ENGLISH",
  "HINDI",
  "TELUGU",
  "MATHEMATICS",
  "SOCIAL",
  "EVS",
  "ICT",
] as const;

export const TERM2_GRADE_ONLY_SUBJECTS = ["GK", "ROBOTICS", "SPACE"] as const;

export function emptyTerm2GradeOnly(): Term1GradeOnlyRow[] {
  return TERM2_GRADE_ONLY_SUBJECTS.map((subject) => ({ subject, grade: "" }));
}
export type { Term1ComponentMarks, Term1CoScholasticRow, Term1GradeOnlyRow, Term1ScholasticRow };

/** Term-2 co-scholastic uses A–C on a 3-point scale (per official HTML). */
export const TERM2_CO_SCHOLASTIC_GRADE_POINTS = [
  { grade: "A", point: "3" },
  { grade: "B", point: "2" },
  { grade: "C", point: "1" },
] as const;

export type Term2HalfMarks = {
  pa: number | null;
  se: number | null;
  ma: number | null;
  nb: number | null;
  term: number | null;
  total: number | null;
  grade: string;
};

export type Term2ScholasticRow = {
  subject: string;
  term1: Term2HalfMarks;
  term2: Term2HalfMarks;
  grandTotal: number | null;
  finalGrade: string;
};

export type Term2ReportCardData = {
  schoolName: string;
  schoolSubtitle1: string;
  schoolSubtitle2: string;
  schoolAddress: string;
  affiliationNo: string;
  udiseCode: string;
  academicYear: string;
  profileTitle: string;
  studentName: string;
  admissionNo: string;
  fatherName: string;
  motherName: string;
  classSection: string;
  className: string;
  sectionName: string;
  aadharNo: string;
  dateOfBirth: string;
  house: string;
  residentialAddress: string;
  telephoneNo: string;
  heightCm: string;
  weightKg: string;
  scholastic: Term2ScholasticRow[];
  gradeOnlySubjects: Term1GradeOnlyRow[];
  coScholastic: Term1CoScholasticRow[];
  disciplineGrade: string;
  workingDays: number | null;
  daysPresent: number | null;
  remarks: string;
  generatedOn: string;
  sessionImageUrl?: string;
  schoolLogoUrl?: string;
  boardLogoUrl?: string;
  showSchoolLogo?: boolean;
  showBoardLogo?: boolean;
};

export function defaultTerm2SchoolMeta(schoolId?: string) {
  const base = defaultTerm1SchoolMeta(schoolId);
  return {
    ...base,
    profileTitle: "PERFORMANCE PROFILE",
  };
}

function halfFromScholastic(row: Term1ScholasticRow | null | undefined): Term2HalfMarks {
  if (!row) {
    return { pa: null, se: null, ma: null, nb: null, term: null, total: null, grade: "" };
  }
  return {
    pa: row.pa,
    se: row.se,
    ma: row.ma,
    nb: row.nb,
    term: row.t1,
    total: row.total,
    grade: row.grade,
  };
}

export function mergeTerm2ScholasticRow(
  subject: string,
  term1Raw: Term1ComponentMarks | undefined,
  term2Raw: Term1ComponentMarks | undefined
): Term2ScholasticRow {
  const term1 = halfFromScholastic(toScholasticRow(subject, term1Raw || {}));
  // Term-2 marks may store the written paper as t2 or reuse t1 key
  const t2Adjusted: Term1ComponentMarks = {
    ...(term2Raw || {}),
    t1: term2Raw?.t1 ?? (term2Raw as { t2?: number | null } | undefined)?.t2 ?? null,
  };
  const term2 = halfFromScholastic(toScholasticRow(subject, t2Adjusted));

  let grandTotal: number | null = null;
  if (typeof term1.total === "number" || typeof term2.total === "number") {
    grandTotal =
      Math.round(((term1.total ?? 0) + (term2.total ?? 0)) * 100) / 100;
  }

  let finalGrade = "";
  if (typeof grandTotal === "number") {
    finalGrade = gradeForTerm1Percent(grandTotal / 2);
  }

  return { subject, term1, term2, grandTotal, finalGrade };
}

export function buildTerm2ScholasticRows(
  term1BySubject: Map<string, Term1ComponentMarks>,
  term2BySubject: Map<string, Term1ComponentMarks>,
  preferredOrder: readonly string[]
): Term2ScholasticRow[] {
  const subjects = new Set<string>([
    ...preferredOrder,
    ...term1BySubject.keys(),
    ...term2BySubject.keys(),
  ]);

  const preferred = preferredOrder.map((subject) =>
    mergeTerm2ScholasticRow(subject, term1BySubject.get(subject), term2BySubject.get(subject))
  );

  const extras = Array.from(subjects)
    .filter((s) => !(preferredOrder as readonly string[]).includes(s))
    .filter((s) => !(TERM2_GRADE_ONLY_SUBJECTS as readonly string[]).includes(s as (typeof TERM2_GRADE_ONLY_SUBJECTS)[number]))
    .filter((s) => s !== "ROBOTICS CODING" && s !== "SPACE ASTRONOMY" && s !== "GK")
    .sort((a, b) => a.localeCompare(b))
    .map((subject) =>
      mergeTerm2ScholasticRow(subject, term1BySubject.get(subject), term2BySubject.get(subject))
    );

  return [...preferred, ...extras];
}

export function sumHalfColumn(
  rows: Term2ScholasticRow[],
  half: "term1" | "term2",
  key: keyof Term2HalfMarks
): number | null {
  const values = rows
    .map((r) => r[half][key])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
}

export function halfColumnPercent(
  rows: Term2ScholasticRow[],
  half: "term1" | "term2",
  key: keyof Term2HalfMarks,
  maxPerSubject: number
): number | null {
  const values = rows
    .map((r) => r[half][key])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!values.length || maxPerSubject <= 0) return null;
  const denom = values.length * maxPerSubject;
  return Math.round((values.reduce((a, b) => a + b, 0) / denom) * 10000) / 100;
}

export function sumGrandTotals(rows: Term2ScholasticRow[]): number | null {
  const values = rows
    .map((r) => r.grandTotal)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
}

export function grandTotalPercent(rows: Term2ScholasticRow[]): number | null {
  const values = rows
    .map((r) => r.grandTotal)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!values.length) return null;
  const denom = values.length * 200;
  return Math.round((values.reduce((a, b) => a + b, 0) / denom) * 10000) / 100;
}

/** @deprecated kept so imports that expected 5-point still compile if mixed */
export const CO_SCHOLASTIC_GRADE_POINTS = TERM2_CO_SCHOLASTIC_GRADE_POINTS.length
  ? TERM2_CO_SCHOLASTIC_GRADE_POINTS
  : TERM1_CO_POINTS;
