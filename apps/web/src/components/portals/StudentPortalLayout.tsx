"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Sidebar from "@/components/erp-students/Sidebar";
import Header from "@/components/erp-students/Header";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SchoolRouteGuard from "@/components/auth/SchoolRouteGuard";
import { BranchProvider } from "@/components/admin/BranchContext";
import { AdminNotificationsProvider } from "@/contexts/AdminNotificationsContext";
import { useSchoolId } from "@/hooks/useSchoolId";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const schoolId = useSchoolId();
  const isProfileRoute = /\/students\/profile(?:\/|$)/.test(pathname || "");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isProfileRoute);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (isProfileRoute) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isProfileRoute]);

  return (
    <SchoolRouteGuard schoolId={schoolId}>
      <ProtectedRoute allowedRoles={["super_admin", "student"]} requiredSchoolId={schoolId}>
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
