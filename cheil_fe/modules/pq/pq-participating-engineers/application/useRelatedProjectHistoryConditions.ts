"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { readAuthSessionSnapshot } from "@/lib/auth/authSession";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import { getRelatedProjectHistoryConditions, saveRelatedProjectHistoryConditions } from "../api";
import type { PqParticipatingEngineerProjectHistoryCondition, RelatedProjectHistoryCondition } from "../domain/projectHistoryCondition";
import { pqParticipatingEngineerQueryKeys } from "./queryKeys";

const emptyConditions: RelatedProjectHistoryCondition[] = [];

const withConditionIds = (conditions: PqParticipatingEngineerProjectHistoryCondition[]): RelatedProjectHistoryCondition[] =>
  conditions.map((condition, index) => ({ ...condition, id: `saved-condition-${index}` }));

function requireAccessToken(employeeNo: string) {
  const session = readAuthSessionSnapshot();
  if (!session?.accessToken || session.employeeNo !== employeeNo) {
    throw new Error("로그인 계정을 확인한 뒤 다시 시도해 주세요.");
  }
  return session.accessToken;
}

export function useRelatedProjectHistoryConditions(bidSeq: number | null | undefined, enabled: boolean) {
  const employeeNo = useAuthSession()?.employeeNo ?? "";
  const query = useQuery({
    queryKey: pqParticipatingEngineerQueryKeys.savedConditions(employeeNo, bidSeq),
    queryFn: ({ signal }) => {
      if (!bidSeq) throw new Error("공고문을 먼저 선택해 주세요.");
      return getRelatedProjectHistoryConditions(bidSeq, requireAccessToken(employeeNo), signal);
    },
    select: withConditionIds,
    enabled: enabled && Boolean(employeeNo && bidSeq),
  });

  return {
    bidSeq,
    conditions: query.data ?? emptyConditions,
    employeeNo,
    loaded: query.data !== undefined,
    loadError: query.error,
    loading: query.isFetching,
    reload: query.refetch,
  };
}

export type RelatedProjectHistoryConditionsSettings = ReturnType<typeof useRelatedProjectHistoryConditions>;

export function useSaveRelatedProjectHistoryConditions({ bidSeq, employeeNo }: RelatedProjectHistoryConditionsSettings) {
  const queryClient = useQueryClient();
  const queryKey = pqParticipatingEngineerQueryKeys.savedConditions(employeeNo, bidSeq);

  return useMutation({
    mutationFn: (conditions: RelatedProjectHistoryCondition[]) => {
      if (!bidSeq) throw new Error("공고문을 먼저 선택해 주세요.");
      const accessToken = requireAccessToken(employeeNo);
      return saveRelatedProjectHistoryConditions({ accessToken, bidSeq, conditions });
    },
    onSuccess: async (conditions) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      if (readAuthSessionSnapshot()?.employeeNo === employeeNo) {
        queryClient.setQueryData(queryKey, conditions);
      }
    },
  });
}
