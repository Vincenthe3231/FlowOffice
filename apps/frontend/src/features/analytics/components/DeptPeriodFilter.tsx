'use client'

import { Building2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export type AnalyticsPeriod = '30d' | '90d' | '6m' | 'ytd' | '12m'

interface DeptPeriodFilterProps {
  departments: { id: number; name: string; colorScheme: string | null }[]
  departmentId: number | null
  period: AnalyticsPeriod
  onDepartmentChange: (id: number | null) => void
  onPeriodChange: (period: AnalyticsPeriod) => void
  isLoading?: boolean
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  '30d': '30D',
  '90d': '90D',
  '6m': '6M',
  'ytd': 'YTD',
  '12m': '12M',
}

export function DeptPeriodFilter({
  departments,
  departmentId,
  period,
  onDepartmentChange,
  onPeriodChange,
  isLoading,
}: DeptPeriodFilterProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-9 w-64" />
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select
          value={departmentId !== null ? String(departmentId) : 'all'}
          onValueChange={(val) => onDepartmentChange(val === 'all' ? null : Number(val))}
        >
          <SelectTrigger className="h-9 w-52 text-sm">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={String(dept.id)}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: dept.colorScheme ?? '#94a3b8' }}
                  />
                  {dept.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={period} onValueChange={(v) => onPeriodChange(v as AnalyticsPeriod)}>
        <TabsList className="h-9">
          {(Object.keys(PERIOD_LABELS) as AnalyticsPeriod[]).map((p) => (
            <TabsTrigger key={p} value={p} className="text-xs px-3 h-7 cursor-pointer">
              {PERIOD_LABELS[p]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
