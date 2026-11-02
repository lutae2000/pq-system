import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  listConstructionProjectPerformances,
  type ConstructionProjectPerformanceSearchParams,
} from "@/modules/pq/construction-project-performances/api";
import { constructionProjectPerformanceQueryKeys } from "@/modules/pq/construction-project-performances/application/queryKeys";

export function useConstructionProjectPerformanceQueries({
  enabled,
  searchParams,
}: {
  enabled: boolean;
  searchParams: ConstructionProjectPerformanceSearchParams;
}) {
  const performancesQuery = useQuery({
    queryKey: constructionProjectPerformanceQueryKeys.list(searchParams),
    queryFn: () => listConstructionProjectPerformances(searchParams),
    enabled,
    placeholderData: keepPreviousData,
  });

  return { performancesQuery };
}
