const root = ["similar-service-performances"] as const;

export const similarServicePerformanceQueryKeys = {
  all: root,
  list: (params: Record<string, unknown>) => [...root, "list", params] as const,
} as const;
