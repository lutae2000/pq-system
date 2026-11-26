import { useQuery } from "@tanstack/react-query";
import { useAuthSession } from "@/lib/auth/useAuthSession";

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
  const employeeNo = useAuthSession()?.employeeNo ?? "";
  const companyPerformancesQuery = useQuery({
    queryKey: companyPerformanceDocumentsQueryKeys.performances(employeeNo, searchParams),
    queryFn: () => listCompanyPerformances(searchParams),
    enabled: enabled && canRead && Boolean(employeeNo && selectedBidSeq),
  });
  const documentTargetsQuery = useQuery({
    queryKey: companyPerformanceDocumentsQueryKeys.targets(employeeNo, selectedBidSeq),
    queryFn: () => listCompanyPerformanceDocumentTargets(selectedBidSeq ?? 0),
    enabled: enabled && canRead && Boolean(employeeNo && selectedBidSeq),
  });
  const detailQuery = useQuery({
    queryKey: companyPerformanceDocumentsQueryKeys.detail(selectedPerformanceSeq ?? 0),
    queryFn: () => getCompanyPerformance(selectedPerformanceSeq ?? 0),
    enabled: enabled && canRead && Boolean(selectedPerformanceSeq),
  });

  return { companyPerformancesQuery, detailQuery, documentTargetsQuery };
}
