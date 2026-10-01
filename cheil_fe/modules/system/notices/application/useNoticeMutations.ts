"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNotice, deleteNotice, updateNotice } from "@/modules/system/notices/api";
import { noticeQueryKeys } from "@/modules/system/notices/application/queryKeys";
import type { NoticeRecord } from "@/modules/system/notices/notice.types";

type SaveVariables = {
  existing: boolean;
  record: NoticeRecord;
};

type Params = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  onDeleted: (id: string) => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onSaved: (saved: NoticeRecord, created: boolean) => void;
};

export function useNoticeMutations({ canCreate, canDelete, canUpdate, onDeleted, onError, onSaved }: Params) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async ({ existing, record }: SaveVariables) => {
      if (existing && !canUpdate) throw new Error("공지사항 수정 권한이 없습니다.");
      if (!existing && !canCreate) throw new Error("공지사항 등록 권한이 없습니다.");

      const saved = existing ? await updateNotice(record.id, record) : await createNotice(record);
      return { created: !existing, saved };
    },
    onSuccess: async ({ created, saved }) => {
      await queryClient.invalidateQueries({ queryKey: noticeQueryKeys.all });
      onSaved(saved, created);
    },
    onError: (error) => onError(error, "공지사항 저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!canDelete) throw new Error("공지사항 삭제 권한이 없습니다.");
      return deleteNotice(id);
    },
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: noticeQueryKeys.all });
      onDeleted(id);
    },
    onError: (error) => onError(error, "공지사항 삭제에 실패했습니다."),
  });

  return { deleteMutation, saveMutation };
}
