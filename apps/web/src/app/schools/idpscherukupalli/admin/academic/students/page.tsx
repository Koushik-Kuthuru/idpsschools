"use client";

import Link from "next/link";
const SafeLink = Link as any;
import { useEffect, useMemo, useState } from "react";
import {
 CalendarCheck2,
 Eye,
 FileText,
 Mail,
 Pencil,
 RotateCw,
 Search,
 ShieldAlert,
 UserCheck,
 UserPlus,
 Users,
 Trash2,
 CheckCircle2,
 AlertCircle,
 X
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import ImportExcelButton from "@/components/ui/ImportExcelButton";
import SelectMenu from "@/components/ui/SelectMenu";
import TableRowActions from "@/components/ui/TableRowActions";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchStudents } from "@/hooks/useBranchStudents";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { importStudents } from "@/lib/importStudentsFromExcel";


// Define local AdminStudent type based on what we expect from the database
export interface AdminStudent {
 id: string;
 name: string;
 className: string;
 section: string;
 roll: string;
 admissionNo: string;
 status: "Active" | "Inactive";
 attendance: number;
 username: string;
 portalPassword: string;
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
  const schoolId = useSchoolId();
  const { currentYear, loading: yearLoading } = useAcademicYear();
 const allClassesKey = "all";
 const allSectionsKey = "all";
 const {
   students: branchStudents,
   classOptions,
   sectionOptions,
   loading,
   error: loadError,
   refresh: refreshStudents,
 } = useBranchStudents(schoolId, currentYear?.name);
 const [searchQuery, setSearchQuery] = useState("");
 const [classFilter, setClassFilter] = useState<string>(allClassesKey);
 const [sectionFilter, setSectionFilter] = useState<string>(allSectionsKey);
 const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
 const [selected, setSelected] = useState<Record<string, boolean>>({});

 const students = useMemo<AdminStudent[]>(
   () =>
     branchStudents.map((s) => ({
       id: s.id,
       name: s.name,
       className: s.className,
       section: s.section,
       roll: s.roll,
       admissionNo: s.admissionNo,
       status: s.status,
       attendance: 0,
       username: s.admissionNo,
       portalPassword: "—",
     })),
   [branchStudents]
 );

