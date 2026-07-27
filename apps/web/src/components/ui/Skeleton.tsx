import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}

/** Stacked text lines; last line is shorter to mimic prose. */
export function SkeletonText({
  lines = 3,
  className,
  lineClassName,
}: {
  lines?: number;
  className?: string;
  lineClassName?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5 w-full", i === lines - 1 && "w-2/3", lineClassName)}
        />
      ))}
    </div>
  );
}

/** Rows for an existing <table>. Renders <tr>/<td> so it can slot into a tbody. */
export function SkeletonTableRows({
  rows = 8,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className={cn("border-b border-gray-100", className)}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-3 py-3">
              <Skeleton className={cn("h-3.5", c === 0 ? "w-3/4" : "w-full max-w-[120px]")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Standalone table block including a header strip. */
export function SkeletonTable({
  rows = 8,
  columns = 5,
  showHeader = true,
  className,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white", className)}>
      {showHeader ? (
        <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={cn("h-3 flex-1", i === 0 && "max-w-[160px]")} />
          ))}
        </div>
      ) : null}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={cn("h-3.5 flex-1", c === 0 && "max-w-[160px]")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** List of avatar + two-line rows (directories, staff/student lists). */
export function SkeletonList({
  rows = 6,
  avatar = true,
  className,
}: {
  rows?: number;
  avatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-gray-100", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {avatar ? <Skeleton className="h-10 w-10 shrink-0 rounded-full" /> : null}
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-3.5 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Generic bordered card with optional title strip. */
export function SkeletonCard({
  className,
  lines = 3,
  showHeader = true,
}: {
  className?: string;
  lines?: number;
  showHeader?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-4", className)}>
      {showHeader ? (
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ) : null}
      <SkeletonText lines={lines} />
    </div>
  );
}

/** KPI / stat tiles row. */
export function SkeletonStats({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="mt-3 h-6 w-24" />
          <Skeleton className="mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Label + input pairs for forms. */
export function SkeletonForm({
  fields = 6,
  columns = 2,
  className,
}: {
  fields?: number;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const grid =
    columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
  return (
    <div className={cn("grid gap-4", grid, className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Chart / graph placeholder with bar ticks. */
export function SkeletonChart({
  className,
  bars = 10,
}: {
  className?: string;
  bars?: number;
}) {
  const heights = ["h-1/3", "h-1/2", "h-2/3", "h-3/4", "h-full", "h-2/5", "h-3/5", "h-4/5"];
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-4", className)}>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex h-40 items-end gap-2">
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <Skeleton className={cn("w-full rounded-t-md", heights[i % heights.length])} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Page header: title, subtitle, actions. */
export function SkeletonPageHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/** Filter/search toolbar strip. */
export function SkeletonToolbar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <Skeleton className="h-9 w-full sm:max-w-sm rounded-lg" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Full page scaffold: header + optional stats + toolbar + table.
 * Use for whole-page loading so layout does not shift on load.
 */
export function SkeletonPage({
  stats = 0,
  rows = 8,
  columns = 5,
  toolbar = true,
  className,
}: {
  stats?: number;
  rows?: number;
  columns?: number;
  toolbar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <SkeletonPageHeader />
      {stats > 0 ? <SkeletonStats count={stats} /> : null}
      {toolbar ? <SkeletonToolbar /> : null}
      <SkeletonTable rows={rows} columns={columns} />
    </div>
  );
}

/** Profile layout: avatar card beside detail cards. */
export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-12", className)}>
      <div className="space-y-4 lg:col-span-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <Skeleton className="h-28 w-full rounded-none" />
          <div className="flex flex-col items-center px-6 pb-6">
            <Skeleton className="-mt-10 h-20 w-20 rounded-full" />
            <Skeleton className="mt-3 h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-24" />
            <div className="mt-5 w-full space-y-3">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/6" />
            </div>
          </div>
        </div>
        <SkeletonCard lines={4} />
      </div>
      <div className="space-y-4 lg:col-span-8">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-lg" />
          ))}
        </div>
        <SkeletonCard lines={6} />
        <SkeletonCard lines={5} />
      </div>
    </div>
  );
}

/** Permission / timetable style grid of toggle cells. */
export function SkeletonMatrix({
  rows = 8,
  columns = 8,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white", className)}>
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <Skeleton className="h-3 w-32" />
        <div className="flex flex-1 justify-end gap-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-10" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3 px-4 py-2.5">
            <Skeleton className="h-3.5 w-32" />
            <div className="flex flex-1 justify-end gap-3">
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton key={c} className="h-6 w-6 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Teacher / student portal content area (layout chrome already mounted).
 * Matches the typical dashboard: greeting, KPI strip, schedule + side cards.
 */
export function SkeletonPortalDashboard({ className }: { className?: string }) {
  return (
    <div className={cn("erp-body space-y-4 sm:space-y-6 pb-10 max-w-[1600px] mx-auto", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-56 rounded-lg" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <SkeletonStats count={4} className="lg:grid-cols-4" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-3.5 w-36" />
          <SkeletonCard lines={5} className="rounded-2xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-28" />
          <SkeletonCard lines={4} className="rounded-2xl" />
          <SkeletonCard lines={3} className="rounded-2xl" showHeader={false} />
        </div>
      </div>
    </div>
  );
}

/**
 * Whole-app placeholder (sidebar rail + top bar + content) used by route guards
 * so the chrome does not pop in once auth resolves.
 */
export function SkeletonAppShell({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-screen bg-[#F8FAFB]", className)}>
      <aside className="hidden w-20 shrink-0 flex-col items-center gap-4 border-r border-gray-200 bg-white py-5 lg:flex">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-9 rounded-lg" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-3 lg:px-8">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <SkeletonPage stats={4} rows={6} />
        </main>
      </div>
    </div>
  );
}

/** Inline block used inside cards/panels while their data loads. */
export function SkeletonPanel({
  className,
  rows = 4,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={cn("space-y-3 p-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
