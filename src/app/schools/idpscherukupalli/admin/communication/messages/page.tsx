"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
 Archive,
 Bell,
 CheckSquare,
 ChevronRight,
 Filter,
 HelpCircle,
 Mail,
 MoreHorizontal,
 Paperclip,
 Search,
 Trash2,
} from "lucide-react";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type Tab = "Inbox" | "Sent" | "Drafts" | "Announcements" | "Archive";

type MessageRow = {
 id: string;
 senderName: string;
 senderDept: string;
 subject: string;
 preview: string;
 time: string;
 dateLabel: string;
 starred: boolean;
 unread: boolean;
 hasAttachment: boolean;
};

const messages: MessageRow[] = [
 {
 id: "m1",
 senderName: "Principal Office",
 senderDept: "Administration",
 subject: "Staff Meeting Regarding Annual Sports Day 2024",
 preview: "Dear Staff, this is to inform you that a mandatory meeting is scheduled tomorrow at 3:00 ...",
 time: "10:45 AM",
 dateLabel: "Today",
 starred: false,
 unread: true,
 hasAttachment: true,
 },
 {
 id: "m2",
 senderName: "Finance Dept.",
 senderDept: "Accounting",
 subject: "Q3 Budget Approval Documentation",
 preview: "Please find the attached budget spreadsheets for the next academic quarter for your review ...",
 time: "04:20 PM",
 dateLabel: "Yesterday",
 starred: false,
 unread: false,
 hasAttachment: false,
 },
 {
 id: "m3",
 senderName: "School Portal",
 senderDept: "System Announcement",
 subject: "[URGENT] Server Maintenance Window: Saturday Night",
 preview: "The ERP portal will be offline for scheduled maintenance this Saturday between 11:00 PM ...",
 time: "09:00 AM",
 dateLabel: "Sep 12",
 starred: true,
 unread: false,
 hasAttachment: false,
 },
 {
 id: "m4",
 senderName: "Registrar Head",
 senderDept: "Admissions",
 subject: "New Student Enrollment Report - Batch 2024-25",
 preview: "The final list of enrolled students for the upcoming session is now available for the department ...",
 time: "11:15 AM",
 dateLabel: "Sep 11",
 starred: false,
 unread: false,
 hasAttachment: false,
 },
 {
 id: "m5",
 senderName: "IT Support",
 senderDept: "Technical",
 subject: "Smart Classboard Troubleshooting Guide",
 preview: "Following the recent updates, please refer to this guide if you experience connectivity issues ...",
 time: "02:30 PM",
 dateLabel: "Sep 10",
 starred: false,
 unread: false,
 hasAttachment: true,
 },
];

