import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";
import type { CareerDetailRecord } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";

const ENGINEER_PERFORMANCE_DOCS_API = "/pq/engineer-performance-docs";

export type EngineerProjectHistoryReviewRecord = CareerDetailRecord & {
  bidSeq: number | null;
  engineerId: string;
  reviewId: number | null;
  sourceSeq: number;
  displayOrder: number | null;
  summary?: string | null;
  contractTerm?: string | null;
  workTerm?: string | null;
  workDays?: string | null;
  orderClient?: string | null;
  contractAmt?: number | null;
  ownAmt?: number | null;
  divisionRate?: number | null;
  contractFromDate?: string | null;
  contractToDate?: string | null;
  createdAt?: string | null;
  createdId?: string | null;
  lastChangedAt?: string | null;
  lastChangedId?: string | null;
};

export type EngineerProjectHistoryReviewListParams = {
  bidSeq: number;
  engineerId: string;
  relatedProjectHistoryConditions?: RelatedProjectHistoryCondition[];
};

export type EngineerProjectHistoryReviewSaveRequest = {
  bidSeq: number;
  engineerId: string;
  sourceSeq: number;
  displayOrder?: number;
  sourceRow: CareerDetailRecord;
};

export type EngineerProjectHistoryReviewDeleteRequest = {
  bidSeq: number;
  engineerId: string;
  reviewId: number;
};

export type EngineerProjectHistoryReviewSyncRequest = {
  bidSeq: number;
  engineerId: string;
  relatedProjectHistoryConditions?: RelatedProjectHistoryCondition[];
};

export type EngineerDocumentValueSettingRecord = {
  bidSeq: number;
  engineerId: string;
  educationId: number | null;
  licenseId: number | null;
};

export type EngineerDocumentValueSettingRequest = {
  bidSeq: number;
  engineerId: string;
  educationId: number | null;
  licenseId: number | null;
};

export async function listEngineerDocumentValueSettings(bidSeq: number): Promise<EngineerDocumentValueSettingRecord[]> {
  return apiRequest(
    apiClient.get<EngineerDocumentValueSettingRecord[]>(`${ENGINEER_PERFORMANCE_DOCS_API}/document-value-settings`, { params: { bidSeq } }),
    "기술인 문서 작성값 설정을 불러오지 못했습니다.",
  );
}

export async function saveEngineerDocumentValueSetting(request: EngineerDocumentValueSettingRequest): Promise<EngineerDocumentValueSettingRecord> {
  return apiRequest(
    apiClient.put<EngineerDocumentValueSettingRecord>(`${ENGINEER_PERFORMANCE_DOCS_API}/document-value-settings`, request),
    "기술인 문서 작성값 설정을 저장하지 못했습니다.",
  );
}

export async function listEngineerProjectHistoryReviewResults(
  params: EngineerProjectHistoryReviewListParams,
): Promise<EngineerProjectHistoryReviewRecord[]> {
  return apiRequest(
    apiClient.get<EngineerProjectHistoryReviewRecord[]>(`${ENGINEER_PERFORMANCE_DOCS_API}/review-results`, {
      params: {
        bidSeq: params.bidSeq,
        engineerId: params.engineerId,
      },
    }),
    "관련공사 참여이력 검토결과를 불러오지 못했습니다.",
  );
}

export async function listEngineerProjectHistories(
  params: string | { engineerId: string; relatedProjectHistoryConditions?: RelatedProjectHistoryCondition[] },
): Promise<EngineerProjectHistoryReviewRecord[]> {
  const engineerId = typeof params === "string" ? params : params.engineerId;
  const conditions = typeof params === "string" ? undefined : params.relatedProjectHistoryConditions;
  return apiRequest(
    apiClient.get<EngineerProjectHistoryReviewRecord[]>(`${ENGINEER_PERFORMANCE_DOCS_API}/project-histories`, {
      params: {
        engineerId,
        relatedProjectHistoryConditions: conditions?.length ? JSON.stringify(conditions) : undefined,
      },
    }),
    "선택한 기술인의 프로젝트 이력을 불러오지 못했습니다.",
  );
}

export async function createEngineerProjectHistoryReviewResult(
  requestBody: EngineerProjectHistoryReviewSaveRequest,
): Promise<EngineerProjectHistoryReviewRecord> {
  return apiRequest(
    apiClient.post<EngineerProjectHistoryReviewRecord>(`${ENGINEER_PERFORMANCE_DOCS_API}/review-results`, requestBody),
    "관련공사 참여이력 검토결과를 추가하지 못했습니다.",
  );
}

export async function createEngineerProjectHistoryReviewResults(
  requestBodies: EngineerProjectHistoryReviewSaveRequest[],
): Promise<EngineerProjectHistoryReviewRecord[]> {
  if (requestBodies.length === 0) {
    return [];
  }

  return Promise.all(requestBodies.map((requestBody) => createEngineerProjectHistoryReviewResult(requestBody)));
}

export async function updateEngineerProjectHistoryReviewResult(
  requestBody: EngineerProjectHistoryReviewSaveRequest,
  reviewId: number,
): Promise<EngineerProjectHistoryReviewRecord> {
  return apiRequest(
    apiClient.put<EngineerProjectHistoryReviewRecord>(
      `${ENGINEER_PERFORMANCE_DOCS_API}/review-results/${encodeURIComponent(String(reviewId))}`,
      requestBody,
    ),
    "관련공사 참여이력 검토결과를 수정하지 못했습니다.",
  );
}

export async function deleteEngineerProjectHistoryReviewResult(params: EngineerProjectHistoryReviewDeleteRequest): Promise<void> {
  await apiRequest(
    apiClient.delete(
      `${ENGINEER_PERFORMANCE_DOCS_API}/review-results/${encodeURIComponent(String(params.bidSeq))}/${encodeURIComponent(
        params.engineerId,
      )}/${encodeURIComponent(String(params.reviewId))}`,
    ),
    "관련공사 참여이력 검토결과를 삭제하지 못했습니다.",
  );
}

export async function syncEngineerProjectHistoryReviewResults(
  params: EngineerProjectHistoryReviewSyncRequest,
): Promise<EngineerProjectHistoryReviewRecord[]> {
  return apiRequest(
    apiClient.post<EngineerProjectHistoryReviewRecord[]>(`${ENGINEER_PERFORMANCE_DOCS_API}/review-results/sync`, {
      bidSeq: params.bidSeq,
      engineerId: params.engineerId,
      relatedProjectHistoryConditions:
        params.relatedProjectHistoryConditions && params.relatedProjectHistoryConditions.length > 0
          ? JSON.stringify(params.relatedProjectHistoryConditions)
          : undefined,
    }),
    "관련공사 참여이력 검토결과를 자동 반영하지 못했습니다.",
  );
}
