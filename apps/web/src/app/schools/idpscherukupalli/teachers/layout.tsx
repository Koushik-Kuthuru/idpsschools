"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Sidebar from "@/components/erp-teachers/Sidebar";
import Header from "@/components/erp-teachers/Header";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { BranchProvider } from "@/components/admin/BranchContext";
import { TeacherPortalScopeProvider } from "@/contexts/TeacherPortalScopeContext";
import { AdminNotificationsProvider } from "@/contexts/AdminNotificationsContext";
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isProfileRoute = /\/teachers\/profile(?:\/|$)/.test(pathname || "");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isProfileRoute);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (isProfileRoute) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isProfileRoute]);

  return (
    <ProtectedRoute allowedRoles={["super_admin", "teacher"]} requiredSchoolId="idpscherukupalli">
      <BranchProvider>
      <AcademicYearProvider schoolSlug="idpscherukupalli">
      <TeacherPortalScopeProvider schoolId="idpscherukupalli">
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
      </TeacherPortalScopeProvider>
      </AcademicYearProvider>
      </BranchProvider>
    </ProtectedRoute>
  );
}
