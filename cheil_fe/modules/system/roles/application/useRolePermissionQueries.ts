import { useQuery } from "@tanstack/react-query";

import { listSystemMenus } from "@/modules/system/menus/api";
import { listRoleMenuPermissions, listSystemRoles } from "@/modules/system/roles/api";
import { rolePermissionQueryKeys } from "@/modules/system/roles/application/queryKeys";

export function useRolePermissionQueries({ enabled, selectedRoleCode }: { enabled: boolean; selectedRoleCode: string | null }) {
  const rolesQuery = useQuery({
    queryKey: rolePermissionQueryKeys.roles,
    queryFn: () => listSystemRoles(),
    enabled,
  });
  const menusQuery = useQuery({
    queryKey: rolePermissionQueryKeys.menus,
    queryFn: listSystemMenus,
    enabled,
  });
  const permissionsQuery = useQuery({
    queryKey: rolePermissionQueryKeys.permissions(selectedRoleCode ?? ""),
    queryFn: () => listRoleMenuPermissions(selectedRoleCode ?? ""),
    enabled: enabled && Boolean(selectedRoleCode),
  });

  return { menusQuery, permissionsQuery, rolesQuery };
}
