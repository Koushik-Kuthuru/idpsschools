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
  children: any;
  sidebar: any;
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
    <div className="flex flex-col lg:flex-row bg-white rounded-2xl border border-gray-200 overflow-hidden font-jost" style={{ minHeight: 'calc(100vh - 8rem)' }}>


      <div className="relative flex min-h-0 flex-1">
        {mobileNavOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "fixed bottom-0 left-0 top-0 z-50 flex flex-col border-r border-gray-200 bg-[#FAFBFC] transition-all duration-300 lg:static lg:z-0",
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

          {sidebarExpanded && (
            <div className="px-3 py-3 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search settings..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:outline-none"
                />
              </div>
            </div>
          )}

          {sidebar}

          <div className="mt-auto border-t border-gray-100 p-3 lg:hidden" />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-gray-50/30">
          <div className="border-b border-gray-100 bg-white px-4 py-3 lg:hidden flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(true)} className="p-2 rounded-lg border border-gray-200 text-gray-600 bg-gray-50">
              <Menu size={18} />
            </button>
            <div className="relative flex-1">
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
