import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { WorkOverlapContractRecord } from "@/modules/work-overlap/contracts/api";

const WORK_OVERLAP_CONTRACTS_API = "/work-overlap-contracts";

export type WorkOverlapEngineerContractRecord = WorkOverlapContractRecord & {
  participationType: string | null;
  pqTargetYn: boolean | null;
  remainDate: number | null;
  checkYn: boolean | null;
};

export type WorkOverlapEngineerContractPageResponse = {
  content: WorkOverlapEngineerContractRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

const normalizeDateQueryValue = (value: string | null | undefined) => {
  const normalized = value?.trim().replaceAll("-", "") ?? "";
  return normalized ? normalized : undefined;
};

export async function listWorkOverlapEngineerContracts(
  engineerId: string,
  params: {
    page: number;
    referenceDate: string;
    remainingDays: number;
    size: number;
  },
): Promise<WorkOverlapEngineerContractPageResponse> {
  return apiRequest(
    apiClient.get<WorkOverlapEngineerContractPageResponse>(
      `${WORK_OVERLAP_CONTRACTS_API}/engineers/${encodeURIComponent(engineerId)}`,
      {
        params: {
          page: Math.max(0, Math.trunc(params.page)),
          referenceDate: normalizeDateQueryValue(params.referenceDate),
          remainingDays: Math.max(1, Math.trunc(params.remainingDays)),
          size: Math.max(1, Math.trunc(params.size)),
        },
      },
    ),
    "참여 계약 현황을 불러오지 못했습니다.",
  );
}
