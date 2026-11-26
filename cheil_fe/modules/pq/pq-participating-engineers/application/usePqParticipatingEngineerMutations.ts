"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deletePqParticipatingEngineer,
  replacePqParticipatingEngineers,
  type PqParticipatingEngineerRecord,
  type ReplacePqParticipatingEngineersRequest,
} from "@/modules/pq/pq-participating-engineers/api";
import type { SelectedPqEngineer } from "@/modules/pq/pq-participating-engineers/domain/models";
import { pqParticipatingEngineerQueryKeys } from "@/modules/pq/pq-participating-engineers/application/queryKeys";
import { deleteWorkOverlapDocumentEngineer, replaceWorkOverlapDocumentEngineers } from "@/modules/work-overlap/engineers/api";

type UsePqParticipatingEngineerMutationsParams = {
  bidSeq: number | null;
  currentEmployeeNo: string;
  onError: (error: unknown) => void;
  onRemoved: (engineerIds: string[]) => void;
  onSaved: (records: PqParticipatingEngineerRecord[]) => void;
  selectedEngineers: SelectedPqEngineer[];
  workDutyId: string;
};

export function usePqParticipatingEngineerMutations({
  bidSeq,
  currentEmployeeNo,
  onError,
  onRemoved,
  onSaved,
  selectedEngineers,
  workDutyId,
}: UsePqParticipatingEngineerMutationsParams) {
  const queryClient = useQueryClient();

  const replaceSelection = async (engineers: ReplacePqParticipatingEngineersRequest["engineers"]) => {
    if (!bidSeq) throw new Error("PQ참여할 공고문을 먼저 선택하세요.");
    if (!workDutyId) throw new Error("로그인 작업자 정보를 확인할 수 없습니다.");
    const [records] = await Promise.all([
      replacePqParticipatingEngineers({ bidSeq, workDutyId, engineers }),
      replaceWorkOverlapDocumentEngineers({
        bidSeq,
        workDutyId: currentEmployeeNo,
        engineers: engineers.map((engineer) => ({ engrId: engineer.engrId, displayOrder: engineer.priority ?? null, responsibility: null })),
      }),
    ]);
    return records;
  };

  const refreshSelection = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.candidatesRoot() }),
      queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.selected(bidSeq, workDutyId) }),
      queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.workOverlapDocuments(bidSeq, currentEmployeeNo) }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      replaceSelection(selectedEngineers.map((engineer, index) => ({
        engrId: engineer.engineerId,
        memo: engineer.memo || null,
        priority: index + 1,
        role: engineer.role || null,
      }))),
    onSuccess: async (records) => {
      onSaved(records);
      await refreshSelection();
    },
    onError,
  });

  const removeMutation = useMutation({
    mutationFn: async (engineerIds: string[]) => {
      if (!bidSeq || !workDutyId || !currentEmployeeNo) throw new Error("로그인 작업자 정보를 확인할 수 없습니다.");
      await Promise.all(
        engineerIds.map(async (engineerId) => {
          await deletePqParticipatingEngineer(bidSeq, workDutyId, engineerId);
          await deleteWorkOverlapDocumentEngineer(bidSeq, currentEmployeeNo, engineerId).catch(() => undefined);
        }),
      );
      return engineerIds;
    },
    onSuccess: async (engineerIds) => {
      onRemoved(engineerIds);
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.candidatesRoot() });
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.selected(bidSeq, workDutyId) });
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.workOverlapDocuments(bidSeq, currentEmployeeNo) });
    },
    onError,
  });

  return { removeMutation, saveMutation };
}
