import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addCompanyPerformanceDocumentTargets,
  addCompanyPerformanceDocumentTargetsByConditions,
  deleteCompanyPerformanceDocumentTarget,
  updateCompanyPerformanceDocumentTargetDisplayOrder,
} from "@/modules/pq/company-performance/api";
import { companyPerformanceDocumentsQueryKeys } from "@/modules/pq/company-performance-docs/application/queryKeys";

export function useCompanyPerformanceDocumentsMutations({
  canDelete,
  canUpdate,
}: {
  canDelete: boolean;
  canUpdate: boolean;
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: companyPerformanceDocumentsQueryKeys.all });
  const addTargetsMutation = useMutation({
    mutationFn: (request: Parameters<typeof addCompanyPerformanceDocumentTargets>[0]) => {
      if (!canUpdate) throw new Error("회사실적 문서 대상 추가 권한이 없습니다.");
      return addCompanyPerformanceDocumentTargets(request);
    },
    onSuccess: invalidate,
  });
  const addTargetsByConditionsMutation = useMutation({
    mutationFn: (request: Parameters<typeof addCompanyPerformanceDocumentTargetsByConditions>[0]) => {
      if (!canUpdate) throw new Error("조건 적용 회사실적 저장 권한이 없습니다.");
      return addCompanyPerformanceDocumentTargetsByConditions(request);
    },
    onSuccess: invalidate,
  });
  const deleteTargetMutation = useMutation({
    mutationFn: ({ bidSeq, targetIds }: { bidSeq: number; targetIds: number[] }) => {
      if (!canDelete) throw new Error("회사실적 문서 대상 삭제 권한이 없습니다.");
      return Promise.all(targetIds.map((targetId) => deleteCompanyPerformanceDocumentTarget(bidSeq, targetId)));
    },
    onSuccess: invalidate,
  });
  const updateDisplayOrderMutation = useMutation({
    mutationFn: ({ bidSeq, rows }: { bidSeq: number; rows: Array<{ targetId: number; displayOrder: number }> }) => {
      if (!canUpdate) throw new Error("회사실적 순번 수정 권한이 없습니다.");
      return Promise.all(rows.map((row) => updateCompanyPerformanceDocumentTargetDisplayOrder(bidSeq, row.targetId, row.displayOrder)));
    },
    onSuccess: invalidate,
  });

  return { addTargetsByConditionsMutation, addTargetsMutation, deleteTargetMutation, updateDisplayOrderMutation };
}
