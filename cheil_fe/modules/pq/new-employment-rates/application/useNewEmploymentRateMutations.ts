import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createNewEmploymentEmployee,
  createNewEmploymentMonthlyStatus,
  deleteNewEmploymentEmployee,
  deleteNewEmploymentMonthlyStatus,
  updateNewEmploymentEmployee,
  updateNewEmploymentMonthlyStatus,
  type NewEmploymentEmployeeRecord,
  type NewEmploymentEmployeeRequest,
  type NewEmploymentMonthlyStatusRecord,
  type NewEmploymentMonthlyStatusRequest,
} from "@/modules/pq/new-employment-rates/api";
import { newEmploymentRateQueryKeys } from "@/modules/pq/new-employment-rates/application/queryKeys";

type Params = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  draftId: number;
  onEmployeeDeleted: () => void;
  onEmployeeSaved: (saved: NewEmploymentEmployeeRecord) => void;
  onMonthlyStatusDeleted: () => void;
  onMonthlyStatusSaved: (saved: NewEmploymentMonthlyStatusRecord) => void;
  onError: (error: unknown, fallbackMessage: string) => void;
};

export function useNewEmploymentRateMutations({
  canCreate,
  canDelete,
  canUpdate,
  draftId,
  onEmployeeDeleted,
  onEmployeeSaved,
  onMonthlyStatusDeleted,
  onMonthlyStatusSaved,
  onError,
}: Params) {
  const queryClient = useQueryClient();
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: newEmploymentRateQueryKeys.all });

  const monthlyStatusSaveMutation = useMutation({
    mutationFn: ({ request, row }: { request: NewEmploymentMonthlyStatusRequest; row: { id: number; isNew?: boolean } }) => {
      if (row.isNew && !canCreate) throw new Error("등록 권한이 없습니다.");
      if (!row.isNew && !canUpdate) throw new Error("수정 권한이 없습니다.");
      return row.isNew ? createNewEmploymentMonthlyStatus(request) : updateNewEmploymentMonthlyStatus(row.id, request);
    },
    onSuccess: async (saved) => {
      await invalidate();
      onMonthlyStatusSaved({ ...saved, isNew: false });
    },
    onError: (error) => onError(error, "월별 고용현황 저장에 실패했습니다."),
  });

  const monthlyStatusDeleteMutation = useMutation({
    mutationFn: (row: { id: number; isNew?: boolean }) => {
      if (!canDelete) throw new Error("삭제 권한이 없습니다.");
      return row.isNew ? Promise.resolve() : deleteNewEmploymentMonthlyStatus(row.id);
    },
    onSuccess: async () => {
      await invalidate();
      onMonthlyStatusDeleted();
    },
    onError: (error) => onError(error, "월별 고용현황 삭제에 실패했습니다."),
  });

  const saveMutation = useMutation({
    mutationFn: (request: NewEmploymentEmployeeRequest) => {
      if (draftId > 0 && !canUpdate) throw new Error("수정 권한이 없습니다.");
      if (draftId === 0 && !canCreate) throw new Error("등록 권한이 없습니다.");
      if (!request.employeeName) throw new Error("이름을 입력해 주세요.");
      if (!request.hireDate) throw new Error("입사일을 입력해 주세요.");
      if (!request.departmentCode) throw new Error("부서를 선택해 주세요.");
      if (!request.baseYearMonth) throw new Error("기준년월을 입력해 주세요.");
      return draftId > 0 ? updateNewEmploymentEmployee(draftId, request) : createNewEmploymentEmployee(request);
    },
    onSuccess: async (saved) => {
      await invalidate();
      onEmployeeSaved(saved);
    },
    onError: (error) => onError(error, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: NewEmploymentEmployeeRecord) => {
      if (!canDelete) throw new Error("삭제 권한이 없습니다.");
      return deleteNewEmploymentEmployee(target.id);
    },
    onSuccess: async () => {
      await invalidate();
      onEmployeeDeleted();
    },
    onError: (error) => onError(error, "삭제에 실패했습니다."),
  });

  return { deleteMutation, monthlyStatusDeleteMutation, monthlyStatusSaveMutation, saveMutation };
}
