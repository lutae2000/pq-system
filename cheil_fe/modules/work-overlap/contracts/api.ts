import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const WORK_OVERLAP_CONTRACTS_API = "/work-overlap-contracts";

export const WORK_OVERLAP_CONTRACT_PAGE_SIZE = 100;

export type WorkOverlapContractRecord = {
  contractNo: string;
  serviceType: string | null;
  clientName: string | null;
  supervisingDepartmentCode?: string | null;
  serviceName: string;
  constructionStartDate: string | null;
  constructionCompleteDate: string | null;
  managementServiceCompleteDate: string | null;
  constructionStopFromDate: string | null;
  constructionStopToDate: string | null;
  restartDate: string | null;
  contractAmount: number | null;
  shareAmount: number | null;
  performanceCertification: string | null;
  participateListDocument: string | null;
  cemsConfirm: string | null;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type WorkOverlapContractPageResponse = {
  content: WorkOverlapContractRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type WorkOverlapContractSearchParams = {
  keyword: string;
  serviceType: string;
  clientName: string;
  engineerName: string;
  constructionStartDateFrom: string;
  constructionStartDateTo: string;
  performanceCertification: string;
  participateListDocument: string;
  cemsConfirm: string;
  status: string;
  referenceDate: string;
  page: number;
  size: number;
};

export type WorkOverlapContractSummaryParams = Omit<
  WorkOverlapContractSearchParams,
  "page" | "size"
> & {};

export type WorkOverlapContractSummaryResponse = {
  progressCount: number;
  completedCount: number;
  stoppedCount: number;
  processedCount: number;
  unprocessedCount: number;
  contractCount: number;
  contractAmount: number;
};

export type WorkOverlapContractRequest = Omit<
  WorkOverlapContractRecord,
  "contractNo" | "createdAt" | "createdId" | "lastChangedAt" | "lastChangedId"
> & {
  periodChangeReason: string | null;
};

export type WorkOverlapContractEngineerRecord = {
  isNew?: boolean;
  tempRowId?: number;
  engineerId: string | null;
  name: string | null;
  birthDate: string | null;
  field: string | null;
  participationDate: string | null;
  participationType: string | null;
  pqTargetYn: boolean | null;
  remark: string | null;
};

export type WorkOverlapContractEngineerRequest = Omit<
  WorkOverlapContractEngineerRecord,
  "isNew" | "tempRowId" | "name" | "birthDate"
>;

export type WorkOverlapContractEngineerChangeRequest = {
  beforeEngineerId: string | null;
  afterEngineerId: string | null;
  changeContent: string;
  field: string | null;
  participationDate: string | null;
  participationType: string | null;
  pqTargetYn: boolean | null;
  remark: string | null;
};

export type WorkOverlapContractEngineerHistoryRecord = {
  id: number;
  changedAt: string | null;
  beforeEngineerId: string | null;
  beforeEngineerName: string | null;
  afterEngineerId: string | null;
  afterEngineerName: string | null;
  changeContent: string | null;
};

export type WorkOverlapContractPeriodHistoryRecord = {
  id: number;
  changedAt: string | null;
  periodName: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  changeContent: string | null;
  changeReason: string | null;
};

export type WorkOverlapContractEngineerCandidate = {
  engineerId: string;
  name: string | null;
  birthDate: string | null;
  field: string | null;
};

const normalizeQueryValue = (value: string | null | undefined) => {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : undefined;
};

const normalizeDateQueryValue = (value: string | null | undefined) => {
  const normalized = value?.trim().replaceAll("-", "") ?? "";
  return normalized ? normalized : undefined;
};

export async function listWorkOverlapContracts(
  params: WorkOverlapContractSearchParams,
): Promise<WorkOverlapContractPageResponse> {
  return apiRequest(
    apiClient.get<WorkOverlapContractPageResponse>(WORK_OVERLAP_CONTRACTS_API, {
      params: {
        keyword: normalizeQueryValue(params.keyword),
        serviceType: normalizeQueryValue(params.serviceType),
        clientName: normalizeQueryValue(params.clientName),
        engineerName: normalizeQueryValue(params.engineerName),
        constructionStartDateFrom: normalizeDateQueryValue(
          params.constructionStartDateFrom,
        ),
        constructionStartDateTo: normalizeDateQueryValue(
          params.constructionStartDateTo,
        ),
        performanceCertification: normalizeQueryValue(
          params.performanceCertification,
        ),
        participateListDocument: normalizeQueryValue(
          params.participateListDocument,
        ),
        cemsConfirm: normalizeQueryValue(params.cemsConfirm),
        status: normalizeQueryValue(params.status),
        referenceDate: normalizeDateQueryValue(params.referenceDate),
        page: Math.max(0, Math.trunc(params.page)),
        size: Math.max(1, Math.trunc(params.size)),
      },
    }),
    "업무중복도 계약 목록을 불러오지 못했습니다.",
  );
}

export async function getWorkOverlapContractSummary(
  params: WorkOverlapContractSummaryParams,
): Promise<WorkOverlapContractSummaryResponse> {
  return apiRequest(
    apiClient.get<WorkOverlapContractSummaryResponse>(
      `${WORK_OVERLAP_CONTRACTS_API}/summary`,
      {
        params: {
          keyword: normalizeQueryValue(params.keyword),
          serviceType: normalizeQueryValue(params.serviceType),
          clientName: normalizeQueryValue(params.clientName),
          engineerName: normalizeQueryValue(params.engineerName),
          constructionStartDateFrom: normalizeDateQueryValue(
            params.constructionStartDateFrom,
          ),
          constructionStartDateTo: normalizeDateQueryValue(
            params.constructionStartDateTo,
          ),
          performanceCertification: normalizeQueryValue(
            params.performanceCertification,
          ),
          participateListDocument: normalizeQueryValue(
            params.participateListDocument,
          ),
          cemsConfirm: normalizeQueryValue(params.cemsConfirm),
          status: normalizeQueryValue(params.status),
          referenceDate: normalizeDateQueryValue(params.referenceDate),
        },
      },
    ),
    "업무중복도 계약 요약을 불러오지 못했습니다.",
  );
}

export async function getWorkOverlapContract(
  contractNo: string,
): Promise<WorkOverlapContractRecord> {
  return apiRequest(
    apiClient.get<WorkOverlapContractRecord>(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}`,
    ),
    "업무중복도 계약 정보를 불러오지 못했습니다.",
  );
}

export async function createWorkOverlapContract(
  requestBody: WorkOverlapContractRequest,
): Promise<WorkOverlapContractRecord> {
  return apiRequest(
    apiClient.post<WorkOverlapContractRecord>(
      WORK_OVERLAP_CONTRACTS_API,
      requestBody,
    ),
    "업무중복도 계약 정보를 저장하지 못했습니다.",
  );
}

export async function updateWorkOverlapContract(
  contractNo: string,
  requestBody: WorkOverlapContractRequest,
): Promise<WorkOverlapContractRecord> {
  return apiRequest(
    apiClient.put<WorkOverlapContractRecord>(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}`,
      requestBody,
    ),
    "업무중복도 계약 정보를 저장하지 못했습니다.",
  );
}

export async function deleteWorkOverlapContract(
  contractNo: string,
): Promise<void> {
  await apiRequest(
    apiClient.delete(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}`,
    ),
    "업무중복도 계약 정보를 삭제하지 못했습니다.",
  );
}

export async function listWorkOverlapContractEngineers(
  contractNo: string,
): Promise<WorkOverlapContractEngineerRecord[]> {
  return apiRequest(
    apiClient.get<WorkOverlapContractEngineerRecord[]>(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}/engineers`,
    ),
    "참여기술인 목록을 불러오지 못했습니다.",
  );
}

