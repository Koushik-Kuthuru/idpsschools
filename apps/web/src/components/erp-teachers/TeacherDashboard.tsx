"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/contexts/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const cardBase =
  "bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden transition-[border-color,background-color] duration-200";
const cardHover = "hover:border-[#144835]/35 active:border-[#144835]/40";
const cardHeader = "px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-gray-50/50";

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3 px-0.5">
      <h2 className="erp-label">{title}</h2>
      {action}
    </div>
  );
}

type TeacherDashboardProps = {
  schoolId: string;
};

export default function TeacherDashboard({ schoolId }: TeacherDashboardProps) {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const userName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Teacher";

  const dateLabel = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeLabel = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const kpis = useMemo(
    () => [
      { label: "My Classes", short: "Classes", value: "4", icon: BookOpen, accent: "emerald" },
      { label: "My Students", short: "Students", value: "145", icon: Users, accent: "blue" },
      { label: "Avg Attendance", short: "Attend.", value: "92%", icon: Calendar, accent: "violet" },
      { label: "Pending Tasks", short: "Tasks", value: "12", icon: AlertCircle, accent: "rose" },
    ],
    []
  );

  const accentMap: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-600", border: "border-emerald-200 hover:border-emerald-400" },
    blue: { bg: "bg-blue-500/10", icon: "text-blue-600", border: "border-blue-200 hover:border-blue-400" },
    violet: { bg: "bg-violet-500/10", icon: "text-violet-600", border: "border-violet-200 hover:border-violet-400" },
    rose: { bg: "bg-rose-500/10", icon: "text-rose-600", border: "border-rose-200 hover:border-rose-400" },
  };

  const schedule = [
    { time: "08:30 AM", class: "Grade 10A", subject: "Mathematics", type: "Lecture", status: "completed" as const },
    { time: "10:00 AM", class: "Grade 9C", subject: "Physics", type: "Lab Session", status: "current" as const },
    { time: "11:30 AM", class: "Grade 10B", subject: "Mathematics", type: "Lecture", status: "upcoming" as const },
    { time: "02:00 PM", class: "Grade 8A", subject: "Homeroom", type: "Mentoring", status: "upcoming" as const },
  ];

  const quickActions = [
    { name: "Mark Attendance", icon: Check, accent: "emerald" },
    { name: "Upload Grades", icon: Award, accent: "blue" },
    { name: "Message Parents", icon: MessageSquare, accent: "violet" },
    { name: "Leave Request", icon: Calendar, accent: "amber" },
  ];

  const upcomingDeadlines = [
    { title: "Submit Mid-Term Grades", course: "Grade 10 Math", due: "Tomorrow, 5:00 PM" },
    { title: "Review Lab Reports", course: "Grade 9 Physics", due: "Friday, 12:00 PM" },
    { title: "Create Lesson Plan", course: "Week 12", due: "Next Monday" },
  ];

  const quickAccent: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-200",
    blue: "text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-200",
    violet: "text-violet-600 bg-violet-50 border-violet-100 hover:border-violet-200",
    amber: "text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-200",
  };

  return (
    <div className="erp-body space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-20 sm:pb-24 max-w-[1600px] mx-auto -mx-0.5 sm:mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{getGreeting()},</p>
          <h1 className="erp-page-title mt-0.5 truncate">{userName}</h1>
          <p className="erp-caption mt-1">Here is what is happening in your classes today.</p>
        </div>
        <div className="inline-flex items-center gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shrink-0 whitespace-nowrap">
          <span className="font-medium text-gray-700">{dateLabel}</span>
          <span className="text-gray-300" aria-hidden="true">
            ·
          </span>
          <span className="text-gray-500 tabular-nums">{timeLabel}</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#144835]/20 bg-[#144835]/5 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
          <Clock size={16} strokeWidth={2.25} />
        </div>
        <p className="text-sm font-semibold text-[#144835]">Next class: Grade 9C · Physics in 15 minutes</p>
      </div>

      <section>
        <div className="xl:hidden -mx-0.5">
          <div className="flex gap-2.5 overflow-x-auto pb-1 px-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {kpis.map((stat) => {
              const a = accentMap[stat.accent];
              return (
                <div
                  key={stat.label}
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
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide truncate">{stat.short}</p>
                    <p className="erp-metric text-base truncate">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden xl:grid grid-cols-4 gap-3">
          {kpis.map((stat) => {
            const a = accentMap[stat.accent];
            return (
              <div key={stat.label} className={cn("group rounded-2xl p-4 border bg-white transition-colors", a.border, cardHover)}>
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", a.bg, a.icon)}>
                    <stat.icon size={18} strokeWidth={2} />
                  </div>
                  <ArrowUpRight size={14} className="text-gray-300 group-hover:text-[#144835] transition-colors" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="erp-metric text-xl mt-0.5">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <SectionHeading
            title="Today's schedule"
            action={
              <button type="button" className="text-xs font-semibold text-[#144835] hover:underline flex items-center gap-0.5">
                View timetable <ChevronRight size={14} />
              </button>
            }
          />
          <div className={cn(cardBase)}>
            <div className={cardHeader}>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#144835]" />
                <h3 className="erp-section-title">Class periods</h3>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {schedule.map((slot, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-4 px-3 sm:px-4 py-3 sm:py-3.5",
                    slot.status === "current" && "bg-[#144835]/5",
                    slot.status === "completed" && "opacity-60"
                  )}
                >
                  <div className="w-16 shrink-0">
                    <p className="text-xs font-semibold text-gray-700 tabular-nums">{slot.time}</p>
                  </div>
                  <div className="h-10 w-1 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    <div
                      className={cn(
                        "w-full rounded-full transition-all",
                        slot.status === "current" ? "h-full bg-[#144835]" : slot.status === "completed" ? "h-full bg-emerald-400" : "h-0"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{slot.class}</p>
                      <p className="erp-caption mt-0.5 truncate">
                        {slot.subject} · {slot.type}
                      </p>
                    </div>
                    {slot.status === "current" ? (
                      <span className="shrink-0 rounded-full bg-[#144835] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Ongoing
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div>
            <SectionHeading title="Quick actions" />
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((action) => (
                <button
                  key={action.name}
                  type="button"
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border p-3 sm:p-4 transition-colors",
                    quickAccent[action.accent]
                  )}
                >
                  <action.icon size={18} strokeWidth={2} />
                  <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{action.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading title="Action required" />
            <div className={cn(cardBase)}>
              <div className="divide-y divide-gray-100">
                {upcomingDeadlines.map((item, idx) => (
                  <div key={idx} className="flex gap-3 px-3 sm:px-4 py-3 hover:bg-gray-50/80 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <FileText size={16} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="erp-caption mt-0.5 truncate">
                        {item.course} · <span className="text-rose-600 font-medium">{item.due}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
