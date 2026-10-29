import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createBidNotice, deleteBidNotice, getBidNotice, updateBidNotice } from "@/modules/pq/bid-notice/bidNoticeApi";
import { bidNoticeQueryKeys } from "@/modules/pq/bid-notice/application/queryKeys";
import { toBidNoticeRecord, toBidNoticeRequest } from "@/modules/pq/bid-notice/application/mapper";
import { validateBidNoticeDraft } from "@/modules/pq/bid-notice/domain/rules";
import type { BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";

type Options = {
  canCreate: boolean;
  canDelete: boolean;
  canRead: boolean;
  canUpdate: boolean;
  onDeleted: () => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onSaved: (record: BidNoticeRecord) => void;
  participationOptions: ReadonlyArray<{ label: string; value: string }>;
};

export function useBidNoticeCommands({ canCreate, canDelete, canRead, canUpdate, onDeleted, onError, onSaved, participationOptions }: Options) {
  const queryClient = useQueryClient();

  const loadDetail = async (bidSeq: number) => {
    if (!canRead) throw new Error("조회 권한이 없습니다.");
    const detail = await getBidNotice(bidSeq);
    return toBidNoticeRecord(detail);
  };

  const saveMutation = useMutation({
    mutationFn: (draft: BidNoticeRecord) => {
      if (draft.seqNo && !canUpdate) throw new Error("수정 권한이 없습니다.");
      if (!draft.seqNo && !canCreate) throw new Error("등록 권한이 없습니다.");
      const validationError = validateBidNoticeDraft(draft, participationOptions);
      if (validationError) throw new Error(validationError);
      const request = toBidNoticeRequest(draft);
      return draft.seqNo ? updateBidNotice(draft.seqNo, request) : createBidNotice({ ...request, bidSeq: null });
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: bidNoticeQueryKeys.all });
      onSaved(toBidNoticeRecord(saved));
    },
    onError: (error) => onError(error, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (bidSeq: number) => {
      if (!canDelete) throw new Error("삭제 권한이 없습니다.");
      return deleteBidNotice(bidSeq);
    },
    onSuccess: (_data, bidSeq) => {
      void queryClient.invalidateQueries({ queryKey: bidNoticeQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: bidNoticeQueryKeys.attachments(bidSeq) });
      onDeleted();
    },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });

  return { deleteMutation, loadDetail, saveMutation };
}
