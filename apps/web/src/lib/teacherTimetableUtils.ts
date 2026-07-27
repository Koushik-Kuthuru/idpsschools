import {
  normalizePeriodGrid,
  teacherTimetableDocId,
  timetableDays,
  type PeriodGrid,
} from "@/components/admin/timetable/timetablePeriodGrid";
import {
  defaultTimetableTemplate,
  normalizeTimetableTemplate,
  resolveTemplateForGrade,
  type TimetableTemplate,
} from "@/components/admin/timetable/timetableTemplate";
import type { TimetableDocData } from "@/lib/timetableStore";
import { classScopeKey } from "@/lib/teacherClassScope";

export type TimetableDocRecord = TimetableDocData & { id: string };

export function normalizeTeacherName(name: string): string {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/^(mr|mrs|ms|miss|dr|prof)\.?\s+/i, "")
    .replace(/\s+/g, " ");
}

export function teacherNamesMatch(a: string, b: string): boolean {
  const left = normalizeTeacherName(a);
  const right = normalizeTeacherName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftParts = left.split(" ").filter(Boolean);
  const rightParts = right.split(" ").filter(Boolean);
  if (!leftParts.length || !rightParts.length) return false;

  if (leftParts.every((token) => rightParts.some((part) => part === token || part.includes(token) || token.includes(part)))) {
    return true;
  }

  if (leftParts.length >= 2) {
    const reversed = [...leftParts].reverse().join(" ");
    if (right.includes(reversed) || reversed.includes(right)) return true;
  }

  if (leftParts[0] === rightParts[0]) {
    const leftLast = leftParts[leftParts.length - 1];
    const rightLast = rightParts[rightParts.length - 1];
    if (leftLast.length > 2 && rightLast.length > 2 && leftLast === rightLast) return true;
  }

  const leftPrimary = leftParts[0];
  const rightPrimary = rightParts[0];
  if (leftPrimary && rightPrimary && levenshtein(leftPrimary, rightPrimary) <= 1) {
    const leftLast = leftParts[leftParts.length - 1];
    const rightLast = rightParts[rightParts.length - 1];
    if (leftLast && rightLast && levenshtein(leftLast, rightLast) <= 1) return true;
  }

  return false;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

export function resolveTeacherName(candidate: string, knownNames: string[]): string | null {
  const trimmed = String(candidate ?? "").trim();
  if (!trimmed) return null;

  const exact = knownNames.find((name) => name.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  return knownNames.find((name) => teacherNamesMatch(name, trimmed)) ?? null;
}

export function listTeacherNamesFromDocs(docs: TimetableDocRecord[]): string[] {
  const names = docs
    .filter((doc) => doc.scope === "teacher")
    .map((doc) => String(doc.teacherName ?? "").trim())
    .filter(Boolean);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function buildTeacherPeriodGrid(
  docs: TimetableDocRecord[],
  teacherName: string,
  term: string,
  templateInput?: TimetableTemplate | Record<string, unknown> | null
): { grid: PeriodGrid; subject: string; resolvedName: string } {
  const template = normalizeTimetableTemplate(templateInput ?? defaultTimetableTemplate);
  const teacherDocNames = listTeacherNamesFromDocs(docs);
  const resolvedName = resolveTeacherName(teacherName, teacherDocNames) ?? teacherName.trim();

  const teacherDoc =
    docs.find((doc) => doc.id === teacherTimetableDocId(term, resolvedName)) ??
    docs.find(
      (doc) =>
        doc.scope === "teacher" &&
        String(doc.key ?? "") === term &&
        teacherNamesMatch(String(doc.teacherName ?? ""), resolvedName)
    );

  if (teacherDoc?.periodGrid || teacherDoc?.timetable) {
    return {
      grid: normalizePeriodGrid(teacherDoc.periodGrid ?? teacherDoc.timetable, template),
      subject: String(teacherDoc.subject ?? "").trim(),
      resolvedName: String(teacherDoc.teacherName ?? resolvedName).trim(),
    };
  }

  const merged = normalizePeriodGrid(null, template);
  const classDocs = docs.filter(
    (doc) => doc.scope !== "teacher" && (!doc.key || String(doc.key) === term)
  );

  for (const doc of classDocs) {
    const grade = String(doc.grade ?? "").trim();
    const section = String(doc.section ?? "").trim();
    if (!grade || !section) continue;

    const classGrid = normalizePeriodGrid(doc.periodGrid ?? doc.timetable, template);
    const classLabel = `${grade} · ${section}`;

    for (const day of timetableDays) {
      for (const periodId of Object.keys(classGrid[day] ?? {})) {
        for (const entry of classGrid[day][periodId] ?? []) {
          if (!teacherNamesMatch(entry.teacher, resolvedName)) continue;

          const subjectText = entry.subject ? `${entry.subject} (${classLabel})` : classLabel;
          const cell = merged[day][periodId];
          if (!cell.some((item) => item.subject === subjectText)) {
            cell.push({ subject: subjectText, teacher: "" });
          }
        }
      }
    }
  }

  return { grid: merged, subject: "", resolvedName };
}

export function teacherClassSubjectsFromDocs(
  docs: TimetableDocRecord[],
  teacherName: string,
  term: string,
  templateInput?: TimetableTemplate | Record<string, unknown> | null
): Array<{ classKey: string; grade: string; section: string; subjects: string[] }> {
  const template = normalizeTimetableTemplate(templateInput ?? defaultTimetableTemplate);
  const resolvedName =
    resolveTeacherName(teacherName, listTeacherNamesFromDocs(docs)) ?? teacherName.trim();
  const byClass = new Map<
    string,
    { classKey: string; grade: string; section: string; subjects: Set<string> }
  >();

  for (const doc of docs) {
    if (doc.scope === "teacher" || (doc.key && String(doc.key) !== term)) continue;
    const grade = String(doc.grade ?? "").trim();
    const section = String(doc.section ?? "").trim();
    if (!grade || !section) continue;

    const grid = normalizePeriodGrid(doc.periodGrid ?? doc.timetable, template);
    const classKey = classScopeKey(grade, section);
    for (const day of timetableDays) {
      for (const entries of Object.values(grid[day] ?? {})) {
        for (const entry of entries) {
          if (!teacherNamesMatch(entry.teacher, resolvedName)) continue;
          const subject = String(entry.subject ?? "").trim();
          if (!subject || subject === "—" || subject === "-") continue;
          const current = byClass.get(classKey) ?? {
            classKey,
            grade,
            section,
            subjects: new Set<string>(),
          };
          current.subjects.add(subject);
          byClass.set(classKey, current);
        }
      }
    }
  }

  return Array.from(byClass.values()).map((row) => ({
    classKey: row.classKey,
    grade: row.grade,
    section: row.section,
    subjects: Array.from(row.subjects),
  }));
}

export type TeacherTimetablePeriodRow = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  room: string;
  accent: string;
  isBreak?: boolean;
  class_key?: string | null;
  grade?: string | null;
  section?: string | null;
  period_id?: string | null;
  period_label?: string | null;
};

const DAY_INDEX: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

export { parseTimeToMinutes };

/** Class keys whose period has started (or is within `graceBeforeMinutes`) today. */
export function classKeysDueForAttendance(
  periods: Array<{
    day_of_week?: string;
    subject_name?: string;
    start_time?: string;
    isBreak?: boolean;
  }>,
  now = new Date(),
  graceBeforeMinutes = 5
): Set<string> {
  const todayName = getWeekdayName(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const keys = new Set<string>();

  for (const period of periods) {
    if (period.isBreak || period.day_of_week !== todayName) continue;
    const parsed = parseClassFromSubject(String(period.subject_name ?? ""));
    if (!parsed) continue;
    const start = parseTimeToMinutes(String(period.start_time ?? ""));
    if (nowMinutes >= start - graceBeforeMinutes) {
      keys.add(classScopeKey(parsed.grade, parsed.section));
    }
  }

  return keys;
}

function formatTime12(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function getWeekdayName(date = new Date()): string {
  return WEEKDAY_NAMES[date.getDay()] ?? "Monday";
}

export function parseClassSectionLabel(label: string): { grade: string; section: string } | null {
  const text = String(label ?? "").trim();
  if (!text) return null;

  const complex = text.match(/^([IVXLC]+\s*\([^)]+\))\s*-\s*(.+)$/i);
  if (complex) {
    return { grade: complex[1].trim(), section: complex[2].trim() };
  }

  const dash = text.indexOf("-");
  if (dash > 0) {
    const grade = text.slice(0, dash).trim();
    const section = text.slice(dash + 1).trim();
    if (grade && section && /^[IVXLC0-9]/i.test(grade)) {
      return { grade, section };
    }
  }

  return null;
}

export function isClassSectionSubject(subject: string): boolean {
  const text = String(subject ?? "").trim();
  if (!text || text === "-" || text === "—") return false;
  if (/^(mr|mrs|ms|miss|dr|prof)\b/i.test(text)) return false;
  if (parseClassSectionLabel(text)) return true;

  const match = text.match(/\(([^)]+)\)\s*$/);
  if (!match) return false;
  const inner = match[1].trim();
  const parts = inner.split(/[·\-/]/).map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2;
}

export function parseClassFromSubject(subject: string): { grade: string; section: string } | null {
  const direct = parseClassSectionLabel(subject);
  if (direct) return direct;

  // Teacher timetable labels are emitted as "Subject (GRADE · SECTION)".
  // Sections can themselves contain parentheses, e.g.
  // "Mathematics (VII · GALILEO(CO-SPARK))", so capture greedily.
  const match = String(subject ?? "").match(/\((.+)\)\s*$/);
  if (!match) return null;
  const inner = match[1].trim();
  const parts = inner.includes("·")
    ? inner.split("·").map((part) => part.trim()).filter(Boolean)
    : inner.split(/[/-]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return { grade: parts[0], section: parts.slice(1).join("-") };
}

export function subjectFromTeacherTimetableLabel(label: string): string {
  const text = String(label ?? "").trim();
  if (!parseClassFromSubject(text) || parseClassSectionLabel(text)) return "";
  const classSuffixIndex = text.indexOf(" (");
  return classSuffixIndex > 0 ? text.slice(0, classSuffixIndex).trim() : "";
}

export function formatClassLabelFromSubject(subject: string): string {
  const parsed = parseClassFromSubject(subject);
  const subjectBase = String(subject ?? "")
    .replace(/\s*\([^)]+\)\s*$/, "")
    .trim();
  if (parsed) {
    return `${parsed.grade}-${parsed.section}`;
  }
  return subjectBase || "—";
}

export function resolveTimetableTeacherLabel(params: {
  fullName?: string | null;
  employeeId?: string | null;
  displayName?: string | null;
  timetableTeacherNames: string[];
  aliases?: Record<string, string>;
}): string | null {
  const teacherNames = params.timetableTeacherNames;
  if (!teacherNames.length) return null;

  const employeeId = String(params.employeeId ?? "").trim().toLowerCase();
  const aliases = params.aliases ?? {};

  if (employeeId) {
    for (const [label, aliasId] of Object.entries(aliases)) {
      if (aliasId !== employeeId) continue;
      const hit = teacherNames.find((name) => teacherNamesMatch(name, label));
      if (hit) return hit;
    }
  }

  const candidates = [params.fullName, params.displayName, params.employeeId].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const hit = resolveTeacherName(candidate, teacherNames);
    if (hit) return hit;
  }

  return null;
}

export function formatPeriodShortLabel(period: Pick<TeacherTimetablePeriodRow, "subject_name" | "start_time">): string {
  const subject = String(period.subject_name ?? "").trim();
  const time = period.start_time ? formatTime12(period.start_time) : "";
  // Teacher grids often store the class section as the subject (e.g. VI-BACH(CO-SPARK)).
  if (isClassSectionSubject(subject)) {
    return time ? `${subject} · ${time}` : subject;
  }
  const classLabel = formatClassLabelFromSubject(subject);
  const subjectBase = subject.replace(/\s*\([^)]+\)\s*$/, "").trim();
  if (subjectBase && classLabel !== subjectBase) {
    return time ? `${subjectBase} ${classLabel} · ${time}` : `${subjectBase} ${classLabel}`;
  }
  return time ? `${classLabel} · ${time}` : classLabel;
}

