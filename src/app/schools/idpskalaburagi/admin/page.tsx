"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
 Users, 
 GraduationCap, 
 Wallet, 
 BookOpen, 
 CalendarCheck, 
 Clock,
 TrendingUp,
 TrendingDown,
 ArrowUpRight,
 Activity,
 CheckCircle2,
 AlertCircle,
 ChevronRight,
 Download,
 Plus,
 X
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useBranch } from "@/components/admin/BranchContext";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { calculateAttendanceStats } from "@/utils/attendance";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function AdminDashboardPage() {
 const { activeBranch } = useBranch();
 const schoolId = "idpskalaburagi";

 const [stats, setStats] = useState({
 students: 0,
 staff: 0,
 classes: 0,
 revenue: 0,
 feesDue: 0,
 attendance: { percent: 0, present: 0, late: 0, absent: 0 },
 feeCollectedMonth: 0,
 feeTargetMonth: 0,
 });

 const [activities, setActivities] = useState<any[]>([]);
 const [events, setEvents] = useState<any[]>([]);
 const [staffAvailability, setStaffAvailability] = useState({
 total: 0,
 present: 0,
 onLeaveToday: [] as any[]
 });

 useEffect(() => {
 // Listeners for collections
 const unsubStudents = onSnapshot(collection(db, "schools", schoolId, "students"), (snap) => {
 const studentCount = snap.size;
 setStats(prev => ({ ...prev, students: studentCount }));

 if (studentCount > 0) {
 let totalPercent = 0;
 let presentToday = 0;
 let absentToday = 0;
 let lateToday = 0;
 const today = new Date().toISOString().split('T')[0];

 snap.docs.forEach(doc => {
 const data = doc.data();
 const stats = calculateAttendanceStats(
 data.attendance?.presentDates || [],
 data.attendance?.absentDates || [],
 data.attendance?.lateDates || []
 );
 totalPercent += stats.percentage;
 
 // Check if present today
 if (data.attendance?.presentDates?.includes(today)) presentToday++;
 else if (data.attendance?.absentDates?.includes(today)) absentToday++;
 else if (data.attendance?.lateDates?.includes(today)) lateToday++;
 });

 const avgPercent = Math.round(totalPercent / studentCount);
 setStats(prev => ({ 
 ...prev, 
 attendance: { 
 percent: avgPercent, 
 present: presentToday, 
 absent: absentToday, 
 late: lateToday 
 } 
 }));
 }
 });
 
 const unsubStaff = onSnapshot(collection(db, "schools", schoolId, "teachers"), (snap) => {
 setStats(prev => ({ ...prev, staff: snap.size }));
 setStaffAvailability(prev => ({ 
 ...prev, 
 total: snap.size, 
 present: snap.size, // Assuming everyone is present until leaves are tracked
 onLeaveToday: [] 
 }));
 });
 
 const unsubClasses = onSnapshot(collection(db, "schools", schoolId, "classes"), (snap) => {
 setStats(prev => ({ ...prev, classes: snap.size }));
 });

 const unsubActivity = onSnapshot(
 query(collection(db, "schools", schoolId, "activity"), orderBy("createdAt", "desc"), limit(5)),
 (snap) => {
 setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
 }
 );

 const unsubSchool = onSnapshot(doc(db, "schools", schoolId), (snap) => {
 if (snap.exists()) {
 const data = snap.data();
 setStats(prev => ({
 ...prev,
 revenue: data.metrics?.revenue || 0,
 feesDue: data.metrics?.pendingFees || 0,
 attendance: data.attendance || { percent: 0, present: 0, late: 0, absent: 0 },
 feeCollectedMonth: data.finance?.feeCollectedMonth || 0,
 feeTargetMonth: data.finance?.feeTargetMonth || 1000000,
 }));
 }
 });

 return () => {
 unsubStudents();
 unsubStaff();
 unsubClasses();
 unsubActivity();
 unsubSchool();
 };
 }, [schoolId]);

 const kpis = [
 { label: "Students", value: stats.students.toLocaleString("en-IN"), delta: "+2.4%", trend: "up", icon: GraduationCap },
 { label: "Staff", value: stats.staff.toLocaleString("en-IN"), delta: "+1.2%", trend: "up", icon: Users },
 { label: "Revenue", value: stats.revenue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), delta: "+12.5%", trend: "up", icon: Wallet },
 { label: "Classes", value: stats.classes.toLocaleString("en-IN"), delta: "0%", trend: "up", icon: BookOpen },
 { label: "Fees Due", value: stats.feesDue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), delta: "-5.4%", trend: "down", icon: Clock },
 { label: "Attendance", value: `${stats.attendance.percent || 0}%`, delta: "+1.1%", trend: "up", icon: CalendarCheck },
 ];

 const approvals = [
 { label: "Leave Requests", count: 2, icon: Users, href: `/schools/${schoolId}/admin/hr/leaves`, note: "Staff & Teachers" },
 { label: "Expense Claims", count: 5, icon: Wallet, href: `/schools/${schoolId}/admin/finance/expenses`, note: "Pending Review" },
 { label: "Admissions", count: 12, icon: GraduationCap, href: `/schools/${schoolId}/admin/admission/applications`, note: "New Applications" }
 ];

 const [logOpen, setLogOpen] = useState(false);
 const fullActivityLog = [
 ...activities,
 { text: "New notice published: Annual Sports Meet", href: `/schools/${schoolId}/admin/communication/messages`, time: "2d ago" },
 { text: "Inventory: 12 laptops added to IT assets", href: `/schools/${schoolId}/admin/inventory/assets`, time: "3d ago" },
 { text: "3 invoices generated for Grade 10", href: `/schools/${schoolId}/admin/finance/invoices`, time: "4d ago" },
 { text: "Timetable updated for next week", href: `/schools/${schoolId}/admin/academic/timetable`, time: "5d ago" },
 ];

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-24 max-w-[1600px] mx-auto pt-2">
 {/* KPI Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
 {kpis.map((stat, idx) => {
 const styles = [
 { bg: "bg-emerald-50", color: "text-emerald-600", border: "border-emerald-100", hover: "group-hover:border-emerald-200" },
 { bg: "bg-blue-50", color: "text-blue-600", border: "border-blue-100", hover: "group-hover:border-blue-200" },
 { bg: "bg-amber-50", color: "text-amber-600", border: "border-amber-100", hover: "group-hover:border-amber-200" },
 { bg: "bg-purple-50", color: "text-purple-600", border: "border-purple-100", hover: "group-hover:border-purple-200" },
 { bg: "bg-rose-50", color: "text-rose-600", border: "border-rose-100", hover: "group-hover:border-rose-200" },
 { bg: "bg-indigo-50", color: "text-indigo-600", border: "border-indigo-100", hover: "group-hover:border-indigo-200" }
 ];
 const style = styles[idx % styles.length];
 
 return (
 <div key={idx} className={cn(
 "bg-white rounded-[16px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border transition-all duration-300 relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform hover:-translate-y-1", 
 style.border, style.hover
 )}>
 <div className={cn("absolute -right-4 -bottom-4 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-all transform group-hover:scale-125 duration-700", style.color)}>
 <stat.icon size={80} strokeWidth={1.5} />
 </div>

 <div className="flex justify-between items-start mb-4 relative z-10">
 <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-300", style.bg, style.color)}>
 <stat.icon size={20} strokeWidth={2} />
 </div>
 <div className={cn("flex items-center text-[10px] font-bold px-2 py-0.5 rounded border", stat.trend === 'up' ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" : "bg-rose-50 text-rose-700 border-rose-100/50")}>
 {stat.trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
 {stat.delta}
 </div>
 </div>
 
 <div className="relative z-10 mt-1">
 <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-0.5">{stat.label}</p>
 <h3 className="text-xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
 </div>
 </div>
 );
 })}
 </div>

 {/* Overview Row */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Attendance Overview</h3>
 </div>
 <div className="p-4 flex items-center gap-4">
 <div className="relative w-28 h-28 shrink-0 drop-shadow-sm">
 <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#10b981 0% ${stats.attendance?.percent || 0}%, #f1f5f9 ${stats.attendance?.percent || 0}% 100%)` }} />
 <div className="absolute inset-[8px] rounded-full bg-white shadow-inner" />
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="text-center">
 <p className="text-xl font-black text-gray-900 tracking-tighter">{stats.attendance?.percent || 0}%</p>
 <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Today</p>
 </div>
 </div>
 </div>
 <div className="flex-1 space-y-3">
 <div className="flex items-center justify-between text-xs group cursor-pointer">
 <div className="flex items-center gap-2">
 <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:scale-125 transition-transform" />
 <span className="font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Present</span>
 </div>
 <span className="font-black text-gray-900">{(stats.attendance?.present || 0).toLocaleString("en-IN")}</span>
 </div>
 <div className="flex items-center justify-between text-xs group cursor-pointer">
 <div className="flex items-center gap-2">
 <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] group-hover:scale-125 transition-transform" />
 <span className="font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Late</span>
 </div>
 <span className="font-black text-gray-900">{(stats.attendance?.late || 0).toLocaleString("en-IN")}</span>
 </div>
 <div className="flex items-center justify-between text-xs group cursor-pointer">
 <div className="flex items-center gap-2">
 <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] group-hover:scale-125 transition-transform" />
 <span className="font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Absent</span>
 </div>
 <span className="font-black text-gray-900">{(stats.attendance?.absent || 0).toLocaleString("en-IN")}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Fee Collection</h3>
 <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">This Month</span>
 </div>
 <div className="p-4 space-y-5">
 <div>
 <div className="flex items-end gap-2 mb-1">
 <p className="text-xl font-black text-gray-900 tracking-tight">
 {stats.feeCollectedMonth.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </p>
 <p className="text-xs font-bold text-gray-400 mb-1 line-through decoration-gray-300">
 Target {stats.feeTargetMonth.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </p>
 </div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total Collected (May)</p>
 </div>
 <div className="pt-1">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Progress</span>
 <span className="text-xs font-black text-[#144835]">
 {Math.round((stats.feeCollectedMonth / (stats.feeTargetMonth || 1)) * 100)}%
 </span>
 </div>
 <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
 <div
 className="h-full bg-gradient-to-r from-[#144835] to-emerald-400 rounded-full relative"
 style={{ width: `${Math.min(100, Math.round((stats.feeCollectedMonth / (stats.feeTargetMonth || 1)) * 100))}%` }}
 >
 <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
 </div>
 </div>
 </div>
 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50/50 text-emerald-700 text-[10px] font-bold w-full justify-center">
 <TrendingUp size={14} strokeWidth={2.5} /> Ahead of last month by 4.2%
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Staff Availability</h3>
 <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
 <CheckCircle2 size={12} /> {staffAvailability.present}/{staffAvailability.total} Present
 </span>
 </div>
 <div className="p-4 flex-1 flex flex-col justify-between">
 <div>
 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">
 On Leave Today ({staffAvailability.onLeaveToday.length})
 </p>
 <div className="space-y-3">
 {staffAvailability.onLeaveToday.map((p: any, i: number) => {
 const palette =
 i % 3 === 0
 ? "from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700"
 : i % 3 === 1
 ? "from-blue-50 to-blue-100 border-blue-200 text-blue-700"
 : "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700";
 return (
 <div key={p.name} className="flex items-center justify-between group">
 <div className="flex items-center gap-3">
 <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${palette} flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-105 transition-transform`}>
 {p.initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{p.name}</p>
 <p className="text-[10px] font-bold text-gray-500">{p.reason}</p>
 </div>
 </div>
 <div className="h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#144835]/10 group-hover:text-[#144835] transition-colors cursor-pointer">
 <CheckCircle2 size={14} />
 </div>
 </div>
 );
 })}
 </div>
 </div>
 <div className="pt-4 mt-3 border-t border-gray-50">
 <Link href={`/schools/${schoolId}/admin/academic/timetable`} className="h-9 inline-flex items-center justify-center w-full rounded-lg bg-[#144835]/5 hover:bg-[#144835] text-[#144835] hover:text-white text-xs font-bold transition-all duration-300">
 Manage Substitutions
 </Link>
 </div>
 </div>
 </div>
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
 <div className="xl:col-span-2 flex flex-col gap-4">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col flex-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-lg bg-[#144835]/5 text-[#144835] flex items-center justify-center border border-[#144835]/10">
 <Activity size={18} strokeWidth={2} />
 </div>
 <div>
 <h2 className="text-xs font-black text-gray-900 tracking-tight">Recent Activity</h2>
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Latest events across your branch</p>
 </div>
 </div>
 <button onClick={() => setLogOpen(true)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all hover:border-gray-300 group">
 View Log <ChevronRight size={12} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
 </button>
 </div>
 
 <div className="p-4 flex-1 bg-gray-50/30">
 <div className="relative border-l border-gray-200 ml-3 space-y-6 py-1">
 {activities.map((activity, idx) => (
 <div key={idx} className="relative pl-6 group">
 <div className={cn(
 "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-[2px] border-white ring-2 ring-gray-50 transition-all duration-300",
 idx === 0 ? "bg-[#144835] ring-[#144835]/10 scale-125 shadow-[0_0_10px_rgba(20,72,53,0.3)]" : "bg-gray-300 group-hover:bg-[#a2c144] group-hover:scale-110"
 )}></div>
 <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] group-hover:border-[#144835]/30 group-hover:shadow-[0_8px_20px_rgba(20,72,53,0.08)] transition-all duration-300 transform group-hover:-translate-y-0.5">
 <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{activity.text}</p>
 <div className="flex items-center gap-4 mt-2">
 <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded">
 <Clock size={10} />
 {activity.time}
 </p>
 <Link href={activity.href} className="text-[10px] font-bold text-[#144835] uppercase tracking-wider hover:underline flex items-center gap-1">
 View Details <ArrowUpRight size={10} />
 </Link>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-4">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center relative border border-rose-100">
 <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-[2px] border-white"></span>
 </span>
 <AlertCircle size={14} strokeWidth={2} />
 </div>
 <div>
 <h3 className="text-xs font-black text-gray-900 tracking-tight">Pending Approvals</h3>
 <p className="text-[9px] font-bold text-rose-600 mt-0.5 uppercase tracking-widest bg-rose-50 inline-block px-1.5 py-0.5 rounded">Requires Action</p>
 </div>
 </div>
 </div>
 
 <div className="p-4 bg-gray-50/30">
 <div className="space-y-2">
 {approvals.map((item, i) => (
 <Link href={item.href} key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:border-[#144835]/30 hover:shadow-[0_4px_15px_rgba(20,72,53,0.06)] transition-all group transform hover:-translate-y-0.5">
 <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-[#144835]/5 group-hover:text-[#144835] group-hover:border-[#144835]/20 transition-all shrink-0">
 <item.icon size={14} strokeWidth={1.5} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-black text-gray-900 leading-snug group-hover:text-[#144835] transition-colors">
 {item.count} {item.label}
 </p>
 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{item.note}</p>
 </div>
 <div className="h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#144835] group-hover:text-white transition-colors shrink-0">
 <ChevronRight size={14} className="text-gray-400 group-hover:text-white transition-colors" />
 </div>
 </Link>
 ))}
 </div>

 <Link href="/idpskalaburagi/hr/leaves" className="w-full mt-4 h-10 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20">
 Review All Approvals
 </Link>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden relative hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Upcoming Events</h3>
 </div>
 <div className="p-4 space-y-4 bg-gray-50/30">
 {events.slice(0, 3).map((ev: any, idx: number) => {
 const d = new Date(ev.date);
 const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
 const day = d.getDate().toString().padStart(2, "0");
 const place = idx === 0 ? "School Stadium • 09:00 AM" : idx === 1 ? "Auditorium Hall • 10:30 AM" : "Main Quadrangle • All Day";
 return (
 <div key={ev.title} className="flex items-start gap-3 group cursor-pointer">
 <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center overflow-hidden group-hover:border-[#144835]/30 group-hover:shadow-md transition-all">
 <div className="bg-gray-100 w-full text-center py-0.5 text-[8px] font-black text-gray-500 group-hover:bg-[#144835]/10 group-hover:text-[#144835] transition-colors">{month}</div>
 <div className="text-xs font-black text-gray-900 py-1">{day}</div>
 </div>
 <div className="flex-1 pt-0.5">
 <p className="font-bold text-xs text-gray-900 group-hover:text-[#144835] transition-colors">{ev.title}</p>
 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-1"><Clock size={8} /> {place}</p>
 </div>
 </div>
 );
 })}
 <Link href={`/schools/${schoolId}/admin/academic/timetable`} className="h-10 inline-flex items-center justify-center w-full rounded-lg bg-white border border-gray-100 text-gray-700 text-xs font-bold hover:border-gray-300 hover:bg-gray-50 transition-all mt-1">
 Full Academic Calendar
 </Link>
 </div>
 <Link href={`/schools/${schoolId}/admin/academic/timetable/new`} className="absolute right-5 top-4 h-7 w-7 rounded-full bg-[#144835] text-white shadow-lg shadow-[#144835]/20 flex items-center justify-center hover:bg-[#144835]/90 hover:scale-110 transition-transform">
 <Plus size={14} />
 </Link>
 </div>
 </div>
 </div>

 {logOpen && (
 <div className="fixed inset-0 z-40">
 <div className="absolute inset-0 bg-black/40" onClick={() => setLogOpen(false)} />
 <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
 <div className="p-4 sm:p-4 border-b border-gray-100 flex items-center justify-between">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Activity</p>
 <h3 className="text-lg font-bold text-gray-900">Full Log</h3>
 </div>
 <button onClick={() => setLogOpen(false)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50">
 <X size={14} />
 </button>
 </div>
 <div className="p-4 sm:p-4 overflow-auto flex-1">
 <div className="space-y-3">
 {fullActivityLog.map((item, i) => (
 <div key={`${item.text}-${i}`} className="rounded-lg border border-gray-100 bg-gray-50/60 p-4 hover:bg-white hover:shadow-sm hover:border-[#144835]/20 transition-all">
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="text-xs font-bold text-gray-900">{item.text}</p>
 <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{item.time}</p>
 </div>
 <Link href={item.href} className="text-xs font-bold text-[#144835] hover:text-[#144835]/80 inline-flex items-center gap-1">
 View <ChevronRight size={14} />
 </Link>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
