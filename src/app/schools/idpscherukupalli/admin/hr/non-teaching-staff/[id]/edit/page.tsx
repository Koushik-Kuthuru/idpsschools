"use client";

import { useParams } from "next/navigation";
import EmployeeForm from "@/components/admin/EmployeeForm";

export default function AdminNonTeachingStaffEditPage() {
 const params = useParams<{ id: string }>();
 const id = typeof params?.id === "string" ? decodeURIComponent(params.id) : undefined;
 return <EmployeeForm mode="edit" employeeId={id} directoryHref="/schools/idpscherukupalli/admin/hr/non-teaching-staff" />;
}
