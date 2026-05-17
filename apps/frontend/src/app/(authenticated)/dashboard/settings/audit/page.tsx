"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";
import { useAuditTrail } from "@/features/audit/hooks/useAuditTrail";
import { AuditFiltersBar } from "@/features/audit/components/AuditFiltersBar";
import { AuditTable } from "@/features/audit/components/AuditTable";
import type { AuditFilter } from "@/features/audit/types";

export default function AuditTrailPage() {
  const [filters, setFilters] = useState<AuditFilter>({});
  const [page, setPage] = useState(1);

  const { data, isFetching } = useAuditTrail(filters, page);

  const entries = data?.entries ?? [];
  const meta = data?.meta;

  function handleFiltersChange(next: AuditFilter) {
    setFilters(next);
    setPage(1);
  }

  function handleReset() {
    setFilters({});
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" subtitle="Historical log of system changes and actions." />

      <Card className="premium-shadow border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Activity Log</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pb-0">
          <AuditFiltersBar filters={filters} onChange={handleFiltersChange} onReset={handleReset} />
        </CardContent>
        <CardContent className="p-0">
          <AuditTable entries={entries} isLoading={isFetching && entries.length === 0} />
        </CardContent>

        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              {meta.total} entries · Page {meta.currentPage} of {meta.lastPage}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.currentPage <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.currentPage >= meta.lastPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
