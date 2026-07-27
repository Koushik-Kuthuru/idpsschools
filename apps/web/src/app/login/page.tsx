"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
const SafeLink = Link as any;
import { ArrowRight, Building2, ShieldAlert } from "lucide-react";

type PortalOption = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  accentSoft: string;
};

const PORTALS: PortalOption[] = [
  {
    href: "/login/kalaburagi",
    title: "Kalaburagi",
    description: "IDPS Kalaburagi students, parents, and staff.",
    icon: <Building2 size={24} />,
    accent: "#144835",
    accentSoft: "rgba(20, 72, 53, 0.1)",
  },
  {
    href: "/login/cherupalli",
    title: "Cherupalli",
    description: "IDPS Cherupalli students, parents, and staff.",
    icon: <Building2 size={24} />,
    accent: "#a2c144",
    accentSoft: "rgba(162, 193, 68, 0.12)",
  },
  {
    href: "/login/super-admin",
    title: "Super Admin",
    description: "Cross-branch system administration.",
    icon: <ShieldAlert size={24} />,
    accent: "#111827",
    accentSoft: "rgba(17, 24, 39, 0.08)",
  },
];

function LoginSelection() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <main className="min-h-[100dvh] flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-4 sm:mb-6">
              <img
                src="/idps-logo.png"
                alt="IDPS Logo"
                className="h-14 sm:h-20 w-auto drop-shadow-md"
              />
            </div>
            <h1 className="text-xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-2 sm:mb-4">
              Select Your Portal
            </h1>
            <p className="text-sm sm:text-lg text-gray-500 max-w-2xl mx-auto">
              Choose your branch or role to continue to the correct login.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
            {PORTALS.map((portal) => (
              <SafeLink
                key={portal.href}
                href={`${portal.href}${query}`}
                className="group relative flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl active:scale-[0.99] md:flex-col md:items-start md:gap-0 md:p-8 md:hover:-translate-y-1 overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 h-1 w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ backgroundColor: portal.accent }}
                />
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 md:mb-6 md:h-14 md:w-14"
                  style={{ backgroundColor: portal.accentSoft, color: portal.accent }}
                >
                  {portal.icon}
                </div>
                <div className="min-w-0 flex-1 md:flex-none">
                  <h2 className="text-base font-bold text-gray-900 sm:text-lg md:mb-2 md:text-2xl">
                    {portal.title}
                  </h2>
                  <p className="text-xs text-gray-500 sm:text-sm md:mb-8">
                    {portal.description}
                  </p>
                  <div
                    className="mt-2 hidden items-center font-semibold transition-all group-hover:gap-2 md:flex"
                    style={{ color: portal.accent }}
                  >
                    Access Portal <ArrowRight size={18} className="ml-1" />
                  </div>
                </div>
                <ArrowRight
                  size={20}
                  className="shrink-0 text-gray-300 transition-colors group-hover:text-gray-500 md:hidden"
                />
              </SafeLink>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginSelectionPage() {
  return (
    <Suspense fallback={null}>
      <LoginSelection />
    </Suspense>
  );
}
