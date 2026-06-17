"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X, LogOut } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { navGroups } from "./navigation";
import { useAuth } from "@/contexts/AuthContext";

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

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setIsHoveredProps,
}: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [headerHovered, setHeaderHovered] = useState(false);
  const { user, role, logout } = useAuth();

  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpskalaburagi";
  }, [pathname]);

  const dashboardHref = `/schools/${schoolId}/teachers`;
  const sidebarExpanded = isSidebarOpen || isMobileMenuOpen;

  // Dynamically resolve schoolId in href paths
  const resolvedNavGroups = useMemo(() => {
    return navGroups.map(group => ({
      ...group,
      items: group.items.map(item => {
        // Replace base hardcoded paths with dynamic schools/:schoolId/teachers path
        const resolvedHref = item.href.replace(
          /^\/(?:idpskalaburagi|idpscherukupalli|schools\/[^/]+)\/teachers/,
          `/schools/${schoolId}/teachers`
        );
        return { ...item, href: resolvedHref };
      })
    }));
  }, [schoolId]);

  const activeGroupId = useMemo(() => {
    const group = resolvedNavGroups.find((g) =>
      g.items.some((item) => {
        return pathname === item.href || (item.href !== dashboardHref && pathname.startsWith(item.href));
      })
    );
    return group?.id ?? null;
  }, [pathname, resolvedNavGroups, dashboardHref]);

  useEffect(() => {
    if (!activeGroupId) return;
    setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
  }, [activeGroupId]);

  const userInitials = useMemo(() => {
    const name = user?.displayName || user?.studentName || "Teacher";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-[#144835] to-[#0f3628] text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none rounded-r-[4px]",
        sidebarExpanded ? "w-72" : "w-20",
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Sidebar Header */}
      <div 
        className="h-16 flex items-center justify-between px-4 border-b border-white/10 relative overflow-hidden shrink-0"
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#a2c144]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Mobile menu header */}
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

        {/* Desktop expanded */}
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

        {/* Desktop minimized — centered logo, expand icon overlays on hover */}
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

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40">
        <div>
          <p className={cn(
            "px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-300",
            sidebarExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden m-0 p-0"
          )}>
            Main Menu
          </p>
          <div className="space-y-1">
            {resolvedNavGroups.map((group) => {
              const groupActive = group.items.some((item) => {
                return pathname === item.href || (item.href !== dashboardHref && pathname.startsWith(item.href));
              });
              const isOpen = !!openGroups[group.id];

              if (group.items.length === 1) {
                const item = group.items[0];
                const isActive = groupActive;
                return (
                  <SafeLink
                    key={group.id}
                    href={item.href}
                    className={cn(
                      "flex items-center py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                      sidebarExpanded ? "gap-3 px-3 justify-start" : "px-3 justify-center",
                      isActive
                        ? "bg-[#a2c144]/20 text-[#a2c144] shadow-sm border border-[#a2c144]/10"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    )}
                    title={!sidebarExpanded ? item.name : undefined}
                  >
                    <item.icon
                      size={18}
                      className={cn("shrink-0", isActive ? "text-[#a2c144]" : "text-gray-400 group-hover:text-white")}
                    />
                    <span
                      className={cn(
                        "whitespace-nowrap transition-opacity duration-300",
                        sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                      )}
                    >
                      {item.name}
                    </span>
                  </SafeLink>
                );
              }

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!sidebarExpanded) {
                        setIsSidebarOpen(true);
                        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
                        return;
                      }
                      setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }));
                    }}
                    className={cn(
                      "w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                      sidebarExpanded ? "gap-3 px-3 justify-start" : "px-3 justify-center",
                      groupActive
                        ? "bg-white/5 text-white border border-white/5"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    )}
                    title={!sidebarExpanded ? group.name : undefined}
                  >
                    <group.icon
                      size={18}
                      className={cn("shrink-0", groupActive ? "text-[#a2c144]" : "text-gray-400 group-hover:text-white")}
                    />
                    <span
                      className={cn(
                        "flex-1 text-left whitespace-nowrap transition-opacity duration-300",
                        sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                      )}
                    >
                      {group.name}
                    </span>
                    {sidebarExpanded ? (
                      <ChevronDown
                        size={14}
                        className={cn(
                          "shrink-0 transition-transform text-gray-400 group-hover:text-white",
                          isOpen ? "rotate-180" : "rotate-0"
                        )}
                      />
                    ) : null}
                  </button>

                  {sidebarExpanded && isOpen ? (
                    <div className="pl-4 space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== dashboardHref && pathname.startsWith(item.href));
                        return (
                          <SafeLink
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                              isActive
                                ? "bg-[#a2c144]/20 text-[#a2c144] shadow-sm border border-[#a2c144]/10"
                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <item.icon
                              size={18}
                              className={cn(
                                "shrink-0",
                                isActive ? "text-[#a2c144]" : "text-gray-400 group-hover:text-white"
                              )}
                            />
                            <span className="whitespace-nowrap">{item.name}</span>
                          </SafeLink>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile & Logout */}
      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0 flex flex-col gap-2">
        <SafeLink
          href={`/schools/${schoolId}/teachers/settings`}
          className={cn(
            "flex items-center px-2 py-2 hover:bg-white/5 rounded-lg transition-colors group",
            sidebarExpanded ? "gap-3 justify-start" : "justify-center"
          )}
          title={!sidebarExpanded ? "Profile Settings" : undefined}
        >
          <div className="relative shrink-0">
            {user?.photoURL || user?.photo ? (
              <img src={user.photoURL || user.photo} alt={user?.displayName || user?.studentName} className="h-10 w-10 rounded-full object-cover border-2 border-white/20 shadow-lg group-hover:border-[#a2c144] transition-colors" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[#144835] border-2 border-white/20 shadow-lg group-hover:border-[#a2c144] transition-colors flex items-center justify-center text-white font-bold">
                {userInitials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-[#0f3628] rounded-full"></div>
          </div>
          <div className={cn(
            "flex flex-col transition-opacity duration-300 min-w-0",
            sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            <span className="font-bold text-xs text-white truncate whitespace-nowrap group-hover:text-[#a2c144] transition-colors">{user?.displayName || user?.studentName || "Teacher"}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide mt-0.5 whitespace-nowrap">{role === "teacher" ? "Teacher" : "Staff"}</span>
          </div>
        </SafeLink>

        {/* Logout Button */}
        <button
          onClick={logout}
          className={cn(
            "flex items-center px-2 py-2 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-gray-300 hover:text-red-400 group w-full text-left",
            sidebarExpanded ? "gap-3 justify-start" : "justify-center"
          )}
          title={!sidebarExpanded ? "Log Out" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          <span className={cn(
            "whitespace-nowrap text-xs font-semibold transition-opacity duration-300",
            sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            Log Out
          </span>
        </button>
      </div>
    </aside>
  );
}
