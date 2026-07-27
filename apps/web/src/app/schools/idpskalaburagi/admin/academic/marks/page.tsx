"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import MarksSectionNav from "@/components/admin/marks/MarksSectionNav";
import MarksOverviewTab from "@/components/admin/marks/MarksOverviewTab";
import MarksFeedingTab from "@/components/admin/marks/MarksFeedingTab";
import MarksUpdateLogTab from "@/components/admin/marks/MarksUpdateLogTab";
import ClasswiseStatusTab from "@/components/admin/marks/ClasswiseStatusTab";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tabs = [
  { id: "overview", label: "All Marks" },
  { id: "feeding", label: "Marks Feeding" },
  { id: "update", label: "Marks Update Log" },
  { id: "status", label: "Marks Status (Classwise)" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AdminMarksPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto w-full min-w-0 overflow-x-hidden">
      <AdminPageHeader
        title="Marks & Grading"
        description="View imported exam marks and manage student scores"
        actions={<MarksSectionNav />}
      />

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-t-lg transition-all",
              activeTab === tab.id
                ? "bg-white text-[#144835] border-t border-l border-r border-gray-200 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] translate-y-px"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <MarksOverviewTab />}
      {activeTab === "feeding" && <MarksFeedingTab />}
      {activeTab === "update" && <MarksUpdateLogTab />}
      {activeTab === "status" && <ClasswiseStatusTab />}
    </div>
  );
}
