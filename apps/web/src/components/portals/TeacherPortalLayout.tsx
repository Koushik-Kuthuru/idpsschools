"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useSchoolId } from "@/hooks/useSchoolId";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Sidebar from "@/components/erp-teachers/Sidebar";
import Header from "@/components/erp-teachers/Header";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PortalPermissionGuard from "@/components/auth/PortalPermissionGuard";
import { PortalActionProvider, PortalDomActionEnforcer } from "@/contexts/PortalActionContext";
import { TeacherPortalScopeProvider } from "@/contexts/TeacherPortalScopeContext";
import SchoolRouteGuard from "@/components/auth/SchoolRouteGuard";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const schoolId = useSchoolId();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <SchoolRouteGuard schoolId={schoolId}>
      <ProtectedRoute allowedRoles={["super_admin", "teacher"]} requiredSchoolId={schoolId}>
        <TeacherPortalScopeProvider schoolId={schoolId}>
        <PortalActionProvider schoolId={schoolId} portal="teacher">
        <PortalDomActionEnforcer schoolId={schoolId} portal="teacher" />
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
            setIsHoveredProps={setIsSidebarHovered}
          />

          <div
            className={cn(
              "flex-1 flex flex-col min-h-screen min-w-0 w-full transition-all duration-300 ease-in-out",
              isSidebarOpen || isSidebarHovered ? "lg:ml-72" : "lg:ml-20"
            )}
          >
            <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
            <main className="erp-portal flex-1 min-w-0 max-w-full overflow-x-clip p-4 sm:p-4 lg:p-8">
              <PortalPermissionGuard schoolId={schoolId} portal="teacher">
                {children}
              </PortalPermissionGuard>
            </main>
          </div>
        </div>
        </PortalActionProvider>
        </TeacherPortalScopeProvider>
      </ProtectedRoute>
    </SchoolRouteGuard>
  );
}
