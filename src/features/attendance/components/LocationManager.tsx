import { useState, useEffect, useRef, useCallback } from "react";
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
import { MapPin, Plus, Pencil, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useOfficeManagement } from "@/features/attendance/hooks/useOfficeManagement";
import { geocodeAddress } from "@/shared/lib/api-client/geocode";
import { OfficeFormData, Office } from "@/shared/lib/api-client/offices";

const GEOCODE_DEBOUNCE_MS = 800;

type GeocodeStatus = "idle" | "loading" | "found" | "not_found";

const emptyForm: OfficeFormData = {
  name: "",
  address: "",
  latitude: 0,
  longitude: 0,
  radiusMeters: 200,
  isActive: true,
};

export function LocationManager() {
  const { offices, isLoading, addOffice, updateOffice, toggleActive } = useOfficeManagement();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OfficeFormData>(emptyForm);
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setGeocodeStatus("idle");
    setDialogOpen(true);
  };

  const openEdit = (office: Office) => {
    setEditingId(office.id);
    setForm({
      name: office.name,
      address: office.address || "",
      latitude: office.latitude,
      longitude: office.longitude,
      radiusMeters: office.radiusMeters,
      isActive: office.isActive,
    });
    setGeocodeStatus("idle");
    setDialogOpen(true);
    const lat = Number(office.latitude);
    const lng = Number(office.longitude);
    if (lat === 0 && lng === 0 && (office.address || "").trim()) {
      setTimeout(() => runGeocode(office.address || ""), 100);
    }
  };

  const runGeocode = useCallback((address: string) => {
    if (!address.trim()) {
      setGeocodeStatus("idle");
      setForm((prev) => ({ ...prev, latitude: 0, longitude: 0 }));
      return;
    }
    setGeocodeStatus("loading");
    geocodeAddress(address)
      .then((result) => {
        if (result) {
          setForm((prev) => ({ ...prev, latitude: result.lat, longitude: result.lng }));
          setGeocodeStatus("found");
        } else {
          setForm((prev) => ({ ...prev, latitude: 0, longitude: 0 }));
          setGeocodeStatus("not_found");
        }
      })
      .catch(() => {
        setForm((prev) => ({ ...prev, latitude: 0, longitude: 0 }));
        setGeocodeStatus("not_found");
      });
  }, []);

  const handleAddressChange = (value: string) => {
    setForm((prev) => ({ ...prev, address: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setGeocodeStatus("idle");
      setForm((prev) => ({ ...prev, latitude: 0, longitude: 0 }));
      return;
    }
    debounceRef.current = setTimeout(() => runGeocode(value), GEOCODE_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
                    <Badge variant={office.isActive ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                      {office.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {office.address && (
                    <p className="text-xs text-muted-foreground truncate">{office.address}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Radius: {office.radiusMeters}m
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={office.isActive}
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
              <Input
                value={form.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Full address (e.g. SS19 Subang Jaya)"
              />
              <p className="text-[11px] mt-1.5 flex items-center gap-1.5 text-muted-foreground">
                {geocodeStatus === "loading" && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    Locating...
                  </>
                )}
                {geocodeStatus === "found" && (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                    Location found — coordinates will be saved
                  </>
                )}
                {geocodeStatus === "not_found" && (
                  <>
                    <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                    Address not found — coordinates will be 0,0
                  </>
                )}
              </p>
            </div>

            <div>
              <Label className="text-xs">Radius (meters)</Label>
              <Input type="number" value={200} readOnly className="bg-muted cursor-not-allowed" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
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
