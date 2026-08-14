import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { ServiceTypeRecord, ServiceTypeUpsertRequest } from "./serviceTypes.types";


export async function listServiceTypes(): Promise<ServiceTypeRecord[]> {
  return apiRequest(apiClient.get("/pq/service-types"), "용역구분 목록을 불러오지 못했습니다.");
}

export async function createServiceType(requestBody: ServiceTypeUpsertRequest): Promise<ServiceTypeRecord> {
  return apiRequest(apiClient.post("/pq/service-types", requestBody), "용역구분을 저장하지 못했습니다.");
}

export async function updateServiceType(serviceTypeCode: string, requestBody: ServiceTypeUpsertRequest): Promise<ServiceTypeRecord> {
  return apiRequest(apiClient.put(`/pq/service-types/${encodeURIComponent(serviceTypeCode)}`, requestBody), "용역구분을 저장하지 못했습니다.");
}

export async function deleteServiceType(serviceTypeCode: string): Promise<void> {
  await apiRequest(apiClient.delete(`/pq/service-types/${encodeURIComponent(serviceTypeCode)}`), "용역구분을 삭제하지 못했습니다.");
}
