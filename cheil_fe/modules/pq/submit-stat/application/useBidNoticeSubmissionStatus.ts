import { useQuery } from "@tanstack/react-query";

import { bidNoticeQueryKeys } from "@/modules/pq/bid-notice/application/queryKeys";
import { listBidNoticeSubmissionCounts } from "../api";
import type { SubmissionStatusFilters } from "../domain/submissionStatus";

export function useBidNoticeSubmissionStatus(filters: SubmissionStatusFilters, revision: number, enabled: boolean) {
  return useQuery({
    queryKey: [...bidNoticeQueryKeys.all, "submit-stat", filters, revision],
    queryFn: () => listBidNoticeSubmissionCounts(filters),
    enabled,
  });
}
