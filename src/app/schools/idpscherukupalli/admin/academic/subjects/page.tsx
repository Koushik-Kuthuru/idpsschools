"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronRight, Plus, Search , Trash2, Eye, Pencil} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
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

export default function AdminSubjectsPage() {
 const schoolId = "idpscherukupalli";
 const allClassesKey = "All";
 const allSectionsKey = "All";
 const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 const [classOptions, setClassOptions] = useState<string[]>([]);
 const [sectionOptions, setSectionOptions] = useState<string[]>([]);

 const [searchQuery, setSearchQuery] = useState("");
 const [grade, setGrade] = useState(allClassesKey);
 const [section, setSection] = useState(allSectionsKey);

 useEffect(() => {
 async function loadMeta() {
 try {
 const snap = await getDocs(collection(db, "schools", schoolId, "classes"));
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

 const gradeLabel = (g: string) => {
    if (g === allClassesKey || g === 'all') return 'All Grades';
    return /^\d+$/.test(g) ? `Grade ${g}` : g;
  };

 useEffect(() => {
 setLoading(true);
 setLoadError(null);

 const qRef = query(collection(db, "schools", schoolId, "subjects"), orderBy("name", "asc"));

 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const allSubjects: AcademicSubject[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 grade: data.classId || "-",
 section: data.section || "-",
 name: data.name || "Unnamed Subject",
 code: data.code || "",
 description: data.description || "",
 portions: data.portions || []
 };
 });

 // Client-side filtering because Firestore doesn't easily support dynamic multi-field OR/AND queries simply
 const filtered = allSubjects.filter(s => {
 const matchGrade = grade === allClassesKey || s.grade === grade;
 const matchSection = section === allSectionsKey || s.section.toUpperCase() === section.toUpperCase();
 const matchSearch = !searchQuery.trim() || 
 s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
 s.code.toLowerCase().includes(searchQuery.trim().toLowerCase());
 
 return matchGrade && matchSection && matchSearch;
 });

 setSubjects(filtered);
 setLoading(false);
 }, (err) => {
 console.error("Error loading subjects:", err);
 setLoadError("Failed to load subjects. Check permissions.");
 setLoading(false);
 });

 return () => unsubscribe();
 }, [schoolId, grade, section, searchQuery, allClassesKey, allSectionsKey]);

 useEffect(() => {
 if (classOptions.length && !classOptions.includes(grade)) setGrade(classOptions[0]);
 }, [classOptions, grade]);

 useEffect(() => {
 if (sectionOptions.length && !sectionOptions.includes(section)) setSection(sectionOptions[0]);
 }, [sectionOptions, section]);

 const counts = useMemo(() => {
 const total = subjects.length;
 const planned = subjects.reduce((acc, s) => acc + s.portions.filter((p) => p.status === "Planned").length, 0);
 const inProgress = subjects.reduce((acc, s) => acc + s.portions.filter((p) => p.status === "In Progress").length, 0);
 return { total, planned, inProgress };
 }, [subjects]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <AdminPageHeader
  title="Subjects"
  description="Different subjects for each class and section with portion planning"
  actions={
   <Link href={`/schools/${schoolId}/admin/academic/subjects/new`} className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all">
 <Plus size={14} /> Add Subject
 </Link>
  }
 />
 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-gray-100/80 text-gray-700">
 <BookOpen size={12} className="text-gray-400" /> {counts.total} subjects
 </span>
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100/50">
 {counts.planned} planned portions
 </span>
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100/50">
 {counts.inProgress} in-progress portions
 </span>
 </div>

 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}

 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 sm:w-[280px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 placeholder="Search subject or code..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>

 <div className="flex items-center gap-2">
 <div className="relative">
 <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg px-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
 {classOptions.map((g) => (
 <option key={g} value={g}>{gradeLabel(g)}</option>
 ))}
 </select>
 <ChevronRight size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
 </div>

 <div className="relative">
 <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg px-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
 {sectionOptions.map((s) => (
 <option key={s} value={s}>{s === allSectionsKey ? "All Sections" : `Section ${s}`}</option>
 ))}
 </select>
 <ChevronRight size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
 </div>
 </div>
 </div>

 <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{loading ? "Loading..." : `${subjects.length} results`}</div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Portions</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {subjects.map((s) => (
 <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50/50 last:border-0">
 <td className="px-5 py-2.5">
 <div className="min-w-0">
 <p className="text-xs font-extrabold text-gray-900 truncate">{s.name}</p>
 <p className="text-xs font-bold text-gray-500 truncate">{s.description || "—"}</p>
 </div>
 </td>
 <td className="px-5 py-2.5 text-xs font-bold text-gray-700">
 {s.grade}-{String(s.section).toUpperCase()}
 </td>
 <td className="px-5 py-2.5 text-xs font-semibold text-gray-700">{s.code || "—"}</td>
 <td className="px-5 py-2.5 text-center">
 <span className={cn("inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold", s.portions.length ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600")}>
 {s.portions.length}
 </span>
 </td>
 <td className="px-5 py-2.5 text-right">
 <TableRowActions
 items={[
 { label: "View", icon: Eye, href: `/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(s.id)}` },
 { label: "Edit", icon: Pencil, href: `/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(s.id)}/edit` },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete subject ${s.name}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "subjects", s.id),
 },
 ]}
 />
 </td>
 </tr>
 ))}
 {!loading && subjects.length === 0 && (
 <tr>
 <td colSpan={5} className="px-5 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <BookOpen size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No subjects found</p>
 <p className="text-xs text-gray-500 mt-1">Add subjects per class/section to use in Marks and planning.</p>
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
