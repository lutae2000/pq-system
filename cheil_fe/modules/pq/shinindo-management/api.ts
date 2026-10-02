import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const SHININDO_MANAGEMENT_API = "/pq/shinindo-management";

export const SHININDO_MANAGEMENT_PAGE_SIZE = 20;
export const SHININDO_MANAGEMENT_ATTACHMENT_OWNER_TYPE = "SHININDO_MANAGEMENT";
export const SHININDO_MANAGEMENT_ATTACHMENT_TYPE = "REFERENCE";

export type ShinindoManagementRecord = {
  id: number;
  clientCode: string;
  clientName: string;
  itemName: string;
  appliedYn: "Y" | "N";
  score: number | null;
  acquiredDate: string | null;
  validUntil: string | null;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type ShinindoManagementPageResponse = {
  content: ShinindoManagementRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type ShinindoManagementSearchParams = {
  clientCode: string;
  keyword: string;
  referenceDate: string;
  page: number;
  size: number;
};

export type ShinindoManagementRequest = {
  clientCode: string;
  itemName: string;
  appliedYn: "Y" | "N";
  score: number | null;
  acquiredDate: string | null;
  validUntil: string | null;
  remark: string | null;
};

const normalizeQueryValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
};

const normalizeDateQueryValue = (value: string | null | undefined) => {
  const normalized = value?.trim().replaceAll("-", "") ?? "";
  return normalized ? normalized : undefined;
};

export async function listShinindoManagements(params: ShinindoManagementSearchParams): Promise<ShinindoManagementPageResponse> {
  return apiRequest(
    apiClient.get<ShinindoManagementPageResponse>(SHININDO_MANAGEMENT_API, {
      params: {
        clientCode: normalizeQueryValue(params.clientCode),
        keyword: normalizeQueryValue(params.keyword.trim()),
        referenceDate: normalizeDateQueryValue(params.referenceDate),
        page: Math.max(0, Math.trunc(params.page)),
        size: Math.max(1, Math.trunc(params.size)),
      },
    }),
    "신인도 목록을 불러오지 못했습니다.",
  );
}

export async function getShinindoManagement(id: number): Promise<ShinindoManagementRecord> {
  return apiRequest(
    apiClient.get<ShinindoManagementRecord>(`${SHININDO_MANAGEMENT_API}/${encodeURIComponent(String(id))}`),
    "신인도 정보를 불러오지 못했습니다.",
  );
}

export async function createShinindoManagement(requestBody: ShinindoManagementRequest): Promise<ShinindoManagementRecord> {
  return apiRequest(apiClient.post<ShinindoManagementRecord>(SHININDO_MANAGEMENT_API, requestBody), "신인도 정보를 저장하지 못했습니다.");
}

export async function updateShinindoManagement(id: number, requestBody: ShinindoManagementRequest): Promise<ShinindoManagementRecord> {
  return apiRequest(
    apiClient.put<ShinindoManagementRecord>(`${SHININDO_MANAGEMENT_API}/${encodeURIComponent(String(id))}`, requestBody),
    "신인도 정보를 저장하지 못했습니다.",
  );
}

export async function deleteShinindoManagement(id: number): Promise<void> {
  await apiRequest(apiClient.delete(`${SHININDO_MANAGEMENT_API}/${encodeURIComponent(String(id))}`), "신인도 정보를 삭제하지 못했습니다.");
}
