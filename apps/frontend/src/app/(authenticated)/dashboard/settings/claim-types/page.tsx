import { redirect } from "next/navigation";

/** @deprecated Use `/dashboard/claims/types`. */
export default function LegacyClaimTypesRedirect() {
  redirect("/dashboard/claims/types");
}
