"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Home, LogOut, User } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleLabel } from "@/lib/auth/roles";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const nav = [
    { name: "Dashboard", href: `/schools/${schoolId}/staff`, icon: Home },
    { name: "Profile", href: `/schools/${schoolId}/staff/profile`, icon: User },
  ];

  return (
    <ProtectedRoute allowedRoles={["super_admin", "staff"]} requiredSchoolId={schoolId}>
      <div className="min-h-screen bg-[#F8FAFB] flex font-jost">
        <aside className="hidden lg:flex w-64 flex-col bg-[#144835] text-white">
          <div className="p-6 border-b border-white/10">
            <img src="/idps-logo.png" alt="IDPS" className="h-10 w-auto" />
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-white/60">Staff Portal</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                    active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <p className="text-xs font-bold text-white truncate">{user?.displayName}</p>
            <p className="text-[11px] text-white/50 truncate">{role ? getRoleLabel(role) : "Staff"}</p>
            <button
              type="button"
              onClick={() => logout()}
              className="mt-3 flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="lg:hidden flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-extrabold text-[#144835]">Staff Portal</span>
            <button type="button" onClick={() => logout()} className="text-xs font-bold text-gray-500">
              Sign out
            </button>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
