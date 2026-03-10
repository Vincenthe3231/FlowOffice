"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Bus,
  Car,
  ChevronDown,
  ChevronRight,
  Hammer,
  MapPin,
  Package,
  Plane,
  Plus,
  Receipt,
  Route,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { claimCategories, claimsSparkline, MILEAGE_RATE } from "@/features/claims/data";
import { useClaimCategories, useClaims, useClaimsStats } from "@/features/claims/hooks/useClaims";
import { BudgetUtilization } from "@/features/claims/components/BudgetUtilization";
import { ClaimDetailSheet } from "@/features/claims/components/ClaimDetailSheet";
import { ClaimsByCategoryChart } from "@/features/claims/components/ClaimsByCategoryChart";
import { ClaimsStatCards } from "@/features/claims/components/ClaimsStatCards";
import { ClaimsTable } from "@/features/claims/components/ClaimsTable";
import { MileageClaimDialog } from "@/features/claims/components/MileageClaimDialog";
import { MonthlySpendChart } from "@/features/claims/components/MonthlySpendChart";
import { ReceiptClaimDialog } from "@/features/claims/components/ReceiptClaimDialog";
import type { Claim, ClaimFilter } from "@/features/claims/types";
import { Card } from "@/components/ui/card";

const claimTypes = [
  {
    id: "receipt",
    label: "Receipt Claim",
    description: "Upload receipt and fill details",
    icon: Receipt,
    color: "bg-stat-blue",
    iconColor: "text-stat-blue-icon",
  },
  {
    id: "mileage",
    label: "Mileage Claim",
    description: "Enter trip details and distance",
    icon: Car,
    color: "bg-stat-purple",
    iconColor: "text-stat-purple-icon",
  },
  {
    id: "business-travel",
    label: "Business Travel Claim",
    description: "Flights, hotels, and travel expenses",
    icon: Plane,
    color: "bg-stat-green",
    iconColor: "text-stat-green-icon",
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous Claim",
    description: "Other uncategorized expenses",
    icon: Package,
    color: "bg-stat-orange",
    iconColor: "text-stat-orange-icon",
  },
  {
    id: "office",
    label: "Office Claim",
    description: "Office supplies and equipment",
    icon: Building2,
    color: "bg-stat-blue",
    iconColor: "text-stat-blue-icon",
  },
  {
    id: "outstation",
    label: "Outstation Allowance",
    description: "Allowance for outstation work",
    icon: MapPin,
    color: "bg-stat-green",
    iconColor: "text-stat-green-icon",
  },
  {
    id: "renovation",
    label: "Renovation Claim",
    description: "Workspace renovation expenses",
    icon: Hammer,
    color: "bg-stat-orange",
    iconColor: "text-stat-orange-icon",
  },
  {
    id: "special-mileage",
    label: "Special Mileage Claim",
    description: "Special rate mileage trips",
    icon: Route,
    color: "bg-stat-purple",
    iconColor: "text-stat-purple-icon",
  },
  {
    id: "transportation",
    label: "Transportation Claim",
    description: "Public transport and ride-hailing",
    icon: Bus,
    color: "bg-stat-blue",
    iconColor: "text-stat-blue-icon",
  },
] as const;

export function ClaimsManagement() {
  const [filter, setFilter] = useState<ClaimFilter>("All");
  const [selectedClaimIndex, setSelectedClaimIndex] = useState<number | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [claimTypesOpen, setClaimTypesOpen] = useState(false);

  const filteredClaims = useClaims(filter);
  const { approvedCount, pendingCount, totalAmount, totalClaims } = useClaimsStats();
  const pieData = useClaimCategories();

  function handleClaimTypeClick(id: string) {
    if (id === "receipt") {
      setReceiptOpen(true);
      return;
    }
    if (id === "mileage") {
      setMileageOpen(true);
      return;
    }
    toast.info("Coming Soon");
  }

  function handleClaimSelect(claim: Claim) {
    const idx = filteredClaims.findIndex((c) => c.id === claim.id);
    setSelectedClaimIndex(idx >= 0 ? idx : null);
  }

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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.16 }}
      >
        <Card className="premium-shadow border-0 overflow-hidden">
          <div
            className="flex items-center justify-between p-5 cursor-pointer group"
            onClick={() => setClaimTypesOpen((o) => !o)}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:scale-105 transition-transform">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Submit New Claim</p>
                <p className="text-xs text-muted-foreground">{claimTypes.length} claim types available</p>
              </div>
            </div>
            <motion.div animate={{ rotate: claimTypesOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>

          <AnimatePresence initial={false}>
            {claimTypesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {claimTypes.map((type, i) => {
                    const Icon = type.icon;
                    return (
                      <motion.div
                        key={type.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors group/item"
                        onClick={() => handleClaimTypeClick(type.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${type.color} group-hover/item:scale-105 transition-transform`}>
                            <Icon className={`h-4 w-4 ${type.iconColor}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{type.label}</p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
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
          />
        </motion.div>
      </AnimatePresence>

      <ClaimDetailSheet
        claims={filteredClaims}
        selectedIndex={selectedClaimIndex}
        onClose={() => setSelectedClaimIndex(null)}
      />

      <ReceiptClaimDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        categories={claimCategories}
      />
      <MileageClaimDialog
        open={mileageOpen}
        onOpenChange={setMileageOpen}
        mileageRate={MILEAGE_RATE}
      />
    </div>
  );
}
