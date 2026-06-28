"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Search,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";
import { buildPath, subscribeData, sortBy, buildQuery, db } from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  from: string;
  to: string;
  days?: number;
  status: LeaveStatus;
};

function statusTone(status: LeaveStatus) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "Rejected") return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

export default function TeacherLeavesView() {
  const schoolId = useSchoolId();
  const scope = useTeacherPortalScope();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = buildQuery(buildPath(db, "schools", schoolId, "leaves"), sortBy("from", "desc"));
    const unsub = subscribeData(
      q,
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        const rows = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            employeeId: String(data.employeeId ?? ""),
            employeeName: String(data.employeeName ?? "Unknown"),
            type: String(data.type ?? "Leave"),
            from: String(data.from ?? ""),
            to: String(data.to ?? ""),
            days: typeof data.days === "number" ? data.days : undefined,
            status: (data.status as LeaveStatus) || "Pending",
          };
        });
        setRequests(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [schoolId]);

  const myRequests = useMemo(() => {
    const uid = scope?.teacherUid;
    const name = scope?.teacherDisplayName?.toLowerCase();
    const email = scope?.teacherEmail?.toLowerCase();
    return requests.filter((r) => {
      if (uid && r.employeeId === uid) return true;
      if (name && r.employeeName.toLowerCase().includes(name)) return true;
      if (email && r.employeeId.toLowerCase() === email) return true;
      return false;
    });
  }, [requests, scope?.teacherDisplayName, scope?.teacherEmail, scope?.teacherUid]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myRequests.filter((r) => {
      const matchQ = !q || `${r.type} ${r.from} ${r.to}`.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All Status" || r.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [myRequests, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      approved: myRequests.filter((r) => r.status === "Approved").length,
      pending: myRequests.filter((r) => r.status === "Pending").length,
      rejected: myRequests.filter((r) => r.status === "Rejected").length,
      total: myRequests.length,
    };
  }, [myRequests]);

  return (
    <div className="erp-body space-y-6 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="My Leaves"
        description="Apply for leave and track your request status"
        actions={
          <SafeLink
            href={`/schools/${schoolId}/teachers/leaves/new`}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
          >
            <Plus size={14} /> New Request
          </SafeLink>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Approved", value: stats.approved, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
          { label: "Pending", value: stats.pending, icon: Clock, tone: "text-amber-600 bg-amber-50" },
          { label: "Rejected", value: stats.rejected, icon: AlertCircle, tone: "text-rose-600 bg-rose-50" },
          { label: "Total", value: stats.total, icon: CalendarDays, tone: "text-blue-600 bg-blue-50" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", item.tone)}>
              <item.icon size={18} />
            </div>
            <div>
              <p className="erp-caption mb-0.5">{item.label}</p>
              <p className="erp-metric text-xl">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold"
            placeholder="Search leave type or dates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold"
        >
          <option>All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">From</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">To</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{r.type}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{r.from}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{r.to}</td>
                    <td className="px-5 py-3">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-bold border", statusTone(r.status))}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                    No leave requests yet.{" "}
                    <SafeLink href={`/schools/${schoolId}/teachers/leaves/new`} className="text-[#144835] font-bold hover:underline">
                      Apply for leave
                    </SafeLink>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
