"use client";

import { useState } from "react";
import { BarChart3, FileSpreadsheet, Wallet } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminDepositFeePage from "@/components/admin/AdminDepositFeePage";
import AdminFeeCollectionReport from "@/components/admin/AdminFeeCollectionReport";
import AdminFeeStructuresPage from "@/components/admin/AdminFeeStructuresPage";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { id: "deposit", label: "Deposit Fee", icon: Wallet },
  { id: "collection", label: "Fee Collection", icon: BarChart3 },
  { id: "structures", label: "Fee Structures", icon: FileSpreadsheet },
] as const;

type FeesTab = (typeof TABS)[number]["id"];

export default function AdminFeesHubPage() {
  const [activeTab, setActiveTab] = useState<FeesTab>("deposit");

  return (
    <div className="space-y-4 animate-in fade-in duration-300 font-jost pb-10 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap gap-1.5 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === tab.id
                ? "bg-[#144835] text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "deposit" ? <AdminDepositFeePage /> : null}
      {activeTab === "collection" ? <AdminFeeCollectionReport /> : null}
      {activeTab === "structures" ? <AdminFeeStructuresPage /> : null}
    </div>
  );
}
