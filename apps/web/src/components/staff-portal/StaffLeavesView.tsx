"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useStaffLeaves } from "@/hooks/useStaffPortalData";
import {
  StaffPortalEmpty,
  StaffPortalError,
  StaffPortalLoading,
  StaffStatusBadge,
} from "./StaffPortalStates";

function formatDateRange(from?: string, to?: string): string {
  const start = from ? new Date(from).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
  const end = to ? new Date(to).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
  if (start && end) return `${start} → ${end}`;
  return start || end || "—";
}

export default function StaffLeavesView() {
  const { schoolId } = useAuth();
  const { data, loading, error, refresh } = useStaffLeaves(schoolId);
  const leaves = data?.leaves ?? [];
  const pending = leaves.filter((row) =>
    String(row.status ?? "").toLowerCase().includes("pend")
  ).length;

  return (
    <div className="space-y-6 font-jost">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Leave Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit and track your leave applications. Contact HR for urgent requests.
        </p>
      </div>

      {!loading && !error ? (
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total</p>
            <p className="mt-1 text-2xl font-extrabold text-[#144835]">{leaves.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-600">{pending}</p>
          </div>
        </div>
      ) : null}

      {loading ? <StaffPortalLoading variant="list" rows={6} label="Loading leave requests" /> : null}
      {error ? <StaffPortalError message={error} onRetry={refresh} /> : null}

      {!loading && !error && leaves.length === 0 ? (
        <StaffPortalEmpty message="No leave requests found." />
      ) : null}

      {!loading && !error && leaves.length > 0 ? (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900">
                    {leave.leave_type || "Leave request"}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {formatDateRange(leave.from_date, leave.to_date)}
                    {leave.days ? ` · ${leave.days} day(s)` : ""}
                  </p>
                </div>
                <StaffStatusBadge status={leave.status} />
              </div>
              {leave.reason ? (
                <p className="mt-3 text-sm text-gray-600">{leave.reason}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
