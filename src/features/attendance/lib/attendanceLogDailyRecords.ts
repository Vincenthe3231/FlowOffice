import type { AdminAttendanceLog, Office } from "@/shared/lib/api-client/attendance";

export type TableStatus = "Present" | "Late" | "Absent" | "WFH";

/** Default full-day target for deficit / progress (8 hours). */
export const DEFAULT_TARGET_HOURS_MS = 8 * 60 * 60 * 1000;

export interface DailyRecord {
  userId: string;
  name: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  /** Large hero text (includes 0h 00m when no time worked) */
  hoursHero: string;
  location: string;
  status: TableStatus;
  department: string | null;
  avatarInitials: string;
  punchRecords: { time: string; type: "in" | "out"; location: string }[];
  remarks: string | null;
  hoursWorkedMs: number;
  targetHoursMs: number;
  deficitMs: number;
  deficitLabel: string | null;
  progressRatio: number;
}

const NINE_AM_MS = 9 * 60 * 60 * 1000;

/** YYYY-MM-DD in the user's local timezone (avoids UTC drift from `toISOString()`). */
export function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatHours(ms: number): string {
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (h === 0 && m === 0) return "0h 00m";
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function getInitials(fullName: string | null, email: string | null): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      if (first != null && last != null) {
        const initials = (first[0] ?? "") + (last[0] ?? "");
        if (initials) return initials.toUpperCase();
      }
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function deficitLabelFromMs(deficitMs: number): string | null {
  if (deficitMs <= 0) return null;
  return `-${formatHours(deficitMs)} deficit`;
}

export function buildDailyRecords(
  todayLogs: AdminAttendanceLog[],
  profiles: { userId: string; fullName: string | null; email: string | null; department: string | null }[],
  offices: Office[],
  todayDate: string,
  targetHoursMs: number = DEFAULT_TARGET_HOURS_MS,
): DailyRecord[] {
  const byUser = new Map<string, AdminAttendanceLog[]>();
  for (const log of todayLogs) {
    if (!byUser.has(log.userId)) byUser.set(log.userId, []);
    byUser.get(log.userId)!.push(log);
  }

  const getOfficeName = (officeId: string | null) => {
    if (!officeId) return "—";
    const o = offices.find((x) => x.id === officeId);
    return o?.name ?? "—";
  };

  const records: DailyRecord[] = [];

  for (const [userId, logs] of byUser) {
    const profile = profiles.find((p) => p.userId === userId);
    const name = profile?.fullName || profile?.email || "Unknown";
    const sorted = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const ins = sorted.filter((l) => l.type === "clock_in");
    const outs = sorted.filter((l) => l.type === "clock_out");
    const firstIn = ins[0];
    const lastOut = outs[outs.length - 1];

    const clockIn = firstIn ? formatTime(firstIn.timestamp) : "—";
    const clockOut = lastOut ? formatTime(lastOut.timestamp) : "—";

    let hoursWorkedMs = 0;
    if (firstIn && lastOut) {
      hoursWorkedMs = new Date(lastOut.timestamp).getTime() - new Date(firstIn.timestamp).getTime();
    }
    const hours = hoursWorkedMs > 0 ? formatHours(hoursWorkedMs) : "—";
    const hoursHero = formatHours(hoursWorkedMs);

    const firstInTime = firstIn ? new Date(firstIn.timestamp).getTime() : 0;
    const dayStart = new Date(todayDate).setHours(0, 0, 0, 0);
    const nineAm = dayStart + NINE_AM_MS;
    const status: TableStatus = !firstIn ? "Absent" : firstInTime > nineAm ? "Late" : "Present";

    const location = firstIn ? getOfficeName(firstIn.officeId) : "—";

    const punchRecords = sorted.map((l) => ({
      time: formatTime(l.timestamp),
      type: l.type === "clock_in" ? ("in" as const) : ("out" as const),
      location: getOfficeName(l.officeId),
    }));

    const remarks = firstIn?.notes ?? lastOut?.notes ?? null;

    const deficitMs = Math.max(0, targetHoursMs - hoursWorkedMs);
    const deficitLabel = deficitLabelFromMs(deficitMs);
    const progressRatio =
      targetHoursMs > 0 ? Math.min(1, hoursWorkedMs / targetHoursMs) : 0;

    records.push({
      userId,
      name,
      date: todayDate,
      clockIn,
      clockOut,
      hours,
      hoursHero,
      location,
      status,
      department: profile?.department ?? null,
      avatarInitials: getInitials(profile?.fullName ?? null, profile?.email ?? null),
      punchRecords,
      remarks,
      hoursWorkedMs,
      targetHoursMs,
      deficitMs,
      deficitLabel,
      progressRatio,
    });
  }

  records.sort((a, b) => a.name.localeCompare(b.name));
  return records;
}

export function findDailyRecord(
  records: DailyRecord[],
  userId: string,
  date: string,
): DailyRecord | undefined {
  return records.find(
    (r) => String(r.userId) === String(userId) && r.date === date,
  );
}

/** Resolve detail route param to a daily record (e.g. profile `id` in URL vs attendance `userId`). */
export function findDailyRecordForRouteParam(
  records: DailyRecord[],
  routeUserId: string,
  date: string,
  profiles: { id: string; userId: string }[],
): DailyRecord | undefined {
  const direct = findDailyRecord(records, routeUserId, date);
  if (direct) return direct;

  const byProfileId = profiles.find((p) => p.id === routeUserId);
  if (byProfileId) {
    return findDailyRecord(records, byProfileId.userId, date);
  }

  return undefined;
}
