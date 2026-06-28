import { redirect } from "next/navigation";

export default function AdminTransportRoutesRedirectPage() {
  redirect("/schools/idpskalaburagi/admin/transport?tab=routes");
}
