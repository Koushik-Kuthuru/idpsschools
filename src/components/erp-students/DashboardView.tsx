"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Star, 
  Calendar, 
  Wallet, 
  Clock, 
  BookOpen, 
  Megaphone, 
  ArrowRight,
  TrendingUp,
  FileText,
  CreditCard,
  History,
  CalendarDays
} from "lucide-react";

export default function DashboardView() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const student: any = user || {};
  
  const schoolId = React.useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpscherukupalli";
  }, [pathname]);

  const initials = student.studentName
    ? student.studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "ST";

  // Calculations
  const lastYearDue = parseInt(student.feeDetails?.lastYearDue || "0", 10);
  const transportFees = student.transportDetails?.fees || [];
  const transportTotal = transportFees.reduce((sum: number, val: string) => sum + (parseInt(val, 10) || 0), 0);
  const feeGrid = student.feeDetails?.feeGrid || [];
  const gridTotal = feeGrid.reduce((sum: number, row: any) => {
    const rowSum = row.values?.reduce((acc: number, val: string) => acc + (parseInt(val, 10) || 0), 0) || 0;
    return sum + rowSum;
  }, 0);
  const grandTotalFees = gridTotal + lastYearDue + transportTotal;
  const pendingAmount = grandTotalFees - Math.round(grandTotalFees * 0.7);

  const performanceSubjects = [
    { name: "Mathematics", pct: 95 },
    { name: "Fine Arts", pct: 92 },
    { name: "Science (Physics)", pct: 89 },
    { name: "English Literature", pct: 88 },
    { name: "History & Civics", pct: 80 }
  ];

  const quickActions = [
    { label: "View My Marks", href: `/schools/${schoolId}/students/marks`, icon: Star, primary: false },
    { label: "Pay Fee Now", href: `/schools/${schoolId}/students/fees`, icon: CreditCard, primary: true },
    { label: "Attendance Log", href: `/schools/${schoolId}/students/attendance`, icon: Calendar, primary: false },
    { label: "Download Receipt", href: `/schools/${schoolId}/students/documents`, icon: FileText, primary: false },
    { label: "My Timetable", href: `/schools/${schoolId}/students/timetable`, icon: Clock, primary: false },
    { label: "View Exam Dates", href: `/schools/${schoolId}/students/timetable`, icon: CalendarDays, primary: false },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-jost space-y-4">
      {/* Top Welcome Section */}
      <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
            Welcome, {student.studentName || "Student"}! <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Class: {student.classId || student.grade || "10-A"} | Section: {student.section || "-"} | School: {schoolId === "idpscherukupalli" ? "Cherukupalli" : "Kalaburagi"}
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 uppercase tracking-wider">
          Term 2 Active
        </span>
      </div>

      {/* Row of 3 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marks Card */}
        <div className="bg-white border-l-4 border-[#144835] border-y border-r border-gray-100 p-6 rounded-r-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Marks</span>
            <span className="text-3xl font-black text-[#144835] mt-1 block">3.8<span className="text-xs text-gray-400 font-bold">/4</span></span>
            <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">Grade A • Rank 4/120</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 bg-emerald-50 text-[#144835] rounded-lg border border-emerald-100">
              <Star size={16} />
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Top 15%</span>
          </div>
        </div>

        {/* Attendance Card */}
        <div className="bg-white border-l-4 border-[#a2c144] border-y border-r border-gray-100 p-6 rounded-r-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Attendance</span>
            <span className="text-3xl font-black text-gray-900 mt-1 block">92.5%</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">Average • Last: Present</span>
          </div>
          <div className="p-2 bg-[#a2c144]/15 text-[#144835] rounded-lg border border-[#a2c144]/30">
            <Calendar size={16} />
          </div>
        </div>

        {/* Fees Due Card */}
        <div className="bg-white border-l-4 border-red-500 border-y border-r border-gray-100 p-6 rounded-r-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Fees Due</span>
            <span className="text-3xl font-black text-red-600 mt-1 block">₹{pendingAmount.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">Next Payment: June 30, 2026</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100">
              <Wallet size={16} />
            </div>
            <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Overdue</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column, Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (8/12 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Performance Card */}
          <div className="bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-xs font-black text-[#144835] uppercase tracking-wider">Your Performance This Term</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Continuous Assessment Tracking</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Overall GPA</span>
                <p className="text-xl font-black text-[#144835]">3.8/4.0</p>
              </div>
            </div>

            <div className="space-y-4">
              {performanceSubjects.map((sub, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>{sub.name}</span>
                    <span>{sub.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#144835] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${sub.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-right">
              <Link 
                href={`/schools/${schoolId}/students/marks`}
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#144835] uppercase tracking-wider hover:underline"
              >
                View Details <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <h4 className="text-xs font-black text-[#144835] uppercase tracking-wider mb-4 border-l-4 border-[#144835] pl-2">Quick Actions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {quickActions.map((action, idx) => (
                <Link
                  key={idx}
                  href={action.href}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border text-center transition-all ${
                    action.primary 
                      ? "bg-[#144835] border-[#144835] text-white hover:bg-[#144835]/90 shadow-md shadow-[#144835]/20"
                      : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  <action.icon size={20} className={action.primary ? "text-[#a2c144] mb-2" : "text-gray-400 mb-2"} />
                  <span className="text-xs font-bold uppercase tracking-wider mt-1">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4/12 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Vertical status elements list */}
          <div className="bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] space-y-4">
            {/* Timetable card */}
            <div className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 group">
              <div className="p-3 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                <Clock size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Timetable</span>
                <span className="text-xs font-black text-gray-900 block mt-0.5">Today: 2 classes</span>
                <span className="text-[10px] text-gray-500 font-bold block mt-0.5">Next Class: Mathematics</span>
              </div>
              <Link 
                href={`/schools/${schoolId}/students/timetable`}
                className="bg-[#144835] text-white hover:bg-[#144835]/90 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md shadow-[#144835]/20 shrink-0"
              >
                View
              </Link>
            </div>

            {/* Assignments card */}
            <div className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 group">
              <div className="p-3 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Assignments</span>
                <span className="text-xs font-black text-gray-900 block mt-0.5">Pending: 3 Tasks</span>
                <span className="text-[10px] text-red-600 font-bold block mt-0.5 uppercase tracking-wider">Overdue: 1</span>
              </div>
              <Link 
                href={`/schools/${schoolId}/students/timetable`}
                className="bg-[#144835] text-white hover:bg-[#144835]/90 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md shadow-[#144835]/20 shrink-0"
              >
                View
              </Link>
            </div>

            {/* Announcements card */}
            <div className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 group">
              <div className="p-3 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                <Megaphone size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Announcements</span>
                <span className="text-xs font-black text-gray-900 block mt-0.5">New notifications</span>
                <span className="text-[10px] text-gray-500 font-bold block mt-0.5">5 Unread notices</span>
              </div>
              <Link 
                href={`/schools/${schoolId}/students/messages`}
                className="bg-[#144835] text-white hover:bg-[#144835]/90 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md shadow-[#144835]/20 shrink-0"
              >
                View All
              </Link>
            </div>
          </div>

          {/* Latest updates list */}
          <div className="bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <h4 className="text-xs font-black text-[#144835] uppercase tracking-wider mb-4 border-l-4 border-[#144835] pl-2">Latest Updates</h4>
            <div className="space-y-4">
              <div className="border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Dec 15, 2025</span>
                <h5 className="text-xs font-extrabold text-gray-900 mt-1">Final Exams Schedule</h5>
                <p className="text-[11px] text-gray-500 mt-1 font-medium leading-relaxed">
                  The schedule for Term 2 Final Exams has been officially posted to the documents board.
                </p>
              </div>
              <div className="border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Dec 12, 2025</span>
                <h5 className="text-xs font-extrabold text-gray-900 mt-1">Sports Day Registration</h5>
                <p className="text-[11px] text-gray-500 mt-1 font-medium leading-relaxed">
                  Sign up for athletics and track events using the sports coordinator desk this week.
                </p>
              </div>
              <div className="border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Dec 10, 2025</span>
                <h5 className="text-xs font-extrabold text-gray-900 mt-1">Holiday Announcement</h5>
                <p className="text-[11px] text-gray-500 mt-1 font-medium leading-relaxed">
                  The school will remain closed on Friday for Republic Day celebrations.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
