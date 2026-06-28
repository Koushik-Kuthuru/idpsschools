"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import MarksFeedingTab from "@/components/admin/marks/MarksFeedingTab";

export default function TeacherMarksView() {
  return (
    <div className="erp-body space-y-6 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto w-full min-w-0 overflow-x-hidden">
      <AdminPageHeader
        title="Marks & Grading"
        description="Enter and review marks for students in your class teacher sections"
      />
      <MarksFeedingTab />
    </div>
  );
}
