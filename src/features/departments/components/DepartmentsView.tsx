'use client'

import { useMemo, useState } from 'react'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useCreateDepartment,
  useUpdateDepartment,
} from '@/features/departments/hooks/useDepartmentMutations'
import { useDepartments } from '@/features/onboarding/hooks/useOnboarding'
import { useAuth } from '@/shared/hooks/useAuth'
import { useProfile } from '@/features/profile/hooks/useProfile'
import type { Department } from '@/features/onboarding/schemas/onboarding.schemas'
import { canManageDepartments } from '@/shared/lib/role-utils'
import { toast } from 'sonner'

/** Backend still expects colorScheme; UI no longer edits it — default for new rows. */
const DEFAULT_CREATE_COLOR_SCHEME = 'slate' as Department['colorScheme']

function sortDepartments(rows: Department[]): Department[] {
  return [...rows].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
}

export function DepartmentsView() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const canManage = canManageDepartments(profile?.role, user?.roles)

  const { data: departments = [], isLoading, isError, refetch } = useDepartments()
  const createMut = useCreateDepartment()
  const updateMut = useUpdateDepartment()

  const sorted = useMemo(() => sortDepartments(departments), [departments])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [name, setName] = useState('')
  const [shortCode, setShortCode] = useState('')

  const [deactivateTarget, setDeactivateTarget] = useState<Department | null>(null)

  const mutatingId =
    updateMut.isPending && updateMut.variables
      ? updateMut.variables.id
      : null

  function openCreate() {
    setEditing(null)
    setName('')
    setShortCode('')
    setFormOpen(true)
  }

  function openEdit(row: Department) {
    setEditing(row)
    setName(row.name)
    setShortCode(row.shortCode)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function submitForm() {
    const n = name.trim()
    const sc = shortCode.trim()
    if (!n || !sc) {
      toast.error('Name and short code are required')
      return
    }
    if (editing) {
      updateMut.mutate(
        {
          id: editing.id,
          payload: {
            name: n,
            shortCode: sc,
            colorScheme: editing.colorScheme,
          },
        },
        {
          onSuccess: () => {
            toast.success('Department updated')
            closeForm()
          },
        }
      )
    } else {
      createMut.mutate(
        {
          name: n,
          shortCode: sc,
          colorScheme: DEFAULT_CREATE_COLOR_SCHEME,
          status: true,
        },
        { onSuccess: () => closeForm() }
      )
    }
  }

  function confirmDeactivate() {
    if (!deactivateTarget) return
    const id = deactivateTarget.id
    updateMut.mutate(
      { id, payload: { status: false } },
      {
        onSuccess: () => {
          toast.success('Department deactivated')
          setDeactivateTarget(null)
        },
      }
    )
  }

  function activate(row: Department) {
    updateMut.mutate(
      { id: row.id, payload: { status: true } },
      {
        onSuccess: () => {
          toast.success('Department activated')
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {!canManage && (
        <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/30 px-3 py-2">
          You can view departments here. Only Top Management can add, edit, or change active status.
          HR and HOD see active departments only in this list.
        </p>
      )}

      {canManage && (
        <div className="flex justify-end">
          <Button type="button" onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add department
          </Button>
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Could not load departments.{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </p>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Short code</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right w-[280px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 4 : 3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No departments returned.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => {
                const busy = mutatingId === row.id
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="font-mono text-sm">{row.shortCode}</TableCell>
                    <TableCell>
                      <Badge variant={row.status ? 'default' : 'secondary'}>
                        {row.status ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {row.status ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() => setDeactivateTarget(row)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              disabled={busy}
                              onClick={() => activate(row)}
                              className="gap-1.5"
                            >
                              {busy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              Activate
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="gap-1"
                            disabled={busy}
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit department' : 'New department'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update name or short code. Use Deactivate in the table to hide from HR/HOD lists.'
                : 'Create a department. It will be active by default.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="dept-name">Name</Label>
              <Input
                id="dept-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dept-code">Short code</Label>
              <Input
                id="dept-code"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder="e.g. ENG"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitForm}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {(createMut.isPending || updateMut.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate department?</DialogTitle>
            <DialogDescription>
              {deactivateTarget ? (
                <>
                  <span className="font-medium text-foreground">{deactivateTarget.name}</span> will
                  be marked inactive. HR admins and HODs will no longer see it in department lists
                  until it is activated again.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={updateMut.isPending}
              onClick={confirmDeactivate}
            >
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
