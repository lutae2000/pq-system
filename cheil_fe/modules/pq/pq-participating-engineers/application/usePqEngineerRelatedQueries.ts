"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listCommonCodes } from "@/modules/code/common-codes/api";
import { listConstructionTypes } from "@/modules/code/construction-types/api";
import { pqParticipatingEngineerQueryKeys } from "@/modules/pq/pq-participating-engineers/application/queryKeys";
import { listRelatedProjectHistoryConditionOptions } from "@/modules/pq/pq-participating-engineers/api";
import type { PqParticipatingEngineerProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/api";
import { listEngineerProjectHistories } from "@/modules/pq/engineer-performance-docs/api";
import { listWorkOverlapEngineerContracts } from "@/modules/work-overlap/engineers/api";

export function usePqEngineerPerformanceQuery({
  canRead,
  conditions,
  engineerId,
}: {
  canRead: boolean;
  conditions?: Array<PqParticipatingEngineerProjectHistoryCondition & { id: string }>;
  engineerId: string;
}) {
  return useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.performance(engineerId, conditions),
    queryFn: () => listEngineerProjectHistories(conditions ? { engineerId, relatedProjectHistoryConditions: conditions } : engineerId),
    enabled: canRead && Boolean(engineerId),
  });
}

export function usePqEngineerWorkOverlapQuery({
  canRead,
  engineerId,
  page,
  referenceDate,
  remainingDays,
  size,
}: {
  canRead: boolean;
  engineerId: string;
  page: number;
  referenceDate: string;
  remainingDays: number;
  size: number;
}) {
  const params = { page, referenceDate, remainingDays, size };
  return useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.workOverlap(engineerId, params),
    queryFn: () => listWorkOverlapEngineerContracts(engineerId, params),
    enabled: canRead && Boolean(engineerId),
    placeholderData: keepPreviousData,
  });
}

export function useRelatedProjectHistoryConditionQueries(enabled: boolean) {
  const constructionTypes = useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.constructionTypes(),
    queryFn: () => listConstructionTypes({ useYn: "Y" }),
    enabled,
  });
  const outlineCodes = useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.outlineCodes(),
    queryFn: () => listCommonCodes({ level1Code: "PQCT", level2CodePrefix: "Z", useYn: "Y", sort: "level3Code" }),
    enabled,
  });
  const generalConditions = useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.generalConditionCodes(),
    queryFn: () => listCommonCodes({ level1Code: "PQCT", level2CodePrefix: "C", level3Code: "C1", sort: "level3Code" }),
    enabled,
  });
  const conditionOptions = useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.conditionOptions(),
    queryFn: listRelatedProjectHistoryConditionOptions,
    enabled,
  });

  return { constructionTypes, conditionOptions, generalConditions, outlineCodes };
}
