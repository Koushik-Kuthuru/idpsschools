import { redirect } from "next/navigation";

export default function AdminTransportBusesRedirectPage() {
  redirect("/schools/idpscherukupalli/admin/transport?tab=buses");
}
