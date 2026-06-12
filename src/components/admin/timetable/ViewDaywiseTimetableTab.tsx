import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarRange,
  RotateCw,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  Coffee,
} from "lucide-react";
import { collection, doc, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DEFAULT_TERM_KEY,
  timetableDocId,
  type PeriodGrid,
  timetableDays,
  type TimetableDay,
} from "./timetablePeriodGrid";
import {
  defaultTimetableTemplate,
  normalizeTimetableTemplate,
  TIMETABLE_TEMPLATE_DOC,
  type TimetableTemplate,
  buildTableColumns,
} from "./timetableTemplate";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const schoolId = "idpscherukupalli";

type HolidayEntry = {
  date: string;
  name: string;
  type: string;
};

function formatTimeRange(start: string, end: string) {
  return `${start} - ${end}`;
}

export default function ViewDaywiseTimetableTab() {
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [sectionsByClass, setSectionsByClass] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState<TimetableTemplate>(defaultTimetableTemplate);
  const [grid, setGrid] = useState<PeriodGrid | null>(null);
  const [holidays, setHolidays] = useState<HolidayEntry[]>([]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const columns = useMemo(() => buildTableColumns(template), [template]);

  // Load Classes
  useEffect(() => {
    async function loadMeta() {
      try {
        const snap = await getDocs(collection(db, "schools", schoolId, "classes"));
        const grades = new Set<string>();
        const byClass: Record<string, Set<string>> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const g = String(data.grade ?? data.name ?? "").trim();
          const s = String(data.section ?? "").trim().toUpperCase();
          if (!g) return;
          grades.add(g);
          if (!byClass[g]) byClass[g] = new Set();
          if (s) byClass[g].add(s);
        });
        const sortedGrades = Array.from(grades).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );
        const mapped: Record<string, string[]> = {};
        sortedGrades.forEach((g) => {
          mapped[g] = Array.from(byClass[g] ?? []).sort();
        });
        setClassOptions(sortedGrades);
        setSectionsByClass(mapped);
        if (sortedGrades.length > 0) {
          setGrade(sortedGrades[0]);
          setSection(mapped[sortedGrades[0]]?.[0] ?? "");
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    }
    loadMeta();
  }, []);

  const sectionOptions = useMemo(
    () => (grade ? sectionsByClass[grade] ?? [] : []),
    [grade, sectionsByClass]
  );

  useEffect(() => {
    if (section && sectionOptions.length > 0 && !sectionOptions.includes(section)) {
      setSection(sectionOptions[0] ?? "");
    }
  }, [grade, section, sectionOptions]);

  // Load Template & Timetable
  useEffect(() => {
    async function fetchData() {
      if (!grade || !section) return;
      setIsLoading(true);
      try {
        const tplRef = doc(db, "schools", schoolId, "settings", TIMETABLE_TEMPLATE_DOC);
        const tplSnap = await getDoc(tplRef);
        if (tplSnap.exists()) {
          setTemplate(normalizeTimetableTemplate(tplSnap.data()));
        }

        const ttRef = doc(
          db,
          "schools",
          schoolId,
          "timetables",
          timetableDocId(DEFAULT_TERM_KEY, grade, section)
        );
        const ttSnap = await getDoc(ttRef);
        if (ttSnap.exists()) {
          const data = ttSnap.data();
          setGrid(data?.periodGrid ?? data?.timetable ?? null);
        } else {
          setGrid(null);
        }
      } catch (err) {
        console.error("Failed to fetch timetable", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [grade, section]);

  // Load Holidays
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "schools", schoolId, "holidays"), (snap) => {
      setHolidays(
        snap.docs
          .map((d) => {
            const data = d.data();
            return {
              date: String(data.date || "").trim(),
              name: String(data.name || "").trim(),
              type: String(data.type || "").trim(),
            };
          })
          .filter((h) => h.date)
      );
    });
    return () => unsub();
  }, []);

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  // Adjust so Monday is 0
  const startOffset = (firstDayOfMonth + 6) % 7;

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const formatLocalDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const selectedDateStr = formatLocalDate(selectedDate);
  const selectedHoliday = holidays.find((h) => h.date === selectedDateStr);
  const isSunday = selectedDate.getDay() === 0;

  let selectedWeekday: TimetableDay | null = null;
  const jsDay = selectedDate.getDay();
  if (jsDay === 1) selectedWeekday = "Monday";
  if (jsDay === 2) selectedWeekday = "Tuesday";
  if (jsDay === 3) selectedWeekday = "Wednesday";
  if (jsDay === 4) selectedWeekday = "Thursday";
  if (jsDay === 5) selectedWeekday = "Friday";
  if (jsDay === 6) selectedWeekday = "Saturday";

  const renderDetailedSchedule = () => {
    if (isSunday) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-16 w-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <CalendarRange size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Sunday</h3>
          <p className="text-sm text-gray-500 mt-1">Weekend - No Classes Scheduled</p>
        </div>
      );
    }
    if (selectedHoliday) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
            <CalendarRange size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Holiday: {selectedHoliday.name}</h3>
          <p className="text-sm text-gray-500 mt-1">Type: {selectedHoliday.type}</p>
        </div>
      );
    }

    if (!grid || !selectedWeekday || !grid[selectedWeekday]) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-16 w-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
            <CalendarRange size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No Timetable</h3>
          <p className="text-sm text-gray-500 mt-1">
            No schedule has been created for {grade}-{section} yet.
          </p>
        </div>
      );
    }

    const dayGrid = grid[selectedWeekday];

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
          {selectedWeekday}'s Schedule
        </h3>
        <div className="flex flex-col gap-3">
          {columns.map((col, idx) => {
            if (col.type === "break") {
              return (
                <div
                  key={`break-${idx}`}
                  className="flex items-center justify-between rounded-lg bg-amber-50/50 border border-amber-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-amber-100/50 flex items-center justify-center text-amber-600">
                      <Coffee size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-800">{col.break.label}</p>
                      <p className="text-[11px] font-medium text-amber-600/80">
                        {formatTimeRange(col.break.startTime, col.break.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            const entries = dayGrid[col.period.id] || [];
            const hasEntries = entries.some((e) => e.subject || e.teacher);

            return (
              <div
                key={`period-${col.period.id}`}
                className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-4 py-3 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-12 shrink-0">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                      {col.period.label}
                    </p>
                    <p className="text-[11px] font-bold text-gray-600 mt-0.5 whitespace-nowrap">
                      {col.period.startTime}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-gray-100" />
                  <div className="flex flex-col gap-1.5">
                    {hasEntries ? (
                      entries.map((e, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-[#144835]/5 text-[#144835] text-xs font-bold border border-[#144835]/10">
                            {e.subject || "No Subject"}
                          </span>
                          <span className="text-xs font-medium text-gray-500">
                            by {e.teacher || "Unassigned"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs font-medium text-gray-400 italic py-1">Free Period</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Grade:</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835]"
            >
              {classOptions.map((g) => (
                <option key={g} value={g}>
                  {/^\d+$/.test(g) ? `Grade ${g}` : g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Section:</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={!grade}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835] disabled:opacity-50"
            >
              {sectionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          <button className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors">
            <Printer size={14} /> Print
          </button>
          <button className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors">
            <Download size={14} /> Export
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Calendar View */}
          <div className="rounded-[16px] border border-gray-100 overflow-hidden bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-800">
                {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="h-8 w-8 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                  className="h-8 px-2 rounded-md hover:bg-gray-200 text-xs font-bold text-gray-600 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="h-8 w-8 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 bg-white">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 bg-gray-50/30 border-b border-r border-gray-100" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = i + 1;
                const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date);
                const isSelected = selectedDate.toDateString() === d.toDateString();
                const isToday = new Date().toDateString() === d.toDateString();
                const strDate = formatLocalDate(d);
                const isSun = d.getDay() === 0;
                const holiday = holidays.find((h) => h.date === strDate);

                let indicator = null;
                if (isSun) {
                  indicator = (
                    <div className="mt-1 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    </div>
                  );
                } else if (holiday) {
                  indicator = (
                    <div className="mt-1 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    </div>
                  );
                } else if (grid && grid[timetableDays[d.getDay() - 1] as TimetableDay]) {
                  indicator = (
                    <div className="mt-1 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </div>
                  );
                }

                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      "h-16 relative border-b border-r border-gray-100 flex flex-col items-center justify-center transition-colors hover:bg-gray-50",
                      isSelected ? "bg-[#144835]/5 border-[#144835]/30 z-10" : "bg-white",
                      isSun ? "bg-gray-50/50" : ""
                    )}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-[#144835] rounded-sm pointer-events-none" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full",
                        isToday
                          ? isSelected
                            ? "bg-[#144835] text-white"
                            : "bg-gray-200 text-gray-900"
                          : isSelected
                          ? "text-[#144835]"
                          : "text-gray-700",
                        isSun && !isSelected && !isToday ? "text-gray-400" : ""
                      )}
                    >
                      {date}
                    </span>
                    {indicator}
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 text-[11px] font-medium text-gray-500 justify-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Regular Classes
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Holiday / Exam
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300"></span> Weekend
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="rounded-[16px] border border-gray-100 overflow-hidden bg-gray-50/30">
            <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  {selectedDate.getDate()}{" "}
                  {selectedDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  {selectedDate.toLocaleString("default", { weekday: "long" })}
                </p>
              </div>
              {isLoading && <RotateCw size={16} className="animate-spin text-[#144835]" />}
            </div>
            <div className="p-4">{renderDetailedSchedule()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
