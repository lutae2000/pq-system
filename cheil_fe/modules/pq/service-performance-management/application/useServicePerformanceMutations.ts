import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createServicePerformance,
  deleteServicePerformance,
  updateServicePerformance,
  type ServicePerformanceRecord,
  type ServicePerformanceRequest,
} from "@/modules/pq/service-performance-management/api";
import { servicePerformanceQueryKeys } from "@/modules/pq/service-performance-management/application/queryKeys";

export function useServicePerformanceMutations({
  canCreate,
  canDelete,
  canUpdate,
  draftId,
  onDeleted,
  onError,
  onSaved,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  draftId: number;
  onDeleted: (deleted: ServicePerformanceRecord) => void;
  onError: (error: unknown, fallback: string) => void;
  onSaved: (saved: ServicePerformanceRecord) => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: servicePerformanceQueryKeys.all });
  const saveMutation = useMutation({
    mutationFn: (request: ServicePerformanceRequest) => {
      if (draftId > 0 && !canUpdate) throw new Error("용역 수행성과 수정 권한이 없습니다.");
      if (draftId === 0 && !canCreate) throw new Error("용역 수행성과 등록 권한이 없습니다.");
      if (!request.clientCode) throw new Error("발주청을 선택해 주세요.");
      if (!request.fieldName) throw new Error("분야를 입력해 주세요.");
      if (!request.siteName) throw new Error("현장명을 입력해 주세요.");
      if (!request.evaluationDate) throw new Error("평가일을 입력해 주세요.");
      return draftId > 0 ? updateServicePerformance(draftId, request) : createServicePerformance(request);
    },
    onSuccess: (saved) => { onSaved(saved); void invalidate(); },
    onError: (error) => onError(error, "저장에 실패했습니다."),
  });
  const deleteMutation = useMutation({
    mutationFn: (target: ServicePerformanceRecord) => {
      if (!canDelete) throw new Error("용역 수행성과 삭제 권한이 없습니다.");
      return deleteServicePerformance(target.id);
    },
    onSuccess: (_result, deleted) => { onDeleted(deleted); void invalidate(); },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });
  return { deleteMutation, saveMutation };
}
