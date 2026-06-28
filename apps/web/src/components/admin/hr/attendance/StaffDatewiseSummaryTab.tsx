"use client";

import React, { useState, useEffect } from "react";


import { Search, CalendarDays } from "lucide-react";
import { buildPath, buildQuery, fetchMany, sortBy, limitTo, db, auth } from "@/lib/db-client";


interface StaffDatewiseSummaryTabProps {
  schoolId: string;
}

export default function StaffDatewiseSummaryTab({ schoolId }: StaffDatewiseSummaryTabProps) {
  const [staffType, setStaffType] = useState<"teachers" | "non-teaching-staff" | "all">("all");
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) {
      loadSummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, staffType]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (staffType === "all" || staffType === "teachers") {
        const tSnap = await fetchMany(buildQuery(buildPath(db, "schools", schoolId, "teachers")));
        data = [...data, ...tSnap.docs.map((d: any) => d.data())];
      }
      if (staffType === "all" || staffType === "non-teaching-staff") {
        const ntSnap = await fetchMany(buildQuery(buildPath(db, "schools", schoolId, "non-teaching-staff")));
        data = [...data, ...ntSnap.docs.map((d: any) => d.data())];
      }

      // Aggregate dates
      const dateMap: Record<string, { present: number, absent: number }> = {};
      
      data.forEach(staff => {
        const presents: string[] = staff.attendance?.presentDates || [];
        const absents: string[] = staff.attendance?.absentDates || [];
        
        presents.forEach((d: any) => {
          if (!dateMap[d]) dateMap[d] = { present: 0, absent: 0 };
          dateMap[d].present += 1;
        });
        
        absents.forEach((d: any) => {
          if (!dateMap[d]) dateMap[d] = { present: 0, absent: 0 };
          dateMap[d].absent += 1;
        });
      });

      // Convert to array and sort by date descending
      const chartData = Object.entries(dateMap)
        .map(([date, counts]) => ({
          date,
          present: counts.present,
          absent: counts.absent,
          total: counts.present + counts.absent
        }))
        .sort((a: any, b: any) => b.date.localeCompare(a.date))
        .slice(0, 30); // Last 30 dates

      setSummaryData(chartData.reverse()); // Reverse for chart (chronological left to right)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Type</label>
            <select
              value={staffType}
              onChange={(e) => setStaffType(e.target.value as any)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
            >
              <option value="all">All Staff</option>
              <option value="teachers">Teaching Staff Only</option>
              <option value="non-teaching-staff">Non-Teaching Staff Only</option>
            </select>
          </div>
          <button
            onClick={loadSummary}
            disabled={loading}
            className="h-10 px-6 rounded-lg bg-[#144835] text-white font-bold text-sm hover:bg-[#144835]/90 transition-colors shadow-md shadow-[#144835]/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Search size={16} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarDays size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">30-Day Attendance Trend</h3>
            <p className="text-sm text-gray-500 mt-0.5">Overview of present vs absent staff</p>
          </div>
        </div>

        {summaryData.length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {summaryData.map((data, index) => {
              const presentPct = data.total > 0 ? (data.present / data.total) * 100 : 0;
              const absentPct = data.total > 0 ? (data.absent / data.total) * 100 : 0;
              
              return (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                  <div className="w-24 text-sm font-bold text-gray-700 shrink-0">
                    {data.date}
                  </div>
                  
                  <div className="flex-1 w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
                    {presentPct > 0 && <div style={{ width: `${presentPct}%` }} className="h-full bg-emerald-500" title={`Present: ${data.present}`} />}
                    {absentPct > 0 && <div style={{ width: `${absentPct}%` }} className="h-full bg-rose-500" title={`Absent: ${data.absent}`} />}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold shrink-0 w-32 justify-end">
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{data.present} P</span>
                    <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">{data.absent} A</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <div className="text-center text-gray-500 font-medium">
              {loading ? "Loading graph data..." : "No attendance data found to chart."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
