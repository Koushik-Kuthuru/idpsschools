export type TimetablePeriodConfig = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
};

export type TimetableBreakConfig = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  afterPeriodId: string;
};

export type TimetableTemplate = {
  periods: TimetablePeriodConfig[];
  breaks: TimetableBreakConfig[];
};

export type TableColumn =
  | { type: "period"; period: TimetablePeriodConfig }
  | { type: "break"; break: TimetableBreakConfig };

export const TIMETABLE_TEMPLATE_DOC = "timetable_template";

export const defaultTimetableTemplate: TimetableTemplate = {
  periods: [
    { id: "P1", label: "P1", startTime: "08:00", endTime: "08:45" },
    { id: "P2", label: "P2", startTime: "08:45", endTime: "09:30" },
    { id: "P3", label: "P3", startTime: "09:30", endTime: "10:15" },
    { id: "P4", label: "P4", startTime: "10:30", endTime: "11:15" },
    { id: "P5", label: "P5", startTime: "11:15", endTime: "12:00" },
    { id: "P6", label: "P6", startTime: "12:00", endTime: "12:45" },
    { id: "P7", label: "P7", startTime: "13:30", endTime: "14:15" },
  ],
  breaks: [
    {
      id: "break_morning",
      label: "Morning Break",
      startTime: "10:15",
      endTime: "10:30",
      afterPeriodId: "P3",
    },
  ],
};

export function formatTimeRange(start: string, end: string) {
  const fmt = (t: string) => {
    const parts = t.trim().split(":");
    if (parts.length < 2) return t.trim();
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export function normalizeTimetableTemplate(raw: unknown): TimetableTemplate {
  if (!raw || typeof raw !== "object") return defaultTimetableTemplate;

  const data = raw as Record<string, unknown>;
  const periodsRaw = Array.isArray(data.periods) ? data.periods : [];
  const breaksRaw = Array.isArray(data.breaks) ? data.breaks : [];

  const periods = periodsRaw
    .map((p, index) => {
      const row = p as Record<string, unknown>;
      const id = String(row.id ?? `P${index + 1}`).trim();
      const label = String(row.label ?? id).trim();
      const startTime = String(row.startTime ?? "").trim();
      const endTime = String(row.endTime ?? "").trim();
      if (!id || !startTime || !endTime) return null;
      return { id, label, startTime, endTime };
    })
    .filter(Boolean) as TimetablePeriodConfig[];

  const breaks = breaksRaw
    .map((b, index) => {
      const row = b as Record<string, unknown>;
      const id = String(row.id ?? `break_${index + 1}`).trim();
      const label = String(row.label ?? "Break").trim();
      const startTime = String(row.startTime ?? "").trim();
      const endTime = String(row.endTime ?? "").trim();
      const afterPeriodId = String(row.afterPeriodId ?? "").trim();
      if (!id || !startTime || !endTime || !afterPeriodId) return null;
      return { id, label, startTime, endTime, afterPeriodId };
    })
    .filter(Boolean) as TimetableBreakConfig[];

  if (periods.length === 0) return defaultTimetableTemplate;
  return { periods, breaks };
}

export function buildTableColumns(template: TimetableTemplate): TableColumn[] {
  const columns: TableColumn[] = [];
  template.periods.forEach((period) => {
    columns.push({ type: "period", period });
    const brk = template.breaks.find((b) => b.afterPeriodId === period.id);
    if (brk) columns.push({ type: "break", break: brk });
  });
  return columns;
}

export function nextPeriodId(periods: TimetablePeriodConfig[]) {
  const nums = periods
    .map((p) => parseInt(p.id.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `P${next}`;
}

export function nextBreakId(breaks: TimetableBreakConfig[]) {
  return `break_${breaks.length + 1}`;
}
