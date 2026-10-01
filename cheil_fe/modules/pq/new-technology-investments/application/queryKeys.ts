const root = ["new-technology-investments"] as const;

export const newTechnologyInvestmentQueryKeys = {
  all: root,
  list: (params: Record<string, unknown>) => [...root, "list", params] as const,
  detail: (investmentId: number) => [...root, "detail", investmentId || "none"] as const,
} as const;
