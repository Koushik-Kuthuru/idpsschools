"use client";

import EmployeeForm from "@/components/admin/EmployeeForm";
import { useSchoolId } from "@/hooks/useSchoolId";

export default function AdminTeachingStaffNewPage() {
  const schoolId = useSchoolId();
  return (
    <EmployeeForm
      mode="create"
      directoryHref={`/schools/${schoolId}/admin/hr/teaching-staff`}
      category="teaching"
    />
  );
}
