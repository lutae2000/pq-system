import type { EngineerProfileListFilters } from "@/modules/pq/engineers/api";

export const workOverlapEngineerQueryKeys = {
  all: ["work-overlap", "engineers"] as const,
  profiles: (filters: EngineerProfileListFilters) => ["work-overlap", "engineers", "profiles", filters] as const,
  contracts: (params: {
    engineerId: string;
    excludeCompleted: boolean;
    referenceDate: string;
    remainingDays: number;
    page: number;
    size: number;
  }) => ["work-overlap", "engineers", "contracts", params] as const,
};
