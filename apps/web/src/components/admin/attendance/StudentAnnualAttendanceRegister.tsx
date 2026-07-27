"use client";

import { Calendar } from "lucide-react";
import {
  academicYearStartYear,
  getAnnualRegisterMark,
  type AnnualRegisterMark,
} from "@/utils/attendance";

const MONTH_LABELS = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"] as const;

type AttendanceDates = {
  presentDates?: string[];
  absentDates?: string[];
  lateDates?: string[];
  holidayDates?: string[];
};

function cellClassForMark(mark: AnnualRegisterMark): string {
  switch (mark) {
    case "SUN":
      return " bg-emerald-100/80 text-emerald-700 font-bold text-[10px] tracking-wide";
    case "H":
      return " bg-gray-200 text-gray-700 font-bold text-xs";
    case "A":
      return " bg-red-50 text-red-600 font-bold text-xs";
    case "P":
      return " text-emerald-600 font-bold text-xs group-hover:text-emerald-700";
    case "HD":
      return " bg-amber-50 text-amber-700 font-bold text-xs";
    default:
      return " text-gray-300 font-bold text-xs";
  }
}

export default function StudentAnnualAttendanceRegister({
  attendance,
  academicYearName,
}: {
  attendance?: AttendanceDates | null;
  academicYearName?: string | null;
}) {
  const academicYearStart = academicYearStartYear(academicYearName);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
            <Calendar size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Annual Attendance Register
            {academicYearName ? ` · ${academicYearName}` : ""}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-800 tracking-wide uppercase">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200" /> Present
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" /> Absent
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300 text-[10px] flex items-center justify-center">H</div>{" "}
            Holiday
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200 text-[9px] flex items-center justify-center">S</div>{" "}
            Sunday
          </span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
        <style
          dangerouslySetInnerHTML={{
            __html: `
 .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
 `,
          }}
        />
        <table className="w-full text-center border-collapse">
          <thead className="sticky top-0 z-20 shadow-[0_1px_0_0_#f3f4f6]">
            <tr className="bg-[#144835]">
              <th className="py-3 px-2 text-xs font-bold text-white uppercase tracking-wide sticky left-0 z-30 bg-[#0d3023] w-20 shadow-[1px_0_0_0_rgba(255,255,255,0.1)]">
                Date
              </th>
              {MONTH_LABELS.map((m) => (
                <th
                  key={m}
                  className="py-3 px-2 text-xs font-bold text-white uppercase tracking-wide min-w-[40px] border-l border-white/10"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <tr key={day} className="hover:bg-gray-50/50 transition-colors group">
                <td className="py-1.5 px-2 text-xs font-bold text-gray-600 sticky left-0 bg-gray-50 group-hover:bg-gray-100/80 z-10 shadow-[1px_0_0_0_#f3f4f6]">
                  {day.toString().padStart(2, "0")}
                </td>
                {Array.from({ length: 12 }, (_, monthIdx) => {
                  const { mark, invalid } = getAnnualRegisterMark(
                    day,
                    monthIdx,
                    academicYearStart,
                    attendance
                  );
                  const cellClass = `py-1.5 px-1 border-l border-gray-100${invalid ? " bg-gray-100/50" : cellClassForMark(mark)}`;

                  if (invalid) {
                    return (
                      <td
                        key={monthIdx}
                        className={cellClass}
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)",
                        }}
                      />
                    );
                  }

                  return (
                    <td key={monthIdx} className={cellClass}>
                      {mark === "-" ? "" : mark}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
