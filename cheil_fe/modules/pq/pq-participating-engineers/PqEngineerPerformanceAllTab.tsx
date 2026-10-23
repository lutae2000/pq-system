"use client";

import { useMemo } from "react";

import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { usePqEngineerPerformanceQuery } from "@/modules/pq/pq-participating-engineers/application/usePqEngineerRelatedQueries";
import { createEngineerHistoryPerformanceColumns, PqEngineerPerformanceGrid } from "./PqEngineerPerformanceGrid";

export function PqEngineerPerformanceAllTab({ canRead, defaultPageSize, engineerId, gridHeight }: { canRead: boolean; defaultPageSize: number; engineerId: string; gridHeight: number }) {
  const jobClass = useCommonCodeLevel3Options("PQ", "DA", { useYn: "Y" }, { enabled: canRead });
  const grade = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: canRead });
  const query = usePqEngineerPerformanceQuery({ canRead, engineerId });
  const columns = useMemo(() => createEngineerHistoryPerformanceColumns(jobClass.labelByValue, grade.labelByValue), [grade.labelByValue, jobClass.labelByValue]);
  return <PqEngineerPerformanceGrid key={`${engineerId}:${defaultPageSize}`} columns={columns} defaultPageSize={defaultPageSize} gridHeight={gridHeight} loading={query.isFetching} rows={query.data ?? []} />;
}
