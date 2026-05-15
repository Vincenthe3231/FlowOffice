/** Query key for the calendar day on attendance log detail (`?date=YYYY-MM-DD`). */
export const ATTENDANCE_LOG_DATE_QUERY = "date" as const;

/** Safe decode for dynamic route segments (malformed `%` sequences fall back to raw). */
export function safeDecodeURIComponent(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * First string value for a search param (Next.js may pass `string | string[]`).
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

/** Path + query for the admin attendance log detail screen. */
export function buildAttendanceLogDetailHref(userId: string, date: string): string {
  const q = new URLSearchParams({ [ATTENDANCE_LOG_DATE_QUERY]: date });
  return `/dashboard/log/${encodeURIComponent(userId)}?${q.toString()}`;
}
