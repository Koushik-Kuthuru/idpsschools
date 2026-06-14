import React, { useState, useEffect } from "react";
import { LayoutGrid, RotateCw, Printer, Download } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSchoolId } from "@/hooks/useSchoolId";

export default function ClasswiseTimetableTab() {
  const schoolId = useSchoolId();
  const [grade, setGrade] = useState("");
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const snap = await getDocs(collection(db, "schools", schoolId, "classes"));
        const grades = new Set<string>();
        snap.docs.forEach((d) => {
          const data = d.data();
          const g = String(data.grade ?? data.name ?? "").trim();
          if (g) grades.add(g);
        });
        const sortedGrades = Array.from(grades).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );
        setClassOptions(sortedGrades);
        if (sortedGrades.length > 0) {
          setGrade(sortedGrades[0]);
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    }
    loadMeta();
  }, []);

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
          
          <div className="flex-1" />
          
          <button className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors">
            <Printer size={14} /> Print
          </button>
          <button className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          {isLoading ? (
            <RotateCw size={24} className="animate-spin text-[#144835]" />
          ) : (
            <div className="text-center">
              <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <LayoutGrid size={32} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Classwise Timetable Viewer</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Select a grade above to view the combined timetable for all sections in that grade.
                (Functionality to be implemented)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
