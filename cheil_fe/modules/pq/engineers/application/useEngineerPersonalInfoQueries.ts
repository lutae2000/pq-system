import { useQuery } from "@tanstack/react-query";

import { listCertifications } from "@/modules/code/certifications/api";
import { engineerPersonalInfoQueryKeys } from "@/modules/pq/engineers/application/queryKeys";
import {
  getEngineerProfile,
  listEngineerProfiles,
  type EngineerProfileListFilters,
} from "@/modules/pq/engineers/api";

type Params = {
  activeEngineerIsNew: boolean;
  activeEngineerId: string;
  filters: EngineerProfileListFilters;
  tabQueryEnabled: boolean;
};

export function useEngineerPersonalInfoQueries({ activeEngineerId, activeEngineerIsNew, filters, tabQueryEnabled }: Params) {
  const certificationsQuery = useQuery({
    queryKey: engineerPersonalInfoQueryKeys.certifications,
    queryFn: listCertifications,
    enabled: tabQueryEnabled,
  });

  const engineersQuery = useQuery({
    queryKey: engineerPersonalInfoQueryKeys.profiles(filters),
    queryFn: () => listEngineerProfiles(filters),
    enabled: tabQueryEnabled,
  });

  const selectedEngineerDetailQuery = useQuery({
    queryKey: engineerPersonalInfoQueryKeys.profile(activeEngineerId),
    queryFn: () => getEngineerProfile(activeEngineerId),
    enabled: tabQueryEnabled && Boolean(activeEngineerId) && !activeEngineerIsNew,
  });

  return {
    certificationsQuery,
    engineersQuery,
    selectedEngineerDetailQuery,
  };
}
