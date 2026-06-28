"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import AdminPageHeader from "@/components/admin/PageHeader";

import { useEffect, useMemo, useState } from "react";



import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
const SafeLink = Link as any;
;
import {
  CalendarDays,
  ChevronRight,
  Download,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
  CalendarRange,
  PhoneCall,
  CheckCircle2,
  Trash2,
  UserCheck,
} from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";
import { buildPath, subscribeData, buildQuery, sortBy, patchData, db, auth } from "@/lib/db-client";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type EnquiryStatus = "Pending" | "Scheduled" | "Converted";

type EnquiryRow = {
  id: string;
  parentName: string;
  studentName: string;
  grade: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: EnquiryStatus;
};

function statusTone(status: EnquiryStatus) {
  if (status === "Pending") return "bg-amber-50 text-amber-900 border-amber-100";
  if (status === "Scheduled") return "bg-blue-50 text-blue-800 border-blue-100";
  return "bg-emerald-50 text-emerald-800 border-emerald-100";
}

export default function AdminEnquiriesPage() {
  const schoolId = useSchoolId();
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [gradeFilter, setGradeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | EnquiryStatus>("All");

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const qRef = buildQuery(buildPath(db, "schools", schoolId, "enquiries"), sortBy("createdAt", "desc"));
    const unsubscribe = subscribeData(qRef, (snapshot: any) => {
      const list: EnquiryRow[] = snapshot.docs.map((buildPath: any) => {
        const data = buildPath.data();
        return {
          id: buildPath.id,
          parentName: data.parentName || "Unknown",
          studentName: data.studentName || "Unknown",
          grade: data.grade || "-",
          email: data.email || "-",
          phone: data.phone || "-",
          date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : "-",
          time: data.time || "-",
          status: (data.status as EnquiryStatus) || "Pending",
        };
      });
      setEnquiries(list);
      setLoading(false);
    }, (err: any) => {
      console.error("Error loading enquiries:", err);
      setLoadError("Failed to load enquiries.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(enquiries.map((e: any) => e.grade).filter(Boolean)));
    grades.sort((a: any, b: any) => a.localeCompare(b));
    return ["All", ...grades];
  }, [enquiries]);

  useEffect(() => {
    if (!gradeOptions.includes(gradeFilter)) setGradeFilter("All");
  }, [gradeOptions, gradeFilter]);

  const filteredEnquiries = useMemo(() => {
    const q = queryInput.trim().toLowerCase();
    return enquiries.filter((e: any) => {
      const matchQ =
        !q ||
        e.id.toLowerCase().includes(q) ||
        e.parentName.toLowerCase().includes(q) ||
        e.studentName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q);
      const matchGrade = gradeFilter === "All" || e.grade === gradeFilter;
      const matchStatus = statusFilter === "All" || e.status === statusFilter;
      return matchQ && matchGrade && matchStatus;
    });
  }, [enquiries, queryInput, gradeFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [queryInput, gradeFilter, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnquiries.slice(start, start + itemsPerPage);
  }, [filteredEnquiries, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / itemsPerPage));

  const stats = useMemo(() => {
    const total = enquiries.length;
    const pending = enquiries.filter((e: any) => e.status === "Pending").length;
    const scheduled = enquiries.filter((e: any) => e.status === "Scheduled").length;
    const converted = enquiries.filter((e: any) => e.status === "Converted").length;
    const conversionRate = total ? `${Math.round((converted / total) * 100)}%` : "0%";
    return { total, pending, scheduled, converted, conversionRate, session: "2024-25" };
  }, [enquiries]);

  const handleUpdateStatus = async (id: string, newStatus: EnquiryStatus) => {
    try {
      const docRef = buildPath(db, "schools", schoolId, "enquiries", id);
      await patchData(docRef, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      {loadError && (
        <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {loadError}
        </div>
      )}
       {/* Top Header */}
 <AdminPageHeader
  title="Enquiries"
  description="Track and follow up on admission enquiries and walk-ins"
 />

 {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <span className="text-xs font-extrabold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{stats.session}</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Total Enquiries</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-blue-50 opacity-50">
            <Users size={80} />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarDays size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.pending}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Pending</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-amber-50 opacity-50">
            <CalendarDays size={80} />
          </div>
        </div>

        {/* Scheduled */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <CalendarRange size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.scheduled}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Scheduled</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-blue-50 opacity-50">
            <CalendarRange size={80} />
          </div>
        </div>

        {/* Converted */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.converted}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Converted</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-emerald-50 opacity-50">
            <CheckCircle2 size={80} />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
              <PhoneCall size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.conversionRate}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Conversion Rate</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-emerald-50/30 opacity-50">
            <PhoneCall size={80} />
          </div>
        </div>
      </div>

      {/* Main Filter & Table Block */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
                placeholder="Search enquiries..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-[160px]">
              <select
                className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm cursor-pointer"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>{g === "All" ? "All Grades" : g}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
            </div>
            <div className="relative w-full sm:w-[140px]">
              <select
                className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Converted">Converted</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs font-bold">No enquiries found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Enquiry Details</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-bold text-gray-900">{e.studentName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-[#144835]">#{e.id}</span>
                        <span className="text-xs font-medium text-gray-500">Parent: {e.parentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          <span>{e.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          <span>{e.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border bg-gray-100 text-gray-700 border-gray-200">
                        {e.grade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-700">
                      {e.date}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border", statusTone(e.status))}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
 <TableRowActions
 items={[
 ...(e.status === "Pending"
 ? [{ label: "Schedule", icon: CalendarRange, onClick: () => handleUpdateStatus(e.id, "Scheduled") }]
 : []),
 ...(e.status === "Scheduled"
 ? [{ label: "Convert", icon: UserCheck, onClick: () => handleUpdateStatus(e.id, "Converted") }]
 : []),
 { label: "View", icon: Eye, href: `/schools/${schoolId}/admin/admission/enquiries/new` },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete enquiry for ${e.studentName}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "enquiries", e.id),
 },
 ]}
 />
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-semibold text-gray-500">
          <p>
            Showing <span className="font-extrabold text-gray-900">{filteredEnquiries.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredEnquiries.length)}</span> of{" "}
            <span className="font-extrabold text-gray-900">{filteredEnquiries.length}</span> entries
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={currentPage === p ? "h-8 w-8 rounded-lg bg-[#144835] text-white text-xs font-bold shadow-md shadow-[#144835]/20" : "h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"}
                  >
                    {p}
                  </button>
                );
              }
              if (p === currentPage - 2 || p === currentPage + 2) {
                return <span key={p} className="px-1 text-gray-400 text-xs font-bold">…</span>;
              }
              return null;
            })}

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
