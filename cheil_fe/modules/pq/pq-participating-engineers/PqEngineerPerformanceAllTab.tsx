"use client";

import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { usePqEngineerPerformanceQuery } from "@/modules/pq/pq-participating-engineers/application/usePqEngineerRelatedQueries";
import { PqEngineerPerformanceGrid } from "./PqEngineerPerformanceGrid";

export function PqEngineerPerformanceAllTab({ canRead, engineerId, gridHeight }: { canRead: boolean; engineerId: string; gridHeight: number }) {
  const jobClass = useCommonCodeLevel3Options("PQ", "DA", { useYn: "Y" }, { enabled: canRead });
  const query = usePqEngineerPerformanceQuery({ canRead, engineerId });
  return <PqEngineerPerformanceGrid key={engineerId} jobClassLabelByCode={jobClass.labelByValue} gridHeight={gridHeight} loading={query.isFetching} rows={query.data ?? []} />;
}
