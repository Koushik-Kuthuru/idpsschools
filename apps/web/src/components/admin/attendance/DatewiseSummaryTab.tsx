"use client";

import React, { useState } from "react";


import { Search, RotateCw, Download, FileText, AlertCircle } from "lucide-react";
import AttendanceTabGuide, { AttendanceTabLoading } from "./AttendanceTabGuide";
import { datewiseGuide } from "./attendanceGuidePresets";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildPath, buildQuery, fetchMany, db, auth } from "@/lib/db-client";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DatewiseSummaryTabProps {
  schoolId: string;
  holidays: string[];
}

export default function DatewiseSummaryTab({ schoolId, holidays }: DatewiseSummaryTabProps) {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  const [summaryData, setSummaryData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFetchData = async () => {
    setIsLoading(true);
    setSummaryData(null);
    setErrorMessage("");
    try {
      const q = buildQuery(buildPath(db, "schools", schoolId, "students"));
      const snapshot = await fetchMany(q);
      const students = snapshot.docs.map((buildPath: any) => buildPath.data() as any);

      const start = new Date(fromDate);
      const end = new Date(toDate);
      const dataMap: Record<string, { total: number; present: number; absent: number }> = {};
      
      let current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        if (!holidays.includes(dateStr) && current.getDay() !== 0) {
          dataMap[dateStr] = { total: 0, present: 0, absent: 0 };
        }
        current.setDate(current.getDate() + 1);
      }

      for (let s of students) {
        for (let dateStr of Object.keys(dataMap)) {
          dataMap[dateStr].total++;
          if (s.attendance?.presentDates?.includes(dateStr)) {
            dataMap[dateStr].present++;
          } else if (s.attendance?.absentDates?.includes(dateStr)) {
            dataMap[dateStr].absent++;
          }
        }
      }

      const rows = Object.keys(dataMap)
        .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())
        .map(dateStr => {
          const m = dataMap[dateStr];
          const marked = m.present + m.absent;
          const absentPercent = marked > 0 ? ((m.absent / marked) * 100).toFixed(1) : "0.0";
          return {
            date: dateStr,
            totalStudents: m.total,
            present: m.present,
            absent: m.absent,
            unmarked: m.total - marked,
            absentPercent: `${absentPercent}%`
          };
        });

      setSummaryData(rows);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to load datewise summary.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!summaryData || summaryData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(summaryData.map(row => ({
      "Date": row.date,
      "Total Students": row.totalStudents,
      "Present": row.present,
      "Absent": row.absent,
      "Unmarked": row.unmarked,
      "Absent %": row.absentPercent
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datewise Summary");
    XLSX.writeFile(wb, `Datewise_Summary_${fromDate}_to_${toDate}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!summaryData || summaryData.length === 0) return;
    const buildPath = new jsPDF();
    const title = `Datewise Absent Summary: ${fromDate} to ${toDate}`;
    buildPath.setFontSize(14);
    buildPath.text(title, 14, 15);
    
    const tableData = summaryData.map((row) => [
      row.date, row.totalStudents, row.present, row.absent, row.unmarked, row.absentPercent
    ]);
    
    autoTable(buildPath, {
      startY: 20,
      head: [["Date", "Total Students", "Present", "Absent", "Unmarked", "Absent %"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [20, 72, 53] }
    });
    
    buildPath.save(`Datewise_Summary_${fromDate}_to_${toDate}.pdf`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Datewise Absent Summary</h3>
        
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            />
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

      {!summaryData && !isLoading ? <AttendanceTabGuide {...datewiseGuide} /> : null}
      {isLoading && !summaryData ? <AttendanceTabLoading label="Generating summary…" /> : null}

      {summaryData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FileText size={16} className="text-[#144835]" />
              Summary Statistics
            </h3>
            {summaryData.length > 0 && (
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] whitespace-nowrap">
              <thead className="bg-gray-100/90 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Date</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Total Students</th>
                  <th className="px-4 py-3 font-bold text-emerald-700 border-b border-gray-200 text-center">Present</th>
                  <th className="px-4 py-3 font-bold text-rose-700 border-b border-gray-200 text-center">Absent</th>
                  <th className="px-4 py-3 font-bold text-gray-400 border-b border-gray-200 text-center">Unmarked</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-center">Absent %</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {summaryData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">No working days found in the selected date range.</td>
                  </tr>
                ) : (
                  summaryData.map((row) => (
                    <tr key={row.date} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-gray-800">{row.date}</td>
                      <td className="px-4 py-3 font-bold text-gray-600 text-center">{row.totalStudents}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 text-center">{row.present}</td>
                      <td className="px-4 py-3 font-bold text-rose-600 text-center bg-rose-50/30">{row.absent}</td>
                      <td className="px-4 py-3 font-bold text-gray-400 text-center">{row.unmarked}</td>
                      <td className="px-4 py-3 font-black text-[#144835] text-center">{row.absentPercent}</td>
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
