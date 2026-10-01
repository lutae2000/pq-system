import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  listServicePerformances,
  type ServicePerformancePageResponse,
  type ServicePerformanceSearchParams,
} from "@/modules/pq/service-performance-management/api";
import { servicePerformanceQueryKeys } from "@/modules/pq/service-performance-management/application/queryKeys";

export function useServicePerformanceQueries({
  enabled,
  params,
}: {
  enabled: boolean;
  params: ServicePerformanceSearchParams;
}) {
  return useQuery<ServicePerformancePageResponse>({
    queryKey: servicePerformanceQueryKeys.list(params),
    queryFn: () => listServicePerformances(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}
