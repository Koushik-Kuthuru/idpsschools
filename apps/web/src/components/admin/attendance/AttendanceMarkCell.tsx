"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AttendanceDayInfo, AttendanceMarkStatus } from "@/utils/attendance";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AttendanceMarkCellProps = {
  dayInfo: AttendanceDayInfo;
  status: AttendanceMarkStatus;
  attendancePercent: number;
  remarks?: string;
  onStatusChange: (status: AttendanceMarkStatus) => void;
  onRemarksChange?: (remarks: string) => void;
};

export default function AttendanceMarkCell({
  dayInfo,
  status,
  attendancePercent,
  remarks = "",
  onStatusChange,
  onRemarksChange,
}: AttendanceMarkCellProps) {
  const overallBadge = (
    <span
      className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide whitespace-nowrap",
        attendancePercent >= 75
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-rose-50 text-rose-700 border-rose-100"
      )}
    >
      {Math.round(attendancePercent)}%
    </span>
  );

  const buttons = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => onStatusChange("P")}
        className={cn(
          "px-2.5 py-1 rounded text-xs font-bold transition-all",
          status === "P"
            ? "bg-emerald-500 text-white shadow-sm"
            : "text-gray-600 hover:bg-white hover:text-emerald-600"
        )}
      >
        Present
      </button>
      <button
        type="button"
        onClick={() => onStatusChange("A")}
        className={cn(
          "px-2.5 py-1 rounded text-xs font-bold transition-all",
          status === "A"
            ? "bg-red-500 text-white shadow-sm"
            : "text-gray-600 hover:bg-white hover:text-red-600"
        )}
      >
        Absent
      </button>
      {dayInfo.mode === "halfday" ? (
        <button
          type="button"
          onClick={() => onStatusChange("HD")}
          className={cn(
            "px-2.5 py-1 rounded text-xs font-bold transition-all",
            status === "HD"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-600 hover:bg-white hover:text-amber-600"
          )}
        >
          Half
        </button>
      ) : null}
    </div>
  );

  if (!dayInfo.canMark) {
    return (
      <div className="mx-auto inline-flex flex-col items-center gap-1">
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
          {dayInfo.label}
        </span>
        {overallBadge}
      </div>
    );
  }

  return (
    <div className="mx-auto inline-flex flex-col items-center gap-1">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 p-1 rounded-lg border bg-gray-50/50 border-gray-100",
          status === "A" && "pr-1.5"
        )}
      >
        {buttons}
        {status === "A" && onRemarksChange ? (
          <input
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            className={cn(
              "w-[120px] h-7 rounded-md border px-2 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 shrink-0",
              remarks
                ? "border-red-200 bg-red-50/50 text-red-900 focus:border-red-500"
                : "border-red-200 bg-white text-red-900 focus:border-red-500"
            )}
            placeholder="Reason..."
          />
        ) : null}
      </div>
      {overallBadge}
    </div>
  );
}
