const root = ["company-performance-docs"] as const;

export const companyPerformanceDocumentsQueryKeys = {
  all: root,
  performances: (params: unknown) => [...root, "performances", params] as const,
  targets: (bidSeq: number | null | undefined) => [...root, "targets", bidSeq ?? "none"] as const,
  detail: (seq: number) => [...root, "detail", seq] as const,
} as const;
