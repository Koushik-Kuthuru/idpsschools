"use client";

import { useRouteParam } from "@/hooks/useRouteParams";
import EmployeeForm from "@/components/admin/EmployeeForm";

export default function AdminNonTeachingStaffEditPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const id = useRouteParam(params, "id") || undefined;
 return <EmployeeForm mode="edit" employeeId={id} directoryHref="/schools/idpscherukupalli/admin/hr/non-teaching-staff" />;
}
