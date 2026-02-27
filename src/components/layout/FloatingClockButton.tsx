import { Clock } from "lucide-react";
// 1. Change the imports
import { useRouter, usePathname } from "next/navigation"; 
import { cn } from "@/lib/utils";

export function FloatingClockButton() {
  // 2. Use Next.js hooks instead
  const router = useRouter(); 
  const pathname = usePathname();
  
  // 3. Update the logic to use 'pathname'
  if (pathname === "/attendance") return null;

  return (
    <button
      // 4. Update navigate() to router.push()
      onClick={() => router.push("/attendance")}
      className={cn(
        "fixed bottom-24 right-4 z-40",
        "flex items-center justify-center",
        "h-14 w-14 rounded-full",
        "bg-gradient-primary text-primary-foreground",
        "shadow-fab",
        "transition-all duration-200",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      aria-label="Quick clock in"
    >
      <Clock className="h-6 w-6" />
    </button>
  );
}