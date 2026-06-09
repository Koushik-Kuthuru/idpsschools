"use client";

import AdminPageHeader from "@/components/admin/PageHeader";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CalendarDays, ChevronRight, Download, Eye, Mail, Pencil, Plus, Printer, Settings, Sparkles, Users } from "lucide-react";
import { collection, doc, getDoc, getDocs, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
type SlotKey = "08:00-09:00" | "09:00-10:00" | "10:30-11:30";

type Slot = {
 subject: string;
 room: string;
 accent: "emerald" | "blue" | "orange" | "purple";
};

const days: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const slotKeys: SlotKey[] = ["08:00-09:00", "09:00-10:00", "10:30-11:30"];

function emptyGrid(): Record<Day, Record<SlotKey, Slot>> {
 return {
 Monday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 Tuesday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 Wednesday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 Thursday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 Friday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 };
}

function keyPart(v: string) {
 return encodeURIComponent(String(v || "").trim()).replace(/%/g, "_");
}

function timetableDocId(nextScope: "term" | "month" | "date", nextKey: string, nextGrade: string, nextSection: string) {
 return `${nextScope}__${keyPart(nextKey)}__${keyPart(nextGrade)}__${keyPart(nextSection)}`;
}

function accentClasses(accent: Slot["accent"]) {
 if (accent === "emerald") return "bg-emerald-50/50 border-emerald-200 text-emerald-900";
 if (accent === "blue") return "bg-blue-50/50 border-blue-200 text-blue-900";
 if (accent === "purple") return "bg-purple-50/50 border-purple-200 text-purple-900";
 return "bg-orange-50/50 border-orange-200 text-orange-900";
}

function accentBorder(accent: Slot["accent"]) {
 if (accent === "emerald") return "border-l-emerald-600";
 if (accent === "blue") return "border-l-blue-600";
 if (accent === "purple") return "border-l-purple-600";
 return "border-l-orange-600";
}

type ViewMode = "month" | "week" | "day";

function pad2(n: number) {
 return n.toString().padStart(2, "0");
}

function formatMonthTitle(d: Date) {
 const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
 return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateLabel(d: Date) {
 return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function startOfMonth(d: Date) {
 return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
 return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function addDays(d: Date, delta: number) {
 const copy = new Date(d);
 copy.setDate(copy.getDate() + delta);
 return copy;
}

function dayIndexMondayStart(d: Date) {
 const js = d.getDay();
 return (js + 6) % 7;
}

function startOfWeekMonday(d: Date) {
 return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dayIndexMondayStart(d));
}

function weekdayFromDate(d: Date): Day | null {
 const js = d.getDay();
 if (js === 1) return "Monday";
 if (js === 2) return "Tuesday";
 if (js === 3) return "Wednesday";
 if (js === 4) return "Thursday";
 if (js === 5) return "Friday";
 return null;
}

export default function AdminTimetablePage() {
 const searchParams = useSearchParams();
 const schoolId = "idpskalaburagi";
 const allClassesKey = "All";
 const allSectionsKey = "All";
 const [grade, setGrade] = useState(allClassesKey);
 const [section, setSection] = useState(allSectionsKey);
 const [term, setTerm] = useState("");
 const [viewMode, setViewMode] = useState<ViewMode>("week");
 const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
 const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(new Date()));
 const [isMounted, setIsMounted] = useState(false);
 const [scope, setScope] = useState<"term" | "month" | "date">("term");
 const [monthKey, setMonthKey] = useState<string>(() => {
 const d = new Date();
 return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
 });
 const [dateKey, setDateKey] = useState<string>(() => {
 const d = new Date();
 return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
 });
 const [grid, setGrid] = useState<Record<Day, Record<SlotKey, Slot>>>(emptyGrid());
 const [scheduleError, setScheduleError] = useState<string | null>(null);
 const [classOptions, setClassOptions] = useState<string[]>([]);
 const [sectionOptions, setSectionOptions] = useState<string[]>([]);

 const gradeLabel = (g: string) => {
    if (g === allClassesKey || g === 'all') return 'All Classes';
    return /^\d+$/.test(g) ? `Grade ${g}` : g;
  };

 useEffect(() => {
 async function loadMeta() {
 try {
 const snap = await getDocs(query(collection(db, "schools", schoolId, "classes")));
 const raw = snap.docs.map((d) => d.data());
 
 const grades = raw.map(c => String(c.grade ?? c.name ?? "").trim()).filter(Boolean);
 const sections = raw.map(c => String(c.section ?? "").trim().toUpperCase()).filter(Boolean);

 const uniqueGrades = Array.from(new Set(grades)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
 const uniqueSections = Array.from(new Set(sections)).sort((a, b) => a.localeCompare(b));

 setClassOptions([allClassesKey, ...uniqueGrades]);
 setSectionOptions([allSectionsKey, ...uniqueSections]);
 } catch (err) {
 console.error("Error loading classes for meta:", err);
 setClassOptions([allClassesKey]);
 setSectionOptions([allSectionsKey]);
 }
 }
 loadMeta();
 }, [schoolId, allClassesKey, allSectionsKey]);

 useEffect(() => {
 if (classOptions.length && !classOptions.includes(grade)) setGrade(classOptions[0]);
 }, [grade, classOptions]);

 useEffect(() => {
 if (sectionOptions.length && !sectionOptions.includes(section)) setSection(sectionOptions[0]);
 }, [section, sectionOptions]);

 const loadSchedule = useCallback(async (nextScope: "term" | "month" | "date", nextKey: string, nextGrade: string, nextSection: string) => {
 try {
 setScheduleError(null);
 const key = String(nextKey || "").trim();
 const g = String(nextGrade || "").trim();
 const s = String(nextSection || "").trim().toUpperCase();
 if (!key || !g || !s) {
 setGrid(emptyGrid());
 return;
 }

 const ref = doc(db, "schools", schoolId, "timetables", timetableDocId(nextScope, key, g, s));
 const snap = await getDoc(ref);
 if (!snap.exists()) {
 setGrid(emptyGrid());
 return;
 }
 const data = snap.data() as any;
 const tt = data?.timetable;
 setGrid(tt ? (tt as any) : emptyGrid());
 } catch (e: any) {
 setScheduleError(e?.message || "Failed to load schedule");
 }
 }, [schoolId]);

 useEffect(() => {
 setIsMounted(true);
 }, []);

 useEffect(() => {
 const urlScope = (searchParams.get("scope") || "").toLowerCase();
 const urlKey = searchParams.get("key") || "";
 const urlGrade = searchParams.get("grade") || "";
 const urlSection = searchParams.get("section") || "";

 const nextScope = urlScope === "term" || urlScope === "month" || urlScope === "date" ? (urlScope as any) : null;
 if (urlGrade) setGrade(urlGrade);
 if (urlSection) setSection(urlSection.toUpperCase());

 if (nextScope && urlKey) {
 setScope(nextScope);
 if (nextScope === "term") setTerm(urlKey);
 if (nextScope === "month") setMonthKey(urlKey);
 if (nextScope === "date") setDateKey(urlKey);
 loadSchedule(nextScope, urlKey, urlGrade || grade, (urlSection || section).toUpperCase());
 }
 }, [grade, loadSchedule, searchParams, section]);

 const activeKey = scope === "term" ? term : scope === "month" ? monthKey : dateKey;

 if (!isMounted) {
 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto flex items-center justify-center min-h-[60vh]">
 <div className="flex flex-col items-center gap-4 opacity-50">
 <div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin"></div>
 <p className="text-xs font-bold text-gray-500">Loading Timetable...</p>
 </div>
 </div>
 );
 }

 const weekStart = startOfWeekMonday(selectedDate);
 const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
 const selectedWeekday = weekdayFromDate(selectedDate);
 const monthStart = startOfMonth(monthCursor);
 const monthGridStart = addDays(monthStart, -dayIndexMondayStart(monthStart));
 const monthCells = Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i));

 async function saveSchedule(nextScope = scope, nextKey = activeKey) {
 try {
 setScheduleError(null);
 const key = String(nextKey || "").trim();
 const g = String(grade || "").trim();
 const s = String(section || "").trim().toUpperCase();
 if (!key || !g || !s) throw new Error("Missing scope/key/grade/section");

 const ref = doc(db, "schools", schoolId, "timetables", timetableDocId(nextScope, key, g, s));
 await setDoc(
 ref,
 {
 scope: nextScope,
 key,
 grade: g,
 section: s,
 timetable: grid,
 updatedAt: new Date().toISOString(),
 },
 { merge: true }
 );
 } catch (e: any) {
 setScheduleError(e?.message || "Failed to save schedule");
 }
 }

 function quickEdit(day: Day, slotKey: SlotKey) {
 const current = grid[day][slotKey];
 const subject = typeof window !== "undefined" ? window.prompt("Subject", current.subject) ?? current.subject : current.subject;
 const room = typeof window !== "undefined" ? window.prompt("Room", current.room) ?? current.room : current.room;
 const accents: Slot["accent"][] = ["emerald", "blue", "purple", "orange"];
 const accentInput = typeof window !== "undefined" ? window.prompt("Accent (emerald|blue|purple|orange)", current.accent) ?? current.accent : current.accent;
 const accent = accents.includes(accentInput as any) ? (accentInput as Slot["accent"]) : current.accent;
 setGrid((prev) => ({
 ...prev,
 [day]: {
 ...prev[day],
 [slotKey]: { subject, room, accent },
 },
 }));
 }

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <AdminPageHeader
  title="Timetable"
  description="Manage and view class schedules across all grades"
  actions={
   <>
 <ExportButton data={Object.entries(grid).map(([day, slots]) => ({ day, ...slots }))} filename="Timetable" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-gray-200 px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors" iconSize={14} />
 <Link href={`/schools/${schoolId}/admin/academic/timetable/new`} className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
 <Plus size={14} /> Create Schedule
 </Link>
   </>
  }
 />
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 {/* Controls */}
 <div className="p-4 border-b border-gray-100 bg-gray-50/50">
 {scheduleError && (
 <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {scheduleError}
 </div>
 )}
 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="flex-1 min-w-[140px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Grade</label>
 <div className="relative">
 <select
 value={grade}
 onChange={(e) => {
 setGrade(e.target.value);
 setGrid(emptyGrid());
 setScheduleError(null);
 }}
 className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 hover:bg-gray-50 transition-colors shadow-sm"
 >
 {classOptions.map((g) => (
 <option key={g} value={g}>
 {gradeLabel(g)}
 </option>
 ))}
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
 </div>
 </div>

 <div className="flex-1 min-w-[140px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Section</label>
 <div className="relative">
 <select
 value={section}
 onChange={(e) => {
 setSection(e.target.value);
 setGrid(emptyGrid());
 setScheduleError(null);
 }}
 className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 hover:bg-gray-50 transition-colors shadow-sm"
 >
 {sectionOptions.map((s) => (
 <option key={s} value={s}>
 {s === allSectionsKey ? "All Sections" : `Section ${s}`}
 </option>
 ))}
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
 </div>
 </div>

 <div className="flex-1 min-w-[180px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Term</label>
 <div className="relative">
 <select
 value={term}
 onChange={(e) => {
 setTerm(e.target.value);
 setGrid(emptyGrid());
 setScheduleError(null);
 }}
 className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option value="" disabled>
 Select Term
 </option>
 <option>Term 1 (2023-24)</option>
 <option>Term 2 (2023-24)</option>
 <option>Term 3 (2023-24)</option>
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
 </div>
 </div>
 
 <div className="pt-4 flex gap-2">
 <button type="button" className="h-9 px-3 rounded-lg bg-orange-50 text-orange-600 font-bold text-xs hover:bg-orange-100 transition-colors shadow-sm inline-flex items-center gap-1.5">
 <Eye size={14} /> View
 </button>
 <button type="button" className="h-9 w-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm" title="Edit">
 <Pencil size={14} />
 </button>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between xl:justify-end gap-3 w-full xl:w-auto pt-2 xl:pt-4">
 <div className="inline-flex rounded-lg bg-gray-100/80 p-1 border border-gray-200/60 w-fit">
 {(["month", "week", "day"] as const).map((m) => {
 const active = viewMode === m;
 const label = m.charAt(0).toUpperCase() + m.slice(1);
 return (
 <button
 key={m}
 type="button"
 onClick={() => setViewMode(m)}
 className={cn(
 "px-3 py-1 rounded-md text-xs font-bold transition-all min-w-[60px]",
 active ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" : "text-gray-500 hover:text-gray-700"
 )}
 >
 {label}
 </button>
 );
 })}
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => {
 if (viewMode === "month") setMonthCursor((d) => addMonths(d, -1));
 if (viewMode === "week") setSelectedDate((d) => addDays(d, -7));
 if (viewMode === "day") setSelectedDate((d) => addDays(d, -1));
 }}
 className="h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm inline-flex items-center justify-center transition-colors"
 >
 <ChevronRight size={14} className="rotate-180" />
 </button>

 <button
 type="button"
 onClick={() => {
 const now = new Date();
 setSelectedDate(now);
 setMonthCursor(startOfMonth(now));
 }}
 className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
 >
 Today
 </button>

 <button
 type="button"
 onClick={() => {
 if (viewMode === "month") setMonthCursor((d) => addMonths(d, 1));
 if (viewMode === "week") setSelectedDate((d) => addDays(d, 7));
 if (viewMode === "day") setSelectedDate((d) => addDays(d, 1));
 }}
 className="h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm inline-flex items-center justify-center transition-colors"
 >
 <ChevronRight size={14} />
 </button>
 </div>
 <div className="flex items-center gap-2">
 <select value={scope} onChange={(e) => setScope(e.target.value as any)} className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700">
 <option value="term">Term</option>
 <option value="month">Month</option>
 <option value="date">Date</option>
 </select>
 {scope === "month" && (
 <input type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700" />
 )}
 {scope === "date" && (
 <input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700" />
 )}
 <button onClick={() => loadSchedule(scope, activeKey, grade, section)} type="button" className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm">Load</button>
 <button onClick={() => saveSchedule()} type="button" className="h-9 px-3 rounded-lg bg-[#144835] text-white text-xs font-bold hover:bg-[#144835]/90 shadow-sm">Save</button>
 </div>
 </div>
 </div>
 </div>

 <div className="p-4">
 <div className="mb-4">
 <h2 className="text-lg font-bold text-gray-900">
 {viewMode === "month" && formatMonthTitle(monthCursor)}
 {viewMode === "week" && `${formatDateLabel(weekDates[0])} - ${formatDateLabel(weekDates[4])}`}
 {viewMode === "day" && formatDateLabel(selectedDate)}
 </h2>
 </div>
 {viewMode === "month" ? (
 <div className="rounded-[16px] border border-gray-100 overflow-hidden">
 <div className="grid grid-cols-7 bg-gray-50/60 text-xs font-bold text-gray-500 uppercase tracking-wider">
 {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
 <div key={d} className="px-3 py-2 border-b border-gray-100">{d}</div>
 ))}
 </div>
 <div className="grid grid-cols-7">
 {monthCells.map((d) => {
 const inMonth = d.getMonth() === monthCursor.getMonth();
 const isToday = formatDateLabel(d) === formatDateLabel(new Date());
 const weekday = weekdayFromDate(d);
 const daySlot = weekday ? grid[weekday]["08:00-09:00"] : null;
 return (
 <button
 key={d.toISOString()}
 type="button"
 onClick={() => {
 setSelectedDate(d);
 setViewMode("day");
 }}
 className={cn(
 "h-24 border-b border-r border-gray-100 p-2 text-left hover:bg-gray-50/50 transition-colors",
 !inMonth ? "bg-gray-50/40 text-gray-400" : "bg-white",
 isToday ? "ring-1 ring-[#144835]/20" : ""
 )}
 >
 <div className="flex items-center justify-between">
 <p className={cn("text-xs font-extrabold", inMonth ? "text-gray-900" : "text-gray-400")}>{d.getDate()}</p>
 {weekday ? (
 <span className={cn("text-xs font-extrabold px-1.5 py-0.5 rounded-full border", categoryBadge(weekday))}>
 {weekday.slice(0, 3)}
 </span>
 ) : null}
 </div>
 {daySlot ? (
 <div className={cn("mt-2 rounded-lg border border-l-4 px-2 py-1.5", accentClasses(daySlot.accent), accentBorder(daySlot.accent))}>
 <p className="text-xs font-extrabold truncate">{daySlot.subject}</p>
 <p className="mt-0.5 text-xs font-bold text-gray-500 truncate">{daySlot.room}</p>
 </div>
 ) : (
 <p className="mt-2 text-xs font-semibold text-gray-400">No classes</p>
 )}
 </button>
 );
 })}
 </div>
 </div>
 ) : null}

 {viewMode === "week" ? (
 <div className="overflow-x-auto rounded-[16px] border border-gray-100">
 <table className="min-w-[980px] w-full">
 <thead className="bg-gray-50/80">
 <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
 <th className="px-4 py-3 w-[120px] border-b border-gray-100">Time</th>
 {days.map((d, idx) => (
 <th key={d} className="px-4 py-3 border-b border-gray-100">
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-gray-700">{d}</span>
 <span className="text-xs font-bold text-gray-400">{pad2(weekDates[idx].getDate())}/{pad2(weekDates[idx].getMonth() + 1)}</span>
 </div>
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 bg-white">
 {slotKeys.slice(0, 2).map((slot) => (
 <tr key={slot} className="group hover:bg-gray-50/30 transition-colors">
 <td className="px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">{slot}</td>
 {days.map((d) => {
 const cell = grid[d][slot];
 return (
 <td key={d} className="px-3 py-3" onClick={() => quickEdit(d, slot)}>
 <div
 className={cn(
 "rounded-lg border border-l-4 px-3 py-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer",
 accentClasses(cell.accent),
 accentBorder(cell.accent)
 )}
 >
 <p className="text-xs font-bold">{cell.subject}</p>
 <p className="mt-0.5 text-xs font-bold opacity-80">{cell.room}</p>
 </div>
 </td>
 );
 })}
 </tr>
 ))}

 <tr className="bg-gray-50/50">
 <td className="px-4 py-2" />
 <td colSpan={5} className="px-4 py-2">
 <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
 <span className="w-10 h-px bg-gray-200"></span>
 ☕ BREAK (10:00 - 10:30)
 <span className="w-10 h-px bg-gray-200"></span>
 </div>
 </td>
 </tr>

 <tr className="group hover:bg-gray-50/30 transition-colors">
 <td className="px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">10:30-11:30</td>
 {days.map((d) => {
 const cell = grid[d]["10:30-11:30"];
 return (
 <td key={d} className="px-3 py-3" onClick={() => quickEdit(d, "10:30-11:30")}>
 <div
 className={cn(
 "rounded-lg border border-l-4 px-3 py-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer",
 accentClasses(cell.accent),
 accentBorder(cell.accent)
 )}
 >
 <p className="text-xs font-bold">{cell.subject}</p>
 <p className="mt-0.5 text-xs font-bold opacity-80">{cell.room}</p>
 </div>
 </td>
 );
 })}
 </tr>
 </tbody>
 </table>
 </div>
 ) : null}

 {viewMode === "day" ? (
 <div className="rounded-[16px] border border-gray-100 overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between gap-3">
 <p className="text-xs font-extrabold text-gray-900">
 {selectedWeekday ? `${selectedWeekday} · ${formatDateLabel(selectedDate)}` : `No Timetable · ${formatDateLabel(selectedDate)}`}
 </p>
 <p className="text-xs font-bold text-gray-400">{`Grade ${grade}-${section} · ${term}`}</p>
 </div>
 <div className="p-4 space-y-3">
 {selectedWeekday ? (
 slotKeys.map((slot) => {
 const cell = grid[selectedWeekday][slot];
 return (
 <div key={slot} onClick={() => quickEdit(selectedWeekday, slot)} className="rounded-[16px] border border-gray-100 bg-white p-4 flex items-center justify-between gap-4 cursor-pointer hover:shadow-sm transition-all">
 <div>
 <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">{slot}</p>
 <p className="mt-1 text-xs font-bold text-gray-900">{cell.subject}</p>
 <p className="mt-0.5 text-xs font-semibold text-gray-500">{cell.room}</p>
 </div>
 <div className={cn("h-10 w-10 rounded-lg border border-l-4 flex items-center justify-center", accentClasses(cell.accent), accentBorder(cell.accent))}>
 <span className="text-xs font-extrabold">Slot</span>
 </div>
 </div>
 );
 })
 ) : (
 <div className="rounded-[16px] border border-gray-100 bg-gray-50/30 p-4 text-center">
 <p className="text-xs font-extrabold text-gray-700">No classes scheduled for this day.</p>
 <p className="mt-1 text-xs font-semibold text-gray-500">Select a weekday or switch to Week view.</p>
 </div>
 )}
 </div>
 </div>
 ) : null}

 <div className="mt-6">
 <h2 className="text-xs font-bold text-gray-900">Batch Actions &amp; Management</h2>
 <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
 <button type="button" className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#144835]/30 hover:shadow-md transition-all group">
 <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
 <Printer size={14} />
 </div>
 <p className="mt-2 text-xs font-bold text-gray-900">Print View</p>
 <p className="mt-0.5 text-xs font-medium text-gray-500 line-clamp-2">Generate PDF for display</p>
 </button>
 <button type="button" className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#144835]/30 hover:shadow-md transition-all group">
 <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
 <Mail size={14} />
 </div>
 <p className="mt-2 text-xs font-bold text-gray-900">Email Teachers</p>
 <p className="mt-0.5 text-xs font-medium text-gray-500 line-clamp-2">Send schedule to staff</p>
 </button>
 <button type="button" className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#144835]/30 hover:shadow-md transition-all group">
 <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
 <Users size={14} />
 </div>
 <p className="mt-2 text-xs font-bold text-gray-900">Email Parents</p>
 <p className="mt-0.5 text-xs font-medium text-gray-500 line-clamp-2">Notify class parents</p>
 </button>
 <button type="button" className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#144835]/30 hover:shadow-md transition-all group">
 <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
 <Settings size={14} />
 </div>
 <p className="mt-2 text-xs font-bold text-gray-900">Modify Slots</p>
 <p className="mt-0.5 text-xs font-medium text-gray-500 line-clamp-2">Change period durations</p>
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

function categoryBadge(day: Day) {
 if (day === "Monday") return "bg-blue-50 text-blue-700 border-blue-100";
 if (day === "Tuesday") return "bg-emerald-50 text-emerald-700 border-emerald-100";
 if (day === "Wednesday") return "bg-orange-50 text-orange-700 border-orange-100";
 if (day === "Thursday") return "bg-purple-50 text-purple-700 border-purple-100";
 return "bg-slate-100 text-slate-700 border-slate-200";
}
