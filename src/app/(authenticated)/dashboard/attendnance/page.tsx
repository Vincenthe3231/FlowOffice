"use client";

import { useState, useEffect, useMemo } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
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
      await faceVerification.verifyFace(photoData, profile?.facePhotoUrl || profile?.avatarUrl);
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
      className="space-y-5"
    >
      {/* ── Circular Clock Hero ── */}
      <motion.div
        className="flex flex-col items-center py-8 relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Soft radial gradient blob behind clock */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04) 50%, transparent 70%)" }}
        />
        <div className="relative">
          <ProgressRing
            value={seconds}
            max={60}
            size={180}
            strokeWidth={3}
            color="hsl(var(--primary))"
            trackColor="hsl(var(--border))"
            className="relative z-10"
          >
            <div className="text-center">
              <p className="text-4xl font-bold tracking-tight text-foreground">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {seconds}s
              </p>
            </div>
          </ProgressRing>
        </div>
        <p className="text-sm font-semibold text-foreground mt-4">
          {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <p className="text-2xs uppercase tracking-widest text-muted-foreground mt-1 font-medium">
          SHIFT: GENERAL (08:00 – 17:00)
        </p>
      </motion.div>

      {/* ── Summary Stats Swiper ── */}
      <Swiper
        modules={[FreeMode]}
        slidesPerView={2}
        spaceBetween={12}
        freeMode
        className="!overflow-visible"
      >
        <SwiperSlide>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Card className="bg-card border-l-4 border-l-success shadow-card rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-pastel-green flex items-center justify-center">
                    <LogIn className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span className="text-2xs uppercase tracking-wider text-muted-foreground font-semibold">Clock In</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {attendance.firstClockIn
                    ? new Date(attendance.firstClockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                    : "--:--"}
                </p>
                {attendance.firstClockIn && (
                  <span className="inline-block mt-1 text-2xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                    On Time
                  </span>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </SwiperSlide>
        <SwiperSlide>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Card className="bg-card border-l-4 border-l-primary shadow-card rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-pastel-blue flex items-center justify-center">
                    <Timer className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-2xs uppercase tracking-wider text-muted-foreground font-semibold">Work Hours</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {`${Math.floor(workMinutes / 60)}h ${workMinutes % 60}m`}
                </p>
                <Progress value={Math.min((workMinutes / 540) * 100, 100)} className="h-1.5 mt-2" />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pastel-green text-success">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <span className="text-sm font-medium">
                Clocked in at{" "}
                {new Date(attendance.firstClockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Animated Stepper (3-step circles + lines) ── */}
      <div className="flex items-center justify-center gap-0 px-6">
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
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  step.done
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : step.active
                    ? "border-2 border-primary text-primary"
                    : "border-2 border-muted text-muted-foreground"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4.5 w-4.5" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className={cn(
                "text-2xs mt-1.5 font-semibold uppercase tracking-wider",
                step.done ? "text-primary" : step.active ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </motion.div>
            {i < steps.length - 1 && (
              <div className="w-12 h-[2px] mx-1 rounded-full bg-border overflow-hidden relative -mt-4">
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
      <div className="grid grid-cols-2 gap-3">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Card className={cn(
            "bg-card rounded-xl shadow-card overflow-hidden border-t-2",
            selectedOfficeId ? "border-t-success" : "border-t-muted"
          )}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-2xs uppercase tracking-wider font-semibold text-muted-foreground">Office</span>
              </div>
              <p className="text-xs font-medium text-foreground truncate">
                {selectedOffice?.name || "Not selected"}
              </p>
              {selectedOfficeId && isWithinRadius && (
                <span className="inline-block mt-1.5 text-2xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                  LOCKED
                </span>
              )}
              {selectedOfficeId && distanceToOffice !== null && !isWithinRadius && (
                <span className="inline-block mt-1.5 text-2xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                  OUT OF RANGE
                </span>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Card className={cn(
            "bg-card rounded-xl shadow-card overflow-hidden border-t-2",
            faceVerification.verificationPassed ? "border-t-success" : camera.hasPhoto ? "border-t-warning" : "border-t-muted"
          )}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                {faceVerification.verificationPassed ? (
                  <ShieldCheck className="h-4 w-4 text-success" />
                ) : (
                  <Camera className="h-4 w-4 text-primary" />
                )}
                <span className="text-2xs uppercase tracking-wider font-semibold text-muted-foreground">Verification</span>
              </div>
              <p className="text-xs font-medium text-foreground">
                {faceVerification.verificationPassed
                  ? `Verified (${faceVerification.verificationResult?.confidence}%)`
                  : camera.hasPhoto
                  ? faceVerification.isVerifying ? "Verifying..." : "Not verified"
                  : "Not captured"}
              </p>
              {faceVerification.verificationPassed && (
                <span className="inline-block mt-1.5 text-2xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                  VERIFIED
                </span>
              )}
              {faceVerification.error && (
                <span className="inline-block mt-1.5 text-2xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                  FAILED
                </span>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Clock Card ── */}
      <Card className="bg-card rounded-xl shadow-card border-0">
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Office Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
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
                <p className="text-xs text-muted-foreground pl-1">{selectedOffice.address}</p>
              )}
            </div>

            {/* Distance Indicator */}
            {distanceToOffice !== null && selectedOffice && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                  isWithinRadius ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}
              >
                <MapPin className="h-4 w-4" />
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
                "w-full flex items-center gap-3 p-3.5 rounded-xl transition-colors",
                location.hasLocation ? "bg-pastel-green text-success" : location.error ? "bg-destructive/10 text-destructive" : "bg-muted/50 hover:bg-muted"
              )}
            >
              {location.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : location.hasLocation ? <CheckCircle2 className="h-5 w-5" /> : location.error ? <XCircle className="h-5 w-5" /> : <MapPin className="h-5 w-5 text-muted-foreground" />}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{location.hasLocation ? "Location Captured" : "Location"}</p>
                <p className="text-xs opacity-80">
                  {location.loading ? "Getting your location..." : location.hasLocation ? location.locationName || "Location detected" : location.error || "Tap to get current location"}
                </p>
              </div>
              {location.hasLocation && <RefreshCw className="h-4 w-4 opacity-60" />}
            </motion.button>

            {/* Photo Status */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenCamera}
              className={cn(
                "w-full flex items-center gap-3 p-3.5 rounded-xl transition-colors",
                camera.hasPhoto ? "bg-pastel-green text-success" : "bg-muted/50 hover:bg-muted"
              )}
            >
              {faceVerification.verificationPassed ? <ShieldCheck className="h-5 w-5" /> : camera.hasPhoto ? <CheckCircle2 className="h-5 w-5" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">
                  {faceVerification.verificationPassed ? "Face Verified" : camera.hasPhoto ? "Photo Captured" : "Photo"}
                </p>
                <p className="text-xs opacity-80">
                  {faceVerification.verificationPassed
                    ? `${faceVerification.verificationResult?.confidence}% confidence`
                    : camera.hasPhoto ? "Tap to retake" : "Selfie required for clock-in"}
                </p>
              </div>
              {camera.hasPhoto && (
                <div className="h-10 w-10 rounded-lg overflow-hidden">
                  <img src={camera.photo!} alt="Selfie" className="h-full w-full object-cover" />
                </div>
              )}
            </motion.button>

            {/* Remark Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Remark (optional)
              </label>
              <Textarea
                placeholder="Add a note for this entry..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
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
                  "w-full h-14 text-lg rounded-xl font-bold uppercase tracking-wider relative overflow-hidden",
                  attendance.isClockedIn
                    ? "bg-gradient-accent hover:opacity-90"
                    : "bg-gradient-primary hover:opacity-90"
                )}
              >
                {/* Shine sweep effect */}
                <span className="absolute inset-0 pointer-events-none">
                  <span className="absolute inset-0 animate-shine-sweep bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </span>
                <span className="relative flex items-center justify-center gap-2">
                  {attendance.isClocking ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Clock className="h-5 w-5" />
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Timeline</h2>
          <button className="text-xs text-primary font-medium hover:underline">VIEW HISTORY</button>
        </div>
        {attendance.logsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : attendance.todayLogs && attendance.todayLogs.length > 0 ? (
          <div className="space-y-2">
            {[...attendance.todayLogs].reverse().map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
              >
                <Card className={cn(
                  "bg-card rounded-xl shadow-card overflow-hidden border-l-4",
                  i === 0 ? "border-l-accent" : log.type === "clock_in" ? "border-l-success" : "border-l-muted"
                )}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        log.type === "clock_in" ? "bg-pastel-green" : "bg-pastel-orange"
                      )}>
                        {log.type === "clock_in" ? (
                          <LogIn className="h-4 w-4 text-success" />
                        ) : (
                          <LogOut className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {log.type === "clock_in" ? "Clock In" : "Clock Out"}
                        </p>
                        {log.distanceMeters && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistance(log.distanceMeters)} from office
                          </p>
                        )}
                        {log.notes && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">"{log.notes}"</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-card rounded-xl shadow-card">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">No clock-in record for today</p>
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
      className="space-y-4"
    >
      {admin.logsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Staff Present Today ({admin.presentToday})</SheetTitle>
          </SheetHeader>
          <div className="mt-3 space-y-1">
            {admin.presentStaff.map((staff) => (
              <button
                key={staff.userId}
                onClick={() => { setViewAllOpen(false); setSelectedStaffId(staff.userId); }}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <p className="text-sm font-medium">{staff.name}</p>
                <p className="text-xs text-muted-foreground">
                  {staff.time && new Date(staff.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </button>
            ))}
            {admin.presentStaff.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No staff present today</p>
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
    <MobileLayout showFab={false}>
      <PageHeader title="Attendance" subtitle="Clock in/out" />

      <div className="px-4 py-6 space-y-6">
        {/* ── Role Preview Chips ── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {roleChips.map((chip) => (
            <motion.button
              key={chip.id}
              onClick={() => setActiveChip(chip.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
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
            <motion.div key="superadmin" className="space-y-6">
              {staffView}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Admin Console</h3>
                {adminView}
              </div>
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
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Take Selfie</DialogTitle>
              <button
                onClick={handleCloseCamera}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="relative aspect-[4/3] bg-black">
            {camera.error ? (
              <div className="absolute inset-0 flex items-center justify-center text-destructive p-4 text-center">
                <div>
                  <XCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{camera.error}</p>
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
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3"
                    >
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm font-medium text-white">Verifying face...</p>
                    </motion.div>
                  )}
                  {faceVerification.verificationPassed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <ShieldCheck className="h-14 w-14 text-success" />
                      </motion.div>
                      <p className="text-lg font-bold text-white">
                        {faceVerification.verificationResult?.confidence}% Match
                      </p>
                      <p className="text-xs text-white/70">
                        {faceVerification.verificationResult?.reason}
                      </p>
                    </motion.div>
                  )}
                  {!faceVerification.isVerifying && faceVerification.error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 px-6"
                    >
                      <AlertTriangle className="h-12 w-12 text-destructive" />
                      <p className="text-sm font-medium text-white text-center">{faceVerification.error}</p>
                    </motion.div>
                  )}
                  {!faceVerification.isVerifying && faceVerification.verificationResult && !faceVerification.verificationPassed && !faceVerification.error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 px-6"
                    >
                      <XCircle className="h-12 w-12 text-destructive" />
                      <p className="text-sm font-bold text-white">Verification Failed</p>
                      <p className="text-xs text-white/70 text-center">
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

          <div className="p-4 flex gap-3">
            {camera.photo ? (
              <>
                <Button variant="outline" className="flex-1" onClick={handleRetakePhoto}>
                  Retake
                </Button>
                <Button
                  className="flex-1 bg-gradient-primary"
                  onClick={handleConfirmPhoto}
                  disabled={faceVerification.isVerifying || (!faceVerification.verificationPassed && !faceVerification.error)}
                >
                  {faceVerification.verificationPassed ? "Use Photo" : faceVerification.isVerifying ? "Verifying..." : "Use Photo"}
                </Button>
              </>
            ) : (
              <Button className="w-full bg-gradient-primary" onClick={handleCapture} disabled={!camera.isOpen || !!camera.error}>
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
