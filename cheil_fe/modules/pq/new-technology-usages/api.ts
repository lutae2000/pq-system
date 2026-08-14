import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const NEW_TECHNOLOGY_USAGES_API = "/pq/new-technology-usages";
export const NEW_TECHNOLOGY_USAGE_PAGE_SIZE = 200;
export const NEW_TECHNOLOGY_USAGE_ATTACHMENT_OWNER_TYPE = "NEW_TECHNOLOGY_USAGE";
export const NEW_TECHNOLOGY_USAGE_ATTACHMENT_TYPE = "REFERENCE";

export type NewTechnologyUsageRecord = {
  id: number;
  designationNo: string;
  title: string;
  developers: string | null;
  projectName: string | null;
  client: string | null;
  noticeDate: string | null;
  usageExpirationDate: string | null;
  usageCount: number | null;
  amountThousand: number | null;
  score: number | null;
  summary: string | null;
  weight: number | null;
  disasterPreventionScore: number | null;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type NewTechnologyUsagePageResponse = {
  content: NewTechnologyUsageRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type NewTechnologyUsageSearchParams = {
  keyword: string;
  designationNo: string;
  client: string;
  noticeDateFrom: string;
  noticeDateTo: string;
  page: number;
  size: number;
};

export type NewTechnologyUsageRequest = Omit<
  NewTechnologyUsageRecord,
  "id" | "createdAt" | "createdId" | "lastChangedAt" | "lastChangedId"
>;

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

export async function listNewTechnologyUsages(
  params: NewTechnologyUsageSearchParams,
): Promise<NewTechnologyUsagePageResponse> {
  return apiRequest(
    apiClient.get<NewTechnologyUsagePageResponse>(NEW_TECHNOLOGY_USAGES_API, {
      params: {
        keyword: normalizeQueryValue(params.keyword.trim()),
        designationNo: normalizeQueryValue(params.designationNo.trim()),
        client: normalizeQueryValue(params.client.trim()),
        noticeDateFrom: normalizeDateQueryValue(params.noticeDateFrom),
        noticeDateTo: normalizeDateQueryValue(params.noticeDateTo),
        page: Math.max(0, Math.trunc(params.page)),
        size: Math.max(1, Math.trunc(params.size)),
      },
    }),
    "신기술 활용실적 목록을 불러오지 못했습니다.",
  );
}

export async function getNewTechnologyUsage(id: number): Promise<NewTechnologyUsageRecord> {
  return apiRequest(
    apiClient.get<NewTechnologyUsageRecord>(`${NEW_TECHNOLOGY_USAGES_API}/${encodeURIComponent(String(id))}`),
    "신기술 활용실적 정보를 불러오지 못했습니다.",
  );
}

export async function createNewTechnologyUsage(
  requestBody: NewTechnologyUsageRequest,
): Promise<NewTechnologyUsageRecord> {
  return apiRequest(
    apiClient.post<NewTechnologyUsageRecord>(NEW_TECHNOLOGY_USAGES_API, requestBody),
    "신기술 활용실적을 저장하지 못했습니다.",
  );
}

export async function updateNewTechnologyUsage(
  id: number,
  requestBody: NewTechnologyUsageRequest,
): Promise<NewTechnologyUsageRecord> {
  return apiRequest(
    apiClient.put<NewTechnologyUsageRecord>(`${NEW_TECHNOLOGY_USAGES_API}/${encodeURIComponent(String(id))}`, requestBody),
    "신기술 활용실적을 저장하지 못했습니다.",
  );
}

export async function deleteNewTechnologyUsage(id: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${NEW_TECHNOLOGY_USAGES_API}/${encodeURIComponent(String(id))}`),
    "신기술 활용실적을 삭제하지 못했습니다.",
  );
}
