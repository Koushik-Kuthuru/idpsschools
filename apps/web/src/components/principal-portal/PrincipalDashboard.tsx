"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CheckSquare,
  Megaphone,
  Plus,
  RefreshCw,
  School,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePrincipalDashboard, usePrincipalLeaves } from "@/hooks/useLeadershipData";
import { formatAcademicTermLine } from "@/lib/academicTerm";
import {
  updateLeadershipLeavePortal,
  type PrincipalPriorityApproval,
} from "@/lib/portalLeadershipApi";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "ST"
  );
}

const QUICK_MODULES = [
  { label: "Attendance", hint: "School overview", icon: CheckSquare, href: "attendance" },
  { label: "Communication", hint: "Announcements", icon: Megaphone, href: "communication" },
  { label: "Substitutions", hint: "For the class", icon: RefreshCw, href: "substitutions" },
] as const;

export default function PrincipalDashboard() {
  const { user, schoolId } = useAuth();
  const { data, loading, error, refresh, refreshing } = usePrincipalDashboard(schoolId);
  const leavesQuery = usePrincipalLeaves(schoolId);
  const [metaLine, setMetaLine] = useState(() => formatAcademicTermLine());
  const [approvals, setApprovals] = useState<PrincipalPriorityApproval[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const dashboard = data?.dashboard;
  const stats = dashboard?.stats ?? [];
  const posts = dashboard?.latestPosts ?? [];
  const agendaItems = dashboard?.agendaItems ?? [];

  useEffect(() => {
    const fromDashboard = (dashboard?.priorityApprovals ?? []).filter((item) => item.type === "leave");
    const fromLeaves = (leavesQuery.data?.leaves ?? [])
      .filter((leave) => leave.status === "pending")
      .map((leave) => ({
        id: leave.id,
        initials: initialsFromName(leave.name),
        name: leave.name,
        detail: `${leave.type} · ${leave.dates}`,
        type: "leave" as const,
      }));
    const byId = new Map<string, PrincipalPriorityApproval>();
    [...fromDashboard, ...fromLeaves].forEach((item) => byId.set(item.id, item));
    setApprovals(Array.from(byId.values()).slice(0, 8));
  }, [dashboard?.priorityApprovals, leavesQuery.data?.leaves]);

  const displayStats = useMemo(() => {
    if (stats.length === 0) {
      return [
        { label: "Enrolled", value: "—", highlight: false },
        { label: "Attendance", value: "—", highlight: false },
        { label: "Staff", value: "—", highlight: false },
        { label: "Awaiting", value: String(approvals.length), highlight: approvals.length > 0 },
      ];
    }
    return stats.map((stat) =>
      stat.label === "Awaiting"
        ? { ...stat, value: String(approvals.length), highlight: approvals.length > 0 }
        : stat,
    );
  }, [approvals.length, stats]);

  const displayName = useMemo(() => {
    const full = user?.displayName?.trim();
    if (!full) return "Principal";
    const parts = full.split(" ").filter(Boolean);
    return parts.length > 1 ? parts.slice(-2).join(" ") : full;
  }, [user?.displayName]);

  const handleRefresh = async () => {
    setMetaLine(formatAcademicTermLine());
    setActionError(null);
    await Promise.all([refresh(), leavesQuery.refresh()]);
  };

  const handleLeaveAction = async (
    item: PrincipalPriorityApproval,
    status: "approved" | "rejected",
  ) => {
    if (!schoolId || busyId) return;
    setBusyId(item.id);
    setActionError(null);
    try {
      await updateLeadershipLeavePortal(schoolId, item.id, status);
      setApprovals((prev) => prev.filter((row) => row.id !== item.id));
      await Promise.all([refresh(), leavesQuery.refresh()]);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Failed to ${status === "approved" ? "approve" : "reject"} leave`,
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 font-jost">
      <div className="hidden items-start justify-between lg:flex">
        <div>
          <h1 className="text-lg font-extrabold text-[#144835]">International Delhi Public School</h1>
          <p className="text-sm font-medium text-gray-500">Principal</p>
        </div>
        <button type="button" className="rounded-xl p-2 text-[#144835] hover:bg-[#144835]/5">
          <Bell size={20} />
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-[#144835] p-5 text-white">
        <p className="text-sm opacity-90">{getGreeting()},</p>
        <p className="text-2xl font-extrabold">{displayName} 👋</p>
        <p className="mt-1 text-xs font-medium opacity-80">{metaLine}</p>
        <School className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 text-white/10" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-gray-900">Quick Pulse</h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#144835] disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error || actionError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {actionError || error}
        </div>
      ) : null}

      <div className="-mx-1 flex gap-3 overflow-x-auto pb-1">
        {displayStats.map((stat) => (
          <div
            key={stat.label}
            className={`min-w-[140px] shrink-0 rounded-xl border p-4 ${
              stat.highlight
                ? "border-amber-200 bg-amber-50"
                : "border-gray-100 bg-white shadow-sm"
            }`}
          >
            <p className="text-xs font-bold text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-[#144835]">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-gray-900">Priority Approvals</h2>
          {approvals.length > 0 ? (
            <span className="text-xs font-bold text-[#144835]">{approvals.length} pending</span>
          ) : null}
        </div>
        {approvals.length === 0 ? (
          <p className="mt-2 text-sm italic text-gray-400">
            No pending leave approvals — you&apos;re all caught up.
          </p>
        ) : (
          <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-1">
            {approvals.map((item) => {
              const busy = busyId === item.id;
              return (
                <div
                  key={item.id}
                  className="min-w-[280px] shrink-0 rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#144835]/10 text-sm font-bold text-[#144835]">
                      {item.initials || item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{item.name}</p>
                      <p className="truncate text-xs text-gray-500">{item.detail}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 border-t border-gray-100 text-center text-xs font-bold">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleLeaveAction(item, "rejected")}
                      className="py-3 text-red-600 disabled:opacity-50"
                    >
                      {busy ? "…" : "Reject"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleLeaveAction(item, "approved")}
                      className="border-l border-gray-100 py-3 text-[#144835] disabled:opacity-50"
                    >
                      {busy ? "…" : "Approve"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-gray-900">Today&apos;s Agenda</h2>
          <Calendar size={18} className="text-[#144835]" />
        </div>
        <div className="mt-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          {agendaItems.length === 0 ? (
            <p className="text-sm italic text-gray-400">No events scheduled for today.</p>
          ) : (
            <div className="space-y-4">
              {agendaItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 rounded-full border-2 border-white bg-[#144835] ring-2 ring-[#144835]/20" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.location}</p>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-[#144835]">{item.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-extrabold text-gray-900">Performance Health</h2>
        <div className="mt-3 grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col items-center gap-2 px-2 text-center">
            <p className="text-xs font-bold text-gray-500">Attendance</p>
            <div className="flex h-10 items-end gap-0.5">
              {[3, 5, 4, 7].map((h, i) => (
                <span key={i} className="w-1 rounded-sm bg-[#144835]/70" style={{ height: `${h * 3}px` }} />
              ))}
            </div>
            <p className="text-sm font-extrabold text-[#144835]">+2.4%</p>
          </div>
          <div className="flex flex-col items-center gap-2 px-2 text-center">
            <p className="text-xs font-bold text-gray-500">Academics</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#144835]/20 text-[10px] font-extrabold">
              88%
            </div>
            <p className="text-sm font-extrabold text-gray-800">Target</p>
          </div>
          <div className="flex flex-col items-center gap-2 px-2 text-center">
            <p className="text-xs font-bold text-gray-500">Discipline</p>
            <div className="flex h-10 items-end gap-1">
              <span className="w-3 rounded-t bg-red-300" style={{ height: "32px" }} />
              <span className="w-3 rounded-t bg-[#144835]/70" style={{ height: "40px" }} />
            </div>
            <p className="text-sm font-extrabold text-[#144835]">Stable</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-gray-900">Latest Posts</h2>
          <button type="button" className="text-sm font-bold text-[#144835]">
            See all
          </button>
        </div>
        {posts.length === 0 ? (
          <p className="mt-2 text-sm italic text-gray-400">No posts yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {posts.slice(0, 2).map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Megaphone size={18} className="text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-gray-900">{post.title}</p>
                    {post.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#144835]" /> : null}
                  </div>
                  <p className="truncate text-xs text-gray-500">{post.preview}</p>
                  <p className="text-[11px] text-gray-400">{post.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-extrabold text-gray-900">Quick Access</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_MODULES.map((module, index) => {
            const accents = ["#144835", "#0d9488", "#b45309"] as const;
            const accent = accents[index % accents.length];
            return (
              <button
                key={module.label}
                type="button"
                className="flex flex-col items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#144835]/25 hover:shadow-md"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  <module.icon size={22} />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-gray-900">{module.label}</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-gray-500">{module.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#144835] text-white shadow-lg lg:bottom-8 lg:right-8"
        aria-label="Create announcement"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
