"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import ViewTeacherTimetableTab from "@/components/admin/timetable/ViewTeacherTimetableTab";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import { useSchoolId } from "@/hooks/useSchoolId";
import { SkeletonMatrix, SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function TeacherTimetableView() {
  const schoolId = useSchoolId();
  const scope = useTeacherPortalScope();
  const { loading: scopeLoading } = useTeacherClassScope(schoolId);
  const teacherName = scope?.teacherDisplayName || "You";

  if (scopeLoading) {
    return (
      <div className="erp-body space-y-6 pb-10 max-w-[1600px] mx-auto">
        <SkeletonPageHeader />
        <SkeletonMatrix rows={7} columns={6} />
      </div>
    );
  }

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
