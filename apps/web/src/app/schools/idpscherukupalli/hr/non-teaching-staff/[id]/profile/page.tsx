"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useRouteParam } from "@/hooks/useRouteParams";
import EmployeeProfileView from "@/components/admin/EmployeeProfileView";

export default function AdminNonTeachingStaffProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const schoolId = useSchoolId();
  const employeeId = useRouteParam(params, "id");

  return (
    <EmployeeProfileView
      employeeId={employeeId}
      schoolId={schoolId}
      editHref={`/schools/${schoolId}/admin/hr/non-teaching-staff/${encodeURIComponent(employeeId)}/edit`}
      backHref={`/schools/${schoolId}/admin/hr/non-teaching-staff`}
      backLabel="Non-Teaching Staff"
      variant="nonTeaching"
    />
  );
}
