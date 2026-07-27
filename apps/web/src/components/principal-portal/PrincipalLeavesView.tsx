"use client";

import { useMemo, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePrincipalLeaves, type PrincipalLeaveRow } from "@/hooks/useLeadershipData";
import { updateLeadershipLeavePortal } from "@/lib/portalLeadershipApi";
import { SkeletonCard } from "@/components/ui/Skeleton";

type TabKey = "pending" | "approved" | "rejected";

const EXAMPLE_LEAVES: PrincipalLeaveRow[] = [
  {
    id: "ex-leave-1",
    name: "Anitha Reddy",
    dept: "Mathematics",
    type: "Casual Leave",
    days: "2 days",
    dates: "Jul 17 – Jul 18",
    submitted: "Today, 9:12 AM",
    status: "pending",
  },
  {
    id: "ex-leave-2",
    name: "Ravi Kumar",
    dept: "Science",
    type: "Sick Leave",
    days: "1 day",
    dates: "Jul 16",
    submitted: "Yesterday, 4:40 PM",
    status: "pending",
  },
  {
    id: "ex-leave-3",
    name: "Sravani Devi",
    dept: "English",
    type: "Personal Leave",
    days: "3 days",
    dates: "Jul 21 – Jul 23",
    submitted: "Jul 14, 11:05 AM",
    status: "pending",
  },
  {
    id: "ex-leave-4",
    name: "Mohammed Imran",
    dept: "Physical Education",
    type: "Casual Leave",
    days: "1 day",
    dates: "Jul 10",
    submitted: "Jul 9, 2:18 PM",
    status: "approved",
  },
  {
    id: "ex-leave-5",
    name: "Lakshmi Priya",
    dept: "Social Studies",
    type: "Sick Leave",
    days: "2 days",
    dates: "Jul 8 – Jul 9",
    submitted: "Jul 7, 8:50 AM",
    status: "rejected",
  },
];

export default function PrincipalLeavesView() {
  const { schoolId } = useAuth();
  const { data, loading, error, refresh, refreshing } = usePrincipalLeaves(schoolId);
  const [tab, setTab] = useState<TabKey>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localLeaves, setLocalLeaves] = useState<PrincipalLeaveRow[] | null>(null);

  const leaves = useMemo(() => {
    if (localLeaves) return localLeaves;
    const remote = data?.leaves ?? [];
    return remote.length > 0 ? remote : EXAMPLE_LEAVES;
  }, [data?.leaves, localLeaves]);

  const summary = useMemo(() => {
    return {
      pending: leaves.filter((l) => l.status === "pending").length,
      approved: leaves.filter((l) => l.status === "approved").length,
      rejected: leaves.filter((l) => l.status === "rejected").length,
    };
  }, [leaves]);

  const visible = leaves.filter((l) => l.status === tab);

  const act = async (row: PrincipalLeaveRow, status: "approved" | "rejected") => {
    if (!schoolId || busyId) return;
    setBusyId(row.id);
    try {
      if (row.id.startsWith("ex-leave-")) {
        setLocalLeaves((prev) =>
          (prev ?? leaves).map((item) => (item.id === row.id ? { ...item, status } : item)),
        );
      } else {
        await updateLeadershipLeavePortal(schoolId, row.id, status);
        await refresh();
        setLocalLeaves(null);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 font-jost">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Leave Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">Review and action staff leave requests</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#144835]"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Pending", v: summary.pending },
          { l: "Approved", v: summary.approved },
          { l: "Rejected", v: summary.rejected },
        ].map((item) => (
          <div key={item.l} className="rounded-2xl bg-[#144835] px-3 py-4 text-center text-white">
            <p className="text-2xl font-extrabold">{String(item.v).padStart(2, "0")}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/75">{item.l}</p>
          </div>
        ))}
      </div>

      <div className="flex rounded-xl bg-gray-100 p-1">
        {(["pending", "approved", "rejected"] as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize ${
              tab === key ? "bg-white text-[#144835] shadow-sm" : "text-gray-500"
            }`}
          >
            {key} ({summary[key]})
          </button>
        ))}
      </div>

      {loading && !refreshing ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No {tab} leave requests.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((row) => (
            <article key={row.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">{row.name}</h3>
                  <p className="text-xs text-gray-500">{row.dept}</p>
                </div>
                <span className="rounded-full bg-[#144835]/10 px-2.5 py-1 text-[11px] font-bold text-[#144835]">
                  {row.type} · {row.days}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-800">{row.dates}</p>
              <p className="text-xs text-gray-500">Submitted {row.submitted}</p>
              {row.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void act(row, "rejected")}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-200 py-2 text-xs font-bold text-red-600"
                  >
                    <X size={14} /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void act(row, "approved")}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#144835] py-2 text-xs font-bold text-white"
                  >
                    <Check size={14} /> Approve
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs font-bold capitalize text-[#144835]">{row.status}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
