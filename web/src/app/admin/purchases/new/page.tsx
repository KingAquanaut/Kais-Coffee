import { redirect } from "next/navigation";

// /admin/purchases/new → canonical URL is /admin/purchases/record
export default function NewPurchaseRedirect() {
  redirect("/admin/purchases/record");
}
