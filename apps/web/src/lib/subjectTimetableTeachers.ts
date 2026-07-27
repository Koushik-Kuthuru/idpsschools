import type { TimetableDocData } from "@/lib/timetableStore";
import { parseClassSectionLabel } from "@/lib/teacherTimetableUtils";
import { SUBJECT_DISPLAY_NAMES } from "@/lib/subjectStore";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const SUBJECT_ALIASES: Record<string, string> = {
  MATHS: "MATHEMATICS",
  MATHEMATICS: "MATHEMATICS",
  ENG: "ENGLISH",
  ENGLISH: "ENGLISH",
  SCI: "SCIENCE",
  SCIENCE: "SCIENCE",
  SST: "SOCIAL_STUDIES",
  SOCIAL_STUDIES: "SOCIAL_STUDIES",
  SOCIAL_SCIENCE: "SOCIAL_STUDIES",
  SOCIALSTUDIES: "SOCIAL_STUDIES",
  GK: "GK",
  GENERAL_KNOWLEDGE: "GK",
  ICT: "ICT",
  IT: "ICT",
  COMPUTER: "ICT",
  EVS: "EVS",
  HINDI: "HINDI",
  TELUGU: "TELUGU",
  ROBOTICS_CODING: "ROBOTICS_CODING",
  ROBO: "ROBOTICS_CODING",
  ROBOTICS: "ROBOTICS_CODING",
  SPACE_ASTRONOMY: "SPACE_ASTRONOMY",
  SPACELAB: "SPACE_ASTRONOMY",
  ART_AND_CRAFT: "ART",
  ART: "ART",
  "A_C": "ART",
};

export type SubjectTeacherAssignment = {
  teachers: string[];
  weeklyPeriods: number;
  /** Preferred display / cell label (first non-empty subject string seen). */
  displayName?: string;
  grade?: string;
  section?: string;
};

export type TimetableSubjectCatalogRow = {
  grade: string;
  section: string;
  name: string;
  teachers: string[];
  weeklyPeriods: number;
};

