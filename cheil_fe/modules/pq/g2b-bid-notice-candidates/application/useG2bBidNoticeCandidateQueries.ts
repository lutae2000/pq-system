"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listG2bBidNoticeCandidates, type G2bBidNoticeCandidateSearchParams } from "@/modules/pq/g2b-bid-notice-candidates/api";
import { g2bBidNoticeCandidateQueryKeys } from "@/modules/pq/g2b-bid-notice-candidates/application/queryKeys";

export function useG2bBidNoticeCandidateQueries({
  enabled,
  searchParams,
}: {
  enabled: boolean;
  searchParams: G2bBidNoticeCandidateSearchParams;
}) {
  return useQuery({
    queryKey: g2bBidNoticeCandidateQueryKeys.list(searchParams),
    queryFn: () => listG2bBidNoticeCandidates(searchParams),
    enabled,
    placeholderData: keepPreviousData,
  });
}
