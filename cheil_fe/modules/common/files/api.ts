import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type FileAttachmentTarget = {
  attachmentType: string;
  ownerId: number | string;
  ownerType: string;
};

export type FileAttachmentRecord = {
  attachmentId: number;
  attachmentType: string;
  contentType?: string | null;
  createdAt?: string | null;
  createdId?: string | null;
  downloadUrl: string;
  fileId: string;
  fileSize: number;
  originalFilename: string;
  displayOrder?: number | null;
  ownerId: string;
  ownerType: string;
};

export type FileAttachmentRequest = Omit<FileAttachmentRecord, "attachmentId" | "createdAt" | "createdId">;

export async function listFileAttachments(target: Pick<FileAttachmentTarget, "ownerId" | "ownerType">): Promise<FileAttachmentRecord[]> {
  return apiRequest(
    apiClient.get<FileAttachmentRecord[]>("/file-attachments", {
      params: {
        ownerId: String(target.ownerId),
        ownerType: target.ownerType,
      },
    }),
    "첨부파일 목록을 불러오지 못했습니다.",
  );
}

export async function createFileAttachment(requestBody: FileAttachmentRequest): Promise<FileAttachmentRecord> {
  return apiRequest(apiClient.post<FileAttachmentRecord>("/file-attachments", requestBody), "첨부파일을 저장하지 못했습니다.");
}

export async function updateFileAttachmentDisplayOrder(
  attachmentId: number,
  displayOrder: number | null,
): Promise<FileAttachmentRecord> {
  return apiRequest(
    apiClient.patch<FileAttachmentRecord>(`/file-attachments/${attachmentId}/display-order`, { displayOrder }),
    "첨부파일 순번을 저장하지 못했습니다.",
  );
}

export async function deleteFileAttachment(attachmentId: number): Promise<void> {
  await apiRequest(apiClient.delete(`/file-attachments/${attachmentId}`), "첨부파일을 삭제하지 못했습니다.");
}
