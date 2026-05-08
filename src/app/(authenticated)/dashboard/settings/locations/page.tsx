"use client";

import { LocationManager } from "@/features/attendance/components/LocationManager";

export default function WorkLocationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Work Locations</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage pre-registered work locations.</p>
      </div>

      <LocationManager />
    </div>
  );
}
