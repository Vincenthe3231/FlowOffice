"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { shifts as initialShifts } from "@/features/attendance/data/mockData";

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  status: "Active" | "Inactive";
}

export default function ShiftSchedulingPage() {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [form, setForm] = useState({ name: "", startTime: "09:00", endTime: "18:00" });

  const openAdd = () => {
    setEditingShift(null);
    setForm({ name: "", startTime: "09:00", endTime: "18:00" });
    setDialogOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    setForm({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingShift) {
      setShifts((prev) => prev.map((s) => (s.id === editingShift.id ? { ...s, ...form } : s)));
    } else {
      setShifts((prev) => [...prev, { id: Date.now(), ...form, status: "Active" }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => setShifts((prev) => prev.filter((s) => s.id !== id));

  const toggleStatus = (id: number) =>
    setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure employee shifts and schedules.</p>
        </div>
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Shift
        </Button>
      </div>

      <Card className="premium-shadow border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Shift Name</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Start Time</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">End Time</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {shift.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{shift.startTime}</TableCell>
                  <TableCell className="text-sm">{shift.endTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={shift.status === "Active"} onCheckedChange={() => toggleStatus(shift.id)} />
                      <Badge variant={shift.status === "Active" ? "default" : "secondary"} className="text-[10px]">{shift.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(shift)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(shift.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {shifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    No shifts configured. Click &quot;Add Shift&quot; to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift" : "Add New Shift"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Shift Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning Shift" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingShift ? "Save Changes" : "Add Shift"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
