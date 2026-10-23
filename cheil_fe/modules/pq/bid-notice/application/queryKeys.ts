import type { BidNoticeSearchParams } from "@/modules/pq/bid-notice/bidNoticeApi";

const root = ["bid-notices"] as const;

export const bidNoticeQueryKeys = {
  all: root,
  list: (params: BidNoticeSearchParams, revision: number) => [...root, "list", params, revision] as const,
  detail: (bidSeq: number) => [...root, "detail", bidSeq] as const,
  importedAttachments: (bidSeq: number) => ["g2b-bid-notice-candidate-imported-attachments", bidSeq] as const,
  attachments: (bidSeq: number) => ["file-attachments", "BID_NOTICE", String(bidSeq)] as const,
} as const;
