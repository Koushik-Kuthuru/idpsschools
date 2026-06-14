"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  ArrowUpRight, 
  AlertTriangle, 
  Award, 
  Download, 
  Sparkles,
  Info
} from "lucide-react";

export default function AttendanceView() {
  const { user } = useAuth();
  const student = user || {};

  const subjects = [
    { name: "English Literature", conducted: 40, attended: 38, absent: 2, pct: 95.0, status: "Good" },
    { name: "Mathematics", conducted: 45, attended: 36, absent: 9, pct: 80.0, status: "Low" },
    { name: "Science (Physics)", conducted: 42, attended: 40, absent: 2, pct: 95.2, status: "Good" },
    { name: "History & Civics", conducted: 35, attended: 32, absent: 3, pct: 91.4, status: "Good" },
    { name: "Fine Arts", conducted: 20, attended: 20, absent: 0, pct: 100.0, status: "Perfect" },
    { name: "Physical Education", conducted: 25, attended: 24, absent: 1, pct: 96.0, status: "Good" },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-jost space-y-4">
      {/* Page Header */}
      <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">Attendance Analysis</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Detailed breakdown of academic presence for the current term</p>
        </div>
        <button 
          onClick={() => alert("Report download simulated successfully!")}
          className="flex items-center gap-2 px-4 py-2 bg-[#144835] text-white hover:bg-[#144835]/90 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-[#144835]/20"
        >
          <Download size={14} />
          Download Report
        </button>
      </div>

      {/* Bento Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Overall Attendance Card */}
        <div className="md:col-span-5 bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#a2c144]/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          
          <div className="relative z-10">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Attendance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-[#144835]">92.5%</span>
              <span className="text-xs font-extrabold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight size={10} /> +2.1%
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-3 relative z-10">
            <div className="flex justify-between items-end text-xs font-bold">
              <span className="text-gray-500 uppercase tracking-wider">Progress toward 85% Target</span>
              <span className="text-[#144835] uppercase tracking-wider">Goal Surpassed</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#144835] rounded-full transition-all duration-500" style={{ width: "92.5%" }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 font-extrabold">
              <span>0%</span>
              <span className="text-[#a2c144] font-bold">MINIMUM TARGET 85%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Comparative Analytics Card */}
        <div className="md:col-span-4 bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Standing</span>
            <div className="flex items-center gap-4 mt-3">
              <div className="w-14 h-14 rounded-full bg-[#F8FAFB] flex items-center justify-center border-4 border-[#a2c144]/20 text-md font-bold text-[#144835]">
                8th
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Out of 45 Students</p>
                <p className="text-xs text-gray-500 font-bold uppercase mt-0.5">Top 20% of class presence</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider italic">
            <Award size={14} className="text-[#a2c144]" />
            "On track for Excellent Attendance Award"
          </div>
        </div>

        {/* Attendance Alert Card */}
        <div className="md:col-span-3 bg-red-50/20 border border-dashed border-red-200 p-6 rounded-[16px] flex flex-col justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-600 shrink-0 animate-bounce" size={16} />
            <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide">Eligibility Warning</h3>
          </div>
          <p className="text-xs text-red-950 font-medium leading-relaxed">
            Mathematics attendance is currently at <span className="font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">80%</span>. A minimum of 85% is required for exam eligibility.
          </p>
        </div>
      </div>

      {/* Subject-Wise Table */}
      <div className="bg-white border border-gray-100 rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB] flex justify-between items-center">
          <h3 className="text-xs font-bold text-[#144835] uppercase tracking-wider">Subject-Wise Breakdown</h3>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5" /> Normal
            </span>
            <span className="inline-flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-1.5" /> Action Needed
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Subject Name</th>
                <th className="px-6 py-3">Conducted</th>
                <th className="px-6 py-3">Attended</th>
                <th className="px-6 py-3">Absent</th>
                <th className="px-6 py-3">Percentage</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
              {subjects.map((sub, idx) => {
                const isAlert = sub.pct < 85;
                return (
                  <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${isAlert ? 'bg-red-50/10' : ''}`}>
                    <td className="px-6 py-4 text-sm font-bold text-[#144835]">{sub.name}</td>
                    <td className="px-6 py-4">{sub.conducted}</td>
                    <td className="px-6 py-4">{sub.attended}</td>
                    <td className="px-6 py-4 text-gray-400">{sub.absent}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isAlert ? 'bg-red-500' : 'bg-[#144835]'}`} 
                            style={{ width: `${sub.pct}%` }} 
                          />
                        </div>
                        <span className={isAlert ? 'text-red-600 font-extrabold' : 'text-gray-900 font-extrabold'}>{sub.pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        sub.status === "Perfect" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                        sub.status === "Good" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {sub.status}
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
