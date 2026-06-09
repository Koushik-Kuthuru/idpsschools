"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { CalendarDays, Check, Download, MoreHorizontal, Save, Search, Users, XCircle, RotateCw, Filter, CheckCircle2, AlertCircle, User, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, orderBy, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import ExportButton from "@/components/ui/ExportButton";
import { calculateAttendanceStats } from "@/utils/attendance";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export type AttendanceStatus = "P" | "A" | "None";

export type StudentAttendanceRow = {
  roll: string;
  admissionNumber: string;
  name: string;
  studentId: string;
  classId: string;
  section: string;
  gender: "Male" | "Female";
  attendancePercent: number;
  status: AttendanceStatus;
  remarks: string;
};

function getAvatarColor(name: string) {
 const colors = [
 "bg-red-100 text-red-700", "bg-orange-100 text-orange-700", 
 "bg-amber-100 text-amber-700", "bg-green-100 text-green-700", 
 "bg-emerald-100 text-emerald-700", "bg-teal-100 text-teal-700", 
 "bg-cyan-100 text-cyan-700", "bg-blue-100 text-blue-700", 
 "bg-indigo-100 text-indigo-700", "bg-violet-100 text-violet-700", 
 ];
 const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
 return colors[index];
}

export default function AdminAttendancePage() {
 const schoolId = "idpskalaburagi";
 const allClassesKey = "All";
 const allSectionsKey = "All";
 const [academicDate, setAcademicDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
 const [classOptions, setClassOptions] = useState<string[]>([]);
 const [sectionOptions, setSectionOptions] = useState<string[]>([]);
 const [grade, setGrade] = useState<string>(allClassesKey);
 const [section, setSection] = useState<string>(allSectionsKey);
 const [holidays, setHolidays] = useState<string[]>([]);

 useEffect(() => {
  const unsub = onSnapshot(collection(db, "schools", schoolId, "holidays"), (snap) => {
   setHolidays(snap.docs.map(d => d.data().date));
  });
  return () => unsub();
 }, [schoolId]);
  const [sortBy, setSortBy] = useState<"name" | "admissionNumber">("name");
  const [roster, setRoster] = useState<StudentAttendanceRow[]>([]);
 const [searchQuery, setSearchQuery] = useState<string>("");
 const [selected, setSelected] = useState<Record<string, boolean>>({});
 const [isSaving, setIsSaving] = useState(false);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

 useEffect(() => {
   const handleClickOutside = () => setOpenDropdownId(null);
   document.addEventListener("click", handleClickOutside);
   return () => document.removeEventListener("click", handleClickOutside);
 }, []);

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
 console.error("Failed to load classes meta:", err);
 }
 }
 loadMeta();
 }, [schoolId, allClassesKey, allSectionsKey]);

 const gradeLabel = (g: string) => {
    if (g === allClassesKey || g === 'all') return 'All Classes';
    return /^\d+$/.test(g) ? `Grade ${g}` : g;
  };

 useEffect(() => {
 if (classOptions.length && !classOptions.includes(grade)) setGrade(classOptions[0]);
 }, [classOptions, grade]);

 useEffect(() => {
 if (sectionOptions.length && !sectionOptions.includes(section)) setSection(sectionOptions[0]);
 }, [sectionOptions, section]);

 const loadRoster = useCallback(async (nextGrade: string, nextSection: string) => {
 try {
 setLoadError(null);
 const q = query(collection(db, "schools", schoolId, "students"));
 const snapshot = await getDocs(q);

 const filteredStudents = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((s: any) => {
          const classId = String(s.classId || "").trim();
          const studentSection = String(s.section || "").trim().toUpperCase();
          const wantGrade = String(nextGrade || "").trim();
          const wantSection = String(nextSection || "").trim().toUpperCase();
          
          const matchClass = wantGrade.toLowerCase() === allClassesKey.toLowerCase() || classId === wantGrade;
          const matchSection = wantSection.toLowerCase() === allSectionsKey.toLowerCase() || studentSection === wantSection;
          
          return matchClass && matchSection;
        });

 const rosterData = filteredStudents.map((s: any, idx): StudentAttendanceRow => {
        // Calculate real attendance percentage using dynamic holidays
        const stats = calculateAttendanceStats(
          s.attendance?.presentDates || [],
          s.attendance?.absentDates || [],
          s.attendance?.lateDates || [],
          undefined, // start date
          undefined, // end date
          holidays // use dynamic holidays from settings
        );

        return {
          roll: String(s.rollNumber || idx + 1),
          admissionNumber: String(s.admissionNumber || s.rollNumber || s.id || idx + 1),
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed',
          studentId: String(s.id),
          classId: String(s.classId || "-"),
          section: String(s.section || "-").toUpperCase(),
          gender: s.gender === "Female" ? "Female" : "Male",
          attendancePercent: stats.percentage,
          status: "None",
          remarks: "",
        };
      });

      setRoster(rosterData);
      setSelected({});
    } catch (e: any) {
      setRoster([]);
      setSelected({});
      setLoadError(e?.message || "Failed to load roster");
    }
  }, [schoolId, allClassesKey, allSectionsKey, holidays]);

 useEffect(() => {
 setAcademicDate(new Date().toISOString().split('T')[0]);
 }, []);

 useEffect(() => {
 loadRoster(grade, section);
 }, [grade, section, loadRoster]);

 const totals = useMemo(() => {
 const total = roster.length;
 const present = roster.filter((r) => r.status === "P").length;
 const absent = roster.filter((r) => r.status === "A").length;
 return { total, present, absent };
 }, [roster]);

 const filteredRoster = useMemo(() => {
    let result = roster;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => `${r.name} ${r.studentId} ${r.admissionNumber} ${r.roll} ${r.classId} ${r.section}`.toLowerCase().includes(q));
    }
    
    result = [...result].sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else {
        const valA = String(a.admissionNumber || "");
        const valB = String(b.admissionNumber || "");
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      }
    });

    return result;
  }, [searchQuery, roster, sortBy]);

 const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
 const allSelectedOnPage = filteredRoster.length > 0 && filteredRoster.every((r) => selected[r.studentId]);

 useEffect(() => {
    if (grade && section) {
      loadRoster(grade, section);
    }
  }, [grade, section, loadRoster]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleReset = () => {
    setGrade(allClassesKey);
    setSection(allSectionsKey);
    setSearchQuery("");
    setSortBy("name");
    setAcademicDate(new Date().toISOString().split('T')[0]);
  };

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
  {/* Top Header */}
 <AdminPageHeader
  title="Attendance"
  description="Mark and review daily student attendance by class and section"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
 <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
 <div className="flex flex-col gap-1.5 w-full sm:w-[240px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
 <div className="flex items-center gap-1.5">
   <button 
     type="button"
     onClick={() => {
       if (!academicDate) return;
       const d = new Date(academicDate);
       d.setDate(d.getDate() - 1);
       setAcademicDate(d.toISOString().split('T')[0]);
     }}
     className="h-9 w-9 flex items-center justify-center shrink-0 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-500 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors"
   >
     <ChevronLeft size={16} />
   </button>
   <div className="relative flex-1">
     <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
     <input
       type="date"
       value={academicDate}
       onChange={(e) => setAcademicDate(e.target.value)}
       className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
     />
   </div>
   <button 
     type="button"
     onClick={() => {
       if (!academicDate) return;
       const d = new Date(academicDate);
       d.setDate(d.getDate() + 1);
       setAcademicDate(d.toISOString().split('T')[0]);
     }}
     className="h-9 w-9 flex items-center justify-center shrink-0 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-500 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors"
   >
     <ChevronRight size={16} />
   </button>
 </div>
 </div>

 <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
 <select
 value={grade}
 onChange={(e) => setGrade(e.target.value)}
 className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
 >
 {classOptions.map((g) => (
 <option key={g} value={g}>{gradeLabel(g)}</option>
 ))}
 </select>
 </div>

 <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
 <select
 value={section}
 onChange={(e) => setSection(e.target.value)}
 className={cn(
 "w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
 )}
 >
 {sectionOptions.map((s) => (
 <option key={s} value={s}>{s}</option>
 ))}
 </select>
 </div>

 <button onClick={handleReset} className="h-9 px-4 flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold shrink-0 mt-1" title="Reset Filters">
  <RotateCw size={12} /> Reset
 </button>
 </div>

 <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
 <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sort By</label>
 <select
   value={sortBy}
   onChange={(e) => setSortBy(e.target.value as any)}
   className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 appearance-none"
 >
   <option value="name">Sort by Name</option>
   <option value="admissionNumber">Sort by Admission No.</option>
 </select>
 </div>
 <div className="flex flex-col gap-1.5 w-full sm:w-[240px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search</label>
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all placeholder:text-gray-400"
 placeholder="Search students..."
 />
 </div>
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-5 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
 <div className="flex items-center gap-3">
 <h2 className="text-sm font-bold text-gray-800">Attendance Roster</h2>
 <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-gray-50 px-2 py-1 rounded border border-gray-200">
 <span className="text-gray-600">Total: {totals.total}</span>
 <div className="w-1 h-1 rounded-full bg-gray-300"></div>
 <span className="text-emerald-600">Present: {totals.present}</span>
 <div className="w-1 h-1 rounded-full bg-gray-300"></div>
 <span className="text-red-600">Absent: {totals.absent}</span>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <ExportButton data={filteredRoster} filename="Attendance" className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm" iconSize={12} />
 <button
 onClick={handleSave}
 disabled={isSaving}
 className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-70"
 >
 {isSaving ? <RotateCw size={12} className="animate-spin" /> : <Save size={12} />}
 {isSaving ? "Saving..." : "Save"}
 </button>
 </div>
 </div>

 {/* Bulk Actions */}
 {selectedCount > 0 && (
 <div className="px-4 py-2 border-b border-gray-100 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in slide-in-from-top-2">
 <div className="flex items-center gap-1.5">
 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
 {selectedCount}
 </span>
 <span className="text-xs font-bold text-blue-900">students selected</span>
 </div>
 <div className="flex flex-wrap items-center gap-1.5">
 <button
 type="button"
 onClick={() => setRoster((prev) => prev.map((r) => (selected[r.studentId] ? { ...r, status: "P" } : r)))}
 className="h-7 inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
 >
 <CheckCircle2 size={12} /> Mark Present
 </button>
 <button
 type="button"
 onClick={() => setRoster((prev) => prev.map((r) => (selected[r.studentId] ? { ...r, status: "A" } : r)))}
 className="h-7 inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
 >
 <AlertCircle size={12} /> Mark Absent
 </button>
 <div className="w-px h-3 bg-blue-200 mx-0.5"></div>
 <button 
 type="button" 
 onClick={() => setSelected({})}
 className="h-7 inline-flex items-center gap-1 rounded text-xs font-bold text-blue-700 hover:bg-blue-100/50 px-2 transition-colors"
 >
 Clear
 </button>
 </div>
 </div>
 )}

 <div className="overflow-x-auto overflow-y-visible pb-32">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-5 py-3 w-[40px]">
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={allSelectedOnPage}
 onChange={(e) => {
 const checked = e.target.checked;
 setSelected((prev) => {
 const next = { ...prev };
 filteredRoster.forEach((r) => {
 next[r.studentId] = checked;
 });
 return next;
 });
 }}
 />
 </th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Roll</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-48">Attendance</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-12"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredRoster.length > 0 ? (
 filteredRoster.map((r) => {
 const initials = r.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
 const present = r.status === "P";
 const absent = r.status === "A";
 const avatarColor = getAvatarColor(r.name);

 return (
 <tr key={r.studentId} className={cn("transition-colors group", selected[r.studentId] ? "bg-blue-50/30" : "hover:bg-gray-50/50")}>
 <td className="px-5 py-2.5">
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={Boolean(selected[r.studentId])}
 onChange={(e) => setSelected((prev) => ({ ...prev, [r.studentId]: e.target.checked }))}
 />
 </td>
 <td className="px-5 py-2.5">
 <span className="text-xs font-bold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded">{r.roll}</span>
 </td>
 <td className="px-5 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", avatarColor)}>
 {initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{r.name}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">{r.studentId}</p>
 {grade === "All" && (
 <p className="text-xs font-bold text-gray-600 mt-0.5">
 {gradeLabel(r.classId)}-{r.section}
 </p>
 )}
 </div>
 </div>
 </td>
 <td className="px-5 py-2.5">
 <div className="flex flex-col gap-1 items-center">
 <div className="flex items-center gap-1.5 p-1 bg-gray-50/50 rounded-lg border border-gray-100">
 <button
 type="button"
 onClick={() => setRoster((prev) => prev.map((x) => (x.studentId === r.studentId ? { ...x, status: "P" } : x)))}
 className={cn(
 "px-3 py-1 rounded text-xs font-bold transition-all",
 r.status === "P" ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-emerald-600"
 )}
 >
 Present
 </button>
 <button
 type="button"
 onClick={() => setRoster((prev) => prev.map((x) => (x.studentId === r.studentId ? { ...x, status: "A" } : x)))}
 className={cn(
 "px-3 py-1 rounded text-xs font-bold transition-all",
 r.status === "A" ? "bg-red-500 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-red-600"
 )}
 >
 Absent
 </button>
 </div>
 </div>
 <div className="mt-1.5 flex items-center justify-center">
 <span className={cn(
 "text-xs font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide",
 r.attendancePercent >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
 )}>
 {Math.round(r.attendancePercent)}% Overall
 </span>
 </div>
 </td>
 <td className="px-5 py-2.5">
 <input
 value={r.remarks}
 onChange={(e) => setRoster((prev) => prev.map((x) => (x.studentId === r.studentId ? { ...x, remarks: e.target.value } : x)))}
 className={cn(
 "w-full h-8 rounded-lg border px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 transition-all",
 r.status === "A" && r.remarks 
 ? "border-red-200 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-red-500/20" 
 : "border-gray-200 bg-white text-gray-800 focus:border-[#144835] hover:border-gray-300"
 )}
 placeholder={r.status === "A" ? "Reason required..." : "Optional remark..."}
 />
 </td>
 <td className="px-5 py-2.5 text-right relative">
  <div className="relative inline-block text-left"
       onMouseEnter={() => setOpenDropdownId(r.studentId)}
       onMouseLeave={() => setOpenDropdownId(null)}>
  <button 
    type="button" 
    className="h-7 w-7 inline-flex items-center justify-center text-gray-400 hover:text-[#144835] hover:bg-[#144835]/10 rounded transition-colors"
  >
  <MoreHorizontal size={14} />
  </button>
  {openDropdownId === r.studentId && (
    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] py-1.5 text-left transition-all duration-200">
      <Link href={`/schools/${schoolId}/admin/academic/students/${r.studentId}/profile?tab=Attendance`} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#144835] w-full text-left">
        <User size={14} /> View Profile
      </Link>
      <Link href={`/schools/${schoolId}/admin/academic/students/${r.studentId}/edit`} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#144835] w-full text-left">
        <Pencil size={14} /> Edit Student
      </Link>
    </div>
  )}
  </div>
  </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={6} className="px-5 py-8 text-center">
 <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 mb-3">
 <Search size={24} className="text-gray-400" />
 </div>
 <p className="text-sm font-bold text-gray-900">No students found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search query.</p>
 <button 
 onClick={() => setSearchQuery("")}
 className="mt-4 text-xs font-bold text-[#144835] hover:underline"
 >
 Clear search
 </button>
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
