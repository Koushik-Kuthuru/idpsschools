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

/** Bell-timing bands from IDPS schedule chart. */
export type TimetableGradeBand = "primary_senior" | "middle";

export type TimetableTemplateSet = {
  version: 2;
  profiles: Record<TimetableGradeBand, TimetableTemplate>;
};

export type TableColumn =
  | { type: "period"; period: TimetablePeriodConfig }
  | { type: "break"; break: TimetableBreakConfig };

export const TIMETABLE_TEMPLATE_DOC = "timetable_template";

export const GRADE_BAND_LABELS: Record<TimetableGradeBand, string> = {
  primary_senior: "Grade 1–5 & 10–12",
  middle: "Grade 6–9",
};

/**
 * Official bell timing — Grade 1–5 and 10–12:
 * Periods I–IX with lunch after Period IV, then Period V.
 */
export const bellTemplatePrimarySenior: TimetableTemplate = {
  periods: [
    { id: "P1", label: "I", startTime: "09:00", endTime: "09:50" },
    { id: "P2", label: "II", startTime: "09:50", endTime: "10:30" },
    { id: "P3", label: "III", startTime: "10:40", endTime: "11:20" },
    { id: "P4", label: "IV", startTime: "11:20", endTime: "12:00" },
    { id: "P5", label: "V", startTime: "12:40", endTime: "13:20" },
    { id: "P6", label: "VI", startTime: "13:20", endTime: "14:00" },
    { id: "P7", label: "VII", startTime: "14:00", endTime: "14:40" },
    { id: "P8", label: "VIII", startTime: "14:50", endTime: "15:30" },
    { id: "P9", label: "IX", startTime: "15:30", endTime: "16:00" },
  ],
  breaks: [
    {
      id: "break_short_am",
      label: "Short Break",
      startTime: "10:30",
      endTime: "10:40",
      afterPeriodId: "P2",
    },
    {
      id: "break_lunch",
      label: "Lunch Break",
      startTime: "12:00",
      endTime: "12:40",
      afterPeriodId: "P4",
    },
    {
      id: "break_short_pm",
      label: "Short Break",
      startTime: "14:40",
      endTime: "14:50",
      afterPeriodId: "P7",
    },
  ],
};

/**
 * Official bell timing — Grade 6–9:
 * Same bells, but Period V is before lunch (swap with Grades 1–5 & 10–12).
 */
export const bellTemplateMiddle: TimetableTemplate = {
  periods: [
    { id: "P1", label: "I", startTime: "09:00", endTime: "09:50" },
    { id: "P2", label: "II", startTime: "09:50", endTime: "10:30" },
    { id: "P3", label: "III", startTime: "10:40", endTime: "11:20" },
    { id: "P4", label: "IV", startTime: "11:20", endTime: "12:00" },
    { id: "P5", label: "V", startTime: "12:00", endTime: "12:40" },
    { id: "P6", label: "VI", startTime: "13:20", endTime: "14:00" },
    { id: "P7", label: "VII", startTime: "14:00", endTime: "14:40" },
    { id: "P8", label: "VIII", startTime: "14:50", endTime: "15:30" },
    { id: "P9", label: "IX", startTime: "15:30", endTime: "16:00" },
  ],
  breaks: [
    {
      id: "break_short_am",
      label: "Short Break",
      startTime: "10:30",
      endTime: "10:40",
      afterPeriodId: "P2",
    },
    {
      id: "break_lunch",
      label: "Lunch Break",
      startTime: "12:40",
      endTime: "13:20",
      afterPeriodId: "P5",
    },
    {
      id: "break_short_pm",
      label: "Short Break",
      startTime: "14:40",
      endTime: "14:50",
      afterPeriodId: "P7",
    },
  ],
};

export const defaultTimetableTemplate: TimetableTemplate = bellTemplatePrimarySenior;

export const defaultTimetableTemplateSet: TimetableTemplateSet = {
  version: 2,
  profiles: {
    primary_senior: bellTemplatePrimarySenior,
    middle: bellTemplateMiddle,
  },
};

/** Extract grade number from values like "5", "Grade 5", "V", "Class 10". */
export function parseGradeNumber(grade: string): number | null {
  const raw = String(grade ?? "").trim();
  if (!raw) return null;
  const digit = raw.match(/(\d{1,2})/);
  if (digit) {
    const n = parseInt(digit[1], 10);
    return n >= 1 && n <= 12 ? n : null;
  }
  const roman: Record<string, number> = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12,
  };
  const key = raw.toLowerCase().replace(/[^ivx]/g, "");
  return roman[key] ?? null;
}

export function gradeBandForClass(grade: string): TimetableGradeBand {
  const n = parseGradeNumber(grade);
  if (n !== null && n >= 6 && n <= 9) return "middle";
  return "primary_senior";
}

export function formatTimeRange(start: string, end: string) {
  const fmt = (t: string) => {
    const parts = t.trim().split(":");
    if (parts.length < 2) return t.trim();
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function normalizeSingleTemplate(raw: unknown, fallback: TimetableTemplate): TimetableTemplate {
  if (!raw || typeof raw !== "object") return fallback;

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

  if (periods.length === 0) return fallback;
  return { periods, breaks };
}

/** Normalize legacy single template or v2 multi-band set into a full set. */
export function normalizeTimetableTemplateSet(raw: unknown): TimetableTemplateSet {
  if (!raw || typeof raw !== "object") return defaultTimetableTemplateSet;

  const data = raw as Record<string, unknown>;
  if (data.profiles && typeof data.profiles === "object") {
    const profiles = data.profiles as Record<string, unknown>;
    return {
      version: 2,
      profiles: {
        primary_senior: normalizeSingleTemplate(
          profiles.primary_senior,
          bellTemplatePrimarySenior
        ),
        middle: normalizeSingleTemplate(profiles.middle, bellTemplateMiddle),
      },
    };
  }

  // Legacy flat { periods, breaks } — apply to primary_senior; keep middle as bell default
  const legacy = normalizeSingleTemplate(data, bellTemplatePrimarySenior);
  return {
    version: 2,
    profiles: {
      primary_senior: legacy,
      middle: bellTemplateMiddle,
    },
  };
}

/** Backward-compatible: returns the primary/senior (default) band template. */
export function normalizeTimetableTemplate(raw: unknown): TimetableTemplate {
  return normalizeTimetableTemplateSet(raw).profiles.primary_senior;
}

export function resolveTemplateForGrade(
  rawOrSet: unknown,
  grade: string
): TimetableTemplate {
  const set = normalizeTimetableTemplateSet(rawOrSet);
  return set.profiles[gradeBandForClass(grade)];
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
