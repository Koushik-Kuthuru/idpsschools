"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import {
 CalendarDays,
 CalendarRange,
 ChevronRight,
 Download,
 Eye,
 Filter,
 Mail,
 MessageSquare,
 Phone,
 PhoneCall,
 Plus,
 Search,
 Users,
} from "lucide-react";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type EnquiryStatus = "Pending" | "Scheduled" | "Converted";

type EnquiryRow = {
 id: string;
 parentName: string;
 studentName: string;
 grade: string;
 email: string;
 phone: string;
 date: string;
 time: string;
 status: EnquiryStatus;
};

function statusTone(status: EnquiryStatus) {
 if (status === "Pending") return "bg-amber-50 text-amber-900 border-amber-100";
 if (status === "Scheduled") return "bg-blue-50 text-blue-800 border-blue-100";
 return "bg-emerald-50 text-emerald-800 border-emerald-100";
}

export default function AdminEnquiriesPage() {
 const schoolId = "idpscherukupalli";
 const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [queryInput, setQueryInput] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 10;
 const [gradeFilter, setGradeFilter] = useState("All");
 const [statusFilter, setStatusFilter] = useState<"All" | EnquiryStatus>("All");

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 const qRef = query(collection(db, "schools", schoolId, "enquiries"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: EnquiryRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 parentName: data.parentName || "Unknown",
 studentName: data.studentName || "Unknown",
 grade: data.grade || "-",
 email: data.email || "-",
 phone: data.phone || "-",
 date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : "-",
 time: data.time || "-",
 status: (data.status as EnquiryStatus) || "Pending",
 };
 });
 setEnquiries(list);
 setLoading(false);
 }, (err) => {
 console.error("Error loading enquiries:", err);
 setLoadError("Failed to load enquiries.");
 setLoading(false);
 });
 return () => unsubscribe();
 }, [schoolId]);

 const gradeOptions = useMemo(() => {
 const grades = Array.from(new Set(enquiries.map((e) => e.grade).filter(Boolean)));
 grades.sort((a, b) => a.localeCompare(b));
 return ["All", ...grades];
 }, [enquiries]);

 useEffect(() => {
 if (!gradeOptions.includes(gradeFilter)) setGradeFilter("All");
 }, [gradeOptions, gradeFilter]);

 const filteredEnquiries = useMemo(() => {
 const q = queryInput.trim().toLowerCase();
 return enquiries.filter((e) => {
 const matchQ =
 !q ||
 e.id.toLowerCase().includes(q) ||
 e.parentName.toLowerCase().includes(q) ||
 e.studentName.toLowerCase().includes(q) ||
 e.email.toLowerCase().includes(q) ||
 e.phone.toLowerCase().includes(q);
 const matchGrade = gradeFilter === "All" || e.grade === gradeFilter;
 const matchStatus = statusFilter === "All" || e.status === statusFilter;
 return matchQ && matchGrade && matchStatus;
 });
 }, [enquiries, queryInput, gradeFilter, statusFilter]);
 useEffect(() => {
 setCurrentPage(1);
 }, [queryInput]);

 const paginatedItems = useMemo(() => {
 const start = (currentPage - 1) * itemsPerPage;
 return filteredEnquiries.slice(start, start + itemsPerPage);
 }, [filteredEnquiries, currentPage]);

 const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / itemsPerPage));


 const stats = useMemo(() => {
 const total = enquiries.length;
 const pending = enquiries.filter((e) => e.status === "Pending").length;
 const scheduled = enquiries.filter((e) => e.status === "Scheduled").length;
 const converted = enquiries.filter((e) => e.status === "Converted").length;
 const conversionRate = total ? `${Math.round((converted / total) * 100)}% rate` : "0% rate";
 return { total, pending, scheduled, converted, conversionRate };
 }, [enquiries]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {/* Header */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div>
 <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Enquiries</h1>
 <p className="text-xs font-medium text-gray-500 mt-0.5">
 Showing <span className="font-extrabold text-gray-900">{filteredEnquiries.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredEnquiries.length)}</span> of{" "}
 <span className="font-extrabold text-gray-900">{filteredEnquiries.length}</span> entries
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
 </div>
 );
}
