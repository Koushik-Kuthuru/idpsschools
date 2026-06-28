import { redirect } from "next/navigation";

export default function AdminTransportStudentsByStopRedirectPage() {
  redirect("/schools/idpscherukupalli/admin/transport/students?tab=stop-wise");
}
