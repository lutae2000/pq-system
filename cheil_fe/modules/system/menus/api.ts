import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type SystemMenuRecord = {
  description: string | null;
  menuCode: string;
  menuName: string;
  menuPath: string | null;
  menuType: string;
  parentMenuCode: string | null;
  sortSeq: number;
  useYn: boolean;
  visibleYn: boolean;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type SystemMenuUpsertRequest = {
  description?: string | null;
  menuCode: string;
  menuName: string;
  menuPath?: string | null;
  menuType: string;
  parentMenuCode?: string | null;
  sortSeq: number;
  useYn: boolean;
  visibleYn: boolean;
};


export async function listSystemMenus(): Promise<SystemMenuRecord[]> {
  return apiRequest(apiClient.get("/system/permissions/menus"), "메뉴 목록을 불러오지 못했습니다.");
}

export async function getSystemMenu(menuCode: string): Promise<SystemMenuRecord> {
  return apiRequest(apiClient.get(`/system/permissions/menus/${encodeURIComponent(menuCode)}`), "메뉴 정보를 불러오지 못했습니다.");
}

export async function createSystemMenu(requestBody: SystemMenuUpsertRequest): Promise<SystemMenuRecord> {
  return apiRequest(apiClient.post("/system/permissions/menus", requestBody), "메뉴를 저장하지 못했습니다.");
}

export async function updateSystemMenu(menuCode: string, requestBody: SystemMenuUpsertRequest): Promise<SystemMenuRecord> {
  return apiRequest(
    apiClient.put(`/system/permissions/menus/${encodeURIComponent(menuCode)}`, requestBody),
    "메뉴를 저장하지 못했습니다.",
  );
}

export async function deleteSystemMenu(menuCode: string): Promise<void> {
  await apiRequest(apiClient.delete(`/system/permissions/menus/${encodeURIComponent(menuCode)}`), "메뉴를 삭제하지 못했습니다.");
}