export type TeacherTimetableSnapshot = {
  classesToday: number;
  nextClass: string;
  nextClassTime: string;
  currentClassLabel: string | null;
  currentClassKey: string | null;
  currentPeriodLabel: string | null;
  inSession: boolean;
};

function classPeriodsOnly(periods: TeacherTimetablePeriodRow[]): TeacherTimetablePeriodRow[] {
  return periods.filter(
    (period) => !period.isBreak && isClassSectionSubject(period.subject_name)
  );
}

const TEACHING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Next teaching period on a later weekday (after today), wrapping within the week. */
function findNextWeekdayPeriod(
  periods: TeacherTimetablePeriodRow[],
  todayName: string
): TeacherTimetablePeriodRow | null {
  const teaching = classPeriodsOnly(periods);
  if (!teaching.length) return null;

  const todayPos = TEACHING_DAYS.indexOf(todayName as (typeof TEACHING_DAYS)[number]);
  // Sunday / unknown → start from Monday (offset 0). Weekdays → start tomorrow (offset 1).
  const startOffset = todayPos < 0 ? 0 : 1;

  for (let step = 0; step < TEACHING_DAYS.length; step += 1) {
    const offset = startOffset + step;
    const dayName =
      todayPos < 0
        ? TEACHING_DAYS[step]
        : TEACHING_DAYS[(todayPos + offset) % TEACHING_DAYS.length];
    const dayPeriods = teaching
      .filter((period) => period.day_of_week === dayName)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    if (dayPeriods[0]) return dayPeriods[0];
  }

  return null;
}

