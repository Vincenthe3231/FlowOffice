"use client"

import { Clock, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMyShift } from "@/features/shifts/hooks/useShifts"
import type { UserShiftApi } from "@/features/shifts/types"

export function MyShiftCard() {
  const { data: assignment, isLoading } = useMyShift()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Shift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
      </Card>
    )
  }

  if (!assignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No shift assigned</p>
            <p className="text-xs mt-1">Contact your HR or HOD to assign a shift.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const userShift = assignment as UserShiftApi

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Shift</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{userShift.shift.name}</p>
            <p className="text-sm text-muted-foreground">
              {userShift.shift.startTime} – {userShift.shift.endTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span>
            Effective from{" "}
            {new Date(userShift.effectiveDate).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
            {userShift.endDate
              ? ` to ${new Date(userShift.endDate).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}`
              : ""}
          </span>
        </div>

        {userShift.notes && (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
            {userShift.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
