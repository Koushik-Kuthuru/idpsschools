import { redirect } from "next/navigation";

export default async function AdminDashboardAlias({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const schoolId = "idpskalaburagi";
  redirect(`/schools/${schoolId}/admin`);
}
