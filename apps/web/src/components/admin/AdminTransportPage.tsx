"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import AdminTransportBusesTab from "@/components/admin/AdminTransportBusesTab";
import AdminTransportRoutesTab from "@/components/admin/AdminTransportRoutesTab";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = ["Buses", "Routes"] as const;
type TransportTab = (typeof TABS)[number];

function tabFromParam(value: string | null): TransportTab {
  return value?.toLowerCase() === "routes" ? "Routes" : "Buses";
}

export default function AdminTransportPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TransportTab>(() =>
    tabFromParam(searchParams.get("tab"))
  );

  useEffect(() => {
    setActiveTab(tabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Transport"
        description="School fleet — buses, routes, and route fees"
      />

      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap border-b-2",
              activeTab === tab
                ? "bg-[#144835]/5 text-[#144835] border-[#144835]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Buses" ? (
        <AdminTransportBusesTab />
      ) : (
        <AdminTransportRoutesTab />
      )}
    </div>
  );
}
