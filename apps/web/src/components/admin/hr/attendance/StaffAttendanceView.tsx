"use client";

import React, { useState } from "react";
import { Users, BarChart3 } from "lucide-react";
import StaffUpdateTab from "./StaffUpdateTab";
import StaffDatewiseSummaryTab from "./StaffDatewiseSummaryTab";
import AdminPageHeader from "@/components/admin/PageHeader";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StaffAttendanceViewProps {
  schoolId: string;
}

export default function StaffAttendanceView({ schoolId }: StaffAttendanceViewProps) {
  const [activeTab, setActiveTab] = useState<"update" | "summary">("update");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <AdminPageHeader
        title="Staff Attendance"
        description="Mark and monitor daily attendance for all employees"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-100 p-1.5 gap-1 bg-gray-50/50">
          <button
            onClick={() => setActiveTab("update")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "update"
                ? "bg-white text-[#144835] shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Users size={16} />
            Update Attendance
          </button>
          
          <button
            onClick={() => setActiveTab("summary")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "summary"
                ? "bg-white text-[#144835] shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <BarChart3 size={16} />
            Datewise Summary
          </button>
        </div>

        <div className="p-6">
          {activeTab === "update" && <StaffUpdateTab schoolId={schoolId} />}
          {activeTab === "summary" && <StaffDatewiseSummaryTab schoolId={schoolId} />}
        </div>
      </div>
    </div>
  );
}
