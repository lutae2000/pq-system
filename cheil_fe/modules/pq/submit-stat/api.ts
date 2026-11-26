import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { SubmissionCount, SubmissionStatusFilters } from "./domain/submissionStatus";

export function listBidNoticeSubmissionCounts(params: SubmissionStatusFilters): Promise<SubmissionCount[]> {
  return apiRequest(
    apiClient.get<SubmissionCount[]>("/pq/submit-stat", { params }),
    "PQ 제출 현황을 불러오지 못했습니다.",
  );
}
