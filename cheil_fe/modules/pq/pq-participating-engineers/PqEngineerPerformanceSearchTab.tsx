"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { listEngineerProjectHistories } from "@/modules/pq/engineer-performance-docs/api";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import { createEngineerHistoryPerformanceColumns, PqEngineerPerformanceGrid } from "./PqEngineerPerformanceGrid";

export function PqEngineerPerformanceSearchTab({ canRead, engineerId, conditions, gridHeight }: { canRead: boolean; engineerId: string; conditions: RelatedProjectHistoryCondition[]; gridHeight: number }) {
  const jobClass = useCommonCodeLevel3Options("PQ", "DA", { useYn: "Y" }, { enabled: canRead });
  const grade = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: canRead });
  const query = useQuery({ queryKey: ["pq-engineer-performance", "search", engineerId, conditions], queryFn: () => listEngineerProjectHistories({ engineerId, relatedProjectHistoryConditions: conditions }), enabled: canRead });
  const columns = useMemo(() => createEngineerHistoryPerformanceColumns(jobClass.labelByValue, grade.labelByValue), [grade.labelByValue, jobClass.labelByValue]);
  return <PqEngineerPerformanceGrid columns={columns} gridHeight={gridHeight} loading={query.isFetching} rows={query.data ?? []} />;
}
