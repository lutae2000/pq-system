import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getWorkOverlapContractSummary,
  listWorkOverlapContractEngineerCandidates,
  listWorkOverlapContracts,
  type WorkOverlapContractSearchParams,
  type WorkOverlapContractSummaryParams,
} from "@/modules/work-overlap/contracts/api";
import { workOverlapContractQueryKeys } from "@/modules/work-overlap/contracts/application/queryKeys";

export function useWorkOverlapContractQueries({
  enabled,
  searchParams,
  summaryParams,
  engineerKeyword,
}: {
  enabled: boolean;
  searchParams: WorkOverlapContractSearchParams;
  summaryParams: WorkOverlapContractSummaryParams;
  engineerKeyword: string;
}) {
  const contractsQuery = useQuery({
    queryKey: workOverlapContractQueryKeys.list(searchParams),
    queryFn: () => listWorkOverlapContracts(searchParams),
    enabled,
    placeholderData: keepPreviousData,
  });
  const summaryQuery = useQuery({
    queryKey: workOverlapContractQueryKeys.summary(summaryParams),
    queryFn: () => getWorkOverlapContractSummary(summaryParams),
    enabled,
    placeholderData: keepPreviousData,
  });
  const engineerCandidatesQuery = useQuery({
    queryKey: workOverlapContractQueryKeys.engineerCandidates(engineerKeyword),
    queryFn: () => listWorkOverlapContractEngineerCandidates({ keyword: engineerKeyword, limit: 30 }),
    enabled: enabled && engineerKeyword.length > 0,
  });
  return { contractsQuery, engineerCandidatesQuery, summaryQuery };
}
