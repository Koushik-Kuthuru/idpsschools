"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import AdminDepositFeePage from "@/components/admin/AdminDepositFeePage";
import FeeTransactionsTab from "@/components/admin/fees/FeeTransactionsTab";
import ClasswiseFeeCollectionsTab from "@/components/admin/fees/ClasswiseFeeCollectionsTab";
import AnnualFeeCalculationsTab from "@/components/admin/fees/AnnualFeeCalculationsTab";
import TransportFeeCollectionsTab from "@/components/admin/fees/TransportFeeCollectionsTab";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { id: "pay-fee", label: "Pay Fee" },
  { id: "transactions", label: "Fee Transactions" },
  { id: "classwise", label: "Classwise Collections" },
  { id: "annual", label: "Annual Calculations" },
  { id: "transport", label: "Transport Collections" },
] as const;

type FeesTabId = (typeof TABS)[number]["id"];

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

function parseFeesTab(value: string | null): FeesTabId {
  if (value && TAB_IDS.has(value)) return value as FeesTabId;
  return "pay-fee";
}

export default function AdminFeesHubPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentYear } = useAcademicYear();
  const activeTab = useMemo(
    () => parseFeesTab(searchParams.get("tab")),
    [searchParams]
  );

  const setActiveTab = (tab: FeesTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "pay-fee") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto w-full min-w-0">
      <AdminPageHeader
        title="Fees"
        description={`Collect fees, review transactions, and analyse collections for ${currentYear?.name ?? "the active academic year"}.`}
      />

      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap border-b-2",
              activeTab === tab.id
                ? "bg-[#144835]/5 text-[#144835] border-[#144835]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "pay-fee" ? <AdminDepositFeePage embedded /> : null}
      {activeTab === "transactions" ? <FeeTransactionsTab /> : null}
      {activeTab === "classwise" ? <ClasswiseFeeCollectionsTab /> : null}
      {activeTab === "annual" ? <AnnualFeeCalculationsTab /> : null}
      {activeTab === "transport" ? <TransportFeeCollectionsTab /> : null}
    </div>
  );
}
