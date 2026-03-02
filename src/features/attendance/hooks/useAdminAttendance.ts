import { useQuery } from "@tanstack/react-query";
import {
  AdminAttendanceLog,
  AdminProfile,
  adminFetchActiveOffices,
  adminFetchAllProfiles,
  adminFetchTodayLogs,
  Office,
} from "@/shared/lib/api-client/attendance";

export function useAdminAttendance(enabled: boolean) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const { data: todayAllLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["admin-attendance", "today"],
    queryFn: async () => {
      // Keep the same \"today\" window; Laravel endpoint should mirror this behaviour.
      void todayIso;
      return adminFetchTodayLogs();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: allProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => adminFetchAllProfiles(),
    enabled,
  });

  const { data: allOffices = [] } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => adminFetchActiveOffices(),
    enabled,
  });

  // Unique users who clocked in today
  const uniqueClockInUsers = new Set(
    todayAllLogs.filter((l) => l.type === "clock_in").map((l) => l.userId)
  );
  const attendanceRate = allProfiles.length > 0
    ? Math.round((uniqueClockInUsers.size / allProfiles.length) * 100)
    : 0;

  // Staff count per office
  const staffByOffice = allOffices.map((office) => {
    const count = new Set(
      todayAllLogs
        .filter((l) => l.type === "clock_in" && l.officeId === office.id)
        .map((l) => l.userId)
    ).size;
    return { name: office.name, count };
  });

  // Late arrivals (first clock-in after 9:00 AM)
  const lateArrivals = (() => {
    const firstClockIns = new Map<string, string>();
    todayAllLogs
      .filter((l) => l.type === "clock_in")
      .forEach((l) => {
        if (!firstClockIns.has(l.userId)) {
          firstClockIns.set(l.userId, l.timestamp);
        }
      });

    const nineAm = new Date(today);
    nineAm.setHours(9, 0, 0, 0);

    return Array.from(firstClockIns.entries())
      .filter(([, ts]) => new Date(ts) > nineAm)
      .map(([userId, ts]) => {
        const profile = allProfiles.find((p) => p.userId === userId);
        const lateBy = Math.round((new Date(ts).getTime() - nineAm.getTime()) / 60000);
        return {
          userId,
          name: profile?.fullName || profile?.email || "Unknown",
          time: ts,
          lateByMinutes: lateBy,
        };
      })
      .sort((a, b) => b.lateByMinutes - a.lateByMinutes);
  })();

  // Recent photos
  const recentPhotos = todayAllLogs
    .filter((l) => l.photoUrl && l.type === "clock_in")
    .slice(-10)
    .reverse()
    .map((l) => {
      const profile = allProfiles.find((p) => p.userId === l.userId);
      return {
        id: l.id,
        photoUrl: l.photoUrl!,
        name: profile?.fullName || profile?.email || "Unknown",
        timestamp: l.timestamp,
      };
    });

  const getLogsForUser = (userId: string) =>
    todayAllLogs.filter((l) => l.userId === userId);

  const getProfileForUser = (userId: string) =>
    allProfiles.find((p) => p.userId === userId) || null;

  // All users who clocked in today (for "View All" list)
  const presentStaff = Array.from(uniqueClockInUsers).map((userId) => {
    const profile = allProfiles.find((p) => p.userId === userId);
    const firstLog = todayAllLogs.find((l) => l.userId === userId && l.type === "clock_in");
    return {
      userId,
      name: profile?.fullName || profile?.email || "Unknown",
      time: firstLog?.timestamp || "",
    };
  });

  return {
    todayAllLogs,
    allProfiles,
    allOffices,
    logsLoading: logsLoading || profilesLoading,
    attendanceRate,
    totalStaff: allProfiles.length,
    presentToday: uniqueClockInUsers.size,
    staffByOffice,
    lateArrivals,
    recentPhotos,
    getLogsForUser,
    getProfileForUser,
    presentStaff,
  };
}
