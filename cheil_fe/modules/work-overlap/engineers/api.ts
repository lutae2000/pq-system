import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { WorkOverlapContractRecord } from "@/modules/work-overlap/contracts/api";

const WORK_OVERLAP_CONTRACTS_API = "/work-overlap-contracts";

export type WorkOverlapEngineerContractRecord = WorkOverlapContractRecord & {
  participationType: string | null;
  pqTargetYn: boolean | null;
  remainDate: number | null;
  checkYn: boolean | null;
  beforeEngineerId: string | null;
  afterEngineerId: string | null;
  engineerHistoryYn: boolean | null;
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

export type WorkOverlapDocumentTargetRecord = {
  targetId: number;
  bidSeq: number;
  workDutyId: string;
  engineerId: string;
  contractNo: string;
  displayOrder: number | null;
  responsibility: string | null;
};

export type WorkOverlapDocumentTargetItem = {
  contractNo: string;
  displayOrder: number | null;
  responsibility: string;
};

export type WorkOverlapDocumentSavedContractRecord = {
  targetId: number;
  displayOrder: number | null;
  responsibility: string | null;
  contract: WorkOverlapEngineerContractRecord;
};

export type WorkOverlapDocumentEngineerContractsResponse = {
  availableContracts: WorkOverlapEngineerContractPageResponse;
  savedContracts: WorkOverlapDocumentSavedContractRecord[];
};

const normalizeDateQueryValue = (value: string | null | undefined) => {
  const normalized = value?.trim().replaceAll("-", "") ?? "";
  return normalized ? normalized : undefined;
};

export async function listWorkOverlapEngineerContracts(
  engineerId: string,
  params: {
    excludeCompleted?: boolean;
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
          excludeCompleted: params.excludeCompleted ?? false,
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

export async function listWorkOverlapDocumentEngineerContracts(
  engineerId: string,
  bidSeq: number,
  params: { page: number; referenceDate: string; remainingDays: number; size: number; workDutyId: string },
): Promise<WorkOverlapDocumentEngineerContractsResponse> {
  return apiRequest(
    apiClient.get<WorkOverlapDocumentEngineerContractsResponse>(
      "/work-overlap-docs/engineers/" + encodeURIComponent(engineerId),
      {
        params: {
          bidSeq,
          workDutyId: params.workDutyId,
          page: Math.max(0, Math.trunc(params.page)),
          referenceDate: normalizeDateQueryValue(params.referenceDate),
          remainingDays: Math.max(1, Math.trunc(params.remainingDays)),
          size: Math.max(1, Math.trunc(params.size)),
        },
      },
    ),
    "업무중복도 계약 내역을 불러오지 못했습니다.",
  );
}

export async function listWorkOverlapDocumentTargets(
  bidSeq: number,
  workDutyId: string,
  engineerId: string,
): Promise<WorkOverlapDocumentTargetRecord[]> {
  return apiRequest(
    apiClient.get<WorkOverlapDocumentTargetRecord[]>("/pq/work-overlap-document-targets", {
      params: { bidSeq, workDutyId, engineerId },
    }),
    "저장된 업무중복도 계약을 불러오지 못했습니다.",
  );
}

export async function replaceWorkOverlapDocumentTargets(requestBody: {
  bidSeq: number;
  workDutyId: string;
  engineerId: string;
  contracts: WorkOverlapDocumentTargetItem[];
}): Promise<WorkOverlapDocumentTargetRecord[]> {
  return apiRequest(
    apiClient.post<WorkOverlapDocumentTargetRecord[]>("/pq/work-overlap-document-targets", requestBody),
    "업무중복도 계약을 저장하지 못했습니다.",
  );
}

export async function deleteWorkOverlapDocumentTarget(bidSeq: number, workDutyId: string, engineerId: string, contractNo: string): Promise<void> {
  await apiRequest(
    apiClient.delete("/pq/work-overlap-document-targets", { params: { bidSeq, workDutyId, engineerId, contractNo } }),
    "저장된 업무중복도 계약을 삭제하지 못했습니다.",
  );
}

export type WorkOverlapDocumentEngineerRecord = {
  targetId: number;
  bidSeq: number;
  workDutyId: string;
  engrId: string;
  displayOrder: number | null;
  responsibility: string | null;
  nameKor: string | null;
  birthday: string | null;
  deptName: string | null;
  grade: string | null;
  dutyPart: string | null;
  proPart: string | null;
  retireYn: string | null;
};

export async function listWorkOverlapDocumentEngineers(bidSeq: number, workDutyId: string, keyword?: string): Promise<WorkOverlapDocumentEngineerRecord[]> {
  return apiRequest(
    apiClient.get<WorkOverlapDocumentEngineerRecord[]>("/pq/work-overlap-document-engineers", { params: { bidSeq, workDutyId, keyword: keyword?.trim() || undefined } }),
    "업무중복도 문서 대상 기술인 목록을 불러오지 못했습니다.",
  );
}

export async function replaceWorkOverlapDocumentEngineers(requestBody: {
  bidSeq: number;
  workDutyId: string;
  engineers: Array<{
    engrId: string;
    displayOrder: number | null;
    responsibility: string | null;
  }>;
}): Promise<WorkOverlapDocumentEngineerRecord[]> {
  return apiRequest(
    apiClient.put<WorkOverlapDocumentEngineerRecord[]>("/pq/work-overlap-document-engineers", requestBody),
    "업무중복도 문서 대상 기술인을 저장하지 못했습니다.",
  );
}

export async function updateWorkOverlapDocumentEngineer(requestBody: {
  bidSeq: number;
  workDutyId: string;
  engrId: string;
  displayOrder: number | null;
  responsibility: string | null;
}): Promise<void> {
  await apiRequest(
    apiClient.patch("/pq/work-overlap-document-engineers", requestBody),
    "업무중복도 문서 대상 기술인 정보를 수정하지 못했습니다.",
  );
}

export async function deleteWorkOverlapDocumentEngineer(bidSeq: number, workDutyId: string, engineerId: string): Promise<void> {
  await apiRequest(
    apiClient.delete("/pq/work-overlap-document-engineers", { params: { bidSeq, workDutyId, engrId: engineerId } }),
    "업무중복도 문서 대상 기술인을 삭제하지 못했습니다.",
  );
}

export async function generateWorkOverlapHwpxDocuments(requestBody: {
  bidSeq: number;
  workDutyId: string;
  includeParticipantList: boolean;
}): Promise<Blob> {
  return apiRequest(
    apiClient.post<Blob>("/work-overlap-docs/hwpx/generate", requestBody, { responseType: "blob" }),
    "업무중복도 HWPX 문서 생성에 실패했습니다.",
  );
}

export type WorkOverlapHwpxTemplateGenerateRequest = {
  bidSeq: number;
  engineerIds: string[];
  referenceDate: string;
  workDutyId: string;
  mappings: Record<string, string>;
};

export function generateWorkOverlapHwpxTemplateDocument(template: File, requestBody: WorkOverlapHwpxTemplateGenerateRequest) {
  const formData = new FormData();
  formData.append("template", template);
  formData.append("request", new Blob([JSON.stringify(requestBody)], { type: "application/json" }));
  return apiRequest(
    apiClient.post<Blob>("/work-overlap-docs/hwpx/template/generate", formData, { responseType: "blob" }),
    "업무중복도 HWPX 문서 생성에 실패했습니다.",
  );
}
