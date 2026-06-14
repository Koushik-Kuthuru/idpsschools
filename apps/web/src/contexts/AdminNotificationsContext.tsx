"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AdminNotification,
  buildDefaultNotifications,
  loadReadIds,
  mapFirestoreNotification,
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
    const existing = loadReadIds(schoolId);
    if (existing.size === 0) {
      const seeded = new Set(["staff-attendance-sync", "maintenance-notice"]);
      saveReadIds(schoolId, seeded);
      setReadIds(seeded);
      return;
    }
    setReadIds(existing);
  }, [schoolId]);

  useEffect(() => {
    const qRef = query(
      collection(db, "schools", schoolId, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      qRef,
      (snapshot) => {
        if (snapshot.empty) {
          setRemoteNotifications(null);
          return;
        }
        setRemoteNotifications(
          snapshot.docs.map((doc) => mapFirestoreNotification(doc.id, doc.data(), schoolId))
        );
      },
      () => {
        setRemoteNotifications(null);
      }
    );

    return () => unsubscribe();
  }, [schoolId]);

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
