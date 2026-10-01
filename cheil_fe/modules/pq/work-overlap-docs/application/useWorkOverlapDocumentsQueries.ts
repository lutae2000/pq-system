import { useQuery } from "@tanstack/react-query";

import { getEngineerProfile } from "@/modules/pq/engineers/api";
import {
  listWorkOverlapDocumentEngineerContracts,
  listWorkOverlapDocumentEngineers,
} from "@/modules/work-overlap/engineers/api";
import { workOverlapDocumentsQueryKeys } from "@/modules/pq/work-overlap-docs/application/queryKeys";

export function useWorkOverlapDocumentsQueries({
  activeEngineerId,
  bidSeq,
  canRead,
  contractPage,
  contractPageSize,
  enabled,
  keyword,
  referenceDate,
  remainingDays,
  workDutyId,
}: {
  activeEngineerId: string;
  bidSeq: number | null | undefined;
  canRead: boolean;
  contractPage: number;
  contractPageSize: number;
  enabled: boolean;
  keyword: string;
  referenceDate: string;
  remainingDays: string;
  workDutyId: string;
}) {
  const targetEngineersQuery = useQuery({
    queryKey: workOverlapDocumentsQueryKeys.engineers(bidSeq, workDutyId, keyword.trim()),
    queryFn: () => listWorkOverlapDocumentEngineers(bidSeq ?? 0, workDutyId, keyword),
    enabled: enabled && canRead && Boolean(bidSeq && workDutyId),
  });
  const activeEngineerContractsQuery = useQuery({
    queryKey: workOverlapDocumentsQueryKeys.contracts({
      activeEngineerId,
      bidSeq,
      contractPage,
      contractPageSize,
      referenceDate,
      remainingDays,
      workDutyId,
    }),
    queryFn: () => listWorkOverlapDocumentEngineerContracts(activeEngineerId, bidSeq ?? 0, {
      page: contractPage,
      size: contractPageSize,
      referenceDate,
      remainingDays: Number(remainingDays) || 1,
      workDutyId,
    }),
    enabled: enabled && canRead && Boolean(bidSeq && workDutyId && activeEngineerId),
  });
  const activeEngineerQuery = useQuery({
    queryKey: workOverlapDocumentsQueryKeys.engineerProfile(activeEngineerId),
    queryFn: () => getEngineerProfile(activeEngineerId),
    enabled: enabled && canRead && Boolean(activeEngineerId),
  });

  return { activeEngineerContractsQuery, activeEngineerQuery, targetEngineersQuery };
}
