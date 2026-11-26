import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { bidNoticeQueryKeys } from "@/modules/pq/bid-notice/application/queryKeys";
import { BID_NOTICE_PAGE_SIZE } from "@/modules/pq/bid-notice/bidNoticeApi";
import { listBidNoticeSubmissionCounts, listBidNoticeSubmissionDetails } from "../api";
import type { SubmissionDetailFilters, SubmissionStatusFilters } from "../domain/submissionStatus";

export function useBidNoticeSubmissionStatus(filters: SubmissionStatusFilters, revision: number, enabled: boolean) {
  return useQuery({
    queryKey: [...bidNoticeQueryKeys.all, "submit-stat", filters, revision],
    queryFn: () => listBidNoticeSubmissionCounts(filters),
    enabled,
  });
}

export async function loadBidNoticeSubmissionDetailsForExport(filters: SubmissionDetailFilters) {
  const firstPage = await listBidNoticeSubmissionDetails(filters, 0, BID_NOTICE_PAGE_SIZE);
  const notices = [...firstPage.content];
  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await listBidNoticeSubmissionDetails(filters, page, BID_NOTICE_PAGE_SIZE);
    notices.push(...result.content);
  }

  if (new Set(notices.map((notice) => notice.bidSeq)).size !== firstPage.totalElements || notices.length !== firstPage.totalElements) {
    throw new Error("다운로드 중 제출 목록이 변경되었습니다. 다시 시도해 주세요.");
  }
  return notices;
}

export function useBidNoticeSubmissionDetails(filters: SubmissionDetailFilters, page: number, size: number, enabled: boolean) {
  return useQuery({
    queryKey: [...bidNoticeQueryKeys.all, "submit-stat", "details", filters, page, size],
    queryFn: () => listBidNoticeSubmissionDetails(filters, page, size),
    enabled,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });
}
