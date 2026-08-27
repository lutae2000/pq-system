import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type SystemPolicyRecord = {
  description: string | null;
  policyKey: string;
  policyName: string;
  policyValue: string;
  sortSeq: number;
  useYn: boolean;
  valueType: "BOOLEAN" | "NUMBER" | "TEXT";
};

export type SystemPolicyWriteRequest = Omit<SystemPolicyRecord, "policyKey"> & {
  policyKey?: string;
};

export async function listSystemPolicies(): Promise<SystemPolicyRecord[]> {
  return apiRequest(apiClient.get<SystemPolicyRecord[]>("/system/policies"), "시스템 정책 목록을 불러오지 못했습니다.");
}

export async function createSystemPolicy(request: SystemPolicyWriteRequest): Promise<SystemPolicyRecord> {
  return apiRequest(apiClient.post<SystemPolicyRecord>("/system/policies", request), "시스템 정책을 생성하지 못했습니다.");
}

export async function updateSystemPolicy(policyKey: string, request: SystemPolicyWriteRequest): Promise<SystemPolicyRecord> {
  return apiRequest(apiClient.patch<SystemPolicyRecord>(`/system/policies/${encodeURIComponent(policyKey)}`, request), "시스템 정책을 수정하지 못했습니다.");
}
