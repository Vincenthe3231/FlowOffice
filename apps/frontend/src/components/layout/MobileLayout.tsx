import { ReactNode } from "react";
import { FloatingClockButton } from "@/components/layout/FloatingClockButton";

interface MobileLayoutProps {
  children: ReactNode;
  /** Reserved for future use (e.g. hiding FAB). Bottom nav is rendered by the authenticated layout. */
  showNav?: boolean;
  showFab?: boolean;
}

export function MobileLayout({
  children,
  showFab = true,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="min-h-screen">{children}</main>
      {showFab && <FloatingClockButton />}
    </div>
  );
}
