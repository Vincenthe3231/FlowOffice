"use client";

import { AlertTriangle } from "lucide-react";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const purchaseUrl = process.env.NEXT_PUBLIC_PURCHASE_URL || "";

export function DemoModeBanner() {
  if (!isDemoMode) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>Demo Mode — write operations are disabled.</span>
      {purchaseUrl && (
        <a
          href={purchaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 font-semibold hover:text-amber-800"
        >
          Get the template
        </a>
      )}
    </div>
  );
}
