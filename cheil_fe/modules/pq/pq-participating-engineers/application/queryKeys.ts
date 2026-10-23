import type { PqParticipatingEngineerCandidateSearchParams } from "@/modules/pq/pq-participating-engineers/api";

const root = ["pq-participating-engineers"] as const;

export const pqParticipatingEngineerQueryKeys = {
  all: root,
  candidates: (params: PqParticipatingEngineerCandidateSearchParams, searchRevision: number) => [...root, "candidates", params, searchRevision] as const,
  candidatesRoot: () => [...root, "candidates"] as const,
  selected: (bidSeq: number | null | undefined, workDutyId: string) => [...root, "selected", bidSeq ?? "none", workDutyId] as const,
  workOverlapDocuments: (bidSeq: number | null | undefined, loginId: string) => ["work-overlap-docs", "document-engineers", bidSeq ?? "none", loginId] as const,
  performance: (engineerId: string, conditions?: unknown) => [...root, "performance", engineerId, conditions ?? "all"] as const,
  workOverlap: (engineerId: string, params: { page: number; size: number; referenceDate: string; remainingDays: number }) => [...root, "work-overlap", engineerId, params] as const,
  conditionOptions: () => [...root, "condition-options"] as const,
  constructionTypes: () => [...root, "condition-construction-types"] as const,
  outlineCodes: () => [...root, "condition-outline-codes"] as const,
  generalConditionCodes: () => [...root, "condition-general-codes"] as const,
};
