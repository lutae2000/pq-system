import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getCompanyPerformance,
  listCompanyPerformanceDocumentTargets,
  listCompanyPerformances,
  type CompanyPerformanceSearchParams,
} from "@/modules/pq/company-performance/api";
import { companyPerformanceDocumentsQueryKeys } from "@/modules/pq/company-performance-docs/application/queryKeys";

export function useCompanyPerformanceDocumentsQueries({
  canRead,
  enabled,
  searchParams,
  selectedBidSeq,
  selectedPerformanceSeq,
}: {
  canRead: boolean;
  enabled: boolean;
  searchParams: CompanyPerformanceSearchParams;
  selectedBidSeq: number | null | undefined;
  selectedPerformanceSeq: number | null;
}) {
  const companyPerformancesQuery = useQuery({
    queryKey: companyPerformanceDocumentsQueryKeys.performances(searchParams),
    queryFn: () => listCompanyPerformances(searchParams),
    enabled: enabled && canRead && Boolean(selectedBidSeq),
    placeholderData: keepPreviousData,
  });
  const documentTargetsQuery = useQuery({
    queryKey: companyPerformanceDocumentsQueryKeys.targets(selectedBidSeq),
    queryFn: () => listCompanyPerformanceDocumentTargets(selectedBidSeq ?? 0),
    enabled: enabled && canRead && Boolean(selectedBidSeq),
  });
  const detailQuery = useQuery({
    queryKey: companyPerformanceDocumentsQueryKeys.detail(selectedPerformanceSeq ?? 0),
    queryFn: () => getCompanyPerformance(selectedPerformanceSeq ?? 0),
    enabled: enabled && canRead && Boolean(selectedPerformanceSeq),
  });

  return { companyPerformancesQuery, detailQuery, documentTargetsQuery };
}
