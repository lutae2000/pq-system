"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { resetUserPassword, saveUser } from "@/modules/system/user-management/api";
import { saveUserMenuPermissions, type UserMenuPermissionUpsertRequest } from "@/modules/system/user-permission-management/api";
import type { AuthUserAccount } from "@/types/user";
import { userManagementQueryKeys } from "@/modules/system/user-management/application/queryKeys";

type Params = {
  canCreate: boolean;
  canUpdate: boolean;
  onPasswordReset: (user: AuthUserAccount) => void;
  onUserSaved: (user: AuthUserAccount) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

export function useUserManagementCommands({ canCreate, canUpdate, onPasswordReset, onUserSaved, showError, showSuccess }: Params) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (user: AuthUserAccount) => {
      if (user.employeeNo && !canUpdate) throw new Error("사용자 수정 권한이 없습니다.");
      if (!user.employeeNo && !canCreate) throw new Error("사용자 생성 권한이 없습니다.");
      return saveUser(user);
    },
    onSuccess: async (user) => {
      onUserSaved(user);
      await queryClient.invalidateQueries({ queryKey: userManagementQueryKeys.usersRoot });
      showSuccess("사용자 계정을 저장했습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "사용자 계정을 저장하지 못했습니다."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (employeeNo: string) => {
      if (!canUpdate) throw new Error("사용자 수정 권한이 없습니다.");
      return resetUserPassword(employeeNo);
    },
    onSuccess: async (user) => {
      onPasswordReset(user);
      await queryClient.invalidateQueries({ queryKey: userManagementQueryKeys.usersRoot });
      showSuccess("비밀번호를 초기화했습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "비밀번호 초기화에 실패했습니다."),
  });

  const savePermissionMutation = useMutation({
    mutationFn: async ({ loginId, items }: { loginId: string; items: UserMenuPermissionUpsertRequest["items"] }) => {
      if (!canUpdate) throw new Error("사용자 권한 수정 권한이 없습니다.");
      return saveUserMenuPermissions(loginId, { items });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userManagementQueryKeys.all });
      showSuccess("사용자 메뉴 권한을 저장했습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "사용자 메뉴 권한을 저장하지 못했습니다."),
  });

  return { resetPasswordMutation, saveMutation, savePermissionMutation };
}
