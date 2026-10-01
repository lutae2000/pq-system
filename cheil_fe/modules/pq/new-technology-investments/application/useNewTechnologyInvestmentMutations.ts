import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createNewTechnologyInvestment,
  deleteNewTechnologyInvestment,
  updateNewTechnologyInvestment,
  type NewTechnologyInvestmentRecord,
  type NewTechnologyInvestmentRequest,
} from "@/modules/pq/new-technology-investments/api";
import { newTechnologyInvestmentQueryKeys } from "@/modules/pq/new-technology-investments/application/queryKeys";

export function useNewTechnologyInvestmentMutations({
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
  onDeleted: () => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onSaved: (saved: NewTechnologyInvestmentRecord) => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: newTechnologyInvestmentQueryKeys.all });

  const saveMutation = useMutation({
    mutationFn: (request: NewTechnologyInvestmentRequest) => {
      if (draftId > 0 && !canUpdate) throw new Error("투자실적 수정 권한이 없습니다.");
      if (draftId === 0 && !canCreate) throw new Error("투자실적 등록 권한이 없습니다.");
      if (!request.investmentYear) throw new Error("연도를 입력하세요.");
      return draftId > 0 ? updateNewTechnologyInvestment(draftId, request) : createNewTechnologyInvestment(request);
    },
    onSuccess: async (saved) => {
      await invalidate();
      onSaved(saved);
    },
    onError: (error) => onError(error, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: NewTechnologyInvestmentRecord) => {
      if (!canDelete) throw new Error("투자실적 삭제 권한이 없습니다.");
      return deleteNewTechnologyInvestment(target.id);
    },
    onSuccess: async () => {
      await invalidate();
      onDeleted();
    },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });

  return { deleteMutation, saveMutation };
}
