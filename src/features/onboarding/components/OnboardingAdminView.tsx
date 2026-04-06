"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useApprovalRoles,
  useApproveOnboarding,
  useDepartments,
  useOnboardings,
  useRejectOnboarding,
} from "@/features/onboarding/hooks/useOnboarding";
import type { OnboardingRecord } from "@/features/onboarding/schemas/onboarding.schemas";
import type { OnboardingRole } from "@/features/onboarding/schemas/onboarding.schemas";
import {
  approveOnboardingFormSchema,
  onboardingRoleSchema,
  rejectOnboardingFormSchema,
} from "@/features/onboarding/schemas/onboarding.schemas";

function firstOnboardingRoleFromOptions(
  options: { value: string }[]
): OnboardingRole {
  for (const o of options) {
    const parsed = onboardingRoleSchema.safeParse(o.value);
    if (parsed.success) return parsed.data;
  }
  return "staff";
}

function statusVariant(
  status: OnboardingRecord["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
}

export function OnboardingAdminView() {
  const { data: rows = [], isLoading, isError, error, refetch } = useOnboardings();
  const { data: departments = [], isLoading: deptLoading } = useDepartments();
  const { data: roleOptions = [], isLoading: rolesLoading } = useApprovalRoles();
  const approveMut = useApproveOnboarding();
  const rejectMut = useRejectOnboarding();

  const [approveRow, setApproveRow] = useState<OnboardingRecord | null>(null);
  const [rejectRow, setRejectRow] = useState<OnboardingRecord | null>(null);
  const [role, setRole] = useState<OnboardingRole>("staff");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [rows]
  );

  function openApprove(row: OnboardingRecord) {
    setFormError(null);
    setRole(firstOnboardingRoleFromOptions(roleOptions));
    setDepartmentId(departments[0]?.id != null ? String(departments[0].id) : "");
    setApproveRow(row);
  }

  function openReject(row: OnboardingRecord) {
    setFormError(null);
    setRejectReason("");
    setRejectRow(row);
  }

  function submitApprove() {
    if (!approveRow) return;
    const parsed = approveOnboardingFormSchema.safeParse({
      role,
      departmentId: departmentId ? Number(departmentId) : NaN,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setFormError(null);
    approveMut.mutate(
      {
        id: approveRow.id,
        role: parsed.data.role,
        departmentId: parsed.data.departmentId,
      },
      { onSuccess: () => setApproveRow(null) }
    );
  }

  function submitReject() {
    if (!rejectRow) return;
    const parsed = rejectOnboardingFormSchema.safeParse({
      rejectionReason: rejectReason.trim(),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setFormError(null);
    rejectMut.mutate(
      { id: rejectRow.id, rejectionReason: parsed.data.rejectionReason },
      { onSuccess: () => setRejectRow(null) }
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">Could not load onboarding queue</p>
        <p className="mt-1 text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <Button type="button" variant="outline" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No onboarding requests
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => {
                const u = row.user;
                const pending = row.status === "pending";
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {u?.name ?? "—"}
                    </TableCell>
                    <TableCell>{u?.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {pending ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => openApprove(row)}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openReject(row)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!approveRow} onOpenChange={(o) => !o && setApproveRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve onboarding</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  const parsed = onboardingRoleSchema.safeParse(v);
                  if (parsed.success) setRole(parsed.data);
                }}
                disabled={rolesLoading || roleOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={rolesLoading ? "Loading…" : "Select role"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Department</Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                disabled={deptLoading || departments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={deptLoading ? "Loading…" : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApproveRow(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitApprove}
              disabled={
                approveMut.isPending ||
                departments.length === 0 ||
                rolesLoading ||
                roleOptions.length === 0
              }
            >
              {approveMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectRow} onOpenChange={(o) => !o && setRejectRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject onboarding</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="reject-reason">Reason (5–500 characters)</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Explain why this request is rejected…"
            />
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectRow(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={submitReject}
              disabled={rejectMut.isPending}
            >
              {rejectMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
