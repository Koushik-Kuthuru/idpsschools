"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildNavGroups, type NavGroup } from "./navigation";
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

function isItemActive(pathname: string, href: string, dashboardHref: string) {
  return pathname === href || (href !== dashboardHref && pathname.startsWith(href));
}

function NavIconBox({
  icon: Icon,
  active,
  size = 16,
}: {
  icon: NavGroup["icon"];
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [headerHovered, setHeaderHovered] = useState(false);
  const { user } = useAuth();

  const userInitials = useMemo(() => {
    if (!user) return "BA";
    const name = user.displayName || user.email || "Branch Admin";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpskalaburagi";
  }, [pathname]);

  const navGroups = useMemo(() => buildNavGroups(schoolId), [schoolId]);
  const dashboardHref = `/schools/${schoolId}/admin`;

  const sidebarExpanded = isSidebarOpen || isMobileMenuOpen;

  const activeGroupId = useMemo(() => {
    const group = navGroups.find((g) =>
      g.items.some((item) => isItemActive(pathname, item.href, dashboardHref))
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

  useEffect(() => {
    const handleCollapse = () => {
      setIsSidebarOpen(false);
      setIsMobileMenuOpen(false);
    };
    window.addEventListener('collapse-sidebar', handleCollapse);
    return () => window.removeEventListener('collapse-sidebar', handleCollapse);
  }, [setIsSidebarOpen, setIsMobileMenuOpen]);

  const toggleGroup = (groupId: string) => {
    if (!sidebarExpanded) {
      setIsSidebarOpen(true);
      setOpenGroups((prev) => ({ ...prev, [groupId]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const mainGroups = navGroups.filter((g) => g.id !== "settings");
  const settingsGroup = navGroups.find((g) => g.id === "settings");

  const renderSingleItem = (group: NavGroup) => {
    const item = group.items[0];
    const isActive = isItemActive(pathname, item.href, dashboardHref);

    return (
      <Link
        key={group.id}
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
      </Link>
    );
  };

  const renderGroup = (group: NavGroup) => {
    const groupActive = group.items.some((item) => isItemActive(pathname, item.href, dashboardHref));
    const isOpen = !!openGroups[group.id];

    return (
      <div key={group.id} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          className={cn(
            "group relative flex w-full items-center rounded-xl text-[13px] font-semibold transition-all duration-200",
            sidebarExpanded ? "gap-3 px-2.5 py-2" : "justify-center p-2",
            groupActive ? "bg-white/8 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
          )}
          title={!sidebarExpanded ? group.name : undefined}
          aria-expanded={sidebarExpanded ? isOpen : undefined}
        >
          {groupActive ? (
            <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#a2c144]/80" aria-hidden />
          ) : null}
          <NavIconBox icon={group.icon} active={groupActive} />
          <span
            className={cn(
              "flex-1 truncate text-left transition-all duration-300",
              sidebarExpanded ? "opacity-100 w-auto" : "w-0 overflow-hidden opacity-0"
            )}
          >
            {group.name}
          </span>
          {sidebarExpanded ? (
            <ChevronDown
              size={14}
              className={cn(
                "shrink-0 text-white/40 transition-transform duration-200 group-hover:text-white/70",
                isOpen && "rotate-180"
              )}
            />
          ) : null}
        </button>

        {sidebarExpanded && isOpen ? (
          <div className="ml-5 border-l border-white/10 py-1 pl-3">
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = isItemActive(pathname, item.href, dashboardHref);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
                    className={cn(
                      "relative flex items-center rounded-lg py-2 pl-3 pr-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-[#a2c144]/15 text-[#d4e887] before:absolute before:left-0 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-x-[calc(50%+1px)] before:-translate-y-1/2 before:rounded-full before:bg-[#a2c144]"
                        : "text-white/55 hover:bg-white/5 hover:text-white/90"
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-white/10 bg-gradient-to-b from-[#144835] via-[#123d2e] to-[#0d2e22] text-white transition-all duration-300 ease-in-out",
        sidebarExpanded ? "w-72" : "w-20",
        isMobileMenuOpen ? "w-72 translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"
      )}
    >
      <div
        className="relative h-16 shrink-0 border-b border-white/10"
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div className="pointer-events-none absolute -right-6 top-0 h-24 w-24 rounded-full bg-[#a2c144]/15 blur-2xl" />

        {isMobileMenuOpen ? (
          <div className="relative z-10 flex h-16 items-center justify-between gap-2 px-4">
            <Link href={dashboardHref} className="flex min-w-0 items-center gap-3" aria-label="Dashboard">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white p-1 shadow-sm">
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
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        ) : null}

        {isSidebarOpen && !isMobileMenuOpen ? (
          <div className="relative z-10 hidden h-16 items-center justify-between gap-2 px-4 lg:flex">
            <Link href={dashboardHref} className="flex min-w-0 items-center gap-3" aria-label="Dashboard">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white p-1 shadow-sm transition-transform duration-200",
                  headerHovered && "scale-105"
                )}
              >
                <img src="/idps-logo.png" alt="IDPS Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="whitespace-nowrap text-sm font-bold leading-none tracking-wide text-white">IDPS ERP</span>
                <span className="mt-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-[#a2c144]">
                  Branch Admin
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 transition-colors duration-200 hover:border-[#a2c144]/40 hover:bg-white/10"
              aria-label="Minimize sidebar"
            >
              <PanelLeftClose size={16} className="text-[#a2c144]" />
            </button>
          </div>
        ) : null}

        {!isSidebarOpen && !isMobileMenuOpen ? (
          <div className="relative z-10 hidden h-16 items-center justify-center lg:flex">
            <div className="relative h-9 w-9">
              <Link
                href={dashboardHref}
                className={cn(
                  "block transition-opacity duration-200",
                  headerHovered ? "pointer-events-none opacity-0" : "opacity-100"
                )}
                aria-label="Dashboard"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white p-1 shadow-sm">
                  <img src="/idps-logo.png" alt="IDPS Logo" className="h-full w-full object-contain" />
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className={cn(
                  "absolute inset-0 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#0f3628]/95 transition-all duration-200 hover:border-[#a2c144]/50 hover:bg-[#0f3628]",
                  headerHovered ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                )}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={16} className="text-[#a2c144]" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto px-2.5 py-4 scrollbar-thin scrollbar-thumb-white/15 hover:scrollbar-thumb-white/30"
        aria-label="Admin navigation"
      >
        <div className="space-y-1">
          {mainGroups.map((group) =>
            group.items.length === 1 ? renderSingleItem(group) : renderGroup(group)
          )}
        </div>

        {settingsGroup ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            {settingsGroup.items.length === 1
              ? renderSingleItem(settingsGroup)
              : renderGroup(settingsGroup)}
          </div>
        ) : null}
      </nav>

      <div className="shrink-0 border-t border-white/10 bg-black/15 p-3">
        <Link
          href={`/schools/${schoolId}/admin/profile/settings`}
          className={cn(
            "group flex cursor-pointer items-center rounded-xl px-2 py-2 transition-colors hover:bg-white/5",
            sidebarExpanded ? "gap-3" : "justify-center"
          )}
          title={!sidebarExpanded ? "Profile Settings" : undefined}
        >
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white/15 bg-[#144835] text-xs font-bold text-white transition-colors group-hover:border-[#a2c144]/60">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0f3628] bg-emerald-400" />
          </div>
          <div
            className={cn(
              "flex min-w-0 flex-col transition-all duration-300",
              sidebarExpanded ? "opacity-100" : "w-0 overflow-hidden opacity-0"
            )}
          >
            <span className="truncate text-xs font-bold text-white transition-colors group-hover:text-[#d4e887]">
              {user?.displayName || "Branch Admin"}
            </span>
            <span className="truncate text-[11px] text-white/45">{user?.email || "admin@school.edu"}</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
