const root = ["company-performance-docs"] as const;

export const companyPerformanceDocumentsQueryKeys = {
  all: root,
  performances: (employeeNo: string, params: unknown) => [...root, "performances", employeeNo, params] as const,
  targets: (employeeNo: string, bidSeq: number | null | undefined) => [...root, "targets", employeeNo, bidSeq ?? "none"] as const,
  detail: (seq: number) => [...root, "detail", seq] as const,
} as const;
