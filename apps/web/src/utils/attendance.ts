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

export const ACADEMIC_YEAR_START = "2026-04-01";
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
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let totalWorkingDays = 0;
  const current = new Date(start);

  const allHolidays = [...HOLIDAYS, ...dynamicHolidays];

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay(); // 0 = Sunday

    const isSunday = dayOfWeek === 0;
    const isHoliday = allHolidays.includes(dateStr);

    if (!isSunday && !isHoliday) {
      totalWorkingDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }

  const presentCount = presentDates.length;
  const absentCount = absentDates.length;
  const lateCount = lateDates.length;

  // Percentage is based on present days vs total working days
  // If no working days yet, return 0
  const percentage = totalWorkingDays > 0 
    ? Math.round((presentCount / totalWorkingDays) * 100) 
    : 0;

  return {
    presentDays: presentCount,
    absentDays: absentCount,
    lateDays: lateCount,
    totalWorkingDays,
    percentage
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
