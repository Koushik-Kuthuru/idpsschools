"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import ViewTeacherTimetableTab from "@/components/admin/timetable/ViewTeacherTimetableTab";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";

export default function TeacherTimetableView() {
  const scope = useTeacherPortalScope();
  const teacherName = scope?.teacherDisplayName || "You";

  return (
    <div className="erp-body space-y-6 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="My Timetable"
        description={`Weekly schedule for ${teacherName}`}
      />
      <ViewTeacherTimetableTab lockedTeacherName={scope?.teacherDisplayName || undefined} readOnly />
    </div>
  );
}