function formatUpcomingAcrossDays(period: TeacherTimetablePeriodRow): string {
  const dayShort = String(period.day_of_week ?? "").slice(0, 3);
  const label = formatPeriodShortLabel(period);
  return dayShort ? `${dayShort} · ${label}` : label;
}

export function computeTeacherTimetableSnapshot(
  periods: TeacherTimetablePeriodRow[],
  now = new Date()
): TeacherTimetableSnapshot {
  const todayName = getWeekdayName(now);
  const todayPeriods = classPeriodsOnly(periods)
    .filter((period) => period.day_of_week === todayName)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const classesToday = todayPeriods.length;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let current: TeacherTimetablePeriodRow | null = null;
  let next: TeacherTimetablePeriodRow | null = null;

  for (const period of todayPeriods) {
    const start = parseTimeToMinutes(period.start_time);
    const end = parseTimeToMinutes(period.end_time || period.start_time);
    if (nowMinutes >= start && nowMinutes < end) {
      current = period;
    } else if (nowMinutes < start && !next) {
      next = period;
    }
  }

  const laterDay = !current && !next ? findNextWeekdayPeriod(periods, todayName) : null;

  const currentClassKey = current
    ? (() => {
        const parsed = parseClassFromSubject(current.subject_name);
        if (!parsed) return null;
        return classScopeKey(parsed.grade, parsed.section);
      })()
    : null;

  let nextClass = "—";
  if (current) {
    nextClass = `${formatPeriodShortLabel(current)} (now)`;
  } else if (next) {
    nextClass = formatPeriodShortLabel(next);
  } else if (laterDay) {
    nextClass = formatUpcomingAcrossDays(laterDay);
  } else if (classesToday > 0) {
    nextClass = "Done for today";
  }

  return {
    classesToday,
    nextClass,
    nextClassTime: next?.start_time ?? current?.start_time ?? laterDay?.start_time ?? "",
    currentClassLabel: current
      ? formatClassLabelFromSubject(current.subject_name)
      : laterDay
        ? formatClassLabelFromSubject(laterDay.subject_name)
        : null,
    currentClassKey,
    currentPeriodLabel: current?.subject_name ?? laterDay?.subject_name ?? null,
    inSession: Boolean(current),
  };
}

