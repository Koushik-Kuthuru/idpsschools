import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const schoolId = "idpskalaburagi";
  return <AdminDashboard schoolId={schoolId} />;
}
