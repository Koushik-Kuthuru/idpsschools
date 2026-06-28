import { redirect } from "next/navigation";

export default function AdminTransportStudentsByRouteRedirectPage() {
  redirect("/schools/idpskalaburagi/admin/transport/students?tab=route-wise");
}
