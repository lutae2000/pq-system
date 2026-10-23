"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createCompanyAttachment, deleteCompanyAttachment, getCompanyProfile, updateCompanyProfile, uploadFile, type CompanyAttachmentRequest } from "@/modules/code/headquarters/api";
import type { CompanyProfile } from "@/modules/code/headquarters/companyProfile.types";
import { headquartersQueryKeys } from "@/modules/code/headquarters/application/queryKeys";

export function useHeadquartersManagement({ canCreate, canDelete, canRead, canUpdate, enabled, onAttachmentAdded, onAttachmentDeleted, onError, onProfileSaved }: {
  canCreate: boolean; canDelete: boolean; canRead: boolean; canUpdate: boolean; enabled: boolean;
  onAttachmentAdded: () => void; onAttachmentDeleted: () => void; onError: (error: unknown, operation: "profile" | "upload" | "delete") => void;
  onProfileSaved: () => void;
}) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: headquartersQueryKeys.profile, queryFn: getCompanyProfile, enabled: canRead && enabled });
  const refresh = () => client.invalidateQueries({ queryKey: headquartersQueryKeys.profile });
  const updateMutation = useMutation({ mutationFn: (profile: CompanyProfile) => { if (!canUpdate) throw new Error("회사 정보 수정 권한이 없습니다."); return updateCompanyProfile(profile); }, onSuccess: async () => { onProfileSaved(); await refresh(); }, onError: (error) => onError(error, "profile") });
  const attachmentMutation = useMutation({
    mutationFn: async ({ file, request }: { file: File | null; request: Omit<CompanyAttachmentRequest, "contentType" | "downloadUrl" | "fileId" | "fileSize" | "originalFilename"> }) => {
      if (!canCreate) throw new Error("첨부파일 등록 권한이 없습니다.");
      if (!file) throw new Error("업로드할 파일을 선택하세요.");
      const uploaded = await uploadFile(file);
      return createCompanyAttachment({ ...request, contentType: uploaded.contentType, downloadUrl: uploaded.downloadUrl, fileId: uploaded.fileId, fileSize: uploaded.size, originalFilename: uploaded.originalFilename });
    },
    onSuccess: async () => { onAttachmentAdded(); await refresh(); }, onError: (error) => onError(error, "upload"),
  });
  const deleteAttachmentMutation = useMutation({ mutationFn: (attachmentId: number) => { if (!canDelete) throw new Error("첨부파일 삭제 권한이 없습니다."); return deleteCompanyAttachment(attachmentId); }, onSuccess: async () => { onAttachmentDeleted(); await refresh(); }, onError: (error) => onError(error, "delete") });
  return { attachmentMutation, deleteAttachmentMutation, query, updateMutation };
}
