"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTechnologyNotice } from "@/modules/system/notices/api";
import {
  createNewTechnologyUsage,
  deleteNewTechnologyUsage,
  updateNewTechnologyUsage,
  type NewTechnologyUsageRecord,
  type NewTechnologyUsageRequest,
} from "@/modules/pq/new-technology-usages/api";
import { newTechnologyUsageQueryKeys } from "@/modules/pq/new-technology-usages/application/queryKeys";

type Params = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  draftId: number;
  onDeleted: () => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onSaved: (saved: NewTechnologyUsageRecord) => void;
  onWarning: (message: string) => void;
};

export function useNewTechnologyUsageMutations({
  canCreate,
  canDelete,
  canUpdate,
  draftId,
  onDeleted,
  onError,
  onSaved,
  onWarning,
}: Params) {
  const queryClient = useQueryClient();
  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: newTechnologyUsageQueryKeys.all });

  const saveMutation = useMutation({
    mutationFn: async (request: NewTechnologyUsageRequest) => {
      if (draftId > 0 && !canUpdate) throw new Error("신인도 사용실적 수정 권한이 없습니다.");
      if (draftId === 0 && !canCreate) throw new Error("신인도 사용실적 등록 권한이 없습니다.");
      if (!request.designationNo) throw new Error("지정번호를 입력해 주세요.");
      if (!request.title) throw new Error("명칭을 입력해 주세요.");

      const created = draftId === 0;
      const saved = created ? await createNewTechnologyUsage(request) : await updateNewTechnologyUsage(draftId, request);
      return { created, saved };
    },
    onSuccess: async ({ created, saved }) => {
      await invalidateAll();
      await queryClient.invalidateQueries({ queryKey: newTechnologyUsageQueryKeys.detail(saved.id) });
      onSaved(saved);

      if (created) {
        try {
          await createTechnologyNotice({
            title: "신기술 활용실적 신규 등록",
            content: `${saved.title} 활용실적이 등록되었습니다.`,
            targetPath: "/pq/new-technology-usages",
          });
          await queryClient.invalidateQueries({ queryKey: ["system-notices"] });
        } catch {
          onWarning("실적은 저장되었지만 알림 생성에 실패했습니다.");
        }
      }
    },
    onError: (error) => onError(error, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      if (!canDelete) throw new Error("신인도 사용실적 삭제 권한이 없습니다.");
      return deleteNewTechnologyUsage(id);
    },
    onSuccess: async () => {
      await invalidateAll();
      onDeleted();
    },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });

  return { deleteMutation, saveMutation };
}
