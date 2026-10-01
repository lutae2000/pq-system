import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSystemPolicy,
  listSystemPolicies,
  updateSystemPolicy,
  type SystemPolicyRecord,
  type SystemPolicyWriteRequest,
} from "@/modules/system/policies/api";
import { systemPolicyQueryKeys } from "@/modules/system/policies/application/queryKeys";

const isValidPolicy = (policy: Pick<SystemPolicyRecord, "policyValue" | "useYn" | "valueType">) =>
  !policy.useYn || (Boolean(policy.policyValue.trim()) && (policy.valueType !== "NUMBER" || /^\d{1,3}$/.test(policy.policyValue)));

export function useSystemPolicyManagement({
  canCreate,
  canRead,
  canUpdate,
  onError,
  onCreated,
  onUpdated,
}: {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  onError: (error: unknown, fallback: string) => void;
  onCreated: () => void;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const policyQuery = useQuery({
    queryKey: systemPolicyQueryKeys.list(),
    queryFn: listSystemPolicies,
    enabled: canRead,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: systemPolicyQueryKeys.all });
  const updateMutation = useMutation({
    mutationFn: (policy: SystemPolicyRecord) => {
      if (!canUpdate) throw new Error("시스템 정책 수정 권한이 없습니다.");
      if (!isValidPolicy(policy)) throw new Error(`${policy.policyName}의 설정값을 확인해 주세요.`);
      return updateSystemPolicy(policy.policyKey, policy);
    },
    onSuccess: () => { onUpdated(); void invalidate(); },
    onError: (error) => { void invalidate(); onError(error, "시스템 정책을 수정하지 못했습니다."); },
  });
  const createMutation = useMutation({
    mutationFn: (request: SystemPolicyWriteRequest) => {
      if (!canCreate && !canUpdate) throw new Error("시스템 정책 추가 권한이 없습니다.");
      const policyKey = request.policyKey?.trim() ?? "";
      if (!policyKey || !request.policyName.trim()) throw new Error("정책 코드와 정책명을 입력해 주세요.");
      if (!isValidPolicy({ policyValue: request.policyValue, useYn: request.useYn, valueType: request.valueType })) throw new Error("사용 중인 정책의 설정값을 확인해 주세요.");
      return createSystemPolicy({ ...request, policyKey });
    },
    onSuccess: () => { onCreated(); void invalidate(); },
    onError: (error) => onError(error, "시스템 정책을 추가하지 못했습니다."),
  });
  const updateRecord = (policyKey: string, updater: (record: SystemPolicyRecord) => SystemPolicyRecord) => {
    queryClient.setQueryData<SystemPolicyRecord[]>(systemPolicyQueryKeys.list(), (records = []) =>
      records.map((record) => record.policyKey === policyKey ? updater(record) : record),
    );
  };
  return {
    createMutation,
    loading: policyQuery.isLoading || policyQuery.isFetching || updateMutation.isPending || createMutation.isPending,
    policyQuery,
    records: policyQuery.data ?? [],
    updateMutation,
    updateRecord,
  };
}
