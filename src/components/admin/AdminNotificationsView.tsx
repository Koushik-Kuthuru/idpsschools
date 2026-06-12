"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Search, Settings2, XCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import { notificationIcon, notificationIconStyles } from "@/components/admin/notificationStyles";
import { useAdminNotifications } from "@/contexts/AdminNotificationsContext";
import {
  formatDateTime,
  formatRelativeTime,
  groupNotificationsByDate,
  type NotificationCategory,
} from "@/lib/adminNotifications";
import { useSchoolId } from "@/hooks/useSchoolId";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = "All Notifications" | NotificationCategory;

const tabs: Tab[] = [
  "All Notifications",
  "Academic",
  "Finance",
  "Admission",
  "Attendance",
  "HR",
  "System",
  "Settings",
];

function matchesTab(category: NotificationCategory, tab: Tab) {
  if (tab === "All Notifications") return true;
  if (tab === "HR") return category === "HR" || category === "Admin";
  return category === tab;
}

export default function AdminNotificationsView() {
  const schoolId = useSchoolId();
  const { notifications, unreadCount, markAllRead, openNotification } = useAdminNotifications();
  const [tab, setTab] = useState<Tab>("All Notifications");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchesTabFilter = matchesTab(n.category, tab);
      const matchesSearch =
        !q ||
        `${n.title} ${n.body} ${n.category}`.toLowerCase().includes(q);
      return matchesTabFilter && matchesSearch;
    });
  }, [notifications, tab, searchQuery]);

  const grouped = useMemo(() => groupNotificationsByDate(filtered), [filtered]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Notifications & Alerts"
        description="Same alerts from the header bell, grouped by date and time"
        actions={
          <>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="h-9 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors"
              title="Clear search"
            >
              <XCircle size={14} /> <span className="hidden sm:inline">Clear search</span>
            </button>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="h-9 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white hover:bg-[#144835]/90 transition-all disabled:opacity-50"
              title="Mark all as read"
            >
              <CheckCircle2 size={14} /> <span className="hidden sm:inline">Mark all read</span>
            </button>
            <span className="h-5 w-px bg-gray-200 hidden sm:block mx-1" />
            <Link
              href={`/schools/${schoolId}/admin/profile/settings`}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-[#144835] transition-colors"
              title="Notification settings"
            >
              <Settings2 size={16} />
            </Link>
          </>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((t) => {
              const active = t === tab;
              const count =
                t === "All Notifications"
                  ? notifications.length
                  : notifications.filter((n) => matchesTab(n.category, t)).length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5",
                    active
                      ? "text-[#144835] bg-white border border-gray-200"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                  )}
                >
                  {t}
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", active ? "bg-[#144835]/10 text-[#144835]" : "bg-gray-100 text-gray-500")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 space-y-6 bg-gray-50/30 min-h-[320px]">
          {grouped.length > 0 ? (
            grouped.map((group) => (
              <section key={group.label}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">{group.label}</h3>
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[11px] font-semibold text-gray-400">
                    {group.items.length} alert{group.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((n) => {
                    const Icon = notificationIcon(n.category);
                    const styles = notificationIconStyles(n.category);

                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => openNotification(n)}
                        className={cn(
                          "w-full text-left rounded-xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row gap-3 transition-all hover:border-[#144835]/30 hover:bg-[#144835]/[0.02]",
                          n.unread ? "border-l-4 border-l-[#a2c144]" : ""
                        )}
                      >
                        <div className={cn("h-9 w-9 rounded-xl border flex items-center justify-center shrink-0", styles.bg, styles.text, styles.border)}>
                          <Icon size={16} strokeWidth={2.25} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border", styles.badge)}>
                                {n.category}
                              </span>
                              <p className={cn("text-xs truncate", n.unread ? "font-bold text-gray-900" : "font-semibold text-gray-800")}>
                                {n.title}
                              </p>
                              {n.unread ? (
                                <span className="inline-flex h-2 w-2 rounded-full bg-[#a2c144] shrink-0" aria-hidden />
                              ) : null}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-gray-700">{formatRelativeTime(n.createdAt)}</p>
                              <p className="text-[11px] font-medium text-gray-400 mt-0.5">{formatDateTime(n.createdAt)}</p>
                            </div>
                          </div>

                          <p className="mt-2 text-xs font-medium text-gray-600 leading-relaxed">{n.body}</p>

                          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#144835]">
                            Open related page <ChevronRight size={12} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm font-bold text-gray-900">No notifications found</p>
              <p className="text-xs text-gray-500 mt-1">Try another tab or clear your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
