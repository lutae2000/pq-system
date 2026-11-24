import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  listCompanyPerformanceContractPeriods,
  listCompanyPerformances,
  type CompanyPerformanceSearchParams,
} from "@/modules/pq/company-performance/api";
import { companyPerformanceQueryKeys } from "@/modules/pq/company-performance/application/queryKeys";

export function useCompanyPerformanceContractPeriods(seq: number) {
  return useQuery({
    queryKey: companyPerformanceQueryKeys.contractPeriods(seq),
    queryFn: () => listCompanyPerformanceContractPeriods(seq),
    enabled: Boolean(seq),
  });
}

export function useCompanyPerformanceQueries({
  enabled,
  searchParams,
}: {
  enabled: boolean;
  searchParams: CompanyPerformanceSearchParams;
}) {
  const companyPerformancesQuery = useQuery({
    queryKey: companyPerformanceQueryKeys.list(searchParams),
    queryFn: () => listCompanyPerformances(searchParams),
    enabled,
    placeholderData: keepPreviousData,
  });

  return { companyPerformancesQuery };
}
