import { redirect } from "next/navigation";

export default async function AdminEmployeesLegacyNewRedirectPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const schoolId = "idpskalaburagi";
  redirect(`/schools/${schoolId}/hr/non-teaching-staff/new`);
}

