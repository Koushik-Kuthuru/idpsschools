import { redirect } from "next/navigation";

export default function AdminTransportBusesRedirectPage() {
  redirect("/schools/idpskalaburagi/admin/transport?tab=buses");
}
