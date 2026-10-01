"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSystemMenu, deleteSystemMenu, updateSystemMenu, type SystemMenuUpsertRequest } from "@/modules/system/menus/api";
import { systemMenuQueryKeys } from "@/modules/system/menus/application/queryKeys";

type Params = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

export function useSystemMenus({ canCreate, canDelete, canUpdate, showError, showSuccess }: Params) {
  const queryClient = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: async ({ isCreating, menuCode, request }: { isCreating: boolean; menuCode: string | null; request: SystemMenuUpsertRequest }) => {
      if (isCreating && !canCreate) throw new Error("메뉴 생성 권한이 없습니다.");
      if (!isCreating && !canUpdate) throw new Error("메뉴 수정 권한이 없습니다.");
      return isCreating || !menuCode ? createSystemMenu(request) : updateSystemMenu(menuCode, request);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: systemMenuQueryKeys.all });
      showSuccess("메뉴가 저장되었습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "메뉴를 저장하지 못했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (menuCode: string) => {
      if (!canDelete) throw new Error("메뉴 삭제 권한이 없습니다.");
      return deleteSystemMenu(menuCode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: systemMenuQueryKeys.all });
      showSuccess("메뉴가 삭제되었습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "메뉴를 삭제하지 못했습니다."),
  });

  return { deleteMutation, saveMutation };
}
