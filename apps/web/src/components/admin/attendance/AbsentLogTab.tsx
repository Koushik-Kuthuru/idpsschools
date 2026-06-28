"use client";

import React, { useState } from "react";


import { Search, RotateCw, Download, FileText, AlertCircle } from "lucide-react";
import AttendanceTabGuide, { AttendanceTabLoading } from "./AttendanceTabGuide";
import { absentLogGuide } from "./attendanceGuidePresets";
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

interface AbsentLogTabProps {
  schoolId: string;
  classOptions: string[];
  sectionOptions: string[];
  holidays: string[];
}

export default function AbsentLogTab({ schoolId, classOptions, sectionOptions, holidays }: AbsentLogTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [selectedSection, setSelectedSection] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("Select attendance type");
  
  const attendanceTypes = [
    "Select attendance type",
    "Present",
    "Absent",
    "Leave",
    "Half Day",
    "Late",
    "Holiday",
    "Blank",
    "N/A",
    "NIWD"
  ];
  
  const [logData, setLogData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFetchData = async () => {
    setIsLoading(true);
    setLogData(null);
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

      const records: {
        id: string;
        date: string;
        roll: string;
        admNo: string;
        name: string;
        classId: string;
        section: string;
        contact: string;
        status: string;
      }[] = [];
      const datesInRange = [selectedDate];

      for (let s of filtered) {
        let datesToCheck: { date: string, status: string }[] = [];
        
        const addDates = (arr: string[] | undefined, statusStr: string) => {
          if (arr) {
            arr.forEach((d: any) => datesToCheck.push({ date: d, status: statusStr }));
          }
        };

        const isAll = selectedType === "Select attendance type";

        if (isAll || selectedType === "Absent") addDates(s.attendance?.absentDates, "Absent");
        if (isAll || selectedType === "Present") addDates(s.attendance?.presentDates, "Present");
        if (isAll || selectedType === "Leave") addDates(s.attendance?.leaveDates, "Leave");
        if (isAll || selectedType === "Half Day") addDates(s.attendance?.halfDayDates, "Half Day");
        if (isAll || selectedType === "Late") addDates(s.attendance?.lateDates, "Late");

        if (isAll || selectedType === "Holiday") {
          datesInRange.forEach((d: any) => {
            if (holidays.includes(d) || new Date(d).getDay() === 0) {
              datesToCheck.push({ date: d, status: "Holiday" });
            }
          });
        }

        for (let record of datesToCheck) {
          if (record.date === selectedDate) {
            records.push({
              id: `${s.id}-${record.date}-${record.status}`,
              date: record.date,
              roll: String(s.rollNumber || "-"),
              admNo: String(s.admissionNumber || "-"),
              name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed',
              classId: s.classId || "-",
              section: s.section || "-",
              contact: s.contactNumber || s.parentPhone || "Not Available",
              status: record.status
            });
          }
        }
      }

      // Sort by date descending, then name
      records.sort((a: any, b: any) => {
        if (a.date !== b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
        return a.name.localeCompare(b.name);
      });

      setLogData(records);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to load absent log. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!logData || logData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(logData.map(row => ({
      "Date": row.date,
      "Student Name": row.name,
      "Class": gradeLabel(row.classId),
      "Section": row.section,
      "Roll No": row.roll,
      "Contact": row.contact,
      "Type": row.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Log");
    XLSX.writeFile(wb, `Attendance_Log_${selectedDate}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!logData || logData.length === 0) return;
    const buildPath = new jsPDF();
    const title = `Attendance Log: ${selectedDate}`;
    buildPath.setFontSize(14);
    buildPath.text(title, 14, 15);
    
    const tableData = logData.map((row, idx) => [
      idx + 1, row.date, row.name, gradeLabel(row.classId), row.section, row.roll, row.contact, row.status
    ]);
    
    autoTable(buildPath, {
      startY: 20,
      head: [["#", "Date", "Name", "Class", "Section", "Roll No", "Contact", "Type"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [20, 72, 53] }
    });
    
    buildPath.save(`Attendance_Log_${selectedDate}.pdf`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 px-5 pb-5 pt-3 shadow-sm w-full min-w-0">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            >
              {attendanceTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            >
              <option value="All">All</option>
              {classOptions.map((g) => (
                <option key={g} value={g}>{gradeLabel(g)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[110px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            >
              <option value="All">All</option>
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

      {!logData && !isLoading ? <AttendanceTabGuide {...absentLogGuide} /> : null}
      {isLoading && !logData ? <AttendanceTabLoading label="Generating absent log…" /> : null}

      {logData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FileText size={16} className="text-[#144835]" />
              Found {logData.length} records
            </h3>
            {logData.length > 0 && (
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
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Date</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Adm. No.</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Name</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Class</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Contact Number</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {logData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">No records found for the selected criteria.</td>
                  </tr>
                ) : (
                  logData.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-rose-50/30">
                      <td className="px-4 py-3 font-bold text-gray-800">{row.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-600">{row.admNo}</td>
                      <td className="px-4 py-3 font-bold text-gray-800">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600">{gradeLabel(row.classId)} - {row.section}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{row.contact}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-bold",
                          row.status === 'Present' ? "bg-emerald-100 text-emerald-700" :
                          row.status === 'Absent' ? "bg-rose-100 text-rose-700" :
                          row.status === 'Holiday' ? "bg-[#84c18c] text-white" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {row.status}
                        </span>
                      </td>
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
