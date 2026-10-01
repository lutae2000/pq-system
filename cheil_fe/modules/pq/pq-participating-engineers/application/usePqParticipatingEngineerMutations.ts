"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deletePqParticipatingEngineer,
  replacePqParticipatingEngineers,
  type PqParticipatingEngineerRecord,
} from "@/modules/pq/pq-participating-engineers/api";
import type { SelectedPqEngineer } from "@/modules/pq/pq-participating-engineers/domain/models";
import { pqParticipatingEngineerQueryKeys } from "@/modules/pq/pq-participating-engineers/application/queryKeys";
import { deleteWorkOverlapDocumentEngineer, replaceWorkOverlapDocumentEngineers } from "@/modules/work-overlap/engineers/api";

type UsePqParticipatingEngineerMutationsParams = {
  bidSeq: number | null;
  currentLoginId: string;
  onError: (error: unknown) => void;
  onRemoved: (engineerIds: string[]) => void;
  onSaved: (records: PqParticipatingEngineerRecord[]) => void;
  selectedEngineers: SelectedPqEngineer[];
  workDutyId: string;
};

export function usePqParticipatingEngineerMutations({
  bidSeq,
  currentLoginId,
  onError,
  onRemoved,
  onSaved,
  selectedEngineers,
  workDutyId,
}: UsePqParticipatingEngineerMutationsParams) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!bidSeq) throw new Error("PQ참여할 공고문을 먼저 선택하세요.");
      if (!workDutyId) throw new Error("로그인 작업자 정보를 확인할 수 없습니다.");
      const engineers = selectedEngineers.map((engineer, index) => ({
        engrId: engineer.engineerId,
        memo: engineer.memo || null,
        priority: index + 1,
        role: engineer.role || null,
      }));
      const [records] = await Promise.all([
        replacePqParticipatingEngineers({ bidSeq, workDutyId, engineers }),
        replaceWorkOverlapDocumentEngineers({
          bidSeq,
          workDutyId: currentLoginId,
          engineers: engineers.map((engineer) => ({ engrId: engineer.engrId, displayOrder: engineer.priority, responsibility: null })),
        }),
      ]);
      return records;
    },
    onSuccess: async (records) => {
      onSaved(records);
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.candidatesRoot() });
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.selected(bidSeq, workDutyId) });
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.workOverlapDocuments(bidSeq, currentLoginId) });
    },
    onError,
  });

  const removeMutation = useMutation({
    mutationFn: async (engineerIds: string[]) => {
      if (!bidSeq || !workDutyId || !currentLoginId) throw new Error("로그인 작업자 정보를 확인할 수 없습니다.");
      await Promise.all(
        engineerIds.map(async (engineerId) => {
          await deletePqParticipatingEngineer(bidSeq, workDutyId, engineerId);
          await deleteWorkOverlapDocumentEngineer(bidSeq, currentLoginId, engineerId).catch(() => undefined);
        }),
      );
      return engineerIds;
    },
    onSuccess: async (engineerIds) => {
      onRemoved(engineerIds);
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.candidatesRoot() });
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.selected(bidSeq, workDutyId) });
      await queryClient.invalidateQueries({ queryKey: pqParticipatingEngineerQueryKeys.workOverlapDocuments(bidSeq, currentLoginId) });
    },
    onError,
  });

  return { removeMutation, saveMutation };
}
