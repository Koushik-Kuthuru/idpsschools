"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { subjectDisplayName } from "@/lib/subjectStore";
import TimetableGridTable from "./TimetableGridTable";
import { useAllClassTimetables } from "./useTimetableData";
import type { PeriodGrid } from "./timetablePeriodGrid";
import { timetableDays } from "./timetablePeriodGrid";

function gradeLabel(grade: string) {
  if (/^\d+$/.test(grade)) return `Grade ${grade}`;
  return grade;
}

function isStudyHourSubject(raw: string): boolean {
  const key = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return (
    key === "STUDY_HOUR" ||
    key === "STUDYHOUR" ||
    key === "STUDY" ||
    key.includes("STUDY_HOUR")
  );
}

/** Keep only Study Hour cells; blank everything else. */
function filterStudyHourGrid(grid: PeriodGrid | null | undefined): PeriodGrid | null {
  if (!grid) return null;
  const next = {} as PeriodGrid;
  let hasAny = false;
  for (const day of timetableDays) {
    const dayGrid = grid[day] ?? {};
    next[day] = {};
    for (const [periodId, entries] of Object.entries(dayGrid)) {
      const filtered = (entries ?? []).filter((entry) =>
        isStudyHourSubject(String(entry?.subject ?? ""))
      );
      if (filtered.length) {
        hasAny = true;
        next[day][periodId] = filtered.map((entry) => ({
          ...entry,
          subject: subjectDisplayName(String(entry.subject ?? "")) || "Study Hour",
        }));
      } else {
        next[day][periodId] = [];
      }
    }
  }
  return hasAny ? next : null;
}

export default function StudyHoursTimetableTab() {
  const schoolId = useSchoolId();
  const { docs, templateForGrade, loading, term } = useAllClassTimetables(schoolId);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const studyDocs = useMemo(() => {
    return docs
      .map((doc) => {
        const grid = filterStudyHourGrid(doc.grid);
        return grid ? { ...doc, grid } : null;
      })
      .filter(Boolean) as Array<(typeof docs)[number] & { grid: PeriodGrid }>;
  }, [docs]);

  const filtered = studyDocs.filter((doc) => {
    const hay = `${doc.grade} ${doc.section}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="h-8 w-8 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center">
            <BookOpen size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Study Hours Timetable</p>
            <p className="text-[11px] text-gray-500">
              {filtered.length} classes with study hour · {term}
            </p>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grade or section…"
            className="ml-2 h-8 rounded-md border border-gray-200 bg-white px-3 text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835] w-[200px]"
          />
        </div>

        <div className="p-4 min-h-[320px]">
          {loading ? (
            <SkeletonList rows={6} avatar={false} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-500">
              No study-hour periods found in class timetables for {term}.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((doc) => {
                const isOpen = expanded[doc.id];
                return (
                  <div key={doc.id} className="rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(doc.id)}
                      className="flex w-full items-center gap-2 px-4 py-3 bg-gray-50/80 text-left"
                    >
                      {isOpen ? (
                        <ChevronDown size={16} className="text-gray-500 shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-500 shrink-0" />
                      )}
                      <span className="text-sm font-bold text-gray-800">
                        {gradeLabel(doc.grade)} — {doc.section}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="p-4 border-t border-gray-100">
                        <TimetableGridTable
                          grid={doc.grid}
                          template={templateForGrade(doc.grade)}
                          compact
                          emptyMessage="No study hour periods for this class"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
