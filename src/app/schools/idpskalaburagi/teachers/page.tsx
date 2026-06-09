"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { useBranch } from "@/components/teachers/BranchContext";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
 seedCounts,
 seedFinance,
 seedAttendance,
 seedStaffAvailability,
 seedApprovals as SEED_APPROVALS,
 seedActivities as SEED_ACTIVITIES,
 seedKpiDeltas,
} from "@/data/seed";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type EventType = "academic" | "holiday" | "exam" | "event" | "meeting";

function pad2(n: number) {
 return n.toString().padStart(2, "0");
}

function dateKey(d: Date) {
 return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function AdminDashboardPage() {
 const { activeBranch } = useBranch();
 const schoolId = "idpskalaburagi";
 const branchNameRaw = (activeBranch?.name ?? "").replace(/\u200B/g, "").trim();
 const branchCityRaw = (activeBranch?.city ?? "").replace(/\u200B/g, "").trim();
 const branchLabelRaw = branchNameRaw.length
 ? branchCityRaw.length
 ? `${branchNameRaw} (${branchCityRaw})`
 : branchNameRaw
 : "";
 const branchLabel = branchLabelRaw.length ? branchLabelRaw : "Dashboard";

 const kpis = [
 { label: "Students", value: seedCounts.students.toLocaleString("en-IN"), delta: seedKpiDeltas.students, trend: "down", icon: GraduationCap },
 { label: "Staff", value: seedCounts.staff.toLocaleString("en-IN"), delta: seedKpiDeltas.staff, trend: "up", icon: Users },
 { label: "Revenue", value: seedFinance.revenueMonth.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), delta: seedKpiDeltas.revenue, trend: "up", icon: Wallet },
 { label: "Classes", value: seedCounts.classes.toLocaleString("en-IN"), delta: seedKpiDeltas.classes, trend: "up", icon: BookOpen },
 { label: "Fees Due", value: seedFinance.feesDue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), delta: seedKpiDeltas.feesDue, trend: "down", icon: Clock },
 { label: "Attendance", value: `${seedAttendance.percent.toFixed(1)}%`, delta: seedKpiDeltas.attendance, trend: "up", icon: CalendarCheck },
 ];

 const activities = SEED_ACTIVITIES;

 const approvals = SEED_APPROVALS.map((a) => ({
 ...a,
 icon: a.iconKey === "users" ? Users : a.iconKey === "wallet" ? Wallet : GraduationCap,
 }));

 const pendingApprovalTotal = approvals.reduce((sum, item) => sum + item.count, 0);
 const todayLabel = new Date().toLocaleDateString("en-IN", {
 weekday: "long",
 day: "2-digit",
 month: "short",
 year: "numeric",
 });

 const [logOpen, setLogOpen] = useState(false);
 const [events, setEvents] = useState<Array<{ id: string; title: string; date: string; type: EventType; location?: string }>>([]);

 useEffect(() => {
 const qRef = query(collection(db, "schools", schoolId, "events"), orderBy("date", "asc"));
 const unsub = onSnapshot(
 qRef,
 (snap) => {
 const next = snap.docs.map((d) => {
 const data = d.data() as any;
 const type = (["academic", "holiday", "exam", "event", "meeting"] as const).includes(data.type) ? (data.type as EventType) : ("event" as EventType);
 return {
 id: d.id,
 title: String(data.title || "").trim() || "Untitled",
 date: String(data.date || "").trim(),
 type,
 location: String(data.location || "").trim() || undefined,
 };
 });
 setEvents(next.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date)));
 },
 () => setEvents([])
 );
 return () => unsub();
 }, [schoolId]);

 const upcomingEvents = useMemo(() => {
 const today = dateKey(new Date());
 return events.filter((e) => e.date >= today).slice(0, 3);
 }, [events]);
 const fullActivityLog = [
 ...activities,
 { text: "New notice published: Annual Sports Meet", href: "/idpskalaburagi/communication/messages", time: "2d ago" },
 { text: "Inventory: 12 laptops added to IT assets", href: "/idpskalaburagi/inventory/assets", time: "3d ago" },
 { text: "3 invoices generated for Grade 10", href: "/idpskalaburagi/finance/invoices", time: "4d ago" },
 { text: "Timetable updated for next week", href: "/idpskalaburagi/academic/timetable", time: "5d ago" },
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
 <div className={cn("flex items-center text-xs font-bold px-2 py-0.5 rounded border", stat.trend === 'up' ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" : "bg-rose-50 text-rose-700 border-rose-100/50")}>
 {stat.trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
 {stat.delta}
 </div>
 </div>
 
 <div className="relative z-10 mt-1">
 <p className="text-gray-400 font-bold text-xs uppercase tracking-wide mb-0.5">{stat.label}</p>
 <h3 className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
 </div>
 </div>
 );
 })}
 </div>

 {/* Overview Row */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Attendance Overview</h3>
 </div>
 <div className="p-4 flex items-center gap-4">
 <div className="relative w-28 h-28 shrink-0 drop-shadow-sm">
 <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#10b981 0% ${seedAttendance.percent}%, #f1f5f9 ${seedAttendance.percent}% 100%)` }} />
 <div className="absolute inset-[8px] rounded-full bg-white shadow-inner" />
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="text-center">
 <p className="text-xl font-bold text-gray-900 tracking-tighter">{seedAttendance.percent}%</p>
 <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mt-0.5">Today</p>
 </div>
 </div>
 </div>
 <div className="flex-1 space-y-3">
 <div className="flex items-center justify-between text-xs group cursor-pointer">
 <div className="flex items-center gap-2">
 <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:scale-125 transition-transform" />
 <span className="font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Present</span>
 </div>
 <span className="font-bold text-gray-900">{seedAttendance.present.toLocaleString("en-IN")}</span>
 </div>
 <div className="flex items-center justify-between text-xs group cursor-pointer">
 <div className="flex items-center gap-2">
 <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] group-hover:scale-125 transition-transform" />
 <span className="font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Late</span>
 </div>
 <span className="font-bold text-gray-900">{seedAttendance.late.toLocaleString("en-IN")}</span>
 </div>
 <div className="flex items-center justify-between text-xs group cursor-pointer">
 <div className="flex items-center gap-2">
 <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] group-hover:scale-125 transition-transform" />
 <span className="font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Absent</span>
 </div>
 <span className="font-bold text-gray-900">{seedAttendance.absent.toLocaleString("en-IN")}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Fee Collection</h3>
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 px-2 py-0.5 rounded-md">This Month</span>
 </div>
 <div className="p-4 space-y-5">
 <div>
 <div className="flex items-end gap-2 mb-1">
 <p className="text-xl font-bold text-gray-900 tracking-tight">
 {seedFinance.feeCollectedMonth.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </p>
 <p className="text-xs font-bold text-gray-400 mb-1 line-through decoration-gray-300">
 Target {seedFinance.feeTargetMonth.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </p>
 </div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Total Collected (May)</p>
 </div>
 <div className="pt-1">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Progress</span>
 <span className="text-xs font-bold text-[#144835]">
 {Math.round((seedFinance.feeCollectedMonth / seedFinance.feeTargetMonth) * 100)}%
 </span>
 </div>
 <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
 <div
 className="h-full bg-gradient-to-r from-[#144835] to-emerald-400 rounded-full relative"
 style={{ width: `${Math.min(100, Math.round((seedFinance.feeCollectedMonth / seedFinance.feeTargetMonth) * 100))}%` }}
 >
 <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
 </div>
 </div>
 </div>
 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50/50 text-emerald-700 text-xs font-bold w-full justify-center">
 <TrendingUp size={14} strokeWidth={2.5} /> Ahead of last month by 4.2%
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Staff Availability</h3>
 <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
 <CheckCircle2 size={12} /> {seedStaffAvailability.present}/{seedStaffAvailability.total} Present
 </span>
 </div>
 <div className="p-4 flex-1 flex flex-col justify-between">
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
 On Leave Today ({seedStaffAvailability.onLeaveToday.length})
 </p>
 <div className="space-y-3">
 {seedStaffAvailability.onLeaveToday.map((p, i) => {
 const palette =
 i % 3 === 0
 ? "from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700"
 : i % 3 === 1
 ? "from-blue-50 to-blue-100 border-blue-200 text-blue-700"
 : "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700";
 return (
 <div key={p.name} className="flex items-center justify-between group">
 <div className="flex items-center gap-3">
 <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${palette} flex items-center justify-center text-xs font-bold shadow-sm group-hover:scale-105 transition-transform`}>
 {p.initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{p.name}</p>
 <p className="text-xs font-bold text-gray-500">{p.reason}</p>
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
 <Link href="/idpskalaburagi/academic/timetable" className="h-9 inline-flex items-center justify-center w-full rounded-lg bg-[#144835]/5 hover:bg-[#144835] text-[#144835] hover:text-white text-xs font-bold transition-all duration-300">
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
 <h2 className="text-xs font-bold text-gray-900 tracking-tight">Recent Activity</h2>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">Latest events across your branch</p>
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
 <p className="text-sm font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{activity.text}</p>
 <div className="flex items-center gap-4 mt-2">
 <p className="text-xs font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded">
 <Clock size={10} />
 {activity.time}
 </p>
 <Link href={activity.href} className="text-xs font-bold text-[#144835] uppercase tracking-wider hover:underline flex items-center gap-1">
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
 <h3 className="text-xs font-bold text-gray-900 tracking-tight">Pending Approvals</h3>
 <p className="text-xs font-bold text-rose-600 mt-0.5 uppercase tracking-wide bg-rose-50 inline-block px-1.5 py-0.5 rounded">Requires Action</p>
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
 <p className="text-xs font-bold text-gray-900 leading-snug group-hover:text-[#144835] transition-colors">
 {item.count} {item.label}
 </p>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">{item.note}</p>
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
 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Upcoming Events</h3>
 </div>
 <div className="p-4 space-y-4 bg-gray-50/30">
 {upcomingEvents.map((ev, idx) => {
 const d = new Date(`${ev.date}T00:00:00`);
 const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
 const day = d.getDate().toString().padStart(2, "0");
 const place = ev.location ? `${ev.location} • All Day` : idx === 0 ? "School • 09:00 AM" : idx === 1 ? "School • 10:30 AM" : "School • All Day";
 return (
 <div key={ev.id} className="flex items-start gap-3 group cursor-pointer">
 <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center overflow-hidden group-hover:border-[#144835]/30 group-hover:shadow-md transition-all">
 <div className="bg-gray-100 w-full text-center py-0.5 text-xs font-bold text-gray-500 group-hover:bg-[#144835]/10 group-hover:text-[#144835] transition-colors">{month}</div>
 <div className="text-xs font-bold text-gray-900 py-1">{day}</div>
 </div>
 <div className="flex-1 pt-0.5">
 <p className="font-bold text-xs text-gray-900 group-hover:text-[#144835] transition-colors">{ev.title}</p>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5 flex items-center gap-1"><Clock size={8} /> {place}</p>
 </div>
 </div>
 );
 })}
 <Link href={`/schools/${schoolId}/admin/academic/calendar`} className="h-10 inline-flex items-center justify-center w-full rounded-lg bg-white border border-gray-100 text-gray-700 text-xs font-bold hover:border-gray-300 hover:bg-gray-50 transition-all mt-1">
 Full Academic Calendar
 </Link>
 </div>
 <Link href={`/schools/${schoolId}/admin/academic/calendar/new`} className="absolute right-5 top-4 h-7 w-7 rounded-full bg-[#144835] text-white shadow-lg shadow-[#144835]/20 flex items-center justify-center hover:bg-[#144835]/90 hover:scale-110 transition-transform">
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
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</p>
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
 <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{item.time}</p>
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
