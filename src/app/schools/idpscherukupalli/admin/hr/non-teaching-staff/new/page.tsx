"use client";

import EmployeeForm from "@/components/admin/EmployeeForm";

export default function AdminNonTeachingStaffNewPage() {
 return <EmployeeForm mode="create" directoryHref="/schools/idpscherukupalli/admin/hr/non-teaching-staff" category="nonTeaching" />;
}
