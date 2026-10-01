import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createCompanyPerformance,
  deleteCompanyPerformance,
  getCompanyPerformance,
  updateCompanyPerformance,
  type CompanyPerformanceRecord,
  type CompanyPerformanceUpsertRequest,
} from "@/modules/pq/company-performance/api";
import { companyPerformanceQueryKeys } from "@/modules/pq/company-performance/application/queryKeys";

type Params = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  draftSeq: number;
  onDeleted: () => void;
  onDetailLoaded: (detail: CompanyPerformanceRecord) => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onSaved: (saved: CompanyPerformanceRecord) => void;
};

export function useCompanyPerformanceMutations({
  canCreate,
  canDelete,
  canUpdate,
  draftSeq,
  onDeleted,
  onDetailLoaded,
  onError,
  onSaved,
}: Params) {
  const queryClient = useQueryClient();
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: companyPerformanceQueryKeys.all });

  const detailMutation = useMutation({
    mutationFn: getCompanyPerformance,
    onSuccess: onDetailLoaded,
    onError: (error) => onError(error, "회사 실적 상세 조회에 실패했습니다."),
  });

  const saveMutation = useMutation({
    mutationFn: (requestBody: CompanyPerformanceUpsertRequest) => {
      if (draftSeq && !canUpdate) {
        throw new Error("수정 권한이 없습니다.");
      }
      if (!draftSeq && !canCreate) {
        throw new Error("등록 권한이 없습니다.");
      }
      return draftSeq ? updateCompanyPerformance(draftSeq, requestBody) : createCompanyPerformance(requestBody);
    },
    onSuccess: async (saved) => {
      await invalidateList();
      onSaved(saved);
    },
    onError: (error) => onError(error, "회사 실적 저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (seq: number) => {
      if (!canDelete) {
        throw new Error("삭제 권한이 없습니다.");
      }
      return deleteCompanyPerformance(seq);
    },
    onSuccess: async () => {
      await invalidateList();
      onDeleted();
    },
    onError: (error) => onError(error, "회사 실적 삭제에 실패했습니다."),
  });

  return { deleteMutation, detailMutation, saveMutation };
}
