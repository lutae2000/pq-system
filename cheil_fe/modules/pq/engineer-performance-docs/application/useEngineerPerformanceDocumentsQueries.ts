"use client";

import { useQuery } from "@tanstack/react-query";

import { listCertifications } from "@/modules/code/certifications/api";
import {
  listEngineerDocumentValueSettings,
  listEngineerProjectHistories,
  listEngineerProjectHistoryReviewResults,
} from "@/modules/pq/engineer-performance-docs/api";
import { engineerPerformanceDocumentsQueryKeys } from "@/modules/pq/engineer-performance-docs/application/queryKeys";
import { getEngineerProfile, listSelectedEngineerProfilesForBidNotice } from "@/modules/pq/engineers/api";

type Params = {
  activeEngineerId: string;
  bidSeq: number | null;
  keyword: string;
  tabQueryEnabled: boolean;
  workDutyId: string;
};

export function useEngineerPerformanceDocumentsQueries({
  activeEngineerId,
  bidSeq,
  keyword,
  tabQueryEnabled,
  workDutyId,
}: Params) {
  const engineersQuery = useQuery({
    queryKey: [...engineerPerformanceDocumentsQueryKeys.selectedEngineers(bidSeq, workDutyId), keyword],
    queryFn: () => listSelectedEngineerProfilesForBidNotice({ bidSeq: bidSeq ?? 0, workDutyId, keyword }),
    enabled: tabQueryEnabled && Boolean(bidSeq && workDutyId),
  });

  const documentValueSettingsQuery = useQuery({
    queryKey: engineerPerformanceDocumentsQueryKeys.documentValueSettings(bidSeq),
    queryFn: () => listEngineerDocumentValueSettings(bidSeq ?? 0),
    enabled: tabQueryEnabled && Boolean(bidSeq),
  });

  const certificationsQuery = useQuery({
    queryKey: ["code-certifications", "engineer-performance-docs"],
    queryFn: listCertifications,
    enabled: tabQueryEnabled && Boolean(bidSeq),
  });

  const activeEngineerProfileQuery = useQuery({
    queryKey: engineerPerformanceDocumentsQueryKeys.activeEngineerProfile(activeEngineerId),
    queryFn: () => getEngineerProfile(activeEngineerId),
    enabled: tabQueryEnabled && Boolean(activeEngineerId),
  });

  const projectHistoryRowsQuery = useQuery({
    queryKey: engineerPerformanceDocumentsQueryKeys.projectHistories(activeEngineerId),
    queryFn: () => listEngineerProjectHistories(activeEngineerId),
    enabled: tabQueryEnabled && Boolean(activeEngineerId),
  });

  const reviewRowsQuery = useQuery({
    queryKey: engineerPerformanceDocumentsQueryKeys.reviewResults(bidSeq, activeEngineerId),
    queryFn: () => listEngineerProjectHistoryReviewResults({ bidSeq: bidSeq ?? 0, engineerId: activeEngineerId }),
    enabled: tabQueryEnabled && Boolean(bidSeq) && Boolean(activeEngineerId),
  });

  return {
    activeEngineerProfileQuery,
    certificationsQuery,
    documentValueSettingsQuery,
    engineersQuery,
    projectHistoryRowsQuery,
    reviewRowsQuery,
  };
}
