"use client";

import { useQuery } from "@tanstack/react-query";

import { listDepartments } from "@/modules/code/departments/api";
import { listSystemMenus } from "@/modules/system/menus/api";
import { listSystemRoles } from "@/modules/system/roles/api";
import { getUsers, type UserSearchParams } from "@/modules/system/user-management/api";
import { userManagementQueryKeys } from "@/modules/system/user-management/application/queryKeys";

export function useUserManagementQueries(enabled: boolean, criteria: UserSearchParams, searchRevision: number) {
  const departmentsQuery = useQuery({ queryKey: ["departments", "useYn=true"], queryFn: () => listDepartments({ useYn: true }), enabled });
  const rolesQuery = useQuery({ queryKey: ["system-roles", "use_yn=true"], queryFn: () => listSystemRoles({ useYn: true }), enabled });
  const menuQuery = useQuery({ queryKey: ["system-menus"], queryFn: listSystemMenus, enabled });
  const usersQuery = useQuery({
    queryKey: [...userManagementQueryKeys.usersRoot, criteria, searchRevision],
    queryFn: () => getUsers(criteria),
    enabled,
  });
  return { departmentsQuery, menuQuery, rolesQuery, usersQuery };
}
