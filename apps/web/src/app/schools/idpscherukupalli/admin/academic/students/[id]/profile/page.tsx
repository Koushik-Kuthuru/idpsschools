import AdminStudentProfilePageClient from "./AdminStudentProfilePageClient";

function readSearchParam(
  value: string | string[] | undefined
): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

export default async function AdminStudentProfilePage({
 params,
  searchParams,
}: {
 params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;

 return (
    <AdminStudentProfilePageClient
      studentId={decodeURIComponent(id)}
      tabParam={readSearchParam(query.tab)}
    />
 );
}
