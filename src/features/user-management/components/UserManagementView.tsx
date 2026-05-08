'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDepartments } from '@/features/onboarding/hooks/useOnboarding'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useAdminUsers } from '@/features/user-management/hooks/useAdminUsers'
import type {
  AdminUserDirectoryRole,
  AdminUserDirectoryStatus,
} from '@/shared/lib/api-client/admin-users'
import {
  adminUserRouteSegment,
  formatAdminUserDepartmentLabel,
  getAdminUserAvatarUrl,
  getAdminUserDisplayName,
} from '@/shared/lib/api-client/admin-users'
import { extractError } from '@/shared/lib/api-client/response-handler'
import type { ProfileRole } from '@/shared/lib/api-client/profile'

const ROLE_OPTIONS: { value: AdminUserDirectoryRole; label: string }[] = [
  { value: 'top_management', label: 'Top Management' },
  { value: 'hr_admin', label: 'HR Admin' },
  { value: 'hod', label: 'HOD' },
  { value: 'staff', label: 'Staff' },
]

const STATUS_OPTIONS: { value: AdminUserDirectoryStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'verifying', label: 'Verifying' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deactivated', label: 'Deactivated' },
]

const PER_PAGE_OPTIONS = [25, 50, 100] as const

function displayRole(role: string): string {
  const map: Record<string, string> = {
    top_management: 'Top Management',
    super_admin: 'Top Management',
    hr_admin: 'HR Admin',
    hod: 'HOD',
    staff: 'Staff',
  }
  return map[role] ?? role.replace(/_/g, ' ')
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'verifying':
      return 'secondary'
    case 'rejected':
    case 'deactivated':
      return 'destructive'
    default:
      return 'outline'
  }
}

function canUseDepartmentFilter(role: ProfileRole | null | undefined): boolean {
  return (
    role === 'top_management' ||
    role === 'super_admin' ||
    role === 'hr_admin' ||
    role === 'hod'
  )
}

export function UserManagementView() {
  const router = useRouter()
  const { profile } = useProfile()
  const showDepartmentFilter = canUseDepartmentFilter(profile?.role ?? null)

  const { data: departments = [], isLoading: departmentsLoading } = useDepartments({
    enabled: showDepartmentFilter,
  })

  const [searchInput, setSearchInput] = useState('')
  const deferredSearch = useDeferredValue(searchInput)
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<number>(25)

  useEffect(() => {
    setPage(1)
  }, [deferredSearch, roleFilter, statusFilter, departmentId, perPage])

  const query = useMemo(
    () => ({
      page,
      perPage,
      search: deferredSearch.trim() || undefined,
      role: (roleFilter || undefined) as AdminUserDirectoryRole | undefined,
      status: (statusFilter || undefined) as AdminUserDirectoryStatus | undefined,
      departmentId:
        showDepartmentFilter && departmentId ? departmentId : undefined,
    }),
    [
      page,
      perPage,
      deferredSearch,
      roleFilter,
      statusFilter,
      departmentId,
      showDepartmentFilter,
    ]
  )

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAdminUsers(query)

  const rows = data?.rows ?? []
  const meta = data?.meta
  const from = meta && meta.total > 0
    ? (meta.currentPage - 1) * meta.perPage + 1
    : 0
  const to = meta
    ? Math.min(meta.currentPage * meta.perPage, meta.total)
    : 0

  const errMessage = isError ? extractError(error).message : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid w-full gap-1.5 sm:min-w-[200px] sm:flex-1">
          <Label htmlFor="user-search">Search</Label>
          <Input
            id="user-search"
            placeholder="Name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="grid w-full gap-1.5 sm:w-[160px]">
          <Label>Role</Label>
          <Select
            value={roleFilter || 'all'}
            onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid w-full gap-1.5 sm:w-[160px]">
          <Label>Status</Label>
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showDepartmentFilter && (
          <div className="grid w-full gap-1.5 sm:min-w-[200px] sm:max-w-[240px]">
            <Label>Department</Label>
            <Select
              value={departmentId || 'all'}
              onValueChange={(v) => setDepartmentId(v === 'all' ? '' : v)}
              disabled={departmentsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid w-full gap-1.5 sm:w-[100px]">
          <Label>Per page</Label>
          <Select
            value={String(perPage)}
            onValueChange={(v) => setPerPage(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh list"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {errMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errMessage}
        </p>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const displayName = getAdminUserDisplayName(row)
                const avatarSrc = getAdminUserAvatarUrl(row)
                return (
                  <TableRow
                    key={String(row.id)}
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() =>
                      router.push(`/dashboard/settings/users/${adminUserRouteSegment(row)}`)
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {avatarSrc ? (
                            <AvatarImage src={avatarSrc} alt="" />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email ?? '—'}
                    </TableCell>
                    <TableCell>{displayRole(row.role ?? '')}</TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {formatAdminUserDepartmentLabel(row)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {from}–{to} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.currentPage <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {meta.currentPage} of {meta.lastPage}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.currentPage >= meta.lastPage || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
