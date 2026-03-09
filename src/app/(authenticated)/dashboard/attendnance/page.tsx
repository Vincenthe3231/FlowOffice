"use client";

import { useState, useEffect, useMemo } from "react";
import { useFaceVerification } from "@/features/attendance/hooks/useFaceVerification";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
  Building2,
  MessageSquare,
  ArrowRight,
  LogIn,
  LogOut,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/features/attendance/hooks/useGeolocation";
import { useCamera } from "@/features/attendance/hooks/useCamera";
import { useAttendance, formatDistance } from "@/features/attendance/hooks/useAttendance";
import { useRoles } from "@/shared/hooks/useRoles";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useAdminAttendance } from "@/features/attendance/hooks/useAdminAttendance";
import { DailyAttendanceChart } from "@/features/attendance/components/DailyAttendanceChart";
import { LocationHeatmap } from "@/features/attendance/components/LocationHeatmap";
import { LatenessAlerts } from "@/features/attendance/components/LatenessAlerts";
import { PhotoVerificationFeed } from "@/features/attendance/components/PhotoVerificationFeed";
import { LocationManager } from "@/features/attendance/components/LocationManager";
import { StaffDetailSheet } from "@/features/attendance/components/StaffDetailSheet";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Progress } from "@/components/ui/progress";
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
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/free-mode";

type RoleChip = "my-attendance" | "superadmin" | "admin-hr" | "hod";

const roleChips: { id: RoleChip; label: string }[] = [
  { id: "my-attendance", label: "My Attendance" },
  { id: "superadmin", label: "Superadmin" },
  { id: "admin-hr", label: "Admin / HR" },
  { id: "hod", label: "HOD" },
];

