"use client";

import { useCallback, useEffect, useState } from "react";
import { buildPath, buildQuery, db, fetchMany, sortBy } from "@/lib/db-client";
import { mapPaymentDocToReceipt, type FeeReceiptRow } from "@/lib/feeDepositUtils";

export function useFeePayments(schoolId: string) {
  const [receipts, setReceipts] = useState<FeeReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const snap = await fetchMany(
        buildQuery(buildPath(db, "schools", schoolId, "payments"), sortBy("createdAt", "desc")),
        { skipCache: true }
      );
      setReceipts(snap.docs.map((d) => mapPaymentDocToReceipt(d.id, d.data() as Record<string, unknown>)));
    } catch (err) {
      setReceipts([]);
      setError(err instanceof Error ? err.message : "Failed to load fee payments");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { receipts, loading, error, refresh };
}
