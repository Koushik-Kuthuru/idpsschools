"use client";

import EmployeeForm from "@/components/admin/EmployeeForm";
import { useSchoolId } from "@/hooks/useSchoolId";

export default function AdminNonTeachingStaffNewPage() {
  const schoolId = useSchoolId();
  return (
    <EmployeeForm
      mode="create"
      directoryHref={`/schools/${schoolId}/admin/hr/non-teaching-staff`}
      category="nonTeaching"
    />
  );
}
