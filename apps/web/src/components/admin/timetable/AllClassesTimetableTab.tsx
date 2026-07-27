"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, LayoutGrid, Pencil } from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import TimetableGridTable from "./TimetableGridTable";
import { useAllClassTimetables } from "./useTimetableData";

function gradeLabel(grade: string) {
  if (/^\d+$/.test(grade)) return `Grade ${grade}`;
  return grade;
}

export default function AllClassesTimetableTab({
  onEdit,
}: {
  onEdit?: (grade: string, section: string) => void;
}) {
  const schoolId = useSchoolId();
  const { docs, templateForGrade, loading, term } = useAllClassTimetables(schoolId);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const filtered = docs.filter((doc) => {
    const hay = `${doc.grade} ${doc.section}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const doc of filtered) next[doc.id] = true;
    setExpanded(next);
  };

  const collapseAll = () => setExpanded({});

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="h-8 w-8 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center">
            <LayoutGrid size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">All Classes</p>
            <p className="text-[11px] text-gray-500">
              {docs.length} class timetables · {term}
            </p>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grade or section…"
            className="ml-2 h-8 rounded-md border border-gray-200 bg-white px-3 text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835] w-[200px]"
          />

          <div className="flex-1" />

          <button
            type="button"
            onClick={expandAll}
            className="h-8 px-3 text-xs font-bold text-gray-600 hover:text-[#144835]"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="h-8 px-3 text-xs font-bold text-gray-600 hover:text-[#144835]"
          >
            Collapse all
          </button>
        </div>

        <div className="p-4 min-h-[320px]">
          {loading ? (
            <SkeletonList rows={6} avatar={false} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-500">
              No class timetables found for {term}.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((doc) => {
                const isOpen = expanded[doc.id];
                return (
                  <div key={doc.id} className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/80">
                      <button
                        type="button"
                        onClick={() => toggle(doc.id)}
                        className="flex flex-1 items-center gap-2 text-left"
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
                      {onEdit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(doc.grade, doc.section)}
                          className="shrink-0 h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                      ) : null}
                    </div>
                    {isOpen ? (
                      <div className="p-4 border-t border-gray-100">
                        <TimetableGridTable grid={doc.grid} template={templateForGrade(doc.grade)} compact />
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
