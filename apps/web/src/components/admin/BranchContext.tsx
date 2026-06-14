"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type BranchSummary = {
  id: string;
  name: string;
  city?: string;
};

type BranchContextValue = {
  branches: BranchSummary[];
  activeBranch: BranchSummary;
  setActiveBranchId: (id: string) => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

import { SCHOOL_BRANCHES } from "@/lib/schools";

const defaultBranches: BranchSummary[] = SCHOOL_BRANCHES.map((b) => ({
  id: b.id,
  name: b.name,
  city: b.city,
}));

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeBranchId, setActiveBranchId] = useState(defaultBranches[0]?.id ?? "");

  useEffect(() => {
    const parts = String(pathname || "").split("/").filter(Boolean);
    const schoolsIndex = parts.indexOf("schools");
    const schoolFromPath = schoolsIndex >= 0 ? parts[schoolsIndex + 1] : "";
    if (!schoolFromPath) return;
    if (!defaultBranches.some((b) => b.id === schoolFromPath)) return;
    if (schoolFromPath === activeBranchId) return;
    setActiveBranchId(schoolFromPath);
  }, [activeBranchId, pathname]);

  const value = useMemo<BranchContextValue>(() => {
    const activeBranch = defaultBranches.find((b) => b.id === activeBranchId) ?? defaultBranches[0];
    return {
      branches: defaultBranches,
      activeBranch,
      setActiveBranchId,
    };
  }, [activeBranchId]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
