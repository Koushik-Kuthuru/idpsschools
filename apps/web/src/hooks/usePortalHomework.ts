"use client";

import { clientCacheKey } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";

type HomeworkPayload = {
  items: Record<string, unknown>[];
};

export function usePortalHomework(schoolId: string) {
  const cacheKey = clientCacheKey("portal-homework", schoolId);

  return useCachedQuery<HomeworkPayload>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const res = await fetch(`/api/portal/homework?schoolId=${encodeURIComponent(schoolId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to load homework");
      }
      return { items: (data.items ?? []) as Record<string, unknown>[] };
    },
  });
}
