import { redirect } from "next/navigation";

export default function PayFeeRedirectPage() {
  redirect("/schools/idpskalaburagi/admin/finance/fees/deposit");
}
