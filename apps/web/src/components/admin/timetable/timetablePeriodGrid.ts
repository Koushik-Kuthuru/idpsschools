import type { TimetablePeriodConfig, TimetableTemplate } from "./timetableTemplate";
import { defaultTimetableTemplate } from "./timetableTemplate";

export const timetableDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type TimetableDay = (typeof timetableDays)[number];
export type PeriodId = string;

export type PeriodEntry = {
  subject: string;
  teacher: string;
};

export type PeriodGrid = Record<TimetableDay, Record<PeriodId, PeriodEntry[]>>;

export const DEFAULT_TERM_KEY = "2025-26";

export function periodIdsFromTemplate(template: TimetableTemplate = defaultTimetableTemplate) {
  return template.periods.map((p) => p.id);
}

export function emptyPeriodEntry(): PeriodEntry {
  return { subject: "", teacher: "" };
}

export function emptyPeriodGrid(template: TimetableTemplate = defaultTimetableTemplate): PeriodGrid {
  const ids = periodIdsFromTemplate(template);
  const grid = {} as PeriodGrid;
  for (const day of timetableDays) {
    grid[day] = {};
    for (const id of ids) {
      grid[day][id] = [emptyPeriodEntry()];
    }
  }
  return grid;
}

export function normalizePeriodGrid(
  raw: unknown,
  template: TimetableTemplate = defaultTimetableTemplate
): PeriodGrid {
  const base = emptyPeriodGrid(template);
  if (!raw || typeof raw !== "object") return base;

  const ids = periodIdsFromTemplate(template);

  for (const day of timetableDays) {
    const dayData = (raw as Record<string, unknown>)[day];
    if (!dayData || typeof dayData !== "object") continue;

    for (const id of ids) {
      const cell = (dayData as Record<string, unknown>)[id];
      if (!Array.isArray(cell) || cell.length === 0) continue;

      base[day][id] = cell.map((entry) => {
        const row = entry as Record<string, unknown>;
        return {
          subject: String(row.subject ?? "").trim(),
          teacher: String(row.teacher ?? "").trim(),
        };
      });
    }
  }

  return base;
}

export function remapPeriodGrid(prev: PeriodGrid, template: TimetableTemplate): PeriodGrid {
  const next = emptyPeriodGrid(template);
  const ids = periodIdsFromTemplate(template);

  for (const day of timetableDays) {
    for (const id of ids) {
      if (prev[day]?.[id]?.length) {
        next[day][id] = prev[day][id];
      }
    }
  }

  return next;
}

export function keyPart(v: string) {
  return encodeURIComponent(String(v || "").trim()).replace(/%/g, "_");
}

export function timetableDocId(termKey: string, grade: string, section: string) {
  return `term__${keyPart(termKey)}__${keyPart(grade)}__${keyPart(section)}`;
}
