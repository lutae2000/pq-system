"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  listPqParticipatingEngineerCandidates,
  listPqParticipatingEngineers,
  type PqParticipatingEngineerCandidate,
  type PqParticipatingEngineerCandidateSearchParams,
  type PqParticipatingEngineerCandidatePage,
  type PqParticipatingEngineerProjectHistoryCondition,
} from "@/modules/pq/pq-participating-engineers/api";
import { pqParticipatingEngineerQueryKeys } from "@/modules/pq/pq-participating-engineers/application/queryKeys";

type UsePqParticipatingEngineerQueriesParams = {
  appliedFilters: {
    certificationCode: string;
    constructionManagementGrade: string;
    designGrade: string;
    jobField: string;
    keyword: string;
    relatedProjectHistoryConditions: PqParticipatingEngineerProjectHistoryCondition[];
    specialtyField: string;
  };
  bidSeq?: number;
  candidatePage: number;
  candidatePageSize: number;
  candidateSearchRevision: number;
  enabled: boolean;
  retireYn?: "Y" | "N";
  workDutyId: string;
};

export function usePqParticipatingEngineerQueries({
  appliedFilters,
  bidSeq,
  candidatePage,
  candidatePageSize,
  candidateSearchRevision,
  enabled,
  retireYn,
  workDutyId,
}: UsePqParticipatingEngineerQueriesParams) {
  const candidateQueryFilters = useMemo<PqParticipatingEngineerCandidateSearchParams>(
    () => ({
      bidSeq,
      certificationName: appliedFilters.certificationCode || undefined,
      constructionManagementGrade: appliedFilters.constructionManagementGrade || undefined,
      designGrade: appliedFilters.designGrade || undefined,
      jobField: appliedFilters.jobField || undefined,
      keyword: appliedFilters.keyword.trim() || undefined,
      page: candidatePage,
      projectHistoryConditions: appliedFilters.relatedProjectHistoryConditions,
      retireYn,
      size: candidatePageSize,
      specialtyField: appliedFilters.specialtyField || undefined,
      workDutyId: workDutyId || undefined,
    }),
    [appliedFilters, bidSeq, candidatePage, candidatePageSize, retireYn, workDutyId],
  );

  const candidatesQuery = useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.candidates(candidateQueryFilters, candidateSearchRevision),
    queryFn: () => listPqParticipatingEngineerCandidates(candidateQueryFilters),
    enabled: enabled && Boolean(bidSeq),
    placeholderData: keepPreviousData,
  });

  const selectedEngineersQuery = useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.selected(bidSeq, workDutyId),
    queryFn: () => listPqParticipatingEngineers({ bidSeq: bidSeq ?? 0, workDutyId }),
    enabled: enabled && Boolean(bidSeq),
  });

  const emptyCandidatePage = useMemo<PqParticipatingEngineerCandidatePage>(
    () => ({
      content: [] as PqParticipatingEngineerCandidate[],
      first: true,
      last: true,
      page: candidatePage,
      size: candidatePageSize,
      totalElements: 0,
      totalPages: 0,
    }),
    [candidatePage, candidatePageSize],
  );
  const candidatesPage = candidatesQuery.data ?? emptyCandidatePage;

  return {
    candidates: candidatesPage.content,
    candidatesPage,
    candidatesQuery,
    candidateQueryFilters,
    selectedEngineersQuery,
  };
}
