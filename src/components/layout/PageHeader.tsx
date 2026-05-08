import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  showBack = false, 
  action,
  className 
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className={cn(
      "sticky top-0 z-30 glass border-b border-border/50 pt-safe",
      className
    )}>
      <div className="flex items-center justify-between h-12 px-3 md:h-14 md:px-4">
        <div className="flex items-center gap-2 md:gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center h-8 w-8 -ml-1 rounded-xl hover:bg-muted transition-colors md:h-9 md:w-9 md:-ml-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          )}
          <div>
            <h1 className="text-base font-bold leading-tight md:text-lg">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground md:text-xs">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}
