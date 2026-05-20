"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Menu, MapPin, LogOut } from "lucide-react";
import { flatNav } from "./navigation";
import { useBranch } from "./BranchContext";
import { auth } from "@/lib/firebase";

interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function Header({ setIsMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { branches, activeBranch, setActiveBranchId } = useBranch();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="lg:hidden p-1.5 text-gray-500 hover:text-[#144835]"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={18} />
        </button>
        <h2 className="text-sm sm:text-lg font-bold text-[#1A1A1A] max-w-[55vw] sm:max-w-none truncate">
          {flatNav.find((n) => pathname === n.href || (n.href !== "/schools/idpskalaburagi/admin" && pathname.startsWith(n.href)))?.name ||
            "Dashboard"}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#a2c144] transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 bg-gray-100/50 border border-gray-200 rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#a2c144]/20 focus:border-[#a2c144] transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
              <MapPin size={12} className="text-[#144835]" />
              {branches.length > 1 ? (
                <select
                  value={activeBranch.id}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-gray-800 focus:outline-none cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.city ? ` (${b.city})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[10px] font-bold text-gray-800">
                  {activeBranch.name}{activeBranch.city ? ` (${activeBranch.city})` : ""}
                </span>
              )}
            </div>

            <div className="relative">
                <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-red-500 rounded-full ring-2 ring-white z-10"></span>
                <button className="relative p-1.5 text-gray-400 hover:text-[#144835] transition-colors rounded-full hover:bg-gray-100">
                <Bell size={18} />
                </button>
            </div>
            
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2 cursor-pointer group" onClick={handleLogout} title="Sign Out">
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-800 group-hover:text-[#144835] transition-colors">Sign Out</p>
                    <p className="text-[10px] text-gray-500">Manager</p>
                </div>
                <div className="relative">
                     <div className="h-8 w-8 rounded-full bg-[#144835] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm group-hover:bg-red-500 transition-colors">
                        <LogOut size={14} />
                     </div>
                </div>
            </div>
        </div>
      </div>
    </header>
  );
}
