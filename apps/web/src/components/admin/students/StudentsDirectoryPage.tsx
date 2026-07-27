"use client";

import Link from "next/link";
const SafeLink = Link as any;
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
 CalendarCheck2,
 ChevronDown,
 Columns3,
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
 AlertCircle,
 X,
 ArrowUpDown,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import ImportExcelButton from "@/components/ui/ImportExcelButton";
import SelectMenu from "@/components/ui/SelectMenu";
import TableRowActions from "@/components/ui/TableRowActions";
import { SkeletonList, SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchStudents } from "@/hooks/useBranchStudents";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { importStudents } from "@/lib/importStudentsFromExcel";
import StudentsSectionNav from "@/components/admin/students/StudentsSectionNav";
import type { StudentListCohort } from "@/lib/loadBranchStudents";
import { adminFetch } from "@/lib/adminApi";


// Define local AdminStudent type based on what we expect from the database
export interface AdminStudent {
 id: string;
 name: string;
 className: string;
 section: string;
 gender: string;
 roll: string;
 admissionNo: string;
 status: "Active" | "Inactive" | "Cancelled";
 attendance: number;
 username: string;
 portalPassword: string;
 fatherName?: string;
 motherName?: string;
 mobile?: string;
 dob?: string;
 permanentAddress?: string;
 correspondingAddress?: string;
 admissionDate?: string;
 admissionClass?: string;
 previousAcademicYear?: string;
 nsoDate?: string;
 nsoRemark?: string;
}

type ColumnId =
  | "admissionNo"
  | "student"
  | "class"
  | "section"
  | "gender"
  | "attendance"
  | "fatherName"
  | "motherName"
  | "mobile"
  | "dob"
  | "permanentAddress"
  | "correspondingAddress";

const TABLE_COLUMNS: { id: ColumnId; label: string; group: "core" | "extra" }[] = [
  { id: "admissionNo", label: "Admission No.", group: "core" },
  { id: "student", label: "Student", group: "core" },
  { id: "class", label: "Class", group: "core" },
  { id: "section", label: "Section", group: "core" },
  { id: "gender", label: "Gender", group: "core" },
  { id: "attendance", label: "Attendance", group: "core" },
  { id: "fatherName", label: "Father Name", group: "extra" },
  { id: "motherName", label: "Mother Name", group: "extra" },
  { id: "mobile", label: "Mobile (Primary)", group: "extra" },
  { id: "dob", label: "Date of Birth", group: "extra" },
  { id: "permanentAddress", label: "Permanent Address", group: "extra" },
  { id: "correspondingAddress", label: "Corresponding Address", group: "extra" },
];

const DEFAULT_VISIBLE_COLUMNS = new Set<ColumnId>([
  "admissionNo",
  "student",
  "class",
  "section",
  "gender",
  "attendance",
]);

const PROFILE_OPTIONAL_COLUMNS = new Set<ColumnId>([
  "motherName",
  "correspondingAddress",
  "fatherName",
  "dob",
  "permanentAddress",
  "mobile",
]);

function formatStudentDob(value?: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const iso = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  }
  return raw;
}

const COHORT_COPY: Record<
 StudentListCohort,
 { title: string; description: (year: string, count: number) => string; tableTitle: string }
> = {
 enrolled: {
  title: "Enrollment & Student Records",
  description: (year, count) =>
   `All ${count.toLocaleString()} students enrolled in ${year} — continuing and newly admitted (NSO students excluded)`,
  tableTitle: "All Enrolled Students",
 },
 "new-admissions": {
  title: "New Admissions",
  description: (year, count) =>
   `${count.toLocaleString()} students officially listed as new admissions for ${year}`,
  tableTitle: "New Admission Students",
 },
 nso: {
  title: "NSO — Students Who Left",
  description: (year, count) =>
   `${count.toLocaleString()} students who left the school during ${year} (official NSO list)`,
  tableTitle: "NSO Student List",
 },
 cancelled: {
  title: "Admission Cancelled",
  description: (year, count) =>
   `${count.toLocaleString()} students whose admission was cancelled for ${year}`,
  tableTitle: "Cancelled Admissions",
 },
};

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

