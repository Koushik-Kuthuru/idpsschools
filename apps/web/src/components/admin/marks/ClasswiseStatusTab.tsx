"use client";

import React, { useState, useEffect } from "react";


import { useSchoolId } from "@/hooks/useSchoolId";
import { PieChart, LayoutGrid, List } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildPath, fetchMany, subscribeData, db, auth } from "@/lib/db-client";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const gradeLabel = (grade: string) => {
  if (!grade || grade === "All") return "All";
  const num = parseInt(grade, 10);
  if (isNaN(num)) return grade;
  const ordinals = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];
  const v = num % 100;
  return num + (ordinals[(v - 20) % 10] || ordinals[v] || ordinals[0]);
};

interface ClassStatus {
  grade: string;
  section: string;
  totalSubjects: number;
  completedSubjects: number;
}

export default function ClasswiseStatusTab() {
  const schoolId = useSchoolId();
  const [exam, setExam] = useState("");
  const [examOptions, setExamOptions] = useState<string[]>([]);
  const [statusData, setStatusData] = useState<ClassStatus[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  useEffect(() => {
    const unsub = subscribeData(buildPath(db, "schools", schoolId, "exam_types"), (snap: any) => {
      const names = snap.docs.map((d: any) => String(d.data().name || "").trim()).filter(Boolean);
      setExamOptions(names);
      if (names.length && !exam) setExam(names[0]);
    });
    return () => unsub();
  }, [schoolId, exam]);

  useEffect(() => {
    if (!exam) {
      // Fallback: also derive exam names from marks docs if exam_types empty
      void (async () => {
        try {
          const marksSnap = await fetchMany(buildPath(db, "schools", schoolId, "marks"));
          const names = Array.from(
            new Set(
              marksSnap.docs
                .map((d: any) => String(d.data()?.exam ?? "").trim())
                .filter(Boolean)
            )
          ).sort((a, b) => a.localeCompare(b));
          if (names.length) {
            setExamOptions(names);
            setExam(names[0]);
          }
        } catch {
          /* ignore */
        }
      })();
      return;
    }
    async function loadStatus() {
      setIsLoading(true);
      try {
        const classesSnap = await fetchMany(buildPath(db, "schools", schoolId, "classes"));
        const classes = classesSnap.docs.map((d: any) => d.data());

        const subjectsSnap = await fetchMany(buildPath(db, "schools", schoolId, "subjects"));
        const subjectsData = subjectsSnap.docs.map((d: any) => d.data());

        const marksSnap = await fetchMany(buildPath(db, "schools", schoolId, "marks"));
        const marksData = marksSnap.docs.map((d: any) => d.data() as any);

        // Also build class list from marks if classes table is incomplete for this year
        const classKeys = new Map<string, { grade: string; section: string }>();
        classes.forEach((c: any) => {
          const grade = String(c.grade ?? c.name ?? "").trim();
          const section = String(c.section ?? "").trim().toUpperCase();
          if (grade && section) classKeys.set(`${grade}:::${section}`, { grade, section });
        });
        marksData
          .filter((m) => m.exam === exam)
          .forEach((m) => {
            const grade = String(m.grade ?? "").trim();
            const section = String(m.section ?? "").trim().toUpperCase();
            if (grade && section) classKeys.set(`${grade}:::${section}`, { grade, section });
          });

        const data: ClassStatus[] = [];

        classKeys.forEach(({ grade, section }) => {
          const catalogSubjects = subjectsData.filter((s: any) => {
            return String(s.classId || "").trim() === grade && String(s.section || "").trim().toUpperCase() === section;
          }).length;

          const marksSubjects = marksData.filter((m) => {
            if (m.exam !== exam) return false;
            if (String(m.grade || "").trim() !== grade) return false;
            if (String(m.section || "").trim().toUpperCase() !== section) return false;
            return Boolean(String(m.subject ?? "").trim());
          });

          const totalSubjects = Math.max(catalogSubjects, marksSubjects.length);

          const completedSubjects = marksSubjects.filter((m) => {
            const validRows = m.rows?.filter((r: any) => typeof r.marks === "number" || r.absent);
            return validRows && validRows.length > 0;
          }).length;

          data.push({ grade, section, totalSubjects, completedSubjects });
        });

        data.sort((a: any, b: any) => {
          const gA = parseInt(a.grade) || 0;
          const gB = parseInt(b.grade) || 0;
          if (gA !== gB) return gA - gB;
          return a.section.localeCompare(b.section);
        });

        setStatusData(data);
      } catch (err) {
        console.error("Failed to load status:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStatus();
  }, [exam, schoolId]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm w-full min-w-0">
        <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Examination</label>
          <div className="relative">
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-gray-50/50 pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all cursor-pointer"
            >
              {examOptions.length ? (
                examOptions.map((e: any) => <option key={e} value={e}>{e}</option>)
              ) : (
                <option value="" disabled>No exams defined</option>
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
        
      </div>

      {isLoading && !statusData ? (
        viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} />
            ))}
          </div>
        ) : (
          <SkeletonTable rows={8} columns={6} />
        )
      ) : null}

      {statusData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2 min-w-0">
              <PieChart className="text-[#144835] shrink-0" size={18} />
              <span className="truncate">Status for {exam}</span>
            </h3>
            <div className="flex items-center bg-gray-100 rounded-lg p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all",
                  viewMode === "card" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <LayoutGrid size={14} />
                Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all",
                  viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <List size={14} />
                List
              </button>
            </div>
          </div>

          {statusData.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-bold">No classes found for this school.</div>
          ) : viewMode === "card" ? (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {statusData.map((s, idx) => {
                const percent = s.totalSubjects > 0 ? Math.round((s.completedSubjects / s.totalSubjects) * 100) : 0;

                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200/60 pb-2">
                      <span className="font-bold text-gray-800 text-sm tracking-wide">{gradeLabel(s.grade)} - {s.section}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">Total Subjects</span>
                        <span className="font-bold text-gray-800">{s.totalSubjects}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold text-emerald-600">Marks Entered</span>
                        <span className="font-bold text-emerald-700">{s.completedSubjects}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold text-amber-600">Pending</span>
                        <span className="font-bold text-amber-700">{Math.max(0, s.totalSubjects - s.completedSubjects)}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Completion</span>
                        <span className={cn(
                          "text-sm font-black",
                          percent >= 100 ? "text-emerald-600" :
                          percent >= 50 ? "text-amber-600" : "text-rose-600"
                        )}>{percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            percent >= 100 ? "bg-emerald-500" :
                            percent >= 50 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px] whitespace-nowrap">
                <thead className="bg-gray-100/90">
                  <tr>
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Class</th>
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Section</th>
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Total Subjects</th>
                    <th className="px-4 py-3 font-bold text-emerald-700 border-b border-gray-200 text-center">Marks Entered</th>
                    <th className="px-4 py-3 font-bold text-amber-700 border-b border-gray-200 text-center">Pending</th>
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Completion %</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {statusData.map((s, idx) => {
                    const percent = s.totalSubjects > 0 ? Math.round((s.completedSubjects / s.totalSubjects) * 100) : 0;
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-bold text-gray-800">{gradeLabel(s.grade)}</td>
                        <td className="px-4 py-3 font-medium text-gray-600">{s.section}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-800">{s.totalSubjects}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700">{s.completedSubjects}</td>
                        <td className="px-4 py-3 text-center font-bold text-amber-700">{Math.max(0, s.totalSubjects - s.completedSubjects)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex min-w-[3rem] justify-center px-2 py-1 rounded-md text-xs font-bold",
                            percent >= 100 ? "bg-emerald-100 text-emerald-700" :
                            percent >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {percent}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
