"use client"

import { useRouter } from "next/navigation"
import { Plus, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LeaveBalanceGrid } from "@/features/leave/components/LeaveBalanceGrid"
import { LeaveStatCards } from "@/features/leave/components/LeaveStatCards"
import { MyLeavesTable } from "@/features/leave/components/MyLeavesTable"
import { LeaveOrgOverview } from "@/features/leave/components/LeaveOrgOverview"
import { useAllLeavesForApproval, useMyLeaveBalance } from "@/features/leave/hooks/useLeave"
import { useAuth } from "@/shared/hooks/useAuth"
import { useProfile } from "@/features/profile/hooks/useProfile"
import {
  ROLE_HOD,
  ROLE_HR_ADMIN,
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
  isTopManagementSlug,
} from "@/shared/constants/roles"

const APPROVER_ROLES = [ROLE_HOD, ROLE_HR_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_SUPER_ADMIN_LEGACY] as const

function isApprover(role?: string | null, roles?: string[] | null): boolean {
  if (role && (APPROVER_ROLES as readonly string[]).includes(role)) return true
  if (roles?.some((r) => (APPROVER_ROLES as readonly string[]).includes(r))) return true
  return false
}

/** Pending badge + link to /dashboard/leave/approval. Replaces inline approval queue tab. */
function ApprovalLinkBanner({ pendingCount }: { pendingCount: number }) {
  const router = useRouter()
  return (
    <Card className="border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {pendingCount > 0
                ? `${pendingCount} leave request${pendingCount !== 1 ? "s" : ""} pending your approval`
                : "Approval queue"}
            </p>
            <p className="text-xs text-muted-foreground">
              Review and action leave requests from your team
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => router.push("/dashboard/leave/approval")}
        >
          {pendingCount > 0 ? "Review now" : "View queue"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  )
}

export function LeaveManagement() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile } = useProfile()

  const isTopMgmt =
    isTopManagementSlug(profile?.role) ||
    (user?.roles?.some((r) => isTopManagementSlug(r)) ?? false)

  const canApprove = isApprover(profile?.role, user?.roles)

  const { data: allLeaves = [], isLoading: allLeavesLoading } = useAllLeavesForApproval()
  const { data: balances = [], isLoading: balancesLoading } = useMyLeaveBalance()

  const pendingApprovals = allLeaves.filter(
    (l) => l.status === "pending" && l.approvals.some((a) => a.status === "pending")
  ).length
  const approvedMine = allLeaves.filter((l) => l.status === "approved").length
  const totalRequests = allLeaves.length

  // ── Top management: org analytics view ────────────────────────────────────
  if (isTopMgmt) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="relative">
            <h1 className="text-2xl font-bold text-white">Leave Overview</h1>
            <p className="text-sm text-white/80 mt-1">
              Monitor and approve leave requests across your organisation
            </p>
          </div>
        </div>

        <LeaveOrgOverview allLeaves={allLeaves} isLoading={allLeavesLoading} />
      </div>
    )
  }

  // ── Staff + HOD + HR Admin: personal leave view ───────────────────────────
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Leave Management</h1>
            <p className="text-sm text-white/80 mt-1">
              {canApprove
                ? "Submit and track your leave requests"
                : "Submit and track your leave requests"}
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/leave/new")}
            className="gap-1.5 hidden md:flex bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
          >
            <Plus className="h-4 w-4" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Balance — critical info first (3-second rule) */}
      <LeaveBalanceGrid balances={balances} isLoading={balancesLoading} />

      <div className="border-t border-border/40" />

      {/* Approver stats + link banner (HOD / HR Admin only) */}
      {canApprove && (
        <>
          <LeaveStatCards
            pendingCount={pendingApprovals}
            approvedCount={approvedMine}
            totalRequests={totalRequests}
          />
          <ApprovalLinkBanner pendingCount={pendingApprovals} />
        </>
      )}

      {/* Own request history */}
      <MyLeavesTable />

      {/* Mobile FAB */}
      <Button
        onClick={() => router.push("/dashboard/leave/new")}
        className="fixed bottom-6 right-6 md:hidden z-40 gap-2 rounded-full shadow-xl h-12 px-5 bg-gradient-to-r from-emerald-600 to-teal-600"
      >
        <Plus className="h-5 w-5 text-white" />
        <span className="text-sm font-semibold text-white">Request</span>
      </Button>
    </div>
  )
}
