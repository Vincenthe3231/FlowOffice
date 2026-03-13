import { motion } from "framer-motion";
import { Car, FileText, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/features/attendance";
import { CLAIM_FILTERS } from "@/features/claims/data";
import type { Claim, ClaimFilter } from "@/features/claims/types";

interface ClaimsTableProps {
  filter: ClaimFilter;
  onFilterChange: (value: ClaimFilter) => void;
  claims: Claim[];
  onClaimSelect: (claim: Claim) => void;
  onResubmit?: (claim: Claim) => void;
}

export function ClaimsTable({
  filter,
  onFilterChange,
  claims,
  onClaimSelect,
  onResubmit,
}: ClaimsTableProps) {
  const handleFilterSelect = (value: ClaimFilter) => {
    if (value !== filter) {
      onFilterChange(value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.15 }}
    >
      <Card className="premium-shadow border-0">
        <CardHeader className="px-4 pb-2 pt-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold sm:text-base">All Claims</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">{claims.length} records</p>
            </div>
            <div className="w-full sm:max-w-[420px]">
              <div className="flex flex-nowrap items-center gap-1 rounded-full bg-muted/40 p-1">
                {CLAIM_FILTERS.map((claimFilter) => {
                  const isActive = filter === claimFilter;

                  return (
                    <motion.div key={claimFilter} whileTap={{ scale: 0.97 }}>
                      <button
                        type="button"
                        onClick={() => handleFilterSelect(claimFilter)}
                        onPointerUp={() => handleFilterSelect(claimFilter)}
                        className="relative h-6 shrink-0 whitespace-nowrap rounded-full border border-transparent bg-muted/60 px-2 text-[10px] text-muted-foreground transition-colors hover:bg-muted sm:h-7 sm:px-2.5 sm:text-[11px]"
                        aria-pressed={isActive}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="claims-active-tab"
                            className="pointer-events-none absolute inset-0 rounded-full bg-primary"
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          />
                        )}
                        <span
                          className={`relative z-10 transition-colors ${
                            isActive ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {claimFilter}
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table className="text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 px-3 text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                    Title
                  </TableHead>
                  <TableHead className="hidden h-9 px-3 text-[10px] uppercase tracking-wide sm:table-cell sm:h-10 sm:px-4">
                    Category
                  </TableHead>
                  <TableHead className="h-9 px-3 text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                    Amount
                  </TableHead>
                  <TableHead className="hidden h-9 px-3 text-[10px] uppercase tracking-wide md:table-cell md:h-10 md:px-4">
                    Date
                  </TableHead>
                  <TableHead className="h-9 px-3 text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                    Status
                  </TableHead>
                  <TableHead className="h-9 w-[80px] px-3 text-right text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow
                    key={claim.id}
                    className="cursor-pointer transition-colors duration-200 hover:bg-muted/50"
                    onClick={() => onClaimSelect(claim)}
                  >
                    <TableCell className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <motion.div
                        className="flex items-start gap-2"
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.18 }}
                      >
                        {claim.type === "mileage" ? (
                          <Car className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                        ) : (
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                        )}
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-medium sm:text-sm">{claim.title}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground sm:hidden">
                            {claim.category} • {claim.date}
                          </span>
                        </div>
                      </motion.div>
                    </TableCell>
                    <TableCell className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell sm:px-4 sm:py-3 sm:text-sm">
                      {claim.category}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs font-semibold sm:px-4 sm:py-3 sm:text-sm">
                      RM {claim.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell md:px-4 md:py-3 md:text-sm">
                      {claim.date}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <StatusBadge status={claim.status} className="px-2 py-0.5 text-[9px] sm:text-[10px]" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right sm:px-4 sm:py-3">
                      {claim.status === "Rejected" && onResubmit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-[10px] sm:text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResubmit(claim);
                          }}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Resubmit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
