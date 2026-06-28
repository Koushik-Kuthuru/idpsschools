import React, { useState, useEffect } from "react";
import { UserSquare2, RotateCw, Printer } from "lucide-react";


import { useSchoolId } from "@/hooks/useSchoolId";
import { buildPath, fetchMany, db, auth } from "@/lib/db-client";


type ViewTeacherTimetableTabProps = {
  lockedTeacherName?: string;
  readOnly?: boolean;
};

export default function ViewTeacherTimetableTab({
  lockedTeacherName,
  readOnly = false,
}: ViewTeacherTimetableTabProps = {}) {
  const schoolId = useSchoolId();
  const [teacher, setTeacher] = useState("");
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const snap = await fetchMany(buildPath(db, "schools", schoolId, "teaching_staff"));
        const names = snap.docs.map((d: any) => {
          const data = d.data();
          const first = String(data.firstName ?? "").trim();
          const last = String(data.lastName ?? "").trim();
          return `${first} ${last}`.trim() || String(data.employeeId ?? "Teacher").trim();
        }).filter(Boolean);
        setTeacherOptions(Array.from(new Set(names)).sort((a: any, b: any) => a.localeCompare(b)));
        if (lockedTeacherName) {
          const match = names.find((n: string) => n.toLowerCase() === lockedTeacherName.toLowerCase()) || lockedTeacherName;
          setTeacher(match);
        } else if (names.length > 0) {
          setTeacher(names[0]);
        }
      } catch (err) {
        console.error("Failed to load teachers", err);
      }
    }
    loadTeachers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedTeacherName]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Teacher:</label>
            {readOnly && lockedTeacherName ? (
              <span className="h-8 inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-800">
                {teacher || lockedTeacherName}
              </span>
            ) : (
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835] w-[200px]"
            >
              <option value="">Select Teacher</option>
              {teacherOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            )}
          </div>
          
          <div className="flex-1" />
          
          <button className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors">
            <Printer size={14} /> Print
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          {isLoading ? (
            <RotateCw size={24} className="animate-spin text-[#144835]" />
          ) : (
            <div className="text-center">
              <div className="h-16 w-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <UserSquare2 size={32} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Teacher's Timetable Viewer</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Select a teacher above to view their weekly schedule across all classes.
                (Functionality to be implemented)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
