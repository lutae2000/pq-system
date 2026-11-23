import { useQuery } from "@tanstack/react-query";

import { BID_NOTICE_PAGE_SIZE, getBidNotice, listBidNotices, type BidNoticeSearchParams } from "@/modules/pq/bid-notice/bidNoticeApi";
import { bidNoticeQueryKeys } from "@/modules/pq/bid-notice/application/queryKeys";
import { getImportedG2bBidNoticeCandidate } from "@/modules/pq/g2b-bid-notice-candidates/api";
import { toBidNoticeRecord } from "@/modules/pq/bid-notice/application/mapper";

export function useBidNoticeList(params: BidNoticeSearchParams, revision: number, enabled: boolean) {
  return useQuery({
    queryKey: bidNoticeQueryKeys.list(params, revision),
    queryFn: () => listBidNotices(params),
    enabled,
  });
}

export async function loadBidNoticesForPrint(params: BidNoticeSearchParams) {
  const printParams = { ...params, page: 0, size: BID_NOTICE_PAGE_SIZE };
  const firstPage = await listBidNotices(printParams);
  const records = [...firstPage.content];
  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await listBidNotices({ ...printParams, page });
    records.push(...result.content);
  }
  return records.map(toBidNoticeRecord);
}

export function useImportedBidNoticeAttachments(bidSeq: number, enabled: boolean) {
  return useQuery({
    queryKey: bidNoticeQueryKeys.importedAttachments(bidSeq),
    queryFn: () => getImportedG2bBidNoticeCandidate(bidSeq),
    enabled: enabled && bidSeq > 0,
    refetchOnMount: "always",
    staleTime: 0,
  });
}

export function useBidNoticeDetail(bidSeq: number | null, enabled: boolean) {
  return useQuery({
    queryKey: bidNoticeQueryKeys.detail(bidSeq ?? 0),
    queryFn: () => getBidNotice(bidSeq ?? 0),
    enabled: enabled && Boolean(bidSeq),
    refetchOnMount: "always",
    select: toBidNoticeRecord,
  });
}
