"use client";

import { dehydrate, hydrate, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const REFERENCE_QUERY_CACHE_STORAGE_KEY = "cheil-reference-query-cache";

const ReferenceQueryCacheContext = createContext(false);

const isCommonCodeReferenceQuery = (queryKey: readonly unknown[]) =>
  queryKey[0] === "references" && queryKey[1] === "common-codes";

export const clearReferenceQueryCacheStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(REFERENCE_QUERY_CACHE_STORAGE_KEY);
};

export function ReferenceQueryCacheProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(REFERENCE_QUERY_CACHE_STORAGE_KEY);
      if (stored) {
        hydrate(queryClient, JSON.parse(stored));
      }
    } catch {
      clearReferenceQueryCacheStorage();
    }

    let saveTimer: number | undefined;
    const persist = () => {
      if (saveTimer !== undefined) {
        window.clearTimeout(saveTimer);
      }

      saveTimer = window.setTimeout(() => {
        try {
          const dehydrated = dehydrate(queryClient, {
            shouldDehydrateQuery: (query) => isCommonCodeReferenceQuery(query.queryKey),
          });
          window.sessionStorage.setItem(REFERENCE_QUERY_CACHE_STORAGE_KEY, JSON.stringify(dehydrated));
        } catch {
          // Ignore storage quota and serialization failures. React Query memory cache remains available.
        }
      }, 0);
    };

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        (event.type === "added" || event.type === "updated" || event.type === "removed") &&
        isCommonCodeReferenceQuery(event.query.queryKey)
      ) {
        persist();
      }
    });

    const hydrationTimer = window.setTimeout(() => setHydrated(true), 0);

    return () => {
      window.clearTimeout(hydrationTimer);
      if (saveTimer !== undefined) {
        window.clearTimeout(saveTimer);
      }
      unsubscribe();
    };
  }, [queryClient]);

  return <ReferenceQueryCacheContext.Provider value={hydrated}>{children}</ReferenceQueryCacheContext.Provider>;
}

export const useReferenceQueryCacheHydrated = () => useContext(ReferenceQueryCacheContext);
