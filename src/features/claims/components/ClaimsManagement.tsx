"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useApproveRejectClaim,
  useClaimCategories,
  useClaimCategoriesForChart,
  useClaims,
  useClaimsStats,
  useMonthlySpend,
} from "@/features/claims/hooks/useClaims";
import { BudgetUtilization } from "@/features/claims/components/BudgetUtilization";
import { buildClaimDetailHref } from "@/features/claims/lib/claimUrlParams";
import { ClaimsByCategoryChart } from "@/features/claims/components/ClaimsByCategoryChart";
import { ClaimsStatCards } from "@/features/claims/components/ClaimsStatCards";
import { RejectClaimDialog } from "@/features/claims/components/RejectClaimDialog";
import { ClaimsTable } from "@/features/claims/components/ClaimsTable";
import { MonthlySpendChart } from "@/features/claims/components/MonthlySpendChart";
import type { Claim, ClaimFilter } from "@/features/claims/types";
import { Button } from "@/components/ui/button";

export function ClaimsManagement() {
  const router = useRouter();
  const [filter, setFilter] = useState<ClaimFilter>("All");
  const [claimToReject, setClaimToReject] = useState<Claim | null>(null);

  const { data: claimsData } = useClaims(filter);
  const { data: statsData } = useClaimsStats();
  const { data: categories = [] } = useClaimCategories();
  const pieData = useClaimCategoriesForChart();
  const { data: monthlySpend = [] } = useMonthlySpend();
  const rejectClaim = useApproveRejectClaim();

  const filteredClaims = claimsData?.claims ?? [];
  const { approvedCount = 0, pendingCount = 0, totalAmount = 0, totalClaims = 0, sparkline = [] } =
    statsData ?? {};

  function handleClaimSelect(claim: Claim) {
    router.push(buildClaimDetailHref(claim.id));
  }

  function handleReject(claim: Claim) {
    setClaimToReject(claim);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl gradient-modernize-blue p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Claims Management
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Submit, track, and manage expense claims
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/claims/new")}
            className="gap-1.5 hidden md:flex bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
          >
            <Plus className="h-4 w-4" />
            Submit New Claim
          </Button>
        </div>
      </div>

      <ClaimsStatCards
        totalAmount={totalAmount}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        totalClaims={totalClaims}
        sparkline={sparkline}
      />

      <motion.div
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
      >
        <ClaimsByCategoryChart pieData={pieData} categories={categories} />
        <MonthlySpendChart monthlySpend={monthlySpend} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.12 }}
      >
        <BudgetUtilization categories={categories} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <ClaimsTable
            filter={filter}
            onFilterChange={setFilter}
            claims={filteredClaims}
            onClaimSelect={handleClaimSelect}
            onResubmit={(c) => router.push(`/dashboard/claims/new?resubmit=${c.id}`)}
            onReject={handleReject}
          />
        </motion.div>
      </AnimatePresence>

      <RejectClaimDialog
        claim={
          claimToReject
            ? {
                id: claimToReject.id,
                title: claimToReject.title,
                amount: claimToReject.amount,
                categoryLabel: claimToReject.claimTypeLabel ?? claimToReject.category,
                date: claimToReject.date
                  ? new Date(claimToReject.date).toLocaleDateString()
                  : undefined,
              }
            : null
        }
        onOpenChange={(open) => {
          if (!open) setClaimToReject(null);
        }}
        isPending={rejectClaim.isPending}
        onReject={({ claimId, reason }) => {
          rejectClaim.mutate(
            { claimId, level: 1, action: "rejected", reason },
            { onSuccess: () => setClaimToReject(null) }
          );
        }}
      />

      <Button
        onClick={() => router.push("/dashboard/claims/new")}
        className="fixed bottom-6 right-6 md:hidden z-40 rounded-full shadow-xl h-14 w-14 p-0 gradient-modernize-blue animate-glow-blue"
        size="icon"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}
