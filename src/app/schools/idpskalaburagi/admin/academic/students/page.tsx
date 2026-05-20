"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
 CalendarCheck2,
 ChevronRight,
 Download,
 Eye,
 FileText,
 Mail,
 Pencil,
 Search,
 ShieldAlert,
 SlidersHorizontal,
 Star,
 UserCheck,
 UserPlus,
 Users,
 Filter,
 CheckCircle2,
 AlertCircle
} from "lucide-react";
import { useBranch } from "@/components/admin/BranchContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";
import { calculateAttendanceStats } from "@/utils/attendance";

// Define local AdminStudent type based on what we expect from Firestore
export interface AdminStudent {
 id: string;
 name: string;
 className: string;
 section: string;
 roll: string;
 status: "Active" | "Inactive";
 attendance: number;
}

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

function getAvatarColor(name: string) {
 const colors = [
 "bg-red-100 text-red-700 border-red-200", 
 "bg-orange-100 text-orange-700 border-orange-200", 
 "bg-amber-100 text-amber-700 border-amber-200", 
 "bg-green-100 text-green-700 border-green-200", 
 "bg-emerald-100 text-emerald-700 border-emerald-200", 
 "bg-teal-100 text-teal-700 border-teal-200", 
 "bg-cyan-100 text-cyan-700 border-cyan-200", 
 "bg-blue-100 text-blue-700 border-blue-200", 
 "bg-indigo-100 text-indigo-700 border-indigo-200", 
 "bg-violet-100 text-violet-700 border-violet-200", 
 "bg-purple-100 text-purple-700 border-purple-200", 
 "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", 
 "bg-pink-100 text-pink-700 border-pink-200", 
 "bg-rose-100 text-rose-700 border-rose-200",
 ];
 if (!name) return colors[0];
 const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
 return colors[index];
}