function slug(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Normalize subject names for matching timetable ↔ subjects page. */
export function subjectMatchKey(name: string): string {
  const s = slug(name);
  if (!s) return "";
  if (SUBJECT_ALIASES[s]) return SUBJECT_ALIASES[s];
  // Map display names reverse (General Knowledge → GK)
  for (const [code, label] of Object.entries(SUBJECT_DISPLAY_NAMES)) {
    if (slug(label) === s || slug(code) === s) {
      return SUBJECT_ALIASES[slug(code)] ?? slug(code);
    }
  }
  return s;
}

function looksLikePersonName(raw: string): boolean {
  const text = String(raw ?? "").trim();
  if (!text || text.length < 3) return false;
  if (/^(mr|mrs|ms|miss|dr|prof)\.?$/i.test(text)) return false;
  // Subject codes / placeholders often ALL_CAPS_WITH_UNDERSCORES and no space
  if (!/\s/.test(text) && /_/.test(text)) return false;
  if (!/\s/.test(text) && text === text.toUpperCase() && text.length <= 20) {
    // bare subject token used as teacher
    if (SUBJECT_ALIASES[slug(text)] || SUBJECT_DISPLAY_NAMES[slug(text)]) return false;
  }
  // Prefer names with a space, or Title Case single token of reasonable length
  if (/\s/.test(text)) return true;
  return /^[A-Z][a-z]+/.test(text) && text.length >= 4;
}

function assignmentKey(grade: string, section: string, subject: string): string {
  return `${String(grade).trim().toUpperCase()}|${String(section).trim().toUpperCase()}|${subjectMatchKey(subject)}`;
}

const IGNORED_SUBJECT_KEYS = new Set([
  "DUMMY",
  "LUNCH",
  "LUNCH_BREAK",
  "BREAK",
  "RECESS",
  "FREE",
  "FREE_PERIOD",
  "NIL",
  "NA",
  "N_A",
]);

function isIgnoredSubject(raw: string): boolean {
  const key = subjectMatchKey(raw);
  if (!key || IGNORED_SUBJECT_KEYS.has(key)) return true;
  // Truncated OCR / PDF scraps (e.g. "STO", "GENERAL_", "MONTESSO")
  const text = String(raw ?? "").trim();
  if (text.endsWith("_") || text.length <= 2) return true;
  return false;
}

function displaySubjectName(raw: string): string {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  const key = subjectMatchKey(text);
  for (const [code, label] of Object.entries(SUBJECT_DISPLAY_NAMES)) {
    if (subjectMatchKey(code) === key || subjectMatchKey(label) === key) return label;
  }
  return text;
}

function addTeacher(
  map: Map<
    string,
    { teachers: Set<string>; weeklyPeriods: number; displayName: string; grade: string; section: string }
  >,
  grade: string,
  section: string,
  subject: string,
  teacher: string,
  countPeriod: boolean
) {
  const subjKey = subjectMatchKey(subject);
  if (!grade || !section || !subjKey || isIgnoredSubject(subject)) return;
  const key = assignmentKey(grade, section, subject);
  if (!map.has(key)) {
    map.set(key, {
      teachers: new Set(),
      weeklyPeriods: 0,
      displayName: displaySubjectName(subject),
      grade,
      section,
    });
  }
  const row = map.get(key)!;
  if (countPeriod) row.weeklyPeriods += 1;
  if (looksLikePersonName(teacher)) row.teachers.add(String(teacher).trim());
  // Prefer a human label over an ALL_CAPS cell code when available.
  const nextName = displaySubjectName(subject);
  if (nextName && (nextName !== nextName.toUpperCase() || !row.displayName)) {
    row.displayName = nextName;
  }
}

/**
 * Build grade|section|subject → teachers / weekly periods from class + teacher timetables.
 */
export function buildSubjectTeacherMapFromTimetables(
  docs: Array<TimetableDocData & { id?: string }>,
  academicYear: string
): Map<string, SubjectTeacherAssignment> {
  const year = String(academicYear ?? "").trim();
  const raw = new Map<
    string,
    { teachers: Set<string>; weeklyPeriods: number; displayName: string; grade: string; section: string }
  >();

  for (const doc of docs) {
    const key = String(doc.key ?? "").trim();
    if (year && key && key !== year) continue;

    const grid = (doc.periodGrid ?? doc.timetable ?? {}) as Record<
      string,
      Record<string, Array<{ subject?: string; teacher?: string }>>
    >;

    if (String(doc.scope ?? "").toLowerCase() === "teacher" || String(doc.teacherName ?? "").trim()) {
      const teacherName = String(doc.teacherName ?? "").trim();
      const taughtSubject = String(doc.subject ?? "").trim();
      if (!teacherName || !taughtSubject) continue;

      for (const day of DAYS) {
        for (let i = 1; i <= 9; i++) {
          const cell = grid?.[day]?.[`P${i}`]?.[0];
          const label = String(cell?.subject ?? "").trim();
          if (!label) continue;
          const parsed = parseClassSectionLabel(label);
          if (!parsed) continue;
          addTeacher(raw, parsed.grade, parsed.section, taughtSubject, teacherName, true);
        }
      }
      continue;
    }

    const grade = String(doc.grade ?? "").trim();
    const section = String(doc.section ?? "").trim();
    if (!grade || !section) continue;

    for (const day of DAYS) {
      for (let i = 1; i <= 9; i++) {
        const cell = grid?.[day]?.[`P${i}`]?.[0];
        const subject = String(cell?.subject ?? "").trim();
        if (!subject || subject.toUpperCase() === "DUMMY") continue;
        const teacher = String(cell?.teacher ?? "").trim();
        addTeacher(raw, grade, section, subject, teacher, true);
      }
    }
  }

  const out = new Map<string, SubjectTeacherAssignment>();
  for (const [k, v] of raw) {
    out.set(k, {
      teachers: [...v.teachers].sort((a, b) => a.localeCompare(b)),
      weeklyPeriods: v.weeklyPeriods,
      displayName: v.displayName,
      grade: v.grade,
      section: v.section,
    });
  }
  return out;
}

/** Unique grade/section/subject rows taken from class + teacher timetable cells. */
export function buildSubjectCatalogFromTimetables(
  docs: Array<TimetableDocData & { id?: string }>,
  academicYear: string
): TimetableSubjectCatalogRow[] {
  const map = buildSubjectTeacherMapFromTimetables(docs, academicYear);
  return [...map.values()]
    .map((row) => ({
      grade: String(row.grade ?? "").trim(),
      section: String(row.section ?? "").trim(),
      name: String(row.displayName ?? "").trim(),
      teachers: row.teachers,
      weeklyPeriods: row.weeklyPeriods,
    }))
    .filter((row) => row.grade && row.section && row.name)
    .sort((a, b) => {
      const g = a.grade.localeCompare(b.grade, undefined, { sensitivity: "base" });
      if (g !== 0) return g;
      const s = a.section.localeCompare(b.section, undefined, { sensitivity: "base" });
      if (s !== 0) return s;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

export function lookupSubjectTeachers(
  map: Map<string, SubjectTeacherAssignment>,
  grade: string,
  section: string,
  subjectName: string
): SubjectTeacherAssignment | null {
  const key = assignmentKey(grade, section, subjectName);
  return map.get(key) ?? null;
}
