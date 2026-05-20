"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Sidebar from "@/components/students/Sidebar";
import Header from "@/components/students/Header";
import { BranchProvider } from "@/components/admin/BranchContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
 const [isSidebarHovered, setIsSidebarHovered] = useState(false);
 const [mounted, setMounted] = useState(false);

 // Handle initial hydration state mismatch
 useEffect(() => {
 setIsSidebarOpen(false); // Only collapse after mount to prevent hydration mismatch
 setMounted(true);
 }, []);

 // Close mobile menu on route change
 useEffect(() => {
 setIsMobileMenuOpen(false);
 }, [pathname]);

 if (!mounted) {
 return null; // or a very minimal loading state matching the server HTML
 }

 return (
 <ProtectedRoute allowedRoles={["super_admin", "student"]} requiredSchoolId="idpskalaburagi">
 <BranchProvider>
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

 {/* Main Content Area */}
 <div className={cn(
 "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
 (isSidebarOpen || isSidebarHovered) ? "lg:ml-72" : "lg:ml-20"
 )}>
 <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />

 <main className="flex-1 p-4 sm:p-4 lg:p-8">
 {children}
 </main>
 </div>
 </div>
 </BranchProvider>
 </ProtectedRoute>
 );
}
