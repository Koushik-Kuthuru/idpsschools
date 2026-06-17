"use client";

import * as React from "react";

/** Unwrap async route `params` in client page components (Next.js 15+). */
export function useRouteParam(
  params: Promise<Record<string, string | string[] | undefined>>,
  key: string
): string {
  const resolved = (React as any).use(params);
  const raw = resolved[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? decodeURIComponent(value) : "";
}
