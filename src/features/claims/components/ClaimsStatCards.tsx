import { motion } from "framer-motion";
import { Clock, DollarSign, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/features/attendance";
import { ClaimSparkline } from "@/features/claims/components/ClaimSparkline";

interface ClaimsStatCardsProps {
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  totalClaims: number;
  sparkline: number[];
}

export function ClaimsStatCards({
  totalAmount,
  pendingCount,
  approvedCount,
  totalClaims,
  sparkline,
}: ClaimsStatCardsProps) {
  const cardMotionProps = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    whileHover: { y: -3 },
    whileTap: { scale: 0.985 },
    transition: { duration: 0.25 },
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <motion.div {...cardMotionProps} className="col-span-2 sm:col-span-1">
        <Card className="premium-shadow border-0 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium leading-4 text-muted-foreground sm:text-xs">
                Total Claims This Month
              </p>
              <p className="mt-1 text-lg font-bold text-foreground sm:text-xl">
                RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-[11px] font-medium text-info">{totalClaims} claims</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stat-blue sm:h-9 sm:w-9">
              <DollarSign className="h-4 w-4 text-stat-blue-icon sm:h-[18px] sm:w-[18px]" />
            </div>
          </div>
          <div className="mt-2.5">
            <ClaimSparkline data={sparkline} color="hsl(215, 80%, 55%)" />
          </div>
        </Card>
      </motion.div>

      <motion.div {...cardMotionProps} transition={{ duration: 0.25, delay: 0.05 }}>
        <Card className="premium-shadow border-0 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium leading-4 text-muted-foreground sm:text-xs">
                Pending Claims
              </p>
              <p className="mt-1 text-lg font-bold text-foreground sm:text-xl">{pendingCount}</p>
              <p className="mt-1 text-[11px] font-medium text-warning">Awaiting review</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stat-orange sm:h-9 sm:w-9">
              <Clock className="h-4 w-4 text-stat-orange-icon sm:h-[18px] sm:w-[18px]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <StatusBadge status="Pending" className="px-2 py-0.5 text-[9px]" />
          </div>
        </Card>
      </motion.div>

      <motion.div {...cardMotionProps} transition={{ duration: 0.25, delay: 0.1 }}>
        <Card className="premium-shadow border-0 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium leading-4 text-muted-foreground sm:text-xs">
                Approved Claims
              </p>
              <p className="mt-1 text-lg font-bold text-foreground sm:text-xl">{approvedCount}</p>
              <p className="mt-1 text-[11px] font-medium text-success">Processed</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stat-green sm:h-9 sm:w-9">
              <TrendingUp className="h-4 w-4 text-stat-green-icon sm:h-[18px] sm:w-[18px]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <StatusBadge status="Approved" className="px-2 py-0.5 text-[9px]" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
