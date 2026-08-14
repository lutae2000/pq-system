import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const SIMILAR_SERVICE_PERFORMANCES_API = "/pq/similar-service-performances";

export const SIMILAR_SERVICE_PERFORMANCE_PAGE_SIZE = 100;

export type SimilarServicePerformanceRecord = {
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

export type SimilarServicePerformancePageResponse = {
  content: SimilarServicePerformanceRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type SimilarServicePerformanceSearchParams = {
  keyword: string;
  constructionType: string;
  client: string;
  referenceDate: string;
  contractFromDate: string;
  contractToDate: string;
  page: number;
  size: number;
};

export type SimilarServicePerformanceRequest = {
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

export async function listSimilarServicePerformances(
  params: SimilarServicePerformanceSearchParams,
): Promise<SimilarServicePerformancePageResponse> {
  return apiRequest(
    apiClient.get<SimilarServicePerformancePageResponse>(SIMILAR_SERVICE_PERFORMANCES_API, {
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
    "유사용역 수행실적 목록을 불러오지 못했습니다.",
  );
}

export async function getSimilarServicePerformance(id: number): Promise<SimilarServicePerformanceRecord> {
  return apiRequest(
    apiClient.get<SimilarServicePerformanceRecord>(`${SIMILAR_SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`),
    "유사용역 수행실적 정보를 불러오지 못했습니다.",
  );
}

export async function createSimilarServicePerformance(
  requestBody: SimilarServicePerformanceRequest,
): Promise<SimilarServicePerformanceRecord> {
  return apiRequest(
    apiClient.post<SimilarServicePerformanceRecord>(SIMILAR_SERVICE_PERFORMANCES_API, requestBody),
    "유사용역 수행실적 정보를 저장하지 못했습니다.",
  );
}

export async function updateSimilarServicePerformance(
  id: number,
  requestBody: SimilarServicePerformanceRequest,
): Promise<SimilarServicePerformanceRecord> {
  return apiRequest(
    apiClient.put<SimilarServicePerformanceRecord>(`${SIMILAR_SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`, requestBody),
    "유사용역 수행실적 정보를 저장하지 못했습니다.",
  );
}

export async function deleteSimilarServicePerformance(id: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${SIMILAR_SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`),
    "유사용역 수행실적 정보를 삭제하지 못했습니다.",
  );
}
