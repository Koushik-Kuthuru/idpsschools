"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildNavGroups } from "./navigation";

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

  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpskalaburagi";
  }, [pathname]);

  const navGroups = useMemo(() => buildNavGroups(schoolId), [schoolId]);
  const dashboardHref = `/schools/${schoolId}/admin`;

  const sidebarExpanded = isSidebarOpen || isMobileMenuOpen;

  const activeGroupId = useMemo(() => {
    const group = navGroups.find((g) =>
      g.items.some((item) => pathname === item.href || (item.href !== dashboardHref && pathname.startsWith(item.href)))
    );
    return group?.id ?? null;
  }, [pathname, navGroups, dashboardHref]);

  useEffect(() => {
    if (!activeGroupId) return;
    setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
  }, [activeGroupId]);

  useEffect(() => {
    setIsHoveredProps?.(false);
  }, [isSidebarOpen, setIsHoveredProps]);

  useEffect(() => {
    setHeaderHovered(false);
  }, [isSidebarOpen, isMobileMenuOpen]);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-[#144835] to-[#0f3628] text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none rounded-r-[4px]",
        sidebarExpanded ? "w-72" : "w-20",
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div
        className="relative h-16 shrink-0 border-b border-white/10"
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#a2c144]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile menu header */}
        {isMobileMenuOpen ? (
          <div className="relative z-10 flex h-16 items-center justify-between gap-2 px-4">
            <Link href={dashboardHref} className="flex min-w-0 items-center gap-3" aria-label="Dashboard">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white p-1">
                <img src="/idps-logo.png" alt="IDPS Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-bold leading-none tracking-wide text-white">IDPS ERP</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#a2c144]">Branch Admin</span>
              </div>
            </Link>
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
          <div className="relative z-10 hidden h-16 items-center justify-between gap-2 px-4 lg:flex">
            <Link href={dashboardHref} className="flex min-w-0 items-center gap-3" aria-label="Dashboard">
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
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#a2c144] whitespace-nowrap">
                  Branch Admin
                </span>
              </div>
            </Link>
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
          <div className="relative z-10 hidden h-16 items-center justify-center lg:flex">
            <div className="relative h-8 w-8">
              <Link
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
              </Link>
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

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40">
        <div>
          <p
            className={cn(
              "px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-300",
              sidebarExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden m-0 p-0"
            )}
          >
            Main Menu
          </p>
          <div className="space-y-1">
            {navGroups.map((group) => {
              const groupActive = group.items.some(
                (item) => pathname === item.href || (item.href !== dashboardHref && pathname.startsWith(item.href))
              );
              const isOpen = !!openGroups[group.id];

              if (group.items.length === 1) {
                const item = group.items[0];
                const isActive = groupActive;
                return (
                  <Link
                    key={group.id}
                    href={item.href}
                    className={cn(
                      "flex items-center py-2.5 rounded-lg text-[13px] font-medium transition-all group relative",
                      sidebarExpanded ? "gap-3 px-3 justify-start" : "px-3 justify-center",
                      isActive
                        ? "bg-[#a2c144]/20 text-[#a2c144] border border-[#a2c144]/10"
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
                  </Link>
                );
              }

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!sidebarExpanded) return;
                      setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }));
                    }}
                    className={cn(
                      "w-full flex items-center py-2.5 rounded-lg text-[13px] font-medium transition-all group relative",
                      sidebarExpanded ? "gap-3 px-3 justify-start" : "px-3 justify-center",
                      !sidebarExpanded && "cursor-default",
                      groupActive
                        ? "bg-white/5 text-white border border-white/5"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    )}
                    title={!sidebarExpanded ? `${group.name} — expand sidebar to open` : undefined}
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
                        const isActive =
                          pathname === item.href || (item.href !== dashboardHref && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                              isActive
                                ? "bg-[#a2c144]/20 text-[#a2c144] border border-[#a2c144]/10"
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
                          </Link>
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

      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
        <Link
          href={`/schools/${schoolId}/admin/settings`}
          className={cn(
            "flex items-center px-2 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group",
            sidebarExpanded ? "gap-3 justify-start" : "justify-center"
          )}
          title={!sidebarExpanded ? "Settings" : undefined}
        >
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full bg-[#144835] border-2 border-white/20 group-hover:border-[#a2c144] transition-colors flex items-center justify-center text-white font-bold">
              BA
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-[#0f3628] rounded-full" />
          </div>
          <div
            className={cn(
              "flex flex-col transition-opacity duration-300 min-w-0",
              sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            <span className="font-bold text-xs text-white truncate group-hover:text-[#a2c144] transition-colors whitespace-nowrap">
              Branch Admin
            </span>
            <span className="text-xs text-gray-400 truncate whitespace-nowrap">admin@school.edu</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
