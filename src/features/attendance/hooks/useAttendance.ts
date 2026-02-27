import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  AttendanceLog,
  Office,
  clockInOrOut,
  fetchActiveOffices,
  fetchTodayUserLogs,
} from "@/shared/lib/api-client/attendance";

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters} m`;
}

export function useAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all active offices
  const { data: allOffices = [], isLoading: officesLoading } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => fetchActiveOffices(),
  });

  // Get today's attendance logs
  const { data: todayLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: async () => fetchTodayUserLogs(),
  });

  // Clock in/out mutation
  const clockMutation = useMutation({
    mutationFn: async ({
      type,
      latitude,
      longitude,
      photoUrl,
      selectedOfficeId,
      notes,
    }: {
      type: "clock_in" | "clock_out";
      latitude: number;
      longitude: number;
      photoUrl?: string;
      selectedOfficeId: string;
      notes?: string;
    }) => {
      const office = allOffices.find((o) => o.id === selectedOfficeId);
      if (!office) throw new Error("Please select a working location");

      const distance = calculateDistance(
        latitude,
        longitude,
        Number(office.latitude),
        Number(office.longitude)
      );

      if (distance > office.radiusMeters) {
        throw new Error(
          `You are ${formatDistance(distance)} from ${office.name}. You must be within ${formatDistance(office.radiusMeters)} to clock ${type === "clock_in" ? "in" : "out"}.`
        );
      }

      const result = await clockInOrOut({
        type,
        latitude,
        longitude,
        officeId: selectedOfficeId,
        photoUrl,
        notes,
      });

      return { data: result.log, distance: result.distanceMeters };
    },
    onSuccess: ({ distance }, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      const action = type === "clock_in" ? "Clocked in" : "Clocked out";
      toast({
        title: `${action} successfully!`,
        description: `You are ${formatDistance(distance)} from the office.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Computed: first clock-in, last clock-out
  const clockInLogs = todayLogs?.filter((l) => l.type === "clock_in") ?? [];
  const clockOutLogs = todayLogs?.filter((l) => l.type === "clock_out") ?? [];
  const firstClockIn = clockInLogs[0]?.timestamp ?? null;
  const lastClockOut =
    clockOutLogs.length > 0 ? clockOutLogs[clockOutLogs.length - 1]?.timestamp ?? null : null;

  // Current status based on last log
  const lastLog = todayLogs && todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : null;
  const isClockedIn = lastLog?.type === "clock_in";

  return {
    todayLogs,
    logsLoading,
    allOffices,
    officesLoading,
    isClockedIn,
    firstClockIn,
    lastClockOut,
    lastLog,
    clockIn: (latitude: number, longitude: number, selectedOfficeId: string, photoUrl?: string, notes?: string) =>
      clockMutation.mutateAsync({ type: "clock_in", latitude, longitude, selectedOfficeId, photoUrl, notes }),
    clockOut: (latitude: number, longitude: number, selectedOfficeId: string, photoUrl?: string, notes?: string) =>
      clockMutation.mutateAsync({ type: "clock_out", latitude, longitude, selectedOfficeId, photoUrl, notes }),
    isClocking: clockMutation.isPending,
    calculateDistance,
  };
}
