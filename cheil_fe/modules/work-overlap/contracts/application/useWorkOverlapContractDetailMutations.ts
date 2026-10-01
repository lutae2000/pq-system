import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createWorkOverlapContractEngineer,
  deleteWorkOverlapContractEngineer,
  deleteWorkOverlapContractEngineerHistory,
  deleteWorkOverlapContractPeriodHistory,
  updateWorkOverlapContractEngineer,
  type WorkOverlapContractEngineerChangeRequest,
  type WorkOverlapContractEngineerHistoryRecord,
  type WorkOverlapContractEngineerRecord,
  type WorkOverlapContractEngineerRequest,
  type WorkOverlapContractPeriodHistoryRecord,
} from "@/modules/work-overlap/contracts/api";
import { workOverlapContractQueryKeys } from "@/modules/work-overlap/contracts/application/queryKeys";

export function useWorkOverlapContractDetailMutations({
  canCreate,
  canDelete,
  canUpdate,
  contractNo,
  onEngineerDeleted,
  onEngineerSaved,
  onEngineerUpdated,
  onHistoryDeleted,
  onPeriodHistoryDeleted,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  contractNo: string;
  onEngineerDeleted: () => void;
  onEngineerSaved: (row: WorkOverlapContractEngineerRecord) => void;
  onEngineerUpdated: () => void;
  onHistoryDeleted: () => void;
  onPeriodHistoryDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const invalidateEngineerData = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: workOverlapContractQueryKeys.engineers(contractNo),
      }),
      queryClient.invalidateQueries({
        queryKey: workOverlapContractQueryKeys.engineerHistories(contractNo),
      }),
    ]);

  const createEngineerMutation = useMutation({
    mutationFn: ({ row, requestBody }: { row: WorkOverlapContractEngineerRecord; requestBody: WorkOverlapContractEngineerRequest }) => {
      if (!canCreate) throw new Error("참여기술인 등록 권한이 없습니다.");
      if (!contractNo) throw new Error("업무중복도 계약 저장 후 참여기술인을 등록할 수 있습니다.");
      if (!row.engineerId?.trim()) throw new Error("이름은 필수입니다.");
      return createWorkOverlapContractEngineer(contractNo, requestBody);
    },
    onSuccess: (_saved, { row }) => { onEngineerSaved(row); void invalidateEngineerData(); },
  });
  const updateEngineerMutation = useMutation({
    mutationFn: ({ engineerId, requestBody }: { engineerId: string; requestBody: WorkOverlapContractEngineerChangeRequest }) => {
      if (!canUpdate) throw new Error("참여기술인 수정 권한이 없습니다.");
      if (!contractNo || !engineerId) throw new Error("수정할 참여기술인을 선택해 주세요.");
      return updateWorkOverlapContractEngineer(contractNo, engineerId, requestBody);
    },
    onSuccess: () => { onEngineerUpdated(); void invalidateEngineerData(); },
  });
  const deleteEngineerMutation = useMutation({
    mutationFn: (target: WorkOverlapContractEngineerRecord) => {
      if (!canDelete) throw new Error("참여기술인 삭제 권한이 없습니다.");
      if (!contractNo || !target.engineerId) throw new Error("삭제할 참여기술인을 선택해 주세요.");
      return deleteWorkOverlapContractEngineer(contractNo, target.engineerId);
    },
    onSuccess: () => { onEngineerDeleted(); void invalidateEngineerData(); },
  });
  const deleteHistoryMutation = useMutation({
    mutationFn: (target: WorkOverlapContractEngineerHistoryRecord) => {
      if (!canDelete) throw new Error("참여기술인 변경이력 삭제 권한이 없습니다.");
      if (!contractNo) throw new Error("업무중복도 계약 저장 후 변경이력을 삭제할 수 있습니다.");
      return deleteWorkOverlapContractEngineerHistory(contractNo, target.id);
    },
    onSuccess: () => { onHistoryDeleted(); void invalidateEngineerData(); },
  });
  const deletePeriodHistoryMutation = useMutation({
    mutationFn: (target: WorkOverlapContractPeriodHistoryRecord) => {
      if (!canDelete) throw new Error("기간정보 변경이력 삭제 권한이 없습니다.");
      if (!contractNo) throw new Error("업무중복도 계약 저장 후 기간정보 변경이력을 삭제할 수 있습니다.");
      return deleteWorkOverlapContractPeriodHistory(contractNo, target.id);
    },
    onSuccess: () => {
      onPeriodHistoryDeleted();
      void queryClient.invalidateQueries({
        queryKey: workOverlapContractQueryKeys.periodHistories(contractNo),
      });
    },
  });

  return { createEngineerMutation, deleteEngineerMutation, deleteHistoryMutation, deletePeriodHistoryMutation, updateEngineerMutation };
}
