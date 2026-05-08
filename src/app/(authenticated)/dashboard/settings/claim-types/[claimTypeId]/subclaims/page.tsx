import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ claimTypeId: string }>;
};

/** @deprecated Use `/dashboard/claims/types/[claimTypeId]/subclaims`. */
export default async function LegacySubclaimsRedirect({ params }: PageProps) {
  const { claimTypeId } = await params;
  redirect(`/dashboard/claims/types/${claimTypeId}/subclaims`);
}
