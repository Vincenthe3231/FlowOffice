"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Layers,
  GitBranch,
  FileText,
  ShieldCheck,
  Receipt,
  Car,
  Plane,
  Package,
  Building2,
  MapPin,
  Hammer,
  Route,
  Bus,
  Bike,
  FileText as FileTextIcon,
  Clock,
  AlertCircle,
  Settings,
} from "lucide-react";
import { ReceiptClaimForm } from "@/features/claims/components/ReceiptClaimForm";
import { MileageClaimForm } from "@/features/claims/components/MileageClaimForm";
import { CustomFieldBuilder } from "@/features/claims/components/CustomFieldBuilder";
import { ClaimReviewSummary } from "@/features/claims/components/ClaimReviewSummary";
import { ApprovalTimeline } from "@/features/claims/components/ApprovalTimeline";
import { CreateSubclaimDialog } from "@/features/claims/components/CreateSubclaimDialog";
import { useClaimDraftStore } from "@/features/claims/stores/useClaimDraftStore";
import { useProfile } from "@/features/profile/hooks/useProfile";
import {
  useClaimTypes,
  useSubclaimTypes,
  useSubmitClaim,
  useApprovalThreshold,
  useClaimCategories,
  useClaimById,
} from "@/features/claims/hooks/useClaims";
import { calculateDistance } from "@/shared/lib/api-client/claims";
import type { Claim, ClaimType, ClaimApproval } from "@/features/claims/types";

const steps = [
  { id: 1, label: "Claimant", icon: User },
  { id: 2, label: "Claim Type", icon: Layers },
  { id: 3, label: "Subclaim", icon: GitBranch },
  { id: 4, label: "Details", icon: FileText },
  { id: 5, label: "Review", icon: ShieldCheck },
];

const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  receipt: Receipt,
  mileage: Car,
  plane: Plane,
  package: Package,
  building: Building2,
  mappin: MapPin,
  hammer: Hammer,
  route: Route,
  bus: Bus,
  bike: Bike,
  filetext: FileTextIcon,
  clock: Clock,
};

const typeColorMap: Record<string, string> = {
  "stat-blue": "bg-stat-blue text-stat-blue-icon",
  "stat-purple": "bg-stat-purple text-stat-purple-icon",
  "stat-green": "bg-stat-green text-stat-green-icon",
  "stat-orange": "bg-stat-orange text-stat-orange-icon",
  "stat-pink": "bg-stat-pink text-stat-pink-icon",
  "stat-cyan": "bg-stat-cyan text-stat-cyan-icon",
};

