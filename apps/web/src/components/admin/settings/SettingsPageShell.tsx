"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CircleHelp,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  X,
  Menu,
  CheckCircle2,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminNotifications } from "@/contexts/AdminNotificationsContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SettingsPageShellProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  saved?: boolean;
};

export default function SettingsPageShell({
  children,
  sidebar,
  searchQuery,
  onSearchChange,
  isSidebarOpen,
  setIsSidebarOpen,
  mobileNavOpen,
  setMobileNavOpen,
  saved,
}: SettingsPageShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useAdminNotifications();

  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpskalaburagi";
  }, [pathname]);

  const dashboardHref = `/schools/${schoolId}/admin`;
  const helpHref = `/schools/${schoolId}/admin/help`;
  const profileHref = `/schools/${schoolId}/admin/profile/settings`;

  const userInitials = useMemo(() => {
    const name = user?.displayName || user?.email?.split("@")[0] || "Admin";
    return name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const sidebarExpanded = isSidebarOpen || mobileNavOpen;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8FAFB] font-jost">
      <header className="z-40 flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:gap-4 sm:px-6">
        <button
          type="button"
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open settings menu"
        >
          <Menu size={18} />
        </button>

        <Link href={dashboardHref} className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <img src="/idps-logo.png" alt="IDPS" className="h-full w-full object-contain" />
          </div>
          <span className="text-base font-bold tracking-tight text-gray-900">Settings</span>
        </Link>

        <div className="mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search settings..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/80 pl-9 pr-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#144835]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#144835]/10"
            />
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          {saved ? (
            <span className="mr-2 hidden items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
              <CheckCircle2 size={12} /> Saved
            </span>
          ) : null}

          <Link
            href={dashboardHref}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#144835]"
            title="Back to dashboard"
          >
            <CalendarDays size={17} />
          </Link>

          <Link
            href={helpHref}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#144835]"
            title="Help center"
          >
            <CircleHelp size={17} />
          </Link>

          <button
            type="button"
            className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#144835]"
            title="Notifications"
          >
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            ) : null}
            <Bell size={17} />
          </button>

          <span className="rounded-lg bg-[#144835]/10 p-2 text-[#144835]" title="Settings">
            <Settings size={17} />
          </span>

          <Link
            href={profileHref}
            className="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#144835] text-[10px] font-bold text-white ring-2 ring-white"
            title="Profile"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              userInitials
            )}
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {mobileNavOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "fixed bottom-0 left-0 top-14 z-50 flex flex-col border-r border-gray-200 bg-[#FAFBFC] transition-all duration-300 lg:static lg:top-auto lg:z-0",
            sidebarExpanded ? "w-[260px]" : "w-[68px]",
            mobileNavOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="border-b border-gray-100 px-3 py-4">
            {sidebarExpanded ? (
              <div className="flex items-start justify-between gap-2 px-1">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#144835]/10 text-[#144835]">
                    <Layers size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">Setup</p>
                    <p className="text-xs leading-snug text-gray-500">Configure your school workspace</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => (mobileNavOpen ? setMobileNavOpen(false) : setIsSidebarOpen(false))}
                  className="hidden rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 lg:flex"
                  aria-label="Minimize sidebar"
                >
                  <PanelLeftClose size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#144835]/10 text-[#144835]">
                  <Layers size={17} />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen size={16} />
                </button>
              </div>
            )}
          </div>

          {sidebar}

          <div className="mt-auto border-t border-gray-100 p-3 lg:hidden" />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#F8FAFB]">
          <div className="border-b border-gray-100 bg-white px-4 py-3 md:hidden">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search settings..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm focus:border-[#144835]/40 focus:outline-none focus:ring-2 focus:ring-[#144835]/10"
              />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
