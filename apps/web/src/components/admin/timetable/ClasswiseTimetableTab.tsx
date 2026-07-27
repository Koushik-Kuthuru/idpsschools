import React, { useState, useEffect, useMemo } from "react";
import { LayoutGrid, Pencil, Printer, Download } from "lucide-react";

import { useSchoolId } from "@/hooks/useSchoolId";
import { SkeletonMatrix } from "@/components/ui/Skeleton";
import { useBranchClassOptions } from "@/hooks/useBranchClassOptions";
import TimetableGridTable from "./TimetableGridTable";
import { timetablesForGrade, useAllClassTimetables } from "./useTimetableData";

function gradeLabel(grade: string) {
  if (!grade) return "—";
  if (/^\d+$/.test(grade)) return `Grade ${grade}`;
  return grade;
}

export default function ClasswiseTimetableTab({
  onEdit,
}: {
  onEdit?: (grade: string, section: string) => void;
}) {
  const schoolId = useSchoolId();
  const { grades: classOptions, sectionsByClass } = useBranchClassOptions(schoolId);
  const [grade, setGrade] = useState("");
  const { docs, templateForGrade, loading, term } = useAllClassTimetables(schoolId);

  useEffect(() => {
    if (!classOptions.length) return;
    setGrade((prev) => (classOptions.includes(prev) ? prev : classOptions[0]));
  }, [classOptions]);

  const sections = useMemo(() => {
    if (!grade) return [];
    return timetablesForGrade(docs, grade, sectionsByClass[grade] ?? []);
  }, [docs, grade, sectionsByClass]);

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
                  {gradeLabel(g)}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-semibold text-gray-400">{term}</span>
          <span className="text-[11px] text-gray-500">
            {sections.length} section{sections.length === 1 ? "" : "s"}
          </span>

          <div className="flex-1" />

          <button className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors">
            <Printer size={14} /> Print
          </button>
          <button className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors">
            <Download size={14} /> Export
          </button>
        </div>

        <div className="p-4 min-h-[320px]">
          {loading ? (
            <SkeletonMatrix rows={7} columns={6} className="border-0" />
          ) : sections.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <LayoutGrid size={32} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">No timetables for {gradeLabel(grade)}</h2>
              <p className="text-sm text-gray-500 mt-2">
                Import or create timetables for this grade ({term}).
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sections.map((doc) => (
                <div key={doc.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-800">
                      {gradeLabel(doc.grade)} — {doc.section}
                    </h3>
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(doc.grade, doc.section)}
                        className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    ) : null}
                  </div>
                  <TimetableGridTable grid={doc.grid} template={templateForGrade(doc.grade)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
