import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const schoolId = "idpscherukupalli";
  return <AdminDashboard schoolId={schoolId} />;
}
