"use client";

import AdminPageHeader from "@/components/admin/PageHeader";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil, Plus, Search, Trash2, Users, UserCheck, AlertTriangle, Building2, Filter, ChevronRight, MoreHorizontal } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type DeptStatus = "Active" | "Inactive";

type DepartmentRow = {
 id: string;
 name: string;
 subtitle: string;
 hodName: string | null;
 staffCount: number;
 status: DeptStatus;
};

function statusTone(status: DeptStatus) {
 return status === "Active"
 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
 : "bg-slate-100 text-slate-700 border-slate-200";
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
 ];
 const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
 return colors[index];
}

export default function AdminDepartmentsPage() {
 const schoolId = "idpskalaburagi";
 const [searchQuery, setSearchQuery] = useState("");
 const [departments, setDepartments] = useState<DepartmentRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setLoadError(null);

 const qRef = query(
 collection(db, "schools", schoolId, "departments"),
 orderBy("name", "asc")
 );

 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: DepartmentRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 name: data.name || "Unnamed Department",
 subtitle: data.subtitle || "",
 hodName: data.hodName || null,
 staffCount: Number(data.staffCount || 0),
 status: (data.status as DeptStatus) || "Active",
 };
 });
 setDepartments(list);
 setLoading(false);
 }, (err) => {
 console.error("Error loading departments:", err);
 setLoadError("Failed to load departments. Check permissions.");
 setLoading(false);
 });

 return () => unsubscribe();
 }, [schoolId]);

 const stats = useMemo(() => {
 const totalDepartments = departments.length;
 const active = departments.filter((d) => d.status === "Active").length;
 const totalStaff = departments.reduce((sum, d) => sum + (Number.isFinite(d.staffCount) ? d.staffCount : 0), 0);
 const pendingHods = departments.filter((d) => !d.hodName).length;
 return {
 totalDepartments,
 active,
 totalStaff,
 pendingHods,
 };
 }, [departments]);

 const filtered = useMemo(() => {
 const q = searchQuery.toLowerCase();
 return departments.filter(d => !q || d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || (d.hodName && d.hodName.toLowerCase().includes(q)));
 }, [searchQuery, departments]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
  {/* Top Header */}
 <AdminPageHeader
  title="Departments"
  description="Organize faculty and staff across school departments"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 sm:w-[320px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 placeholder="Search department, ID or HOD..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 />
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <ExportButton data={filtered} filename="Export" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <Link
 href={`/schools/${schoolId}/admin/hr/departments/new`}
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <Plus size={14} /> Add Department
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
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <Building2 size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Departments</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.totalDepartments}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <UserCheck size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.active}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
 <Users size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Staff</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.totalStaff}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", stats.pendingHods > 0 ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-600")}>
 <AlertTriangle size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending HODs</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.pendingHods}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
 <h2 className="text-sm font-bold text-gray-800">Departments Directory</h2>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{filtered.length} departments</p>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Dept ID</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Department Info</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Head of Dept (HOD)</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Count</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filtered.length > 0 ? (
 filtered.map((d) => {
 const initials = d.hodName
 ? d.hodName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")
 : "NA";
 const avatarColor = d.hodName ? getAvatarColor(d.hodName) : "bg-slate-50 text-slate-400 border-slate-200";

 return (
 <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <span className="text-xs font-bold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded border border-gray-200">
 {d.id}
 </span>
 </td>
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-900">{d.name}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">{d.subtitle}</p>
 </td>
 <td className="px-4 py-2.5">
 {d.hodName ? (
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border", avatarColor)}>
 {initials}
 </div>
 <p className="text-xs font-bold text-gray-800">{d.hodName}</p>
 </div>
 ) : (
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border border-dashed", avatarColor)}>
 ?
 </div>
 <p className="text-xs font-bold text-orange-600 italic">Not Assigned</p>
 </div>
 )}
 </td>
 <td className="px-4 py-2.5">
 <span className="inline-flex items-center justify-center rounded bg-indigo-50 text-indigo-700 border border-indigo-100/50 px-2 py-0.5 text-xs font-bold">
 {d.staffCount} Staff
 </span>
 </td>
 <td className="px-4 py-2.5">
 <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-bold border", statusTone(d.status))}>
 {d.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <TableRowActions
 items={[
 { label: "View Details", icon: Eye, onClick: () => {} },
 { label: "Edit Department", icon: Pencil, onClick: () => {} },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete ${d.name}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "departments", d.id),
 },
 ]}
 />
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={6} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No departments found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search.</p>
 <button 
 onClick={() => setSearchQuery("")}
 className="mt-2 text-xs font-bold text-[#144835] hover:underline"
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
