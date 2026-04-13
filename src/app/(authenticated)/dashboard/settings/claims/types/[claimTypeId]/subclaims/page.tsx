import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ claimTypeId: string }>;
};

/** Canonical: `/dashboard/claims/types/[claimTypeId]/subclaims`. */
export default async function SubclaimTypesSettingsRedirect({ params }: PageProps) {
  const { claimTypeId } = await params;
  redirect(`/dashboard/claims/types/${claimTypeId}/subclaims`);
}
