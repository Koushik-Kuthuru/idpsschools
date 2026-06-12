import { keyPart } from "./timetablePeriodGrid";
import { timetableDays, type PeriodGrid, type TimetableDay } from "./timetablePeriodGrid";
import { buildTableColumns, formatTimeRange, type TimetableTemplate } from "./timetableTemplate";

export const EXAM_TERMS = [
  { id: "term_1", label: "Term 1" },
  { id: "term_2", label: "Term 2" },
  { id: "final_exam", label: "Final Exam" },
] as const;

export type ExamTermId = (typeof EXAM_TERMS)[number]["id"];

export function examTermLabel(termId: ExamTermId) {
  return EXAM_TERMS.find((t) => t.id === termId)?.label ?? termId;
}

export function examTimetableDocId(termId: ExamTermId, grade: string, section: string) {
  return `exam__${keyPart(termId)}__${keyPart(grade)}__${keyPart(section)}`;
}

export function gradeLabel(grade: string) {
  if (!grade) return "—";
  const num = parseInt(grade, 10);
  if (isNaN(num)) return grade;
  return `Grade ${grade}`;
}

export type ExamExportRow = {
  Day: string;
  Period: string;
  Time: string;
  Subject: string;
  Invigilator: string;
};

export function flattenExamGridForExport(
  grid: PeriodGrid,
  template: TimetableTemplate,
  termLabel: string,
  grade: string,
  section: string
): ExamExportRow[] {
  const rows: ExamExportRow[] = [];
  const columns = buildTableColumns(template);

  for (const day of timetableDays) {
    columns.forEach((col) => {
      if (col.type !== "period") return;
      const entries = grid[day]?.[col.period.id] ?? [];
      const filled = entries.filter((e) => e.subject || e.teacher);
      if (filled.length === 0) {
        rows.push({
          Day: day,
          Period: col.period.label,
          Time: formatTimeRange(col.period.startTime, col.period.endTime),
          Subject: "",
          Invigilator: "",
        });
        return;
      }
      filled.forEach((entry) => {
        rows.push({
          Day: day,
          Period: col.period.label,
          Time: formatTimeRange(col.period.startTime, col.period.endTime),
          Subject: entry.subject,
          Invigilator: entry.teacher,
        });
      });
    });
  }

  return rows;
}

export function exportFilename(termId: ExamTermId, grade: string, section: string) {
  const term = examTermLabel(termId).replace(/\s+/g, "_");
  return `Exam_Timetable_${term}_Grade${grade}_Sec${section}`;
}

export function hasExamGridContent(grid: PeriodGrid, day: TimetableDay, periodId: string) {
  return (grid[day]?.[periodId] ?? []).some((e) => e.subject || e.teacher);
}
