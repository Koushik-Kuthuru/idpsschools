"use client";

import React, { useMemo } from "react";
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StaffAttendanceLogTabProps {
  presentDates: string[];
  absentDates: string[];
}

export default function StaffAttendanceLogTab({ presentDates = [], absentDates = [] }: StaffAttendanceLogTabProps) {
  const stats = useMemo(() => {
    const total = presentDates.length + absentDates.length;
    const percentage = total > 0 ? Math.round((presentDates.length / total) * 100) : 0;
    return {
      present: presentDates.length,
      absent: absentDates.length,
      total,
      percentage
    };
  }, [presentDates, absentDates]);

  // Generate calendar dates for the current month
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    type CalendarDay =
      | {
          day: number;
          date: string;
          status: string;
          isToday: boolean;
        }
      | null;
    const days: CalendarDay[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      let status = "none";
      if (presentDates.includes(dateStr)) status = "present";
      else if (absentDates.includes(dateStr)) status = "absent";
      
      days.push({
        day: i,
        date: dateStr,
        status,
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }
    return days;
  }, [currentMonth, currentYear, daysInMonth, firstDayOfMonth, presentDates, absentDates, today]);

  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Days Present</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-xl font-extrabold text-gray-900">{stats.present}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Days Absent</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-xl font-extrabold text-gray-900">{stats.absent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarDays size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance %</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-xl font-extrabold text-gray-900">{stats.percentage}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">{monthName} Overview</h3>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d: any) => (
            <div key={d} className="text-center text-xs font-bold text-gray-500 py-2">
              {d}
            </div>
          ))}
          {calendarDays.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} className="h-12 rounded-lg bg-gray-50/50" />;
            return (
              <div 
                key={d.date} 
                className={cn(
                  "h-12 rounded-lg border flex flex-col items-center justify-center gap-1",
                  d.status === 'present' ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                  d.status === 'absent' ? "bg-rose-50 border-rose-200 text-rose-700" :
                  "bg-white border-gray-100 text-gray-600",
                  d.isToday && "ring-2 ring-[#144835] ring-offset-1"
                )}
                title={d.date}
              >
                <span className="text-sm font-bold">{d.day}</span>
                {d.status === 'present' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {d.status === 'absent' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
