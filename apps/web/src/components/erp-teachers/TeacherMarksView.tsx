"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import MarksFeedingTab from "@/components/admin/marks/MarksFeedingTab";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import { useSchoolId } from "@/hooks/useSchoolId";
import { SkeletonPage } from "@/components/ui/Skeleton";

export default function TeacherMarksView() {
  const schoolId = useSchoolId();
  const { loading: scopeLoading } = useTeacherClassScope(schoolId);

  if (scopeLoading) {
    return <SkeletonPage stats={0} rows={8} columns={6} />;
  }

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
