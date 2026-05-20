"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Badge, CalendarCheck2, ChevronRight, Download, Eye, Filter, Mail, Pencil, Search, UserCheck, ClipboardCheck } from "lucide-react";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type AppStatus = "Submitted" | "Verification" | "Selected";

type ApplicationRow = {
 id: string;
 name: string;
 grade: string;
 date: string;
 status: AppStatus;
};

function statusTone(status: AppStatus) {
 if (status === "Submitted") return "bg-slate-100 text-slate-700 border-slate-200";
 if (status === "Selected") return "bg-emerald-50 text-emerald-800 border-emerald-100";
 return "bg-amber-50 text-amber-900 border-amber-100";
}

export default function AdminAdmissionApplicationsPage() {
 const schoolId = "idpskalaburagi";
 const [applications, setApplications] = useState<ApplicationRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [queryInput, setQueryInput] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 10;
 const [gradeFilter, setGradeFilter] = useState("All");
 const [statusFilter, setStatusFilter] = useState<"All" | AppStatus>("All");

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 const qRef = query(collection(db, "schools", schoolId, "applications"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: ApplicationRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 name: data.studentName || data.name || "Unknown",
 grade: data.grade || "-",
 parentName: data.parentName || "Unknown",
 phone: data.phone || "-",
 date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : "-",
 status: (data.status as AppStatus) || "Submitted",
 progress: Number(data.progress || 20),
 };
 });
 setApplications(list);
 setLoading(false);
 }, (err) => {
 console.error("Error loading applications:", err);
 setLoadError("Failed to load applications.");
 setLoading(false);
 });
 return () => unsubscribe();
 }, [schoolId]);

 const gradeOptions = useMemo(() => {
 const grades = Array.from(new Set(applications.map((a) => a.grade).filter(Boolean)));
 grades.sort((a, b) => a.localeCompare(b));
 return ["All", ...grades];
 }, [applications]);

 useEffect(() => {
 if (!gradeOptions.includes(gradeFilter)) setGradeFilter("All");
 }, [gradeOptions, gradeFilter]);

 const filtered = useMemo(() => {
 const q = queryInput.trim().toLowerCase();
 return applications.filter((a) => {
 const matchQ = !q || a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
 const matchGrade = gradeFilter === "All" || a.grade === gradeFilter;
 const matchStatus = statusFilter === "All" || a.status === statusFilter;
 return matchQ && matchGrade && matchStatus;
 });
 }, [applications, queryInput, gradeFilter, statusFilter]);
 useEffect(() => {
 setCurrentPage(1);
 }, [queryInput]);

 const paginatedItems = useMemo(() => {
 const start = (currentPage - 1) * itemsPerPage;
 return filtered.slice(start, start + itemsPerPage);
 }, [filtered, currentPage]);

 const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));


 const stats = useMemo(() => {
 const total = applications.length;
 const selected = applications.filter((a) => a.status === "Selected").length;
 const pending = applications.filter((a) => a.status !== "Selected").length;
 return { session: "2025-26", total, selected, pending };
 }, [applications]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {/* Header */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div>
 <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Applications</h1>
 <p className="text-xs font-medium text-gray-500 mt-0.5">
 Showing <span className="font-extrabold text-gray-900">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{" "}
 <span className="font-extrabold text-gray-900">{filtered.length}</span> entries
 </p>
 <div className="flex items-center gap-1.5">
 <button 
 type="button" 
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
 Previous
 </button>
 
 {Array.from({ length: totalPages }).map((_, i) => {
 const p = i + 1;
 if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
 return (
 <button 
 key={p}
 type="button" 
 onClick={() => setCurrentPage(p)}
 className={currentPage === p ? "h-8 w-8 rounded-lg bg-[#144835] text-white text-xs font-bold shadow-md shadow-[#144835]/20" : "h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"}
 >
 {p}
 </button>
 );
 }
 if (p === currentPage - 2 || p === currentPage + 2) {
 return <span key={p} className="px-1 text-gray-400 text-xs font-bold">…</span>;
 }
 return null;
 })}

 <button 
 type="button" 
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
 Next
 </button>
 </div>
 </div>
 </div>

 <div className="rounded-[16px] bg-gradient-to-r from-[#0B1220] to-[#111827] p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-white">
 <div>
 <p className="text-sm font-extrabold">Bulk Application Actions</p>
 <p className="mt-0.5 text-xs font-semibold text-white/70">
 Perform actions for all “Selected” or “Verified” candidates.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-xs font-extrabold text-white hover:bg-white/15">
 <Download size={14} /> Publish Merit List
 </button>
 <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-extrabold text-[#0B1220] hover:bg-amber-300">
 <Mail size={14} /> Send Offers
 </button>
 <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#144835]/90">
 <Badge size={14} /> Generate Admit Cards
 </button>
 </div>
 </div>
 </div>
 );
}
