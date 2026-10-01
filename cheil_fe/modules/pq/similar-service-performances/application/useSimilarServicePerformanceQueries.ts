import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  listSimilarServicePerformances,
  type SimilarServicePerformanceSearchParams,
} from "@/modules/pq/similar-service-performances/api";
import { similarServicePerformanceQueryKeys } from "@/modules/pq/similar-service-performances/application/queryKeys";

export function useSimilarServicePerformanceQueries({
  enabled,
  searchParams,
}: {
  enabled: boolean;
  searchParams: SimilarServicePerformanceSearchParams;
}) {
  const performancesQuery = useQuery({
    queryKey: similarServicePerformanceQueryKeys.list(searchParams),
    queryFn: () => listSimilarServicePerformances(searchParams),
    enabled,
    placeholderData: keepPreviousData,
  });

  return { performancesQuery };
}
