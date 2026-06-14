import { redirect } from "next/navigation";
import { isValidSchoolId } from "@/lib/schools";

export default async function SchoolBranchPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const schoolId = "idpskalaburagi";
  if (!isValidSchoolId(schoolId)) {
    redirect("/schools");
  }
  redirect(`/schools/${schoolId}/admin`);
}
