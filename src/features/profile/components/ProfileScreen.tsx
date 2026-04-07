"use client";

import React, { useContext, useState } from "react";
import {
  Moon,
  Sun,
  User,
  Mail,
  Phone,
  BadgeCheck,
  Briefcase,
  Building2,
  Camera,
  ChevronRight,
  ScanFace,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomizerContext } from "@/app/context/CustomizerContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useAuth } from "@/shared/hooks/useAuth";

export function ProfileScreen() {
  const customizer = useContext(CustomizerContext);
  const isDark = customizer?.activeMode === "dark";
  const toggleTheme = () => {
    if (!customizer) return;
    customizer.setActiveMode(isDark ? "light" : "dark");
  };

  const { profile, uploadFacePhoto } = useProfile();
  const { user } = useAuth();

  const fullName = profile?.fullName ?? user?.name ?? "User";
  const email = profile?.email ?? user?.email ?? "unknown@example.com";
  const phone = profile?.phone ?? "Not set";
  const employeeId = profile?.employeeId ?? "—";
  const department = profile?.department ?? "Not set";
  const officeName = profile?.office?.name ?? "Not assigned";
  const officeAddress = profile?.office?.address ?? "";
  const avatarUrl =
    profile?.avatarUrl ??
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
  const faceFrontUrl = profile?.faceFrontUrl ?? null;
  const faceLeftUrl = profile?.faceLeftUrl ?? null;
  const faceRightUrl = profile?.faceRightUrl ?? null;

  const [uploadingPosition, setUploadingPosition] = useState<
    "front" | "left" | "right" | null
  >(null);

  const handleFacePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    position: "front" | "left" | "right",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPosition(position);
    try {
      await uploadFacePhoto({ file, position });
    } finally {
      setUploadingPosition(null);
      event.target.value = "";
    }
  };

  const faceSlots = [
    { label: "Front", position: "front" as const, url: faceFrontUrl },
    { label: "Left", position: "left" as const, url: faceLeftUrl },
    { label: "Right", position: "right" as const, url: faceRightUrl },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans selection:bg-primary/20">
      <div
        className={cn(
          "w-full bg-card text-card-foreground flex flex-col relative overflow-hidden",
          "max-w-[400px] min-h-[850px] rounded-[2.5rem] shadow-2xl border-[6px] border-border mx-auto",
          "md:max-w-none md:min-h-0 md:rounded-2xl md:border md:border-border md:shadow-sm md:mx-0",
          "lg:max-w-5xl lg:mx-auto"
        )}
      >
        <div className="absolute top-0 left-0 right-0 h-80 md:h-48 bg-gradient-to-b from-primary/15 via-primary/5 dark:from-primary/25 dark:via-primary/10 to-transparent pointer-events-none z-0" />

        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-12 md:pb-6 z-10 relative">
          <header className="flex items-center px-6 pt-8 pb-2 sticky top-0 z-30 bg-gradient-to-b from-muted/90 dark:from-muted/50 to-transparent backdrop-blur-sm md:rounded-t-2xl border-b border-border/40 md:border-0">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Profile
            </h1>
          </header>

          <div className="flex flex-col items-center pt-8 pb-6 px-6 relative z-10 md:flex-row md:items-start md:gap-8 md:pt-6">
            <div className="relative mb-5 group cursor-pointer md:shrink-0">
              <div className="w-[110px] h-[110px] rounded-full p-1 bg-gradient-to-tr from-[#00D2FF] via-[#3A7BD5] to-[#8A2BE2] shadow-lg">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-card bg-muted"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full border-[3px] border-card flex items-center justify-center shadow-md text-primary-foreground">
                <Camera size={14} strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start md:flex-1">
              <h2 className="text-2xl font-black text-foreground mb-1.5">
                {fullName}
              </h2>
              <div className="bg-muted/80 backdrop-blur-md text-muted-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-border/60">
                ID: {employeeId}
              </div>
              <p className="text-muted-foreground text-sm font-semibold">{email}</p>
            </div>
          </div>

          <div className="px-5 md:px-6 space-y-7 mt-2 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            <section>
              <SectionTitle title="Personal Information" />
              <div className="bg-card rounded-[1.5rem] p-2 border border-border/60 shadow-sm space-y-1">
                <InfoRow
                  icon={<User size={20} className="text-primary" />}
                  iconBg="bg-primary/10 dark:bg-primary/20"
                  label="Full Name"
                  value={fullName}
                  hasArrow
                />
                <Divider />
                <InfoRow
                  icon={<Mail size={20} className="text-orange-500 dark:text-orange-400" />}
                  iconBg="bg-orange-500/10 dark:bg-orange-400/15"
                  label="Email"
                  value={email}
                  badge="Read-only"
                />
                <Divider />
                <InfoRow
                  icon={<Phone size={20} className="text-emerald-500 dark:text-emerald-400" />}
                  iconBg="bg-emerald-500/10 dark:bg-emerald-400/15"
                  label="Phone"
                  value={phone ?? "Not set"}
                  hasArrow
                />
                <Divider />
                <InfoRow
                  icon={<BadgeCheck size={20} className="text-violet-500 dark:text-violet-400" />}
                  iconBg="bg-violet-500/10 dark:bg-violet-400/15"
                  label="Employee ID"
                  value={employeeId}
                  hasArrow
                />
              </div>
            </section>

            <section>
              <SectionTitle title="Work Information" />
              <div className="bg-card rounded-[1.5rem] p-2 border border-border/60 shadow-sm space-y-1">
                <InfoRow
                  icon={<Briefcase size={20} className="text-amber-500 dark:text-amber-400" />}
                  iconBg="bg-amber-500/10 dark:bg-amber-400/15"
                  label="Department"
                  value={department}
                  valueClass="text-muted-foreground italic font-semibold"
                  hasArrow
                />
                <Divider />
                <InfoRow
                  icon={<Building2 size={20} className="text-primary" />}
                  iconBg="bg-primary/10 dark:bg-primary/20"
                  label="Office"
                  value={officeName}
                  subValue={officeAddress}
                  badge="Read-only"
                />
              </div>
            </section>

            <section className="lg:col-span-2">
              <SectionTitle title="Face Verification" />
              <div className="bg-card rounded-[1.5rem] p-5 border border-border/60 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 mb-4">
                  <h4 className="text-foreground font-black text-sm mb-1 flex items-center gap-2">
                    <ScanFace size={18} className="text-primary" />
                    Face Registered
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed font-medium">
                    Upload front, left, and right face photos for attendance
                    verification.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 relative z-10">
                  {faceSlots.map(({ label, position, url }) => (
                    <label
                      key={position}
                      className="block cursor-pointer group"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFacePhotoChange(e, position)}
                        disabled={uploadingPosition !== null}
                      />
                      <div className="rounded-xl overflow-hidden bg-muted shadow-inner border-2 border-border/50 group-hover:border-primary/30 transition-colors aspect-square flex flex-col items-center justify-center min-h-[100px]">
                        {url ? (
                          <img
                            src={url}
                            alt={`Face ${label}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                            <Camera size={24} className="text-muted-foreground" />
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {uploadingPosition === position
                                ? "Uploading..."
                                : "Add Photo"}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-center text-[11px] font-bold text-muted-foreground mt-2 uppercase tracking-wider">
                        {label}
                      </p>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="pb-8 lg:col-span-2">
              <SectionTitle title="Preferences" />
              <div className="bg-card rounded-[1.5rem] p-2 border border-border/60 shadow-sm">
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-[46px] h-[46px] rounded-[1.1rem] flex items-center justify-center bg-violet-500/10 dark:bg-violet-400/15">
                      {isDark ? (
                        <Moon size={22} className="text-violet-500 dark:text-violet-400" />
                      ) : (
                        <Sun size={22} className="text-amber-500 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest mb-0.5">
                        Theme
                      </span>
                      <span className="text-[14px] font-black text-foreground">
                        {isDark ? "Dark mode" : "Light mode"}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        {isDark ? "Switch to light theme" : "Switch to dark theme"}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mr-2">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isDark}
                      onChange={toggleTheme}
                    />
                    <div className="w-[52px] h-[30px] bg-muted rounded-full border border-border peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-background after:border-border after:border after:rounded-full after:h-[24px] after:w-[24px] after:transition-all after:shadow-sm peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-3 ml-4">
      {title}
    </h3>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subValue?: string;
  badge?: string;
  hasArrow?: boolean;
  valueClass?: string;
}

function InfoRow({
  icon,
  iconBg,
  label,
  value,
  subValue,
  badge,
  hasArrow,
  valueClass,
}: InfoRowProps) {
  return (
    <div className="flex items-center justify-between p-3 py-3.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer">
      <div className="flex items-center gap-4">
        <div
          className={`w-[46px] h-[46px] rounded-[1.1rem] flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest mb-0.5">
            {label}
          </span>
          <span
            className={cn(
              "text-[14px] font-black text-foreground leading-tight",
              valueClass || ""
            )}
          >
            {value}
          </span>
          {subValue && (
            <span className="text-[11px] text-muted-foreground font-semibold mt-1 truncate max-w-[180px]">
              {subValue}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg border border-border">
            {badge}
          </span>
        )}
        {hasArrow && (
          <ChevronRight
            size={18}
            className="text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-0.5"
          />
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border mx-4" />;
}

