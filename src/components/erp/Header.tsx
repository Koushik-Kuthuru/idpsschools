"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { navigation } from "./navigation";

interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function Header({ setIsMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="h-20 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-30 px-6 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="lg:hidden p-2 text-gray-500 hover:text-[#144835]"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={18} />
        </button>
        <h2 className="text-xl font-bold text-[#1A1A1A] hidden sm:block">
          {navigation.find(n => n.href === pathname)?.name || "Dashboard"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#a2c144] transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 bg-gray-100/50 border border-gray-200 rounded-full py-2.5 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#a2c144]/20 focus:border-[#a2c144] transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4">
            <div className="relative">
                <span className="absolute top-0.5 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white z-10"></span>
                <button className="relative p-2 text-gray-400 hover:text-[#144835] transition-colors rounded-full hover:bg-gray-100">
                <Bell size={20} />
                </button>
            </div>
            
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-3 cursor-pointer group">
                 <div className="text-right">
                    <p className="text-xs font-bold text-gray-800 group-hover:text-[#144835] transition-colors">James Anderson</p>
                    <p className="text-xs text-gray-500">School Admin</p>
                </div>
                <div className="relative">
                     <div className="h-10 w-10 rounded-full bg-[#144835] text-white flex items-center justify-center font-bold border-2 border-white shadow-sm group-hover:border-[#a2c144] transition-colors">
                        JA
                     </div>
                     <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
            </div>
        </div>
      </div>
    </header>
  );
}
