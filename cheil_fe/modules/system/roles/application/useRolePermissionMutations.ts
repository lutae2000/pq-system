import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createSystemRole,
  deleteSystemRole,
  saveRoleMenuPermissions,
  updateSystemRole,
  type RoleMenuPermissionUpsertRequest,
  type SystemRoleRecord,
  type SystemRoleUpsertRequest,
} from "@/modules/system/roles/api";
import { rolePermissionQueryKeys } from "@/modules/system/roles/application/queryKeys";

export function useRolePermissionMutations({
  canCreate,
  canDelete,
  canUpdate,
  onDeleted,
  onError,
  onPermissionsSaved,
  onRoleSaved,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  onDeleted: () => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onPermissionsSaved: () => void;
  onRoleSaved: (saved: SystemRoleRecord) => void;
}) {
  const queryClient = useQueryClient();
  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: rolePermissionQueryKeys.all });

  const saveRoleMutation = useMutation({
    mutationFn: ({ roleCode, request }: { roleCode: string | null; request: SystemRoleUpsertRequest }) => {
      if (roleCode && !canUpdate) throw new Error("역할 수정 권한이 없습니다.");
      if (!roleCode && !canCreate) throw new Error("역할 등록 권한이 없습니다.");
      return roleCode ? updateSystemRole(roleCode, request) : createSystemRole(request);
    },
    onSuccess: async (saved) => {
      await invalidateRoles();
      onRoleSaved(saved);
    },
    onError: (error) => onError(error, "역할 상세를 저장하지 못했습니다."),
  });

  const savePermissionsMutation = useMutation({
    mutationFn: ({ roleCode, request }: { roleCode: string; request: RoleMenuPermissionUpsertRequest }) => {
      if (!canUpdate) throw new Error("메뉴 권한 수정 권한이 없습니다.");
      return saveRoleMenuPermissions(roleCode, request);
    },
    onSuccess: async () => {
      await invalidateRoles();
      onPermissionsSaved();
    },
    onError: (error) => onError(error, "메뉴 권한을 저장하지 못했습니다."),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleCode: string) => {
      if (!canDelete) throw new Error("역할 삭제 권한이 없습니다.");
      return deleteSystemRole(roleCode);
    },
    onSuccess: async () => {
      await invalidateRoles();
      onDeleted();
    },
    onError: (error) => onError(error, "역할을 삭제하지 못했습니다."),
  });

  return { deleteRoleMutation, savePermissionsMutation, saveRoleMutation };
}
