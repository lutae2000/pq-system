import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useTabActivity } from "@/components/layout/TabActivityContext";
import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { listEngineerProfiles, type EngineerProfileListFilters } from "@/modules/pq/engineers/api";
import {
  listWorkOverlapEngineerContracts,
  type WorkOverlapEngineerContractPageResponse,
} from "@/modules/work-overlap/engineers/api";

import { workOverlapEngineerQueryKeys } from "./queryKeys";

type UseWorkOverlapEngineerListQueriesParams = {
  canRead: boolean;
  engineerFilters: EngineerProfileListFilters;
  selectedEngineerId: string;
  referenceDate: string;
  remainingDays: number;
  excludeCompleted: boolean;
  contractPage: number;
  contractPageSize: number;
  contractsEnabled: boolean;
};

const EMPTY_CONTRACTS: WorkOverlapEngineerContractPageResponse = {
  content: [],
  page: 0,
  size: 0,
  totalElements: 0,
  totalPages: 0,
};

export function useWorkOverlapEngineerListQueries({
  canRead,
  engineerFilters,
  selectedEngineerId,
  referenceDate,
  remainingDays,
  excludeCompleted,
  contractPage,
  contractPageSize,
  contractsEnabled,
}: UseWorkOverlapEngineerListQueriesParams) {
  const isTabActive = useTabActivity();
  const queryEnabled = canRead && isTabActive;

  const engineerProfilesQuery = useQuery({
    queryKey: workOverlapEngineerQueryKeys.profiles(engineerFilters),
    queryFn: () => listEngineerProfiles(engineerFilters),
    enabled: queryEnabled,
  });

  const jobFieldReferencesQuery = useCommonCodeLevel3Options(
    "PQ",
    "QA",
    { useYn: "Y" },
    { enabled: queryEnabled },
  );
  const specialtyFieldReferencesQuery = useCommonCodeLevel3Options(
    "PQ",
    "PA",
    { useYn: "Y" },
    { enabled: queryEnabled },
  );

  const contractsQuery = useQuery({
    queryKey: workOverlapEngineerQueryKeys.contracts({
      engineerId: selectedEngineerId,
      excludeCompleted,
      referenceDate,
      remainingDays,
      page: contractPage,
      size: contractPageSize,
    }),
    queryFn: () =>
      selectedEngineerId
        ? listWorkOverlapEngineerContracts(selectedEngineerId, {
            excludeCompleted,
            page: contractPage,
            referenceDate,
            remainingDays,
            size: contractPageSize,
          })
        : Promise.resolve(EMPTY_CONTRACTS),
    enabled: queryEnabled && contractsEnabled && Boolean(selectedEngineerId),
    placeholderData: keepPreviousData,
  });

  return {
    isTabActive,
    engineerProfilesQuery,
    jobFieldReferencesQuery,
    specialtyFieldReferencesQuery,
    contractsQuery,
  };
}
