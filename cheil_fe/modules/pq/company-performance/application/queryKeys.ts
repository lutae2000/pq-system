const root = ["company-performances"] as const;

export const companyPerformanceQueryKeys = {
  all: root,
  list: (params: Record<string, unknown>) => [...root, "list", params] as const,
} as const;
