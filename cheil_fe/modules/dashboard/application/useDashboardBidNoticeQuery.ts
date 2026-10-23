"use client";

import { useQuery } from "@tanstack/react-query";

import { getBidNotice } from "@/modules/pq/bid-notice/bidNoticeApi";
import { dashboardQueryKeys } from "@/modules/dashboard/application/queryKeys";

export function useDashboardBidNoticeQuery(enabled: boolean, bidSeq: number | undefined) {
  return useQuery({
    queryKey: dashboardQueryKeys.bidNoticeDetail(bidSeq),
    queryFn: () => getBidNotice(bidSeq ?? 0),
    enabled: enabled && Boolean(bidSeq),
  });
}
