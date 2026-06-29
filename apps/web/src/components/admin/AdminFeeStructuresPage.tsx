"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useBranchStudents } from "@/hooks/useBranchStudents";
import AdminPageHeader from "@/components/admin/PageHeader";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
;
import { Plus, Search, BookOpen, Edit2, Trash2, Copy, Wallet, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, BarChart3, FileSpreadsheet, CreditCard, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import BarSummary from "@/components/charts/BarSummary";


import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";
import { buildPath, subscribeData, buildQuery, sortBy, fetchMany, db } from "@/lib/db-client";
import {
  collectionBreakdown,
  filterReceiptsByPeriod,
  formatInr,
  groupByCollector,
  monthLabelFromIndex,
  parseAmount,
  type CollectionPeriod,
  type FeeReceiptRow,
} from "@/lib/feeDepositUtils";


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

const COLLECTION_PERIODS: { id: CollectionPeriod; label: string }[] = [
 { id: "today", label: "Today" },
 { id: "week", label: "This Week" },
 { id: "month", label: "This Month" },
];

function mapPaymentDoc(id: string, data: Record<string, unknown>): FeeReceiptRow {
 const monthRaw = String(data.feeMonth ?? data.month ?? "");
 const dateRaw = String(data.date ?? data.payment_date ?? "").slice(0, 10);
 return {
  id,
  receiptNo: String(data.receiptNo ?? data.id ?? id).slice(0, 16),
  month: monthRaw || monthLabelFromIndex(new Date(dateRaw || Date.now()).getMonth()),
  date: dateRaw,
  amount: parseAmount(data.amount),
  mode: String(data.mode ?? data.paymentMode ?? "Cash"),
  fine: parseAmount(data.fine),
  status: String(data.status ?? "Completed"),
  studentId: data.studentId ? String(data.studentId) : undefined,
  studentName: data.studentName ? String(data.studentName) : undefined,
  admissionNo: data.admissionNo ? String(data.admissionNo) : undefined,
  collectedByName: data.collectedByName ? String(data.collectedByName) : undefined,
  remark: data.remark ? String(data.remark) : undefined,
 };
}

export default function AdminFeeStructuresPage() {
 const schoolId = useSchoolId();
 const { currentYear } = useAcademicYear();
 const { students, classOptions, sectionOptions } = useBranchStudents(schoolId, currentYear?.name);
 const base = `/schools/${schoolId}/admin`;
 const [activeTab, setActiveTab] = useState("structures");
 const [collectionPeriod, setCollectionPeriod] = useState<CollectionPeriod>("today");
 const [searchQuery, setSearchQuery] = useState("");
 const [classFilter, setClassFilter] = useState("All");
 const [sectionFilter, setSectionFilter] = useState("All");
 const [feeStructures, setFeeStructures] = useState<FeeStructureRow[]>([]);
 const [collections, setCollections] = useState<FeeCollectionRow[]>([]);
 const [paymentReceipts, setPaymentReceipts] = useState<FeeReceiptRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setLoadError(null);

 // 1. Fetch live fee structures
 const qStructures = buildQuery(buildPath(db, "schools", schoolId, "fee_structures"), sortBy("grade", "asc"));
 const unsubStructures = subscribeData(qStructures, (snap: any) => {
 const structs: FeeStructureRow[] = snap.docs.map((buildPath: any) => {
 const d = buildPath.data();
 return {
 id: buildPath.id,
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
 }, (err: any) => {
 console.error("Error loading fee structures:", err);
 setLoadError("Failed to load fee structures. Check permissions.");
 });

 // 2. Compute live collections based on invoices
 const qInvoices = buildQuery(buildPath(db, "schools", schoolId, "invoices"));
 const unsubInvoices = subscribeData(qInvoices, (snap: any) => {
 const colMap: Record<string, { expected: number; collected: number; pending: number }> = {};
 
 snap.docs.forEach((buildPath: any) => {
 const d = buildPath.data();
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
 }, (err: any) => {
 console.error("Error loading invoices:", err);
 setLoading(false);
 });

 return () => {
 unsubStructures();
 unsubInvoices();
 };
 }, [schoolId]);

 const sectionsForClass = useMemo(() => {
 if (classFilter === "All") return ["All", ...sectionOptions];
 const sections = [
  ...new Set(
   students
    .filter((s) => s.className === classFilter && s.section && s.section !== "—")
    .map((s) => s.section.toUpperCase())
  ),
 ].sort((a, b) => a.localeCompare(b));
 return ["All", ...sections];
 }, [classFilter, sectionOptions, students]);

 const filteredStudentsForCounts = useMemo(() => {
 return students.filter((s) => {
  const matchClass = classFilter === "All" || s.className === classFilter;
  const matchSection =
   sectionFilter === "All" || s.section.toUpperCase() === sectionFilter.toUpperCase();
  return matchClass && matchSection;
 });
 }, [students, classFilter, sectionFilter]);

 const studentCountsByGrade = useMemo(() => {
 const map: Record<string, number> = {};
 for (const s of filteredStudentsForCounts) {
  const grade = String(s.className || "").trim();
  if (!grade || grade === "—") continue;
  map[grade] = (map[grade] || 0) + 1;
 }
 return map;
 }, [filteredStudentsForCounts]);

 useEffect(() => {
  let cancelled = false;
  (async () => {
   try {
    const snap = await fetchMany(
     buildQuery(buildPath(db, "schools", schoolId, "payments"), sortBy("createdAt", "desc"))
    );
    if (cancelled) return;
    setPaymentReceipts(snap.docs.map((d) => mapPaymentDoc(d.id, d.data() as Record<string, unknown>)));
   } catch {
    if (!cancelled) setPaymentReceipts([]);
   }
  })();
  return () => {
   cancelled = true;
  };
 }, [schoolId]);

 const fees = useMemo(() => {
 return feeStructures.map((f) => ({
 ...f,
 students: studentCountsByGrade[String(f.grade || "").trim()] || 0,
 }));
 }, [feeStructures, studentCountsByGrade]);

 const filteredFees = useMemo(() => {
 const q = searchQuery.trim().toLowerCase();
 return fees.filter((f) => {
 const matchClass = classFilter === "All" || f.grade === classFilter;
 const matchQuery = !q || f.grade.toLowerCase().includes(q) || gradeLabel(f.grade).toLowerCase().includes(q);
 return matchClass && matchQuery;
 });
 }, [fees, classFilter, searchQuery]);

 const filteredCollections = useMemo(() => {
 const q = searchQuery.trim().toLowerCase();
 return collections.filter((c) => {
 const matchClass = classFilter === "All" || c.grade === classFilter;
 const matchQuery = !q || c.grade.toLowerCase().includes(q) || gradeLabel(c.grade).toLowerCase().includes(q);
 return matchClass && matchQuery;
 });
 }, [collections, classFilter, searchQuery]);

 const periodReceipts = useMemo(
  () => filterReceiptsByPeriod(paymentReceipts, collectionPeriod),
  [paymentReceipts, collectionPeriod]
 );

 const periodStats = useMemo(() => collectionBreakdown(periodReceipts), [periodReceipts]);
 const collectors = useMemo(() => groupByCollector(periodReceipts), [periodReceipts]);

 const filteredLedger = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();
  let rows = periodReceipts;
  if (q) {
   rows = rows.filter(
    (r) =>
     r.receiptNo.toLowerCase().includes(q) ||
     (r.studentName ?? "").toLowerCase().includes(q) ||
     (r.admissionNo ?? "").toLowerCase().includes(q) ||
     (r.collectedByName ?? "").toLowerCase().includes(q)
   );
  }
  return rows;
 }, [periodReceipts, searchQuery]);

 const allPaymentsTotal = useMemo(
  () =>
   paymentReceipts
    .filter((r) => r.status !== "Cancelled" && r.status !== "Failed")
    .reduce((sum, r) => sum + r.amount, 0),
  [paymentReceipts]
 );

 const kpiData = useMemo(() => {
 const expected = collections.reduce((sum, c) => sum + (Number.isFinite(c.expected) ? c.expected : 0), 0);
 const collected = collections.reduce((sum, c) => sum + (Number.isFinite(c.collected) ? c.collected : 0), 0);
 const pending = collections.reduce((sum, c) => sum + (Number.isFinite(c.pending) ? c.pending : 0), 0);
 const periodLabel = COLLECTION_PERIODS.find((p) => p.id === collectionPeriod)?.label ?? "Today";
 return [
 { title: "Total Expected", value: `₹${expected.toLocaleString("en-IN")}`, trend: "Annual Target", trendUp: true, icon: Wallet, color: "bg-blue-500" },
 { title: "Collected YTD", value: `₹${(allPaymentsTotal || collected).toLocaleString("en-IN")}`, trend: expected ? `${Math.round(((allPaymentsTotal || collected) / Math.max(expected, 1)) * 100)}% Collected` : `${periodLabel} ₹${periodStats.total.toLocaleString("en-IN")}`, trendUp: true, icon: CheckCircle2, color: "bg-emerald-500" },
 { title: "Pending Collection", value: `₹${pending.toLocaleString("en-IN")}`, trend: "Pending", trendUp: true, icon: TrendingUp, color: "bg-purple-500" },
 { title: `${periodLabel} Collection`, value: `₹${periodStats.total.toLocaleString("en-IN")}`, trend: `${periodStats.count} receipts`, trendUp: true, icon: AlertCircle, color: "bg-rose-500" },
 ];
 }, [collections, allPaymentsTotal, collectionPeriod, periodStats]);

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
 placeholder="Search class or grade..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none sm:min-w-[150px]">
 <select
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 value={classFilter}
 onChange={(e) => {
  setClassFilter(e.target.value);
  setSectionFilter("All");
 }}
 aria-label="Filter by class"
 >
 <option value="All">All Classes</option>
 {classOptions.map((c) => (
 <option key={c} value={c}>
 {gradeLabel(c)}
 </option>
 ))}
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 <div className="relative flex-1 sm:flex-none sm:min-w-[130px]">
 <select
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 value={sectionFilter}
 onChange={(e) => setSectionFilter(e.target.value)}
 aria-label="Filter by section"
 >
 {sectionsForClass.map((s) => (
 <option key={s} value={s}>
 {s === "All" ? "All Sections" : s}
 </option>
 ))}
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
  {COLLECTION_PERIODS.map((p) => (
   <button
    key={p.id}
    type="button"
    onClick={() => setCollectionPeriod(p.id)}
    className={cn(
     "px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors",
     collectionPeriod === p.id ? "bg-[#144835] text-white" : "text-gray-500 hover:text-gray-800"
    )}
   >
    {p.label}
   </button>
  ))}
 </div>
 <ExportButton data={activeTab === "structures" ? filteredFees : filteredLedger} filename="fee-export" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <SafeLink
 href={`${base}/finance/fees/deposit`}
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#144835]/30 bg-[#144835]/5 px-4 text-xs font-bold text-[#144835] hover:bg-[#144835]/10 whitespace-nowrap transition-all"
 >
 <CreditCard size={14} /> Deposit Fee
 </SafeLink>
 <SafeLink
 href={`${base}/finance/fees/new`}
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <Plus size={14} /> Add Structure
 </SafeLink>
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
 title={`Fee Collection (${COLLECTION_PERIODS.find((p) => p.id === collectionPeriod)?.label ?? "Today"})`}
 series={[
 { label: "Cash", value: periodStats.cash, tone: "bg-sky-500" },
 { label: "UPI", value: periodStats.upi, tone: "bg-violet-500" },
 { label: "Cheque", value: periodStats.cheque, tone: "bg-rose-500" },
 { label: "NEFT / Bank", value: periodStats.neft, tone: "bg-amber-500" },
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
 {loading ? "Loading..." : activeTab === "structures" ? `${filteredFees.length} records` : `${filteredLedger.length} receipts`}
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
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search buildQuery.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="space-y-4 p-4">
  {collectors.length > 0 ? (
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {collectors.slice(0, 4).map((c) => (
     <div key={c.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-center gap-2 mb-1">
       <span className="h-7 w-7 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center">
        <User size={14} />
       </span>
       <p className="text-xs font-bold text-gray-900 truncate">{c.name}</p>
      </div>
      <p className="text-sm font-extrabold text-[#144835]">{formatInr(c.amount)}</p>
      <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{c.count} receipts · Cash {formatInr(c.cash)}</p>
     </div>
    ))}
   </div>
  ) : null}
  <div className="overflow-x-auto rounded-xl border border-gray-100">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Receipt</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Adm No</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Mode</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Collected By</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredLedger.length > 0 ? (
 filteredLedger.map((r) => (
 <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-600">{r.date || "—"}</td>
 <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{r.receiptNo}</td>
 <td className="px-4 py-2.5 text-xs font-bold text-gray-900 max-w-[140px] truncate">{r.studentName ?? "—"}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-600">{r.admissionNo ?? "—"}</td>
 <td className="px-4 py-2.5 text-xs font-extrabold text-[#144835] text-right">{formatInr(r.amount)}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-600">{r.mode}</td>
 <td className="px-4 py-2.5 text-xs font-bold text-gray-800">{r.collectedByName ?? "Unknown"}</td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={7} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No collections in this period</p>
 <p className="text-xs text-gray-500 mt-1">Record fees via Deposit Fee or try another date range.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
  </div>
 </div>
 )}
 </div>
 </div>
 );
}
