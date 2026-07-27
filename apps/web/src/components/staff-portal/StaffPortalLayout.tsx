"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Calendar, FileText, Home, LogOut, Megaphone, Menu, User, X } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleLabel } from "@/lib/auth/roles";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function StaffSidebar({
  schoolId,
  pathname,
  user,
  role,
  logout,
  onNavigate,
  className,
}: {
  schoolId: string;
  pathname: string;
  user: ReturnType<typeof useAuth>["user"];
  role: ReturnType<typeof useAuth>["role"];
  logout: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  const nav = [
    { name: "Dashboard", href: `/schools/${schoolId}/staff`, icon: Home },
    { name: "Profile", href: `/schools/${schoolId}/staff/profile`, icon: User },
    { name: "Leaves", href: `/schools/${schoolId}/staff/leaves`, icon: Calendar },
    { name: "Announcements", href: `/schools/${schoolId}/staff/announcements`, icon: Megaphone },
    { name: "Documents", href: `/schools/${schoolId}/staff/documents`, icon: FileText },
  ];

  return (
    <aside className={cn("flex w-64 flex-col bg-[#144835] text-white", className)}>
      <div className="p-6 border-b border-white/10">
        <img src="/idps-logo.png" alt="IDPS" className="h-10 w-auto" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-white/60">Staff Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <SafeLink
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon size={16} />
              {item.name}
            </SafeLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <p className="text-xs font-bold text-white truncate">{user?.displayName}</p>
        <p className="text-[11px] text-white/50 truncate">{role ? getRoleLabel(role) : "Staff"}</p>
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

export default function StaffPortalLayout({
  children,
  schoolId,
}: {
  children: React.ReactNode;
  schoolId: string;
}) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <ProtectedRoute allowedRoles={["super_admin", "staff"]} requiredSchoolId={schoolId}>
      <div className="min-h-screen bg-[#F8FAFB] flex font-jost min-w-0">
        {isMobileMenuOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        ) : null}

        {/* Desktop sidebar */}
        <StaffSidebar
          schoolId={schoolId}
          pathname={pathname}
          user={user}
          role={role}
          logout={logout}
          className="hidden lg:flex shrink-0"
        />

        {/* Mobile drawer */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <StaffSidebar
            schoolId={schoolId}
            pathname={pathname}
            user={user}
            role={role}
            logout={logout}
            onNavigate={() => setIsMobileMenuOpen(false)}
            className="h-full shadow-xl"
          />
        </div>

        <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
          <header className="flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30 lg:hidden">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                aria-label="Open menu"
                className="shrink-0 p-1.5 text-gray-500 hover:text-[#144835]"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <span className="text-sm font-extrabold text-[#144835] truncate">Staff Portal</span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="shrink-0 text-xs font-bold text-gray-500 hover:text-[#144835]"
            >
              Sign out
            </button>
          </header>
          <main className="erp-portal flex-1 min-w-0 max-w-full overflow-x-clip p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
