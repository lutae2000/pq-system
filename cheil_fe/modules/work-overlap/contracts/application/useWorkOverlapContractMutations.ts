import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createWorkOverlapContract,
  deleteWorkOverlapContract,
  updateWorkOverlapContract,
  type WorkOverlapContractRecord,
  type WorkOverlapContractRequest,
} from "@/modules/work-overlap/contracts/api";
import type { WorkOverlapContractSavePayload } from "@/modules/work-overlap/contracts/WorkOverlapContractDetailDialog";
import { workOverlapContractQueryKeys } from "@/modules/work-overlap/contracts/application/queryKeys";

export function useWorkOverlapContractMutations({
  canCreate,
  canDelete,
  canUpdate,
  onDeleted,
  onError,
  onSaved,
  toRequest,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  onDeleted: () => void;
  onError: (error: unknown, fallback: string) => void;
  onSaved: () => void;
  toRequest: (payload: WorkOverlapContractSavePayload) => WorkOverlapContractRequest;
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: workOverlapContractQueryKeys.all });
  const saveMutation = useMutation({
    mutationFn: (payload: WorkOverlapContractSavePayload) => {
      const request = toRequest(payload);
      if (!request.serviceName) throw new Error("용역명을 입력해 주세요.");
      if (payload.record.contractNo) {
        if (!canUpdate) throw new Error("계약 수정 권한이 없습니다.");
        return updateWorkOverlapContract(payload.record.contractNo, request);
      }
      if (!canCreate) throw new Error("계약 등록 권한이 없습니다.");
      return createWorkOverlapContract(request);
    },
    onSuccess: () => { onSaved(); void invalidate(); },
    onError: (error) => onError(error, "저장에 실패했습니다."),
  });
  const deleteMutation = useMutation({
    mutationFn: (target: WorkOverlapContractRecord) => {
      if (!canDelete) throw new Error("계약 삭제 권한이 없습니다.");
      return deleteWorkOverlapContract(target.contractNo);
    },
    onSuccess: () => { onDeleted(); void invalidate(); },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });
  return { deleteMutation, saveMutation };
}
