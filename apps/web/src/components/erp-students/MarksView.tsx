"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminPageHeader from "@/components/admin/PageHeader";
import { 
  ClipboardList, 
  Award, 
  BookOpen, 
  Download, 
  ArrowUpRight, 
  CalendarDays,
  ShieldCheck
} from "lucide-react";

export default function MarksView() {
  const { user } = useAuth();
  const student: any = user || {};
  const [selectedTerm, setSelectedTerm] = useState("Term 1");

  const termsData: any = {
    "Term 1": [
      { name: "English Literature", type: "Core", maxMarks: 100, marksObtained: 88, grade: "A" },
      { name: "Mathematics", type: "Core", maxMarks: 100, marksObtained: 92, grade: "A+" },
      { name: "Science (Physics)", type: "Core", maxMarks: 100, marksObtained: 85, grade: "A" },
      { name: "Chemistry", type: "Core", maxMarks: 100, marksObtained: 78, grade: "B" },
      { name: "History & Civics", type: "Core", maxMarks: 100, marksObtained: 91, grade: "A+" },
      { name: "Computer Science", type: "Elective", maxMarks: 100, marksObtained: 95, grade: "A+" },
    ],
    "Term 2": [
      { name: "English Literature", type: "Core", maxMarks: 100, marksObtained: 90, grade: "A+" },
      { name: "Mathematics", type: "Core", maxMarks: 100, marksObtained: 89, grade: "A" },
      { name: "Science (Physics)", type: "Core", maxMarks: 100, marksObtained: 87, grade: "A" },
      { name: "Chemistry", type: "Core", maxMarks: 100, marksObtained: 81, grade: "B+" },
      { name: "History & Civics", type: "Core", maxMarks: 100, marksObtained: 93, grade: "A+" },
      { name: "Computer Science", type: "Elective", maxMarks: 100, marksObtained: 98, grade: "A+" },
    ]
  };

  const activeMarks = termsData[selectedTerm] || [];
  const averagePct = Math.round(activeMarks.reduce((sum: number, val: any) => sum + val.marksObtained, 0) / activeMarks.length);

  return (
    <div className="erp-body space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Marks"
        description="Detailed grades and report card for each term"
        actions={
          <div className="flex gap-2">
            {["Term 1", "Term 2"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setSelectedTerm(term)}
                className={`h-10 px-4 rounded-lg text-xs font-bold transition-all border ${
                  selectedTerm === term
                    ? "bg-[#144835] text-white border-[#144835]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        }
      />

      {/* Bento Stats Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GPA Summary */}
        <div className="bg-white border border-gray-100 p-6 rounded-[16px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#a2c144]/10 rounded-full blur-3xl pointer-events-none" />
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GPA Equivalent</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-[#144835]">{averagePct >= 90 ? "3.9" : "3.7"}</span>
              <span className="text-xs font-extrabold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight size={10} /> +0.2
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-4">
            Based on current term average of {averagePct}%
          </div>
        </div>

        {/* Academic Rank */}
        <div className="bg-white border border-gray-100 p-6 rounded-[16px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Rank</span>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-14 h-14 rounded-full bg-[#F8FAFB] flex items-center justify-center border-4 border-[#a2c144]/20 text-md font-bold text-[#144835]">
                04
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Top 5% Student</p>
                <p className="text-xs text-gray-500 font-bold uppercase mt-0.5">Out of 120 students in grade</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-4 flex items-center gap-1.5">
            <Award size={13} className="text-[#a2c144]" /> Elite Academic Circle
          </div>
        </div>

        {/* Seating Arrangement */}
        <div className="bg-amber-50/20 border border-dashed border-amber-200 p-6 rounded-[16px] flex flex-col justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="text-amber-800 shrink-0" size={16} />
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Exam Seating Center</h3>
          </div>
          <p className="text-xs text-amber-950 font-bold leading-normal">
            Room: <span className="underline">Block A, Hall 2</span> | Seat: <span className="underline">A-14</span>
          </p>
          <p className="text-xs text-amber-700 font-bold uppercase mt-2">
            Roll Number: {student.rollNumber || "-"}
          </p>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white border border-gray-100 rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB] flex justify-between items-center">
          <h3 className="text-xs font-bold text-[#144835] uppercase tracking-wider">Report Details: {selectedTerm}</h3>
          <button 
            onClick={() => alert("Report downloaded successfully!")}
            className="flex items-center gap-1 text-xs font-bold text-[#144835] uppercase tracking-wider hover:underline"
          >
            <Download size={12} />
            Download Marksheet
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Subject Type</th>
                <th className="px-6 py-3 text-center">Max Marks</th>
                <th className="px-6 py-3 text-center">Obtained</th>
                <th className="px-6 py-3 text-center">Percentage</th>
                <th className="px-6 py-3 text-right">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
              {activeMarks.map((row: any, idx: number) => {
                const percentage = Math.round((row.marksObtained / row.maxMarks) * 100);
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[#144835]">{row.name}</td>
                    <td className="px-6 py-4 text-gray-400">{row.type}</td>
                    <td className="px-6 py-4 text-center">{row.maxMarks}</td>
                    <td className="px-6 py-4 text-center text-gray-900 font-extrabold">{row.marksObtained}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#144835] h-full rounded-full" 
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                        <span className="text-gray-900 font-extrabold text-xs w-8">{percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        row.grade.includes("A") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        row.grade.includes("B") ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        "bg-gray-50 text-gray-600 border border-gray-200"
                      }`}>
                        {row.grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
