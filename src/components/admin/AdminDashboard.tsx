"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Wallet,
  BookOpen,
  CalendarCheck,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  X,
  MapPin,
  UserPlus,
  Receipt,
  CalendarPlus,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  computeStudentAttendancePercent,
  isInCurrentMonth,
  isUpcomingEvent,
  mapApplicationDoc,
  mapEventCreatedDoc,
  mapExpenseDoc,
  mapLeaveDoc,
  mapMessageDoc,
  mapPaymentDoc,
  mapStudentDoc,
  mergeLiveActivities,
  relTime,
  type LiveActivity,
} from "@/lib/adminDashboardLive";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatInr(amount: number, compact = false): string {
  if (compact && amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

const SCHOOL_LABELS: Record<string, string> = {
  idpskalaburagi: "IDPS Kalaburagi",
  idpscherukupalli: "IDPS Cherukupalli",
};

const cardBase =
  "bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden transition-[border-color,background-color] duration-200";
const cardHover = "hover:border-[#144835]/35 active:border-[#144835]/40";
const cardHeader = "px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-gray-50/50";

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3 px-0.5">
      <h2 className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest">{title}</h2>
      {action}
    </div>
  );
}

type AdminDashboardProps = {
  schoolId: string;
};

export default function AdminDashboard({ schoolId }: AdminDashboardProps) {
  const base = `/schools/${schoolId}/admin`;

  const [schoolDoc, setSchoolDoc] = useState<Record<string, unknown> | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [activities, setActivities] = useState<{ id: string; text: string; time: string; href: string }[]>([]);
  const [activityBuckets, setActivityBuckets] = useState<Record<string, LiveActivity[]>>({});
  const [events, setEvents] = useState<{ id: string; title?: string; location?: string; date?: unknown }[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingExpenses, setPendingExpenses] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [onLeaveToday, setOnLeaveToday] = useState<
    { id: string; name: string; initials: string; reason: string }[]
  >([]);
  const [feeCollected, setFeeCollected] = useState(0);
  const [feeTarget, setFeeTarget] = useState(0);
  const [feesDue, setFeesDue] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [attendancePct, setAttendancePct] = useState(0);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [studentDocs, setStudentDocs] = useState<Record<string, unknown>[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const setFeedBucket = (key: string, items: LiveActivity[]) => {
    setActivityBuckets((prev) => ({ ...prev, [key]: items }));
  };

  useEffect(() => {
    setActivities(mergeLiveActivities(Object.values(activityBuckets).flat()));
  }, [activityBuckets]);

  useEffect(() => {
    setAttendancePct(computeStudentAttendancePercent(studentDocs, holidays));
  }, [studentDocs, holidays]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const today = new Date().toISOString().split("T")[0];

    unsubs.push(
      onSnapshot(doc(db, "schools", schoolId), (snap) => {
        if (snap.exists()) setSchoolDoc(snap.data() as Record<string, unknown>);
        setDataReady(true);
      })
    );

    unsubs.push(
      onSnapshot(collection(db, "schools", schoolId, "students"), (snap) => {
        setStudentCount(snap.size);
        setStudentDocs(snap.docs.map((d) => d.data() as Record<string, unknown>));
        const studentFeed = snap.docs
          .map((d) => mapStudentDoc(d.id, d.data() as Record<string, unknown>, base))
          .filter((x): x is LiveActivity => x !== null)
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 3);
        setFeedBucket("students", studentFeed);
      })
    );

    unsubs.push(onSnapshot(collection(db, "schools", schoolId, "teachers"), (snap) => setStaffCount(snap.size)));
    unsubs.push(onSnapshot(collection(db, "schools", schoolId, "classes"), (snap) => setClassCount(snap.size)));

    unsubs.push(
      onSnapshot(collection(db, "schools", schoolId, "holidays"), (snap) => {
        setHolidays(snap.docs.map((d) => String((d.data() as Record<string, unknown>).date ?? "")).filter(Boolean));
      })
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, "schools", schoolId, "payments"), orderBy("createdAt", "desc"), limit(15)),
        (snap) => {
          let monthTotal = 0;
          let allTime = 0;
          snap.docs.forEach((d) => {
            const data = d.data() as Record<string, unknown>;
            const amount = Number(data.amount) || 0;
            const status = String(data.status ?? "Completed");
            if (status === "Completed") {
              allTime += amount;
              if (isInCurrentMonth(data.createdAt ?? data.date)) monthTotal += amount;
            }
          });
          setFeeCollected(monthTotal);
          setRevenue(allTime);
          setFeedBucket(
            "payments",
            snap.docs
              .map((d) => mapPaymentDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => {
          setFeeCollected(0);
          setRevenue(0);
          setFeedBucket("payments", []);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, "schools", schoolId, "invoices"), orderBy("createdAt", "desc"), limit(50)),
        (snap) => {
          let due = 0;
          let target = 0;
          snap.docs.forEach((d) => {
            const data = d.data() as Record<string, unknown>;
            const amount = Number(data.amount) || 0;
            const paid = Number(data.amountPaid) || 0;
            due += Math.max(0, amount - paid);
            if (isInCurrentMonth(data.dueDate ?? data.createdAt)) target += amount;
          });
          setFeesDue(due);
          setFeeTarget(target);
        },
        () => {
          setFeesDue(0);
          setFeeTarget(0);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, "schools", schoolId, "events"), orderBy("date", "asc"), limit(20)),
        (snap) => {
          const upcoming = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as any))
            .filter((ev) => isUpcomingEvent(ev.date, today))
            .slice(0, 3);
          setEvents(upcoming);
          setFeedBucket(
            "events",
            snap.docs
              .map((d) => mapEventCreatedDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => {
          setEvents([]);
          setFeedBucket("events", []);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, "schools", schoolId, "leaves"), orderBy("createdAt", "desc"), limit(15)),
        (snap) => {
          setPendingLeaves(snap.docs.filter((d) => String((d.data() as Record<string, unknown>).status) === "Pending").length);
          setFeedBucket(
            "leaves",
            snap.docs
              .map((d) => mapLeaveDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
          setOnLeaveToday(
            snap.docs
              .filter((d) => {
                const data = d.data() as Record<string, string>;
                if (String(data.status) !== "Approved") return false;
                const start = data.from ?? data.startDate ?? "";
                const end = data.to ?? data.endDate ?? today;
                return start <= today && end >= today;
              })
              .slice(0, 5)
              .map((d) => {
                const data = d.data() as Record<string, string>;
                const name = data.employeeName ?? data.name ?? "Staff";
                return {
                  id: d.id,
                  name,
                  initials: name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
                  reason: data.leaveType ?? data.type ?? data.reason ?? "Leave",
                };
              })
          );
        },
        () => {
          setPendingLeaves(0);
          setOnLeaveToday([]);
          setFeedBucket("leaves", []);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, "schools", schoolId, "expenses"), orderBy("createdAt", "desc"), limit(15)),
        (snap) => {
          setPendingExpenses(snap.docs.filter((d) => String((d.data() as Record<string, unknown>).status) === "Pending").length);
          setFeedBucket(
            "expenses",
            snap.docs
              .map((d) => mapExpenseDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => {
          setPendingExpenses(0);
          setFeedBucket("expenses", []);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, "schools", schoolId, "applications"), orderBy("createdAt", "desc"), limit(15)),
        (snap) => {
          setPendingApplications(
            snap.docs.filter((d) => String((d.data() as Record<string, unknown>).status) === "Pending").length
          );
          setFeedBucket(
            "applications",
            snap.docs
              .map((d) => mapApplicationDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => {
          setPendingApplications(0);
          setFeedBucket("applications", []);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, "schools", schoolId, "messages"), orderBy("createdAt", "desc"), limit(10)),
        (snap) => {
          setFeedBucket(
            "messages",
            snap.docs
              .map((d) => mapMessageDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => setFeedBucket("messages", [])
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [schoolId, base]);

  const feePercent = feeTarget > 0 ? Math.min(100, Math.round((feeCollected / feeTarget) * 100)) : 0;
  const staffPresent = Math.max(0, staffCount - onLeaveToday.length);
  const staffAttendancePct = staffCount > 0 ? Math.round((staffPresent / staffCount) * 100) : 0;
  const pendingTotal = pendingLeaves + pendingExpenses + pendingApplications;

  const schoolName =
    String(schoolDoc?.name ?? schoolDoc?.displayName ?? SCHOOL_LABELS[schoolId] ?? "School Dashboard");

  const todayLong = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const todayShort = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  const kpis = useMemo(
    () => [
      { label: "Students", short: "Students", value: studentCount.toLocaleString("en-IN"), icon: GraduationCap, href: `${base}/academic/students`, accent: "emerald" },
      { label: "Staff", short: "Staff", value: staffCount.toLocaleString("en-IN"), icon: Users, href: `${base}/hr/teaching-staff`, accent: "blue" },
      { label: "Revenue", short: "Revenue", value: formatInr(revenue, true), icon: Wallet, href: `${base}/finance/payments`, accent: "amber" },
      { label: "Classes", short: "Classes", value: classCount.toLocaleString("en-IN"), icon: BookOpen, href: `${base}/academic/classes`, accent: "violet" },
      { label: "Fees Due", short: "Due", value: formatInr(feesDue, true), icon: Clock, href: `${base}/finance/fees`, accent: "rose" },
      { label: "Attendance", short: "Attend.", value: `${attendancePct}%`, icon: CalendarCheck, href: `${base}/academic/attendance`, accent: "teal" },
    ],
    [studentCount, staffCount, revenue, classCount, feesDue, attendancePct, base]
  );

  const accentMap: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-600", border: "border-emerald-200 hover:border-emerald-400" },
    blue: { bg: "bg-blue-500/10", icon: "text-blue-600", border: "border-blue-200 hover:border-blue-400" },
    amber: { bg: "bg-amber-500/10", icon: "text-amber-600", border: "border-amber-200 hover:border-amber-400" },
    violet: { bg: "bg-violet-500/10", icon: "text-violet-600", border: "border-violet-200 hover:border-violet-400" },
    rose: { bg: "bg-rose-500/10", icon: "text-rose-600", border: "border-rose-200 hover:border-rose-400" },
    teal: { bg: "bg-teal-500/10", icon: "text-teal-600", border: "border-teal-200 hover:border-teal-400" },
  };

  const quickActions = [
    { label: "Add student", short: "Student", href: `${base}/academic/students/new`, icon: UserPlus },
    { label: "Payment", short: "Pay", href: `${base}/finance/payments/new`, icon: Receipt },
    { label: "Event", short: "Event", href: `${base}/academic/calendar/new`, icon: CalendarPlus },
    { label: "Leaves", short: "Leave", href: `${base}/hr/leaves`, icon: ClipboardList },
  ];

  const approvals = [
    { label: "Leave requests", count: pendingLeaves, icon: Users, href: `${base}/hr/leaves`, note: "Staff & teachers" },
    { label: "Expense claims", count: pendingExpenses, icon: Wallet, href: `${base}/finance/expenses`, note: "Pending review" },
    { label: "Admissions", count: pendingApplications, icon: GraduationCap, href: `${base}/admission/applications`, note: "New applications" },
  ];

  const mobileHighlights = [
    { label: "Attendance", value: `${attendancePct}%`, href: `${base}/academic/attendance`, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "Fees", value: `${feePercent}%`, href: `${base}/finance/payments`, color: "text-[#144835] bg-[#144835]/5 border-[#144835]/20" },
    { label: "Pending", value: String(pendingTotal), href: `${base}/hr/leaves`, color: "text-rose-700 bg-rose-50 border-rose-200" },
    { label: "On leave", value: String(onLeaveToday.length), href: `${base}/hr/leaves`, color: "text-amber-700 bg-amber-50 border-amber-200" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 font-jost pb-20 sm:pb-24 max-w-[1600px] mx-auto -mx-0.5 sm:mx-auto">
      {/* Hero — compact on mobile / narrow sidebar */}
      <section className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#144835] via-[#1a5a40] to-[#0d2e22] text-white border border-[#0d2e22] ring-1 ring-inset ring-white/10">
        <div className="absolute -right-8 -top-8 h-32 sm:h-40 w-32 sm:w-40 rounded-full bg-[#a2c144]/20 blur-2xl pointer-events-none" />
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={11} className="text-[#a2c144] shrink-0" />
                  {getGreeting()}
                </span>
                {pendingTotal > 0 && (
                  <Link
                    href={`${base}/hr/leaves`}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-amber-100"
                  >
                    <AlertCircle size={10} />
                    {pendingTotal} pending
                  </Link>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">{schoolName}</h1>
              <p className="text-xs sm:text-sm text-white/75 mt-1">
                <span className="sm:hidden">{todayShort}</span>
                <span className="hidden sm:inline">{todayLong}</span>
              </p>
            </div>

            {/* Quick actions — horizontal scroll on small screens */}
            <div className="-mx-1 sm:mx-0">
              <div className="flex gap-2 overflow-x-auto pb-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="snap-start shrink-0 inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-2 sm:px-3 text-[10px] sm:text-[11px] font-bold transition-colors min-w-[72px] sm:min-w-0 justify-center sm:justify-start"
                  >
                    <action.icon size={14} className="text-[#a2c144] shrink-0" />
                    <span className="sm:hidden">{action.short}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile / narrow: at-a-glance chips */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden -mx-0.5 px-0.5">
        {mobileHighlights.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              "snap-start shrink-0 flex flex-col min-w-[88px] px-3 py-2.5 rounded-xl border font-bold transition-colors",
              chip.color
            )}
          >
            <span className="text-[9px] uppercase tracking-wider opacity-80">{chip.label}</span>
            <span className="text-base font-black mt-0.5">{chip.value}</span>
          </Link>
        ))}
      </div>

      {/* KPIs — scroll on mobile & md (minimized sidebar), grid on xl */}
      <section>
        <SectionHeading
          title="Key metrics"
          action={
            <Link
              href={`${base}/reports/analytics`}
              className="text-[10px] sm:text-[11px] font-bold text-[#144835] hover:underline inline-flex items-center gap-0.5 shrink-0"
            >
              Analytics <ArrowUpRight size={11} />
            </Link>
          }
        />

        {/* Mobile + tablet + collapsed sidebar */}
        <div className="xl:hidden -mx-0.5">
          <div className="flex gap-2.5 overflow-x-auto pb-1 px-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!dataReady
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="snap-start shrink-0 w-[132px] h-[92px] rounded-xl bg-white border border-gray-200 animate-pulse" />
                ))
              : kpis.map((stat) => {
                  const a = accentMap[stat.accent];
                  return (
                    <Link
                      key={stat.label}
                      href={stat.href}
                      className={cn(
                        "snap-start shrink-0 w-[132px] rounded-xl p-3 border bg-white flex flex-col justify-between min-h-[92px]",
                        a.border
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", a.bg, a.icon)}>
                          <stat.icon size={16} strokeWidth={2} />
                        </div>
                        <ArrowUpRight size={12} className="text-gray-300" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate">{stat.short}</p>
                        <p className="text-base font-black text-gray-900 tracking-tight truncate">{stat.value}</p>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>

        {/* Full width desktop */}
        <div className="hidden xl:grid grid-cols-6 gap-3">
          {!dataReady
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[100px] rounded-2xl bg-white border border-gray-200 animate-pulse" />
              ))
            : kpis.map((stat) => {
                const a = accentMap[stat.accent];
                return (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className={cn("group rounded-2xl p-4 border bg-white transition-colors", a.border, cardHover)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", a.bg, a.icon)}>
                        <stat.icon size={18} strokeWidth={2} />
                      </div>
                      <ArrowUpRight size={14} className="text-gray-300 group-hover:text-[#144835] transition-colors" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-black text-gray-900 tracking-tight mt-0.5">{stat.value}</p>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* Overview */}
      <section>
        <SectionHeading title="Today's overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <Link href={`${base}/academic/attendance`} className={cn(cardBase, cardHover, "block")}>
            <div className={cn(cardHeader, "flex items-center justify-between gap-2")}>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Attendance</h3>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">Live</span>
            </div>
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              <div className="flex items-center gap-4 sm:block">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 mx-auto sm:mx-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${attendancePct} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm sm:text-base font-black text-gray-900">{attendancePct}%</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase sm:hidden flex-1">Student attendance today</p>
              </div>
              <div className="flex-1 space-y-2.5 sm:space-y-3 w-full">
                {[
                  { label: "Students", pct: attendancePct, color: "bg-emerald-500" },
                  { label: "Staff", pct: staffAttendancePct, color: "bg-blue-500" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-[11px] sm:text-xs font-bold text-gray-600 mb-1">
                      <span>{row.label}</span>
                      <span>{row.pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2 overflow-hidden border border-gray-100">
                      <div className={cn("h-full rounded-full", row.color)} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Link>

          <Link href={`${base}/finance/payments`} className={cn(cardBase, cardHover, "block")}>
            <div className={cn(cardHeader, "flex items-center justify-between gap-2")}>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Fee collection</h3>
              <span className="text-[9px] font-bold text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded shrink-0">
                {currentMonth.slice(0, 3)}
              </span>
            </div>
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">{formatInr(feeCollected, true)}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Target {formatInr(feeTarget, true)}</p>
                </div>
                <span className="text-sm font-black text-[#144835] shrink-0">{feePercent}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-[#144835] to-[#a2c144] rounded-full"
                  style={{ width: `${feePercent}%` }}
                />
              </div>
            </div>
          </Link>

          <div className={cn(cardBase, "flex flex-col sm:col-span-2 xl:col-span-1")}>
            <div className={cn(cardHeader, "flex items-center justify-between gap-2 flex-wrap")}>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Staff</h3>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> {staffPresent}/{staffCount}
              </span>
            </div>
            <div className="p-3 sm:p-4 flex-1 flex flex-col sm:flex-row xl:flex-col gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  On leave ({onLeaveToday.length})
                </p>
                {onLeaveToday.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-4 sm:py-6 text-center">
                    <p className="text-[11px] sm:text-xs font-medium text-gray-500">All present today</p>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-[120px] sm:max-h-none overflow-y-auto sm:overflow-visible">
                    {onLeaveToday.map((p, i) => (
                      <li key={p.id} className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border shrink-0",
                            i % 3 === 0 && "bg-amber-50 text-amber-800 border-amber-200",
                            i % 3 === 1 && "bg-blue-50 text-blue-800 border-blue-200",
                            i % 3 === 2 && "bg-emerald-50 text-emerald-800 border-emerald-200"
                          )}
                        >
                          {p.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] sm:text-xs font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{p.reason}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Link
                href={`${base}/hr/leaves`}
                className="h-9 shrink-0 inline-flex items-center justify-center rounded-xl border-2 border-[#144835] bg-[#144835] text-white text-xs font-bold hover:bg-[#0f3628] sm:w-full xl:w-full"
              >
                Manage leaves
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Activity + sidebar — stacks on mobile / minimized */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <div className={cn(cardBase, "xl:col-span-2 flex flex-col min-w-0")}>
          <div className={cn(cardHeader, "flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between")}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-[#144835]/10 text-[#144835] flex items-center justify-center border border-[#144835]/15 shrink-0">
                <Activity size={16} className="sm:hidden" />
                <Activity size={18} className="hidden sm:block" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-gray-900">Recent activity</h2>
                <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">Live — payments, leaves, enrollments & more</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className="h-8 px-3 inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white text-[11px] sm:text-xs font-bold text-gray-700 hover:border-[#144835]/30 w-full sm:w-auto"
            >
              View log <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-3 sm:p-4 flex-1 min-w-0">
            {activities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-8 sm:py-12 text-center">
                <Activity size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs sm:text-sm font-medium text-gray-500">No live activity yet</p>
                <p className="text-[10px] text-gray-400 mt-1">Updates appear when teachers or admins record actions</p>
              </div>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {activities.slice(0, 5).map((activity, idx) => (
                  <li
                    key={activity.id}
                    className={cn(
                      "flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-colors",
                      idx === 0 ? "border-[#144835]/35 bg-[#144835]/[0.04]" : "border-gray-200"
                    )}
                  >
                    <div className={cn("mt-1.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0", idx === 0 ? "bg-[#144835]" : "bg-gray-300")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 sm:line-clamp-none">{activity.text}</p>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                          <Clock size={9} /> {activity.time}
                        </span>
                        <Link href={activity.href} className="text-[9px] sm:text-[10px] font-bold text-[#144835] shrink-0">
                          Details →
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
          <div className={cardBase}>
            <div className={cn(cardHeader, "flex items-center gap-2")}>
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                <AlertCircle size={15} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Approvals</h3>
                <p className="text-[9px] sm:text-[10px] text-gray-500">{pendingTotal} need action</p>
              </div>
            </div>
            <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
              {approvals.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-gray-200 bg-white hover:border-[#144835]/35 transition-colors group"
                >
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:border-[#144835]/20 shrink-0">
                    <item.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      {item.count > 0 && (
                        <span className="inline-flex min-w-[16px] h-4 px-1 items-center justify-center rounded bg-rose-50 border border-rose-200 text-rose-700 text-[9px]">
                          {item.count}
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{item.note}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </Link>
              ))}
              <Link
                href={`${base}/hr/leaves`}
                className="w-full h-9 sm:h-10 inline-flex items-center justify-center rounded-xl border-2 border-gray-900 bg-gray-900 text-white text-[11px] sm:text-xs font-bold"
              >
                Review all
              </Link>
            </div>
          </div>

          <div className={cardBase}>
            <div className={cn(cardHeader, "flex items-center justify-between")}>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Events</h3>
              <Link
                href={`${base}/academic/calendar/new`}
                className="h-7 w-7 rounded-full bg-[#144835] text-white flex items-center justify-center border-2 border-[#0f3628]"
                aria-label="Add event"
              >
                <Plus size={14} />
              </Link>
            </div>
            <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              {events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center">
                  <p className="text-[11px] text-gray-500">No events scheduled</p>
                </div>
              ) : (
                events.map((ev) => {
                  const d =
                    ev.date &&
                    typeof ev.date === "object" &&
                    "toDate" in ev.date &&
                    typeof (ev.date as { toDate: () => Date }).toDate === "function"
                      ? (ev.date as { toDate: () => Date }).toDate()
                      : new Date(ev.date as string);
                  const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
                  const day = d.getDate().toString().padStart(2, "0");
                  return (
                    <div key={ev.id} className="flex items-center gap-2.5 sm:gap-3">
                      <div className="h-10 w-10 rounded-lg border border-gray-200 bg-white flex flex-col items-center overflow-hidden shrink-0">
                        <div className="w-full text-center py-0.5 text-[7px] font-black text-gray-500 bg-gray-50 border-b border-gray-200">{month}</div>
                        <div className="text-xs font-black text-gray-900 flex-1 flex items-center">{day}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">{ev.title}</p>
                        {ev.location && (
                          <p className="text-[9px] text-gray-500 truncate flex items-center gap-0.5 mt-0.5">
                            <MapPin size={9} className="shrink-0" /> {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <Link
                href={`${base}/academic/calendar`}
                className="h-9 sm:h-10 inline-flex items-center justify-center w-full rounded-xl border border-gray-200 text-[11px] sm:text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Full calendar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {logOpen && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close activity log"
            className="absolute inset-0 bg-black/40"
            onClick={() => setLogOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-full sm:max-w-[400px] lg:max-w-[440px] bg-white border-l-2 border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Activity</p>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">Full log</h3>
              </div>
              <button
                type="button"
                onClick={() => setLogOpen(false)}
                className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-3 sm:p-4 overflow-auto flex-1 space-y-2">
              {activities.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No live activity recorded yet.</p>
              ) : null}
              {activities.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">{item.text}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.time}</p>
                    <Link href={item.href} className="text-xs font-bold text-[#144835] shrink-0">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
