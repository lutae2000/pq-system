const root = ["company-performances"] as const;

export const companyPerformanceQueryKeys = {
  all: root,
  list: (params: Record<string, unknown>) => [...root, "list", params] as const,
  engineers: (seq: number) => [...root, "engineers", seq] as const,
  contractPeriods: (seq: number) => [...root, "contract-periods", seq] as const,
} as const;
