"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LocationManager } from "@/features/attendance/components/LocationManager";

export default function WorkLocationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Locations"
        subtitle="Manage pre-registered work locations."
      />

      <LocationManager />
    </div>
  );
}
