"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  Download,
  Filter,
  RefreshCw,
  Settings2,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchLeadershipPortal } from "@/lib/portalLeadershipApi";
import { Skeleton, SkeletonPanel } from "@/components/ui/Skeleton";

type CategoryId = "academic" | "attendance" | "finance" | "staff" | "custom";

const CATEGORIES: {
  id: CategoryId;
  label: string;
  count: number;
  description: string;
  icon: typeof BookOpen;
  color: string;
}[] = [
  {
    id: "academic",
    label: "Academic",
    count: 4,
    description: "Marks, pass rates, and term performance by grade.",
    icon: BookOpen,
    color: "#144835",
  },
  {
    id: "attendance",
    label: "Attendance",
    count: 3,
    description: "Daily presence, class rates, and chronic absentees.",
    icon: CalendarCheck,
    color: "#0f766e",
  },
  {
    id: "finance",
    label: "Finance",
    count: 3,
    description: "Fee collections, balances, and payment activity.",
    icon: Wallet,
    color: "#b45309",
  },
  {
    id: "staff",
    label: "Staff",
    count: 3,
    description: "Headcount, leave status, and department coverage.",
    icon: BadgeCheck,
    color: "#1d4ed8",
  },
  {
    id: "custom",
    label: "Custom",
    count: 2,
    description: "Cross-module snapshots for leadership reviews.",
    icon: Settings2,
    color: "#7c3aed",
  },
];

type Snapshot = {
  enrolled: string;
  attendanceRate: string;
  staffCount: string;
  awaiting: string;
  academicPassRate: string;
  financeTotal: string;
};

const EMPTY: Snapshot = {
  enrolled: "—",
  attendanceRate: "—",
  staffCount: "—",
  awaiting: "—",
  academicPassRate: "—",
  financeTotal: "—",
};

export default function PrincipalReportsView() {
  const { schoolId } = useAuth();
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | CategoryId>("all");

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [dashboardBundle, attendance, finance, academic, staff] = await Promise.all([
        fetchLeadershipPortal<{
          dashboard?: { stats?: { label: string; value: string }[] };
          stats?: { label: string; value: string }[];
        }>(schoolId, "dashboard").catch(() => ({ dashboard: { stats: [] }, stats: [] })),
        fetchLeadershipPortal<{ attendanceSummary: { rate: string } }>(schoolId, "attendance", {
          date: today,
        }).catch(() => null),
        fetchLeadershipPortal<{ financeOverview: { total: string } }>(schoolId, "finance").catch(() => null),
        fetchLeadershipPortal<{ overview: { passRate: string } }>(schoolId, "academic-performance").catch(
          () => null,
        ),
        fetchLeadershipPortal<{ staffSummary: { total: number } }>(schoolId, "staff").catch(() => null),
      ]);

      const dashboardStats = dashboardBundle.dashboard?.stats ?? dashboardBundle.stats ?? [];

      const stat = (label: string) =>
        dashboardStats.find((s) => s.label.toLowerCase() === label.toLowerCase())?.value ?? "—";

      setSnap({
        enrolled: stat("Enrolled"),
        attendanceRate: attendance?.attendanceSummary.rate ?? stat("Attendance"),
        staffCount: String(staff?.staffSummary.total ?? stat("Staff")),
        awaiting: stat("Awaiting"),
        academicPassRate: academic?.overview.passRate ?? "—",
        financeTotal: finance?.financeOverview.total ?? "—",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
      setSnap(EMPTY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [schoolId]);

  const visibleCategories = useMemo(() => {
    if (filter === "all") return CATEGORIES;
    return CATEGORIES.filter((c) => c.id === filter);
  }, [filter]);

  return (
    <div className="space-y-5 font-jost">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Live intelligence hub for this branch</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#144835]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-2xl bg-[#144835] p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">Intelligence Hub</h2>
            <p className="mt-1 text-sm text-white/75">Live branch metrics for downloads and reviews</p>
          </div>
          <Filter size={18} className="text-white/80" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Enrolled", v: snap.enrolled },
            { l: "Attendance", v: snap.attendanceRate },
            { l: "Staff", v: snap.staffCount },
            { l: "Awaiting", v: snap.awaiting },
          ].map((m) => (
            <div key={m.l} className="rounded-xl bg-white/10 px-3 py-2.5">
              {loading ? (
                <Skeleton className="mb-2 h-6 w-16 bg-white/30" />
              ) : (
                <p className="text-lg font-extrabold">{m.v}</p>
              )}
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{m.l}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {(["all", ...CATEGORIES.map((c) => c.id)] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              filter === key ? "bg-[#144835] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {key === "all" ? "All" : CATEGORIES.find((c) => c.id === key)?.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visibleCategories.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div
                className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: `${c.color}22` }}
              >
                <Icon size={22} style={{ color: c.color }} />
              </div>
              <h3 className="text-base font-extrabold text-gray-900">{c.label}</h3>
              <p className="mt-0.5 text-xs font-bold" style={{ color: c.color }}>
                {c.count} reports
              </p>
              <p className="mt-2 text-sm text-gray-500">{c.description}</p>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="text-base font-extrabold text-gray-900">Quick snapshots</h3>
        {loading ? (
          <SkeletonPanel className="mt-3 p-0" rows={3} />
        ) : (
          <div className="mt-3 space-y-2">
            {[
              {
                title: "Daily Attendance Snapshot",
                meta: snap.attendanceRate,
                hint: "School-wide present/absent rate",
              },
              {
                title: "Academic Performance Overview",
                meta: snap.academicPassRate,
                hint: "Current term pass rate",
              },
              {
                title: "Fee Collection Summary",
                meta: snap.financeTotal,
                hint: "Collected this academic year",
              },
            ].map((row) => (
              <div
                key={row.title}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">{row.title}</p>
                  <p className="text-xs text-gray-500">{row.hint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#144835]">{row.meta}</span>
                  <Download size={16} className="text-[#144835]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