 const isLoading = (loading && branchStudents.length === 0) || (yearLoading && !currentYear);

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
 const matchesQuery =
 !q ||
 `${s.name} ${s.roll} ${s.admissionNo} ${s.className} ${s.section}`.toLowerCase().includes(q);
 const matchesClass = classFilter === allClassesKey || s.className === classFilter;
 const matchesSection = sectionFilter === allSectionsKey || s.section === sectionFilter;
 const matchesStatus = statusFilter === "all" || s.status === statusFilter;
 return matchesQuery && matchesClass && matchesSection && matchesStatus;
 });
 }, [classFilter, sectionFilter, searchQuery, statusFilter, students, allClassesKey, allSectionsKey]);

 const hasActiveFilters =
 searchQuery.trim() !== "" ||
 classFilter !== allClassesKey ||
 sectionFilter !== allSectionsKey ||
 statusFilter !== "all";

 const clearFilters = () => {
 setSearchQuery("");
 setClassFilter(allClassesKey);
 setSectionFilter(allSectionsKey);
 setStatusFilter("all");
 };

 const classFilterOptions = useMemo(
 () => [{ value: allClassesKey, label: "All Classes" }, ...classOptions.map((c) => ({ value: c, label: `Class ${c}` }))],
 [allClassesKey, classOptions]
 );
 const sectionFilterOptions = useMemo(
 () => [{ value: allSectionsKey, label: "All Sections" }, ...sectionOptions.map((s) => ({ value: s, label: `Section ${s}` }))],
 [allSectionsKey, sectionOptions]
 );
 const statusFilterOptions = useMemo(
 () => [
 { value: "all", label: "All Status" },
 { value: "Active", label: "Active" },
 { value: "Inactive", label: "Inactive" },
 ],
 []
 );

 const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
 const allSelectedOnPage = useMemo(() => filtered.length > 0 && filtered.every((s) => selected[s.id]), [filtered, selected]);

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}

 <AdminPageHeader
  title="Enrollment & Student Records"
  description={
   currentYear
    ? `Showing students for academic year ${currentYear.name} (${stats.total.toLocaleString()} enrolled)`
    : "Profiles, status, and quick actions across classes & sections"
  }
  actions={
   <>
 <ImportExcelButton
 label="Import Excel"
 className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors disabled:opacity-60"
 iconSize={14}
 onImport={async (rows) => {
 const count = await importStudents(schoolId, rows);
 await refreshStudents();
 alert(`Imported ${count} student${count === 1 ? "" : "s"} successfully.`);
 }}
 />
 <ExportButton
 data={filtered}
 filename="students"
 columns={[
 { header: "Name", key: "name" },
 { header: "Class", key: "className" },
 { header: "Section", key: "section" },
 { header: "Roll", key: "roll" },
 { header: "Status", key: "status" },
 { header: "Username", key: "username" },
 { header: "Password", key: "portalPassword" },
 { header: "Attendance %", key: "attendance" },
 ]}
 className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors"
 iconSize={14}
 />
 <SafeLink
 href={`/schools/${schoolId}/admin/academic/students/new`}
 className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <UserPlus size={14} /> Add Student
 </SafeLink>
   </>
  }
 />

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
 <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <Users size={20} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Students</p>
 <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.total.toLocaleString()}</p>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
 <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <UserCheck size={20} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Active</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.active.toLocaleString()}</p>
 <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
 {stats.total ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%"}
 </p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
 <ShieldAlert size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Inactive</p>
 <p className="text-xl font-extrabold text-gray-900">{stats.inactive.toLocaleString()}</p>
 <p className="text-xs font-medium text-gray-400 mt-0.5">Not currently enrolled</p>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
 <CalendarCheck2 size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Avg Attendance</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.avgAttendance}%</p>
 {stats.avgAttendance < 80 && (
 <span className="text-xs font-bold text-red-500 flex items-center bg-red-50 px-1 py-0.5 rounded"><AlertCircle size={10} className="mr-0.5"/> Low</span>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Filters */}
 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
 <div className="flex flex-wrap items-end gap-3 flex-1">
 <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
 <SelectMenu
 value={classFilter}
 onChange={setClassFilter}
 options={classFilterOptions}
 aria-label="Filter by class"
 />
 </div>

 <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
 <SelectMenu
 value={sectionFilter}
 onChange={setSectionFilter}
 options={sectionFilterOptions}
 aria-label="Filter by section"
 />
 </div>

 <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
 <SelectMenu
 value={statusFilter}
 onChange={(value) => setStatusFilter(value as typeof statusFilter)}
 options={statusFilterOptions}
 aria-label="Filter by status"
 />
 </div>

 {hasActiveFilters ? (
 <button
 type="button"
 onClick={clearFilters}
 className="h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
 >
 <RotateCw size={12} /> Reset
 </button>
 ) : null}
 </div>

 <div className="flex flex-col gap-1.5 w-full xl:w-[280px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search</label>
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-9 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
 placeholder="Name, roll no., admission no..."
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 {searchQuery ? (
 <button
 type="button"
 onClick={() => setSearchQuery("")}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
 aria-label="Clear search"
 >
 <X size={14} />
 </button>
 ) : null}
 </div>
 </div>
 </div>

 {hasActiveFilters ? (
 <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active filters</span>
 {classFilter !== allClassesKey ? (
 <button
 type="button"
 onClick={() => setClassFilter(allClassesKey)}
 className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
 >
 Class {classFilter} <X size={10} />
 </button>
 ) : null}
 {sectionFilter !== allSectionsKey ? (
 <button
 type="button"
 onClick={() => setSectionFilter(allSectionsKey)}
 className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
 >
 Section {sectionFilter} <X size={10} />
 </button>
 ) : null}
 {statusFilter !== "all" ? (
 <button
 type="button"
 onClick={() => setStatusFilter("all")}
 className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
 >
 {statusFilter} <X size={10} />
 </button>
 ) : null}
 {searchQuery.trim() ? (
 <button
 type="button"
 onClick={() => setSearchQuery("")}
 className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
 >
 &ldquo;{searchQuery.trim()}&rdquo; <X size={10} />
 </button>
 ) : null}
 </div>
 ) : null}
 </div>

 {/* Table */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <h2 className="text-sm font-bold text-gray-800 shrink-0">Student Directory</h2>
 <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
 <span className="text-gray-600">{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
 {hasActiveFilters ? (
 <>
 <span className="w-1 h-1 rounded-full bg-gray-300" />
 <span className="text-gray-500">of {students.length} total</span>
 </>
 ) : null}
 </div>
 </div>
 <p className="text-xs font-medium text-gray-500 sm:hidden">
 {filtered.length} student{filtered.length === 1 ? "" : "s"}
 {hasActiveFilters ? ` of ${students.length}` : ""}
 </p>
 </div>

 {selectedCount > 0 && (
 <div className="px-4 py-2 border-b border-gray-100 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in slide-in-from-top-2">
 <div className="flex items-center gap-1.5">
 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
 {selectedCount}
 </span>
 <span className="text-xs font-bold text-blue-900">students selected</span>
 </div>
 <div className="flex flex-wrap items-center gap-1.5">
 <button type="button" className="h-7 inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors">
 <Mail size={12} /> Message
 </button>
 <button type="button" className="h-7 inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors">
 <FileText size={12} /> Report Card
 </button>
 <div className="w-px h-3 bg-blue-200 mx-0.5"></div>
 <button type="button" className="h-7 inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
 <ShieldAlert size={12} /> Mark Inactive
 </button>
 </div>
 </div>
 )}

 <div className="overflow-x-auto">
 {isLoading ? (
 <div className="p-8 flex items-center justify-center">
 <div className="w-6 h-6 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
 </div>
 ) : (
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
 filtered.forEach((s) => {
 next[s.id] = checked;
 });
 return next;
 });
 }}
 />
 </th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Roll</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Class</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Credentials</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-36">Attendance</th>
 <th className="w-12 px-2 py-3 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filtered.length > 0 ? (
 filtered.map((s) => {
 const initials = s.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
 const active = s.status === "Active";
 const avatarColor = getAvatarColor(s.name);
 const isLowAttendance = s.attendance < 75;

 const profileHref = `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/profile`;

 return (
 <tr key={s.id} className="hover:bg-[#144835]/[0.02] transition-colors group">
 <td className="px-5 py-3">
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={Boolean(selected[s.id])}
 onChange={(e) => setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))}
 />
 </td>
 <td className="px-5 py-3">
 <span className="text-xs font-bold text-gray-800 tabular-nums">{s.roll}</span>
 </td>
 <td className="px-5 py-3">
 <div className="flex items-center gap-3 min-w-0">
 <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border shrink-0", avatarColor)}>
 {initials}
 </div>
 <div className="min-w-0">
 <SafeLink
 href={profileHref}
 className="text-xs font-bold text-gray-900 hover:text-[#144835] transition-colors truncate block"
 >
 {s.name}
 </SafeLink>
 <p className="text-xs font-medium text-gray-500 mt-0.5 truncate">
 {s.admissionNo !== "-" ? `Adm. ${s.admissionNo}` : "No admission no."}
 </p>
 </div>
 </div>
 </td>
 <td className="px-5 py-3 text-center">
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700">
 <span>{s.className}</span>
 <span className="text-gray-300">·</span>
 <span className="text-gray-500">{s.section}</span>
 </span>
 </td>
 <td className="px-5 py-3 min-w-[120px]">
  <div className="flex flex-col gap-0.5">
   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID: <span className="text-gray-900 normal-case tracking-normal">{s.username}</span></span>
   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pwd: <span className="text-gray-900 normal-case tracking-normal">{s.portalPassword}</span></span>
  </div>
 </td>
 <td className="px-5 py-3">
 <span className={cn(
 "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border",
 active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
 )}>
 {active ? <CheckCircle2 size={10}/> : <AlertCircle size={10}/>}
 {s.status}
 </span>
 </td>
 <td className="px-5 py-3">
 <div className="flex items-center gap-2.5">
 <div className="flex-1 max-w-[5rem] h-1.5 bg-gray-100 rounded-full overflow-hidden">
 <div
 className={cn("h-full rounded-full transition-all", isLowAttendance ? "bg-red-500" : "bg-emerald-500")}
 style={{ width: `${Math.min(s.attendance, 100)}%` }}
 />
 </div>
 <span className={cn("text-xs font-bold tabular-nums w-9 text-right", isLowAttendance ? "text-red-600" : "text-gray-700")}>
 {s.attendance}%
 </span>
 </div>
 </td>
 <td className="w-12 px-2 py-3 text-right">
 <TableRowActions
 items={[
 { label: "View Profile", icon: Eye, href: profileHref },
 { label: "Edit Student", icon: Pencil, href: `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/edit` },
 { label: "Attendance", icon: CalendarCheck2, href: `/schools/${schoolId}/admin/academic/attendance` },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete ${s.name}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "students", s.id),
 },
 ]}
 />
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={8} className="px-5 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={20} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No students found</p>
 <p className="text-xs text-gray-500 mt-0.5">Try adjusting your filters or search buildQuery.</p>
 <button
 type="button"
 onClick={clearFilters}
 className="mt-4 h-8 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
 >
 <RotateCw size={12} /> Clear filters
 </button>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 )}
 </div>

 <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
 <p className="text-xs font-medium text-gray-500">
 {filtered.length > 0 ? (
 <>
 Showing <span className="font-bold text-gray-900">{filtered.length}</span>
 {filtered.length === 1 ? " student" : " students"}
 {hasActiveFilters ? (
 <> matching filters · <span className="font-bold text-gray-900">{students.length}</span> total enrolled</>
 ) : null}
 </>
 ) : (
 <>No students match the current filters</>
 )}
 </p>
 {filtered.length > 0 ? (
 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">
 {filtered.filter((s) => s.status === "Active").length} active
 </span>
 ) : null}
 </div>
 </div>
 </div>
 );
}
