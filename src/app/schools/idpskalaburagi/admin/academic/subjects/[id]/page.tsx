"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, ListChecks } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type PortionStatus = "Planned" | "In Progress" | "Completed";

type SubjectPortion = {
 title: string;
 chapters: string;
 from: string;
 to: string;
 status: PortionStatus;
};

export type AcademicSubject = {
 id: string;
 grade: string;
 section: string;
 name: string;
 code: string;
 description: string;
 portions: SubjectPortion[];
};

function statusTone(status: PortionStatus) {
 if (status === "Completed") return "bg-emerald-50 border-emerald-200 text-emerald-700";
 if (status === "In Progress") return "bg-blue-50 border-blue-200 text-blue-700";
 return "bg-amber-50 border-amber-200 text-amber-700";
}

export default function AdminSubjectDetailPage() {
 const params = useParams<{ id: string }>();
 const id = typeof params?.id === "string" ? decodeURIComponent(params.id) : "";
 const schoolId = "idpskalaburagi";
 const [subject, setSubject] = useState<AcademicSubject | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 async function load() {
 if (!id) return;
 try {
 setError(null);
 setLoading(true);
 const docRef = doc(db, "schools", schoolId, "subjects", id);
 const snap = await getDoc(docRef);
 
 if (snap.exists()) {
 const data = snap.data();
 setSubject({
 id: snap.id,
 grade: data.classId || "-",
 section: data.section || "-",
 name: data.name || "Unnamed Subject",
 code: data.code || "",
 description: data.description || "",
 portions: data.portions || []
 });
 } else {
 setError("Subject not found");
 }
 } catch (e: any) {
 console.error("Error loading subject:", e);
 setError(e?.message || "Failed to load subject");
 } finally {
 setLoading(false);
 }
 }
 load();
 }, [id, schoolId]);

 const portionCounts = useMemo(() => {
 const list = subject?.portions || [];
 const planned = list.filter((p) => p.status === "Planned").length;
 const inProgress = list.filter((p) => p.status === "In Progress").length;
 const completed = list.filter((p) => p.status === "Completed").length;
 return { planned, inProgress, completed, total: list.length };
 }, [subject]);

 if (loading) {
 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto flex items-center justify-center min-h-[60vh]">
 <div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 if (!subject) {
 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4">
 <p className="text-xs font-bold text-rose-700">{error || "Subject not found"}</p>
 <Link href="/idpskalaburagi/academic/subjects" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 h-10 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50">
 <ArrowLeft size={14} /> Back
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
 <div className="flex items-center gap-3">
 <Link href={`/schools/${schoolId}/admin/academic/subjects`} className="p-2 rounded-lg hover:bg-gray-50 text-gray-600">
 <ArrowLeft size={18} />
 </Link>
 <div className="min-w-0">
 <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
 {subject.grade}-{String(subject.section).toUpperCase()} • {subject.code || "—"}
 </p>
 <h1 className="text-xl sm:text-xl font-bold text-gray-900 tracking-tight truncate">{subject.name}</h1>
 <p className="text-xs text-gray-500 mt-1 truncate">{subject.description || "—"}</p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
 <Link href={`/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(subject.id)}/edit`} className="h-9 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all">
 <Edit3 size={14} /> Edit
 </Link>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <ListChecks size={22} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Total Portions</p>
 <p className="text-xl font-extrabold text-gray-900">{portionCounts.total}</p>
 </div>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4">
 <p className="text-xs font-bold text-gray-500">Planned</p>
 <p className="text-xl font-extrabold text-gray-900">{portionCounts.planned}</p>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4">
 <p className="text-xs font-bold text-gray-500">In Progress</p>
 <p className="text-xl font-extrabold text-gray-900">{portionCounts.inProgress}</p>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4">
 <p className="text-xs font-bold text-gray-500">Completed</p>
 <p className="text-xl font-extrabold text-gray-900">{portionCounts.completed}</p>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
 <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
 <h2 className="text-lg font-bold text-gray-800">Portion Plan</h2>
 <p className="text-xs font-bold text-gray-500">{subject.portions.length} items</p>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Title</th>
 <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Chapters</th>
 <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">From</th>
 <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">To</th>
 <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {subject.portions.map((p, idx) => (
 <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
 <td className="px-4 py-2.5">
 <p className="text-xs font-extrabold text-gray-900">{p.title || "—"}</p>
 </td>
 <td className="px-4 py-2.5">
 <p className="text-xs font-semibold text-gray-700 whitespace-pre-wrap">{p.chapters || "—"}</p>
 </td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{p.from || "—"}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{p.to || "—"}</td>
 <td className="px-4 py-2.5">
 <span className={cn("inline-flex items-center rounded-lg border px-3 py-1 text-xs font-bold", statusTone(p.status))}>
 {p.status}
 </span>
 </td>
 </tr>
 ))}
 {!subject.portions.length && (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center">
 <p className="text-xs font-bold text-gray-900">No portions added</p>
 <p className="text-xs text-gray-500 mt-1">Edit this subject to add portion planning.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}

