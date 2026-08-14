import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type SystemRoleRecord = {
  description: string | null;
  roleCode: string;
  roleName: string;
  sortSeq: number;
  useYn: boolean;
};

export type SystemRoleUpsertRequest = {
  description?: string | null;
  roleCode: string;
  roleName: string;
  sortSeq: number;
  useYn: boolean;
};

export type RoleMenuPermissionRecord = {
  create: boolean;
  delete: boolean;
  description: string | null;
  createdAt: string;
  createdId: string | null;
  menuCode: string;
  menuName: string;
  menuPath: string | null;
  menuType: string;
  parentMenuCode: string | null;
  read: boolean;
  roleCode: string;
  sortSeq: number;
  update: boolean;
  useYn: boolean;
  visibleYn: boolean;
  lastChangedAt: string;
  lastChangedId: string | null;
};

export type RoleMenuPermissionUpsertRequest = {
  items: Array<{
    create: boolean;
    delete: boolean;
    menuCode: string;
    read: boolean;
    update: boolean;
  }>;
  lastChangedId: string;
};

export type SystemRoleSearchParams = {
  useYn?: boolean | null;
};

const normalizeQueryValue = (value: string | boolean | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
};


export async function listSystemRoles(params: SystemRoleSearchParams = {}): Promise<SystemRoleRecord[]> {
  return apiRequest(
    apiClient.get("/system/permissions/roles", {
      params: {
        use_yn: normalizeQueryValue(params.useYn),
      },
    }),
    "역할 목록을 불러오지 못했습니다.",
  );
}

export async function getSystemRole(roleCode: string): Promise<SystemRoleRecord> {
  return apiRequest(apiClient.get(`/system/permissions/roles/${encodeURIComponent(roleCode)}`), "역할 정보를 불러오지 못했습니다.");
}

export async function createSystemRole(requestBody: SystemRoleUpsertRequest): Promise<SystemRoleRecord> {
  return apiRequest(apiClient.post("/system/permissions/roles", requestBody), "역할을 저장하지 못했습니다.");
}

export async function updateSystemRole(roleCode: string, requestBody: SystemRoleUpsertRequest): Promise<SystemRoleRecord> {
  return apiRequest(
    apiClient.put(`/system/permissions/roles/${encodeURIComponent(roleCode)}`, requestBody),
    "역할을 저장하지 못했습니다.",
  );
}

export async function deleteSystemRole(roleCode: string): Promise<void> {
  await apiRequest(apiClient.delete(`/system/permissions/roles/${encodeURIComponent(roleCode)}`), "역할을 삭제하지 못했습니다.");
}

export async function listRoleMenuPermissions(roleCode: string): Promise<RoleMenuPermissionRecord[]> {
  return apiRequest(
    apiClient.get(`/system/permissions/roles/${encodeURIComponent(roleCode)}/menu-permissions`),
    "역할 권한을 불러오지 못했습니다.",
  );
}

export async function saveRoleMenuPermissions(
  roleCode: string,
  requestBody: RoleMenuPermissionUpsertRequest,
): Promise<RoleMenuPermissionRecord[]> {
  return apiRequest(
    apiClient.put(`/system/permissions/roles/${encodeURIComponent(roleCode)}/menu-permissions`, requestBody),
    "역할 권한을 저장하지 못했습니다.",
  );
}
