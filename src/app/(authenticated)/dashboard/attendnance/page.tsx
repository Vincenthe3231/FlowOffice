"use client";

import { useState, useEffect, useMemo } from "react";
import { useFaceVerification } from "@/features/attendance/hooks/useFaceVerification";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  X,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Calendar,
  ScanFace,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/features/attendance/hooks/useGeolocation";
import { useCamera } from "@/features/attendance/hooks/useCamera";
import { useAttendance, formatDistance } from "@/features/attendance/hooks/useAttendance";
import { useRoles } from "@/shared/hooks/useRoles";
import { useAdminAttendance } from "@/features/attendance/hooks/useAdminAttendance";
import { DailyAttendanceChart } from "@/features/attendance/components/DailyAttendanceChart";
import { LocationHeatmap } from "@/features/attendance/components/LocationHeatmap";
import { LatenessAlerts } from "@/features/attendance/components/LatenessAlerts";
import { PhotoVerificationFeed } from "@/features/attendance/components/PhotoVerificationFeed";
import { LocationManager } from "@/features/attendance/components/LocationManager";
import { StaffDetailSheet } from "@/features/attendance/components/StaffDetailSheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

type RoleChip = "my-attendance" | "superadmin" | "admin-hr" | "hod";

const roleChips: { id: RoleChip; label: string }[] = [
  { id: "my-attendance", label: "My Attendance" },
  { id: "superadmin", label: "Superadmin" },
  { id: "admin-hr", label: "Admin / HR" },
  { id: "hod", label: "HOD" },
];

