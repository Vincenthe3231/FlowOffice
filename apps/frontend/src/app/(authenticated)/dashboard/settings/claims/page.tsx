import { redirect } from "next/navigation";

/** Canonical hub: `/dashboard/claims/all`. */
export default function ManageClaimsHubRedirect() {
  redirect("/dashboard/claims/all");
}
