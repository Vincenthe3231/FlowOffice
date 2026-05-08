"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Loader2,
  List,
  ChevronRight,
  Pencil,
  ShoppingBag,
  MapPin,
  Receipt,
  Car,
  Plane,
  Package,
  Building2,
  Hammer,
  Route,
  Bus,
  Bike,
  FileText as FileTextIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useClaimTypes,
  useCreateClaimType,
  useDeleteClaimType,
  useSubclaimTypes,
} from "@/features/claims/hooks/useClaims";
import { useProfile } from "@/features/profile/hooks/useProfile";
import type { ClaimType } from "@/features/claims/types";
import {
  isTransportClaimTypeKey,
  TRANSPORT_CLAIM_KEY_PREFIX,
} from "@/features/claims/lib/claim-type-groups";
import { isTopManagementSlug } from "@/shared/constants/roles";

const CLAIM_TYPE_ICONS = [
  "receipt",
  "mileage",
  "plane",
  "package",
  "building",
  "mappin",
  "hammer",
  "route",
  "bus",
] as const;

type ClaimTypeFormCategory = "standard" | "transport";

type ClaimTypeForm = {
  label: string;
  description: string;
  category: ClaimTypeFormCategory;
  icon: string;
};

/** Main claim type color is fixed per category (create modal — not user-selectable). */
function colorForCategory(category: ClaimTypeFormCategory): "stat-blue" | "stat-green" {
  return category === "transport" ? "stat-green" : "stat-blue";
}

const emptyForm: ClaimTypeForm = {
  label: "",
  description: "",
  category: "standard",
  icon: "receipt",
};

const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  receipt: Receipt,
  mileage: Car,
  plane: Plane,
  package: Package,
  building: Building2,
  mappin: MapPin,
  hammer: Hammer,
  route: Route,
  bus: Bus,
  bike: Bike,
  filetext: FileTextIcon,
};

const typeColorMap: Record<string, string> = {
  "stat-blue": "bg-stat-blue text-stat-blue-icon",
  "stat-purple": "bg-stat-purple text-stat-purple-icon",
  "stat-green": "bg-stat-green text-stat-green-icon",
  "stat-orange": "bg-stat-orange text-stat-orange-icon",
  "stat-pink": "bg-stat-pink text-stat-pink-icon",
  "stat-cyan": "bg-stat-cyan text-stat-cyan-icon",
};

