"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createCertification, deleteCertification, listCertifications, updateCertification } from "@/modules/code/certifications/api";
import type { CertificationRecord, CertificationUpsertRequest } from "@/modules/code/certifications/certificates.types";
import { certificationQueryKeys } from "@/modules/code/certifications/application/queryKeys";

type SaveCertificationCommand = {
  certCode: string;
  creating: boolean;
  request: CertificationUpsertRequest;
};

export function useCertificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: certificationQueryKeys.all,
    queryFn: listCertifications,
    enabled,
  });
}

export function useCertificationManagement({
  canCreate,
  canDelete,
  canRead,
  canUpdate,
  enabled,
  onDeleted,
  onError,
  onSaved,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canRead: boolean;
  canUpdate: boolean;
  enabled: boolean;
  onDeleted: (certCode: string) => void;
  onError: (error: unknown) => void;
  onSaved: (record: CertificationRecord) => void;
}) {
  const queryClient = useQueryClient();
  const certificationsQuery = useCertificationsQuery(canRead && enabled);
  const saveMutation = useMutation({
    mutationFn: ({ certCode, creating, request }: SaveCertificationCommand) => {
      if (creating) {
        if (!canCreate) throw new Error("자격증 등록 권한이 없습니다.");
        return createCertification(request);
      }
      if (!canUpdate) throw new Error("자격증 수정 권한이 없습니다.");
      return updateCertification(certCode, request);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: certificationQueryKeys.all });
      onSaved(saved);
    },
    onError,
  });
  const deleteMutation = useMutation({
    mutationFn: (certCode: string) => {
      if (!canDelete) throw new Error("자격증 삭제 권한이 없습니다.");
      return deleteCertification(certCode);
    },
    onSuccess: async (_, certCode) => {
      await queryClient.invalidateQueries({ queryKey: certificationQueryKeys.all });
      onDeleted(certCode);
    },
    onError,
  });

  return { query: certificationsQuery, deleteMutation, saveMutation };
}
