"use client";

import React, { useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, RotateCw, Users, AlertCircle, LayoutGrid, List } from "lucide-react";
import AttendanceTabGuide, { AttendanceTabLoading } from "./AttendanceTabGuide";
import { classwiseGuide } from "./attendanceGuidePresets";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

interface ClasswiseStatusTabProps {
  schoolId: string;
}

type ClasswiseViewMode = "card" | "list";

function classwiseStats(s: { total: number; present: number; absent: number }) {
  const marked = s.present + s.absent;
  const unmarked = s.total - marked;
  const attendancePercent = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
  return { marked, unmarked, attendancePercent };
}

export default function ClasswiseStatusTab({ schoolId }: ClasswiseStatusTabProps) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [statusData, setStatusData] = useState<any[] | null>(null);
  const [viewMode, setViewMode] = useState<ClasswiseViewMode>("list");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFetchData = async () => {
    setIsLoading(true);
    setStatusData(null);
    setErrorMessage("");
    try {
      const q = query(collection(db, "schools", schoolId, "students"));
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map(doc => doc.data() as any);

      // Group by Class and Section
      const groups: Record<string, { classId: string, section: string, total: number, present: number, absent: number }> = {};

      for (let s of students) {
        const classId = String(s.classId || "").trim();
        const section = String(s.section || "").trim().toUpperCase();
        
        if (!classId) continue;
        
        const key = `${classId}-${section}`;
        if (!groups[key]) {
          groups[key] = { classId, section, total: 0, present: 0, absent: 0 };
        }
        
        groups[key].total++;
        if (s.attendance?.presentDates?.includes(date)) {
          groups[key].present++;
        } else if (s.attendance?.absentDates?.includes(date)) {
          groups[key].absent++;
        }
      }

      const results = Object.values(groups);
      
      // Sort by classId numeric value if possible, then section
      results.sort((a, b) => {
        const aNum = parseInt(a.classId);
        const bNum = parseInt(b.classId);
        if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) return aNum - bNum;
        if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
        return a.section.localeCompare(b.section);
      });

      setStatusData(results);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to load classwise status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 px-5 pb-5 pt-3 shadow-sm w-full min-w-0">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            />
          </div>
          <button
            onClick={handleFetchData}
            disabled={isLoading}
            className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-70"
          >
            {isLoading ? <RotateCw size={14} className="animate-spin" /> : <Search size={14} />}
            {isLoading ? "Loading..." : "Check Status"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={16} className="text-rose-500" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {!statusData && !isLoading ? <AttendanceTabGuide {...classwiseGuide} /> : null}
      {isLoading && !statusData ? <AttendanceTabLoading label="Checking class status…" /> : null}

      {statusData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2 min-w-0">
              <Users className="text-[#144835] shrink-0" size={18} />
              <span className="truncate">Overview for {date}</span>
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
            <div className="text-center py-10 text-gray-500 font-bold">No students found for this school.</div>
          ) : viewMode === "card" ? (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {statusData.map((s, idx) => {
                const { unmarked, attendancePercent } = classwiseStats(s);

                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200/60 pb-2">
                      <span className="font-bold text-gray-800 text-sm tracking-wide">{gradeLabel(s.classId)} - {s.section}</span>
                      <span className="text-xs font-black text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-full">{s.total}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Present
                        </span>
                        <span className="font-bold text-gray-800">{s.present}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-rose-500"></div> Absent
                        </span>
                        <span className="font-bold text-gray-800">{s.absent}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div> Unmarked
                        </span>
                        <span className="font-bold text-gray-800">{unmarked}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attendance %</span>
                        <span className={cn(
                          "text-sm font-black",
                          attendancePercent >= 90 ? "text-emerald-600" :
                          attendancePercent >= 75 ? "text-amber-600" : "text-rose-600"
                        )}>{attendancePercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            attendancePercent >= 90 ? "bg-emerald-500" :
                            attendancePercent >= 75 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${attendancePercent}%` }}
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
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Total</th>
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Present</th>
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Absent</th>
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Unmarked</th>
                    <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {statusData.map((s, idx) => {
                    const { unmarked, attendancePercent } = classwiseStats(s);
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-bold text-gray-800">{gradeLabel(s.classId)}</td>
                        <td className="px-4 py-3 font-medium text-gray-600">{s.section}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-800">{s.total}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700">{s.present}</td>
                        <td className="px-4 py-3 text-center font-bold text-rose-700">{s.absent}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-600">{unmarked}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex min-w-[3rem] justify-center px-2 py-1 rounded-md text-xs font-bold",
                            attendancePercent >= 90 ? "bg-emerald-100 text-emerald-700" :
                            attendancePercent >= 75 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {attendancePercent}%
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
