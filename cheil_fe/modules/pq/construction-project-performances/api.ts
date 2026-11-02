import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const SIMILAR_SERVICE_PERFORMANCES_API = "/pq/similar-service-performances";

export const SIMILAR_SERVICE_PERFORMANCE_PAGE_SIZE = 100;

export type ConstructionProjectPerformanceRecord = {
  id: number | null;
  companyPerformanceSeq: number | null;
  serviceName: string | null;
  constructionType: string | null;
  client: string | null;
  contractFromDate: string | null;
  contractToDate: string | null;
  constructionFromDate: string | null;
  constructionToDate: string | null;
  contractPrice: number | null;
  shareRatio: number | null;
  weight: number | null;
  summary: string | null;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type ConstructionProjectPerformancePageResponse = {
  content: ConstructionProjectPerformanceRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type ConstructionProjectPerformanceSearchParams = {
  keyword: string;
  constructionType: string;
  client: string;
  referenceDate: string;
  contractFromDate: string;
  contractToDate: string;
  page: number;
  size: number;
};

export type ConstructionProjectPerformanceRequest = {
  serviceName: string | null;
  constructionType: string | null;
  client: string | null;
  contractFromDate: string | null;
  contractToDate: string | null;
  constructionFromDate: string | null;
  constructionToDate: string | null;
  contractPrice: number | null;
  shareRatio: number | null;
  weight: number | null;
  summary: string | null;
  remark: string | null;
};

const normalizeQueryValue = (value: string | null | undefined) => {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : undefined;
};

const normalizeDateQueryValue = (value: string | null | undefined) => {
  const normalized = value?.trim().replaceAll("-", "") ?? "";
  return normalized ? normalized : undefined;
};

export async function listConstructionProjectPerformances(
  params: ConstructionProjectPerformanceSearchParams,
): Promise<ConstructionProjectPerformancePageResponse> {
  return apiRequest(
    apiClient.get<ConstructionProjectPerformancePageResponse>(SIMILAR_SERVICE_PERFORMANCES_API, {
      params: {
        keyword: normalizeQueryValue(params.keyword),
        constructionType: normalizeQueryValue(params.constructionType),
        client: normalizeQueryValue(params.client),
        referenceDate: normalizeDateQueryValue(params.referenceDate),
        contractFromDate: normalizeDateQueryValue(params.contractFromDate),
        contractToDate: normalizeDateQueryValue(params.contractToDate),
        page: Math.max(0, Math.trunc(params.page)),
        size: Math.max(1, Math.trunc(params.size)),
      },
    }),
    "건설사업 실적 목록을 불러오지 못했습니다.",
  );
}

export async function getConstructionProjectPerformance(id: number): Promise<ConstructionProjectPerformanceRecord> {
  return apiRequest(
    apiClient.get<ConstructionProjectPerformanceRecord>(`${SIMILAR_SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`),
    "건설사업 실적 정보를 불러오지 못했습니다.",
  );
}

export async function createConstructionProjectPerformance(
  requestBody: ConstructionProjectPerformanceRequest,
): Promise<ConstructionProjectPerformanceRecord> {
  return apiRequest(
    apiClient.post<ConstructionProjectPerformanceRecord>(SIMILAR_SERVICE_PERFORMANCES_API, requestBody),
    "건설사업 실적 정보를 저장하지 못했습니다.",
  );
}

export async function updateConstructionProjectPerformance(
  id: number,
  requestBody: ConstructionProjectPerformanceRequest,
): Promise<ConstructionProjectPerformanceRecord> {
  return apiRequest(
    apiClient.put<ConstructionProjectPerformanceRecord>(`${SIMILAR_SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`, requestBody),
    "건설사업 실적 정보를 저장하지 못했습니다.",
  );
}

export async function deleteConstructionProjectPerformance(id: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${SIMILAR_SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`),
    "건설사업 실적 정보를 삭제하지 못했습니다.",
  );
}
