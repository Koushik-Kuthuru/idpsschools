"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import AdminPageHeader from "@/components/admin/PageHeader";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Download, BookOpen, Edit2, Trash2, Copy, Wallet, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, BarChart3, FileSpreadsheet } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import BarSummary from "@/components/charts/BarSummary";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

function gradeLabel(grade: string) {
 const g = String(grade || "").trim();
 if (!g) return "—";
 if (/^\d+$/.test(g)) return `Grade ${g}`;
 return g;
}

type FeeStructureStatus = "Active" | "Draft";

type FeeStructureRow = {
 id: string;
 grade: string;
 tuition: number;
 sports: number;
 transport: number;
 others: number;
 students: number;
 status: FeeStructureStatus;
 academicYear: string;
};

type FeeCollectionRow = {
 id?: string;
 grade: string;
 expected: number;
 collected: number;
 pending: number;
 progress: number;
};

export default function AdminFeeManagementPage() {
 const schoolId = useSchoolId();
 const [activeTab, setActiveTab] = useState("structures");
 const [searchQuery, setSearchQuery] = useState("");
 const [gradeFilter, setGradeFilter] = useState<string>("All Grades");
 const [feeStructures, setFeeStructures] = useState<FeeStructureRow[]>([]);
 const [studentCountsByGrade, setStudentCountsByGrade] = useState<Record<string, number>>({});
 const [collections, setCollections] = useState<FeeCollectionRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setLoadError(null);

 // 1. Fetch live fee structures
 const qStructures = query(collection(db, "schools", schoolId, "fee_structures"), orderBy("grade", "asc"));
 const unsubStructures = onSnapshot(qStructures, (snap) => {
 const structs: FeeStructureRow[] = snap.docs.map(doc => {
 const d = doc.data();
 return {
 id: doc.id,
 grade: d.grade || "Unknown",
 tuition: Number(d.tuition || 0),
 sports: Number(d.sports || 0),
 transport: Number(d.transport || 0),
 others: Number(d.others || 0),
 students: 0,
 status: (d.status as FeeStructureStatus) || "Active",
 academicYear: d.academicYear || "2024-25"
 };
 });
 setFeeStructures(structs);
 }, (err) => {
 console.error("Error loading fee structures:", err);
 setLoadError("Failed to load fee structures. Check permissions.");
 });

 const qStudents = query(collection(db, "schools", schoolId, "students"));
 const unsubStudents = onSnapshot(
 qStudents,
 (snap) => {
 const map: Record<string, number> = {};
 snap.docs.forEach((d) => {
 const data = d.data() as any;
 const grade = String(data.classId || "").trim();
 if (!grade) return;
 map[grade] = (map[grade] || 0) + 1;
 });
 setStudentCountsByGrade(map);
 },
 () => setStudentCountsByGrade({})
 );

 // 2. Compute live collections based on invoices
 const qInvoices = query(collection(db, "schools", schoolId, "invoices"));
 const unsubInvoices = onSnapshot(qInvoices, (snap) => {
 const colMap: Record<string, { expected: number; collected: number; pending: number }> = {};
 
 snap.docs.forEach(doc => {
 const d = doc.data();
 const grade = d.grade || "Unknown"; // Assuming invoice tracks the grade
 if (!colMap[grade]) {
 colMap[grade] = { expected: 0, collected: 0, pending: 0 };
 }
 colMap[grade].expected += Number(d.amount || 0);
 colMap[grade].collected += Number(d.amountPaid || 0);
 // Calculate pending (amount - amountPaid), ensure it doesn't go below 0
 colMap[grade].pending += Math.max(0, Number(d.amount || 0) - Number(d.amountPaid || 0));
 });

 const cols: FeeCollectionRow[] = Object.keys(colMap).map(grade => {
 const data = colMap[grade];
 const progress = data.expected > 0 ? Math.round((data.collected / data.expected) * 100) : 0;
 return {
 grade,
 expected: data.expected,
 collected: data.collected,
 pending: data.pending,
 progress
 };
 });
 setCollections(cols);
 setLoading(false);
 }, (err) => {
 console.error("Error loading invoices:", err);
 setLoading(false);
 });

 return () => {
 unsubStructures();
 unsubStudents();
 unsubInvoices();
 };
 }, [schoolId]);

 const fees = useMemo(() => {
 return feeStructures.map((f) => ({
 ...f,
 students: studentCountsByGrade[String(f.grade || "").trim()] || 0,
 }));
 }, [feeStructures, studentCountsByGrade]);

 const allGrades = useMemo(() => {
 const defaults = ["Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, i) => String(i + 1))];
 const set = new Set<string>();
 defaults.forEach((d) => set.add(d));
 const isRange = (s: string) => /grades?\s*\d+\s*(to|-)\s*\d+/i.test(s);
 fees.forEach((f) => {
 const g = String(f.grade || "").trim();
 if (g && !isRange(g)) set.add(g);
 });
 collections.forEach((c) => {
 const g = String(c.grade || "").trim();
 if (g && !isRange(g)) set.add(g);
 });
 const list = Array.from(set);
 const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
 list.sort((a, b) => collator.compare(a, b));
 return list;
 }, [collections, fees]);

 const filteredFees = useMemo(() => {
 const q = searchQuery.trim().toLowerCase();
 return fees.filter((f) => {
 const matchGrade = gradeFilter === "All Grades" || f.grade === gradeFilter;
 const matchQuery = !q || f.grade.toLowerCase().includes(q);
 return matchGrade && matchQuery;
 });
 }, [fees, gradeFilter, searchQuery]);

 const filteredCollections = useMemo(() => {
 const q = searchQuery.trim().toLowerCase();
 return collections.filter((c) => {
 const matchGrade = gradeFilter === "All Grades" || c.grade === gradeFilter;
 const matchQuery = !q || c.grade.toLowerCase().includes(q);
 return matchGrade && matchQuery;
 });
 }, [collections, gradeFilter, searchQuery]);

 const kpiData = useMemo(() => {
 const expected = collections.reduce((sum, c) => sum + (Number.isFinite(c.expected) ? c.expected : 0), 0);
 const collected = collections.reduce((sum, c) => sum + (Number.isFinite(c.collected) ? c.collected : 0), 0);
 const pending = collections.reduce((sum, c) => sum + (Number.isFinite(c.pending) ? c.pending : 0), 0);
 return [
 { title: "Total Expected", value: `₹${expected.toLocaleString("en-IN")}`, trend: "Annual Target", trendUp: true, icon: Wallet, color: "bg-blue-500" },
 { title: "Collected YTD", value: `₹${collected.toLocaleString("en-IN")}`, trend: expected ? `${Math.round((collected / expected) * 100)}% Collected` : "0% Collected", trendUp: true, icon: CheckCircle2, color: "bg-emerald-500" },
 { title: "Pending Collection", value: `₹${pending.toLocaleString("en-IN")}`, trend: "Pending", trendUp: true, icon: TrendingUp, color: "bg-purple-500" },
 { title: "Overdue Dues", value: "—", trend: "Requires Attention", trendUp: false, icon: AlertCircle, color: "bg-rose-500" },
 ];
 }, [collections]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
  {/* Top Header */}
 <AdminPageHeader
  title="Fee Structure"
  description="Configure fee plans, dues, and grade-level billing"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 sm:w-[240px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 placeholder="Search grade level..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none sm:min-w-[150px]">
 <select
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 value={gradeFilter}
 onChange={(e) => setGradeFilter(e.target.value)}
 >
 <option value="All Grades">All Grades</option>
 {allGrades.map((g) => (
 <option key={g} value={g}>
 {gradeLabel(g)}
 </option>
 ))}
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <ExportButton data={filteredFees} filename="Export" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <Link
 href={`/schools/${schoolId}/admin/finance/fees/new`}
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <Plus size={14} /> Add Structure
 </Link>
 </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 {kpiData.map((kpi, index) => (
 <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className={`h-10 w-10 rounded-full ${kpi.color.replace('bg-', 'bg-').replace('500', '50')} ${kpi.color.replace('bg-', 'text-').replace('500', '600')} flex items-center justify-center shrink-0`}>
 <kpi.icon size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{kpi.title}</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{kpi.value}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
 <BarSummary
 title="Fee Collection (Realtime)"
 series={[
 { label: "Expected", value: collections.reduce((s, c) => s + (Number.isFinite(c.expected) ? c.expected : 0), 0), tone: "bg-blue-500" },
 { label: "Collected", value: collections.reduce((s, c) => s + (Number.isFinite(c.collected) ? c.collected : 0), 0), tone: "bg-emerald-500" },
 { label: "Pending", value: collections.reduce((s, c) => s + (Number.isFinite(c.pending) ? c.pending : 0), 0), tone: "bg-amber-500" },
 ]}
 />
 <BarSummary
 title="Students by Fee Structure"
 series={fees.map((f) => ({ label: gradeLabel(f.grade), value: Number.isFinite(f.students) ? f.students : 0, tone: "bg-[#144835]" }))}
 />
 </div>

 {/* Main Content Area */}
 <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
 {/* Tabs & Toolbar */}
 <div className="border-b border-gray-100 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
 <div className="flex items-center bg-gray-50/80 p-1 rounded-lg border border-gray-100">
 <button
 onClick={() => setActiveTab("structures")}
 className={cn(
 "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
 activeTab === "structures"
 ? "bg-white text-gray-900 shadow-sm border border-gray-200"
 : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
 )}
 >
 <FileSpreadsheet size={14} />
 Fee Structures
 </button>
 <button
 onClick={() => setActiveTab("collections")}
 className={cn(
 "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
 activeTab === "collections"
 ? "bg-white text-gray-900 shadow-sm border border-gray-200"
 : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
 )}
 >
 <BarChart3 size={14} />
 Collection Status
 </button>
 </div>
 
 <div className="flex items-center gap-2">
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
 {loading ? "Loading..." : `${activeTab === "structures" ? filteredFees.length : filteredCollections.length} records`}
 </p>
 </div>
 </div>

 {/* Tab Content */}
 {activeTab === "structures" ? (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Grade Level</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Academic Year</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tuition</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Other Fees</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Total/Student</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredFees.length > 0 ? (
 filteredFees.map((fee) => {
 const total = fee.tuition + fee.sports + fee.transport + fee.others;
 const otherFees = fee.sports + fee.transport + fee.others;
 return (
 <tr key={fee.grade} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
 <BookOpen size={14} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{gradeLabel(fee.grade)}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">{fee.students} Students</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2.5">
 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
 {fee.academicYear}
 </span>
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-gray-700">
 ₹{fee.tuition.toLocaleString()}
 </td>
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-700">₹{otherFees.toLocaleString()}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">Sports, Transport, etc.</p>
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-[#144835]">
 ₹{total.toLocaleString()}
 </td>
 <td className="px-4 py-2.5">
 <span className={cn(
 "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
 fee.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
 'bg-amber-50 text-amber-700 border-amber-200'
 )}>
 {fee.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <TableRowActions
 items={[
 { label: "Duplicate", icon: Copy, onClick: () => {} },
 { label: "Edit", icon: Edit2, onClick: () => {} },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete fee structure for ${gradeLabel(fee.grade)}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "fee_structures", fee.id),
 },
 ]}
 />
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={7} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No fee structures found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search query.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Grade Level</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Expected Revenue</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Collected</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Collection Progress</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredCollections.length > 0 ? (
 filteredCollections.map((col) => (
 <tr key={col.grade} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-900">{gradeLabel(col.grade)}</p>
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-gray-700">
 ₹{col.expected.toLocaleString()}
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-emerald-600">
 ₹{col.collected.toLocaleString()}
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-rose-600">
 ₹{col.pending.toLocaleString()}
 </td>
 <td className="px-4 py-2.5 w-64">
 <div className="flex items-center gap-2">
 <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
 <div 
 className={cn(
 "h-full rounded-full transition-all",
 col.progress >= 90 ? 'bg-emerald-500' :
 col.progress >= 75 ? 'bg-blue-500' :
 'bg-amber-500'
 )}
 style={{ width: `${col.progress}%` }}
 />
 </div>
 <span className="text-xs font-bold text-gray-700 w-8">{col.progress}%</span>
 </div>
 </td>
 <td className="px-4 py-2.5 text-right">
 <TableRowActions items={[{ label: "View Details", icon: ChevronRight, onClick: () => {} }]} />
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No collection records found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search query.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
}
