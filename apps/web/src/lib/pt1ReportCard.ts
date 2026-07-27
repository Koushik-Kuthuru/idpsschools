import { gradeForTerm1Percent, normalizeReportSubject } from "@/lib/term1ReportCard";
import { defaultReportCardTemplate } from "@/lib/documentTemplatesStore";

export type Pt1SubjectRow = {
  subject: string;
  grade: string;
};

export type Pt1ReportCardData = {
  schoolName: string;
  schoolAddress: string;
  affiliationNo: string;
  academicYear: string;
  assessmentTitle: string;
  studentName: string;
  className: string;
  sectionName: string;
  house: string;
  subjects: Pt1SubjectRow[];
  remarks: string;
  generatedOn: string;
  schoolLogoUrl?: string;
  showSchoolLogo?: boolean;
  principalSignatureUrl?: string;
};

export const PT1_DEFAULT_SUBJECTS = [
  "ENGLISH",
  "HINDI",
  "TELUGU",
  "MATHEMATICS",
  "SCIENCE",
  "SOCIAL STUDIES",
  "ICT",
] as const;

export function defaultPt1SchoolMeta(schoolId?: string) {
  const t = defaultReportCardTemplate(schoolId || "idpscherukupalli");
  return {
    schoolName: t.schoolName,
    schoolAddress: t.schoolAddress,
    affiliationNo: t.affiliationNo,
    schoolLogoUrl: t.schoolLogoUrl,
    showSchoolLogo: t.showSchoolLogo,
    assessmentTitle: "PERIODIC ASSESSMENT – I",
  };
}

export function gradeFromMarksRow(row: {
  gradeLabel?: string;
  grade?: string;
  total?: number | null;
  maxMarks?: number | null;
  marks?: number | null;
}): string {
  const label = String(row.gradeLabel || row.grade || "")
    .trim()
    .toUpperCase();
  if (label) return label;
  const total = typeof row.total === "number" ? row.total : typeof row.marks === "number" ? row.marks : null;
  const max = typeof row.maxMarks === "number" && row.maxMarks > 0 ? row.maxMarks : 100;
  if (typeof total === "number") {
    const pct = max === 100 ? total : (total / max) * 100;
    return gradeForTerm1Percent(pct);
  }
  return "";
}

export function buildPt1SubjectRows(
  marksBySubject: Map<string, { gradeLabel?: string; grade?: string; total?: number | null; maxMarks?: number | null }>,
  preferredOrder: readonly string[] = PT1_DEFAULT_SUBJECTS
): Pt1SubjectRow[] {
  const preferredKeys = new Set(preferredOrder.map((s) => normalizeReportSubject(s)));

  const preferred = preferredOrder.map((subject) => {
    const key = normalizeReportSubject(subject);
    const raw =
      marksBySubject.get(key) ||
      (key === "SOCIAL STUDIES" ? marksBySubject.get("SOCIAL") : undefined) ||
      {};
    return {
      subject,
      grade: gradeFromMarksRow(raw),
    };
  });

  const extras = Array.from(marksBySubject.keys())
    .filter((s) => !preferredKeys.has(s))
    .filter((s) => !(preferredKeys.has("SOCIAL STUDIES") && s === "SOCIAL"))
    .filter((s) => !["GK", "ROBOTICS", "ROBOTICS CODING", "SPACE", "SPACE ASTRONOMY"].includes(s))
    .sort((a, b) => a.localeCompare(b))
    .map((subject) => ({
      subject,
      grade: gradeFromMarksRow(marksBySubject.get(subject) || {}),
    }));

  return [...preferred, ...extras];
}
