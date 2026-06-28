"use client";

import { useCallback, useState } from "react";
import { clientCacheKey, writeClientCache } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import type { TransportBusRecord } from "@/lib/branchTransportStore";

type BusesPayload = { buses: TransportBusRecord[] };

export function useBranchTransportBuses(schoolId: string) {
  const cacheKey = clientCacheKey("transport-buses", schoolId);

  const query = useCachedQuery<BusesPayload>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId });
      const res = await fetch(`/api/admin/transport/buses?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load buses");
      return { buses: (data.buses ?? []) as TransportBusRecord[] };
    },
  });

  const [mutating, setMutating] = useState(false);

  const syncCache = useCallback(
    (buses: TransportBusRecord[]) => {
      writeClientCache(cacheKey, { buses });
      query.setData({ buses });
    },
    [cacheKey, query]
  );

  const addBus = useCallback(
    async (input: { busNo: string; route: string; routePrice?: number; status?: string }) => {
      setMutating(true);
      try {
        const res = await fetch("/api/admin/transport/buses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId, action: "add", ...input }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to add bus");
        syncCache(data.buses ?? []);
      } finally {
        setMutating(false);
      }
    },
    [schoolId, syncCache]
  );

  const updateBus = useCallback(
    async (
      id: string,
      patch: Partial<Pick<TransportBusRecord, "busNo" | "route" | "routePrice" | "status">>
    ) => {
      setMutating(true);
      try {
        const res = await fetch("/api/admin/transport/buses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId, id, ...patch }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to update bus");
        syncCache(data.buses ?? []);
      } finally {
        setMutating(false);
      }
    },
    [schoolId, syncCache]
  );

  const deleteBus = useCallback(
    async (id: string) => {
      setMutating(true);
      try {
        const params = new URLSearchParams({ schoolId, id });
        const res = await fetch(`/api/admin/transport/buses?${params.toString()}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to delete bus");
        syncCache(data.buses ?? []);
      } finally {
        setMutating(false);
      }
    },
    [schoolId, syncCache]
  );

  return {
    buses: query.data?.buses ?? [],
    loading: query.loading,
    refreshing: query.refreshing,
    error: query.error,
    refresh: query.refresh,
    mutating,
    addBus,
    updateBus,
    deleteBus,
  };
}
