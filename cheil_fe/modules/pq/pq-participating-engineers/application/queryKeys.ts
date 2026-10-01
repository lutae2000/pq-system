import type { PqParticipatingEngineerCandidateSearchParams } from "@/modules/pq/pq-participating-engineers/api";

const root = ["pq-participating-engineers"] as const;

export const pqParticipatingEngineerQueryKeys = {
  all: root,
  candidates: (params: PqParticipatingEngineerCandidateSearchParams, searchRevision: number) => [...root, "candidates", params, searchRevision] as const,
  candidatesRoot: () => [...root, "candidates"] as const,
  selected: (bidSeq: number | null | undefined, workDutyId: string) => [...root, "selected", bidSeq ?? "none", workDutyId] as const,
  workOverlapDocuments: (bidSeq: number | null | undefined, loginId: string) => ["work-overlap-docs", "document-engineers", bidSeq ?? "none", loginId] as const,
};
