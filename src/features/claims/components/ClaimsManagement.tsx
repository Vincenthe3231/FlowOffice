"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { claimCategories, claimsSparkline } from "@/features/claims/data";
import { useClaimCategories, useClaims, useClaimsStats, useMileageAmount } from "@/features/claims/hooks/useClaims";
import { BudgetUtilization } from "@/features/claims/components/BudgetUtilization";
import { ClaimDetailSheet } from "@/features/claims/components/ClaimDetailSheet";
import { ClaimsByCategoryChart } from "@/features/claims/components/ClaimsByCategoryChart";
import { ClaimsStatCards } from "@/features/claims/components/ClaimsStatCards";
import { ClaimsTable } from "@/features/claims/components/ClaimsTable";
import { MileageClaimDialog } from "@/features/claims/components/MileageClaimDialog";
import { MonthlySpendChart } from "@/features/claims/components/MonthlySpendChart";
import { ReceiptClaimDialog } from "@/features/claims/components/ReceiptClaimDialog";
import type { Claim, ClaimFilter } from "@/features/claims/types";

export function ClaimsManagement() {
  const [filter, setFilter] = useState<ClaimFilter>("All");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [mileageDistance, setMileageDistance] = useState("");

  const filteredClaims = useClaims(filter);
  const { approvedCount, pendingCount, totalAmount, totalClaims } = useClaimsStats();
  const pieData = useClaimCategories();
  const mileageAmount = useMileageAmount(mileageDistance);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Claims Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit, track, and manage expense claims
        </p>
      </motion.div>

      <ClaimsStatCards
        totalAmount={totalAmount}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        totalClaims={totalClaims}
        sparkline={claimsSparkline}
      />

      <motion.div
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
      >
        <ClaimsByCategoryChart pieData={pieData} />
        <MonthlySpendChart />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.12 }}
      >
        <BudgetUtilization />
      </motion.div>

      <motion.div
        className="grid auto-rows-fr grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.16 }}
      >
        <ReceiptClaimDialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          categories={claimCategories}
        />
        <MileageClaimDialog
          open={mileageOpen}
          onOpenChange={setMileageOpen}
          mileageDistance={mileageDistance}
          onMileageDistanceChange={setMileageDistance}
          mileageAmount={mileageAmount}
        />
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
            onClaimSelect={setSelectedClaim}
          />
        </motion.div>
      </AnimatePresence>

      <ClaimDetailSheet
        claim={selectedClaim}
        onOpenChange={(open) => {
          if (!open) setSelectedClaim(null);
        }}
      />
    </div>
  );
}
