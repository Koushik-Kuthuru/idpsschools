"use client";

import { useMemo, useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Bell, BookOpen, CheckCircle2, CircleUser, CreditCard, Search, Settings2, ShieldAlert, Users, XCircle, Plus } from "lucide-react";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type Tab = "All Notifications" | "Academic" | "Finance" | "Admin" | "System" | "Settings";

type AlertCategory = "Academic" | "Finance" | "Admin" | "System" | "Settings" | "Attendance" | "Admission";

type AlertRow = {
 id: string;
 category: AlertCategory;
 title: string;
 description: string;
 timeLabel: string;
 isNew: boolean;
 actionLabel?: string;
 tone: "info" | "success" | "warning" | "danger";
};

const alerts: AlertRow[] = [
 {
 id: "n1",
 category: "Academic",
 title: "New marks uploaded for Class 10-A",
 description: "Final Term examination results for Mathematics and Science have been processed and uploaded for all students in section 10-A.",
 timeLabel: "2 mins ago",
 isNew: false,
 tone: "info",
 },
 {
 id: "n2",
 category: "Finance",
 title: "Fee reminder for Alex Johnson",
 description: "Quarterly tuition fee (Q3) of ₹24,500 is due. Please clear the outstanding balance to avoid late penalties.",
 timeLabel: "1 hour ago",
 isNew: false,
 actionLabel: "Pay Now",
 tone: "success",
 },
 {
 id: "n3",
 category: "Attendance",
 title: "Low attendance alert: Sarah Williams",
 description: "Attendance has dropped to 75% for the current month. Threshold for Class 8 is 80%.",
 timeLabel: "3 hours ago",
 isNew: false,
 tone: "warning",
 },
 {
 id: "n4",
 category: "Admission",
 title: "New application received: John Lee",
 description: "A new admission request for Grade 5 has been submitted. Review required for preliminary documentation.",
 timeLabel: "NEW",
 isNew: true,
 actionLabel: "View Application",
 tone: "success",
 },
 {
 id: "n5",
 category: "System",
 title: "Scheduled maintenance notice",
 description: "The ERP portal will be undergoing scheduled maintenance tonight from 11:00 PM to 02:00 AM. Access might be intermittent.",
 timeLabel: "Yesterday",
 isNew: false,
 tone: "info",
 },
];

function alertIcon(category: AlertCategory) {
 if (category === "Academic") return BookOpen;
 if (category === "Finance") return CreditCard;
 if (category === "Admin") return Users;
 if (category === "Attendance") return ShieldAlert;
 if (category === "Admission") return CircleUser;
 if (category === "Settings") return Settings2;
 return Settings2;
}

function categoryBadgeTone(category: AlertCategory) {
 if (category === "Academic") return "bg-blue-50 text-blue-700 border-blue-100";
 if (category === "Finance") return "bg-emerald-50 text-emerald-700 border-emerald-100";
 if (category === "Attendance") return "bg-amber-50 text-amber-800 border-amber-100";
 if (category === "Admission") return "bg-emerald-50 text-emerald-700 border-emerald-100";
 if (category === "System") return "bg-slate-100 text-slate-700 border-slate-200";
 return "bg-slate-100 text-slate-700 border-slate-200";
}

function iconTone(category: AlertCategory) {
 if (category === "Academic") return "bg-blue-50 text-blue-700";
 if (category === "Finance") return "bg-emerald-50 text-emerald-700";
 if (category === "Attendance") return "bg-amber-50 text-amber-800";
 if (category === "Admission") return "bg-emerald-50 text-emerald-700";
 if (category === "System") return "bg-slate-100 text-slate-700";
 return "bg-slate-100 text-slate-700";
}

function actionTone(tone: AlertRow["tone"]) {
 if (tone === "success") return "bg-[#144835] hover:bg-[#144835]/90 text-white";
 if (tone === "warning") return "bg-amber-600 hover:bg-amber-700 text-white";
 if (tone === "danger") return "bg-rose-600 hover:bg-rose-700 text-white";
 return "bg-[#144835] hover:bg-[#144835]/90 text-white";
}

