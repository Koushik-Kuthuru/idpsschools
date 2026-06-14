"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useSchoolId } from "@/hooks/useSchoolId";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminStandaloneShell from "@/components/admin/AdminStandaloneShell";
import { BranchProvider } from "@/components/admin/BranchContext";
import { isAdminStandaloneRoute } from "@/lib/admin-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SchoolRouteGuard from "@/components/auth/SchoolRouteGuard";
import { ADMIN_LAYOUT_ALLOWED_ROLES } from "@/lib/auth/admin-portal-roles";
import { AdminNotificationsProvider } from "@/contexts/AdminNotificationsContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const schoolId = useSchoolId();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  const isStandalone = isAdminStandaloneRoute(pathname);

  if (isStandalone) {
    return (
      <SchoolRouteGuard schoolId={schoolId}>
        <ProtectedRoute allowedRoles={ADMIN_LAYOUT_ALLOWED_ROLES} requiredSchoolId={schoolId}>
          <BranchProvider>
            <AdminStandaloneShell>{children}</AdminStandaloneShell>
          </BranchProvider>
        </ProtectedRoute>
      </SchoolRouteGuard>
    );
  }

  return (
    <SchoolRouteGuard schoolId={schoolId}>
      <ProtectedRoute allowedRoles={ADMIN_LAYOUT_ALLOWED_ROLES} requiredSchoolId={schoolId}>
        <BranchProvider>
          <AdminNotificationsProvider>
            <div className="min-h-screen bg-[#F8FAFB] flex">
              {isMobileMenuOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />

              <div
                className={cn(
                  "flex-1 flex flex-col min-h-screen min-w-0 w-full transition-all duration-300 ease-in-out",
                  isSidebarOpen ? "lg:ml-72" : "lg:ml-20"
                )}
              >
                <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
                <main className="erp-portal flex-1 min-w-0 max-w-full overflow-x-hidden p-4 sm:p-4 lg:p-8">
                  {children}
                </main>
              </div>
            </div>
          </AdminNotificationsProvider>
        </BranchProvider>
      </ProtectedRoute>
    </SchoolRouteGuard>
  );
}
