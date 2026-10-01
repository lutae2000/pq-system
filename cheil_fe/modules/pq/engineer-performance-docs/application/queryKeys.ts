export const engineerPerformanceDocumentsQueryKeys = {
  all: ["engineer-performance-docs"] as const,
  reviewResultsRoot: ["engineer-performance-docs", "review-results"] as const,
  selectedEngineersRoot: ["engineer-performance-docs", "selected-engineers"] as const,
  selectedEngineers: (bidSeq: number | null, workDutyId: string) =>
    ["engineer-performance-docs", "selected-engineers", bidSeq ?? "none", workDutyId] as const,
  documentValueSettings: (bidSeq: number | null) =>
    ["engineer-performance-docs", "document-value-settings", bidSeq ?? "none"] as const,
  activeEngineerProfile: (engineerId: string) =>
    ["engineer-performance-docs", "active-engineer-profile", engineerId || "none"] as const,
  projectHistories: (engineerId: string) =>
    ["engineer-performance-docs", "project-histories", engineerId || "none"] as const,
  reviewResults: (bidSeq: number | null, engineerId: string) =>
    ["engineer-performance-docs", "review-results", bidSeq ?? "none", engineerId || "none"] as const,
};
