"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listQualificationReviewAgencies, listQualificationReviewCriteria, listQualificationScoreBands } from "@/modules/bid/qualification-criteria/api";
import { qualificationCriteriaQueryKeys } from "@/modules/bid/qualification-criteria/application/queryKeys";

const staleTime = 5 * 60 * 1000;
export function useQualificationCriteriaAgencyQuery(enabled: boolean, keyword: string, useYn: boolean | undefined) {
  return useQuery({ queryKey: qualificationCriteriaQueryKeys.agencies(keyword, useYn), queryFn: () => listQualificationReviewAgencies({ keyword: keyword || undefined, useYn }), enabled, placeholderData: keepPreviousData, staleTime });
}

export function useQualificationCriteriaListQuery(enabled: boolean, agencyId: number | null, keyword: string, useYn: boolean | undefined) {
  return useQuery({ queryKey: qualificationCriteriaQueryKeys.criteria(agencyId, keyword, useYn), queryFn: () => listQualificationReviewCriteria(agencyId as number, { keyword: keyword || undefined, useYn }), enabled: enabled && Boolean(agencyId && agencyId > 0), placeholderData: keepPreviousData, staleTime });
}

export function useQualificationScoreBandsQuery(enabled: boolean, criterionId: number | null) {
  return useQuery({ queryKey: qualificationCriteriaQueryKeys.scoreBands(criterionId), queryFn: () => listQualificationScoreBands(criterionId as number), enabled: enabled && Boolean(criterionId && criterionId > 0), placeholderData: keepPreviousData, staleTime });
}
