import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { AuthUserAccount } from "@/types/user";

import { getUsers, type UserSearchParams } from "@/modules/system/user-management/api";

export type UserMenuPermissionRecord = {
  create: boolean;
  delete: boolean;
  description: string | null;
  loginId: string;
  menuCode: string;
  menuName: string;
  menuPath: string | null;
  menuType: string;
  parentMenuCode: string | null;
  read: boolean;
  sortSeq: number;
  update: boolean;
  useYn: boolean;
  visibleYn: boolean;
};

export type UserMenuPermissionUpsertRequest = {
  items: Array<{
    create: boolean;
    delete: boolean;
    menuCode: string;
    read: boolean;
    update: boolean;
  }>;
};


export async function listUsersForPermissionManagement(): Promise<AuthUserAccount[]> {
  const params: UserSearchParams = {
    deptCode: "All",
    groupCode: "All",
    keyword: "",
    page: 0,
    useYn: "All",
  };

  const firstPage = await getUsers(params);
  const users = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await getUsers({ ...params, page });
    users.push(...nextPage.content);
  }

  return users;
}

export async function listUserMenuPermissions(loginId: string): Promise<UserMenuPermissionRecord[]> {
  return apiRequest(
    apiClient.get(`/auth/users/${encodeURIComponent(loginId)}/menu-permissions`),
    "사용자 메뉴 권한을 불러오지 못했습니다.",
  );
}

export async function saveUserMenuPermissions(
  loginId: string,
  requestBody: UserMenuPermissionUpsertRequest,
): Promise<UserMenuPermissionRecord[]> {
  return apiRequest(
    apiClient.put(`/auth/users/${encodeURIComponent(loginId)}/menu-permissions`, requestBody),
    "사용자 메뉴 권한을 저장하지 못했습니다.",
  );
}
