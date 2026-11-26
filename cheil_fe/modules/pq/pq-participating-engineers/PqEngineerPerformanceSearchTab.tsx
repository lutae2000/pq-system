"use client";

import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { usePqEngineerPerformanceQuery } from "@/modules/pq/pq-participating-engineers/application/usePqEngineerRelatedQueries";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import { PqEngineerPerformanceGrid } from "./PqEngineerPerformanceGrid";

export function PqEngineerPerformanceSearchTab({ canRead, engineerId, conditions, gridHeight }: { canRead: boolean; engineerId: string; conditions: RelatedProjectHistoryCondition[]; gridHeight: number }) {
  const jobClass = useCommonCodeLevel3Options("PQ", "DA", { useYn: "Y" }, { enabled: canRead });
  const hasConditions = conditions.length > 0;
  const query = usePqEngineerPerformanceQuery({ canRead, engineerId, conditions: hasConditions ? conditions : undefined });
  const allHistoryQuery = usePqEngineerPerformanceQuery({ canRead: canRead && hasConditions && Boolean(query.data?.length), engineerId });

  return (
    <PqEngineerPerformanceGrid
      key={`${engineerId}:${JSON.stringify(conditions)}`}
      jobClassLabelByCode={jobClass.labelByValue}
      gridHeight={gridHeight}
      loading={query.isFetching || (hasConditions && allHistoryQuery.isFetching)}
      rows={query.data ?? []}
      participationRows={(hasConditions ? allHistoryQuery.data : query.data) ?? []}
    />
  );
}
