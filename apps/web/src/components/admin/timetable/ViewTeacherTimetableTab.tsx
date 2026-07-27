import React, { useEffect, useState } from "react";
import { UserSquare2, Printer } from "lucide-react";

import { useSchoolId } from "@/hooks/useSchoolId";
import { SkeletonMatrix } from "@/components/ui/Skeleton";
import TimetableGridTable from "./TimetableGridTable";
import { resolveTeacherName } from "@/lib/teacherTimetableUtils";
import { useTeacherTimetable, useTeacherTimetableOptions } from "./useTimetableData";

type ViewTeacherTimetableTabProps = {
  lockedTeacherName?: string;
  readOnly?: boolean;
};

export default function ViewTeacherTimetableTab({
  lockedTeacherName,
  readOnly = false,
}: ViewTeacherTimetableTabProps = {}) {
  const schoolId = useSchoolId();
  const teacherOptions = useTeacherTimetableOptions(schoolId);
  const [teacher, setTeacher] = useState("");

  useEffect(() => {
    if (!teacherOptions.length) return;

    if (lockedTeacherName) {
      const match = resolveTeacherName(lockedTeacherName, teacherOptions) ?? lockedTeacherName;
      setTeacher(match);
      return;
    }

    setTeacher((prev) =>
      prev && teacherOptions.some((name) => name.toLowerCase() === prev.toLowerCase())
        ? prev
        : teacherOptions[0]
    );
  }, [lockedTeacherName, teacherOptions]);

  const { grid, subject, template, loading, term, resolvedTeacherName } = useTeacherTimetable(
    schoolId,
    teacher
  );

  const displayName = resolvedTeacherName || teacher || lockedTeacherName || "";

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Teacher:</label>
            {readOnly && lockedTeacherName ? (
              <span className="h-8 inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-800">
                {displayName}
              </span>
            ) : (
              <select
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835] w-[220px]"
              >
                <option value="">Select Teacher</option>
                {teacherOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>

          <span className="text-[11px] font-semibold text-gray-400">{term}</span>
          {subject ? (
            <span className="text-[11px] font-medium text-[#144835] bg-[#144835]/5 px-2 py-1 rounded-md">
              {subject}
            </span>
          ) : null}

          <div className="flex-1" />

          <button className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors">
            <Printer size={14} /> Print
          </button>
        </div>

        <div className="p-4 min-h-[320px]">
          {loading ? (
            <SkeletonMatrix rows={7} columns={6} className="border-0" />
          ) : !teacher ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <UserSquare2 size={32} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Teacher Timetable</h2>
              <p className="text-sm text-gray-500 mt-2">Select a teacher to view their weekly schedule.</p>
            </div>
          ) : (
            <TimetableGridTable
              grid={grid}
              template={template}
              showTeachers={false}
              emptyMessage={`No timetable found for ${displayName} (${term}).`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
