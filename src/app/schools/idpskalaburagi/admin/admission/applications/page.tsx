"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Badge,
  ChevronRight,
  Download,
  Eye,
  Mail,
  Pencil,
  Search,
  UserCheck,
  ClipboardCheck,
  Phone,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AppStatus = "Submitted" | "Verification" | "Selected";

type ApplicationRow = {
  id: string;
  name: string;
  grade: string;
  parentName: string;
  phone: string;
  email: string;
  date: string;
  status: AppStatus;
  progress: number;
};

function statusTone(status: AppStatus) {
  if (status === "Submitted") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "Selected") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  return "bg-amber-50 text-amber-900 border-amber-100";
}

export default function AdminAdmissionApplicationsPage() {
  const schoolId = "idpskalaburagi";
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [gradeFilter, setGradeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | AppStatus>("All");

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const qRef = query(collection(db, "schools", schoolId, "applications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(qRef, (snapshot) => {
      const list: ApplicationRow[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.studentName || data.name || "Unknown",
          grade: data.grade || "-",
          parentName: data.parentName || "Unknown",
          phone: data.phone || "-",
          email: data.email || "-",
          date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : "-",
          status: (data.status as AppStatus) || "Submitted",
          progress: Number(data.progress || 20),
        };
      });
      setApplications(list);
      setLoading(false);
    }, (err) => {
      console.error("Error loading applications:", err);
      setLoadError("Failed to load applications.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(applications.map((a) => a.grade).filter(Boolean)));
    grades.sort((a, b) => a.localeCompare(b));
    return ["All", ...grades];
  }, [applications]);

  useEffect(() => {
    if (!gradeOptions.includes(gradeFilter)) setGradeFilter("All");
  }, [gradeOptions, gradeFilter]);

  const filtered = useMemo(() => {
    const q = queryInput.trim().toLowerCase();
    return applications.filter((a) => {
      const matchQ =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.parentName.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q);
      const matchGrade = gradeFilter === "All" || a.grade === gradeFilter;
      const matchStatus = statusFilter === "All" || a.status === statusFilter;
      return matchQ && matchGrade && matchStatus;
    });
  }, [applications, queryInput, gradeFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [queryInput, gradeFilter, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const stats = useMemo(() => {
    const total = applications.length;
    const selected = applications.filter((a) => a.status === "Selected").length;
    const verification = applications.filter((a) => a.status === "Verification").length;
    const submitted = applications.filter((a) => a.status === "Submitted").length;
    const successRate = total ? `${Math.round((selected / total) * 100)}%` : "0%";
    return { session: "2025-26", total, selected, verification, submitted, successRate };
  }, [applications]);

  const handleUpdateStatus = async (id: string, newStatus: AppStatus) => {
    try {
      const docRef = doc(db, "schools", schoolId, "applications", id);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      console.error("Failed to update application status", err);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      {loadError && (
        <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {loadError}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Applications</h1>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Showing <span className="font-extrabold text-gray-900">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{" "}
            <span className="font-extrabold text-gray-900">{filtered.length}</span> entries
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <ExportButton data={filtered} filename="Applications_Export" className="h-9 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors" iconSize={14} />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Total Applications */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{stats.session}</span>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.total}</p>
            <p className="text-[11px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Total Applications</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-blue-50 opacity-50">
            <Users size={80} />
          </div>
        </div>

        {/* Submitted */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.submitted}</p>
            <p className="text-[11px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Submitted</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-slate-50 opacity-50">
            <ClipboardCheck size={80} />
          </div>
        </div>

        {/* Verification */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.verification}</p>
            <p className="text-[11px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Verification Phase</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-amber-50 opacity-50">
            <AlertCircle size={80} />
          </div>
        </div>

        {/* Selected */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.selected}</p>
            <p className="text-[11px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Selected</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-emerald-50 opacity-50">
            <CheckCircle2 size={80} />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.successRate}</p>
            <p className="text-[11px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Conversion Rate</p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-[#144835]/10 opacity-50">
            <UserCheck size={80} />
          </div>
        </div>
      </div>

      {/* Bulk actions banner */}
      <div className="rounded-[16px] bg-gradient-to-r from-[#0B1220] to-[#111827] p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-white shadow-lg">
        <div>
          <p className="text-sm font-extrabold">Bulk Application Actions</p>
          <p className="mt-0.5 text-xs font-semibold text-white/70">
            Perform actions for all “Selected” or “Verified” candidates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-xs font-extrabold text-white hover:bg-white/15">
            <Download size={14} /> Publish Merit List
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-extrabold text-[#0B1220] hover:bg-amber-300">
            <Mail size={14} /> Send Offers
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#144835]/90">
            <Badge size={14} /> Generate Admit Cards
          </button>
        </div>
      </div>

      {/* Filters & Table container */}
      <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
                placeholder="Search applications..."
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
                <option value="Submitted">Submitted</option>
                <option value="Verification">Verification</option>
                <option value="Selected">Selected</option>
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
            <div className="p-8 text-center text-gray-500 text-xs font-bold">No applications found matching your criteria.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Candidate Details</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Submission Date</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-bold text-gray-900">{a.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-[#144835]">#{a.id}</span>
                        <span className="text-[10px] font-medium text-gray-500">Parent: {a.parentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          <span>{a.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          <span>{a.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-100 text-gray-700 border-gray-200">
                        {a.grade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-700">
                      {a.date}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border", statusTone(a.status))}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.status === "Submitted" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(a.id, "Verification")}
                            className="h-7 px-2.5 text-[10px] font-extrabold text-amber-700 hover:bg-amber-50 border border-amber-150 rounded-md transition-colors"
                          >
                            Verify
                          </button>
                        )}
                        {a.status === "Verification" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(a.id, "Selected")}
                            className="h-7 px-2.5 text-[10px] font-extrabold text-emerald-700 hover:bg-emerald-50 border border-emerald-150 rounded-md transition-colors"
                          >
                            Select
                          </button>
                        )}
                        <button type="button" className="h-7 w-7 inline-flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="View details">
                          <Eye size={14} />
                        </button>
                      </div>
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
            Showing <span className="font-extrabold text-gray-900">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{" "}
            <span className="font-extrabold text-gray-900">{filtered.length}</span> entries
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
