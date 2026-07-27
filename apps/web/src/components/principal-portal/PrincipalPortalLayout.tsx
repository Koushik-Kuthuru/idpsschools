"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { usePathname, useRouter } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Bell,
  BookOpen,
  CalendarX2,
  Home,
  LogOut,
  Menu,
  User,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPortalHomePath, isPrincipalDesignation } from "@/lib/auth/roles";
import { SkeletonAppShell } from "@/components/ui/Skeleton";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV = [
  { key: "home", name: "Home", href: (id: string) => `/schools/${id}/principal`, icon: Home },
  { key: "academics", name: "Academics", href: (id: string) => `/schools/${id}/principal/academics`, icon: BookOpen },
  { key: "staff", name: "Staff", href: (id: string) => `/schools/${id}/principal/staff`, icon: Users },
  { key: "leaves", name: "Leaves", href: (id: string) => `/schools/${id}/principal/leaves`, icon: CalendarX2 },
  { key: "profile", name: "Profile", href: (id: string) => `/schools/${id}/principal/profile`, icon: User },
] as const;

function PrincipalSidebar({
  schoolId,
  pathname,
  user,
  logout,
  onNavigate,
  className,
}: {
  schoolId: string;
  pathname: string;
  user: ReturnType<typeof useAuth>["user"];
  logout: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <aside className={cn("flex w-64 flex-col bg-[#144835] text-white", className)}>
      <div className="border-b border-white/10 p-6">
        <img src="/idps-logo.png" alt="IDPS" className="h-10 w-auto" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-white/60">Principal Portal</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV.map((item) => {
          const href = item.href(schoolId);
          const active = pathname === href;
          return (
            <SafeLink
              key={item.key}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon size={16} />
              {item.name}
            </SafeLink>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-xs font-bold text-white">{user?.displayName}</p>
        <p className="truncate text-[11px] text-white/50">Principal</p>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="mt-3 flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}

function PrincipalMobileNav({ schoolId, pathname }: { schoolId: string; pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-100 bg-white px-2 pb-safe lg:hidden">
      {NAV.map((item) => {
        const href = item.href(schoolId);
        const active = pathname === href;
        return (
          <SafeLink
            key={item.key}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <span
              className={cn(
                "flex h-9 w-11 items-center justify-center rounded-full",
                active ? "bg-[#144835]/10" : "",
              )}
            >
              <item.icon size={active ? 22 : 20} className={active ? "text-[#144835]" : "text-gray-400"} />
            </span>
            <span className={cn("text-[10px] font-bold", active ? "text-[#144835]" : "text-gray-400")}>
              {item.name}
            </span>
            {active ? <span className="h-1 w-1 rounded-full bg-[#144835]" /> : <span className="h-1 w-1" />}
          </SafeLink>
        );
      })}
    </nav>
  );
}

export default function PrincipalPortalLayout({
  children,
  schoolId,
}: {
  children: React.ReactNode;
  schoolId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, schoolId: authSchoolId, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const allowed =
      role === "super_admin" ||
      (role === "teacher" && isPrincipalDesignation(user.designation));
    if (!allowed) {
      router.push(getPortalHomePath(role, authSchoolId, user.designation));
      return;
    }
    if (role !== "super_admin" && authSchoolId !== schoolId) {
      router.push(getPortalHomePath(role, authSchoolId, user.designation));
    }
  }, [authSchoolId, loading, pathname, role, router, schoolId, user]);

  if (loading && !user) {
    return <SkeletonAppShell />;
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen min-w-0 bg-[#F8FAFB] font-jost">
      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      ) : null}

      <PrincipalSidebar
        schoolId={schoolId}
        pathname={pathname}
        user={user}
        logout={logout}
        className="hidden shrink-0 lg:flex"
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <PrincipalSidebar
          schoolId={schoolId}
          pathname={pathname}
          user={user}
          logout={logout}
          onNavigate={() => setIsMobileMenuOpen(false)}
          className="h-full shadow-xl"
        />
      </div>

      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              className="shrink-0 p-1.5 text-gray-500 hover:text-[#144835]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="truncate text-sm font-extrabold text-[#144835]">Principal Portal</span>
          </div>
          <button type="button" className="shrink-0 text-gray-500 hover:text-[#144835]">
            <Bell size={18} />
          </button>
        </header>

        <main className="erp-portal mx-auto w-full max-w-5xl flex-1 overflow-x-clip p-4 pb-24 sm:p-6 lg:max-w-none lg:p-8 lg:pb-8">
          {children}
        </main>

        <PrincipalMobileNav schoolId={schoolId} pathname={pathname} />
      </div>
    </div>
  );
}
