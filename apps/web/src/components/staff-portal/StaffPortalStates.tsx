"use client";

import { RefreshCw } from "lucide-react";
import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonStats,
  SkeletonText,
} from "@/components/ui/Skeleton";

type StaffPortalLoadingVariant = "cards" | "list" | "dashboard" | "profile";

export function StaffPortalLoading({
  label,
  variant = "cards",
  rows = 4,
}: {
  /** Kept for callers that still pass a label; announced to screen readers only. */
  label?: string;
  variant?: StaffPortalLoadingVariant;
  rows?: number;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label ?? "Loading"}</span>
      {variant === "dashboard" ? (
        <>
          <SkeletonStats count={4} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={5} />
          </div>
        </>
      ) : null}
      {variant === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <SkeletonList rows={rows} avatar={false} />
        </div>
      ) : null}
      {variant === "profile" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <SkeletonText lines={6} className="mt-6" />
        </div>
      ) : null}
      {variant === "cards"
        ? Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
            <SkeletonCard key={i} className="rounded-2xl" lines={3} />
          ))
        : null}
    </div>
  );
}

export function StaffPortalError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
      <p className="text-sm font-bold text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#144835] shadow-sm"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function StaffPortalEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm font-medium text-gray-400">
      {message}
    </div>
  );
}

function statusClass(status?: string): string {
  const value = String(status ?? "").toLowerCase();
  if (value.includes("approv")) return "bg-emerald-50 text-emerald-700";
  if (value.includes("reject") || value.includes("declin")) return "bg-red-50 text-red-700";
  if (value.includes("pend")) return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export function StaffStatusBadge({ status }: { status?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass(status)}`}>
      {status || "Pending"}
    </span>
  );
}
