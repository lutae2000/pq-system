"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createEducationReminderTemplate,
  deleteEducationReminderTemplate,
  listEducationReminderTemplates,
  updateEducationReminderTemplate,
} from "../api";
import type { EducationReminderTemplateRecord, EducationReminderTemplateRequest } from "../../types";
import { educationReminderTemplateQueryKeys } from "./queryKeys";

type SaveInput = {
  id: number | null;
  isCreating: boolean;
  request: EducationReminderTemplateRequest;
};

type UseEducationReminderTemplatesOptions = {
  canCreate: boolean;
  canDelete: boolean;
  canRead: boolean;
  canUpdate: boolean;
  onDeleted: () => void;
  onSaved: (template: EducationReminderTemplateRecord) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  tabQueryEnabled: boolean;
};

export function useEducationReminderTemplates({
  canCreate,
  canDelete,
  canRead,
  canUpdate,
  onDeleted,
  onSaved,
  showError,
  showSuccess,
  tabQueryEnabled,
}: UseEducationReminderTemplatesOptions) {
  const queryClient = useQueryClient();
  const templatesQuery = useQuery({
    queryKey: educationReminderTemplateQueryKeys.list,
    queryFn: listEducationReminderTemplates,
    enabled: canRead && tabQueryEnabled,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, isCreating, request }: SaveInput) => {
      if (isCreating) {
        if (!canCreate) throw new Error("템플릿 생성 권한이 없습니다.");
        return createEducationReminderTemplate(request);
      }
      if (!canUpdate || id === null) throw new Error("템플릿 수정 권한이 없습니다.");
      return updateEducationReminderTemplate(id, request);
    },
    onSuccess: async (saved) => {
      onSaved(saved);
      showSuccess("템플릿이 저장되었습니다.");
      await queryClient.invalidateQueries({ queryKey: educationReminderTemplateQueryKeys.all });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "템플릿 저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!canDelete) throw new Error("템플릿 삭제 권한이 없습니다.");
      return deleteEducationReminderTemplate(id);
    },
    onSuccess: async () => {
      onDeleted();
      showSuccess("템플릿이 삭제되었습니다.");
      await queryClient.invalidateQueries({ queryKey: educationReminderTemplateQueryKeys.all });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "템플릿 삭제에 실패했습니다."),
  });

  return { deleteMutation, saveMutation, templatesQuery };
}
