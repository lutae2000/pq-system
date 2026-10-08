"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTechnologyNotice } from "@/modules/system/notices/api";
import {
  createNewTechnologyDevelopment,
  deleteNewTechnologyDevelopment,
  updateNewTechnologyDevelopment,
  type NewTechnologyDevelopmentRecord,
  type NewTechnologyDevelopmentRequest,
} from "@/modules/pq/new-technology-developments/api";
import { newTechnologyDevelopmentQueryKeys } from "@/modules/pq/new-technology-developments/application/queryKeys";

type Params = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  draftId: number;
  onDeleted: () => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onSaved: (saved: NewTechnologyDevelopmentRecord) => void;
  onWarning: (message: string) => void;
};

export function useNewTechnologyDevelopmentMutations({
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
  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: newTechnologyDevelopmentQueryKeys.all });

  const saveMutation = useMutation({
    mutationFn: async (request: NewTechnologyDevelopmentRequest) => {
      if (!request.title) {
        throw new Error("출원명을 입력하세요.");
      }
      if (!request.technologyType) {
        throw new Error("구분을 선택하세요.");
      }
      if (request.applicantCount === null || request.applicantCount <= 0) {
        throw new Error("출원인수는 0보다 커야 합니다.");
      }
      if (draftId > 0 && !canUpdate) {
        throw new Error("수정 권한이 없습니다.");
      }
      if (draftId === 0 && !canCreate) {
        throw new Error("등록 권한이 없습니다.");
      }

      const created = draftId === 0;
      const saved = created ? await createNewTechnologyDevelopment(request) : await updateNewTechnologyDevelopment(draftId, request);
      return { created, saved };
    },
    onSuccess: async ({ created, saved }) => {
      await invalidateAll();
      onSaved(saved);

      if (created) {
        try {
          await createTechnologyNotice({
            title: "신기술 개발실적 신규 등록",
            content: `${saved.title} 개발실적이 등록되었습니다.`,
            targetPath: "/pq/new-technology-developments",
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
      if (!canDelete) {
        throw new Error("삭제 권한이 없습니다.");
      }
      return deleteNewTechnologyDevelopment(id);
    },
    onSuccess: async (_data, deletedId) => {
      queryClient.removeQueries({ queryKey: [...newTechnologyDevelopmentQueryKeys.all, "detail", deletedId] });
      onDeleted();
      await queryClient.invalidateQueries({ queryKey: newTechnologyDevelopmentQueryKeys.lists });
    },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });

  return { deleteMutation, saveMutation };
}
