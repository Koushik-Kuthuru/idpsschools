import type { AttendanceMarkStatus } from "@/utils/attendance";

export type TransportAttendanceMark = {
  status: AttendanceMarkStatus;
  remarks?: string;
};

export function summarizeTransportMonth(
  monthKey: string,
  studentIds: string[],
  monthMarks: Record<string, Record<string, TransportAttendanceMark>>
) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${monthKey}-${String(day).padStart(2, "0")}`;
  });

  const rows = studentIds.map((studentId) => {
    let present = 0;
    let absent = 0;
    let marked = 0;
    const dayMarks: Record<number, AttendanceMarkStatus> = {};

    for (const date of dates) {
      const day = Number(date.slice(-2));
      const status = monthMarks[date]?.[studentId]?.status ?? "None";
      dayMarks[day] = status;
      if (status === "P") {
        present += 1;
        marked += 1;
      } else if (status === "A" || status === "HD") {
        absent += 1;
        marked += 1;
      }
    }

    const working = marked || present + absent;
    const percent = working > 0 ? Math.round((present / working) * 100) : 0;

    return { studentId, dayMarks, present, absent, working, percent };
  });

  const dayTotals: Record<number, number> = {};
  for (let day = 1; day <= daysInMonth; day += 1) {
    dayTotals[day] = rows.filter((row) => row.dayMarks[day] === "P").length;
  }

  return { year, month, daysInMonth, dates, rows, dayTotals };
}
