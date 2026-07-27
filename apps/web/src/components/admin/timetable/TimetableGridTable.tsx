"use client";

import { useMemo } from "react";
import { Coffee } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  buildTableColumns,
  formatTimeRange,
  type TimetableTemplate,
} from "./timetableTemplate";
import {
  normalizePeriodGrid,
  timetableDays,
  type PeriodGrid,
  type TimetableDay,
} from "./timetablePeriodGrid";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TimetableGridTableProps = {
  grid: PeriodGrid | null;
  template: TimetableTemplate;
  title?: string;
  compact?: boolean;
  showTeachers?: boolean;
  emptyMessage?: string;
};

export default function TimetableGridTable({
  grid,
  template,
  title,
  compact = false,
  showTeachers = true,
  emptyMessage = "No timetable data",
}: TimetableGridTableProps) {
  const columns = useMemo(() => buildTableColumns(template), [template]);
  const normalized = useMemo(
    () => (grid ? normalizePeriodGrid(grid, template) : null),
    [grid, template]
  );

  if (!normalized) {
    return (
      <div className="text-center py-10 text-sm text-gray-500">{emptyMessage}</div>
    );
  }

  const cellPad = compact ? "px-2 py-1.5" : "px-3 py-2";
  const textSize = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className="space-y-2">
      {title ? (
        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
          {title}
        </h3>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th
                className={cn(
                  cellPad,
                  textSize,
                  "text-center font-bold text-gray-500 uppercase tracking-wide w-24"
                )}
              >
                Day
              </th>
              {columns.map((col, idx) =>
                col.type === "break" ? (
                  <th
                    key={`break-h-${idx}`}
                    className={cn(cellPad, textSize, "text-center font-bold text-amber-700")}
                  >
                    <div className="inline-flex items-center gap-1">
                      <Coffee size={12} />
                      {col.break.label}
                    </div>
                  </th>
                ) : (
                  <th
                    key={`period-h-${col.period.id}`}
                    className={cn(cellPad, textSize, "text-center font-bold text-gray-600")}
                  >
                    <div>{col.period.label}</div>
                    {!compact ? (
                      <div className="text-[9px] font-medium text-gray-400 mt-0.5">
                        {formatTimeRange(col.period.startTime, col.period.endTime)}
                      </div>
                    ) : null}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {timetableDays.map((day) => (
              <tr key={day} className="border-b border-gray-100 last:border-0">
                <td
                  className={cn(
                    cellPad,
                    textSize,
                    "text-center font-bold text-gray-700 bg-gray-50/60 align-middle"
                  )}
                >
                  {day.slice(0, 3)}
                </td>
                {columns.map((col, idx) => {
                  if (col.type === "break") {
                    return (
                      <td
                        key={`${day}-break-${idx}`}
                        className={cn(cellPad, "bg-amber-50/40 text-center align-middle")}
                      >
                        <span className="text-[9px] text-amber-600 font-medium">—</span>
                      </td>
                    );
                  }
                  const entries = normalized[day as TimetableDay][col.period.id] ?? [];
                  const hasContent = entries.some((e) => e.subject || e.teacher);
                  return (
                    <td
                      key={`${day}-${col.period.id}`}
                      className={cn(
                        cellPad,
                        "text-center align-middle",
                        hasContent ? "bg-white" : "bg-gray-50/30"
                      )}
                    >
                      {hasContent ? (
                        <div className="space-y-1">
                          {entries.map((entry, ei) =>
                            entry.subject || entry.teacher ? (
                              <div key={ei}>
                                {entry.subject ? (
                                  <p className={cn(textSize, "font-semibold text-gray-800 leading-tight")}>
                                    {entry.subject}
                                  </p>
                                ) : null}
                                {showTeachers && entry.teacher ? (
                                  <p className="text-[9px] text-gray-500 leading-tight">{entry.teacher}</p>
                                ) : null}
                              </div>
                            ) : null
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-300">—</span>
                      )}
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
