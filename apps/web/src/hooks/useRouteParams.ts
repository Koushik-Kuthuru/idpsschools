"use client";

import * as React from "react";

/** Unwrap async route `params` in client page components (Next.js 15+). */
export function useRouteParam(
  params: Promise<Record<string, string | string[] | undefined>>,
  key: string
): string {
  const resolved = React.use(params);
  const raw = resolved[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? decodeURIComponent(value) : "";
}

/** Unwrap async route `searchParams` in client page components (Next.js 16+). */
export function useRouteSearchParam(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
  key: string
): string | null {
  const resolved = React.use(searchParams);
  const raw = resolved[key];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return null;
}
