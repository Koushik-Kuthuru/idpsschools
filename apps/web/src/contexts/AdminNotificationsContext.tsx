"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminApi";
import {
  AdminNotification,
  buildDefaultNotifications,
  loadReadIds,
  saveReadIds,
  withReadState,
} from "@/lib/adminNotifications";

type AdminNotificationsContextValue = {
  notifications: AdminNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  openNotification: (notification: AdminNotification) => void;
};

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(null);

export function AdminNotificationsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpskalaburagi";
  }, [pathname]);

  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds(schoolId));
  const [remoteNotifications, setRemoteNotifications] = useState<Omit<AdminNotification, "unread">[] | null>(null);

  useEffect(() => {
    setReadIds(loadReadIds(schoolId));
  }, [schoolId]);

  useEffect(() => {
    // Students don't have admin notification APIs — keep local defaults only.
    if (pathname.includes("/students")) return;

    let cancelled = false;
    let failures = 0;
    let timer: number | null = null;

    const schedule = (ms: number) => {
      if (cancelled) return;
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(() => void load(), ms);
    };

    const load = async () => {
      try {
        const response = await adminFetch(
          `/api/admin/notifications?schoolId=${encodeURIComponent(schoolId)}`,
          { skipAuthRefresh: true }
        );
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.ok) {
          failures = 0;
          setRemoteNotifications(
            (payload.notifications ?? []) as Omit<AdminNotification, "unread">[]
          );
        } else {
          failures += 1;
        }
      } catch {
        // Auth/network blips (e.g. Supabase temporarily unreachable) — keep defaults.
        failures += 1;
      }
      // Back off while offline so we don't spam Failed to fetch overlays.
      const delay = Math.min(60_000, 15_000 * Math.max(1, failures));
      schedule(delay);
    };

    void load();
    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
    };
  }, [schoolId, pathname]);

  const baseNotifications = useMemo(() => {
    if (remoteNotifications?.length) return remoteNotifications;
    return buildDefaultNotifications(schoolId);
  }, [remoteNotifications, schoolId]);

  const notifications = useMemo(
    () => withReadState(baseNotifications, readIds),
    [baseNotifications, readIds]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const persistReadIds = useCallback(
    (next: Set<string>) => {
      setReadIds(next);
      saveReadIds(schoolId, next);
    },
    [schoolId]
  );

  const markRead = useCallback(
    (id: string) => {
      persistReadIds(new Set([...readIds, id]));
    },
    [persistReadIds, readIds]
  );

  const markAllRead = useCallback(() => {
    persistReadIds(new Set(notifications.map((n) => n.id)));
  }, [notifications, persistReadIds]);

  const openNotification = useCallback(
    (notification: AdminNotification) => {
      markRead(notification.id);
      router.push(notification.href);
    },
    [markRead, router]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      openNotification,
    }),
    [notifications, unreadCount, markRead, markAllRead, openNotification]
  );

  return (
    <AdminNotificationsContext.Provider value={value}>{children}</AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error("useAdminNotifications must be used within AdminNotificationsProvider");
  }
  return context;
}
