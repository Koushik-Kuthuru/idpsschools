"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminStandaloneShell from "@/components/admin/AdminStandaloneShell";
import { BranchProvider } from "@/components/admin/BranchContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ADMIN_LAYOUT_ALLOWED_ROLES } from "@/lib/auth/admin-portal-roles";
import { isAdminStandaloneRoute } from "@/lib/admin-layout";
import { AdminNotificationsProvider } from "@/contexts/AdminNotificationsContext";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const pathname = usePathname();
 const [isSidebarOpen, setIsSidebarOpen] = useState(true);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [mounted, setMounted] = useState(false);

 // Handle initial hydration state mismatch
 useEffect(() => {

 setMounted(true);
 }, []);

 // Close mobile menu on route change
 useEffect(() => {
 setIsMobileMenuOpen(false);
 }, [pathname]);

 if (!mounted) {
 return null; // or a very minimal loading state matching the server HTML
 }

 const isStandalone = isAdminStandaloneRoute(pathname);

 if (isStandalone) {
 return (
 <ProtectedRoute allowedRoles={ADMIN_LAYOUT_ALLOWED_ROLES} requiredSchoolId="idpskalaburagi">
 <BranchProvider>
 <AdminStandaloneShell>{children}</AdminStandaloneShell>
 </BranchProvider>
 </ProtectedRoute>
 );
 }

 return (
 <ProtectedRoute allowedRoles={ADMIN_LAYOUT_ALLOWED_ROLES} requiredSchoolId="idpskalaburagi">
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

 {/* Main Content Area */}
 <div className={cn(
 "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
 isSidebarOpen ? "lg:ml-72" : "lg:ml-20"
 )}>
 <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />

 <main className="erp-portal flex-1 p-4 sm:p-4 lg:p-8">
 {children}
 </main>
 </div>
 </div>
 </AdminNotificationsProvider>
 </BranchProvider>
 </ProtectedRoute>
 );
}
