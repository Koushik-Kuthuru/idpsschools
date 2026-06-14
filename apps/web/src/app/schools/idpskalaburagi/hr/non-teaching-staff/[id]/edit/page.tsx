"use client";

import { useRouteParam } from "@/hooks/useRouteParams";
import { useSchoolId } from "@/hooks/useSchoolId";
import EmployeeForm from "@/components/admin/EmployeeForm";

export default function AdminNonTeachingStaffEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const schoolId = useSchoolId();
  const id = useRouteParam(params, "id") || undefined;
  return (
    <EmployeeForm
      mode="edit"
      employeeId={id}
      directoryHref={`/schools/${schoolId}/admin/hr/non-teaching-staff`}
      category="nonTeaching"
    />
  );
}
