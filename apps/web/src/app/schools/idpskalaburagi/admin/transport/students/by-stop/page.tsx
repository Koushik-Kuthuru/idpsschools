import { redirect } from "next/navigation";

export default function AdminTransportStudentsByStopRedirectPage() {
  redirect("/schools/idpskalaburagi/admin/transport/students?tab=stop-wise");
}
