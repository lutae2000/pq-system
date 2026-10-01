"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createShinindoManagement,
  deleteShinindoManagement,
  updateShinindoManagement,
  type ShinindoManagementRecord,
  type ShinindoManagementRequest,
} from "@/modules/pq/shinindo-management/api";
import { shinindoManagementQueryKeys } from "@/modules/pq/shinindo-management/application/queryKeys";

export function useShinindoManagementMutations({
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
  onSaved: (saved: ShinindoManagementRecord) => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: shinindoManagementQueryKeys.all });

  const saveMutation = useMutation({
    mutationFn: (request: ShinindoManagementRequest) => {
      if (draftId > 0 && !canUpdate) throw new Error("신인도 수정 권한이 없습니다.");
      if (draftId === 0 && !canCreate) throw new Error("신인도 등록 권한이 없습니다.");
      if (!request.clientCode) throw new Error("발주청을 선택해 주세요.");
      if (!request.itemName) throw new Error("신인도 항목을 입력해 주세요.");
      return draftId > 0 ? updateShinindoManagement(draftId, request) : createShinindoManagement(request);
    },
    onSuccess: async (saved) => {
      await invalidate();
      onSaved(saved);
    },
    onError: (error) => onError(error, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      if (!canDelete) throw new Error("신인도 삭제 권한이 없습니다.");
      return deleteShinindoManagement(id);
    },
    onSuccess: async () => {
      await invalidate();
      onDeleted();
    },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });

  return { deleteMutation, saveMutation };
}
