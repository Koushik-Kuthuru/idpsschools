"use client";

import React from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { ArrowRight, Building2, ShieldAlert } from "lucide-react";

export default function LoginSelectionPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img src="/idps-logo.png" alt="IDPS Logo" className="h-20 w-auto drop-shadow-md" />
            </div>
            <h1 className="text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-4">
              Select Your Portal
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Please select your branch or role to continue to the correct login portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kalaburagi Portal */}
            <SafeLink 
              href="/login/kalaburagi"
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#144835] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <div className="w-14 h-14 bg-[#144835]/10 rounded-xl flex items-center justify-center mb-6 text-[#144835] group-hover:scale-110 transition-transform duration-300">
                <Building2 size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Kalaburagi</h2>
              <p className="text-gray-500 mb-8 text-sm">Login portal for IDPS Kalaburagi students, parents, and staff.</p>
              <div className="flex items-center text-[#144835] font-semibold group-hover:gap-2 transition-all">
                Access Portal <ArrowRight size={18} className="ml-1" />
              </div>
            </SafeLink>

            {/* Cherupalli Portal */}
            <SafeLink 
              href="/login/cherupalli"
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#a2c144] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <div className="w-14 h-14 bg-[#a2c144]/10 rounded-xl flex items-center justify-center mb-6 text-[#a2c144] group-hover:scale-110 transition-transform duration-300">
                <Building2 size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cherupalli</h2>
              <p className="text-gray-500 mb-8 text-sm">Login portal for IDPS Cherupalli students, parents, and staff.</p>
              <div className="flex items-center text-[#a2c144] font-semibold group-hover:gap-2 transition-all">
                Access Portal <ArrowRight size={18} className="ml-1" />
              </div>
            </SafeLink>

            {/* Super Admin Portal */}
            <SafeLink 
              href="/login/super-admin"
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-900 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <div className="w-14 h-14 bg-gray-900/10 rounded-xl flex items-center justify-center mb-6 text-gray-900 group-hover:scale-110 transition-transform duration-300">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Super Admin</h2>
              <p className="text-gray-500 mb-8 text-sm">System administration portal for cross-branch management.</p>
              <div className="flex items-center text-gray-900 font-semibold group-hover:gap-2 transition-all">
                Access Portal <ArrowRight size={18} className="ml-1" />
              </div>
            </SafeLink>
          </div>
        </div>
      </div>
    </main>
  );
}
