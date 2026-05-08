import { AttendanceLogDetailPageClient } from "@/features/attendance/components/AttendanceLogDetailPageClient";
import {
  ATTENDANCE_LOG_DATE_QUERY,
  getFirstQueryParam,
  safeDecodeURIComponent,
} from "@/features/attendance/lib/attendanceLogUrlParams";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Route: `/dashboard/log/[userId]?date=YYYY-MM-DD`
 * - `params.userId` — employee identifier (matches attendance `userId` or profile `id`).
 * - `searchParams.date` — optional calendar day; omitted defaults to “today” on the client.
 */
export default async function AttendanceLogDetailPage({ params, searchParams }: PageProps) {
  const { userId: rawUserId } = await params;
  const sp = await searchParams;
  const dateFromUrl = getFirstQueryParam(sp, ATTENDANCE_LOG_DATE_QUERY);
  const userId = safeDecodeURIComponent(rawUserId);

  return <AttendanceLogDetailPageClient userId={userId} dateFromUrl={dateFromUrl} />;
}
