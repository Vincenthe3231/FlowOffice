import { ClaimsManagement } from "@/features/claims";

/** All claims submitted by the signed-in user (same list API as the hub table). */
export default function MyClaimsPage() {
  return <ClaimsManagement variant="listOnly" />;
}
