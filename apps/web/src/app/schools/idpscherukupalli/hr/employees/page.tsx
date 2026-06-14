import { redirect } from "next/navigation";

export default async function AdminEmployeesRedirectPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const schoolId = "idpscherukupalli";
  redirect(`/schools/${schoolId}/hr/non-teaching-staff`);
}

