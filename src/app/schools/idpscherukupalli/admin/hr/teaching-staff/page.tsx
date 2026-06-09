"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarX2, ChevronRight, Download, Filter, Search, UserCheck, UserPlus, Users } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type EmployeeStatus = "Active" | "Inactive" | "On Leave";

type EmployeeRow = {
 id: string;
 name: string;
 department: string;
 position: string;
 joinedDate: string;
 status: EmployeeStatus;
};

export default function AdminTeachingStaffPage() {
 const schoolId = "idpscherukupalli";
 const [searchQuery, setSearchQuery] = useState("");
 const [deptFilter, setDeptFilter] = useState("all");
 const [statusFilter, setStatusFilter] = useState("All Status");
 const [employees, setEmployees] = useState<EmployeeRow[]>([]);
 const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 const qRef = query(collection(db, "schools", schoolId, "departments"), orderBy("name", "asc"));
 const unsubscribe = onSnapshot(
 qRef,
 (snapshot) => {
 const list = snapshot.docs.map((d) => {
 const data = d.data() as any;
 return { id: d.id, name: String(data.name || "").trim() || d.id };
 });
 setDepartments(list);
 },
 () => setDepartments([])
 );
 return () => unsubscribe();
 }, [schoolId]);

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 
 // We filter for role === "teacher" directly in the query
 const qRef = query(
 collection(db, "schools", schoolId, "teachers"),
 orderBy("firstName", "asc")
 );

 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: EmployeeRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed',
 department: String(data.departmentId || "General"),
 position: data.designation || "Teacher",
 joinedDate: data.joinDate ? new Date(data.joinDate).toLocaleDateString('en-IN') : "N/A",
 status: (data.status as EmployeeStatus) || "Active",
 };
 });
 setEmployees(list);
 setLoading(false);
 }, (err) => {
 console.error("Error loading teachers:", err);
 setLoadError("Failed to load teaching staff. Check permissions.");
 setLoading(false);
 });

 return () => unsubscribe();
 }, [schoolId]);

 const departmentNameById = useMemo(() => {
 const map: Record<string, string> = {};
 departments.forEach((d) => {
 map[d.id] = d.name;
 });
 return map;
 }, [departments]);

 const departmentOptions = useMemo(() => {
 const base = [{ id: "General", name: "General" }, ...departments];
 const seen = new Set<string>();
 return base.filter((d) => {
 if (seen.has(d.id)) return false;
 seen.add(d.id);
 return true;
 });
 }, [departments]);

 useEffect(() => {
 if (deptFilter === "all") return;
 if (deptFilter === "General") return;
 if (!departmentOptions.some((d) => d.id === deptFilter)) setDeptFilter("all");
 }, [departmentOptions, deptFilter]);

 const stats = useMemo(() => {
 const totalStaff = employees.length;
 const onLeave = employees.filter((e) => e.status === "On Leave").length;
 const active = employees.filter((e) => e.status === "Active").length;
 return { totalStaff, onLeave, active };
 }, [employees]);

 const filtered = useMemo(() => {
 const q = searchQuery.toLowerCase();
 return employees.filter((e) => {
 const matchQ = !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.position.toLowerCase().includes(q);
 const matchDept = deptFilter === "all" || e.department === deptFilter;
 const matchStatus = statusFilter === "All Status" || e.status === statusFilter;
 return matchQ && matchDept && matchStatus;
 });
 }, [searchQuery, deptFilter, statusFilter, employees]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <AdminPageHeader
  title="Teaching Staff"
  description="Faculty directory, assignments, and profiles"
  actions={
   <>
 <ExportButton data={filtered} filename="Export" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <Link href={`/schools/${schoolId}/admin/hr/teaching-staff/new`} className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all">
 <UserPlus size={14} /> Add Teaching Staff
 </Link>
   </>
  }
 />

 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <Users size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Faculty</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.totalStaff.toLocaleString()}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <UserCheck size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Faculty</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.active.toLocaleString()}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
 <CalendarX2 size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">On Leave</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.onLeave.toLocaleString()}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative w-full sm:w-[280px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 placeholder="Search name, ID or role..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>

 <div className="flex items-center gap-2">
 <div className="relative">
 <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <select
 value={deptFilter}
 onChange={(e) => setDeptFilter(e.target.value)}
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-9 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option value="all">All Departments</option>
 {departmentOptions.map((d) => (
 <option key={d.id} value={d.id}>
 {d.name}
 </option>
 ))}
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
 </div>

 <div className="relative">
 <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-9 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option>All Status</option>
 <option>Active</option>
 <option>On Leave</option>
 <option>Inactive</option>
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
 </div>
 </div>
 </div>

 <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{loading ? "Loading..." : `${filtered.length} members`}</div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee ID</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filtered.map((e) => (
 <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 border border-gray-200">
 {e.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{e.name}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">Joined: {e.joinedDate}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-gray-700">{e.id}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{e.position}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{departmentNameById[e.department] || e.department}</td>
 <td className="px-4 py-2.5">
 <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-bold border", e.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : e.status === "On Leave" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-gray-50 border-gray-200 text-gray-600")}>
 {e.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <Link href={`/schools/${schoolId}/admin/hr/teaching-staff/${encodeURIComponent(e.id)}/profile`} className="h-7 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors ">
 View
 </Link>
 </td>
 </tr>
 ))}
 {!loading && filtered.length === 0 && (
 <tr>
 <td colSpan={6} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No teaching staff found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search filters.</p>
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
