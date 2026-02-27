import { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { FloatingClockButton } from "@/components/layout/FloatingClockButton";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showFab?: boolean;
}

export function MobileLayout({ 
  children, 
  showNav = true, 
  showFab = true 
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={cn(
        "min-h-screen",
        showNav && "pb-20"
      )}>
        {children}
      </main>
      {showFab && <FloatingClockButton />}
      {showNav && <BottomNav />}
    </div>
  );
}
