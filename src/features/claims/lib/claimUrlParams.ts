/**
 * First string value for a search param (Next.js may pass `string | string[]`).
 * Same behavior as attendance log URL helpers — extend with claim-specific query keys as needed.
 */
export function getFirstQueryParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  if (!searchParams) return undefined;
  const v = searchParams[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0] != null) return v[0];
  return undefined;
}

/** Positive integer claim id from dynamic route segment, or `null` if invalid. */
export function parseClaimIdParam(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Path to claim detail (`/dashboard/claims/[id]`). */
export function buildClaimDetailHref(claimId: number | string): string {
  return `/dashboard/claims/${encodeURIComponent(String(claimId))}`;
}

/** Org-wide All Claims → full detail with back link to `/dashboard/claims/all`. */
export function buildClaimDetailHrefFromOrgAll(claimId: number | string): string {
  return `${buildClaimDetailHref(claimId)}?from=all`;
}
