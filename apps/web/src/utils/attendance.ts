export type AttendanceMarkStatus = "P" | "A" | "HD" | "None";

export type HolidayEntry = { date: string; name?: string; type?: string };

export type AttendanceDayMode = "regular" | "halfday" | "holiday";

export type AttendanceDayInfo = {
  mode: AttendanceDayMode;
  label: string;
  canMark: boolean;
};

export interface AttendanceStats {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalWorkingDays: number;
  percentage: number;
}

/** Default Apr–Mar session start for the calendar year in progress. */
export const ACADEMIC_YEAR_START = (() => {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-04-01`;
})();
export const HOLIDAYS = [
  "2026-08-15", // Independence Day
  "2026-10-02", // Gandhi Jayanti
  "2026-11-08", // Diwali (Estimated)
  "2026-12-25", // Christmas
  "2027-01-26", // Republic Day
];

export function calculateAttendanceStats(
  presentDates: string[] = [],
  absentDates: string[] = [],
  lateDates: string[] = [],
  startDate: string = ACADEMIC_YEAR_START,
  endDate: string = new Date().toISOString().split('T')[0],
  dynamicHolidays: string[] = []
): AttendanceStats {
  const start = startDate.slice(0, 10);
  // Registers hold several sessions of marks; only score the requested window,
  // and never count days that have not happened yet.
  const today = toLocalDateString(new Date());
  const end = [endDate.slice(0, 10), today].sort()[0];

  const withinRange = (dates: string[]) => {
    const seen = new Set<string>();
    for (const raw of dates) {
      const date = String(raw ?? "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      if (date >= start && date <= end) seen.add(date);
    }
    return seen;
  };

  const present = withinRange(presentDates);
  const absent = withinRange(absentDates);
  const late = withinRange(lateDates);

  // A day can appear in more than one list from messy imports — present wins.
  for (const date of present) {
    absent.delete(date);
    late.delete(date);
  }
  for (const date of late) {
    absent.delete(date);
  }

  const allHolidays = new Set([...HOLIDAYS, ...dynamicHolidays]);
  const workingDays = new Set<string>();
  const current = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);

  if (!Number.isNaN(current.getTime()) && !Number.isNaN(last.getTime()) && current <= last) {
    while (current <= last) {
      const dateStr = toLocalDateString(current);
      if (current.getDay() !== 0 && !allHolidays.has(dateStr)) {
        workingDays.add(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
  }

  // A Sunday/holiday that was actually marked still counts as a school day.
  for (const date of [...present, ...absent, ...late]) workingDays.add(date);

  const presentDays = present.size;
  const absentDays = absent.size;
  const lateDays = late.size;
  const markedDays = presentDays + absentDays + lateDays;
  const totalWorkingDays = workingDays.size;

  const percentage =
    markedDays > 0
      ? Math.min(100, Math.round(((presentDays + lateDays * 0.5) / markedDays) * 100))
      : 0;

  return {
    presentDays,
    absentDays,
    lateDays,
    totalWorkingDays: markedDays > 0 ? markedDays : totalWorkingDays,
    percentage,
  };
}

export function classifyAttendanceDay(date: string, holidays: HolidayEntry[]): AttendanceDayInfo {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { mode: "regular", label: "Working Day", canMark: true };
  }

  if (parsed.getDay() === 0) {
    return { mode: "holiday", label: "Sunday", canMark: false };
  }

  const entry = holidays.find((h) => h.date === date);
  if (entry) {
    const haystack = `${entry.type || ""} ${entry.name || ""}`;
    if (/half/i.test(haystack)) {
      return { mode: "halfday", label: entry.name || "Half Day", canMark: true };
    }
    return { mode: "holiday", label: entry.name || "Holiday", canMark: false };
  }

  return { mode: "regular", label: "Working Day", canMark: true };
}

export function getAttendanceStatusForDate(
  attendance:
    | { presentDates?: string[]; absentDates?: string[]; lateDates?: string[] }
    | undefined,
  date: string
): AttendanceMarkStatus {
  if (attendance?.presentDates?.includes(date)) return "P";
  if (attendance?.absentDates?.includes(date)) return "A";
  if (attendance?.lateDates?.includes(date)) return "HD";
  return "None";
}

/** True when date is a non-Sunday holiday (calendar or imported register). */
export function isAttendanceHoliday(
  date: string,
  calendarHolidays: string[] = [],
  attendance?: { holidayDates?: string[] } | null
): boolean {
  if (calendarHolidays.includes(date)) return true;
  return Boolean(attendance?.holidayDates?.includes(date));
}

/** Local calendar YYYY-MM-DD (avoids UTC shift from Date#toISOString). */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Build YYYY-MM-DD from calendar parts (month is 1–12). */
export function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** First calendar year from academic year label (e.g. 2023-24 → 2023). */
export function academicYearStartYear(yearName?: string | null): number {
  const match = String(yearName ?? "").match(/^(\d{4})/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

/** Apr–Mar session bounds used by attendance registers. */
export function academicYearAprMarRange(yearName?: string | null): { start: string; end: string } {
  const startYear = academicYearStartYear(yearName);
  return {
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
  };
}

export type AnnualRegisterMark = "P" | "A" | "H" | "SUN" | "HD" | "-" | "";

export function getAnnualRegisterMark(
  day: number,
  monthIdx: number,
  academicYearStart: number,
  attendance?: {
    presentDates?: string[];
    absentDates?: string[];
    lateDates?: string[];
    holidayDates?: string[];
  } | null
): { mark: AnnualRegisterMark; invalid: boolean } {
  const year = monthIdx < 9 ? academicYearStart : academicYearStart + 1;
  const monthNumber = (monthIdx + 3) % 12 + 1;
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  if (day > daysInMonth) return { mark: "", invalid: true };

  const dateStr = ymd(year, monthNumber, day);
  const dateObj = new Date(year, monthNumber - 1, day);

  if (dateObj.getDay() === 0) return { mark: "SUN", invalid: false };
  if (attendance?.holidayDates?.includes(dateStr)) return { mark: "H", invalid: false };
  if (attendance?.presentDates?.includes(dateStr)) return { mark: "P", invalid: false };
  if (attendance?.absentDates?.includes(dateStr)) return { mark: "A", invalid: false };
  if (attendance?.lateDates?.includes(dateStr)) return { mark: "HD", invalid: false };
  return { mark: "-", invalid: false };
}

/** Calendar months (YYYY-MM) covered by an academic year session. */
export function monthsInAcademicYear(input: {
  name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}): { value: string; label: string }[] {
  let start = String(input.start_date ?? "").trim().slice(0, 10);
  let end = String(input.end_date ?? "").trim().slice(0, 10);

  if ((!start || !end) && input.name) {
    const short = String(input.name).match(/^(\d{4})-(\d{2})$/);
    const long = String(input.name).match(/^(\d{4})-(\d{4})$/);
    if (short) {
      const endYear = short[2].length === 2 ? `20${short[2]}` : short[2];
      start = `${short[1]}-06-01`;
      end = `${endYear}-05-31`;
    } else if (long) {
      start = `${long[1]}-06-01`;
      end = `${long[2]}-05-31`;
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return [];
  }

  const cursor = new Date(`${start.slice(0, 7)}-01T12:00:00`);
  const last = new Date(`${end.slice(0, 7)}-01T12:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime()) || cursor > last) {
    return [];
  }

  const months: { value: string; label: string }[] = [];
  while (cursor <= last) {
    const value = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const label = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    months.push({ value, label });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  // Newest session month first (matches prior register UX).
  return months.reverse();
}
