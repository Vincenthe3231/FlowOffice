"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Car, Percent, Camera } from "lucide-react";
import type { CustomField } from "@/features/claims/types";

interface CustomFieldBuilderProps {
  fields: CustomField[];
  onAdd: (field: CustomField) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, value: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <span className="text-[10px] font-bold">Aa</span>,
  number: <span className="text-[10px] font-bold">#</span>,
  date: <span className="text-[10px] font-bold">📅</span>,
  dropdown: <span className="text-[10px] font-bold">▾</span>,
  mileage: <Car className="h-3 w-3" />,
  percentage: <Percent className="h-3 w-3" />,
  photo: <Camera className="h-3 w-3" />,
};

export function CustomFieldBuilder({
  fields,
  onAdd,
  onRemove,
  onUpdate,
}: CustomFieldBuilderProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<CustomField["type"]>("text");
  const [newOptions, setNewOptions] = useState("");

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const field: CustomField = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      type: newType,
      value: "",
      options:
        newType === "dropdown"
          ? newOptions
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
    };
    onAdd(field);
    setNewLabel("");
    setNewType("text");
    setNewOptions("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Custom Fields
        </Label>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 hover:bg-primary/10 transition-colors"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="h-3 w-3" />
          Add Field
        </Button>
      </div>

      {showAdd && (
        <div className="p-3 rounded-xl premium-shadow border border-border/50 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Field label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-8 text-sm"
            />
            <Select
              value={newType}
              onValueChange={(v) => setNewType(v as CustomField["type"])}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="mileage">Mileage (km)</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="photo">Photo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newType === "dropdown" && (
            <Input
              placeholder="Options (comma-separated)"
              value={newOptions}
              onChange={(e) => setNewOptions(e.target.value)}
              className="h-8 text-sm"
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAdd}
              disabled={!newLabel.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {fields.map((field) => (
        <div
          key={field.id}
          className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
            {typeIcons[field.type]}
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            {field.type === "dropdown" && field.options ? (
              <Select value={field.value} onValueChange={(v) => onUpdate(field.id, v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "mileage" ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => onUpdate(field.id, e.target.value)}
                    className="h-9 text-sm pr-8"
                    placeholder="0"
                    min={0}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    km
                  </span>
                </div>
                <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-primary text-primary-foreground whitespace-nowrap">
                  RM {(parseFloat(field.value || "0") * 0.8).toFixed(2)}
                </div>
              </div>
            ) : field.type === "percentage" ? (
              <div className="relative">
                <Input
                  type="number"
                  value={field.value}
                  onChange={(e) => {
                    const v = Math.min(
                      100,
                      Math.max(0, Number(e.target.value))
                    );
                    onUpdate(field.id, String(v));
                  }}
                  className="h-9 text-sm pr-8"
                  placeholder="0"
                  min={0}
                  max={100}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold">
                  %
                </span>
              </div>
            ) : field.type === "photo" ? (
              <label className="group flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background cursor-pointer hover:bg-primary/5 transition-colors">
                <Camera className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-primary truncate">
                  {field.value ? field.value.split("/").pop() : "Upload photo..."}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpdate(field.id, file.name);
                  }}
                />
              </label>
            ) : (
              <Input
                type={
                  field.type === "number"
                    ? "number"
                    : field.type === "date"
                      ? "date"
                      : "text"
                }
                value={field.value}
                onChange={(e) => onUpdate(field.id, e.target.value)}
                className="h-9 text-sm"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive/60 hover:text-destructive"
            onClick={() => onRemove(field.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
