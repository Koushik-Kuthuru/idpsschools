"use client";

import AdminPageHeader from "@/components/admin/PageHeader";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
 BarChart3, 
 ClipboardList, 
 MapPin, 
 Plus, 
 RefreshCw, 
 TriangleAlert, 
 Users, 
 Pencil, 
 Search,
 BookOpen,
 LayoutGrid,
 TrendingUp,
 Filter,
 CheckCircle2,
 AlertCircle
} from "lucide-react";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type SectionRow = {
 section: string;
 strength: number;
 teacherCount: number;
 teacherInitials?: string[];
 status: "Active" | "Inactive";
 room?: string;
};

type GradeGroup = {
 grade: string;
 sections: SectionRow[];
};

function strengthColor(strength: number) {
 if (strength > 50) return "bg-red-500";
 if (strength > 45) return "bg-amber-500";
 return "bg-emerald-500";
}

function strengthText(strength: number) {
 if (strength > 50) return "text-red-700";
 if (strength > 45) return "text-amber-700";
 return "text-emerald-700";
}

function strengthBg(strength: number) {
 if (strength > 50) return "bg-red-50";
 if (strength > 45) return "bg-amber-50";
 return "bg-emerald-50";
}

export default function AdminClassesPage() {
 const schoolId = "idpscherukupalli";
 const [classEntries, setClassEntries] = useState<Array<{ grade: string; section: string; room?: string; status: "Active" | "Inactive"; classTeacherId?: string }>>([]);
 const [gradeCatalog, setGradeCatalog] = useState<string[]>(["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [filterGrade, setFilterGrade] = useState("All");
 const [addOpen, setAddOpen] = useState(false);
 const [formGrade, setFormGrade] = useState("Nursery");
 const [formSection, setFormSection] = useState("A");
 const [formRoom, setFormRoom] = useState("");
 const [formStrength, setFormStrength] = useState<number>(0);
 const [formTeacherCount, setFormTeacherCount] = useState<number>(0);
 const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
 const [formError, setFormError] = useState<string | null>(null);

 const gradeLabel = (g: string) => (/^\d+$/.test(g) ? `Grade ${g}` : g);

 const keyFor = useCallback((grade: string, section: string) => {
 return `${String(grade || "").trim()}__${String(section || "").trim().toUpperCase()}`;
 }, []);

 const teacherInitialsFromName = useCallback((firstName: unknown, lastName: unknown, name: unknown) => {
 const n = String(name ?? `${String(firstName ?? "")} ${String(lastName ?? "")}`).trim();
 const parts = n.split(/\s+/).filter(Boolean);
 const a = parts[0]?.[0] || "";
 const b = parts[1]?.[0] || "";
 return (a + b).toUpperCase() || "T";
 }, []);

 const teacherKeysFromDoc = useCallback((data: any) => {
 const keys: string[] = [];
 const directGrade = data?.classId ?? data?.grade ?? data?.className ?? data?.homeroomGrade;
 const directSection = data?.section ?? data?.homeroomSection;
 if (directGrade && directSection) {
 keys.push(keyFor(String(directGrade), String(directSection)));
 }

 const assignedClasses = Array.isArray(data?.assignedClasses) ? (data.assignedClasses as any[]) : [];
 assignedClasses.forEach((v) => {
 const raw = String(v || "").trim();
 const parts = raw.split("-").map((p) => p.trim()).filter(Boolean);
 if (parts.length >= 2) keys.push(keyFor(parts[0], parts[1]));
 });

 const classes = Array.isArray(data?.classes) ? (data.classes as any[]) : [];
 classes.forEach((c) => {
 const g = c?.grade ?? c?.classId ?? c?.name;
 const s = c?.section;
 if (g && s) keys.push(keyFor(String(g), String(s)));
 });

 return Array.from(new Set(keys));
 }, [keyFor]);

 const [studentCountByKey, setStudentCountByKey] = useState<Record<string, number>>({});
 const [teacherByKey, setTeacherByKey] = useState<Record<string, { count: number; initials: string[] }>>({});

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 const q = query(collection(db, "schools", schoolId, "classes"));
 
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const entries = snapshot.docs
 .map((d) => ({ id: d.id, ...d.data() }))
 .map((data: any) => {
 const grade = String(data.grade ?? data.name ?? "").trim() || "Unknown";
 const section = String(data.section ?? "-").toUpperCase();
 const status: "Active" | "Inactive" = data.status === "Inactive" ? "Inactive" : "Active";
 return {
 grade,
 section,
 room: data.room || "TBD",
 status,
 classTeacherId: data.classTeacherId ? String(data.classTeacherId) : undefined,
 };
 });

 setClassEntries(entries);
 const catalogSet = new Set(entries.map((e) => e.grade));
 const catalog = Array.from(catalogSet).sort((a, b) => {
 const numA = parseInt(a);
 const numB = parseInt(b);
 if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
 return a.localeCompare(b);
 });
 if (catalog.length) setGradeCatalog(catalog);
 setLoading(false);
 }, (err) => {
 console.error("Error loading classes:", err);
 setLoadError("Failed to load classes. Check permissions.");
 setLoading(false);
 });

 return () => unsubscribe();
 }, [schoolId]);

 useEffect(() => {
 const unsub = onSnapshot(
 collection(db, "schools", schoolId, "students"),
 (snap) => {
 const counts: Record<string, number> = {};
 snap.docs.forEach((d) => {
 const data = d.data() as any;
 const grade = String(data.classId ?? "").trim();
 const section = String(data.section ?? "").trim().toUpperCase();
 if (!grade || !section) return;
 const key = keyFor(grade, section);
 counts[key] = (counts[key] ?? 0) + 1;
 });
 setStudentCountByKey(counts);
 },
 () => setStudentCountByKey({})
 );
 return () => unsub();
 }, [keyFor, schoolId]);

 useEffect(() => {
 const unsub = onSnapshot(
 collection(db, "schools", schoolId, "teachers"),
 (snap) => {
 const temp: Record<string, { ids: Set<string>; initials: string[] }> = {};
 snap.docs.forEach((d) => {
 const data = d.data() as any;
 const keys = teacherKeysFromDoc(data);
 if (!keys.length) return;
 const initials = teacherInitialsFromName(data.firstName, data.lastName, data.name);
 keys.forEach((k) => {
 if (!temp[k]) temp[k] = { ids: new Set<string>(), initials: [] };
 if (!temp[k].ids.has(d.id)) {
 temp[k].ids.add(d.id);
 temp[k].initials.push(initials);
 }
 });
 });
 const next: Record<string, { count: number; initials: string[] }> = {};
 Object.keys(temp).forEach((k) => {
 next[k] = { count: temp[k].ids.size, initials: temp[k].initials };
 });
 setTeacherByKey(next);
 },
 () => setTeacherByKey({})
 );
 return () => unsub();
 }, [schoolId, teacherInitialsFromName, teacherKeysFromDoc]);

 const classes = useMemo((): GradeGroup[] => {
 const classMap: Record<string, SectionRow[]> = {};

 classEntries.forEach((e) => {
 const grade = e.grade;
 const section = e.section;
 const key = keyFor(grade, section);
 const strength = studentCountByKey[key] ?? 0;
 const teacherInfo = teacherByKey[key];
 const teacherCount = teacherInfo?.count ?? (e.classTeacherId ? 1 : 0);
 const teacherInitials = teacherInfo?.initials?.length ? teacherInfo.initials : undefined;

 if (!classMap[grade]) classMap[grade] = [];
 classMap[grade].push({
 section,
 strength,
 teacherCount,
 teacherInitials,
 status: e.status,
 room: e.room,
 });
 });

 const nextClasses = Object.keys(classMap).map((grade) => ({
 grade,
 sections: classMap[grade].sort((a, b) => a.section.localeCompare(b.section)),
 }));

 nextClasses.sort((a, b) => {
 const gradeA = a.grade;
 const gradeB = b.grade;
 const numA = parseInt(gradeA);
 const numB = parseInt(gradeB);
 if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
 return gradeA.localeCompare(gradeB);
 });

 return nextClasses;
 }, [classEntries, keyFor, studentCountByKey, teacherByKey]);

 async function submitAdd() {
 setFormError(null);
 const grade = formGrade.trim();
 const section = formSection.trim();
 if (!grade || !section) {
 setFormError("Grade and section are required.");
 return;
 }
 
 try {
 const normalizedSection = section.toUpperCase();
 await addDoc(collection(db, "schools", schoolId, "classes"), {
 grade: grade,
 name: grade,
 section: normalizedSection,
 room: formRoom,
 capacity: formStrength,
 status: formStatus,
 createdAt: new Date().toISOString()
 });
 setAddOpen(false);
 // Reset form
 setFormSection("A");
 setFormRoom("");
 setFormStrength(0);
 setFormTeacherCount(0);
 } catch (e: any) {
 setFormError(e.message || "Failed to add class/section");
 }
 }

 const stats = useMemo(() => {
 let totalSections = 0;
 let totalStudents = 0;
 let overcrowded = 0;
 
 classes.forEach((g: GradeGroup) => {
 g.sections.forEach((s: SectionRow) => {
 totalSections++;
 totalStudents += s.strength;
 if (s.strength > 50) overcrowded++;
 });
 });

 const activeGrades = classes.length;
 const avgStrength = totalSections ? Math.round(totalStudents / totalSections) : 0;

 return { activeGrades, totalSections, totalStudents, avgStrength, overcrowded };
 }, [classes]);

 const filteredClasses = useMemo(() => {
 return classes
 .filter(g => filterGrade === "All" || g.grade === filterGrade)
 .map(g => ({
 ...g,
 sections: g.sections.filter(s => 
 searchQuery === "" || 
 s.section.toLowerCase().includes(searchQuery.toLowerCase()) || 
 g.grade.toLowerCase().includes(searchQuery.toLowerCase())
 )
 }))
 .filter(g => g.sections.length > 0);
 }, [searchQuery, filterGrade, classes]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 
  {/* Top Header */}
 <AdminPageHeader
  title="Classes & Sections"
  description="Manage grade levels, sections, and class assignments"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="flex-1 min-w-[180px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Filter by Grade</label>
 <div className="relative">
 <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <select 
 value={filterGrade}
 onChange={(e) => setFilterGrade(e.target.value)}
 className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 appearance-none"
 >
 <option value="All">All Grades</option>
 {(gradeCatalog.length ? gradeCatalog : classes.map((g) => g.grade)).map((g) => (
 <option key={g} value={g}>{gradeLabel(g)}</option>
 ))}
 </select>
 </div>
 </div>
 
 <div className="flex-1 min-w-[200px] xl:w-[240px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Search</label>
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all placeholder:text-gray-400"
 placeholder="Search class or section..."
 />
 </div>
 </div>

 <div className="pt-4">
 <button onClick={() => { setSearchQuery(""); setFilterGrade("All"); }} className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#144835]/10 text-[#144835] hover:bg-[#144835]/20 transition-colors" title="Reload Data">
 <RefreshCw size={14} />
 </button>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto pt-1 xl:pt-4 justify-end">
 <button
 type="button"
 onClick={() => { setAddOpen(true); setFormError(null); }}
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
 >
 <Plus size={14} /> Add Section
 </button>
 <button
 type="button"
 onClick={() => { setAddOpen(true); setFormError(null); }}
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-colors"
 >
 <Plus size={14} /> Add New Class
 </button>
 </div>
 </div>
 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
 <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <BookOpen size={20} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Grades</p>
 <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.activeGrades}</p>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
 <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
 <LayoutGrid size={20} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Sections</p>
 <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.totalSections}</p>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
 <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <Users size={20} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Students</p>
 <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.totalStudents}</p>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
 <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", stats.overcrowded > 0 ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600")}>
 <TrendingUp size={20} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Avg Strength</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.avgStrength}</p>
 {stats.overcrowded > 0 && <span className="text-xs font-bold text-red-500 flex items-center bg-red-50 px-1 py-0.5 rounded"><AlertCircle size={10} className="mr-0.5"/> {stats.overcrowded} over</span>}
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
 <h2 className="text-xs font-bold text-gray-800">Classes Overview</h2>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Grade</th>
 <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
 <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
 <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Strength</th>
 <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Teachers</th>
 <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {loading ? (
 Array.from({ length: 6 }).map((_, i) => (
 <tr key={`skeleton-${i}`} className="animate-pulse">
 <td className="px-5 py-2.5">
 <div className="h-6 w-16 rounded bg-gray-100" />
 </td>
 <td className="px-5 py-2.5">
 <div className="h-6 w-20 rounded bg-gray-100" />
 </td>
 <td className="px-5 py-2.5">
 <div className="h-5 w-24 rounded bg-gray-100" />
 </td>
 <td className="px-5 py-2.5">
 <div className="h-6 w-28 rounded bg-gray-100" />
 </td>
 <td className="px-5 py-2.5">
 <div className="h-5 w-16 rounded bg-gray-100" />
 </td>
 <td className="px-5 py-2.5">
 <div className="h-5 w-16 rounded bg-gray-100" />
 </td>
 <td className="px-5 py-2.5 text-right">
 <div className="h-6 w-20 rounded bg-gray-100 ml-auto" />
 </td>
 </tr>
 ))
 ) : filteredClasses.length > 0 ? (
 filteredClasses.flatMap((g) =>
 g.sections.map((s, idx) => {
 const showGrade = idx === 0;
 const rowSpan = g.sections.length;
 const barWidth = Math.min(100, Math.round((s.strength / 60) * 100));
 const lowTeachers = s.teacherCount <= 1;
 const isOvercrowded = s.strength > 50;

 return (
 <tr key={`${g.grade}-${s.section}`} className="hover:bg-gray-50/50 transition-colors group">
 {showGrade ? (
 <td rowSpan={rowSpan} className="px-5 py-2.5 align-top border-r border-gray-100/50">
 <div className="flex items-center gap-2">
 <div className="h-7 w-7 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-700">
 {g.grade}
 </div>
 <span className="text-xs font-bold text-gray-900">{gradeLabel(g.grade)}</span>
 </div>
 </td>
 ) : null}
 <td className="px-5 py-2.5">
 <span className="text-xs font-bold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded">
 Sec {s.section}
 </span>
 </td>
 <td className="px-5 py-2.5">
 <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
 <MapPin size={12} className="text-gray-400" />
 {s.room || "TBD"}
 </div>
 </td>
 <td className="px-5 py-2.5">
 <div className="flex items-center gap-2">
 <div className={cn("flex items-center justify-center min-w-[2rem] rounded px-1.5 py-0.5 text-xs font-bold border border-white/20", strengthBg(s.strength), strengthText(s.strength))}>
 {s.strength}
 </div>
 <div className="hidden sm:block h-1 w-20 rounded-full bg-gray-100 overflow-hidden">
 <div className={cn("h-full rounded-full transition-all", strengthColor(s.strength))} style={{ width: `${barWidth}%` }} />
 </div>
 {isOvercrowded && (
 <span title="Overcrowded">
 <TriangleAlert size={12} className="text-red-500" />
 </span>
 )}
 </div>
 </td>
 <td className="px-5 py-2.5">
 {s.teacherInitials?.length ? (
 <div className="flex items-center">
 {s.teacherInitials.slice(0, 3).map((t) => (
 <div
 key={t}
 className="-ml-1.5 first:ml-0 h-6 w-6 rounded-full border-2 border-white bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold z-10"
 >
 {t}
 </div>
 ))}
 {s.teacherCount > 3 && (
 <div className="-ml-1.5 h-6 w-6 rounded-full border-2 border-white bg-gray-50 text-gray-600 flex items-center justify-center text-xs font-bold z-10">
 +{s.teacherCount - 3}
 </div>
 )}
 </div>
 ) : (
 <div className={cn("inline-flex items-center gap-1 text-xs font-bold", lowTeachers ? "text-orange-600" : "text-gray-700")}>
 {s.teacherCount} Teachers
 {lowTeachers && (
 <span title="Low teacher count">
 <AlertCircle size={12} />
 </span>
 )}
 </div>
 )}
 </td>
 <td className="px-5 py-2.5">
 <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100/50">
 <CheckCircle2 size={10} />
 {s.status}
 </span>
 </td>
 <td className="px-5 py-2.5 text-right">
 <div className="flex items-center justify-end gap-0.5 transition-opacity">
 <button type="button" className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit Section">
 <Pencil size={14} />
 </button>
 <button type="button" className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors" title="View Teachers">
 <Users size={14} />
 </button>
 <button type="button" className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="Student List">
 <ClipboardList size={14} />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 )
 ) : (
 <tr>
 <td colSpan={7} className="px-5 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={20} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No classes found</p>
 <p className="text-xs text-gray-500 mt-0.5">Try adjusting your filters or search query.</p>
 <button 
 onClick={() => { setSearchQuery(""); setFilterGrade("All"); }}
 className="mt-3 text-xs font-bold text-[#144835] hover:underline"
 >
 Clear filters
 </button>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {addOpen && (
 <div className="fixed inset-0 z-50">
 <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
 <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-[16px] border border-gray-100 shadow-2xl overflow-hidden">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between">
 <div>
 <h3 className="text-xs font-bold text-gray-900">Add Class / Section</h3>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Nursery, LKG, UKG, and Grade 1–12 supported</p>
 </div>
 <button onClick={() => setAddOpen(false)} className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center">
 ×
 </button>
 </div>
 <div className="p-4 space-y-3">
 {formError && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-2 text-xs font-bold">{formError}</div>}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Grade</label>
 <select value={formGrade} onChange={(e) => setFormGrade(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800">
 {(gradeCatalog.length ? gradeCatalog : ["Nursery","LKG","UKG","1","2","3","4","5","6","7","8","9","10","11","12"]).map((g) => (
 <option key={g} value={g}>{gradeLabel(g)}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Section</label>
 <input value={formSection} onChange={(e) => setFormSection(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800" placeholder="A" />
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Room</label>
 <input value={formRoom} onChange={(e) => setFormRoom(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800" placeholder="101" />
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
 <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800">
 <option value="Active">Active</option>
 <option value="Inactive">Inactive</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Strength</label>
 <input type="number" value={formStrength} onChange={(e) => setFormStrength(Number(e.target.value))} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800" />
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Teachers</label>
 <input type="number" value={formTeacherCount} onChange={(e) => setFormTeacherCount(Number(e.target.value))} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800" />
 </div>
 </div>
 </div>
 <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
 <button onClick={() => setAddOpen(false)} className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
 <button onClick={submitAdd} className="h-8 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90">Save</button>
 </div>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <button className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-[#144835]/30 hover:shadow-md transition-all group">
 <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
 <BarChart3 size={18} />
 </div>
 <p className="mt-3 text-xs font-bold text-gray-900">Class Strength Report</p>
 <p className="mt-1 text-xs font-medium text-gray-500 line-clamp-2">
 Detailed occupancy and gender ratio analysis across all sections and grades.
 </p>
 </button>
 
 <button className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-[#144835]/30 hover:shadow-md transition-all group">
 <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
 <Users size={18} />
 </div>
 <p className="mt-3 text-xs font-bold text-gray-900">Teacher Allocation</p>
 <p className="mt-1 text-xs font-medium text-gray-500 line-clamp-2">
 Review subject teacher and class teacher assignments per section to ensure optimal load.
 </p>
 </button>
 
 <button className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-[#144835]/30 hover:shadow-md transition-all group">
 <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
 <MapPin size={18} />
 </div>
 <p className="mt-3 text-xs font-bold text-gray-900">Room Mapping</p>
 <p className="mt-1 text-xs font-medium text-gray-500 line-clamp-2">
 Assign and monitor physical classroom locations for each grade across the campus.
 </p>
 </button>
 </div>
 </div>
 );
}
