import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { CertificationRecord, CertificationUpsertRequest } from "./certificates.types";


export async function listCertifications(): Promise<CertificationRecord[]> {
  return apiRequest(apiClient.get("/code/certifications"), "자격증 목록을 불러오지 못했습니다.");
}

export async function getCertification(certCode: string): Promise<CertificationRecord> {
  return apiRequest(apiClient.get(`/code/certifications/${encodeURIComponent(certCode)}`), "자격증 정보를 불러오지 못했습니다.");
}

export async function createCertification(requestBody: CertificationUpsertRequest): Promise<CertificationRecord> {
  return apiRequest(apiClient.post("/code/certifications", requestBody), "자격증을 저장하지 못했습니다.");
}

export async function updateCertification(certCode: string, requestBody: CertificationUpsertRequest): Promise<CertificationRecord> {
  return apiRequest(apiClient.put(`/code/certifications/${encodeURIComponent(certCode)}`, requestBody), "자격증을 저장하지 못했습니다.");
}

export async function deleteCertification(certCode: string): Promise<void> {
  await apiRequest(apiClient.delete(`/code/certifications/${encodeURIComponent(certCode)}`), "자격증을 삭제하지 못했습니다.");
}
