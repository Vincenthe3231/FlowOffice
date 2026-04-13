import { redirect } from "next/navigation";

/** Canonical: `/dashboard/claims/types`. */
export default function ClaimTypesSettingsRedirect() {
  redirect("/dashboard/claims/types");
}