function ClaimTypeRow({
  ct,
  isAdmin,
  onSelectSubclaims,
  onDelete,
}: {
  ct: ClaimType;
  isAdmin: boolean;
  onSelectSubclaims?: (id: string) => void;
  onDelete: (ct: ClaimType) => void;
}) {
  const router = useRouter();
  const { data: subclaims = [], isLoading: subsLoading } = useSubclaimTypes(ct.id);
  const count = subclaims.length;

  const iconKey = ct.icon?.toLowerCase().replace(/-/g, "") ?? ct.key;
  const Icon =
    typeIconMap[iconKey] ?? typeIconMap[ct.key] ?? FileTextIcon;
  const colorClass =
    ct.color && typeColorMap[ct.color]
      ? typeColorMap[ct.color]
      : "bg-blue-500/10 text-blue-600 dark:text-blue-400";

  const subclaimsHref = `/dashboard/claims/types/${ct.id}/subclaims`;

  function navigateToSubclaims() {
    if (onSelectSubclaims) onSelectSubclaims(ct.id);
    else router.push(subclaimsHref);
  }

  const subclaimsButton = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-9 gap-2 border-border/80 font-medium"
      onClick={(e) => {
        e.stopPropagation();
        navigateToSubclaims();
      }}
      aria-label={`Subclaims for ${ct.label}`}
    >
      <List className="h-4 w-4 text-muted-foreground" />
      <span>Subclaims</span>
      {subsLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
          {count}
        </Badge>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Button>
  );

  const editButton = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={(e) => {
        e.stopPropagation();
        navigateToSubclaims();
      }}
      aria-label={`Edit ${ct.label}`}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );

  return (
    <div
      className="flex cursor-pointer flex-col gap-3 rounded-md border-b border-border/60 py-4 transition-colors last:border-b-0 hover:bg-muted/35 sm:flex-row sm:items-center sm:gap-4"
      onClick={navigateToSubclaims}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            colorClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{ct.label}</p>
          {ct.description ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {ct.description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:pl-2">
        {subclaimsButton}
        {isAdmin && (
          <>
            {editButton}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ct);
              }}
              aria-label={`Delete ${ct.label}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ClaimTypeSection({
  title,
  icon: SectionIcon,
  iconClassName,
  types,
  isAdmin,
  onSelectSubclaims,
  onDelete,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  types: ClaimType[];
  isAdmin: boolean;
  onSelectSubclaims?: (id: string) => void;
  onDelete: (ct: ClaimType) => void;
}) {
  if (types.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconClassName
          )}
        >
          <SectionIcon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
          {title}
        </h2>
        <Badge variant="outline" className="text-[11px] font-normal">
          {types.length} {types.length === 1 ? "item" : "items"}
        </Badge>
      </div>
      <Card className="overflow-hidden border border-border/80 shadow-sm">
        <CardContent className="p-0 px-4">
          {types.map((ct) => (
            <ClaimTypeRow
              key={ct.id}
              ct={ct}
              isAdmin={isAdmin}
              onSelectSubclaims={onSelectSubclaims}
              onDelete={onDelete}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export interface ClaimTypeManagerProps {
  /** When set, Subclaims / Edit open the list on the same page (no route change). */
  onSelectSubclaims?: (claimTypeId: string) => void;
}

export function ClaimTypeManager({ onSelectSubclaims }: ClaimTypeManagerProps = {}) {
  const { data: claimTypes = [], isLoading } = useClaimTypes();
  const { profile } = useProfile();
  const createMutation = useCreateClaimType();
  const deleteMutation = useDeleteClaimType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ClaimTypeForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ClaimType | null>(null);

  const isAdmin =
    profile?.role === "hr_admin" || isTopManagementSlug(profile?.role);

  const standardTypes = claimTypes.filter((t) => !isTransportClaimTypeKey(t.key));
  const transportTypes = claimTypes.filter((t) => isTransportClaimTypeKey(t.key));

  const openAdd = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    const label = form.label.trim();
    if (!label) return;
    const baseKey =
      label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
      "claim-type";
    const lower = baseKey.toLowerCase();
    let key: string;
    if (form.category === "transport") {
      key = lower.startsWith(TRANSPORT_CLAIM_KEY_PREFIX)
        ? baseKey
        : `${TRANSPORT_CLAIM_KEY_PREFIX}${baseKey}`;
    } else {
      // Standard: avoid accidental `tm-*` slug from the label looking like a transport key
      key = lower.startsWith(TRANSPORT_CLAIM_KEY_PREFIX) ? `std-${baseKey}` : baseKey;
    }
    await createMutation.mutateAsync({
      key,
      label,
      description: form.description.trim() || undefined,
      icon: form.icon || undefined,
      color: colorForCategory(form.category),
    });
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isSaving = createMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Claim types
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage main claim types (Receipt, Mileage, etc.). Standard expenses and
            transport types are grouped separately. Only HR and Top Management can add
            or delete.
          </p>
        </div>
        {isAdmin && (
          <Button
            type="button"
            size="default"
            className="shrink-0 gap-2 gradient-modernize-blue text-white shadow-md hover:shadow-lg"
            onClick={openAdd}
          >
            <Plus className="h-4 w-4" />
            Add Claim Type
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-10">
          <ClaimTypeSection
            title="Standard expenses"
            icon={ShoppingBag}
            iconClassName="bg-primary/15 text-primary"
            types={standardTypes}
            isAdmin={isAdmin}
            onSelectSubclaims={onSelectSubclaims}
            onDelete={setDeleteTarget}
          />
          <ClaimTypeSection
            title="Transport & mileage"
            icon={MapPin}
            iconClassName="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            types={transportTypes}
            isAdmin={isAdmin}
            onSelectSubclaims={onSelectSubclaims}
            onDelete={setDeleteTarget}
          />
          {claimTypes.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No claim types yet. Add one to get started.
            </p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Claim Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Claim Name</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Transport Subsidy"
              />
            </div>
            <div>
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    category: v as ClaimTypeFormCategory,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard expenses</SelectItem>
                  <SelectItem value="transport">Transport & mileage</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Chooses which section this type appears under (stored in the claim
                type key).
              </p>
            </div>
            <div>
              <Label className="text-xs">Icon</Label>
              <Select
                value={form.icon}
                onValueChange={(v) => setForm((p) => ({ ...p, icon: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_TYPE_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <div
                className={cn(
                  "mt-1 flex h-10 items-center gap-3 rounded-md border border-input bg-muted/40 px-3 text-sm",
                )}
                aria-readonly
              >
                <span
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-lg",
                    typeColorMap[colorForCategory(form.category)] ??
                      "bg-muted",
                  )}
                  aria-hidden
                />
                <span className="font-mono text-xs text-foreground">
                  {colorForCategory(form.category)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Set automatically from category (standard → stat-blue, transport →
                stat-green).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSaving || !form.label.trim()}
            >
              {isSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete claim type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{deleteTarget?.label}&quot;? This
            cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
