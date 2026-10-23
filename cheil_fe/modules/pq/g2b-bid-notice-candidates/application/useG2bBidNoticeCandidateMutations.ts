"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteG2bBidNoticeCandidates, syncG2bBidNoticeCandidates } from "@/modules/pq/g2b-bid-notice-candidates/api";
import { g2bBidNoticeCandidateQueryKeys } from "@/modules/pq/g2b-bid-notice-candidates/application/queryKeys";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";

export function useG2bBidNoticeCandidateMutations({ onDeleted, onError, onInputSaved, onSyncCompleted, saveInput }: {
  onDeleted: () => void;
  onError: (error: unknown) => void;
  onInputSaved: (saved: BidNoticeApiRecord) => void;
  onSyncCompleted: (result: Awaited<ReturnType<typeof syncG2bBidNoticeCandidates>>) => void;
  saveInput: (command: { candidateId: number; draft: BidNoticeRecord }) => Promise<BidNoticeApiRecord>;
}) {
  const client = useQueryClient();
  const inputSaveMutation = useMutation({
    mutationFn: saveInput,
    onSuccess: async (saved) => {
      onInputSaved(saved);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["bid-notices"] }),
        client.invalidateQueries({ queryKey: g2bBidNoticeCandidateQueryKeys.all }),
        client.invalidateQueries({ queryKey: ["file-attachments", "BID_NOTICE", String(saved.bidSeq)] }),
      ]);
    },
    onError,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteG2bBidNoticeCandidates,
    onSuccess: async () => { onDeleted(); await client.invalidateQueries({ queryKey: g2bBidNoticeCandidateQueryKeys.all }); },
    onError,
  });
  const syncMutation = useMutation({
    mutationFn: syncG2bBidNoticeCandidates,
    onSuccess: async (result) => { onSyncCompleted(result); await Promise.all([client.invalidateQueries({ queryKey: g2bBidNoticeCandidateQueryKeys.all }), client.invalidateQueries({ queryKey: g2bBidNoticeCandidateQueryKeys.syncStatus() })]); },
    onError,
  });
  return { deleteMutation, inputSaveMutation, syncMutation };
}
