import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteWorkOverlapDocumentEngineer,
  deleteWorkOverlapDocumentTarget,
  listWorkOverlapDocumentEngineers,
  replaceWorkOverlapDocumentEngineers,
  replaceWorkOverlapDocumentTargets,
  updateWorkOverlapDocumentEngineer,
} from "@/modules/work-overlap/engineers/api";
import { workOverlapDocumentsQueryKeys } from "@/modules/pq/work-overlap-docs/application/queryKeys";

export function useWorkOverlapDocumentsMutations({
  canCreate,
  canDelete,
  canUpdate,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: workOverlapDocumentsQueryKeys.all });

  const saveEngineersMutation = useMutation({
    mutationFn: (requestBody: Parameters<typeof replaceWorkOverlapDocumentEngineers>[0]) => {
      if (!canCreate && !canUpdate) throw new Error("업무중복도 문서 대상 기술인 저장 권한이 없습니다.");
      return replaceWorkOverlapDocumentEngineers(requestBody);
    },
    onSuccess: invalidate,
  });
  const updateEngineerMutation = useMutation({
    mutationFn: (requestBody: Parameters<typeof updateWorkOverlapDocumentEngineer>[0]) => {
      if (!canUpdate) throw new Error("업무중복도 문서 대상 기술인 수정 권한이 없습니다.");
      return updateWorkOverlapDocumentEngineer(requestBody);
    },
    onSuccess: invalidate,
  });
  const saveTargetsMutation = useMutation({
    mutationFn: (requestBody: Parameters<typeof replaceWorkOverlapDocumentTargets>[0]) => {
      if (!canUpdate) throw new Error("업무중복도 계약 대상 저장 권한이 없습니다.");
      return replaceWorkOverlapDocumentTargets(requestBody);
    },
    onSuccess: invalidate,
  });
  const deleteTargetMutation = useMutation({
    mutationFn: ({ bidSeq, contractNo, engineerId, workDutyId }: {
      bidSeq: number;
      contractNo: string;
      engineerId: string;
      workDutyId: string;
    }) => deleteWorkOverlapDocumentTarget(bidSeq, workDutyId, engineerId, contractNo),
    onMutate: () => {
      if (!canDelete) throw new Error("업무중복도 계약 대상 삭제 권한이 없습니다.");
    },
    onSuccess: invalidate,
  });
  const deleteEngineerMutation = useMutation({
    mutationFn: ({ bidSeq, engineerId, workDutyId }: {
      bidSeq: number;
      engineerId: string;
      workDutyId: string;
    }) => deleteWorkOverlapDocumentEngineer(bidSeq, workDutyId, engineerId),
    onMutate: () => {
      if (!canDelete) throw new Error("업무중복도 문서 대상 기술인 삭제 권한이 없습니다.");
    },
    onSuccess: invalidate,
  });

  return {
    deleteEngineerMutation,
    deleteTargetMutation,
    loadEngineers: listWorkOverlapDocumentEngineers,
    saveEngineersMutation,
    saveTargetsMutation,
    updateEngineerMutation,
  };
}