export function flattenTeacherGridToPeriods(
  grid: PeriodGrid,
  templateInput?: TimetableTemplate | Record<string, unknown> | null,
  dayFilter?: string
): TeacherTimetablePeriodRow[] {
  const template = normalizeTimetableTemplate(templateInput ?? defaultTimetableTemplate);
  const rows: TeacherTimetablePeriodRow[] = [];
  let rowId = 0;

  for (const day of timetableDays) {
    if (dayFilter && day.toLowerCase() !== dayFilter.toLowerCase()) continue;

    for (const period of template.periods) {
      const entries = grid[day]?.[period.id] ?? [];
      const hasContent = entries.some((entry) => entry.subject || entry.teacher);
      if (!hasContent) continue;

      for (const entry of entries) {
        if (!entry.subject && !entry.teacher) continue;
        const subjectName = entry.subject || entry.teacher;
        if (!isClassSectionSubject(subjectName)) continue;
        const parsed = parseClassFromSubject(subjectName);
        const grade = parsed?.grade ?? null;
        const section = parsed?.section ?? null;
        rows.push({
          id: `${day}-${period.id}-${rowId++}`,
          day_of_week: day,
          start_time: period.startTime,
          end_time: period.endTime,
          subject_name: subjectName,
          room: "",
          accent: "#144835",
          class_key: grade && section ? classScopeKey(grade, section) : null,
          grade,
          section,
          period_id: period.id,
          period_label: period.label ?? period.id,
        });
      }
    }
  }

  return rows.sort((a, b) => {
    const dayDiff = (DAY_INDEX[a.day_of_week] ?? 99) - (DAY_INDEX[b.day_of_week] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return a.start_time.localeCompare(b.start_time);
  });
}
