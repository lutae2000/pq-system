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
