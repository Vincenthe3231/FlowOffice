"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  ExternalLink,
  MoreVertical,
  Trash2,
  Plane,
  Car,
  Hotel,
  Utensils,
  TrainFront,
  ShieldCheck,
  CreditCard,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClaimTypes, useSubclaimTypes, useDeleteSubclaim } from "@/features/claims/hooks/useClaims";
import { CreateSubclaimDialog } from "@/features/claims/components/CreateSubclaimDialog";
import type { SubclaimType } from "@/features/claims/types";

const SUBCLAIM_ICONS: LucideIcon[] = [
  Plane,
  Car,
  Hotel,
  Utensils,
  TrainFront,
  ShieldCheck,
  CreditCard,
  Briefcase,
];

export interface SubclaimTypesViewProps {
  claimTypeId: string;
  onBack: () => void;
}

export function SubclaimTypesView({ claimTypeId, onBack }: SubclaimTypesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: claimTypes = [] } = useClaimTypes();
  const { data: subclaimTypes, isLoading, isError } = useSubclaimTypes(claimTypeId);

  const claimType = claimTypes.find((ct) => ct.id === claimTypeId);
  const titleLabel = claimType ? claimType.label : claimTypeId;

  const filteredSubclaims = useMemo(() => {
    const list = subclaimTypes ?? [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (sub) =>
        sub.label.toLowerCase().includes(q) ||
        (sub.description ?? "").toLowerCase().includes(q)
    );
  }, [subclaimTypes, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">
        <span>Settings</span>
        <span>/</span>
        <span className="text-foreground">Claim Types</span>
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 rounded-lg border-border bg-card hover:bg-primary/10 hover:border-primary/20 transition-all"
              onClick={onBack}
              aria-label="Back to Claim Types"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
              Subclaim types: {titleLabel}
            </h1>
          </div>
          <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
            Define and manage specific subcategories for expense reimbursements.
          </p>
        </div>

        {!isLoading && !isError && (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-48 focus:w-64 transition-all bg-background border-border"
              />
            </div>
            <Button
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Subclaim</span>
            </Button>
          </div>
        )}
      </header>

      {/* Controlled dialog: one instance, opened from toolbar and dashed card */}
      <CreateSubclaimDialog
        claimTypeId={claimTypeId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load subclaim types. Please try again.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSubclaims.map((sub, idx) => {
              const Icon = SUBCLAIM_ICONS[idx % SUBCLAIM_ICONS.length];
              return (
                <SubclaimCard
                  key={sub.id}
                  claimTypeId={claimTypeId}
                  sub={sub}
                  icon={Icon}
                  index={idx}
                />
              );
            })}
            {/* Create New Block */}
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 * (filteredSubclaims.length || 0) }}
              onClick={() => setAddDialogOpen(true)}
              className="rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-pointer group min-h-[180px] bg-card/30"
            >
              <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">
                Create New Block
              </span>
            </motion.button>
          </div>

          {/* Footer */}
          <section className="mt-8 p-6 rounded-2xl bg-card/50 border border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Subclaim types
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {filteredSubclaims.length}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {filteredSubclaims.length === 1 ? "category" : "categories"}
              </span>
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function SubclaimCard({
  claimTypeId,
  sub,
  icon: Icon,
  index,
}: {
  claimTypeId: string;
  sub: SubclaimType;
  icon: LucideIcon;
  index: number;
}) {
  const deleteSubclaim = useDeleteSubclaim();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    await deleteSubclaim.mutateAsync({ claimTypeId, subclaimTypeId: sub.id });
    setDeleteDialogOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-card hover:border-primary/20 hover:shadow-md transition-all h-full">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                aria-label="Open"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    aria-label="More actions"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {sub.label}
            </h3>
            {sub.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {sub.description}
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Standard Rate
            </span>
            <span className="text-xs font-mono text-primary">
              {sub.rate != null
                ? `RM ${Number(sub.rate).toFixed(2)}/km`
                : "AUTO-CALC"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete subclaim type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{sub.label}&quot;? This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSubclaim.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSubclaim.isPending}
            >
              {deleteSubclaim.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {deleteSubclaim.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
