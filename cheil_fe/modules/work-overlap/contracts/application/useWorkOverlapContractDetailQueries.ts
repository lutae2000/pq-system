import { useQuery } from "@tanstack/react-query";

import {
  listWorkOverlapContractEngineerCandidates,
  listWorkOverlapContractEngineerHistories,
  listWorkOverlapContractEngineers,
  listWorkOverlapContractPeriodHistories,
} from "@/modules/work-overlap/contracts/api";
import { workOverlapContractQueryKeys } from "@/modules/work-overlap/contracts/application/queryKeys";

export function useWorkOverlapContractDetailQueries({
  canRead,
  contractNo,
  enabled,
  engineerKeyword,
}: {
  canRead: boolean;
  contractNo: string;
  enabled: boolean;
  engineerKeyword: string;
}) {
  const engineersQuery = useQuery({
    queryKey: workOverlapContractQueryKeys.engineers(contractNo),
    queryFn: () => listWorkOverlapContractEngineers(contractNo),
    enabled: enabled && canRead && Boolean(contractNo),
  });
  const historiesQuery = useQuery({
    queryKey: workOverlapContractQueryKeys.engineerHistories(contractNo),
    queryFn: () => listWorkOverlapContractEngineerHistories(contractNo),
    enabled: enabled && canRead && Boolean(contractNo),
  });
  const periodHistoriesQuery = useQuery({
    queryKey: workOverlapContractQueryKeys.periodHistories(contractNo),
    queryFn: () => listWorkOverlapContractPeriodHistories(contractNo),
    enabled: enabled && canRead && Boolean(contractNo),
  });
  const engineerCandidatesQuery = useQuery({
    queryKey: workOverlapContractQueryKeys.engineerCandidates(engineerKeyword),
    queryFn: () =>
      listWorkOverlapContractEngineerCandidates({ keyword: engineerKeyword, limit: 30 }),
    enabled: enabled && canRead && engineerKeyword.length > 0,
  });

  return {
    engineerCandidatesQuery,
    engineersQuery,
    historiesQuery,
    periodHistoriesQuery,
  };
}
