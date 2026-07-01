"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useRouteParam } from "@/hooks/useRouteParams";
import EmployeeProfileView from "@/components/admin/EmployeeProfileView";

export default function AdminTeachingStaffProfilePage({
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
      editHref={`/schools/${schoolId}/admin/hr/teaching-staff/${encodeURIComponent(employeeId)}/edit`}
      backHref={`/schools/${schoolId}/admin/hr/teaching-staff`}
      backLabel="Teaching Staff"
      variant="teaching"
    />
  );
}