function initialsFromName(name: string) {
 const parts = name
 .split(" ")
 .map((p) => p.trim())
 .filter(Boolean);
 return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function avatarTone(name: string) {
 const first = name.trim()[0]?.toLowerCase() ?? "a";
 const code = first.charCodeAt(0);
 const idx = code % 5;
 if (idx === 0) return "bg-emerald-50 text-emerald-700";
 if (idx === 1) return "bg-blue-50 text-blue-700";
 if (idx === 2) return "bg-amber-50 text-amber-800";
 if (idx === 3) return "bg-purple-50 text-purple-700";
 return "bg-slate-100 text-slate-700";
}

export default function AdminMessagesPage() {
 const schoolId = "idpscherukupalli";
 const [tab, setTab] = useState<Tab>("Inbox");
 const [messages, setMessages] = useState<MessageRow[]>([]);
 const [loading, setLoading] = useState(true);
 
 useEffect(() => {
 setLoading(true);
 const qRef = query(collection(db, "schools", schoolId, "messages"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: MessageRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 senderName: data.sender || "Admin",
 senderDept: data.recipient || "General",
 subject: data.subject || "No Subject",
 preview: data.preview || "No content",
 time: data.time || "-",
 dateLabel: data.dateLabel || "Today",
 starred: data.starred || false,
 unread: data.unread || false,
 hasAttachment: data.hasAttachment || false,
 };
 });
 setMessages(list);
 setLoading(false);
 });
 return () => unsubscribe();
 }, [schoolId]);

 const inboxCount = useMemo(() => messages.length, [messages]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {/* Top Header */}
 <AdminPageHeader
  title="Messages"
  description="Send and manage school communications with staff and parents"
 />

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
 <div className="flex flex-wrap items-center gap-2">
 {(["Inbox", "Sent", "Drafts", "Announcements", "Archive"] as const).map((t) => {
 const active = tab === t;
 return (
 <button
 key={t}
 type="button"
 onClick={() => setTab(t)}
 className={cn(
 "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center",
 active ? "text-[#144835] bg-white border border-gray-200 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
 )}
 >
 {t}
 {t === "Inbox" ? (
 <span className={cn(
 "ml-1.5 inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold",
 active ? "bg-[#144835]/10 text-[#144835]" : "bg-gray-200 text-gray-600"
 )}>
 {inboxCount}
 </span>
 ) : null}
 </button>
 );
 })}
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <div className="relative w-full sm:w-[240px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 placeholder="Search messages..."
 />
 </div>
 <button
 type="button"
 className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
 aria-label="Filter"
 >
 <Filter size={14} />
 </button>
 <Link
 href="/schools/${schoolId}/admin/communication/messages/new"
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <Mail size={14} /> Compose
 </Link>
 </div>
 </div>

 <div className="p-3 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
 <div className="flex flex-wrap items-center gap-2">
 <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 ml-2">
 <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]" />
 Select All
 </label>
 <span className="h-4 w-px bg-gray-200 hidden sm:block mx-1" />
 <button type="button" className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-extrabold uppercase tracking-wider transition-colors">
 <CheckSquare size={12} /> Mark Read
 </button>
 <button type="button" className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-extrabold uppercase tracking-wider transition-colors">
 <Archive size={12} /> Archive
 </button>
 <button type="button" className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-extrabold uppercase tracking-wider transition-colors">
 <Trash2 size={12} /> Delete
 </button>
 </div>

 <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 justify-end">
 <span>Showing <span className="font-bold text-gray-900">{messages.length > 0 ? 1 : 0}-{messages.length}</span> of <span className="font-bold text-gray-900">{messages.length}</span></span>
 <div className="flex items-center gap-1 ml-1">
 <button type="button" className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 inline-flex items-center justify-center opacity-50 cursor-not-allowed shadow-sm">
 <ChevronRight className="rotate-180" size={14} />
 </button>
 <button type="button" className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center shadow-sm">
 <ChevronRight size={14} />
 </button>
 </div>
 </div>
 </div>

 <div className="divide-y divide-gray-100 bg-white">
 {messages.map((m) => (
 <div
 key={m.id}
 className={cn(
 "px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center hover:bg-gray-50/50 transition-colors group cursor-pointer",
 m.starred ? "bg-amber-50/10" : "",
 m.unread ? "bg-[#144835]/5" : ""
 )}
 >
 <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
 <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]" onClick={(e) => e.stopPropagation()} />
 <button type="button" className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", m.starred ? "text-amber-500" : "text-gray-300 hover:text-amber-500")} onClick={(e) => e.stopPropagation()}>
 ★
 </button>
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", avatarTone(m.senderName))}>
 {initialsFromName(m.senderName)}
 </div>
 </div>

 <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 items-center">
 <div className="min-w-0">
 <p className={cn("text-xs font-bold truncate", m.unread ? "text-gray-900" : "text-gray-700")}>
 {m.senderName}
 </p>
 <p className="text-xs font-medium text-gray-500 truncate">{m.senderDept}</p>
 </div>

 <div className="min-w-0 flex items-center gap-2">
 <div className="min-w-0 flex-1">
 <p className={cn("text-xs font-bold truncate", m.unread ? "text-gray-900" : "text-gray-700")}>
 {m.subject}
 </p>
 <p className="text-xs font-medium text-gray-500 truncate mt-0.5">{m.preview}</p>
 </div>
 {m.hasAttachment && (
 <div className="text-gray-400 shrink-0">
 <Paperclip size={14} />
 </div>
 )}
 </div>
 </div>

 <div className="text-left sm:text-right shrink-0 w-full sm:w-auto pl-[72px] sm:pl-0">
 <p className={cn("text-xs font-bold", m.unread ? "text-[#144835]" : "text-gray-500")}>{m.time}</p>
 <p className="text-xs font-medium text-gray-400 mt-0.5">{m.dateLabel}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
