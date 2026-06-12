"use client";

import AdminPageHeader from "@/components/admin/PageHeader";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, ChevronRight, Clock, Download, Filter, Mail, PieChart, Plus, Search, X, CheckCircle2, AlertCircle , Trash2} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, doc, onSnapshot, orderBy, query as fsQuery, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveRequest = {
 id: string;
 employeeId: string;
 employeeName: string;
 employeeType?: "teacher" | "staff";
 departmentId?: string;
 designation?: string;
 type: string;
 from: string;
 to: string;
 days?: number;
 status: LeaveStatus;
};

function dayCount(from: string, to: string) {
 const start = new Date(`${from}T00:00:00`);
 const end = new Date(`${to}T00:00:00`);
 if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
 const ms = end.getTime() - start.getTime();
 const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
 return days > 0 ? days : undefined;
}

function statusTone(status: LeaveStatus) {
 if (status === "Approved") return "bg-emerald-50 text-emerald-800 border-emerald-200";
 if (status === "Rejected") return "bg-rose-50 text-rose-800 border-rose-200";
 return "bg-amber-50 text-amber-800 border-amber-200";
}

function getAvatarColor(name: string) {
 const colors = [
 "bg-red-100 text-red-700", "bg-orange-100 text-orange-700", 
 "bg-amber-100 text-amber-700", "bg-green-100 text-green-700", 
 "bg-emerald-100 text-emerald-700", "bg-teal-100 text-teal-700", 
 "bg-cyan-100 text-cyan-700", "bg-blue-100 text-blue-700", 
 "bg-indigo-100 text-indigo-700", "bg-violet-100 text-violet-700", 
 "bg-purple-100 text-purple-700", "bg-fuchsia-100 text-fuchsia-700", 
 "bg-pink-100 text-pink-700", "bg-rose-100 text-rose-700",
 ];
 const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
 return colors[index];
}

