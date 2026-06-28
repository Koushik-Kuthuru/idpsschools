"use client";

import React, { useState } from "react";


import { Search, RotateCw, Download, FileText, AlertCircle } from "lucide-react";
import AttendanceTabGuide, { AttendanceTabLoading } from "./AttendanceTabGuide";
import { continuousGuide } from "./attendanceGuidePresets";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildPath, buildQuery, fetchMany, db, auth } from "@/lib/db-client";


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

interface ContinuousAbsentTabProps {
  schoolId: string;
  classOptions: string[];
  sectionOptions: string[];
  holidays: string[];
}

export default function ContinuousAbsentTab({ schoolId, classOptions, sectionOptions, holidays }: ContinuousAbsentTabProps) {
  const [minDays, setMinDays] = useState<number>(3);
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [selectedSection, setSelectedSection] = useState<string>("All");
  
  const [streakData, setStreakData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFetchData = async () => {
    setIsLoading(true);
    setStreakData(null);
    setErrorMessage("");
    try {
      const q = buildQuery(buildPath(db, "schools", schoolId, "students"));
      const snapshot = await fetchMany(q);
      const students = snapshot.docs.map((buildPath: any) => ({ id: buildPath.id, ...buildPath.data() as any }));

      const filtered = students.filter(s => {
        const classId = String(s.classId || "").trim();
        const sec = String(s.section || "").trim().toUpperCase();
        const matchClass = selectedClass === "All" || classId === selectedClass;
        const matchSection = selectedSection === "All" || sec === selectedSection;
        return matchClass && matchSection;
      });

      const today = new Date();
      today.setHours(0,0,0,0);

      const results: {
        id: string;
        roll: string;
        admNo: string;
        name: string;
        classId: string;
        section: string;
        contact: string;
        streak: number;
        lastPresent: string;
      }[] = [];

      for (let s of filtered) {
        let absentDates = s.attendance?.absentDates || [];
        if (absentDates.length === 0) continue;

        // Sort absent dates descending
        absentDates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
        
        let currentStreak = 0;
        let checkDate = new Date(today);

        // Calculate consecutive absent streak backward from today
        // Skipping holidays and sundays
        while (currentStreak < 30) { // arbitrary limitTo to prevent infinite loops
          const dateStr = checkDate.toISOString().split('T')[0];
          
          if (holidays.includes(dateStr) || checkDate.getDay() === 0) {
            // It's a holiday/sunday, step back but don't break streak
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }

          if (absentDates.includes(dateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            // Not absent on this working day, break streak
            break;
          }
        }

        if (currentStreak >= minDays) {
          // Find last present date
          let presentDates = s.attendance?.presentDates || [];
          presentDates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
          const lastPresent = presentDates.length > 0 ? presentDates[0] : "Never";

          results.push({
            id: s.id,
            roll: String(s.rollNumber || "-"),
            admNo: String(s.admissionNumber || "-"),
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed',
            classId: s.classId || "-",
            section: s.section || "-",
            contact: s.contactNumber || s.parentPhone || "Not Available",
            streak: currentStreak,
            lastPresent
          });
        }
      }

      // Sort by streak descending, then name
      results.sort((a: any, b: any) => {
        if (b.streak !== a.streak) return b.streak - a.streak;
        return a.name.localeCompare(b.name);
      });

      setStreakData(results);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to load continuous absentee data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!streakData || streakData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(streakData.map(row => ({
      "Student Name": row.name,
      "Class": gradeLabel(row.classId),
      "Section": row.section,
      "Roll No": row.roll,
      "Consecutive Days Absent": row.streak,
      "Last Present Date": row.lastPresent,
      "Contact": row.contact
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consecutive Absentees");
    XLSX.writeFile(wb, `Consecutive_Absentees_Min${minDays}Days.xlsx`);
  };

  const handleExportPDF = () => {
    if (!streakData || streakData.length === 0) return;
    const buildPath = new jsPDF();
    const title = `Consecutive Absentees (Minimum ${minDays} days)`;
    buildPath.setFontSize(14);
    buildPath.text(title, 14, 15);
    
    const tableData = streakData.map((row, idx) => [
      idx + 1, row.name, gradeLabel(row.classId), row.section, row.streak, row.lastPresent, row.contact
    ]);
    
    autoTable(buildPath, {
      startY: 20,
      head: [["#", "Name", "Class", "Section", "Streak (Days)", "Last Present", "Contact"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [20, 72, 53] }
    });
    
    buildPath.save(`Consecutive_Absentees_Min${minDays}Days.pdf`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Continuous Date Absent Summary</h3>
        <p className="text-xs text-gray-500">Identify students who are currently on an absence streak.</p>
        
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min. Consecutive Days</label>
            <input
              type="number"
              min="1"
              max="30"
              value={minDays}
              onChange={(e) => setMinDays(parseInt(e.target.value) || 1)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            >
              <option value="All">All Classes</option>
              {classOptions.map((g) => (
                <option key={g} value={g}>{gradeLabel(g)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            >
              <option value="All">All Sections</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleFetchData}
            disabled={isLoading}
            className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-70"
          >
            {isLoading ? <RotateCw size={14} className="animate-spin" /> : <Search size={14} />}
            {isLoading ? "Loading..." : "Generate"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={16} className="text-rose-500" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {!streakData && !isLoading ? <AttendanceTabGuide {...continuousGuide} /> : null}
      {isLoading && !streakData ? <AttendanceTabLoading label="Finding streaks…" /> : null}

      {streakData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FileText size={16} className="text-[#144835]" />
              Found {streakData.length} students
            </h3>
            {streakData.length > 0 && (
              <div className="flex items-center bg-[#144835]/5 rounded-lg p-1 border border-[#144835]/10">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#144835] hover:bg-[#144835]/10 rounded-md transition-all"
                >
                  <Download size={14} />
                  PDF
                </button>
                <div className="w-[1px] h-4 bg-[#144835]/20 mx-1"></div>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#144835] hover:bg-[#144835]/10 rounded-md transition-all"
                >
                  <Download size={14} />
                  Excel
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse text-[13px] whitespace-nowrap">
              <thead className="sticky top-0 bg-gray-100/90 backdrop-blur-sm z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Adm. No.</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Name</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Class</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Streak (Days)</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Last Present</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Contact Number</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {streakData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">No students currently meet this criteria.</td>
                  </tr>
                ) : (
                  streakData.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-rose-50/30">
                      <td className="px-4 py-3 font-medium text-gray-600">{row.admNo}</td>
                      <td className="px-4 py-3 font-bold text-gray-800">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600">{gradeLabel(row.classId)} - {row.section}</td>
                      <td className="px-4 py-3 font-black text-rose-600 text-center text-lg">{row.streak}</td>
                      <td className="px-4 py-3 font-medium text-gray-500">{row.lastPresent}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{row.contact}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
