import { redirect } from "next/navigation";

export default async function AdminStaffRedirectPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const schoolId = "idpscherukupalli";
  redirect(`/schools/${schoolId}/hr/teaching-staff`);
}