export default function AdminLeavesPage() {
 const schoolId = "idpscherukupalli";
 const [query, setQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState("All Status");
 const [typeFilter, setTypeFilter] = useState("Leave Type");
 const [requests, setRequests] = useState<LeaveRequest[]>([]);
 const [employees, setEmployees] = useState<Array<{ id: string; name: string; type: "teacher" | "staff"; departmentId?: string; designation?: string }>>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 setLoadError(null);

 const teacherQ = fsQuery(collection(db, "schools", schoolId, "teachers"), orderBy("firstName", "asc"));
 const staffQ = fsQuery(collection(db, "schools", schoolId, "staff"), orderBy("firstName", "asc"));

 const unsubTeachers = onSnapshot(
 teacherQ,
 (snap) => {
 setEmployees((prev) => {
 const keepStaff = prev.filter((p) => p.type === "staff");
 const nextTeachers = snap.docs.map((d) => {
 const data = d.data() as any;
 const name = `${String(data.firstName || "").trim()} ${String(data.lastName || "").trim()}`.trim() || "Unnamed";
 return { id: d.id, name, type: "teacher" as const, departmentId: String(data.departmentId || "General"), designation: String(data.designation || "Teacher") };
 });
 return [...keepStaff, ...nextTeachers];
 });
 },
 () => setEmployees((prev) => prev.filter((p) => p.type === "staff"))
 );

 const unsubStaff = onSnapshot(
 staffQ,
 (snap) => {
 setEmployees((prev) => {
 const keepTeachers = prev.filter((p) => p.type === "teacher");
 const nextStaff = snap.docs.map((d) => {
 const data = d.data() as any;
 const name = `${String(data.firstName || "").trim()} ${String(data.lastName || "").trim()}`.trim() || "Unnamed";
 return { id: d.id, name, type: "staff" as const, departmentId: String(data.departmentId || "General"), designation: String(data.designation || "Staff") };
 });
 return [...keepTeachers, ...nextStaff];
 });
 },
 () => setEmployees((prev) => prev.filter((p) => p.type === "teacher"))
 );

 const leavesQ = fsQuery(collection(db, "schools", schoolId, "leaves"), orderBy("createdAt", "desc"));
 const unsubLeaves = onSnapshot(
 leavesQ,
 (snapshot) => {
 const mapped: LeaveRequest[] = snapshot.docs.map((d) => {
 const data = d.data() as any;
 return {
 id: d.id,
 employeeId: String(data.employeeId || ""),
 employeeName: String(data.employeeName || ""),
 employeeType: data.employeeType === "teacher" || data.employeeType === "staff" ? data.employeeType : undefined,
 departmentId: data.departmentId ? String(data.departmentId) : undefined,
 designation: data.designation ? String(data.designation) : undefined,
 type: String(data.type || ""),
 from: String(data.from || ""),
 to: String(data.to || ""),
 days: data.days !== undefined ? Number(data.days) : undefined,
 status: (String(data.status || "Pending") as LeaveStatus),
 };
 });
 setRequests(mapped);
 setLoading(false);
 },
 (err) => {
 setRequests([]);
 setLoadError(err?.message || "Failed to load leave requests");
 setLoading(false);
 }
 );

 return () => {
 unsubTeachers();
 unsubStaff();
 unsubLeaves();
 };
 }, [schoolId]);

 const employeeById = useMemo(() => {
 const map: Record<string, { name: string; departmentId?: string; designation?: string; type: "teacher" | "staff" }> = {};
 employees.forEach((e) => {
 map[e.id] = e;
 });
 return map;
 }, [employees]);

 const requestsWithEmployee = useMemo(() => {
 return requests.map((r) => {
 const emp = employeeById[r.employeeId];
 return {
 ...r,
 employeeName: r.employeeName || emp?.name || "Unknown",
 employeeType: r.employeeType || emp?.type,
 departmentId: r.departmentId || emp?.departmentId,
 designation: r.designation || emp?.designation,
 days: r.days ?? (r.from && r.to ? dayCount(r.from, r.to) : undefined),
 };
 });
 }, [employeeById, requests]);

 const updateStatus = async (id: string, status: LeaveStatus) => {
 try {
 setLoadError(null);
 await updateDoc(doc(db, "schools", schoolId, "leaves", id), { status, updatedAt: new Date() });
 } catch (e: any) {
 setLoadError(e?.message || "Failed to update leave request");
 }
 };

 const stats = useMemo(() => {
 const pending = requestsWithEmployee.filter((r) => r.status === "Pending").length;
 const approved = requestsWithEmployee.filter((r) => r.status === "Approved").length;
 const rejected = requestsWithEmployee.filter((r) => r.status === "Rejected").length;
 return {
 pending,
 approved,
 rejected,
 total: requestsWithEmployee.length,
 };
 }, [requestsWithEmployee]);

 const filteredRequests = useMemo(() => {
 const q = query.toLowerCase();
 return requestsWithEmployee.filter((r) => {
 const matchQ = !q || r.employeeName.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q);
 const matchStatus = statusFilter === "All Status" || r.status === statusFilter;
 const matchType = typeFilter === "Leave Type" || r.type === typeFilter;
 return matchQ && matchStatus && matchType;
 });
 }, [query, statusFilter, typeFilter, requestsWithEmployee]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
  {/* Top Header */}
 <AdminPageHeader
  title="Leave Management"
  description="Review, approve, and track staff leave requests"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 sm:w-[280px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 placeholder="Search employee, ID..."
 value={query}
 onChange={e => setQuery(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
 <select 
 value={statusFilter}
 onChange={e => setStatusFilter(e.target.value)}
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-4 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option>All Status</option>
 <option>Pending</option>
 <option>Approved</option>
 <option>Rejected</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 
 <div className="relative flex-1 sm:flex-none sm:min-w-[150px]">
 <select 
 value={typeFilter}
 onChange={e => setTypeFilter(e.target.value)}
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-4 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option>Leave Type</option>
 <option>Annual Leave</option>
 <option>Sick Leave</option>
 <option>Casual Leave</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
 <ExportButton data={employees} filename="Export" className="h-9 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <Link
 href={`/schools/${schoolId}/admin/hr/leaves/new`}
 className="h-9 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <Plus size={14} /> New Request
 </Link>
 </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <CalendarDays size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Approved</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-extrabold text-gray-900">{String(stats.approved).padStart(2, "0")}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
 <Filter size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Pending</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-extrabold text-gray-900">{stats.pending}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <Clock size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Rejected</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-extrabold text-gray-900">{String(stats.rejected).padStart(2, "0")}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
 <PieChart size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500">Total Requests</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-extrabold text-gray-900">{String(stats.total).padStart(2, "0")}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
 <div className="xl:col-span-2 space-y-4">
 <div className="flex items-center justify-between px-1">
 <h2 className="text-xs font-bold text-gray-800">Pending & Recent Requests</h2>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Employee</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Type</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">From - To</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredRequests.length > 0 ? (
 filteredRequests.map((r) => {
 const initials = r.employeeName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
 const avatarColor = getAvatarColor(r.employeeName);

 return (
 <tr key={r.id || r.employeeId} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-white/20", avatarColor)}>
 {initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{r.employeeName}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">
 #{r.employeeId}
 {(r.designation || r.departmentId) ? ` • ${[r.designation, r.departmentId].filter(Boolean).join(" • ")}` : ""}
 </p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2.5">
 <span className="text-xs font-bold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-md">{r.type}</span>
 </td>
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-900">{r.from}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">to {r.to}</p>
 </td>
 <td className="px-4 py-2.5">
 <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border", statusTone(r.status))}>
 {r.status === "Approved" ? <CheckCircle2 size={10}/> : r.status === "Pending" ? <Clock size={10}/> : <AlertCircle size={10}/>}
 {r.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <TableRowActions
 items={[
 ...(r.status === "Pending"
 ? [
 { label: "Approve", icon: Check, onClick: () => updateStatus(r.id, "Approved") },
 { label: "Reject", icon: X, onClick: () => updateStatus(r.id, "Rejected") },
 ]
 : []),
 { label: "View Details", icon: Mail, onClick: () => {} },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete leave request for ${r.employeeName}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "leaves", r.id),
 },
 ]}
 />
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={5} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-3">
 <Search size={18} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No requests found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your filters.</p>
 <button 
 onClick={() => { setQuery(""); setStatusFilter("All Status"); setTypeFilter("Leave Type"); }}
 className="mt-4 text-xs font-bold text-[#144835] hover:underline"
 >
 Clear all filters
 </button>
 </td>
 </tr>
 )}
 </tbody>
 </table>

 <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <p className="text-xs font-medium text-gray-500">Showing {filteredRequests.length} requests</p>
 <div className="flex items-center gap-2">
 <button className="h-7 px-3 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
 Previous
 </button>
 <button className="h-7 px-3 flex items-center justify-center rounded-lg bg-[#144835] text-xs font-bold text-white shadow-sm hover:bg-[#144835]/90 transition-colors">
 Next
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex items-center justify-between px-1">
 <h2 className="text-xs font-bold text-gray-800">Leave Summary</h2>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-4">
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Most Approved Days (This Year)</p>

 <div className="mt-4 space-y-3">
 {(() => {
 const year = new Date().getFullYear();
 const startKey = `${year}-01-01`;
 const endKey = `${year}-12-31`;
 const totals: Record<string, number> = {};
 requestsWithEmployee.forEach((r) => {
 if (r.status !== "Approved") return;
 if (!r.from || !r.to) return;
 if (r.to < startKey || r.from > endKey) return;
 const days = r.days ?? dayCount(r.from, r.to) ?? 0;
 totals[r.employeeId] = (totals[r.employeeId] || 0) + days;
 });

 const rows = Object.entries(totals)
 .map(([employeeId, days]) => ({ employeeId, days }))
 .sort((a, b) => b.days - a.days)
 .slice(0, 6);

 if (!rows.length) {
 return <p className="text-xs font-semibold text-gray-500">No approved leaves yet.</p>;
 }

 return rows.map((row) => {
 const name = employeeById[row.employeeId]?.name || "Unknown";
 return (
 <div key={row.employeeId} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/40 px-3 py-2">
 <div>
 <p className="text-xs font-bold text-gray-900">{name}</p>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">#{row.employeeId}</p>
 </div>
 <div className="text-xs font-extrabold text-[#144835]">{row.days.toFixed(1)}d</div>
 </div>
 );
 });
 })()}
 </div>

 <p className="mt-3 text-center text-xs font-medium text-gray-400">Last updated: {new Date().toLocaleString("en-IN")}</p>
 </div>
 </div>
 </div>
 </div>
 );
}