function hasStudentProfile(studentId: string) {
 return !studentId.startsWith("nso-registry:");
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

type StudentSortKey =
 | "name-asc"
 | "name-desc"
 | "roll-asc"
 | "roll-desc"
 | "admission-asc"
 | "admission-desc";

function compareStudentField(a: string, b: string, mode: "text" | "numeric") {
 if (mode === "numeric") {
  const na = Number.parseInt(String(a).replace(/\D/g, ""), 10) || 0;
  const nb = Number.parseInt(String(b).replace(/\D/g, ""), 10) || 0;
  if (na !== nb) return na - nb;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
 }
 return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

function sortStudents(rows: AdminStudent[], sortKey: StudentSortKey) {
 const desc = sortKey.endsWith("-desc");
 const field = sortKey.split("-")[0] as "name" | "roll" | "admission";

 return [...rows].sort((a, b) => {
  let cmp = 0;
  if (field === "name") cmp = compareStudentField(a.name, b.name, "text");
  else if (field === "roll") cmp = compareStudentField(a.roll, b.roll, "numeric");
  else cmp = compareStudentField(a.admissionNo, b.admissionNo, "numeric");
  return desc ? -cmp : cmp;
 });
}

export default function StudentsDirectoryPage({ cohort = "enrolled" }: { cohort?: StudentListCohort }) {
  const schoolId = useSchoolId();
  const { currentYear, loading: yearLoading } = useAcademicYear();
 const copy = COHORT_COPY[cohort];
 const allClassesKey = "all";
 const allSectionsKey = "all";
 const {
   students: branchStudents,
   classOptions,
   sectionOptions,
   loading,
   error: loadError,
   refresh: refreshStudents,
 } = useBranchStudents(schoolId, currentYear?.name, cohort);
 const [searchQuery, setSearchQuery] = useState("");
 const [classFilter, setClassFilter] = useState<string>(allClassesKey);
 const [sectionFilter, setSectionFilter] = useState<string>(allSectionsKey);
 const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive" | "Cancelled">("all");
 const [sortKey, setSortKey] = useState<StudentSortKey>("name-asc");
 const [selected, setSelected] = useState<Record<string, boolean>>({});
 const [visibleCols, setVisibleCols] = useState<Set<ColumnId>>(() => new Set(DEFAULT_VISIBLE_COLUMNS));
 const [columnsOpen, setColumnsOpen] = useState(false);
 const [columnsMounted, setColumnsMounted] = useState(false);
 const [columnsPos, setColumnsPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
 const columnsRef = useRef<HTMLDivElement>(null);
 const columnsTriggerRef = useRef<HTMLButtonElement>(null);
 const columnsPanelRef = useRef<HTMLDivElement>(null);
 const [profileExtras, setProfileExtras] = useState<
   Record<
     string,
     {
       fatherName?: string;
       motherName?: string;
       mobile?: string;
       dob?: string;
       permanentAddress?: string;
       correspondingAddress?: string;
     }
   >
 >({});
 const [extrasLoading, setExtrasLoading] = useState(false);

 const students = useMemo<AdminStudent[]>(
   () =>
     branchStudents.map((s) => {
       const extra = profileExtras[s.id] ?? {};
       return {
         id: s.id,
         name: s.name,
         className: s.className,
         section: s.section,
         gender: s.gender,
         roll: s.roll,
         admissionNo: s.admissionNo,
         status: s.status,
         attendance: 0,
         username: s.admissionNo,
         portalPassword: "—",
         fatherName: extra.fatherName || s.fatherName || "—",
         motherName: extra.motherName || s.motherName || "—",
         mobile: extra.mobile || s.parentPhone || "—",
         dob: extra.dob || s.dob || "",
         permanentAddress: extra.permanentAddress || s.permanentAddress || "—",
         correspondingAddress: extra.correspondingAddress || s.correspondingAddress || "—",
         admissionDate: s.admissionDate,
         admissionClass: s.admissionClass,
         previousAcademicYear: s.previousAcademicYear,
         nsoDate: s.nsoDate,
         nsoRemark: s.nsoRemark,
       };
     }),
   [branchStudents, profileExtras]
 );

 const needsProfileExtras = useMemo(
   () => [...visibleCols].some((id) => PROFILE_OPTIONAL_COLUMNS.has(id)),
   [visibleCols]
 );

 useEffect(() => {
   setColumnsMounted(true);
 }, []);

 const updateColumnsPosition = () => {
   const trigger = columnsTriggerRef.current;
   if (!trigger) return;
   const rect = trigger.getBoundingClientRect();
   const panelWidth = 240;
   const gap = 8;
   const padding = 12;
   const left = Math.max(padding, Math.min(rect.left - panelWidth - gap, window.innerWidth - panelWidth - padding));
   const top = Math.max(padding, Math.min(rect.top, window.innerHeight - padding - 120));
   const maxHeight = Math.max(160, Math.min(window.innerHeight - top - padding, window.innerHeight * 0.7, 28 * 16));
   setColumnsPos({ top, left, maxHeight });
 };

 useLayoutEffect(() => {
   if (!columnsOpen) {
     setColumnsPos(null);
     return;
   }
   updateColumnsPosition();
   const onReposition = () => updateColumnsPosition();
   window.addEventListener("resize", onReposition);
   window.addEventListener("scroll", onReposition, true);
   return () => {
     window.removeEventListener("resize", onReposition);
     window.removeEventListener("scroll", onReposition, true);
   };
 }, [columnsOpen]);

 useEffect(() => {
   if (!columnsOpen) return;
   const onPointerDown = (e: PointerEvent) => {
     const target = e.target as Node;
     if (columnsRef.current?.contains(target) || columnsPanelRef.current?.contains(target)) return;
     setColumnsOpen(false);
   };
   const onKeyDown = (e: KeyboardEvent) => {
     if (e.key === "Escape") setColumnsOpen(false);
   };
   document.addEventListener("pointerdown", onPointerDown);
   document.addEventListener("keydown", onKeyDown);
   return () => {
     document.removeEventListener("pointerdown", onPointerDown);
     document.removeEventListener("keydown", onKeyDown);
   };
 }, [columnsOpen]);

 const branchStudentIdsKey = useMemo(
   () => branchStudents.map((s) => s.id).join("|"),
   [branchStudents]
 );

 useEffect(() => {
   setProfileExtras({});
 }, [schoolId, currentYear?.name, cohort]);

 useEffect(() => {
   if (!needsProfileExtras || !schoolId || !branchStudentIdsKey) {
     return;
   }

   let cancelled = false;
   const ids = branchStudentIdsKey.split("|").filter(hasStudentProfile);
   if (!ids.length) return;

   const load = async () => {
     setExtrasLoading(true);
     try {
       const merged: Record<
         string,
         {
           fatherName?: string;
           motherName?: string;
           mobile?: string;
           dob?: string;
           permanentAddress?: string;
           correspondingAddress?: string;
         }
       > = {};
       const chunkSize = 500;
       for (let i = 0; i < ids.length; i += chunkSize) {
         const chunk = ids.slice(i, i + chunkSize);
         const res = await adminFetch("/api/admin/students/report-fields", {
           method: "POST",
           body: JSON.stringify({
             schoolId,
             academicYear: currentYear?.name ?? null,
             studentIds: chunk,
           }),
         });
         const data = await res.json().catch(() => ({}));
         if (!res.ok) continue;
         const profiles = (data.profiles ?? {}) as Record<
           string,
           {
             fatherName?: string;
             motherName?: string;
             phone?: string;
             dob?: string;
             address?: string;
             corrAddress?: string;
           }
         >;
         for (const [id, profile] of Object.entries(profiles)) {
           merged[id] = {
             fatherName: profile.fatherName,
             motherName: profile.motherName,
             mobile: profile.phone,
             dob: profile.dob,
             permanentAddress: profile.address,
             correspondingAddress: profile.corrAddress,
           };
         }
       }
       if (!cancelled) setProfileExtras(merged);
     } finally {
       if (!cancelled) setExtrasLoading(false);
     }
   };

   void load();
   return () => {
     cancelled = true;
   };
 }, [needsProfileExtras, schoolId, currentYear?.name, branchStudentIdsKey, cohort]);

 const toggleColumn = (id: ColumnId) => {
   setVisibleCols((prev) => {
     const next = new Set(prev);
     if (next.has(id)) {
       // Keep at least one data column visible.
       if (next.size <= 1) return prev;
       next.delete(id);
     } else {
       next.add(id);
     }
     return next;
   });
 };

 const showCol = (id: ColumnId) => visibleCols.has(id);
 const visibleColCount = visibleCols.size;
 const extraColCount = [...visibleCols].filter((id) => !DEFAULT_VISIBLE_COLUMNS.has(id)).length;
 const tableColSpan = 2 + visibleColCount;
 const compactTable = visibleColCount >= 8;
 const cellX = compactTable ? "px-2.5" : "px-5";
 const cellY = compactTable ? "py-2" : "py-3";
 const cellPad = `${cellX} ${cellY}`;
 const headClass = cn(
  cellPad,
  "text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider align-middle"
 );

 const columnWidths = useMemo(() => {
  const widths: Partial<Record<ColumnId | "checkbox" | "actions", string>> = {
   checkbox: compactTable ? "32px" : "40px",
   actions: compactTable ? "40px" : "48px",
  };
  const flexible: ColumnId[] = [];
  (["admissionNo", "student", "class", "section", "gender", "fatherName", "motherName", "mobile", "dob", "permanentAddress", "correspondingAddress", "attendance"] as ColumnId[]).forEach((id) => {
   if (!visibleCols.has(id)) return;
   if (id === "admissionNo") widths[id] = compactTable ? "7%" : "9%";
   else if (id === "student") widths[id] = compactTable ? "14%" : "18%";
   else if (id === "class" || id === "section" || id === "gender") widths[id] = compactTable ? "6%" : "8%";
   else if (id === "mobile" || id === "dob") widths[id] = compactTable ? "8%" : "9%";
   else if (id === "attendance") widths[id] = compactTable ? "9%" : "11%";
   else if (id === "permanentAddress" || id === "correspondingAddress") widths[id] = compactTable ? "12%" : "14%";
   else flexible.push(id);
  });
  const remaining = Math.max(8, Math.floor(40 / Math.max(flexible.length, 1)));
  flexible.forEach((id) => {
   widths[id] = `${remaining}%`;
  });
  return widths;
 }, [visibleCols, compactTable]);

 const exportColumns = useMemo(() => {
   const cols: { header: string; key: string }[] = [];
   if (showCol("admissionNo")) cols.push({ header: "Admission No.", key: "admissionNo" });
   if (showCol("student")) cols.push({ header: "Name", key: "name" });
   if (showCol("class")) cols.push({ header: "Class", key: "className" });
   if (showCol("section")) cols.push({ header: "Section", key: "section" });
   if (showCol("gender")) cols.push({ header: "Gender", key: "gender" });
   if (showCol("fatherName")) cols.push({ header: "Father Name", key: "fatherName" });
   if (showCol("motherName")) cols.push({ header: "Mother Name", key: "motherName" });
   if (showCol("mobile")) cols.push({ header: "Mobile", key: "mobile" });
   if (showCol("dob")) cols.push({ header: "DOB", key: "dob" });
   if (showCol("permanentAddress")) cols.push({ header: "Permanent Address", key: "permanentAddress" });
   if (showCol("correspondingAddress")) {
     cols.push({ header: "Corresponding Address", key: "correspondingAddress" });
   }
   if (showCol("attendance")) cols.push({ header: "Attendance %", key: "attendance" });
   cols.push({ header: "Roll", key: "roll" });
   return cols;
 }, [visibleCols]);

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

 const sortedFiltered = useMemo(() => sortStudents(filtered, sortKey), [filtered, sortKey]);

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
 { value: "Cancelled", label: "Cancelled" },
 ],
 []
 );
 const sortOptions = useMemo(
 () => [
 { value: "name-asc", label: "Name (A → Z)" },
 { value: "name-desc", label: "Name (Z → A)" },
 { value: "roll-asc", label: "Roll No. (Low → High)" },
 { value: "roll-desc", label: "Roll No. (High → Low)" },
 { value: "admission-asc", label: "Admission No. (Low → High)" },
 { value: "admission-desc", label: "Admission No. (High → Low)" },
 ],
 []
 );

 const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
 const allSelectedOnPage = useMemo(() => sortedFiltered.length > 0 && sortedFiltered.every((s) => selected[s.id]), [sortedFiltered, selected]);

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}

 <AdminPageHeader
  title={copy.title}
  description={
   currentYear
    ? copy.description(currentYear.name, stats.total)
    : cohort === "nso"
      ? "Students who left the school (not enrolled in the selected year)"
      : "Profiles, status, and quick actions across classes & sections"
  }
  actions={
   <>
 {cohort === "enrolled" ? (
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
 <SafeLink
 href={`/schools/${schoolId}/admin/academic/students/new`}
 className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <UserPlus size={14} /> Add Student
 </SafeLink>
   </>
 ) : null}
   </>
  }
 />

 <StudentsSectionNav schoolId={schoolId} active={cohort} />

 {/* KPI Cards */}
 <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
 <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-transform hover:-translate-y-1 duration-300">
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
<div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[140px]">
<label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
<SelectMenu
value={classFilter}
onChange={setClassFilter}
options={classFilterOptions}
aria-label="Filter by class"
/>
</div>

<div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[120px]">
<label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
<SelectMenu
value={sectionFilter}
onChange={setSectionFilter}
options={sectionFilterOptions}
aria-label="Filter by section"
/>
</div>

<div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[120px]">
<label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
 <SelectMenu
 value={statusFilter}
 onChange={(value) => setStatusFilter(value as typeof statusFilter)}
 options={statusFilterOptions}
 aria-label="Filter by status"
 />
 </div>

 <div className="relative shrink-0 self-end">
 <ArrowUpDown
 size={16}
 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
 aria-hidden
 />
 <select
 value={sortKey}
 onChange={(e) => setSortKey(e.target.value as StudentSortKey)}
 className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-50/50 text-transparent appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] hover:bg-gray-50 transition-all"
 aria-label="Sort students"
 title="Sort students"
 >
 {sortOptions.map((option) => (
 <option key={option.value} value={option.value} className="text-gray-900">
 {option.label}
 </option>
 ))}
 </select>
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

