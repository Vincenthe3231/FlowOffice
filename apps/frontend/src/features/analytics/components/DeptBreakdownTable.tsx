'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

interface DeptBreakdownRow {
  departmentName: string
  colorScheme: string | null
  primaryValue: string
  secondaryValue?: string
  progressPct?: number
}

interface DeptBreakdownTableProps {
  rows: DeptBreakdownRow[]
  primaryLabel: string
  secondaryLabel?: string
  isLoading?: boolean
  emptyMessage?: string
}

function progressColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0">
          <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </>
  )
}

export function DeptBreakdownTable({
  rows,
  primaryLabel,
  secondaryLabel,
  isLoading,
  emptyMessage = 'No data available.',
}: DeptBreakdownTableProps) {
  const hasProgress = rows.some((r) => r.progressPct !== undefined)
  const hasSecondary = secondaryLabel !== undefined || rows.some((r) => r.secondaryValue !== undefined)

  return (
    <div className="w-full">
      {/* Header */}
      <div
        className={cn(
          'grid gap-3 px-1 pb-2 border-b text-xs font-medium text-muted-foreground',
          hasSecondary ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]',
        )}
      >
        <span>Department</span>
        {hasSecondary && <span className="text-right">{secondaryLabel ?? ''}</span>}
        <span className="text-right">{primaryLabel}</span>
      </div>

      <ScrollArea className="max-h-64">
        {isLoading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          rows.map((row, idx) => (
            <div
              key={idx}
              className={cn(
                'grid gap-3 px-1 py-2.5 border-b last:border-0 items-center transition-colors duration-150 hover:bg-muted/40 rounded-sm cursor-default',
                hasSecondary ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]',
              )}
            >
              {/* Dept name + optional progress */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.colorScheme ?? '#94a3b8' }}
                  />
                  <span className="text-sm font-medium truncate">{row.departmentName}</span>
                </div>
                {hasProgress && row.progressPct !== undefined && (
                  <div className="pl-4.5 pr-0">
                    <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', progressColor(row.progressPct))}
                        style={{ width: `${Math.min(row.progressPct, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Secondary value */}
              {hasSecondary && (
                <span className="text-xs text-muted-foreground text-right whitespace-nowrap">
                  {row.secondaryValue ?? '—'}
                </span>
              )}

              {/* Primary value */}
              <span
                className={cn(
                  'text-sm font-semibold text-right whitespace-nowrap tabular-nums',
                  row.progressPct !== undefined && row.progressPct >= 90
                    ? 'text-red-600 dark:text-red-400'
                    : row.progressPct !== undefined && row.progressPct >= 70
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground',
                )}
              >
                {row.primaryValue}
              </span>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  )
}
