import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const API_PATH = "/pq/engineer-performance-docs/hwpx";

export type HwpxTemplateFieldResponse = { name: string; sampleValue: string };

export type HwpxGenerateRequest = {
  bidSeq: number;
  engineerIds: string[];
  relatedProjectHistoryConditions?: string;
  mappings: Record<string, string>;
};

export function inspectHwpxTemplate(template: File) {
  const formData = new FormData();
  formData.append("template", template);
  return apiRequest(
    apiClient.post<HwpxTemplateFieldResponse[]>(`${API_PATH}/inspect`, formData),
    "HWPX 양식의 필드를 읽지 못했습니다.",
  );
}

export function generateHwpxDocuments(template: File, request: HwpxGenerateRequest) {
  const formData = new FormData();
  formData.append("template", template);
  formData.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  return apiRequest(
    apiClient.post<Blob>(`${API_PATH}/generate`, formData, { responseType: "blob" }),
    "HWPX 산출물 생성에 실패했습니다.",
  );
}

export type CompanyPerformanceHwpxGenerateRequest = {
  bidSeq: number;
  companyPerformanceSeqs: number[];
  mappings: Record<string, string>;
};

export function generateCompanyPerformanceHwpxDocuments(template: File, request: CompanyPerformanceHwpxGenerateRequest) {
  const formData = new FormData();
  formData.append("template", template);
  formData.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  return apiRequest(
    apiClient.post<Blob>("/pq/company-performance-document-targets/hwpx/generate", formData, { responseType: "blob" }),
    "회사실적 HWPX 산출물 생성에 실패했습니다.",
  );
}

export type PerformanceCertificateGenerateRequest = {
  bidSeq: number;
  engineerIds?: string[];
  engineerNames?: Record<string, string>;
  companyPerformanceSeqs?: number[];
  relatedProjectHistoryConditions?: string;
  includeParticipantList?: boolean;
};

export function generatePerformanceCertificate(request: PerformanceCertificateGenerateRequest) {
  return apiRequest(
    apiClient.post<Blob>("/pq/engineer-performance-docs/performance-certificates/generate", request, { responseType: "blob" }),
    "실적증명서 생성에 실패했습니다.",
  );
}

export function generatePerformanceCertificateBatch(request: PerformanceCertificateGenerateRequest) {
  return apiRequest(
    apiClient.post<Blob>("/pq/engineer-performance-docs/performance-certificates/generate-batch", request, { responseType: "blob" }),
    "기술인별 실적증명서 ZIP 생성에 실패했습니다.",
  );
}
