import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type {
  CompanyAttachment,
  CompanyProfile,
  CompanyProfileDetail,
  FileUploadResult,
} from "./companyProfile.types";

type RawFileUploadResult = {
  contentType?: string | null;
  downloadUrl: string;
  fileId: string;
  originalFilename: string;
  size: number;
};

const normalizeDownloadUrl = (value: string) => (value.startsWith("/files/") ? `/api${value}` : value);

export type CompanyAttachmentRequest = Omit<CompanyAttachment, "attachmentId" | "createdAt" | "createdId">;

export async function getCompanyProfile() {
  return apiRequest(apiClient.get<CompanyProfileDetail>("/system/company-profile"), "Failed to load company profile.");
}

export async function updateCompanyProfile(profile: CompanyProfile) {
  return apiRequest(apiClient.put<CompanyProfileDetail>("/system/company-profile", profile), "Failed to save company profile.");
}

export async function uploadFile(file: File): Promise<FileUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const uploaded = await apiRequest(apiClient.post<RawFileUploadResult>("/files", formData), "Failed to upload file.");
  return {
    contentType: uploaded.contentType,
    downloadUrl: normalizeDownloadUrl(uploaded.downloadUrl),
    fileId: uploaded.fileId,
    originalFilename: uploaded.originalFilename,
    size: uploaded.size,
  };
}

export async function createCompanyAttachment(payload: CompanyAttachmentRequest) {
  return apiRequest(
    apiClient.post<CompanyAttachment>("/system/company-profile/attachments", payload),
    "Failed to save attachment.",
  );
}

export async function deleteCompanyAttachment(attachmentId: number) {
  await apiRequest(apiClient.delete(`/system/company-profile/attachments/${attachmentId}`), "Failed to delete attachment.");
}
