"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, GraduationCap, Wallet, BookOpen, CalendarCheck, Clock,
  TrendingUp, TrendingDown, ArrowUpRight, Activity, CheckCircle2,
  AlertCircle, ChevronRight, Plus, X, MapPin,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, doc, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const SCHOOL_ID = "idpscherukupalli";
const BASE = `/schools/${SCHOOL_ID}/admin`;

// relative-time helper
function relTime(val: any): string {
  if (!val) return "Recently";
  const date = val?.toDate ? val.toDate() : new Date(val);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function AdminDashboardPage() {
  // ── state ──────────────────────────────────────────────────────────────────
  const [schoolDoc, setSchoolDoc] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingExpenses, setPendingExpenses] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [onLeaveToday, setOnLeaveToday] = useState<any[]>([]);
  const [logOpen, setLogOpen] = useState(false);

  // ── listeners ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // School root doc (finance, attendance summary)
    unsubs.push(onSnapshot(doc(db, "schools", SCHOOL_ID), (snap) => {
      if (snap.exists()) setSchoolDoc(snap.data());
    }));

    // Students count
    unsubs.push(onSnapshot(collection(db, "schools", SCHOOL_ID, "students"), (snap) => {
      setStudentCount(snap.size);
    }));

    // Teachers count + on-leave today
    unsubs.push(onSnapshot(collection(db, "schools", SCHOOL_ID, "teachers"), (snap) => {
      setStaffCount(snap.size);
    }));

    // Classes count
    unsubs.push(onSnapshot(collection(db, "schools", SCHOOL_ID, "classes"), (snap) => {
      setClassCount(snap.size);
    }));

    // Activity feed
    unsubs.push(onSnapshot(
      query(collection(db, "schools", SCHOOL_ID, "activity"), orderBy("createdAt", "desc"), limit(8)),
      (snap) => {
        setActivities(snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            text: data.text ?? data.title ?? "Activity",
            time: relTime(data.createdAt),
            href: data.href ?? BASE,
          };
        }));
      }
    ));

    // Upcoming events
    unsubs.push(onSnapshot(
      query(collection(db, "schools", SCHOOL_ID, "events"), orderBy("date", "asc"), limit(3)),
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    ));

    // Pending leaves
    unsubs.push(onSnapshot(
      query(collection(db, "schools", SCHOOL_ID, "leaves"), where("status", "==", "Pending")),
      (snap) => setPendingLeaves(snap.size)
    ));

    // Pending expenses
    unsubs.push(onSnapshot(
      query(collection(db, "schools", SCHOOL_ID, "expenses"), where("status", "==", "Pending")),
      (snap) => setPendingExpenses(snap.size)
    ));

    // Pending admission applications
    unsubs.push(onSnapshot(
      query(collection(db, "schools", SCHOOL_ID, "applications"), where("status", "==", "Pending")),
      (snap) => setPendingApplications(snap.size)
    ));

    // Fetch all Approved leaves, filter dates client-side — no composite index needed
    const today = new Date().toISOString().split("T")[0];
    unsubs.push(onSnapshot(
      query(
        collection(db, "schools", SCHOOL_ID, "leaves"),
        where("status", "==", "Approved"),
        limit(50)
      ),
      (snap) => {
        const onLeave = snap.docs
          .filter(d => {
            const data = d.data() as any;
            const start = data.startDate ?? "";
            const end   = data.endDate   ?? today;
            return start <= today && end >= today;
          })
          .slice(0, 5)
          .map((d) => {
            const data = d.data() as any;
            const name = data.employeeName ?? data.name ?? "Staff";
            return {
              id: d.id,
              name,
              initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
              reason: data.leaveType ?? data.reason ?? "Leave",
            };
          });
        setOnLeaveToday(onLeave);
      }
    ));

    return () => unsubs.forEach((u) => u());
  }, []);


  // ── derived values ─────────────────────────────────────────────────────────
  const feeCollected = schoolDoc?.finance?.feeCollectedMonth ?? 0;
  const feeTarget = schoolDoc?.finance?.feeTargetMonth ?? 1;
  const feePercent = Math.min(100, Math.round((feeCollected / feeTarget) * 100));
  const attendancePct = schoolDoc?.attendance?.student ?? 0;
  const revenue = schoolDoc?.metrics?.revenue ?? 0;
  const feesDue = schoolDoc?.metrics?.pendingFees ?? 0;
  const staffPresent = staffCount - onLeaveToday.length;

  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  const kpis = [
    { label: "Students", value: studentCount.toLocaleString("en-IN"), delta: "", trend: "up", icon: GraduationCap, href: `${BASE}/academic/students` },
    { label: "Staff", value: staffCount.toLocaleString("en-IN"), delta: "", trend: "up", icon: Users, href: `${BASE}/hr/teaching-staff` },
    { label: "Revenue", value: revenue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), delta: "", trend: "up", icon: Wallet, href: `${BASE}/finance/payments` },
    { label: "Classes", value: classCount.toLocaleString("en-IN"), delta: "", trend: "up", icon: BookOpen, href: `${BASE}/academic/classes` },
    { label: "Fees Due", value: feesDue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), delta: "", trend: "down", icon: Clock, href: `${BASE}/finance/fees` },
    { label: "Attendance", value: `${attendancePct}%`, delta: "", trend: "up", icon: CalendarCheck, href: `${BASE}/academic/attendance` },
  ];

  const approvals = [
    { label: "Leave Requests", count: pendingLeaves, icon: Users, href: `${BASE}/hr/leaves`, note: "Staff & Teachers" },
    { label: "Expense Claims", count: pendingExpenses, icon: Wallet, href: `${BASE}/finance/expenses`, note: "Pending Review" },
    { label: "Admissions", count: pendingApplications, icon: GraduationCap, href: `${BASE}/admission/applications`, note: "New Applications" },
  ];

  const kpiStyles = [
    { bg: "bg-emerald-50", color: "text-emerald-600", border: "border-emerald-100", hover: "group-hover:border-emerald-200" },
    { bg: "bg-blue-50", color: "text-blue-600", border: "border-blue-100", hover: "group-hover:border-blue-200" },
    { bg: "bg-amber-50", color: "text-amber-600", border: "border-amber-100", hover: "group-hover:border-amber-200" },
    { bg: "bg-purple-50", color: "text-purple-600", border: "border-purple-100", hover: "group-hover:border-purple-200" },
    { bg: "bg-rose-50", color: "text-rose-600", border: "border-rose-100", hover: "group-hover:border-rose-200" },
    { bg: "bg-indigo-50", color: "text-indigo-600", border: "border-indigo-100", hover: "group-hover:border-indigo-200" },
  ];


  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-24 max-w-[1600px] mx-auto pt-2">

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((stat, idx) => {
          const s = kpiStyles[idx];
          return (
            <Link key={idx} href={stat.href} className={cn(
              "bg-white rounded-[16px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border transition-all duration-300 relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform hover:-translate-y-1",
              s.border, s.hover
            )}>
              <div className={cn("absolute -right-4 -bottom-4 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-all transform group-hover:scale-125 duration-700", s.color)}>
                <stat.icon size={80} strokeWidth={1.5} />
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-300", s.bg, s.color)}>
                  <stat.icon size={20} strokeWidth={2} />
                </div>
                {stat.trend === "up"
                  ? <TrendingUp size={14} className="text-emerald-500 mt-1" />
                  : <TrendingDown size={14} className="text-rose-500 mt-1" />}
              </div>
              <div className="relative z-10 mt-1">
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-0.5">{stat.label}</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Overview Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Attendance Overview */}
        <Link href={`${BASE}/academic/attendance`} className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 block">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Attendance Overview</h3>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Today</span>
          </div>
          <div className="p-4 flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0 drop-shadow-sm">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#10b981 0% ${attendancePct}%, #f1f5f9 ${attendancePct}% 100%)` }} />
              <div className="absolute inset-[8px] rounded-full bg-white shadow-inner" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-black text-gray-900 tracking-tighter">{attendancePct}%</p>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Students</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label: "Staff", value: `${schoolDoc?.attendance?.staff ?? 0}%`, color: "bg-blue-500" },
                { label: "Students", value: `${attendancePct}%`, color: "bg-emerald-500" },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>{row.label}</span><span>{row.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: row.value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Fee Collection */}
        <Link href={`${BASE}/finance/payments`} className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 block">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Fee Collection</h3>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">{currentMonth}</span>
          </div>
          <div className="p-4 space-y-5">
            <div>
              <p className="text-xl font-black text-gray-900 tracking-tight">
                {feeCollected.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                Target: {feeTarget.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-black text-[#144835]">{feePercent}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-[#144835] to-emerald-400 rounded-full" style={{ width: `${feePercent}%` }} />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50/50 text-emerald-700 text-[10px] font-bold w-full justify-center">
              <TrendingUp size={14} strokeWidth={2.5} /> {feePercent}% of monthly target collected
            </div>
          </div>
        </Link>

        {/* Staff Availability */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Staff Availability</h3>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 size={12} /> {staffPresent}/{staffCount} Present
            </span>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                On Leave Today ({onLeaveToday.length})
              </p>
              {onLeaveToday.length === 0 ? (
                <p className="text-xs text-gray-400 italic">All staff present today</p>
              ) : (
                <div className="space-y-3">
                  {onLeaveToday.map((p, i) => {
                    const palette = i % 3 === 0 ? "from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700"
                      : i % 3 === 1 ? "from-blue-50 to-blue-100 border-blue-200 text-blue-700"
                      : "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700";
                    return (
                      <div key={p.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${palette} flex items-center justify-center text-xs font-black shadow-sm`}>
                            {p.initials}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{p.name}</p>
                            <p className="text-[10px] font-bold text-gray-500">{p.reason}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-4 mt-3 border-t border-gray-50">
              <Link href={`${BASE}/hr/leaves`} className="h-9 inline-flex items-center justify-center w-full rounded-lg bg-[#144835]/5 hover:bg-[#144835] text-[#144835] hover:text-white text-xs font-bold transition-all duration-300">
                Manage Leaves
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
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
              View Log <ChevronRight size={12} className="text-gray-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
          <div className="p-4 flex-1 bg-gray-50/30">
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-8">No recent activity recorded yet.</p>
            ) : (
              <div className="relative border-l border-gray-200 ml-3 space-y-6 py-1">
                {activities.slice(0, 5).map((activity, idx) => (
                  <div key={activity.id} className="relative pl-6 group">
                    <div className={cn(
                      "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-[2px] border-white ring-2 ring-gray-50 transition-all duration-300",
                      idx === 0 ? "bg-[#144835] ring-[#144835]/10 scale-125 shadow-[0_0_10px_rgba(20,72,53,0.3)]" : "bg-gray-300 group-hover:bg-[#a2c144] group-hover:scale-110"
                    )} />
                    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] group-hover:border-[#144835]/30 group-hover:shadow-[0_8px_20px_rgba(20,72,53,0.08)] transition-all duration-300 transform group-hover:-translate-y-0.5">
                      <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{activity.text}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded">
                          <Clock size={10} /> {activity.time}
                        </p>
                        <Link href={activity.href} className="text-[10px] font-bold text-[#144835] uppercase tracking-wider hover:underline flex items-center gap-1">
                          View Details <ArrowUpRight size={10} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Pending Approvals */}
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center relative border border-rose-100">
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-[2px] border-white" />
                </span>
                <AlertCircle size={14} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 tracking-tight">Pending Approvals</h3>
                <p className="text-[9px] font-bold text-rose-600 mt-0.5 uppercase tracking-widest bg-rose-50 inline-block px-1.5 py-0.5 rounded">Requires Action</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50/30 space-y-2">
              {approvals.map((item, i) => (
                <Link href={item.href} key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:border-[#144835]/30 hover:shadow-[0_4px_15px_rgba(20,72,53,0.06)] transition-all group transform hover:-translate-y-0.5">
                  <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-[#144835]/5 group-hover:text-[#144835] group-hover:border-[#144835]/20 transition-all shrink-0">
                    <item.icon size={14} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 leading-snug group-hover:text-[#144835] transition-colors">
                      {item.count > 0 ? `${item.count} ` : ""}{item.label}
                    </p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{item.note}</p>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#144835] group-hover:text-white transition-colors shrink-0">
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
              <Link href={`${BASE}/hr/leaves`} className="w-full mt-2 h-10 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20">
                Review All Approvals
              </Link>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden relative hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Upcoming Events</h3>
              <Link href={`${BASE}/academic/timetable/new`} className="h-7 w-7 rounded-full bg-[#144835] text-white shadow-lg shadow-[#144835]/20 flex items-center justify-center hover:bg-[#144835]/90 hover:scale-110 transition-transform">
                <Plus size={14} />
              </Link>
            </div>
            <div className="p-4 space-y-4 bg-gray-50/30">
              {events.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-4">No upcoming events scheduled.</p>
              ) : (
                events.map((ev: any) => {
                  const d = ev.date?.toDate ? ev.date.toDate() : new Date(ev.date);
                  const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
                  const day = d.getDate().toString().padStart(2, "0");
                  return (
                    <div key={ev.id} className="flex items-start gap-3 group cursor-pointer">
                      <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center overflow-hidden group-hover:border-[#144835]/30 group-hover:shadow-md transition-all shrink-0">
                        <div className="bg-gray-100 w-full text-center py-0.5 text-[8px] font-black text-gray-500 group-hover:bg-[#144835]/10 group-hover:text-[#144835] transition-colors">{month}</div>
                        <div className="text-xs font-black text-gray-900 py-1">{day}</div>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="font-bold text-xs text-gray-900 group-hover:text-[#144835] transition-colors">{ev.title}</p>
                        {ev.location && (
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                            <MapPin size={8} /> {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <Link href={`${BASE}/academic/calendar`} className="h-10 inline-flex items-center justify-center w-full rounded-lg bg-white border border-gray-100 text-gray-700 text-xs font-bold hover:border-gray-300 hover:bg-gray-50 transition-all mt-1">
                Full Academic Calendar
              </Link>
            </div>
          </div>

        </div>
      </div>


      {/* ── Activity Log Drawer ── */}
      {logOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLogOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Activity</p>
                <h3 className="text-lg font-bold text-gray-900">Full Log</h3>
              </div>
              <button onClick={() => setLogOpen(false)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {activities.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-8">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((item, i) => (
                    <div key={`${item.id}-${i}`} className="rounded-lg border border-gray-100 bg-gray-50/60 p-4 hover:bg-white hover:shadow-sm hover:border-[#144835]/20 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{item.text}</p>
                          <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{item.time}</p>
                        </div>
                        <Link href={item.href} className="text-xs font-bold text-[#144835] hover:text-[#144835]/80 inline-flex items-center gap-1 shrink-0">
                          View <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