export default function AdminNotificationsPage() {
 const schoolId = "idpscherukupalli";
 const [tab, setTab] = useState<Tab>("All Notifications");
 const [alerts, setAlerts] = useState<AlertRow[]>([]);
 
 useEffect(() => {
 const qRef = query(collection(db, "schools", schoolId, "notifications"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: AlertRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 category: (data.category as AlertCategory) || "System",
 title: data.title || "New Notification",
 description: data.description || "",
 timeLabel: data.timeLabel || "Just now",
 isNew: data.isNew || false,
 actionLabel: data.actionLabel,
 tone: (data.tone as AlertRow["tone"]) || "info",
 };
 });
 setAlerts(list);
 });
 return () => unsubscribe();
 }, [schoolId]);

 const tabs = useMemo(() => ["All Notifications", "Academic", "Finance", "Admin", "System", "Settings"] as const, []);

 const filtered = tab === "All Notifications" ? alerts : alerts.filter((a) => a.category === tab);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <AdminPageHeader
  title="Notifications & Alerts"
  description="View and manage alerts across all school modules"
  actions={
   <>
 <button
 type="button"
 className="h-9 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-rose-600 transition-colors"
 title="Clear All"
 >
 <XCircle size={14} /> <span className="hidden sm:inline">Clear All</span>
 </button>
 <button
 type="button"
 className="h-9 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all"
 title="Mark All Read"
 >
 <CheckCircle2 size={14} /> <span className="hidden sm:inline">Mark Read</span>
 </button>
 <span className="h-5 w-px bg-gray-200 hidden sm:block mx-1" />
 <Link
 href={`/schools/${schoolId}/admin/profile/settings`}
 className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-[#144835] transition-colors"
 title="Notification Settings"
 >
 <Settings2 size={16} />
 </Link>
   </>
  }
 />

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
 <div className="flex flex-wrap items-center gap-2">
 {tabs.map((t) => {
 const active = t === tab;
 return (
 <button
 key={t}
 type="button"
 onClick={() => setTab(t)}
 className={cn(
 "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
 active ? "text-[#144835] bg-white border border-gray-200 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
 )}
 >
 {t}
 </button>
 );
 })}
 </div>

 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
 <div className="relative w-full sm:w-[280px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 placeholder="Search alerts..."
 />
 </div>
 </div>
 </div>

 <div className="p-4 space-y-3 bg-gray-50/30">
 {filtered.map((a) => {
 const Icon = alertIcon(a.category);
 const badge = categoryBadgeTone(a.category);
 const icon = iconTone(a.category);

 return (
 <div key={a.id} className={cn("rounded-[16px] border border-gray-100 bg-white shadow-sm p-3 flex flex-col sm:flex-row gap-3 transition-all hover:border-[#144835]/30 hover:shadow-md", a.isNew ? "border-l-4 border-l-[#144835]" : "")}>
 <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0", icon)}>
 <Icon size={16} />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div className="flex items-center gap-2 min-w-0">
 <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider border", badge)}>
 {a.category}
 </span>
 <p className="text-xs font-bold text-gray-900 truncate">{a.title}</p>
 </div>
 <p className="text-xs font-bold text-gray-400 whitespace-nowrap">{a.timeLabel}</p>
 </div>

 <p className="mt-1.5 text-xs font-medium text-gray-600 leading-relaxed">{a.description}</p>

 {a.actionLabel ? (
 <div className="mt-3 flex items-center gap-2">
 <button type="button" className={cn("rounded-lg px-4 h-8 text-xs font-bold shadow-sm transition-all", actionTone(a.tone))}>
 {a.actionLabel}
 </button>
 {a.isNew ? (
 <button type="button" className="rounded-lg border border-gray-200 bg-white px-4 h-8 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
 Dismiss
 </button>
 ) : null}
 </div>
 ) : null}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
}
