"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";

import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, Settings, FileText, CheckCircle2, AlertCircle, ChevronRight, IndianRupee, Users, Briefcase , Trash2} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type PayrollStatus = "Pending" | "Processed";

type PayrollRow = {
 id: string;
 employeeId: string;
 employee: string;
 role: string;
 salary: number;
 tds: number;
 deduct: number;
 net: number;
 status: PayrollStatus;
 period: string;
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

export default function AdminPayrollPage() {
 const schoolId = "idpscherukupalli";
 const [queryInput, setQueryInput] = useState("");
 const [payroll, setPayroll] = useState<PayrollRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setLoadError(null);

 const qRef = query(collection(db, "schools", schoolId, "employees"), orderBy("firstName", "asc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: PayrollRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 const name = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown Employee";
 const role = data.role || data.department || "-";
 const salary = Number(data.salary || data.baseSalary || 0);
 // Simple mock calculations based on salary if actuals aren't present
 const tds = Number(data.tds || salary * 0.1); 
 const deduct = Number(data.deductions || salary * 0.05);
 const net = salary - tds - deduct;

 return {
 id: doc.id,
 employeeId: data.employeeId || doc.id.substring(0, 8),
 employee: name,
 role: role,
 salary: salary,
 tds: tds,
 deduct: deduct,
 net: net,
 status: (data.payrollStatus as PayrollStatus) || "Pending",
 period: data.payrollPeriod || "Jan 2025",
 };
 });
 setPayroll(list);
 setLoading(false);
 }, (err) => {
 console.error("Error loading payroll:", err);
 setLoadError("Failed to load payroll. Check permissions.");
 setLoading(false);
 });

 return () => unsubscribe();
 }, [schoolId]);

 const filteredPayroll = useMemo(() => {
 const q = queryInput.trim().toLowerCase();
 return payroll.filter((p) => !q || p.employee.toLowerCase().includes(q) || p.employeeId.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
 }, [payroll, queryInput]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
  {/* Top Header */}
 <AdminPageHeader
  title="Payroll"
  description="Manage staff salaries, disbursements, and pay cycles"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 sm:w-[240px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 placeholder="Search employee, ID..."
 value={queryInput}
 onChange={(e) => setQueryInput(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
 <select 
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 defaultValue="Jan 2025"
 >
 <option value="Jan 2025">January 2025</option>
 <option value="Feb 2025">February 2025</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <button
 type="button"
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors"
 >
 <Settings size={14} /> Setup Rules
 </button>
 <button
 type="button"
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <CheckCircle2 size={14} /> Process All
 </button>
 </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <Users size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Staff</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{payroll.length}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <IndianRupee size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Payable</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">₹{(payroll.reduce((s, p) => s + p.net, 0) / 1000).toFixed(1)}k</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
 <Briefcase size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Salary</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">₹{(payroll.reduce((s, p) => s + p.salary, 0) / 1000).toFixed(1)}k</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
 <AlertCircle size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Deductions</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">₹{(payroll.reduce((s, p) => s + p.tds + p.deduct, 0) / 1000).toFixed(1)}k</p>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
 <h2 className="text-sm font-bold text-gray-800">Payroll Directory</h2>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{loading ? "Loading..." : `${filteredPayroll.length} records`}</p>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Info</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Salary</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">TDS</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Other Deduct.</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Net Payable</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredPayroll.length > 0 ? (
 filteredPayroll.map((p) => {
 const initials = p.employee.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
 const avatarColor = getAvatarColor(p.employee);

 return (
 <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-white/20", avatarColor)}>
 {initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{p.employee}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">{p.employeeId} • {p.role}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-gray-700">₹{p.salary.toLocaleString("en-IN")}</td>
 <td className="px-4 py-2.5 text-xs font-medium text-rose-600">-₹{p.tds.toLocaleString("en-IN")}</td>
 <td className="px-4 py-2.5 text-xs font-medium text-orange-600">-₹{p.deduct.toLocaleString("en-IN")}</td>
 <td className="px-4 py-2.5 text-xs font-bold text-[#144835]">₹{p.net.toLocaleString("en-IN")}</td>
 <td className="px-4 py-2.5">
 <span className={cn(
 "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
 p.status === "Processed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
 )}>
 {p.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <TableRowActions
 items={[
 { label: "Generate Slip", icon: FileText, onClick: () => {} },
 ...(p.status === "Pending" ? [{ label: "Approve", icon: CheckCircle2, onClick: () => {} }] : []),
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete payroll record for ${p.employee}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "employees", p.id),
 },
 ]}
 />
 </td>
 </tr>
 )
 })
 ) : (
 <tr>
 <td colSpan={7} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No payroll records found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search query.</p>
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
