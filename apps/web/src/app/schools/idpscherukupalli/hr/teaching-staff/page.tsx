"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import AdminPageHeader from "@/components/admin/PageHeader";

import Link from "next/link";
const SafeLink = Link as any;

import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarX2, ChevronRight, Eye, EyeOff, Filter, Pencil, Search, Trash2, UserCheck, UserPlus, Users } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { supabase, getSchoolUuidFromSlug } from "@/lib/supabase/client";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

// Temporary interface mapped from Supabase schema
interface EmployeeRow {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  mobile: string;
  status: string;
  classes: string;
  subjects: string;
}

function staffBase(schoolId: string) {
 return `/schools/${schoolId}/admin/hr/teaching-staff`;
}

export default function AdminTeachingStaffPage() {
 const schoolId = useSchoolId();
 const [searchQuery, setSearchQuery] = useState("");
 const [deptFilter, setDeptFilter] = useState("all");
 const [statusFilter, setStatusFilter] = useState("All Status");
 const [employees, setEmployees] = useState<EmployeeRow[]>([]);
 const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
   async function loadData() {
     setLoading(true);
     setLoadError(null);
     try {
       const uuid = await getSchoolUuidFromSlug(schoolId);
       if (!uuid) throw new Error("Invalid school configuration");

       // Fetch staff profiles and join with users table
       const { data: staffData, error: staffError } = await supabase
         .from("staff_profiles")
         .select(`
           id,
           employee_id,
           designation,
           department,
           status,
           users (
             full_name,
             phone
           )
         `)
         .eq("school_id", uuid);

       if (staffError) throw staffError;

       const mapped: EmployeeRow[] = (staffData || []).map((staff: any) => ({
         id: staff.id,
         employeeId: staff.employee_id,
         name: staff.users?.full_name || "Unnamed",
         department: staff.department || "General",
         designation: staff.designation || "Staff",
         mobile: staff.users?.phone || "—",
         status: staff.status === "active" ? "Active" : "Inactive",
         classes: "—", // Requires querying teacher_subject_assignments
         subjects: "—", // Requires querying teacher_subject_assignments
       }));

       setEmployees(mapped);

       // Extract unique departments for the filter dropdown
       const depts = new Set(mapped.map(m => m.department).filter(Boolean));
       setDepartments(Array.from(depts).map(d => ({ id: d, name: d })));
       
     } catch (err: any) {
       console.error("Error loading teaching staff:", err);
       setLoadError(err.message || "Failed to load teaching staff");
     } finally {
       setLoading(false);
     }
   }
   
   loadData();
 }, [schoolId]);

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
   if (deptFilter === "all" || deptFilter === "General") return;
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
     const matchQ =
       !q ||
       e.name.toLowerCase().includes(q) ||
       e.employeeId.toLowerCase().includes(q) ||
       e.designation.toLowerCase().includes(q) ||
       e.mobile.toLowerCase().includes(q);
     const matchDept = deptFilter === "all" || e.department === deptFilter;
     const matchStatus = statusFilter === "All Status" || e.status === statusFilter;
     return matchQ && matchDept && matchStatus;
   });
 }, [searchQuery, deptFilter, statusFilter, employees]);

 const handleDelete = async (id: string) => {
   if (confirm("Delete this staff member?")) {
     const { error } = await supabase.from('staff_profiles').delete().eq('id', id);
     if (error) alert("Failed to delete");
     else setEmployees(employees.filter(e => e.id !== id));
   }
 };

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <AdminPageHeader
  title="Teaching Staff"
  description="Faculty directory, assignments, and profiles"
  actions={
   <>
 <ExportButton data={filtered} filename="Export" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <SafeLink href={`${staffBase(schoolId)}/new`} className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all">
 <UserPlus size={14} /> Add Teaching Staff
 </SafeLink>
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
 placeholder="Search name, ID, mobile, class..."
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
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee ID</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Designation</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mobile</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Classes</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Subjects</th>
 <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filtered.map((e) => (
 <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5 text-xs font-bold text-gray-700 whitespace-nowrap">{e.employeeId}</td>
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-2.5 min-w-[140px]">
 <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 border border-gray-200 shrink-0">
 {e.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
 </div>
 <p className="text-xs font-bold text-gray-900">{e.name}</p>
 </div>
 </td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{e.department}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{e.designation}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 whitespace-nowrap">{e.mobile}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 max-w-[180px] truncate" title={e.classes}>{e.classes}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 max-w-[180px] truncate" title={e.subjects}>{e.subjects}</td>
 <td className="px-4 py-2.5 text-right">
 <TableRowActions
 items={[
 { label: "View Profile", icon: Eye, href: `${staffBase(schoolId)}/${encodeURIComponent(e.id)}/profile` },
 { label: "Edit", icon: Pencil, href: `${staffBase(schoolId)}/${encodeURIComponent(e.id)}/edit` },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete ${e.name}? This cannot be undone.`,
 onClick: () => handleDelete(e.id),
 },
 ]}
 />
 </td>
 </tr>
 ))}
 {!loading && filtered.length === 0 && (
 <tr>
 <td colSpan={8} className="px-4 py-8 text-center">
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
