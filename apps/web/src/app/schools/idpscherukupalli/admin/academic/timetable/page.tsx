"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import AddUpdateTimetableTab from "@/components/admin/timetable/AddUpdateTimetableTab";
import AddUpdateFinalTestTab from "@/components/admin/timetable/AddUpdateFinalTestTab";
import ViewTeacherTimetableTab from "@/components/admin/timetable/ViewTeacherTimetableTab";
import ViewDaywiseTimetableTab from "@/components/admin/timetable/ViewDaywiseTimetableTab";
import ClasswiseTimetableTab from "@/components/admin/timetable/ClasswiseTimetableTab";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tabs = [
  { id: "edit", label: "Edit Timetable" },
  { id: "exam", label: "Exam Timetable" },
  { id: "teacher", label: "By Teacher" },
  { id: "day", label: "By Day" },
  { id: "class", label: "By Class" },
] as const;

type TimetableTabId = (typeof tabs)[number]["id"];

export default function AdminTimetablePage() {
  const [activeTab, setActiveTab] = useState<TimetableTabId>("edit");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Timetable"
        description="Manage and view class schedules across all grades"
      />

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
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

      {activeTab === "edit" && <AddUpdateTimetableTab />}
      {activeTab === "exam" && <AddUpdateFinalTestTab />}
      {activeTab === "teacher" && <ViewTeacherTimetableTab />}
      {activeTab === "day" && <ViewDaywiseTimetableTab />}
      {activeTab === "class" && <ClasswiseTimetableTab />}
    </div>
  );
}
