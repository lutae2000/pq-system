import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const SERVICE_PERFORMANCES_API = "/pq/service-performance-management";

export const SERVICE_PERFORMANCE_PAGE_SIZE = 100;
export const SERVICE_PERFORMANCE_ATTACHMENT_OWNER_TYPE = "SERVICE_PERFORMANCE";
export const SERVICE_PERFORMANCE_ATTACHMENT_TYPE = "EVIDENCE";

export type ServicePerformanceRecord = {
  id: number;
  clientCode: string;
  clientName: string | null;
  amountReflectedEvaluationScore: number | null;
  fieldName: string;
  siteName: string;
  evaluationDate: string;
  serviceAmount: number | null;
  evaluationScore: number | null;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type ServicePerformancePageResponse = {
  content: ServicePerformanceRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type ServicePerformanceSearchParams = {
  keyword: string;
  clientCode: string;
  fieldName: string;
  siteName: string;
  referenceDate: string;
  periodType: "3" | "5" | "ALL";
  page: number;
  size: number;
};

export type ServicePerformanceRequest = {
  clientCode: string;
  fieldName: string;
  siteName: string;
  evaluationDate: string;
  serviceAmount: number | null;
  evaluationScore: number | null;
  remark: string | null;
};

const normalizeQueryValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "" || value === "All") {
    return undefined;
  }
  return value;
};

const normalizeDateQueryValue = (value: string | null | undefined) => {
  const normalized = String(value ?? "")
    .trim()
    .replaceAll("-", "")
    .slice(0, 8);
  return normalized.length === 8 ? normalized : undefined;
};

export async function listServicePerformances(params: ServicePerformanceSearchParams): Promise<ServicePerformancePageResponse> {
  return apiRequest(
    apiClient.get<ServicePerformancePageResponse>(SERVICE_PERFORMANCES_API, {
      params: {
        clientCode: normalizeQueryValue(params.clientCode.trim()),
        referenceDate: normalizeDateQueryValue(params.referenceDate),
        fieldName: normalizeQueryValue(params.fieldName.trim()),
        keyword: normalizeQueryValue(params.keyword.trim()),
        page: Math.max(0, Math.trunc(params.page)),
        periodType: normalizeQueryValue(params.periodType),
        size: Math.max(1, Math.trunc(params.size)),
        siteName: normalizeQueryValue(params.siteName.trim()),
      },
    }),
    "용역 수행성과 목록을 불러오지 못했습니다.",
  );
}

export async function getServicePerformance(id: number): Promise<ServicePerformanceRecord> {
  return apiRequest(
    apiClient.get<ServicePerformanceRecord>(`${SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`),
    "용역 수행성과 정보를 불러오지 못했습니다.",
  );
}

export async function createServicePerformance(requestBody: ServicePerformanceRequest): Promise<ServicePerformanceRecord> {
  return apiRequest(
    apiClient.post<ServicePerformanceRecord>(SERVICE_PERFORMANCES_API, requestBody),
    "용역 수행성과 정보를 저장하지 못했습니다.",
  );
}

export async function updateServicePerformance(id: number, requestBody: ServicePerformanceRequest): Promise<ServicePerformanceRecord> {
  return apiRequest(
    apiClient.put<ServicePerformanceRecord>(`${SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`, requestBody),
    "용역 수행성과 정보를 저장하지 못했습니다.",
  );
}

export async function deleteServicePerformance(id: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${SERVICE_PERFORMANCES_API}/${encodeURIComponent(String(id))}`),
    "용역 수행성과 정보를 삭제하지 못했습니다.",
  );
}