export function NewClaimWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const resubmitParam = searchParams.get("resubmit");
  const resubmitId =
    resubmitParam != null ? parseInt(resubmitParam, 10) : null;
  const resubmitIdValid =
    resubmitId != null && !Number.isNaN(resubmitId) ? resubmitId : null;

  const draft = useClaimDraftStore();
  const { profile } = useProfile();
  const resubmitLoadedRef = useRef(false);
  const draftPromptShownRef = useRef(false);
  const prevStepRef = useRef<number>(0);

  const isClaimTypesAdmin =
    profile?.role === "hr_admin" || profile?.role === "super_admin";

  const { data: claimTypes, isLoading: typesLoading } = useClaimTypes();
  const { data: subclaimTypes } = useSubclaimTypes(draft.selectedTypeId);
  const { data: threshold } = useApprovalThreshold();
  const { data: categories = [] } = useClaimCategories();
  const submitClaim = useSubmitClaim();
  const { data: resubmitClaim } = useClaimById(resubmitIdValid);

  const currentStep = draft.currentStep;
  const displayClaimTypes = claimTypes ?? [];
  const selectedTypeData = displayClaimTypes.find((t) => t.id === draft.selectedTypeId);

  // Resubmit: when claim is loaded, clear draft and populate from API (Claim shape; extend when API returns claimant/custom_fields)
  useEffect(() => {
    if (
      resubmitIdValid == null ||
      !resubmitClaim ||
      resubmitLoadedRef.current
    )
      return;
    resubmitLoadedRef.current = true;
    draft.clearDraft();
    const c = resubmitClaim as Claim & {
      claimant_name?: string;
      claimant_nickname?: string;
      claim_type_id?: string | number;
      subclaim_type_id?: string | number;
      custom_fields?: Array<{ id: string; label: string; type: string; value: string; options?: string[] }>;
    };
    draft.setClaimant(
      c.claimant_name ?? "",
      c.claimant_nickname ?? ""
    );
    const typesForResubmit = claimTypes ?? [];
    if (c.type) {
      const typeMatch = typesForResubmit.find(
        (t) => t.key === c.type || t.id === String(c.claim_type_id ?? "")
      );
      if (typeMatch) draft.setType(typeMatch.id, typeMatch.key);
    }
    if (c.subclaim_type_id != null)
      draft.setSubclaim(String(c.subclaim_type_id));
    const formData: Record<string, unknown> = {
      title: c.title ?? "",
      description: c.description ?? "",
      amount: String(c.amount ?? ""),
      category: c.category ?? "",
      receiptDate: c.date ?? "",
      merchant: c.merchant ?? "",
    };
    if (c.type === "mileage") {
      formData.fromLocation = c.fromLocation ?? "";
      formData.toLocation = c.toLocation ?? "";
      formData.distance = c.distance != null ? String(c.distance) : "";
    }
    draft.setFormData(formData);
    if (Array.isArray(c.custom_fields))
      draft.setCustomFields(
        c.custom_fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type as "text" | "number" | "date" | "dropdown" | "mileage" | "percentage" | "photo",
          value: f.value,
          options: f.options,
        }))
      );
    draft.setStep(1);
    toast.info("Claim loaded for resubmission", {
      description: "Edit any step and resubmit.",
    });
  }, [resubmitIdValid, resubmitClaim, claimTypes, draft]);

  // Clear claim type selection when entering step 2 so Next stays disabled until user picks a type (avoids persisted draft making Next enabled)
  useEffect(() => {
    if (currentStep === 2 && prevStepRef.current !== 2) {
      draft.setType(null, null);
    }
    prevStepRef.current = currentStep;
  }, [currentStep, draft]);

  // Draft-resume toast (one-time when opening /claims/new with existing draft, no resubmit)
  useEffect(() => {
    if (
      resubmitIdValid != null ||
      !draft.hasDraft ||
      draft.lastSaved <= 0 ||
      draftPromptShownRef.current
    )
      return;
    draftPromptShownRef.current = true;
    const lastSaved = new Date(draft.lastSaved).toLocaleString();
    toast("Resume unsaved draft?", {
      description: `Last saved ${lastSaved}`,
      duration: 8000,
      action: {
        label: "Restore",
        onClick: () => {},
      },
      cancel: {
        label: "Discard",
        onClick: () => draft.clearDraft(),
      },
    });
  }, [resubmitIdValid, draft.hasDraft, draft.lastSaved, draft]);

  // Sync claimant name from profile when not resubmitting (profile name is source of truth)
  useEffect(() => {
    if (resubmitIdValid != null || !profile) return;
    const name = profile.fullName ?? "";
    if (name.trim()) draft.setClaimant(name.trim(), "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft.setClaimant is stable; only run when profile or resubmit changes
  }, [profile, resubmitIdValid]);

  // Pre-select type from URL (e.g. ?type=receipt or ?type=mileage)
  useEffect(() => {
    if (!typeParam) return;
    const types = claimTypes ?? [];
    const match = types.find((t) => t.key === typeParam || t.id === typeParam);
    if (match) draft.setType(match.id, match.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when URL or claimTypes change, not on every draft update
  }, [typeParam, claimTypes]);

  const canNext = () => {
    if (currentStep === 1) return draft.claimantName.trim().length > 0;
    if (currentStep === 2) return draft.selectedTypeId !== null;
    if (currentStep === 3)
      return !subclaimTypes?.length || draft.selectedSubclaimId !== null;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 2 && !draft.selectedTypeId) {
      toast.error("Please select a claim type.");
      return;
    }
    if (currentStep < 5) draft.setStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) draft.setStep(currentStep - 1);
    else router.push("/dashboard/claims");
  };

  const getAmount = (): number => {
    return parseFloat(String(draft.formData.amount ?? "0")) || 0;
  };

  const thresholdAmount = threshold?.level3Min ?? threshold?.level2Max ?? 500;
  const needsL3 = getAmount() >= thresholdAmount;

  const handleSubmit = async () => {
    if (!draft.selectedTypeId) return;
    const amount = getAmount();

    const approvalLevels = [
      { level: 1, approverRole: "HOD", status: "pending" },
      { level: 2, approverRole: "Admin/HR", status: "pending" },
      ...(needsL3
        ? [{ level: 3, approverRole: "Superadmin", status: "pending" }]
        : []),
    ];

    try {
      await submitClaim.mutateAsync({
        claim: {
          claimantName: draft.claimantName,
          claimantNickname: draft.claimantNickname,
          claimTypeId: draft.selectedTypeId,
          subclaimTypeId: draft.selectedSubclaimId || null,
          title:
            String(draft.formData.title ?? "").trim() ||
            selectedTypeData?.label ||
            "Claim",
          description:
            (draft.formData.description as string)?.trim() || null,
          amount,
          currency: "RM",
          status: "pending_l1",
          metadata: {
            merchant: draft.formData.merchant,
            category: draft.formData.category,
            fromLocation: draft.formData.fromLocation,
            toLocation: draft.formData.toLocation,
            distance: draft.formData.distance,
            receiptDate: draft.formData.receiptDate,
          },
          customFields: draft.customFields,
        },
        approvalLevels,
      });
      draft.clearDraft();
      router.push("/dashboard/claims");
    } catch {
      // toast in mutation
    }
  };

  const previewApprovals: ClaimApproval[] = [
    {
      id: 1,
      claimId: 0,
      level: 1,
      status: "pending",
      reason: null,
      decidedAt: null,
    },
    {
      id: 2,
      claimId: 0,
      level: 2,
      status: "pending",
      reason: null,
      decidedAt: null,
    },
    ...(needsL3
      ? [
          {
            id: 3,
            claimId: 0,
            level: 3,
            status: "pending" as const,
            reason: null,
            decidedAt: null,
          },
        ]
      : []),
  ];

  const mileageRate =
    subclaimTypes?.find((s) => s.id === draft.selectedSubclaimId)?.rate ??
    0.8;

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  const runMileageDistanceCalculation = useCallback(() => {
    const from = String(draft.formData.fromLocation ?? "").trim();
    const to = String(draft.formData.toLocation ?? "").trim();
    if (!from || !to) return;
    calculateDistance(from, to)
      .then((km) => {
        if (km !== null) {
          const distanceCeiled = Math.ceil(km);
          draft.updateFormField("distance", String(distanceCeiled));
          draft.updateFormField(
            "amount",
            (distanceCeiled * mileageRate).toFixed(2)
          );
        } else {
          toast.error(
            "Unable to calculate distance. You can enter the distance manually."
          );
        }
      })
      .catch(() => {
        toast.error(
          "Unable to calculate distance. You can enter the distance manually."
        );
      });
  }, [
    draft.formData.fromLocation,
    draft.formData.toLocation,
    draft.updateFormField,
    mileageRate,
  ]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl gradient-modernize-blue p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/claims")}
            className="shrink-0 text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {resubmitIdValid != null ? "Resubmit Claim" : "Submit New Claim"}
            </h1>
            <p className="text-sm text-white/80 mt-0.5">
              Step {currentStep} of 5
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        {steps.map((step, i) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const StepIcon = step.icon;
          return (
            <div
              key={step.id}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? "gradient-modernize-blue border-transparent text-white shadow-lg"
                      : isActive
                        ? "border-blue-500 glass-card animate-glow-blue text-blue-600"
                        : "border-border/50 glass-card text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${isActive ? "text-blue-600" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-[-20px] rounded-full transition-all duration-300 ${currentStep > step.id ? "gradient-modernize-blue" : "bg-border/30"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card className="premium-shadow border-0">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Claimant Information
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fetched from your profile.
                    </p>
                  </div>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="claimant-name"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="claimant-name"
                        value={draft.claimantName}
                        readOnly
                        className="h-11 bg-muted/50 cursor-default"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Select Claim Type
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose the type of claim you want to submit.
                      </p>
                    </div>
                    {isClaimTypesAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/dashboard/settings/claim-types")}
                        className="shrink-0 gap-1.5"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Manage Claims
                      </Button>
                    )}
                  </div>
                  {typesLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading claim types...
                    </p>
                  ) : displayClaimTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No claim types available. Ask an admin to add them in{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/settings/claim-types")}
                        className="underline text-primary hover:no-underline"
                      >
                        Manage Claims
                      </button>
                      .
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {displayClaimTypes.map((type: ClaimType) => {
                        const isSelected = draft.selectedTypeId === type.id;
                        const iconKey = type.icon?.toLowerCase().replace(/-/g, "") ?? type.key;
                        const Icon =
                          typeIconMap[iconKey] ?? typeIconMap[type.key] ?? FileTextIcon;
                        const colorClass =
                          type.color && typeColorMap[type.color]
                            ? typeColorMap[type.color]
                            : "bg-blue-500/10 text-blue-600";
                        const description =
                          type.description ??
                          (type.key === "receipt"
                            ? "Submit receipts for reimbursement."
                            : type.key === "mileage"
                              ? "Claim mileage expenses."
                              : null);
                        return (
                          <motion.div
                            key={type.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => draft.setType(type.id, type.key)}
                            className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all glass-card ${
                              isSelected
                                ? "border-blue-500/50 shadow-lg animate-glow-blue"
                                : "border-border/30 hover:border-border/60"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full gradient-modernize-blue shadow-md">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {type.label}
                              </p>
                              {description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {description}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Select Subclaim Type
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a subclaim category if applicable.
                    </p>
                  </div>
                  {subclaimTypes && subclaimTypes.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {subclaimTypes.map((sub) => {
                          const isSelected =
                            draft.selectedSubclaimId === sub.id;
                          const pendingHr =
                            sub.status === "pending_approval";
                          return (
                            <motion.div
                              key={sub.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => draft.setSubclaim(sub.id)}
                              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all glass-card ${
                                isSelected
                                  ? "border-blue-500/50 shadow-lg animate-glow-blue"
                                  : "border-border/30 hover:border-border/60"
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full gradient-modernize-blue shadow-md">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stat-purple">
                                <FileTextIcon className="h-5 w-5 text-stat-purple-icon" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {sub.label}
                                  </p>
                                  {pendingHr && (
                                    <Badge
                                      variant="outline"
                                      className="text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-600"
                                    >
                                      Pending HR
                                    </Badge>
                                  )}
                                </div>
                                {sub.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {sub.description}
                                  </p>
                                )}
                                {sub.rate != null && (
                                  <p className="text-xs text-blue-600 font-medium mt-0.5">
                                    RM {Number(sub.rate).toFixed(2)}/km
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      {draft.selectedTypeId && (
                        <CreateSubclaimDialog
                          claimTypeId={draft.selectedTypeId}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass-card mb-4">
                          <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          No subclaim types available
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          You can create a custom one or skip this step.
                        </p>
                      </div>
                      {draft.selectedTypeId && (
                        <CreateSubclaimDialog
                          claimTypeId={draft.selectedTypeId}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Claim Details
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fill in the required details for your claim.
                    </p>
                  </div>

                  {draft.selectedTypeKey === "receipt" && (
                    <ReceiptClaimForm
                      categories={categoryOptions}
                      formData={draft.formData as Record<string, unknown>}
                      onUpdate={draft.updateFormField}
                    />
                  )}

                  {draft.selectedTypeKey === "mileage" && (
                    <MileageClaimForm
                      mileageRate={Number(mileageRate)}
                      formData={draft.formData as Record<string, unknown>}
                      onUpdate={draft.updateFormField}
                      onFromBlur={runMileageDistanceCalculation}
                      onToBlur={runMileageDistanceCalculation}
                    />
                  )}

                  {draft.selectedTypeKey !== "receipt" &&
                    draft.selectedTypeKey !== "mileage" && (
                      <GenericClaimForm
                        formData={draft.formData as Record<string, unknown>}
                        onUpdate={draft.updateFormField}
                      />
                    )}

                  <div className="border-t border-border/20 pt-4">
                    <CustomFieldBuilder
                      fields={draft.customFields}
                      onAdd={draft.addCustomField}
                      onRemove={draft.removeCustomField}
                      onUpdate={draft.updateCustomField}
                    />
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Review & Submit
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review your claim details before submission.
                    </p>
                  </div>

                  <ClaimReviewSummary
                    claimantName={draft.claimantName}
                    claimTypeLabel={selectedTypeData?.label ?? ""}
                    subclaimLabel={
                      subclaimTypes?.find(
                        (s) => s.id === draft.selectedSubclaimId
                      )?.label
                    }
                    formData={draft.formData as Record<string, unknown>}
                    customFields={draft.customFields}
                    amount={getAmount()}
                  />

                  <div className="rounded-xl p-4 glass-card">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 mb-4">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Your claim will go through{" "}
                        {getAmount() >= thresholdAmount ? "3-level" : "2-level"}{" "}
                        approval: HOD → Admin/HR
                        {getAmount() >= thresholdAmount ? " → Superadmin" : ""}.
                      </p>
                    </div>
                    <ApprovalTimeline
                      approvals={previewApprovals}
                      claimStatus="pending_l1"
                      submittedDate="Now"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          className="gap-1.5 hover:bg-blue-500/5 hover:border-blue-500/30"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        <div className="flex gap-2">
          {currentStep === 3 &&
            (!subclaimTypes || subclaimTypes.length === 0) && (
              <Button
                variant="ghost"
                onClick={handleNext}
                className="text-muted-foreground"
              >
                Skip
              </Button>
            )}
          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canNext()}
              className="gap-1.5 gradient-modernize-blue text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitClaim.isPending}
              className="gap-1.5 gradient-modernize-blue text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              {submitClaim.isPending ? "Submitting..." : "Submit Claim"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function GenericClaimForm({
  formData,
  onUpdate,
}: {
  formData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Title
        </Label>
        <Input
          value={String(formData.title ?? "")}
          onChange={(e) => onUpdate("title", e.target.value)}
          placeholder="Claim title"
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Amount (RM)
        </Label>
        <Input
          type="number"
          value={String(formData.amount ?? "")}
          onChange={(e) => onUpdate("amount", e.target.value)}
          placeholder="0.00"
          min={0}
          step={0.01}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </Label>
        <Input
          value={String(formData.description ?? "")}
          onChange={(e) => onUpdate("description", e.target.value)}
          placeholder="Brief description"
          className="h-10"
        />
      </div>
    </div>
  );
}
