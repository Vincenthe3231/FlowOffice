import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Plus, Pencil, Loader2 } from "lucide-react";
import { useOfficeManagement, type OfficeFormData, type Office } from "@/features/attendance/hooks/useOfficeManagement";

const emptyForm: OfficeFormData = {
  name: "",
  address: "",
  latitude: 0,
  longitude: 0,
  radius_meters: 200,
  is_active: true,
};

export function LocationManager() {
  const { offices, isLoading, addOffice, updateOffice, toggleActive } = useOfficeManagement();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OfficeFormData>(emptyForm);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (office: Office) => {
    setEditingId(office.id);
    setForm({
      name: office.name,
      address: office.address || "",
      latitude: office.latitude,
      longitude: office.longitude,
      radius_meters: office.radius_meters,
      is_active: office.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await updateOffice.mutateAsync({ id: editingId, ...form });
    } else {
      await addOffice.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const isSaving = addOffice.isPending || updateOffice.isPending;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Manage Locations</p>
        </div>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {offices.map((office) => (
            <Card key={office.id} className="shadow-card border-0">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{office.name}</p>
                    <Badge variant={office.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                      {office.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {office.address && (
                    <p className="text-xs text-muted-foreground truncate">{office.address}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Radius: {office.radius_meters}m
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={office.is_active}
                    onCheckedChange={(checked) =>
                      toggleActive.mutate({ id: office.id, is_active: checked })
                    }
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(office)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Location" : "Add Location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HQ Subang Jaya" />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Radius (meters)</Label>
              <Input type="number" value={form.radius_meters} onChange={(e) => setForm({ ...form, radius_meters: parseInt(e.target.value) || 100 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