export async function listWorkOverlapContractEngineerHistories(
  contractNo: string,
): Promise<WorkOverlapContractEngineerHistoryRecord[]> {
  return apiRequest(
    apiClient.get<WorkOverlapContractEngineerHistoryRecord[]>(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}/engineer-histories`,
    ),
    "참여기술인 변경이력을 불러오지 못했습니다.",
  );
}

export async function listWorkOverlapContractPeriodHistories(
  contractNo: string,
): Promise<WorkOverlapContractPeriodHistoryRecord[]> {
  return apiRequest(
    apiClient.get<WorkOverlapContractPeriodHistoryRecord[]>(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}/period-histories`,
    ),
    "기간정보 변경이력을 불러오지 못했습니다.",
  );
}

export async function deleteWorkOverlapContractEngineerHistory(
  contractNo: string,
  historyId: number,
): Promise<void> {
  await apiRequest(
    apiClient.delete(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}/engineer-histories/${encodeURIComponent(historyId)}`,
    ),
    "참여기술인 변경이력을 삭제하지 못했습니다.",
  );
}

export async function deleteWorkOverlapContractPeriodHistory(
  contractNo: string,
  historyId: number,
): Promise<void> {
  await apiRequest(
    apiClient.delete(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}/period-histories/${encodeURIComponent(historyId)}`,
    ),
    "기간정보 변경이력을 삭제하지 못했습니다.",
  );
}

export async function listWorkOverlapContractEngineerCandidates(
  params: { keyword?: string; limit?: number } = {},
): Promise<WorkOverlapContractEngineerCandidate[]> {
  return apiRequest(
    apiClient.get<WorkOverlapContractEngineerCandidate[]>(
      `${WORK_OVERLAP_CONTRACTS_API}/engineer-candidates`,
      {
        params: {
          keyword: normalizeQueryValue(params.keyword),
          limit: params.limit ?? 30,
        },
      },
    ),
    "기술인 인사정보를 불러오지 못했습니다.",
  );
}

export async function createWorkOverlapContractEngineer(
  contractNo: string,
  requestBody: WorkOverlapContractEngineerRequest,
): Promise<WorkOverlapContractEngineerRecord> {
  return apiRequest(
    apiClient.post<WorkOverlapContractEngineerRecord>(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}/engineers`,
      requestBody,
    ),
    "참여기술인을 저장하지 못했습니다.",
  );
}

export async function updateWorkOverlapContractEngineer(
  contractNo: string,
  engineerId: string,
  requestBody: WorkOverlapContractEngineerChangeRequest,
): Promise<WorkOverlapContractEngineerRecord> {
  return apiRequest(
    apiClient.put<WorkOverlapContractEngineerRecord>(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}/engineers/${encodeURIComponent(engineerId)}`,
      requestBody,
    ),
    "참여기술인을 수정하지 못했습니다.",
  );
}

export async function deleteWorkOverlapContractEngineer(
  contractNo: string,
  engineerId: string,
): Promise<void> {
  await apiRequest(
    apiClient.delete(
      `${WORK_OVERLAP_CONTRACTS_API}/${encodeURIComponent(contractNo)}/engineers/${encodeURIComponent(engineerId)}`,
    ),
    "참여기술인을 삭제하지 못했습니다.",
  );
}
