"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useState } from "react";
import { mapPaymentDocToReceipt, type FeeReceiptRow } from "@/lib/feeDepositUtils";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";

type UseFeePaymentsOptions = {
  academicYear?: string | null;
  studentId?: string | null;
  admissionNo?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number | null;
  /** When false, skip auto-fetch (e.g. Deposit Fee waits for a selected student). */
  enabled?: boolean;
  /**
   * When true (default), wait until an academic year is known before fetching.
   * Prevents accidentally loading the entire multi-year payment history.
   */
  requireAcademicYear?: boolean;
};

const DEFAULT_TRANSACTIONS_LIMIT = 1500;

export function useFeePayments(schoolId: string, options: UseFeePaymentsOptions = {}) {
  const academicYearCtx = useAcademicYearOptional();
  const academicYear = options.academicYear ?? academicYearCtx?.currentYear?.name ?? null;
  const yearLoading = academicYearCtx?.loading ?? false;
  const requireAcademicYear = options.requireAcademicYear !== false;
  const enabled = options.enabled !== false;
  const limit = options.limit === undefined ? null : options.limit;
  const dateFrom = options.dateFrom ?? null;
  const dateTo = options.dateTo ?? null;

  const [receipts, setReceipts] = useState<FeeReceiptRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const refresh = useCallback(async () => {
    if (!schoolId || !enabled) {
      setReceipts([]);
      setLoading(false);
      setHasMore(false);
      return;
    }

    if (requireAcademicYear && !academicYear) {
      // Keep loading UI while academic years hydrate; otherwise show empty.
      setReceipts([]);
      setLoading(yearLoading);
      setHasMore(false);
      if (!yearLoading) {
        setError("Select an academic year to view fee transactions.");
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId });
      if (academicYear) params.set("academicYear", academicYear);
      if (options.studentId) params.set("studentId", options.studentId);
      if (options.admissionNo) params.set("admissionNo", options.admissionNo);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (limit != null) params.set("limit", String(limit));

      const res = await adminFetch(`/api/admin/fee-payments?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load fee payments");

      const rows = (data.payments ?? []) as Array<Record<string, unknown>>;
      setReceipts(rows.map((row) => mapPaymentDocToReceipt(String(row.id ?? ""), row)));
      setHasMore(limit != null && rows.length >= limit);
    } catch (err) {
      setReceipts([]);
      setHasMore(false);
      setError(err instanceof Error ? err.message : "Failed to load fee payments");
    } finally {
      setLoading(false);
    }
  }, [
    schoolId,
    enabled,
    requireAcademicYear,
    academicYear,
    yearLoading,
    options.studentId,
    options.admissionNo,
    dateFrom,
    dateTo,
    limit,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { receipts, loading, error, refresh, academicYear, hasMore, limit };
}

export { DEFAULT_TRANSACTIONS_LIMIT };
