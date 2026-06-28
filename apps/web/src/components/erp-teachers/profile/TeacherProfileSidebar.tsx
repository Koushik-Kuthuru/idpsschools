"use client";

import { ChevronRight, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TEACHER_PROFILE_TABS } from "@/components/erp-teachers/profile/TeacherProfileTabPanels";
import type { TeacherProfileData } from "@/lib/loadTeacherProfile";
import type { TeacherProfileTab } from "@/lib/teacherProfileHub";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TeacherProfileSidebarProps = {
  data: TeacherProfileData;
  initials: string;
  avatarColor: string;
  activeTab: TeacherProfileTab;
  onTabChange: (tab: TeacherProfileTab) => void;
};

export default function TeacherProfileSidebar({
  data,
  initials,
  avatarColor,
  activeTab,
  onTabChange,
}: TeacherProfileSidebarProps) {
  return (
    <aside className="shrink-0 flex flex-col w-72 bg-white rounded-xl border border-gray-200 overflow-hidden self-start sticky top-4">
      <div className="relative border-b border-gray-100 bg-gradient-to-br from-[#144835] to-[#144835]/90 text-white shrink-0 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3 mb-4">
          {data.photoURL ? (
            <img
              src={data.photoURL}
              alt={data.name}
              className="h-11 w-11 rounded-xl border-2 border-white/30 object-cover shadow-lg shrink-0"
            />
          ) : (
            <div
              className={cn(
                "h-11 w-11 rounded-xl border-2 border-white/30 flex items-center justify-center text-sm font-bold shadow-lg shrink-0 bg-white/10",
                avatarColor
              )}
            >
              {initials || <User size={18} />}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{data.name}</p>
            <p className="text-[11px] text-white/70 truncate">{data.designation}</p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
            data.status === "Active"
              ? "bg-emerald-400/20 border-emerald-300/40 text-emerald-100"
              : "bg-white/10 border-white/20 text-white/80"
          )}
        >
          {data.status}
        </span>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {TEACHER_PROFILE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group relative w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold transition-all duration-200",
                isActive
                  ? "bg-[#144835]/8 text-[#144835]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isActive ? (
                <span
                  className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#a2c144]"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive ? "bg-[#a2c144]/25 text-[#144835]" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                )}
              >
                <tab.icon size={16} strokeWidth={2.25} />
              </span>
              <span className="truncate text-left">{tab.id}</span>
              {isActive ? <ChevronRight size={14} className="ml-auto text-[#144835]/40 shrink-0" /> : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
