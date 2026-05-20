"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { navGroups } from "./navigation";

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
  const [isHovered, setIsHovered] = React.useState(false);

  const sidebarExpanded = isSidebarOpen || isHovered;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (setIsHoveredProps) setIsHoveredProps(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (setIsHoveredProps) setIsHoveredProps(false);
  };

  const activeGroupId = useMemo(() => {
    const group = navGroups.find((g) =>
      g.items.some((item) => pathname === item.href || (item.href !== "/idpskalaburagi/teachers" && pathname.startsWith(item.href)))
    );
    return group?.id ?? null;
  }, [pathname]);

  useEffect(() => {
    if (!activeGroupId) return;
    setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
  }, [activeGroupId]);

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-[#144835] to-[#0f3628] text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none rounded-r-[4px]",
        sidebarExpanded ? "w-72" : "w-20",
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#a2c144]/20 rounded-full blur-3xl pointer-events-none"></div>

        <Link
          href="/idpskalaburagi/teachers"
          onClick={(e) => {
            if (!sidebarExpanded) {
              e.preventDefault();
              setIsSidebarOpen(true);
            }
          }}
          className="flex items-center gap-3 overflow-hidden relative z-10"
        >
          <div className="w-8 h-8 bg-white rounded-lg border border-white/20 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
            <img src="/idps-logo.png" alt="IDPS Logo" className="w-full h-full object-contain" />
          </div>
          <div className={cn(
            "flex flex-col transition-opacity duration-300",
            sidebarExpanded ? "opacity-100 delay-100" : "opacity-0 w-0 overflow-hidden lg:hidden"
          )}>
            <span className="font-bold text-sm tracking-wide leading-none text-white whitespace-nowrap">IDPS ERP</span>
            <span className="text-[10px] text-[#a2c144] uppercase tracking-widest mt-1 whitespace-nowrap">Branch Admin</span>
          </div>
        </Link>
        {sidebarExpanded && !isHovered ? (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors hidden lg:flex items-center justify-center relative z-10 shrink-0"
            type="button"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        ) : null}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white lg:hidden relative z-10"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40">
        <div>
          <p className={cn(
            "px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-300",
            sidebarExpanded ? "opacity-100 delay-100" : "opacity-0 h-0 overflow-hidden m-0 p-0 lg:hidden"
          )}>
            Main Menu
          </p>
          <div className="space-y-1">
            {navGroups.map((group) => {
              const groupActive = group.items.some(
                (item) => pathname === item.href || (item.href !== "/idpskalaburagi/teachers" && pathname.startsWith(item.href))
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
                        ? "bg-[#a2c144]/20 text-[#a2c144] shadow-sm border border-[#a2c144]/10"
                        : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"
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
                        sidebarExpanded ? "opacity-100 delay-100" : "opacity-0 w-0 overflow-hidden lg:hidden"
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
                        if (!sidebarExpanded) {
                          setIsSidebarOpen(true);
                          setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
                          return;
                        }
                        setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }));
                      }}
                      className={cn(
                        "w-full flex items-center py-2.5 rounded-lg text-[13px] font-medium transition-all group relative",
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
                        sidebarExpanded ? "opacity-100 delay-100" : "opacity-0 w-0 overflow-hidden lg:hidden"
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
                          pathname === item.href || (item.href !== "/idpskalaburagi/teachers" && pathname.startsWith(item.href));
                        return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                                isActive
                                  ? "bg-[#a2c144]/20 text-[#a2c144] shadow-sm border border-[#a2c144]/10"
                                  : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"
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
          href="/idpskalaburagi/settings"
          className={cn(
            "flex items-center px-2 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group",
            sidebarExpanded ? "gap-3 justify-start" : "justify-center"
          )}
        >
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full bg-[#144835] border-2 border-white/20 shadow-lg group-hover:border-[#a2c144] transition-colors flex items-center justify-center text-white font-bold">
              BA
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-[#0f3628] rounded-full"></div>
          </div>
          <div className={cn(
            "flex flex-col transition-opacity duration-300",
            sidebarExpanded ? "opacity-100 delay-100" : "opacity-0 w-0 overflow-hidden lg:hidden"
          )}>
            <span className="font-bold text-xs text-white truncate group-hover:text-[#a2c144] transition-colors whitespace-nowrap">Branch Admin</span>
            <span className="text-xs text-gray-400 truncate whitespace-nowrap">admin@school.edu</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
