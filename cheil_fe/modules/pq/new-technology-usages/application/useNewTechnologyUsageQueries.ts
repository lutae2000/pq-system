"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getNewTechnologyUsage,
  listNewTechnologyUsages,
  type NewTechnologyUsageSearchParams,
} from "@/modules/pq/new-technology-usages/api";
import { newTechnologyUsageQueryKeys } from "@/modules/pq/new-technology-usages/application/queryKeys";

export function useNewTechnologyUsageQueries({
  enabled,
  searchParams,
  selectedId,
}: {
  enabled: boolean;
  searchParams: NewTechnologyUsageSearchParams;
  selectedId: number;
}) {
  const usagesQuery = useQuery({
    queryKey: newTechnologyUsageQueryKeys.list(searchParams),
    queryFn: () => listNewTechnologyUsages(searchParams),
    enabled,
    placeholderData: keepPreviousData,
  });

  const detailQuery = useQuery({
    queryKey: newTechnologyUsageQueryKeys.detail(selectedId),
    queryFn: () => getNewTechnologyUsage(selectedId),
    enabled: enabled && selectedId > 0,
  });

  return { detailQuery, usagesQuery };
}
