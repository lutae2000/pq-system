import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type EngineerPdfExtractionRow = {
  rowNumber: number;
  values: Record<string, string>;
  confidence: number;
};

export type EngineerPdfExtraction = {
  fileName: string;
  basic: {
    name: string;
    birthDate: string;
    workField: string;
    specialtyField: string;
    designGrade: string;
    constructionManagementGrade: string;
  };
  sections: Record<string, EngineerPdfExtractionRow[]>;
  extractedText: string;
  warnings: string[];
};

export async function extractEngineerPdf(file: File): Promise<EngineerPdfExtraction> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest(
    apiClient.post<EngineerPdfExtraction>("/pq/engineers/pdf-extractions", formData),
    "기술인 PDF에서 데이터를 추출하지 못했습니다.",
  );
}
