"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import MarksSectionNav from "@/components/admin/marks/MarksSectionNav";
import MarksFeedingTab from "@/components/admin/marks/MarksFeedingTab";
import MarksUpdateLogTab from "@/components/admin/marks/MarksUpdateLogTab";
import ClasswiseStatusTab from "@/components/admin/marks/ClasswiseStatusTab";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminMarksPage() {
  const tabs = [
    "Marks Feeding_new",
    "Marks Update Log",
    "Marks Status (Classwise)",
  ];

  const [activeTab, setActiveTab] = useState("Marks Feeding_new");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto w-full min-w-0 overflow-x-hidden">
      <AdminPageHeader
        title="Marks & Grading"
        description="Manage student examination scores and performance analytics"
        actions={<MarksSectionNav />}
      />

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-t-lg transition-all",
              activeTab === tab
                ? "bg-white text-[#144835] border-t border-l border-r border-gray-200 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] translate-y-px"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Marks Feeding_new" && <MarksFeedingTab />}
      {activeTab === "Marks Update Log" && <MarksUpdateLogTab />}
      {activeTab === "Marks Status (Classwise)" && <ClasswiseStatusTab />}
    </div>
  );
}
