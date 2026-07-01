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
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";
import { isAdminSidebarCollapsedRoute, isAdminStandaloneRoute } from "@/lib/admin-layout";
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
  const collapseSidebar = isAdminSidebarCollapsedRoute(pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!collapseSidebar);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (collapseSidebar) {
      setIsSidebarOpen(false);
    }
  }, [pathname, collapseSidebar]);

  return (
    <SchoolRouteGuard schoolId={schoolId}>
      <ProtectedRoute allowedRoles={ADMIN_LAYOUT_ALLOWED_ROLES} requiredSchoolId={schoolId}>
        <BranchProvider>
          <AcademicYearProvider schoolSlug={schoolId}>
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
                <main className="erp-portal flex-1 min-w-0 max-w-full overflow-x-clip p-4 sm:p-4 lg:p-8">
                  {children}
                </main>
              </div>
            </div>
          </AdminNotificationsProvider>
          </AcademicYearProvider>
        </BranchProvider>
      </ProtectedRoute>
    </SchoolRouteGuard>
  );
}