export default function AdminStudentsPage() {
 const { activeBranch } = useBranch();
 const schoolId = "idpskalaburagi";
 const allClassesKey = "all";
 const allSectionsKey = "all";
 const [students, setStudents] = useState<AdminStudent[]>([]);
 const [classOptions, setClassOptions] = useState<string[]>([]);
 const [sectionOptions, setSectionOptions] = useState<string[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [classFilter, setClassFilter] = useState<string>(allClassesKey);
 const [sectionFilter, setSectionFilter] = useState<string>(allSectionsKey);
 const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
 const [selected, setSelected] = useState<Record<string, boolean>>({});

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 
 const q = query(
 collection(db, "schools", schoolId, "students"),
 orderBy("firstName", "asc")
 );

 const unsubscribe = onSnapshot(
 q,
 (snapshot) => {
 const studentData: AdminStudent[] = snapshot.docs.map(doc => {
 const data = doc.data();
 
 // Calculate real attendance percentage
 const stats = calculateAttendanceStats(
 data.attendance?.presentDates || [],
 data.attendance?.absentDates || [],
 data.attendance?.lateDates || []
 );

 return {
 id: doc.id,
 name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed',
 className: data.classId || '-',
 section: data.section || '-',
 roll: data.rollNumber || '-',
 status: data.status === "Inactive" ? "Inactive" : "Active",
 attendance: stats.percentage
 };
 });
 setStudents(studentData);
 setLoading(false);
 },
 (err) => {
 console.error("Error loading students:", err);
 setLoadError("Failed to load students. Please ensure you have correct permissions.");
 setLoading(false);
 }
 );

 return () => unsubscribe();
 }, [schoolId]);

 useEffect(() => {
 const q = query(collection(db, "schools", schoolId, "classes"));
 const unsub = onSnapshot(
 q,
 (snapshot) => {
 const raw = snapshot.docs.map((d) => d.data() as any);
 
 const grades = raw.map(c => String(c.grade ?? c.name ?? "").trim()).filter(Boolean);
 const sections = raw.map(c => String(c.section ?? "").trim().toUpperCase()).filter(Boolean);

 const uniqueGrades = Array.from(new Set(grades)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
 const uniqueSections = Array.from(new Set(sections)).sort((a, b) => a.localeCompare(b));

 setClassOptions(uniqueGrades);
 setSectionOptions(uniqueSections);
 },
 () => {
 setClassOptions([]);
 setSectionOptions([]);
 }
 );
 return () => unsub();
 }, [schoolId]);

 useEffect(() => {
 if (classFilter !== allClassesKey && classOptions.length && !classOptions.includes(classFilter)) setClassFilter(allClassesKey);
 }, [classFilter, classOptions, allClassesKey]);

 useEffect(() => {
 if (sectionFilter !== allSectionsKey && sectionOptions.length && !sectionOptions.includes(sectionFilter)) setSectionFilter(allSectionsKey);
 }, [sectionFilter, sectionOptions, allSectionsKey]);

 const stats = useMemo(() => {
 const total = students.length;
 const active = students.filter((s) => s.status === "Active").length;
 const inactive = total - active;
 const avgAttendance = total === 0 ? 0 : Math.round((students.reduce((sum, s) => sum + s.attendance, 0) / total) * 10) / 10;
 return { total, active, inactive, avgAttendance };
 }, [students]);

 const filtered = useMemo(() => {
 const q = searchQuery.trim().toLowerCase();
 return students.filter((s) => {
 const matchesQuery = !q || `${s.name} ${s.id}`.toLowerCase().includes(q);
 const matchesClass = classFilter === allClassesKey || s.className === classFilter;
 const matchesSection = sectionFilter === allSectionsKey || s.section === sectionFilter;
 const matchesStatus = statusFilter === "all" || s.status === statusFilter;
 return matchesQuery && matchesClass && matchesSection && matchesStatus;
 });
 }, [classFilter, sectionFilter, searchQuery, statusFilter, students, allClassesKey, allSectionsKey]);

 const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
 const allSelectedOnPage = useMemo(() => filtered.length > 0 && filtered.every((s) => selected[s.id]), [filtered, selected]);

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {/* Top Header */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#144835]/10 text-[#144835] border border-[#144835]/15">
 <span className="h-1.5 w-1.5 rounded-full bg-[#144835]" />
 Academics
 </span>
 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
 {activeBranch?.name || "All Branches"}
 </span>
 </div>
 <p className="text-xl font-black text-gray-900 tracking-tight truncate">
 Enrollment & Student Records
 </p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">
 Profiles, status, and quick actions across classes & sections
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end mt-2 xl:mt-0">
 <ExportButton data={filtered} filename="Export" className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <Link
 href={`/schools/${schoolId}/admin/academic/students/new`}
 className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <UserPlus size={14} /> Add Student
 </Link>
 </div>
 </div>
 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
 <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <Users size={20} />
 </div>
 <div>
 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Students</p>
 <p className="text-xl font-black text-gray-900 tracking-tight">{stats.total.toLocaleString()}</p>
 </div>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
 <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <UserCheck size={20} />
 </div>
 <div>
 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Active</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-black text-gray-900 tracking-tight">{stats.active.toLocaleString()}</p>
 <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
 {stats.total ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%"}
 </p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
 <ShieldAlert size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Inactive</p>
 <p className="text-xl font-extrabold text-gray-900">{stats.inactive.toLocaleString()}</p>
 <p className="text-[10px] font-medium text-gray-400 mt-0.5">Not currently enrolled</p>
 </div>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
 <CalendarCheck2 size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Avg Attendance</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-black text-gray-900 tracking-tight">{stats.avgAttendance}%</p>
 {stats.avgAttendance < 80 && (
 <span className="text-[9px] font-bold text-red-500 flex items-center bg-red-50 px-1 py-0.5 rounded"><AlertCircle size={10} className="mr-0.5"/> Low</span>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
 {/* Filter Bar */}
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
 <div className="relative w-full sm:w-[240px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 placeholder="Search students..."
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none sm:min-w-[120px]">
 <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <select
 value={classFilter}
 onChange={(e) => setClassFilter(e.target.value)}
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-8 pr-7 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option value="all">All Classes</option>
 {classOptions.map((c) => (
 <option key={c} value={c}>Class {c}</option>
 ))}
 </select>
 <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={12} />
 </div>

 <div className="relative flex-1 sm:flex-none sm:min-w-[120px]">
 <select
 value={sectionFilter}
 onChange={(e) => setSectionFilter(e.target.value)}
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-7 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option value="all">All Sections</option>
 {sectionOptions.map((s) => (
 <option key={s} value={s}>Section {s}</option>
 ))}
 </select>
 <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={12} />
 </div>
 
 <div className="relative flex-1 sm:flex-none sm:min-w-[120px]">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-7 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option value="all">All Status</option>
 <option value="Active">Active</option>
 <option value="Inactive">Inactive</option>
 </select>
 <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={12} />
 </div>
 </div>
 </div>
 </div>

 {selectedCount > 0 && (
 <div className="px-4 py-2 border-b border-gray-100 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in slide-in-from-top-2">
 <div className="flex items-center gap-1.5">
 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
 {selectedCount}
 </span>
 <span className="text-xs font-bold text-blue-900">students selected</span>
 </div>
 <div className="flex flex-wrap items-center gap-1.5">
 <button type="button" className="h-7 inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50 transition-colors">
 <Mail size={12} /> Message
 </button>
 <button type="button" className="h-7 inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50 transition-colors">
 <FileText size={12} /> Report Card
 </button>
 <div className="w-px h-3 bg-blue-200 mx-0.5"></div>
 <button type="button" className="h-7 inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2.5 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-colors">
 <ShieldAlert size={12} /> Mark Inactive
 </button>
 </div>
 </div>
 )}

 <div className="overflow-x-auto">
 {loading ? (
 <div className="p-8 flex items-center justify-center">
 <div className="w-6 h-6 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
 </div>
 ) : (
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-2.5 w-[40px]">
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={allSelectedOnPage}
 onChange={(e) => {
 const checked = e.target.checked;
 setSelected((prev) => {
 const next = { ...prev };
 filtered.forEach((s) => {
 next[s.id] = checked;
 });
 return next;
 });
 }}
 />
 </th>
 <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Student</th>
 <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">ID & Roll</th>
 <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Class & Sec</th>
 <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Attendance</th>
 <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filtered.length > 0 ? (
 filtered.map((s) => {
 const initials = s.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
 const active = s.status === "Active";
 const avatarColor = getAvatarColor(s.name);
 const isLowAttendance = s.attendance < 75;

 return (
 <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-5 py-2.5">
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={Boolean(selected[s.id])}
 onChange={(e) => setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))}
 />
 </td>
 <td className="px-5 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black border", avatarColor)}>
 {initials}
 </div>
 <div>
 <div className="text-xs font-bold text-gray-900">{s.name}</div>
 <div className="text-[10px] font-medium text-gray-500 mt-0.5">Joined 2023</div>
 </div>
 </div>
 </td>
 <td className="px-5 py-2.5">
 <div className="text-xs font-bold text-gray-700">#{s.id}</div>
 <div className="text-[10px] font-medium text-gray-500 mt-0.5">Roll: {s.roll}</div>
 </td>
 <td className="px-5 py-2.5 text-center">
 <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100/80 text-[11px] font-bold text-gray-700">
 {s.className}-{s.section}
 </span>
 </td>
 <td className="px-5 py-2.5">
 <span className={cn(
 "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
 active ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" : "bg-red-50 text-red-700 border-red-100/50"
 )}>
 {active ? <CheckCircle2 size={10}/> : <AlertCircle size={10}/>}
 {s.status}
 </span>
 </td>
 <td className="px-5 py-2.5">
 <div className="flex items-center gap-2">
 <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
 <div 
 className={cn("h-full rounded-full transition-all", isLowAttendance ? "bg-red-500" : "bg-emerald-500")} 
 style={{ width: `${s.attendance}%` }} 
 />
 </div>
 <span className={cn("text-[10px] font-bold", isLowAttendance ? "text-red-600" : "text-gray-700")}>
 {s.attendance}%
 </span>
 </div>
 </td>
 <td className="px-5 py-2.5 text-right">
 <div className="flex items-center justify-end gap-0.5 transition-opacity">
 <Link href={`/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/profile`} className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors" title="View Profile">
 <Eye size={14} />
 </Link>
 <Link href={`/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/edit`} className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit Student">
 <Pencil size={14} />
 </Link>
 <Link href={`/schools/${schoolId}/admin/academic/attendance`} className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors" title="Attendance">
 <CalendarCheck2 size={14} />
 </Link>
 </div>
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={7} className="px-5 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={20} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No students found</p>
 <p className="text-[10px] text-gray-500 mt-0.5">Try adjusting your filters or search query.</p>
 <button 
 onClick={() => {
 setSearchQuery("");
 setClassFilter(allClassesKey);
 setSectionFilter(allSectionsKey);
 setStatusFilter("all");
 }}
 className="mt-4 h-8 px-4 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
 >
 Clear Filters
 </button>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 )}
 </div>

 <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
 <p className="text-xs font-medium text-gray-500">
 Showing <span className="font-bold text-gray-900">{filtered.length ? `1-${filtered.length}` : "0"}</span> of{" "}
 <span className="font-bold text-gray-900">{filtered.length}</span> students
 </p>
 <div className="flex items-center gap-1.5">
 <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>
 <ChevronRight className="rotate-180" size={14} />
 </button>
 <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#144835] text-xs font-bold text-white shadow-sm">
 1
 </button>
 <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
 2
 </button>
 <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 transition-colors">
 <ChevronRight size={14} />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
