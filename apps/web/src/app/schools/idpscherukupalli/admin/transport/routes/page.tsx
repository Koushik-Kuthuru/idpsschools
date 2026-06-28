import { redirect } from "next/navigation";

export default function AdminTransportRoutesRedirectPage() {
  redirect("/schools/idpscherukupalli/admin/transport?tab=routes");
}
