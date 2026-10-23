import type { G2bBidNoticeCandidateSearchParams } from "@/modules/pq/g2b-bid-notice-candidates/api";

const root = ["g2b-bid-notice-candidates"] as const;

export const g2bBidNoticeCandidateQueryKeys = {
  all: root,
  list: (params: G2bBidNoticeCandidateSearchParams) => [...root, "list", params] as const,
  syncStatus: () => [...root, "sync-status"] as const,
} as const;
