"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export function useSchoolId(fallback = "idpskalaburagi"): string {
  const pathname = usePathname();
  return useMemo(() => {
    const match = pathname.match(/^\/schools\/(idpscherukupalli|idpskalaburagi)/);
    return match ? match[1] : fallback;
  }, [pathname, fallback]);
}