export default function Attendance() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [remark, setRemark] = useState("");
  const [activeChip, setActiveChip] = useState<RoleChip>("my-attendance");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const location = useGeolocation();
  const camera = useCamera();
  const attendance = useAttendance();
  const { isAdminOrManager } = useRoles();
  const faceVerification = useFaceVerification();
  const isAdminView = activeChip !== "my-attendance";
  const admin = useAdminAttendance(isAdminOrManager && isAdminView);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-invoke getLocation when staff view is active (mount or switch to My Attendance).
  // Dependency array length must stay constant (React requirement); getLocation is stable from useCallback.
  const getLocation = location.getLocation;
  useEffect(() => {
    if (activeChip === "my-attendance") {
      getLocation();
    }
  }, [activeChip, getLocation]);

  // Auto-select Work Location when location is obtained and user hasn't chosen one yet.
  // Prefer office within radius; otherwise select nearest.
  useEffect(() => {
    if (
      !location.hasLocation ||
      location.latitude == null ||
      location.longitude == null ||
      selectedOfficeId !== "" ||
      attendance.allOffices.length === 0
    ) {
      return;
    }
    const lat = location.latitude;
    const lon = location.longitude;
    const offices = attendance.allOffices;
    const withinRadius = offices.find((o) => {
      const d = attendance.calculateDistance(lat, lon, Number(o.latitude), Number(o.longitude));
      return d <= o.radiusMeters;
    });
    if (withinRadius) {
      setSelectedOfficeId(withinRadius.id);
      return;
    }
    let nearest = offices[0];
    let minDist = attendance.calculateDistance(lat, lon, Number(nearest.latitude), Number(nearest.longitude));
    for (let i = 1; i < offices.length; i++) {
      const o = offices[i];
      const d = attendance.calculateDistance(lat, lon, Number(o.latitude), Number(o.longitude));
      if (d < minDist) {
        minDist = d;
        nearest = o;
      }
    }
    setSelectedOfficeId(nearest.id);
  }, [
    location.hasLocation,
    location.latitude,
    location.longitude,
    selectedOfficeId,
    attendance.allOffices,
    attendance.calculateDistance,
  ]);

  const selectedOffice = attendance.allOffices.find((o) => o.id === selectedOfficeId);
  const distanceToOffice = useMemo(() => {
    if (!location.hasLocation || !selectedOffice) return null;
    return attendance.calculateDistance(
      location.latitude!,
      location.longitude!,
      Number(selectedOffice.latitude),
      Number(selectedOffice.longitude)
    );
  }, [location.latitude, location.longitude, selectedOffice, attendance, location.hasLocation]);

  const isWithinRadius = distanceToOffice !== null && selectedOffice
    ? distanceToOffice <= selectedOffice.radiusMeters
    : false;

  const handleOpenCamera = async () => {
    setCameraOpen(true);
    await camera.openCamera();
  };

  const handleCloseCamera = () => {
    camera.closeCamera();
    setCameraOpen(false);
  };

  const handleCapture = async () => {
    const photoData = camera.capturePhoto();
    if (photoData) {
      // Automatically trigger face verification after capture
      await faceVerification.verifyFace(photoData);
    }
  };

  const handleClock = async () => {
    if (!selectedOfficeId) return;

    if (!attendance.isClockedIn && !location.hasLocation) {
      location.getLocation();
      return;
    }

    if (!camera.hasPhoto) {
      await handleOpenCamera();
      return;
    }

    try {
      if (attendance.isClockedIn) {
        let latitude: number;
        let longitude: number;
        try {
          const coords = await location.getLocationAsync();
          latitude = coords.latitude;
          longitude = coords.longitude;
        } catch (err) {
          toast({
            title: "Location failed",
            description: err instanceof Error ? err.message : "Failed to get location",
            variant: "destructive",
          });
          return;
        }

        const office = attendance.allOffices.find((o) => o.id === selectedOfficeId);
        if (!office) {
          toast({
            title: "Clock out failed",
            description: "Please select a working location",
            variant: "destructive",
          });
          return;
        }

        const distance = attendance.calculateDistance(
          latitude,
          longitude,
          Number(office.latitude),
          Number(office.longitude)
        );
        if (distance > office.radiusMeters) {
          toast({
            title: "Outside office radius",
            description: `You are ${formatDistance(distance)} from ${office.name}. You must be within ${formatDistance(office.radiusMeters)} to clock out.`,
            variant: "destructive",
          });
          return;
        }

        await attendance.clockOut(
          latitude,
          longitude,
          selectedOfficeId,
          camera.photo || undefined,
          remark || undefined
        );
      } else {
        await attendance.clockIn(
          location.latitude!,
          location.longitude!,
          selectedOfficeId,
          camera.photo || undefined,
          remark || undefined
        );
      }
      location.clearLocation();
      camera.clearPhoto();
      faceVerification.reset();
      setRemark("");
    } catch {
      /* Error handled in hook */
    }
  };

  const handleConfirmPhoto = () => handleCloseCamera();

  const handleRetakePhoto = () => {
    camera.clearPhoto();
    faceVerification.reset();
    camera.openCamera();
  };

  // ClockInOut-style time display
  const h = currentTime.getHours() % 12 || 12;
  const m = currentTime.getMinutes();
  const s = currentTime.getSeconds();
  const hStr = String(h).padStart(2, "0");
  const mStr = String(m).padStart(2, "0");
  const sStr = String(s).padStart(2, "0");
  const ampm = currentTime.getHours() >= 12 ? "PM" : "AM";
  const earliestIn = attendance.firstClockIn
    ? new Date(attendance.firstClockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "--:--";
  const latestOut = attendance.lastClockOut
    ? new Date(attendance.lastClockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "--:--";
  const reversedLogs = [...(attendance.todayLogs ?? [])].reverse();

  const clockButtonLabel = (() => {
    if (!selectedOfficeId) return "Select Office First";
    if (attendance.isClockedIn) {
      if (!camera.hasPhoto) return "Take Photo First";
      if (!faceVerification.verificationPassed) return "Verify Face First";
      if (location.loading) return "Getting location...";
      return "Clock Out";
    }
    if (!location.hasLocation) return "Get Location First";
    if (!isWithinRadius) return "Outside Office Radius";
    if (!camera.hasPhoto) return "Take Photo First";
    if (!faceVerification.verificationPassed) return "Verify Face First";
    return "Clock In Now";
  })();

  // ─── STAFF VIEW (ClockInOut design) ───
  const staffView = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Hero Clock Panel */}
      <div className="w-full rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50/50 p-8 lg:p-10 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 border border-blue-100 shadow-sm">
        {/* Left: Live Time */}
        <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-auto">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6",
              attendance.isClockedIn
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-100 border-slate-200 text-slate-600"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                attendance.isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              )}
            />
            <span className="text-xs font-bold tracking-wide uppercase">
              {attendance.isClockedIn ? "Active Shift" : "Off the Clock"}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 mb-4">
            <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-800 tracking-tighter tabular-nums drop-shadow-sm">
              {hStr}
            </span>
            <span className="text-5xl sm:text-6xl lg:text-7xl text-blue-300 font-light mb-2 animate-pulse">:</span>
            <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-800 tracking-tighter tabular-nums drop-shadow-sm">
              {mStr}
            </span>
            <div className="flex flex-col ml-3 sm:ml-4 gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-600 tabular-nums bg-white/80 px-2.5 py-0.5 rounded-lg border border-slate-200/60 shadow-sm text-center">
                {sStr}
              </span>
              <span className="text-sm sm:text-base font-black text-blue-600 uppercase tracking-widest bg-blue-100/60 px-2.5 py-1 rounded-lg text-center">
                {ampm}
              </span>
            </div>
          </div>

          <p className="text-slate-500 font-medium tracking-wide flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Right: Action Area */}
        <div className="relative z-10 w-full lg:w-[400px] flex flex-col gap-4 shrink-0">
          <button
            type="button"
            className={cn(
              "w-full h-16 rounded-xl flex items-center justify-center gap-3 text-lg font-bold transition-all duration-300 transform active:scale-[0.98]",
              attendance.isClockedIn
                ? "bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25"
            )}
            onClick={handleClock}
            disabled={
              attendance.isClocking ||
              attendance.logsLoading ||
              !selectedOfficeId ||
              !camera.hasPhoto ||
              !faceVerification.verificationPassed ||
              location.loading ||
              (!attendance.isClockedIn && location.hasLocation && !isWithinRadius)
            }
          >
            {attendance.isClocking || location.loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : attendance.isClockedIn ? (
              <ArrowLeft className="h-5 w-5" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
            {attendance.isClocking || location.loading ? "..." : clockButtonLabel}
          </button>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                <ArrowRight size={12} className="text-emerald-500" /> Earliest In
              </p>
              <p className="text-slate-700 font-bold">{earliestIn}</p>
            </div>
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                <ArrowLeft size={12} className="text-rose-500" /> Latest Out
              </p>
              <p className="text-slate-700 font-bold">{latestOut}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Work Location + Selfie Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location Selector */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col transition-colors">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                Work Location
              </h3>
              <p className="text-xs text-slate-500">Required for attendance logging.</p>
            </div>
          </div>
          <div className="relative mt-auto space-y-2">
            <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200 text-slate-700 font-medium text-sm focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Select your location..." />
              </SelectTrigger>
              <SelectContent>
                {attendance.allOffices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {distanceToOffice !== null && selectedOffice && (
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
                  isWithinRadius ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {formatDistance(distanceToOffice)} from {selectedOffice.name}
                  {!isWithinRadius && ` — Must be within ${formatDistance(selectedOffice.radiusMeters)}`}
                </span>
              </div>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => location.getLocation()}
              disabled={location.loading}
              className={cn(
                "w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-colors",
                location.hasLocation ? "bg-emerald-50 text-emerald-700" : location.error ? "bg-rose-50 text-rose-700" : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              )}
            >
              {location.loading ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : location.hasLocation ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : location.error ? (
                <XCircle className="h-4 w-4 shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 shrink-0" />
              )}
              <span className="text-xs font-medium truncate">
                {location.loading
                  ? "Getting your location..."
                  : location.hasLocation
                    ? location.locationName || "Location captured"
                    : location.error || "Tap to get current location"}
              </span>
              {location.hasLocation && <RefreshCw className="h-3.5 w-3.5 opacity-60 shrink-0 ml-auto" />}
            </motion.button>
          </div>
        </div>

        {/* Selfie Verification */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col transition-colors">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
                <Camera size={20} className="text-blue-600" />
                Selfie Verification
              </h3>
              <p className="text-xs text-slate-500">Identity check required.</p>
            </div>
          </div>
          {camera.hasPhoto ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 mt-auto">
              {/* eslint-disable-next-line @next/next/no-img-element -- ClockInOut design uses img for selfie preview */}
              <img src={camera.photo!} alt="Verification" className="w-full h-32 object-cover" />
              {faceVerification.verificationPassed && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold uppercase">
                  <ShieldCheck size={12} /> Verified
                </span>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 rounded-full"
                onClick={() => {
                  camera.clearPhoto();
                  faceVerification.reset();
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="border-2 border-dashed border-slate-300 rounded-xl h-[52px] flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all text-center mt-auto group w-full"
              onClick={handleOpenCamera}
            >
              <div className="flex items-center gap-2 text-slate-500 font-medium text-sm group-hover:text-blue-600">
                <ScanFace size={18} />
                Click to scan face
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Additional Remarks */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-800 text-lg">Additional Remarks</h3>
        </div>
        <Textarea
          placeholder="Optional notes regarding today's shift..."
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className="w-full h-24 bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
        />
      </div>

      {/* Activity Log */}
      {attendance.logsLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : reversedLogs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-6 pb-4">
            <div className="bg-blue-50 rounded-xl p-2">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Activity Log</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {reversedLogs.length} ACTIVITIES
              </p>
            </div>
          </div>
          <div className="px-4 pb-4 space-y-3">
            {reversedLogs.map((log, idx) => {
              const isIn = log.type === "clock_in";
              const isLatest = idx === 0;
              const timeStr = new Date(log.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
              const timeParts = timeStr.split(" ");
              const pTime = timeParts[0] ?? "";
              const pAmPm = timeParts[1] ?? "";
              const officeName = log.officeId
                ? attendance.allOffices.find((o) => o.id === log.officeId)?.name
                : undefined;

              return (
                <div
                  key={log.id}
                  className={cn(
                    "group relative flex items-start gap-4 p-4 rounded-2xl transition-all duration-300",
                    isLatest
                      ? "bg-white border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] ring-1 ring-blue-50"
                      : "bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-sm"
                  )}
                >
                  <div
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full transition-all duration-300",
                      isLatest
                        ? isIn
                          ? "bg-blue-500 h-12"
                          : "bg-rose-500 h-12"
                        : isIn
                          ? "bg-blue-200 h-8 group-hover:bg-blue-300"
                          : "bg-rose-200 h-8 group-hover:bg-rose-300"
                    )}
                  />
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-1 transition-colors duration-300",
                      isLatest
                        ? isIn
                          ? "bg-blue-100 text-blue-600"
                          : "bg-rose-100 text-rose-600"
                        : isIn
                          ? "bg-blue-50 text-blue-400 group-hover:bg-blue-100 group-hover:text-blue-500"
                          : "bg-rose-50 text-rose-400 group-hover:bg-rose-100 group-hover:text-rose-500"
                    )}
                  >
                    {isIn ? (
                      <ArrowRight size={20} strokeWidth={2.5} className="rotate-45" />
                    ) : (
                      <ArrowLeft size={20} strokeWidth={2.5} className="-rotate-45" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col py-0.5">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          isLatest ? (isIn ? "text-blue-600" : "text-rose-600") : isIn ? "text-blue-400" : "text-rose-400"
                        )}
                      >
                        {isIn ? "Clocked In" : "Clocked Out"}
                      </span>
                      {isLatest && (
                        <span className="flex h-2 w-2 relative">
                          <span
                            className={cn(
                              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                              isIn ? "bg-blue-400" : "bg-rose-400"
                            )}
                          />
                          <span
                            className={cn(
                              "relative inline-flex rounded-full h-2 w-2",
                              isIn ? "bg-blue-500" : "bg-rose-500"
                            )}
                          />
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={cn(
                          "text-2xl font-black tabular-nums tracking-tighter",
                          isLatest ? "text-slate-800" : "text-slate-600"
                        )}
                      >
                        {pTime}
                      </span>
                      {pAmPm && (
                        <span className={cn("text-sm font-bold", isLatest ? "text-blue-600" : "text-slate-400")}>
                          {pAmPm}
                        </span>
                      )}
                    </div>
                    {officeName && (
                      <div
                        className={cn(
                          "mt-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider w-fit px-2 py-1 rounded-md",
                          isLatest ? "bg-blue-50 text-blue-600" : "bg-slate-200/50 text-slate-500"
                        )}
                      >
                        <MapPin size={10} strokeWidth={2.5} />
                        {officeName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </motion.div>
  );

  // ─── ADMIN VIEW ───
  const selectedStaffProfile = selectedStaffId ? admin.getProfileForUser(selectedStaffId) : null;
  const selectedStaffLogs = selectedStaffId ? admin.getLogsForUser(selectedStaffId) : [];
  const isHodView = activeChip === "hod";

  const adminView = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 md:space-y-4"
    >
      {admin.logsLoading ? (
        <div className="flex justify-center py-8 md:py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground md:h-8 md:w-8" />
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <DailyAttendanceChart
              attendanceRate={admin.attendanceRate}
              presentToday={admin.presentToday}
              totalStaff={admin.totalStaff}
              onViewAll={() => setViewAllOpen(true)}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <LocationHeatmap staffByOffice={admin.staffByOffice} />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <LatenessAlerts lateArrivals={admin.lateArrivals} onStaffClick={setSelectedStaffId} />
          </motion.div>
          {!isHodView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <PhotoVerificationFeed photos={admin.recentPhotos} />
            </motion.div>
          )}
          {!isHodView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <LocationManager />
            </motion.div>
          )}
        </>
      )}

      <StaffDetailSheet
        open={!!selectedStaffId}
        onOpenChange={(open) => !open && setSelectedStaffId(null)}
        profile={selectedStaffProfile}
        logs={selectedStaffLogs}
        offices={admin.allOffices}
      />

      <Sheet open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-xl overflow-y-auto md:rounded-t-2xl">
          <SheetHeader className="px-3 md:px-6">
            <SheetTitle className="text-base md:text-lg">Staff Present Today ({admin.presentToday})</SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-0.5 px-3 md:mt-3 md:space-y-1 md:px-6">
            {admin.presentStaff.map((staff) => (
              <button
                key={staff.userId}
                onClick={() => { setViewAllOpen(false); setSelectedStaffId(staff.userId); }}
                className="w-full flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted transition-colors text-left md:py-2.5 md:px-3"
              >
                <p className="text-xs font-medium md:text-sm">{staff.name}</p>
                <p className="text-[11px] text-muted-foreground md:text-xs">
                  {staff.time && new Date(staff.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </button>
            ))}
            {admin.presentStaff.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4 md:text-sm md:py-6">No staff present today</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );

  // Determine what to show based on chip
  const showStaffView = activeChip === "my-attendance";
  const showBoth = activeChip === "superadmin";

  return (
    <>
      <PageHeader title="Attendance" subtitle="" />

      <div className="px-3 py-4 space-y-4 md:px-4 md:py-6 md:space-y-6 overflow-x-hidden min-w-0">
        {/* ── Role Preview Chips ── */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 md:gap-2">
          {roleChips.map((chip) => (
            <motion.button
              key={chip.id}
              onClick={() => setActiveChip(chip.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors md:px-4 md:py-2 md:text-sm",
              activeChip === chip.id
                  ? "text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {activeChip === chip.id && (
                <motion.div
                  layoutId="activeChip"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{chip.label}</span>
            </motion.button>
          ))}
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {showBoth ? (
            <motion.div key="superadmin" className="space-y-4 md:space-y-6">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 md:text-xs md:mb-4">Admin Console</h3>
              {adminView}
            </motion.div>
          ) : showStaffView ? (
            <div key="staff">{staffView}</div>
          ) : (
            <div key="admin">{adminView}</div>
          )}
        </AnimatePresence>
      </div>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={(open) => !open && handleCloseCamera()}>
        <DialogContent className="max-w-md p-0 overflow-hidden w-[calc(100vw-2rem)] md:w-full">
          <DialogHeader className="p-3 pb-0 md:p-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base md:text-lg">Take Selfie</DialogTitle>
              <button
                onClick={handleCloseCamera}
                className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center md:h-8 md:w-8"
              >
                {/* <X className="h-3.5 w-3.5 md:h-4 md:w-4" /> */}
              </button>
            </div>
          </DialogHeader>

          <div className="relative aspect-[4/3] bg-black">
            {camera.error ? (
              <div className="absolute inset-0 flex items-center justify-center text-destructive p-3 text-center md:p-4">
                <div>
                  <XCircle className="h-10 w-10 mx-auto mb-1.5 opacity-50 md:h-12 md:w-12 md:mb-2" />
                  <p className="text-xs md:text-sm">{camera.error}</p>
                </div>
              </div>
            ) : camera.photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- Camera capture preview */}
                <img src={camera.photo} alt="Captured" className="w-full h-full object-cover" />
                {/* Verification overlay */}
                <AnimatePresence>
                  {faceVerification.isVerifying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 md:gap-3"
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-primary md:h-10 md:w-10" />
                      <p className="text-xs font-medium text-white md:text-sm">Verifying face...</p>
                    </motion.div>
                  )}
                  {faceVerification.verificationPassed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5 md:gap-2"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <ShieldCheck className="h-10 w-10 text-success md:h-14 md:w-14" />
                      </motion.div>
                      <p className="text-base font-bold text-white md:text-lg">
                        {faceVerification.verificationResult?.confidence}% Match
                      </p>
                      <p className="text-[11px] text-white/70 md:text-xs">
                        {faceVerification.verificationResult?.reason}
                      </p>
                    </motion.div>
                  )}
                  {!faceVerification.isVerifying && faceVerification.error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 px-4 md:gap-3 md:px-6"
                    >
                      <AlertTriangle className="h-10 w-10 text-destructive md:h-12 md:w-12" />
                      <p className="text-xs font-medium text-white text-center md:text-sm">{faceVerification.error}</p>
                    </motion.div>
                  )}
                  {!faceVerification.isVerifying && faceVerification.verificationResult && !faceVerification.verificationPassed && !faceVerification.error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 px-4 md:gap-3 md:px-6"
                    >
                      <XCircle className="h-10 w-10 text-destructive md:h-12 md:w-12" />
                      <p className="text-xs font-bold text-white md:text-sm">Verification Failed</p>
                      <p className="text-[11px] text-white/70 text-center md:text-xs">
                        {faceVerification.verificationResult.reason}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
          </div>

          <div className="p-3 flex gap-2 md:p-4 md:gap-3">
            {camera.photo ? (
              <>
                <Button variant="outline" className="flex-1 text-sm h-9 md:h-10 md:text-base" onClick={handleRetakePhoto}>
                  Retake
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 md:h-10 md:text-base"
                  onClick={handleConfirmPhoto}
                  disabled={faceVerification.isVerifying || (!faceVerification.verificationPassed && !faceVerification.error)}
                >
                  {faceVerification.verificationPassed ? "Use Photo" : faceVerification.isVerifying ? "Verifying..." : "Use Photo"}
                </Button>
              </>
            ) : (
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 md:h-10 md:text-base" onClick={handleCapture} disabled={!camera.isOpen || !!camera.error}>
                <Camera className="h-3.5 w-3.5 mr-1.5 md:h-4 md:w-4 md:mr-2" />
                Capture
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
