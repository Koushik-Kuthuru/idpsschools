"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
const SafeLink = Link as any;
;
import { Bell, CheckCheck, ChevronDown, ChevronRight, CircleHelp, LogOut, Menu, Settings, User, X } from "lucide-react";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import { notificationIcon, notificationIconStyles } from "@/components/admin/notificationStyles";
import { getActiveNavGroup } from "./navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import { getActiveAcademicYear } from "@/lib/activeAcademicYear";
import { useAdminNotifications } from "@/contexts/AdminNotificationsContext";
import { formatRelativeTime } from "@/lib/adminNotifications";
import { auth, db } from "@/lib/db-client";


interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function Header({ setIsMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpskalaburagi";
  }, [pathname]);

  const headerTitle = useMemo(() => {
    if (pathname.includes("/admin/profile/settings")) return "Profile Settings";
    if (pathname.includes("/admin/settings")) return "Settings";
    return getActiveNavGroup(pathname, schoolId)?.name ?? "Dashboard";
  }, [pathname, schoolId]);

  const helpHref = `/schools/${schoolId}/admin/help`;
  const settingsHref = `/schools/${schoolId}/admin/settings`;
  const profileHref = `/schools/${schoolId}/admin/profile/settings`;
  const isHelpActive = pathname.startsWith(helpHref);
  const isSettingsActive = pathname.startsWith(settingsHref);
  const isProfileActive = pathname.startsWith(profileHref);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, role } = useAuth();
  const academicYear = useAcademicYearOptional();
  const cachedYearLabel = useMemo(
    () => getActiveAcademicYear(schoolId),
    [schoolId]
  );
  const { notifications, unreadCount, markAllRead, openNotification } = useAdminNotifications();

  const handleOpenNotification = (notification: (typeof notifications)[number]) => {
    setNotificationsOpen(false);
    openNotification(notification);
  };

  const userDisplayName = useMemo(
    () => user?.displayName || user?.email?.split("@")[0] || "Branch Admin",
    [user]
  );

  const userDesignation = useMemo(() => {
    if (user?.designation) return user.designation;
    if (role === "super_admin") return "Super Administrator";
    if (role === "admin") return "Branch Administrator";
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Staff";
  }, [user?.designation, role]);

  const avatarSrc = user?.photoURL || (user as any)?.photo || null;

  const userInitials = useMemo(() => {
    return userDisplayName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [userDisplayName]);

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [notificationsOpen]);

  return (
    <>
      <header
        className={`relative h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 px-4 sm:px-6 transition-all duration-300 ${
          searchOpen ? "z-50" : "z-30"
        }`}
      >
        <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-3 lg:gap-4">
          <div className="flex items-center gap-3 min-w-0 max-w-[9rem] sm:max-w-[11rem] lg:max-w-[13rem] shrink-0">
            <button
              type="button"
              className="lg:hidden shrink-0 p-1.5 text-gray-500 hover:text-[#144835]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
            <h2 className="text-sm sm:text-lg font-bold text-[#1A1A1A] truncate">
              {headerTitle}
            </h2>
            {(academicYear?.currentYear?.name ?? cachedYearLabel) ? (
              <span className="hidden shrink-0 rounded-full bg-[#144835]/10 px-2 py-0.5 text-[10px] font-bold text-[#144835] sm:inline">
                {academicYear?.currentYear?.name ?? cachedYearLabel}
              </span>
            ) : null}
          </div>

          <div className="hidden md:flex w-full min-w-0 justify-center px-2">
            <AdminGlobalSearch
              schoolId={schoolId}
              onOpenChange={(open) => {
                setSearchOpen(open);
                if (open) {
                  setNotificationsOpen(false);
                  setUserMenuOpen(false);
                }
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0 col-start-2 md:col-start-3">
            <div className="relative">
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full ring-2 ring-white z-10 flex items-center justify-center text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setUserMenuOpen(false);
                  setNotificationsOpen((open) => !open);
                }}
                className="relative p-1.5 text-gray-400 hover:text-[#144835] transition-colors rounded-full hover:bg-gray-100"
              >
                <Bell size={18} />
              </button>
            </div>

            <SafeLink
              href={helpHref}
              aria-label="Help center"
              title="Help center"
              onClick={() => {
                setUserMenuOpen(false);
                setNotificationsOpen(false);
              }}
              className={`p-1.5 rounded-full transition-colors ${
                isHelpActive
                  ? "text-[#144835] bg-[#144835]/10"
                  : "text-gray-400 hover:text-[#144835] hover:bg-gray-100"
              }`}
            >
              <CircleHelp size={18} />
            </SafeLink>

            <SafeLink
              href={settingsHref}
              aria-label="Settings"
              title="Settings"
              onClick={() => {
                setUserMenuOpen(false);
                setNotificationsOpen(false);
              }}
              className={`p-1.5 rounded-full transition-colors ${
                isSettingsActive
                  ? "text-[#144835] bg-[#144835]/10"
                  : "text-gray-400 hover:text-[#144835] hover:bg-gray-100"
              }`}
            >
              <Settings size={18} />
            </SafeLink>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setNotificationsOpen(false);
                  setUserMenuOpen((open) => !open);
                }}
                className={`flex items-center gap-2 rounded-xl border px-1.5 py-1 transition-colors shrink-0 xl:gap-2.5 xl:max-w-[220px] ${
                  isProfileActive || userMenuOpen
                    ? "border-[#144835]/20 bg-[#144835]/5"
                    : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-[#144835] text-white flex items-center justify-center border-2 border-white shadow-sm overflow-hidden font-bold text-xs">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={userDisplayName} className="h-full w-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="min-w-0 hidden xl:block max-w-[160px] text-left">
                  <p className="text-xs font-bold text-gray-900 truncate leading-tight">{userDisplayName}</p>
                  <p className="text-[11px] font-medium text-gray-500 truncate leading-tight">{userDesignation}</p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 shrink-0 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-200 bg-white py-1 z-50 shadow-lg animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{userDisplayName}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{userDesignation}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push(profileHref);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#144835] transition-colors"
                  >
                    <User size={14} className="shrink-0" />
                    Profile
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} className="shrink-0" />
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close notifications"
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setNotificationsOpen(false)}
          />
          <aside
            role="dialog"
            aria-label="Notifications"
            className="relative h-full w-full max-w-sm bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300"
          >
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-[#144835]/10 px-2 py-0.5 text-[10px] font-bold text-[#144835]">
                        {unreadCount} unread
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                        All caught up
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tap a notification to open the related page.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setNotificationsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#144835] hover:bg-white border border-transparent hover:border-gray-200 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-[#144835] hover:bg-[#144835]/5 transition-colors"
                >
                  <CheckCheck size={14} />
                  Mark all as read
                </button>
              ) : null}
            </div>

            <ul className="flex-1 overflow-y-auto">
              {notifications.map((n) => {
                const style = notificationIconStyles(n.category);
                const Icon = notificationIcon(n.category);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(n)}
                      className={`group w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors hover:bg-gray-50/80 focus:outline-none focus-visible:bg-gray-50 ${
                        n.unread ? "bg-[#144835]/[0.03] border-l-2 border-l-[#a2c144]" : "border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.bg} ${style.text} ${style.border}`}
                        >
                          <Icon size={16} strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs leading-snug ${n.unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                              {n.title}
                            </p>
                            {n.unread ? (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#a2c144]" aria-hidden />
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold text-gray-400">{formatRelativeTime(n.createdAt)}</p>
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#144835] opacity-0 group-hover:opacity-100 transition-opacity">
                              Open <ChevronRight size={12} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/40">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  router.push(`/schools/${schoolId}/admin/notifications`);
                }}
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#144835] transition-colors"
              >
                View all notifications
                <ChevronRight size={14} />
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