<div className="flex flex-col gap-1.5 w-full xl:w-[280px] order-first xl:order-none">
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
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-0">
 <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <h2 className="text-sm font-bold text-gray-800 shrink-0">{copy.tableTitle}</h2>
 <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
 <span className="text-gray-600">{sortedFiltered.length} result{sortedFiltered.length === 1 ? "" : "s"}</span>
 {hasActiveFilters ? (
 <>
 <span className="w-1 h-1 rounded-full bg-gray-300" />
 <span className="text-gray-500">of {students.length} total</span>
 </>
 ) : null}
 {extrasLoading ? (
 <>
 <span className="w-1 h-1 rounded-full bg-gray-300" />
 <span className="text-[#144835]">Loading columns…</span>
 </>
 ) : null}
 </div>
 </div>
 <div className="flex items-center justify-between gap-3 sm:justify-end">
 <p className="text-xs font-medium text-gray-500 sm:hidden">
 {sortedFiltered.length} student{sortedFiltered.length === 1 ? "" : "s"}
 {hasActiveFilters ? ` of ${students.length}` : ""}
 </p>
 <div className="flex items-center gap-2">
 <div className="relative" ref={columnsRef}>
 <button
 ref={columnsTriggerRef}
 type="button"
 onClick={() =>
 setColumnsOpen((open) => {
 const next = !open;
 if (next) requestAnimationFrame(() => updateColumnsPosition());
 return next;
 })
 }
 className={cn(
 "h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-sm transition-colors whitespace-nowrap",
 columnsOpen || extraColCount > 0
 ? "border-[#144835]/30 bg-[#144835]/5 text-[#144835]"
 : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
 )}
 >
 <Columns3 size={14} />
 Columns
 {extraColCount > 0 ? (
 <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#144835] px-1 text-[9px] font-extrabold text-white">
 {extraColCount}
 </span>
 ) : null}
 <ChevronDown size={14} className={cn("transition-transform", columnsOpen && "rotate-180")} />
 </button>
 {columnsMounted && columnsOpen && columnsPos
 ? createPortal(
 <div
 ref={columnsPanelRef}
 style={{
 position: "fixed",
 top: columnsPos.top,
 left: columnsPos.left,
 maxHeight: columnsPos.maxHeight,
 }}
 className="z-[9999] w-60 overflow-y-auto rounded-xl border border-gray-100 bg-white p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-right-2 duration-200"
 >
 <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
 Table columns
 </p>
 {TABLE_COLUMNS.filter((col) => col.group === "core").map((col) => (
 <label
 key={col.id}
 className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
 >
 <input
 type="checkbox"
 checked={visibleCols.has(col.id)}
 onChange={() => toggleColumn(col.id)}
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
 />
 {col.label}
 </label>
 ))}
 <div className="my-1 border-t border-gray-100" />
 <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
 Extra fields
 </p>
 {TABLE_COLUMNS.filter((col) => col.group === "extra").map((col) => (
 <label
 key={col.id}
 className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
 >
 <input
 type="checkbox"
 checked={visibleCols.has(col.id)}
 onChange={() => toggleColumn(col.id)}
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
 />
 {col.label}
 </label>
 ))}
 </div>,
 document.body
 )
 : null}
 </div>
 <ExportButton
 data={sortedFiltered}
 filename="students"
 columns={exportColumns}
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors"
 iconSize={14}
 />
 </div>
 </div>
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

 <div className="hidden lg:block w-full min-w-0 overflow-x-auto">
 {isLoading ? (
 <SkeletonTable rows={8} columns={2 + visibleColCount} showHeader={false} className="rounded-none border-0" />
 ) : (
 <table className="w-full table-fixed text-left border-collapse">
 <colgroup>
 <col style={{ width: columnWidths.checkbox }} />
 {showCol("admissionNo") ? <col style={{ width: columnWidths.admissionNo }} /> : null}
 {showCol("student") ? <col style={{ width: columnWidths.student }} /> : null}
 {showCol("class") ? <col style={{ width: columnWidths.class }} /> : null}
 {showCol("section") ? <col style={{ width: columnWidths.section }} /> : null}
 {showCol("gender") ? <col style={{ width: columnWidths.gender }} /> : null}
 {showCol("fatherName") ? <col style={{ width: columnWidths.fatherName }} /> : null}
 {showCol("motherName") ? <col style={{ width: columnWidths.motherName }} /> : null}
 {showCol("mobile") ? <col style={{ width: columnWidths.mobile }} /> : null}
 {showCol("dob") ? <col style={{ width: columnWidths.dob }} /> : null}
 {showCol("permanentAddress") ? <col style={{ width: columnWidths.permanentAddress }} /> : null}
 {showCol("correspondingAddress") ? <col style={{ width: columnWidths.correspondingAddress }} /> : null}
 {showCol("attendance") ? <col style={{ width: columnWidths.attendance }} /> : null}
 <col style={{ width: columnWidths.actions }} />
 </colgroup>
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className={cn(cellPad, "w-10")}>
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={allSelectedOnPage}
 onChange={(e) => {
 const checked = e.target.checked;
 setSelected((prev) => {
 const next = { ...prev };
 sortedFiltered.forEach((s) => {
 next[s.id] = checked;
 });
 return next;
 });
 }}
 />
 </th>
 {showCol("admissionNo") ? (
 <th className={cn(headClass, "text-center")}>Admission No.</th>
 ) : null}
 {showCol("student") ? (
 <th className={headClass}>Student</th>
 ) : null}
 {showCol("class") ? (
 <th className={cn(headClass, "text-center")}>Class</th>
 ) : null}
 {showCol("section") ? (
 <th className={cn(headClass, "text-center")}>Section</th>
 ) : null}
 {showCol("gender") ? (
 <th className={cn(headClass, "text-center")}>Gender</th>
 ) : null}
 {showCol("fatherName") ? (
 <th className={headClass}>Father Name</th>
 ) : null}
 {showCol("motherName") ? (
 <th className={headClass}>Mother Name</th>
 ) : null}
 {showCol("mobile") ? (
 <th className={cn(headClass, "text-center")}>Mobile</th>
 ) : null}
 {showCol("dob") ? (
 <th className={cn(headClass, "text-center")}>DOB</th>
 ) : null}
 {showCol("permanentAddress") ? (
 <th className={headClass}>Permanent Address</th>
 ) : null}
 {showCol("correspondingAddress") ? (
 <th className={headClass}>Corresponding Address</th>
 ) : null}
 {showCol("attendance") ? (
 <th className={cn(headClass, "text-center")}>Attendance</th>
 ) : null}
 <th className={cn(cellPad, "text-right")} aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {sortedFiltered.length > 0 ? (
 sortedFiltered.map((s) => {
 const initials = s.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
 const avatarColor = getAvatarColor(s.name);
 const isLowAttendance = s.attendance < 75;
 const admissionNo = s.admissionNo && s.admissionNo !== "-" ? s.admissionNo : "—";
 const metaBits = [
 s.roll && s.roll !== "-" ? `Roll ${s.roll}` : null,
 cohort === "new-admissions" && s.admissionDate ? `Admitted ${s.admissionDate}` : null,
 cohort === "nso" && s.nsoDate ? `NSO ${s.nsoDate}` : null,
 cohort === "nso" && s.nsoRemark ? s.nsoRemark : null,
 cohort === "nso" && s.previousAcademicYear ? `Last year ${s.previousAcademicYear}` : null,
 cohort === "cancelled" ? "Admission cancelled" : null,
 ].filter(Boolean);

 const profileHref = `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/profile`;
 const canOpenProfile = hasStudentProfile(s.id);

 return (
 <tr key={s.id} className="hover:bg-[#144835]/[0.02] transition-colors group">
 <td className={cellPad}>
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={Boolean(selected[s.id])}
 onChange={(e) => setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))}
 />
 </td>
 {showCol("admissionNo") ? (
 <td className={cn(cellPad, "text-center align-middle")}>
 <span className="block truncate text-xs font-bold text-gray-900 tabular-nums" title={admissionNo}>
 {admissionNo}
 </span>
 </td>
 ) : null}
 {showCol("student") ? (
 <td className={cn(cellPad, "align-middle min-w-0")}>
 <div className="flex items-center gap-2 min-w-0">
 {!compactTable ? (
 <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border shrink-0", avatarColor)}>
 {initials}
 </div>
 ) : (
 <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0", avatarColor)}>
 {initials}
 </div>
 )}
 <div className="min-w-0 flex-1">
 {canOpenProfile ? (
 <SafeLink
 href={profileHref}
 className="text-xs font-bold text-gray-900 hover:text-[#144835] transition-colors truncate block"
 title={s.name}
 >
 {s.name}
 </SafeLink>
 ) : (
 <span className="text-xs font-bold text-gray-900 truncate block" title={s.name}>{s.name}</span>
 )}
 {!compactTable && metaBits.length > 0 ? (
 <p className="text-xs font-medium text-gray-500 mt-0.5 truncate">{metaBits.join(" · ")}</p>
 ) : null}
 </div>
 </div>
 </td>
 ) : null}
 {showCol("class") ? (
 <td className={cn(cellPad, "text-center align-middle")}>
 <span className="block truncate text-xs font-bold text-gray-900" title={s.className || "—"}>
 {s.className || "—"}
 </span>
 </td>
 ) : null}
 {showCol("section") ? (
 <td className={cn(cellPad, "text-center align-middle")}>
 <span className="block truncate text-xs font-semibold text-gray-700" title={s.section && s.section !== "-" ? s.section : "—"}>
 {s.section && s.section !== "-" ? s.section : "—"}
 </span>
 </td>
 ) : null}
 {showCol("gender") ? (
 <td className={cn(cellPad, "text-center align-middle")}>
 <span className="block truncate text-xs font-semibold text-gray-700">{s.gender || "—"}</span>
 </td>
 ) : null}
 {showCol("fatherName") ? (
 <td className={cn(cellPad, "align-middle min-w-0")}>
 <span className="block truncate text-xs font-semibold text-gray-800" title={s.fatherName || "—"}>
 {s.fatherName || "—"}
 </span>
 </td>
 ) : null}
 {showCol("motherName") ? (
 <td className={cn(cellPad, "align-middle min-w-0")}>
 <span className="block truncate text-xs font-semibold text-gray-800" title={s.motherName || "—"}>
 {s.motherName || "—"}
 </span>
 </td>
 ) : null}
 {showCol("mobile") ? (
 <td className={cn(cellPad, "text-center align-middle")}>
 <span className="block truncate text-xs font-semibold text-gray-800 tabular-nums" title={s.mobile || "—"}>
 {s.mobile || "—"}
 </span>
 </td>
 ) : null}
 {showCol("dob") ? (
 <td className={cn(cellPad, "text-center align-middle")}>
 <span className="block truncate text-xs font-semibold text-gray-800 tabular-nums">
 {formatStudentDob(s.dob)}
 </span>
 </td>
 ) : null}
 {showCol("permanentAddress") ? (
 <td className={cn(cellPad, "align-middle min-w-0")}>
 <span className="block truncate text-xs font-medium text-gray-700" title={s.permanentAddress || "—"}>
 {s.permanentAddress || "—"}
 </span>
 </td>
 ) : null}
 {showCol("correspondingAddress") ? (
 <td className={cn(cellPad, "align-middle min-w-0")}>
 <span className="block truncate text-xs font-medium text-gray-700" title={s.correspondingAddress || "—"}>
 {s.correspondingAddress || "—"}
 </span>
 </td>
 ) : null}
 {showCol("attendance") ? (
 <td className={cn(cellPad, "text-center align-middle")}>
 <div className="inline-flex items-center justify-center gap-1.5 max-w-full">
 {!compactTable ? (
 <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink min-w-0">
 <div
 className={cn("h-full rounded-full transition-all", isLowAttendance ? "bg-red-500" : "bg-emerald-500")}
 style={{ width: `${Math.min(s.attendance, 100)}%` }}
 />
 </div>
 ) : null}
 <span className={cn("text-xs font-bold tabular-nums", isLowAttendance ? "text-red-600" : "text-gray-700")}>
 {s.attendance}%
 </span>
 </div>
 </td>
 ) : null}
 <td className={cn(cellPad, "text-right")}>
 <TableRowActions
 items={[
 ...(canOpenProfile
   ? [
       { label: "View Profile", icon: Eye, href: profileHref },
       {
         label: "Edit Student",
         icon: Pencil,
         href: `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/edit`,
       },
     ]
   : []),
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
 <td colSpan={tableColSpan} className="px-5 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={20} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No students found</p>
 <p className="text-xs text-gray-500 mt-0.5">Try adjusting your filters or search query.</p>
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

 {/* Mobile cards */}
 <div className="lg:hidden">
 {isLoading ? (
 <SkeletonList rows={6} />
 ) : sortedFiltered.length > 0 ? (
 <ul className="divide-y divide-gray-100">
 {sortedFiltered.map((s) => {
 const initials = s.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
 const active = s.status === "Active";
 const avatarColor = getAvatarColor(s.name);
 const isLowAttendance = s.attendance < 75;
 const profileHref = `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/profile`;
 const canOpenProfile = hasStudentProfile(s.id);
 return (
<li key={s.id} className="px-4 py-3">
<div className="flex items-center gap-3">
<input
type="checkbox"
className="h-4 w-4 rounded border-gray-300 text-[#144835] focus:ring-[#144835] shrink-0 cursor-pointer"
checked={Boolean(selected[s.id])}
onChange={(e) => setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))}
aria-label={`Select ${s.name}`}
/>
<div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border shrink-0", avatarColor)}>
{initials}
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center gap-1.5 min-w-0">
<span
className={cn(
  "h-2 w-2 rounded-full shrink-0",
  s.status === "Active" ? "bg-emerald-500" : s.status === "Cancelled" ? "bg-rose-500" : "bg-red-500"
)}
title={s.status}
/>
{canOpenProfile ? (
<SafeLink
href={profileHref}
className="text-sm font-bold text-gray-900 hover:text-[#144835] transition-colors truncate"
>
{s.name}
</SafeLink>
) : (
<span className="text-sm font-bold text-gray-900 truncate">{s.name}</span>
)}
</div>
<p className="text-xs font-medium text-gray-500 mt-0.5 truncate">
{s.admissionNo && s.admissionNo !== "-" ? `Adm. ${s.admissionNo}` : "No admission no."}
{" · "}
{s.className}-{s.section}
{s.gender ? ` · ${s.gender}` : ""}
{cohort === "nso" && s.nsoRemark ? ` · ${s.nsoRemark}` : ""}
{cohort === "nso" && s.previousAcademicYear ? ` · Last ${s.previousAcademicYear}` : ""}
</p>
</div>
<span className={cn("text-xs font-bold tabular-nums shrink-0", isLowAttendance ? "text-red-600" : "text-gray-600")}>
{s.attendance}%
</span>
<div className="shrink-0 -mr-1">
<TableRowActions
items={[
...(canOpenProfile
  ? [
      { label: "View Profile", icon: Eye, href: profileHref },
      {
        label: "Edit Student",
        icon: Pencil,
        href: `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/edit`,
      },
    ]
  : []),
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
</div>
</div>
</li>
 );
 })}
 </ul>
 ) : (
 <div className="px-5 py-10 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={20} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No students found</p>
 <p className="text-xs text-gray-500 mt-0.5">Try adjusting your filters or search.</p>
 <button
 type="button"
 onClick={clearFilters}
 className="mt-4 h-8 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
 >
 <RotateCw size={12} /> Clear filters
 </button>
 </div>
 )}
 </div>

 <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
 <p className="text-xs font-medium text-gray-500">
 {sortedFiltered.length > 0 ? (
 <>
 Showing <span className="font-bold text-gray-900">{sortedFiltered.length}</span>
 {sortedFiltered.length === 1 ? " student" : " students"}
 {hasActiveFilters ? (
 <> matching filters · <span className="font-bold text-gray-900">{students.length}</span> total enrolled</>
 ) : null}
 </>
 ) : (
 <>No students match the current filters</>
 )}
 </p>
 {sortedFiltered.length > 0 ? (
 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">
 {sortedFiltered.filter((s) => s.status === "Active").length} active
 </span>
 ) : null}
 </div>
 </div>
 </div>
 );
}
