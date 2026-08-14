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

export async function listSystemPolicies(): Promise<SystemPolicyRecord[]> {
  return apiRequest(apiClient.get<SystemPolicyRecord[]>("/system/policies"), "시스템 정책 목록을 불러오지 못했습니다.");
}

export async function saveSystemPolicies(items: SystemPolicyRecord[]): Promise<SystemPolicyRecord[]> {
  return apiRequest(apiClient.put<SystemPolicyRecord[]>("/system/policies", { items }), "시스템 정책을 저장하지 못했습니다.");
}
