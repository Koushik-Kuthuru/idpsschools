"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Plus } from "lucide-react";

import AddUpdateTimetableTab from "@/components/admin/timetable/AddUpdateTimetableTab";
import AddUpdateFinalTestTab from "@/components/admin/timetable/AddUpdateFinalTestTab";
import ViewTeacherTimetableTab from "@/components/admin/timetable/ViewTeacherTimetableTab";
import ViewDaywiseTimetableTab from "@/components/admin/timetable/ViewDaywiseTimetableTab";
import ClasswiseTimetableTab from "@/components/admin/timetable/ClasswiseTimetableTab";
import AllClassesTimetableTab from "@/components/admin/timetable/AllClassesTimetableTab";
import StudyHoursTimetableTab from "@/components/admin/timetable/StudyHoursTimetableTab";
import TeacherMicroScheduleEditor from "@/components/admin/hr/TeacherMicroScheduleEditor";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tabs = [
  { id: "all", label: "All Classes" },
  { id: "class", label: "By Class" },
  { id: "teacher", label: "By Teacher" },
  { id: "day", label: "By Day" },
  { id: "study", label: "Study Hours Timetable" },
  { id: "exam", label: "Exam Timetable" },
  { id: "micro", label: "Micro Schedule" },
] as const;

type TimetableTabId = (typeof tabs)[number]["id"];

function isTimetableTabId(value: string | null): value is TimetableTabId {
  return tabs.some((tab) => tab.id === value);
}

type EditTarget = {
  grade?: string;
  section?: string;
};

export default function AdminTimetablePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<TimetableTabId>(() =>
    isTimetableTabId(tabFromUrl) ? tabFromUrl : "all"
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  useEffect(() => {
    if (isTimetableTabId(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      setEditTarget(null);
    }
  }, [tabFromUrl, activeTab]);

  const selectTab = (tabId: TimetableTabId) => {
    setActiveTab(tabId);
    setEditTarget(null);
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "all") params.delete("tab");
    else params.set("tab", tabId);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const openNewTimetable = () => setEditTarget({});
  const openEditTimetable = (grade: string, section: string) =>
    setEditTarget({ grade, section });
  const closeEdit = () => setEditTarget(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Timetable"
        description="Class schedules, exam timetables, and CBSE micro schedules"
        actions={
          editTarget === null && activeTab !== "micro" && activeTab !== "exam" && activeTab !== "study" ? (
            <button
              type="button"
              onClick={openNewTimetable}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90 transition-all"
            >
              <Plus size={14} />
              New Timetable
            </button>
          ) : null
        }
      />

      {editTarget !== null ? (
        <AddUpdateTimetableTab
          initialGrade={editTarget.grade}
          initialSection={editTarget.section}
          onClose={closeEdit}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
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

          {activeTab === "all" && <AllClassesTimetableTab onEdit={openEditTimetable} />}
          {activeTab === "class" && <ClasswiseTimetableTab onEdit={openEditTimetable} />}
          {activeTab === "teacher" && <ViewTeacherTimetableTab />}
          {activeTab === "day" && <ViewDaywiseTimetableTab />}
          {activeTab === "study" && <StudyHoursTimetableTab />}
          {activeTab === "exam" && <AddUpdateFinalTestTab />}
          {activeTab === "micro" && <TeacherMicroScheduleEditor />}
        </>
      )}
    </div>
  );
}
