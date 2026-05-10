'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDepartments } from '@/features/onboarding/hooks/useOnboarding'
import {
  useAdminUserDetail,
  usePatchAdminUserDepartment,
  usePatchAdminUserRole,
} from '@/features/user-management/hooks/useAdminUserDetail'
import { useAuth } from '@/shared/hooks/useAuth'
import { useProfile } from '@/features/profile/hooks/useProfile'
import {
  type AdminUserDirectoryRole,
  formatAdminUserDepartmentLabel,
  getAdminUserDisplayName,
  getAdminUserLastLoginIso,
} from '@/shared/lib/api-client/admin-users'
import { extractError } from '@/shared/lib/api-client/response-handler'
import { isTopManagement } from '@/shared/lib/role-utils'
import {
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
  ROLE_HR_ADMIN,
  ROLE_HOD,
  ROLE_STAFF,
} from '@/shared/constants/roles'

const ADMIN_ROLE_OPTIONS: { value: AdminUserDirectoryRole; label: string }[] = [
  { value: ROLE_TOP_MANAGEMENT, label: 'Top Management' },
  { value: ROLE_HR_ADMIN, label: 'HR' },
  { value: ROLE_HOD, label: 'HOD' },
  { value: ROLE_STAFF, label: 'Staff' },
]

function normalizeEditableRole(
  r: string | null | undefined
): AdminUserDirectoryRole {
  const normalized =
    r === ROLE_SUPER_ADMIN_LEGACY ? ROLE_TOP_MANAGEMENT : r
  const allowed: AdminUserDirectoryRole[] = [
    ROLE_TOP_MANAGEMENT,
    ROLE_HR_ADMIN,
    ROLE_HOD,
    ROLE_STAFF,
  ]
  if (normalized && (allowed as string[]).includes(normalized))
    return normalized as AdminUserDirectoryRole
  return ROLE_STAFF
}

function displayRole(role: string): string {
  const map: Record<string, string> = {
    [ROLE_TOP_MANAGEMENT]: 'Top Management',
    [ROLE_SUPER_ADMIN_LEGACY]: 'Top Management',
    [ROLE_HR_ADMIN]: 'HR Admin',
    [ROLE_HOD]: 'HOD',
    [ROLE_STAFF]: 'Staff',
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

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatDateOnly(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

function DetailField({
  label,
  value,
  sub,
}: {
  label: string
  value: ReactNode
  sub?: string
}) {
  return (
    <div className="space-y-1 py-3 border-b border-border/60 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value}</div>
      {sub ? (
        <p className="text-xs text-muted-foreground font-mono break-all">{sub}</p>
      ) : null}
    </div>
  )
}

export function UserDetailView({ userUuid }: { userUuid: string }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const canEditAsTopManagement = isTopManagement(profile?.role, user?.roles)

  const { data, isLoading, isError, error, refetch } = useAdminUserDetail(userUuid)
  const patchDept = usePatchAdminUserDepartment(userUuid)
  const patchRole = usePatchAdminUserRole(userUuid)

  const { data: departments = [], isLoading: deptLoading } = useDepartments({
    enabled: canEditAsTopManagement,
  })

  const [deptEditorOpen, setDeptEditorOpen] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [roleEditorOpen, setRoleEditorOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<AdminUserDirectoryRole>('staff')

  const currentDeptId = useMemo(() => {
    const id = data?.department?.id
    if (id === undefined || id === null) return ''
    return String(id)
  }, [data?.department?.id])

  function openDeptEditor() {
    setSelectedDeptId(currentDeptId || 'none')
    setDeptEditorOpen(true)
  }

  function openRoleEditor() {
    if (!data) return
    setSelectedRole(normalizeEditableRole(data.role))
    setRoleEditorOpen(true)
  }

  function saveRole() {
    patchRole.mutate(selectedRole, {
      onSuccess: () => {
        setRoleEditorOpen(false)
      },
    })
  }

  function saveDepartment() {
    if (selectedDeptId === 'none') {
      patchDept.mutate(null, {
        onSuccess: () => {
          setDeptEditorOpen(false)
        },
      })
      return
    }
    const n = Number(selectedDeptId)
    if (Number.isNaN(n)) return
    patchDept.mutate(n, {
      onSuccess: () => {
        setDeptEditorOpen(false)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">
          {isError ? extractError(error).message : 'Could not load user.'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
        <Button variant="link" className="mt-2 block px-0" asChild>
          <Link href="/dashboard/settings/users">Back to User Management</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
          <Link href="/dashboard/settings/users">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {getAdminUserDisplayName(data)}
            </h2>
            <p className="text-sm text-muted-foreground">{data.email ?? '—'}</p>
          </div>
          <Badge variant={statusVariant(data.status)} className="w-fit">
            {data.status}
          </Badge>
        </div>

        <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-8">
          <div>
            <div className="space-y-2 py-3 border-b border-border/60">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Role
              </p>
              {roleEditorOpen ? (
                <div className="flex flex-col gap-3">
                  <Select
                    value={selectedRole}
                    onValueChange={(v) =>
                      setSelectedRole(v as AdminUserDirectoryRole)
                    }
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveRole}
                      disabled={
                        patchRole.isPending ||
                        selectedRole === normalizeEditableRole(data.role)
                      }
                    >
                      {patchRole.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleEditorOpen(false)}
                      disabled={patchRole.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">
                    {displayRole(data.role ?? '')}
                  </p>
                  {canEditAsTopManagement ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 w-fit"
                      onClick={openRoleEditor}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit role
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Only Top Management can change role.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2 py-3 border-b border-border/60">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Department
              </p>
              {deptEditorOpen ? (
                <div className="flex flex-col gap-3">
                  <Select
                    value={selectedDeptId}
                    onValueChange={setSelectedDeptId}
                    disabled={deptLoading}
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No department</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.shortCode ? `${d.name} (${d.shortCode})` : d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveDepartment}
                      disabled={patchDept.isPending}
                    >
                      {patchDept.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeptEditorOpen(false)}
                      disabled={patchDept.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">
                    {formatAdminUserDepartmentLabel(data)}
                  </p>
                  {canEditAsTopManagement ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 w-fit"
                      onClick={openDeptEditor}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit department
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Only Top Management can change department.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            <DetailField
              label="Last login"
              value={formatDateTime(getAdminUserLastLoginIso(data))}
            />
            <DetailField label="Joined" value={formatDateOnly(data.createdAt)} />
            <DetailField
              label="Lark user ID"
              value={data.larkUserId ?? '—'}
            />
            <DetailField
              label="Lark open ID"
              value={data.larkOpenId ?? '—'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