export default function Attendance() {
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
  const { profile } = useProfile();
  const faceVerification = useFaceVerification();
  const isMobile = useIsMobile();
  const isAdminView = activeChip !== "my-attendance";
  const admin = useAdminAttendance(isAdminOrManager && isAdminView);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedOffice = attendance.allOffices.find((o) => o.id === selectedOfficeId);
  const distanceToOffice = useMemo(() => {
    if (!location.hasLocation || !selectedOffice) return null;
    return attendance.calculateDistance(
      location.latitude!,
      location.longitude!,
      Number(selectedOffice.latitude),
      Number(selectedOffice.longitude)
    );
  }, [location.latitude, location.longitude, selectedOffice, attendance.calculateDistance, location.hasLocation]);

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
    if (!location.hasLocation) {
      location.getLocation();
      return;
    }
    if (!camera.hasPhoto) {
      await handleOpenCamera();
      return;
    }
    try {
      if (attendance.isClockedIn) {
        await attendance.clockOut(
          location.latitude!, location.longitude!, selectedOfficeId,
          camera.photo || undefined, remark || undefined
        );
      } else {
        await attendance.clockIn(
          location.latitude!, location.longitude!, selectedOfficeId,
          camera.photo || undefined, remark || undefined
        );
      }
      location.clearLocation();
      camera.clearPhoto();
      faceVerification.reset();
      setRemark("");
    } catch { /* Error handled in hook */ }
  };

  const handleConfirmPhoto = () => handleCloseCamera();

  const handleRetakePhoto = () => {
    camera.clearPhoto();
    faceVerification.reset();
    camera.openCamera();
  };

  const isReady = !!selectedOfficeId && location.hasLocation && camera.hasPhoto && isWithinRadius && faceVerification.verificationPassed;
  const actionLabel = attendance.isClockedIn ? "CLOCK OUT" : "CLOCK IN";

  // Stepper steps (3-step: LOC, PHOTO, FINAL)
  const steps = [
    { label: "LOC", done: location.hasLocation && !!selectedOfficeId, icon: MapPin, active: !location.hasLocation || !selectedOfficeId },
    { label: "PHOTO", done: camera.hasPhoto && faceVerification.verificationPassed, icon: Camera, active: location.hasLocation && !!selectedOfficeId && !(camera.hasPhoto && faceVerification.verificationPassed) },
    { label: "FINAL", done: false, icon: ArrowRight, active: isReady },
  ];
  const currentStepIndex = steps.findIndex((s) => !s.done);

  // Compute work hours
  const workMinutes = useMemo(() => {
    if (!attendance.firstClockIn) return 0;
    const start = new Date(attendance.firstClockIn).getTime();
    const end = attendance.lastClockOut ? new Date(attendance.lastClockOut).getTime() : currentTime.getTime();
    return Math.max(0, Math.floor((end - start) / 60000));
  }, [attendance.firstClockIn, attendance.lastClockOut, currentTime]);

  const seconds = currentTime.getSeconds();

  // ─── STAFF VIEW ───
  const staffView = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 md:space-y-5"
    >
      {/* ── Circular Clock Hero ── */}
      <motion.div
        className="flex flex-col items-center py-4 relative md:py-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Soft radial gradient blob behind clock */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none md:w-64 md:h-64"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04) 50%, transparent 70%)" }}
        />
        <div className="relative">
          <ProgressRing
            value={seconds}
            max={60}
            size={isMobile ? 140 : 180}
            strokeWidth={3}
            color="hsl(var(--primary))"
            trackColor="hsl(var(--border))"
            className="relative z-10"
          >
            <div className="text-center">
              <p className="text-2xl font-bold tracking-tight text-foreground md:text-4xl">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 md:text-xs">
                {seconds}s
              </p>
            </div>
          </ProgressRing>
        </div>
        <p className="text-xs font-semibold text-foreground mt-3 md:mt-4 md:text-sm">
          {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 font-medium md:mt-1 md:text-2xs">
          SHIFT: GENERAL (08:00 – 17:00)
        </p>
      </motion.div>

      {/* ── Summary Stats Swiper ── */}
      <Swiper
        modules={[FreeMode]}
        slidesPerView={2}
        spaceBetween={isMobile ? 8 : 12}
        freeMode
        className="w-full overflow-hidden"
      >
        <SwiperSlide>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Card className="bg-card border-l-4 border-l-success shadow-card rounded-lg overflow-hidden md:rounded-xl">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-1.5 mb-1.5 md:gap-2 md:mb-2">
                  <div className="h-6 w-6 rounded-md bg-pastel-green flex items-center justify-center md:h-7 md:w-7 md:rounded-lg">
                    <LogIn className="h-3 w-3 text-success md:h-3.5 md:w-3.5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold md:text-2xs">Clock In</span>
                </div>
                <p className="text-base font-bold text-foreground md:text-lg">
                  {attendance.firstClockIn
                    ? new Date(attendance.firstClockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                    : "--:--"}
                </p>
                {attendance.firstClockIn && (
                  <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium md:mt-1 md:px-2 md:text-2xs">
                    On Time
                  </span>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </SwiperSlide>
        <SwiperSlide>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Card className="bg-card border-l-4 border-l-primary shadow-card rounded-lg overflow-hidden md:rounded-xl">
              <CardContent className="p-2 md:p-4">
                <div className="flex items-center gap-1.5 mb-1.5 md:gap-2 md:mb-2">
                  <div className="h-6 w-6 rounded-md bg-pastel-blue flex items-center justify-center md:h-7 md:w-7 md:rounded-lg">
                    <Timer className="h-3 w-3 text-primary md:h-3.5 md:w-3.5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold md:text-2xs">Work Hours</span>
                </div>
                <p className="text-base font-bold text-foreground md:text-lg">
                  {`${Math.floor(workMinutes / 60)}h ${workMinutes % 60}m`}
                </p>
                <Progress value={Math.min((workMinutes / 540) * 100, 100)} className="h-1 mt-1.5 md:h-1.5 md:mt-2" />
              </CardContent>
            </Card>
          </motion.div>
        </SwiperSlide>
      </Swiper>

      {/* ── Clock Status Badge ── */}
      <AnimatePresence>
        {attendance.isClockedIn && attendance.firstClockIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pastel-green text-success md:gap-2 md:px-4 md:py-2">
              <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success md:h-2.5 md:w-2.5" />
              </span>
              <span className="text-xs font-medium md:text-sm">
                Clocked in at{" "}
                {new Date(attendance.firstClockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Animated Stepper (3-step circles + lines) ── */}
      <div className="flex items-center justify-center gap-0 px-4 md:px-6">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              className="relative flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 md:h-10 md:w-10 md:text-sm",
                  step.done
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : step.active
                    ? "border-2 border-primary text-primary"
                    : "border-2 border-muted text-muted-foreground"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 md:h-4.5 md:w-4.5" />
                ) : (
                  <step.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-semibold uppercase tracking-wider md:text-2xs md:mt-1.5",
                step.done ? "text-primary" : step.active ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </motion.div>
            {i < steps.length - 1 && (
              <div className="w-8 h-[2px] mx-0.5 rounded-full bg-border overflow-hidden relative -mt-3 md:w-12 md:mx-1 md:-mt-4">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: step.done ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Action Cards (Office + Verification) ── */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Card className={cn(
            "bg-card rounded-lg shadow-card overflow-hidden border-t-2 md:rounded-xl",
            selectedOfficeId ? "border-t-success" : "border-t-muted"
          )}>
            <CardContent className="p-2.5 md:p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5 md:gap-2 md:mb-2">
                <MapPin className="h-3.5 w-3.5 text-primary md:h-4 md:w-4" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground md:text-2xs">Office</span>
              </div>
              <p className="text-[11px] font-medium text-foreground truncate md:text-xs">
                {selectedOffice?.name || "Not selected"}
              </p>
              {selectedOfficeId && isWithinRadius && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium md:mt-1.5 md:px-2 md:text-2xs">
                  LOCKED
                </span>
              )}
              {selectedOfficeId && distanceToOffice !== null && !isWithinRadius && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium md:mt-1.5 md:px-2 md:text-2xs">
                  OUT OF RANGE
                </span>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Card className={cn(
            "bg-card rounded-lg shadow-card overflow-hidden border-t-2 md:rounded-xl",
            faceVerification.verificationPassed ? "border-t-success" : camera.hasPhoto ? "border-t-warning" : "border-t-muted"
          )}>
            <CardContent className="p-2.5 md:p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5 md:gap-2 md:mb-2">
                {faceVerification.verificationPassed ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-success md:h-4 md:w-4" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-primary md:h-4 md:w-4" />
                )}
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground md:text-2xs">Verification</span>
              </div>
              <p className="text-[11px] font-medium text-foreground md:text-xs">
                {faceVerification.verificationPassed
                  ? `Verified (${faceVerification.verificationResult?.confidence}%)`
                  : camera.hasPhoto
                  ? faceVerification.isVerifying ? "Verifying..." : "Not verified"
                  : "Not captured"}
              </p>
              {faceVerification.verificationPassed && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium md:mt-1.5 md:px-2 md:text-2xs">
                  VERIFIED
                </span>
              )}
              {faceVerification.error && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium md:mt-1.5 md:px-2 md:text-2xs">
                  FAILED
                </span>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Clock Card ── */}
      <Card className="bg-card rounded-lg shadow-card border-0 md:rounded-xl">
        <CardContent className="p-3 md:p-5">
          <div className="space-y-2.5 md:space-y-3">
            {/* Office Selection */}
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 md:text-xs md:gap-1.5">
                <Building2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                Select Working Location
              </label>
              <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose your office..." />
                </SelectTrigger>
                <SelectContent>
                  {attendance.allOffices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      <span>{office.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOffice?.address && (
                <p className="text-[11px] text-muted-foreground pl-0.5 md:text-xs md:pl-1">{selectedOffice.address}</p>
              )}
            </div>

            {/* Distance Indicator */}
            {distanceToOffice !== null && selectedOffice && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs md:gap-2 md:px-3 md:py-2 md:text-sm",
                  isWithinRadius ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
                <span>
                  {formatDistance(distanceToOffice)} from {selectedOffice.name}
                  {!isWithinRadius && ` — Must be within ${formatDistance(selectedOffice.radiusMeters)}`}
                </span>
              </motion.div>
            )}

            {/* Location Status */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => location.getLocation()}
              disabled={location.loading}
              className={cn(
                "w-full flex items-center gap-2 p-2.5 rounded-lg transition-colors md:gap-3 md:p-3.5 md:rounded-xl",
                location.hasLocation ? "bg-pastel-green text-success" : location.error ? "bg-destructive/10 text-destructive" : "bg-muted/50 hover:bg-muted"
              )}
            >
              {location.loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0 md:h-5 md:w-5" /> : location.hasLocation ? <CheckCircle2 className="h-4 w-4 shrink-0 md:h-5 md:w-5" /> : location.error ? <XCircle className="h-4 w-4 shrink-0 md:h-5 md:w-5" /> : <MapPin className="h-4 w-4 text-muted-foreground shrink-0 md:h-5 md:w-5" />}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium md:text-sm">{location.hasLocation ? "Location Captured" : "Location"}</p>
                <p className="text-[11px] opacity-80 truncate md:text-xs">
                  {location.loading ? "Getting your location..." : location.hasLocation ? location.locationName || "Location detected" : location.error || "Tap to get current location"}
                </p>
              </div>
              {location.hasLocation && <RefreshCw className="h-3.5 w-3.5 opacity-60 shrink-0 md:h-4 md:w-4" />}
            </motion.button>

            {/* Photo Status */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenCamera}
              className={cn(
                "w-full flex items-center gap-2 p-2.5 rounded-lg transition-colors md:gap-3 md:p-3.5 md:rounded-xl",
                camera.hasPhoto ? "bg-pastel-green text-success" : "bg-muted/50 hover:bg-muted"
              )}
            >
              {faceVerification.verificationPassed ? <ShieldCheck className="h-4 w-4 shrink-0 md:h-5 md:w-5" /> : camera.hasPhoto ? <CheckCircle2 className="h-4 w-4 shrink-0 md:h-5 md:w-5" /> : <Camera className="h-4 w-4 text-muted-foreground shrink-0 md:h-5 md:w-5" />}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium md:text-sm">
                  {faceVerification.verificationPassed ? "Face Verified" : camera.hasPhoto ? "Photo Captured" : "Photo"}
                </p>
                <p className="text-[11px] opacity-80 truncate md:text-xs">
                  {faceVerification.verificationPassed
                    ? `${faceVerification.verificationResult?.confidence}% confidence`
                    : camera.hasPhoto ? "Tap to retake" : "Selfie required for clock-in"}
                </p>
              </div>
              {camera.hasPhoto && (
                <div className="h-8 w-8 rounded-md overflow-hidden shrink-0 md:h-10 md:w-10 md:rounded-lg">
                  <img src={camera.photo!} alt="Selfie" className="h-full w-full object-cover" />
                </div>
              )}
            </motion.button>

            {/* Remark Field */}
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 md:text-xs md:gap-1.5">
                <MessageSquare className="h-3 w-3 md:h-3.5 md:w-3.5" />
                Remark (optional)
              </label>
              <Textarea
                placeholder="Add a note for this entry..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="min-h-[52px] text-xs resize-none md:min-h-[60px] md:text-sm"
              />
            </div>

            {/* Clock Button */}
            <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.01 }}>
              <Button
                onClick={handleClock}
                disabled={
                  attendance.isClocking || attendance.logsLoading || !selectedOfficeId ||
                  (location.hasLocation && !isWithinRadius)
                }
                className={cn(
                  "w-full h-12 text-sm rounded-lg font-bold uppercase tracking-wider relative overflow-hidden text-primary-foreground shadow-sm md:h-14 md:text-lg md:rounded-xl",
                  attendance.isClockedIn
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {/* Shine sweep effect */}
                <span className="absolute inset-0 pointer-events-none">
                  <span className="absolute inset-0 animate-shine-sweep bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </span>
                <span className="relative flex items-center justify-center gap-1.5 md:gap-2">
                  {attendance.isClocking ? (
                    <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" />
                  ) : (
                    <Clock className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                  {!selectedOfficeId
                    ? "Select Office First"
                    : !location.hasLocation
                    ? "Get Location First"
                    : !isWithinRadius
                    ? "Outside Office Radius"
                    : !camera.hasPhoto
                    ? "Take Photo First"
                    : actionLabel}
                </span>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* ── Today's Timeline ── */}
      <section>
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider md:text-xs">Today's Timeline</h2>
          <button className="text-[11px] text-primary font-medium hover:underline md:text-xs">VIEW HISTORY</button>
        </div>
        {attendance.logsLoading ? (
          <div className="flex justify-center py-3 md:py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground md:h-6 md:w-6" />
          </div>
        ) : attendance.todayLogs && attendance.todayLogs.length > 0 ? (
          <div className="space-y-1.5 md:space-y-2">
            {[...attendance.todayLogs].reverse().map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
              >
                <Card className={cn(
                  "bg-card rounded-lg shadow-card overflow-hidden border-l-4 md:rounded-xl",
                  i === 0 ? "border-l-accent" : log.type === "clock_in" ? "border-l-success" : "border-l-muted"
                )}>
                  <CardContent className="p-2.5 flex items-center justify-between gap-2 md:p-3 md:gap-3">
                    <div className="flex items-center gap-2 min-w-0 md:gap-3">
                      <div className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center shrink-0 md:h-8 md:w-8 md:rounded-lg",
                        log.type === "clock_in" ? "bg-pastel-green" : "bg-pastel-orange"
                      )}>
                        {log.type === "clock_in" ? (
                          <LogIn className="h-3 w-3 text-success md:h-4 md:w-4" />
                        ) : (
                          <LogOut className="h-3 w-3 text-accent md:h-4 md:w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground md:text-sm">
                          {log.type === "clock_in" ? "Clock In" : "Clock Out"}
                        </p>
                        {log.distanceMeters && (
                          <p className="text-[11px] text-muted-foreground md:text-xs">
                            {formatDistance(log.distanceMeters)} from office
                          </p>
                        )}
                        {log.notes && (
                          <p className="text-[11px] text-muted-foreground italic mt-0.5 truncate md:text-xs">"{log.notes}"</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-foreground shrink-0 md:text-sm">
                      {new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-card rounded-lg shadow-card md:rounded-xl">
            <CardContent className="py-4 md:py-6">
              <p className="text-xs text-muted-foreground text-center md:text-sm">No clock-in record for today</p>
            </CardContent>
          </Card>
        )}
      </section>
    </motion.div>
  );

  // ─── ADMIN VIEW ───
  const selectedStaffProfile = selectedStaffId ? admin.getProfileForUser(selectedStaffId) : null;
  const selectedStaffLogs = selectedStaffId ? admin.getLogsForUser(selectedStaffId) : [];

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <PhotoVerificationFeed photos={admin.recentPhotos} />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <LocationManager />
          </motion.div>
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
  const showAdminView = activeChip !== "my-attendance";
  // For superadmin chip, show both staff + admin
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
