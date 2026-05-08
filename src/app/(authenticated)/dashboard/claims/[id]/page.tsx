import Link from "next/link";
import { ClaimDetailPageClient } from "@/features/claims/components/ClaimDetailPageClient";
import { Button } from "@/components/ui/button";
import {
  getFirstQueryParam,
  parseClaimIdParam,
} from "@/features/claims/lib/claimUrlParams";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Route: `/dashboard/claims/[id]` — `searchParams` is awaited for Next.js App Router contract; pass into the client when you add optional query keys (see `getFirstQueryParam` in `claimUrlParams.ts`).
 */
export default async function ClaimDetailPage({ params, searchParams }: PageProps) {
  const { id: rawId } = await params;
  const sp = await searchParams;
  const fromOrgAll = getFirstQueryParam(sp, "from") === "all";

  const claimId = parseClaimIdParam(rawId);

  if (claimId == null) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-foreground">Invalid claim link</p>
        <p className="text-sm text-muted-foreground">The URL does not contain a valid claim id.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/claims">Back to Claims</Link>
        </Button>
      </div>
    );
  }

  return <ClaimDetailPageClient claimId={claimId} fromOrgAll={fromOrgAll} />;
}
