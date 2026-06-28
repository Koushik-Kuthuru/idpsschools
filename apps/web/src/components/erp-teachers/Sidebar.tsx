"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getTeacherNavigation, type TeacherNavItem } from "./navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleLabel } from "@/lib/auth/roles";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  setIsHoveredProps?: (hovered: boolean) => void;
}

function NavIconBox({
  icon: Icon,
  active,
  size = 16,
}: {
  icon: TeacherNavItem["icon"];
  active: boolean;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
        active ? "bg-[#a2c144]/25 text-[#d4e887]" : "bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white/90"
      )}
    >
      <Icon size={size} strokeWidth={2.25} />
    </span>
  );
}

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setIsHoveredProps,
}: SidebarProps) {
  const pathname = usePathname();
  const [headerHovered, setHeaderHovered] = useState(false);
  const { user, role } = useAuth();

  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpscherukupalli";
  }, [pathname]);

  const navigation = useMemo(() => getTeacherNavigation(schoolId), [schoolId]);
  const dashboardHref = `/schools/${schoolId}/teachers`;
  const sidebarExpanded = isSidebarOpen || isMobileMenuOpen;

  const userInitials = useMemo(() => {
    const name = user?.displayName || user?.email || "Teacher";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  useEffect(() => {
    setIsHoveredProps?.(false);
  }, [isSidebarOpen, isMobileMenuOpen, setIsHoveredProps]);

  useEffect(() => {
    const handleCollapse = () => {
      setIsSidebarOpen(false);
      setIsMobileMenuOpen(false);
    };
    window.addEventListener("collapse-sidebar", handleCollapse);
    return () => window.removeEventListener("collapse-sidebar", handleCollapse);
  }, [setIsSidebarOpen, setIsMobileMenuOpen]);

  const roleLabel = role ? getRoleLabel(role) : "Teacher";

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-[#144835] to-[#0f3628] text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none rounded-r-[4px]",
        sidebarExpanded ? "w-72" : "w-20",
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div
        className="h-16 flex items-center justify-between px-4 border-b border-white/10 relative overflow-hidden shrink-0"
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#a2c144]/20 rounded-full blur-3xl pointer-events-none" />

        {isMobileMenuOpen ? (
          <div className="relative z-10 flex h-16 items-center justify-between gap-2 w-full">
            <SafeLink href={dashboardHref} className="flex min-w-0 items-center gap-3" aria-label="Dashboard">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white p-1">
                <img src="/idps-logo.png" alt="IDPS Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-bold leading-none tracking-wide text-white">IDPS ERP</span>
                <span className="mt-1 text-xs font-bold uppercase tracking-wide text-[#a2c144]">Teacher Portal</span>
              </div>
            </SafeLink>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        ) : null}

        {isSidebarOpen && !isMobileMenuOpen ? (
          <div className="relative z-10 hidden h-16 items-center justify-between gap-2 w-full lg:flex">
            <SafeLink href={dashboardHref} className="flex min-w-0 items-center gap-3" aria-label="Dashboard">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white p-1 transition-transform duration-200",
                  headerHovered && "scale-105"
                )}
              >
                <img src="/idps-logo.png" alt="IDPS Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-bold leading-none tracking-wide text-white whitespace-nowrap">IDPS ERP</span>
                <span className="mt-1 text-xs font-bold uppercase tracking-wide text-[#a2c144] whitespace-nowrap">
                  Teacher Portal
                </span>
              </div>
            </SafeLink>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 transition-colors duration-200 hover:border-[#a2c144]/40 hover:bg-white/15"
              aria-label="Minimize sidebar"
            >
              <PanelLeftClose size={16} className="text-[#a2c144]" />
            </button>
          </div>
        ) : null}

        {!isSidebarOpen && !isMobileMenuOpen ? (
          <div className="relative z-10 hidden h-16 items-center justify-center w-full lg:flex">
            <div className="relative h-8 w-8">
              <SafeLink
                href={dashboardHref}
                className={cn(
                  "block transition-opacity duration-200",
                  headerHovered ? "pointer-events-none opacity-0" : "opacity-100"
                )}
                aria-label="Dashboard"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white p-1">
                  <img src="/idps-logo.png" alt="IDPS Logo" className="h-full w-full object-contain" />
                </div>
              </SafeLink>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className={cn(
                  "absolute inset-0 flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-[#0f3628]/95 transition-all duration-200 hover:border-[#a2c144]/50 hover:bg-[#0f3628]",
                  headerHovered ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"
                )}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={16} className="text-[#a2c144]" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== dashboardHref && pathname.startsWith(item.href));

          return (
            <SafeLink
              key={item.name}
              href={item.href}
              onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
              className={cn(
                "group relative flex items-center rounded-xl text-[13px] font-semibold transition-all duration-200",
                sidebarExpanded ? "gap-3 px-2.5 py-2" : "justify-center p-2",
                isActive ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
              )}
              title={!sidebarExpanded ? item.name : undefined}
            >
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#a2c144]" aria-hidden />
              ) : null}
              <NavIconBox icon={item.icon} active={isActive} />
              <span
                className={cn(
                  "truncate transition-all duration-300",
                  sidebarExpanded ? "opacity-100 w-auto" : "w-0 overflow-hidden opacity-0"
                )}
              >
                {item.name}
              </span>
            </SafeLink>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/10 bg-black/20 shrink-0 flex flex-col gap-1">
        <SafeLink
          href={`/schools/${schoolId}/teachers/profile`}
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          className={cn(
            "flex items-center rounded-xl transition-colors group",
            sidebarExpanded ? "gap-3 px-2.5 py-2 hover:bg-white/5" : "justify-center p-2 hover:bg-white/5"
          )}
          title={!sidebarExpanded ? "Profile Settings" : undefined}
        >
          <div className="relative shrink-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user?.displayName || "Teacher"}
                className="h-9 w-9 rounded-full object-cover border-2 border-white/20 shadow-lg group-hover:border-[#a2c144] transition-colors"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-[#144835] border-2 border-white/20 shadow-lg group-hover:border-[#a2c144] transition-colors flex items-center justify-center text-white font-bold text-xs">
                {userInitials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-[#0f3628] rounded-full" />
          </div>
          <div
            className={cn(
              "flex flex-col transition-all duration-300 min-w-0",
              sidebarExpanded ? "opacity-100 w-auto" : "w-0 overflow-hidden opacity-0"
            )}
          >
            <span className="text-xs font-bold text-white truncate group-hover:text-[#a2c144] transition-colors">
              {user?.displayName || "Teacher"}
            </span>
            <span className="text-[11px] text-white/50 truncate mt-0.5">{roleLabel}</span>
          </div>
        </SafeLink>
      </div>
    </aside>
  );
}
