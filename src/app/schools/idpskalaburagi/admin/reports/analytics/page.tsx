"use client";

import Link from "next/link";
import { useMemo } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BarChart3, CalendarRange, Download, Mail, MapPin, MoreHorizontal, Search, Users, UserCheck, IndianRupee } from "lucide-react";
import { useBranch } from "@/components/admin/BranchContext";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function AdminAnalyticsPage() {
 const { activeBranch } = useBranch();

 const metrics = useMemo(() => {
 return [
 {
 title: "Total Enrollment",
 value: "2,450",
 delta: "-2%",
 deltaTone: "bg-rose-50 text-rose-700 border-rose-100",
 helper: "vs. previous session (2,500)",
 icon: Users,
 iconTone: "bg-blue-50 text-blue-700",
 accent: "border-transparent",
 },
 {
 title: "Avg. Attendance",
 value: "92.5%",
 delta: "+1.2%",
 deltaTone: "bg-emerald-50 text-emerald-700 border-emerald-100",
 helper: "Average for all grades this month",
 icon: UserCheck,
 iconTone: "bg-emerald-50 text-emerald-700",
 accent: "border-transparent",
 },
 {
 title: "Fee Collected",
 value: "₹1,250,000",
 delta: "+15%",
 deltaTone: "bg-emerald-50 text-emerald-700 border-emerald-100",
 helper: "Outstanding: ₹240,000",
 icon: IndianRupee,
 iconTone: "bg-slate-100 text-slate-700",
 accent: "border-l-4 border-l-amber-400",
 },
 ] as const;
 }, []);

 const gradeDistribution = useMemo(() => {
 return [
 { label: "C", value: 12 },
 { label: "C+", value: 18 },
 { label: "B", value: 32 },
 { label: "B+", value: 44 },
 { label: "A", value: 55 },
 { label: "A+", value: 39 },
 ];
 }, []);

 const classes = useMemo(() => {
 return [
 { cls: "Grade 12 - Science A", avg: 88, att: "96.2%", due: "₹12,400", status: "GOOD" },
 { cls: "Grade 11 - Commerce B", avg: 84, att: "92.8%", due: "₹8,900", status: "GOOD" },
 { cls: "Grade 10 - A", avg: 79, att: "88.1%", due: "₹18,000", status: "ALERT" },
 { cls: "Grade 9 - C", avg: 73, att: "84.6%", due: "₹22,300", status: "ALERT" },
 ];
 }, []);

 return (
 <div className="space-y-8 animate-in fade-in duration-500 font-jost pb-10">
 {/* Top Header */}
 <AdminPageHeader
  title="Analytics Dashboard"
  description="Enrollment, attendance, fees, and performance insights"
 />

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex flex-col xl:flex-row gap-4 items-center justify-between">
 <div className="flex w-full xl:w-auto flex-wrap items-center gap-3">
 <ExportButton data={[]} filename="Export" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-extrabold text-gray-700 shadow-sm hover:bg-gray-50" iconSize={18} />
 </div>
 </div>

 <div className="p-4 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {metrics.map((m) => (
 <div key={m.title} className={cn("bg-white rounded-xl border border-gray-200 p-4 relative", m.accent)}>
 <span className={cn("absolute right-4 top-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold", m.deltaTone)}>
 {m.delta}
 </span>
 <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", m.iconTone)}>
 <m.icon size={18} />
 </div>
 <p className="mt-4 text-xs font-semibold text-gray-500">{m.title}</p>
 <p className="mt-2 text-xl font-bold text-[#1A1A1A]">{m.value}</p>
 <p className="mt-2 text-xs font-semibold text-gray-500">{m.helper}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
 <BarChart3 size={18} />
 </div>
 <p className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Student Performance</p>
 </div>
 <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-extrabold text-slate-600">
 Grade Distribution
 </span>
 </div>
 <div className="p-4">
 <div className="h-[220px] rounded-[16px] border border-gray-100 bg-white flex items-end gap-4 px-6 py-6">
 {gradeDistribution.map((g) => (
 <div key={g.label} className="flex-1 flex flex-col items-center justify-end gap-2">
 <div className="w-full bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-40 flex items-end">
 <div className="w-full bg-[#144835]" style={{ height: `${Math.min(100, Math.round((g.value / 60) * 100))}%` }} />
 </div>
 <p className="text-xs font-extrabold text-gray-500">{g.label}</p>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
 <IndianRupee size={18} />
 </div>
 <p className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Fee Collection Trend</p>
 </div>
 <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-extrabold text-slate-600">
 Monthly Insights
 </span>
 </div>
 <div className="p-4">
 <div className="h-[220px] rounded-[16px] border border-gray-100 bg-white px-6 py-6">
 <svg viewBox="0 0 420 180" className="w-full h-full">
 <path d="M20 150 C 90 95, 120 130, 170 95 S 270 40, 310 75 S 360 150, 400 30" fill="none" stroke="#D4A200" strokeWidth="4" />
 <path d="M20 150 C 90 95, 120 130, 170 95 S 270 40, 310 75 S 360 150, 400 30" fill="none" stroke="#D4A200" strokeOpacity="0.25" strokeWidth="10" />
 {["JUL", "SEP", "NOV", "JAN", "MAR", "MAY"].map((m, i) => (
 <text key={m} x={30 + i * 70} y={170} fontSize="10" fill="#94a3b8" fontWeight="700">
 {m}
 </text>
 ))}
 </svg>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
 <BarChart3 size={18} />
 </div>
 <p className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Class-wise Performance</p>
 </div>
 <Link href="#" className="text-xs font-extrabold text-[#144835] hover:underline">
 View Detailed Report
 </Link>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50/60 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
 <tr>
 <th className="px-4 py-2.5">Class / Grade</th>
 <th className="px-4 py-2.5">Avg Score</th>
 <th className="px-4 py-2.5">Attendance</th>
 <th className="px-4 py-2.5">Fee Due</th>
 <th className="px-4 py-2.5">Academic Status</th>
 <th className="px-4 py-2.5 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 bg-white">
 {classes.map((c) => {
 const barTone = c.avg >= 85 ? "bg-emerald-600" : c.avg >= 75 ? "bg-amber-500" : "bg-red-500";
 const statusTone =
 c.status === "GOOD"
 ? "bg-emerald-50 text-emerald-700 border-emerald-100"
 : "bg-amber-50 text-amber-800 border-amber-100";

 return (
 <tr key={c.cls} className="hover:bg-gray-50/50 transition-colors">
 <td className="px-6 py-5 text-xs font-extrabold text-[#1A1A1A]">{c.cls}</td>
 <td className="px-6 py-5">
 <div className="flex items-center gap-3">
 <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
 <div className={cn("h-full rounded-full", barTone)} style={{ width: `${c.avg}%` }} />
 </div>
 <span className="text-xs font-extrabold text-slate-800">{c.avg}%</span>
 </div>
 </td>
 <td className="px-6 py-5 text-xs font-semibold text-slate-700">{c.att}</td>
 <td className="px-6 py-5 text-xs font-extrabold text-slate-800">{c.due}</td>
 <td className="px-6 py-5">
 <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-extrabold", statusTone)}>
 {c.status}
 </span>
 </td>
 <td className="px-6 py-5 text-right">
 <button type="button" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="More">
 <MoreHorizontal size={18} />
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

function ChevronDown() {
 return <span className="ml-1 text-gray-400">▾</span>;
}
