"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCreateSubclaim } from "@/features/claims/hooks/useClaims";

interface CreateSubclaimDialogProps {
  claimTypeId: string;
}

export function CreateSubclaimDialog({ claimTypeId }: CreateSubclaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const createSubclaim = useCreateSubclaim();

  const handleSubmit = async () => {
    if (!label.trim()) return;
    try {
      await createSubclaim.mutateAsync({
        claimTypeId,
        label: label.trim(),
        key: label.trim().toLowerCase().replace(/\s+/g, "-"),
        description: description.trim() || undefined,
        rate: rate ? parseFloat(rate) : undefined,
      });
      setLabel("");
      setDescription("");
      setRate("");
      setOpen(false);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed border-2 h-auto py-4 hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add Custom Subclaim</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md premium-shadow border-0">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Create Custom Subclaim
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subclaim Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. E-Hailing"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rate (RM/km, optional)
            </Label>
            <Input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0.00"
              min={0}
              step={0.01}
              className="h-10"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!label.trim() || createSubclaim.isPending}
            >
              {createSubclaim.isPending ? "Creating..." : "Create Subclaim"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
