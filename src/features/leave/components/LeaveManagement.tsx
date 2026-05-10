"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LeaveBalanceGrid } from "@/features/leave/components/LeaveBalanceGrid"
import { LeaveStatCards } from "@/features/leave/components/LeaveStatCards"
import { MyLeavesTable } from "@/features/leave/components/MyLeavesTable"
import { LeaveApprovalQueue } from "@/features/leave/components/LeaveApprovalQueue"
import { useAllLeavesForApproval, useMyLeaveBalance } from "@/features/leave/hooks/useLeave"
import { useAuth } from "@/shared/hooks/useAuth"
import { useProfile } from "@/features/profile/hooks/useProfile"
import { ROLE_HOD, ROLE_HR_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_SUPER_ADMIN_LEGACY } from "@/shared/constants/roles"

const APPROVER_ROLES = [ROLE_HOD, ROLE_HR_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_SUPER_ADMIN_LEGACY] as const

function isApprover(role?: string | null, roles?: string[] | null): boolean {
  if (role && (APPROVER_ROLES as readonly string[]).includes(role)) return true
  if (roles?.some((r) => (APPROVER_ROLES as readonly string[]).includes(r))) return true
  return false
}

type Tab = "my" | "queue"

export function LeaveManagement() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile } = useProfile()
  const [tab, setTab] = useState<Tab>("my")

  const canApprove = isApprover(profile?.role, user?.roles)

  const { data: allLeaves = [] } = useAllLeavesForApproval()
  const { data: balances = [], isLoading: balancesLoading } = useMyLeaveBalance()

  const pendingApprovals = allLeaves.filter(
    (l) => l.status === "pending" && l.approvals.some((a) => a.status === "pending")
  ).length
  const approvedMine = allLeaves.filter((l) => l.status === "approved").length
  const totalRequests = allLeaves.length

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Leave Management</h1>
            <p className="text-sm text-white/80 mt-1">
              {canApprove ? "Submit, track, and approve leave requests" : "Submit and track your leave requests"}
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

      {canApprove && (
        <LeaveStatCards
          pendingCount={pendingApprovals}
          approvedCount={approvedMine}
          totalRequests={totalRequests}
        />
      )}

      <LeaveBalanceGrid balances={balances} isLoading={balancesLoading} />

      {canApprove ? (
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {(["my", "queue"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t === "my" ? "My Requests" : `Approval Queue${pendingApprovals > 0 ? ` (${pendingApprovals})` : ""}`}
              </button>
            ))}
          </div>

          {tab === "my" ? (
            <MyLeavesTable />
          ) : (
            <LeaveApprovalQueue />
          )}
        </div>
      ) : (
        <MyLeavesTable />
      )}

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
