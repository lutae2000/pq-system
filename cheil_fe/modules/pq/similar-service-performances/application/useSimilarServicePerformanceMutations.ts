import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createSimilarServicePerformance,
  deleteSimilarServicePerformance,
  updateSimilarServicePerformance,
  type SimilarServicePerformanceRecord,
} from "@/modules/pq/similar-service-performances/api";
import { similarServicePerformanceQueryKeys } from "@/modules/pq/similar-service-performances/application/queryKeys";
import { toSimilarServicePerformanceRequest } from "@/modules/pq/similar-service-performances/similarServicePerformanceForm";

export function useSimilarServicePerformanceMutations({
  canCreate,
  canDelete,
  canUpdate,
  onDeleted,
  onError,
  onSaved,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  onDeleted: () => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: similarServicePerformanceQueryKeys.all });

  const saveMutation = useMutation({
    mutationFn: (record: SimilarServicePerformanceRecord) => {
      if (record.id && !canUpdate) throw new Error("수정 권한이 없습니다.");
      if (!record.id && !canCreate) throw new Error("등록 권한이 없습니다.");
      const request = toSimilarServicePerformanceRequest(record);
      if (!request.serviceName) throw new Error("용역명을 입력해 주세요.");
      return record.id ? updateSimilarServicePerformance(record.id, request) : createSimilarServicePerformance(request);
    },
    onSuccess: async () => {
      await invalidate();
      onSaved();
    },
    onError: (error) => onError(error, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: SimilarServicePerformanceRecord) => {
      if (!canDelete) throw new Error("삭제 권한이 없습니다.");
      if (!target.id) throw new Error("삭제할 대상을 찾을 수 없습니다.");
      return deleteSimilarServicePerformance(target.id);
    },
    onSuccess: async () => {
      await invalidate();
      onDeleted();
    },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });

  const updateWeightMutation = useMutation({
    mutationFn: (record: SimilarServicePerformanceRecord) => {
      if (!canUpdate) throw new Error("수정 권한이 없습니다.");
      if (!record.id) throw new Error("저장할 행을 찾을 수 없습니다.");
      return updateSimilarServicePerformance(record.id, toSimilarServicePerformanceRequest(record));
    },
    onSuccess: invalidate,
  });

  const bulkWeightMutation = useMutation({
    mutationFn: ({ rows, weight }: { rows: SimilarServicePerformanceRecord[]; weight: number }) => {
      if (!canUpdate) throw new Error("수정 권한이 없습니다.");
      return Promise.all(rows.map((row) => {
        if (!row.id) throw new Error("가중치를 저장할 행을 찾을 수 없습니다.");
        return updateSimilarServicePerformance(row.id, toSimilarServicePerformanceRequest({ ...row, weight }));
      }));
    },
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error) => onError(error, "가중치 일괄 저장에 실패했습니다."),
  });

  return { bulkWeightMutation, deleteMutation, saveMutation, updateWeightMutation };
}
