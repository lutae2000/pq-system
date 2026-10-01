"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getNewTechnologyDevelopment,
  listNewTechnologyDevelopments,
  type NewTechnologyDevelopmentSearchParams,
} from "@/modules/pq/new-technology-developments/api";
import { newTechnologyDevelopmentQueryKeys } from "@/modules/pq/new-technology-developments/application/queryKeys";

export function useNewTechnologyDevelopmentQueries({
  enabled,
  searchParams,
  selectedId,
  scoreReferenceDate,
}: {
  enabled: boolean;
  searchParams: NewTechnologyDevelopmentSearchParams;
  selectedId: number;
  scoreReferenceDate: string;
}) {
  const developmentsQuery = useQuery({
    queryKey: newTechnologyDevelopmentQueryKeys.list(searchParams),
    queryFn: () => listNewTechnologyDevelopments(searchParams),
    enabled,
    placeholderData: keepPreviousData,
  });

  const detailQuery = useQuery({
    queryKey: newTechnologyDevelopmentQueryKeys.detail(selectedId, scoreReferenceDate),
    queryFn: () => getNewTechnologyDevelopment(selectedId, scoreReferenceDate),
    enabled: enabled && selectedId > 0,
  });

  return { detailQuery, developmentsQuery };
}
