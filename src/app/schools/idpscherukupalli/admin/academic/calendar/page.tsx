"use client";

import AdminPageHeader from "@/components/admin/PageHeader";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
 CalendarDays, 
 ChevronLeft, 
 ChevronRight, 
 Plus, 
 Download,
 Filter,
 MoreHorizontal,
 Calendar as CalendarIcon,
 Clock,
 MapPin,
 Users
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";
import { useBranch } from "@/components/admin/BranchContext";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

// Helper functions for calendar grid
function startOfMonth(d: Date) {
 return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, delta: number) {
 const copy = new Date(d);
 copy.setDate(copy.getDate() + delta);
 return copy;
}

function addMonths(d: Date, delta: number) {
 return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function dayIndexMondayStart(d: Date) {
 const js = d.getDay();
 return (js + 6) % 7;
}

function pad2(n: number) {
 return n.toString().padStart(2, "0");
}

function dateKey(d: Date) {
 return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

type EventType = "academic" | "holiday" | "exam" | "event" | "meeting";

function eventColor(type: EventType) {
 if (type === "academic") return "bg-blue-100 text-blue-700 border-blue-200";
 if (type === "event") return "bg-emerald-100 text-emerald-700 border-emerald-200";
 if (type === "meeting") return "bg-purple-100 text-purple-700 border-purple-200";
 if (type === "exam") return "bg-rose-100 text-rose-700 border-rose-200";
 return "bg-orange-100 text-orange-700 border-orange-200";
}

export default function AcademicCalendarPage() {
 const { activeBranch } = useBranch();
 const schoolId = activeBranch?.id;
 const [currentDate, setCurrentDate] = useState(() => new Date());
 const [activeFilter, setActiveFilter] = useState("all");
 const [events, setEvents] = useState<Array<{ id: string; title: string; date: string; type: EventType; description?: string; location?: string }>>([]);

 const monthStart = startOfMonth(currentDate);
 const monthGridStart = addDays(monthStart, -dayIndexMondayStart(monthStart));
 const monthCells = Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i));

 const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
 const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
 const today = () => setCurrentDate(new Date());

 useEffect(() => {
 if (!schoolId) return;
 const eventsRef = query(collection(db, "schools", schoolId, "events"), orderBy("date", "asc"));
 const holidaysRef = query(collection(db, "schools", schoolId, "holidays"), orderBy("date", "asc"));
 let currentEvents: Array<{ id: string; title: string; date: string; type: EventType; description?: string; location?: string }> = [];
 let currentHolidays: Array<{ id: string; title: string; date: string; type: EventType; description?: string; location?: string }> = [];

 const syncCalendarItems = () => {
  const combined = [...currentEvents, ...currentHolidays];
  const deduped = new Map<string, (typeof combined)[number]>();
  for (const item of combined) {
   const key = `${item.type}|${item.date}|${item.title.toLowerCase()}`;
   if (!deduped.has(key)) deduped.set(key, item);
  }
  setEvents(Array.from(deduped.values()).filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date)));
 };

 const unsubEvents = onSnapshot(
  eventsRef,
  (snap) => {
   currentEvents = snap.docs.map((d) => {
    const data = d.data() as any;
    const type = (["academic", "holiday", "exam", "event", "meeting"] as const).includes(data.type) ? (data.type as EventType) : ("event" as EventType);
    return {
     id: d.id,
     title: String(data.title || "").trim() || "Untitled",
     date: String(data.date || "").trim(),
     type,
     description: String(data.description || "").trim() || undefined,
     location: String(data.location || "").trim() || undefined,
    };
   });
   syncCalendarItems();
  },
  () => setEvents([])
 );

 const unsubHolidays = onSnapshot(
  holidaysRef,
  (snap) => {
   currentHolidays = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
     id: d.id,
     title: String(data.name || "").trim() || "Holiday",
     date: String(data.date || "").trim(),
     type: "holiday" as const,
     description: String(data.type || "").trim() || undefined,
     location: "School",
    };
   });
   syncCalendarItems();
  },
  () => {
   currentHolidays = [];
   syncCalendarItems();
  }
 );

 return () => {
  unsubEvents();
  unsubHolidays();
 };
 }, [schoolId]);

 const eventsByDate = useMemo(() => {
 const map: Record<string, typeof events> = {};
 events.forEach((e) => {
 if (!map[e.date]) map[e.date] = [];
 map[e.date].push(e);
 });
 return map;
 }, [events]);

 const upcomingEvents = useMemo(() => {
 const now = new Date();
 const todayKey = dateKey(now);
 return events.filter((e) => e.date >= todayKey).slice(0, 4);
 }, [events]);

 const filters = [
 { id: "all", label: "All Events" },
 { id: "academic", label: "Academic" },
 { id: "exam", label: "Examinations" },
 { id: "holiday", label: "Holidays" },
 { id: "event", label: "Events" },
 ];

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <AdminPageHeader
  title="Academic Calendar"
  description="Manage school events, holidays, and examination schedules"
  actions={
   <>
 <ExportButton data={events} filename="Export" className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors" iconSize={14} />
 <Link
 href={`/schools/${schoolId}/admin/academic/calendar/new`}
 className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-colors"
 >
 <Plus size={14} /> Add Event
 </Link>
   </>
  }
 />
 <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
 {/* Sidebar Filters */}
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <h3 className="text-xs font-bold text-gray-900 tracking-tight mb-3 flex items-center gap-1.5">
 <Filter size={14} className="text-[#144835]" /> Filters
 </h3>
 <div className="space-y-1.5">
 {filters.map((filter) => (
 <button
 key={filter.id}
 onClick={() => setActiveFilter(filter.id)}
 className={cn(
 "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200",
 activeFilter === filter.id 
 ? "bg-[#144835]/10 text-[#144835]" 
 : "text-gray-600 hover:bg-gray-50"
 )}
 >
 {filter.label}
 </button>
 ))}
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <h3 className="text-xs font-bold text-gray-900 tracking-tight mb-3">Upcoming Events</h3>
 <div className="space-y-3">
 {upcomingEvents.map((event) => {
 const dateObj = new Date(`${event.date}T00:00:00`);
 return (
 <div key={event.id} className="flex gap-3 group cursor-pointer">
 <div className="w-10 shrink-0 text-center">
 <p className="text-xs font-bold text-gray-400 uppercase">{dateObj.toLocaleString('default', { month: 'short' })}</p>
 <p className="text-sm font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{dateObj.getDate()}</p>
 </div>
 <div className="pt-0.5">
 <p className="text-xs font-bold text-gray-900 group-hover:text-[#144835] transition-colors leading-tight">{event.title}</p>
 <span className={cn("inline-block px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide mt-1", eventColor(event.type))}>
 {event.type}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* Main Calendar Area */}
 <div className="xl:col-span-3">
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
 {/* Calendar Controls */}
 <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
 <div className="flex items-center gap-3">
 <h2 className="text-lg font-bold text-gray-900">
 {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
 </h2>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={today} className="px-3 h-8 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
 Today
 </button>
 <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-0.5">
 <button onClick={prevMonth} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">
 <ChevronLeft size={14} />
 </button>
 <button onClick={nextMonth} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">
 <ChevronRight size={14} />
 </button>
 </div>
 </div>
 </div>

 {/* Calendar Grid */}
 <div className="p-4">
 <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
 {/* Day Headers */}
 {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
 <div key={day} className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
 {day}
 </div>
 ))}
 
 {/* Date Cells */}
 {monthCells.map((date, idx) => {
 const isCurrentMonth = date.getMonth() === currentDate.getMonth();
 const isToday = date.toDateString() === new Date().toDateString();
 
 const dayEvents = eventsByDate[dateKey(date)] || [];

 return (
 <div 
 key={idx} 
 className={cn(
 "min-h-[100px] bg-white p-1.5 transition-colors hover:bg-gray-50 cursor-pointer group",
 !isCurrentMonth && "bg-gray-50/50 text-gray-400"
 )}
 >
 <div className="flex justify-between items-start">
 <span className={cn(
 "h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold transition-colors",
 isToday 
 ? "bg-[#144835] text-white shadow-md shadow-[#144835]/30" 
 : isCurrentMonth ? "text-gray-900 group-hover:bg-gray-200" : "text-gray-400"
 )}>
 {date.getDate()}
 </span>
 </div>
 
 <div className="mt-1 space-y-1">
 {dayEvents.map((event, eIdx) => (
 (activeFilter === "all" || activeFilter === event.type) && (
 <div 
 key={eIdx}
 className={cn(
 "px-1.5 py-0.5 rounded text-xs font-bold truncate border",
 eventColor(event.type)
 )}
 title={event.title}
 >
 {event.title}
 </div>
 )
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
