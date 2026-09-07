import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const COMPANY_PERFORMANCES_API = "/pq/company-performances";
export const COMPANY_PERFORMANCE_PAGE_SIZE = 100;

export type CompanyPerformanceRecord = {
  seq: number;
  jobSeq: number | null;
  jobName: string | null;
  jobOwnYn: boolean;
  generalManagementYn: boolean;
  contractFromDate: string | null;
  contractToDate: string | null;
  jobFinishYn: string | null;
  stopDate: string | null;
  summary: string | null;
  jobType: string | null;
  jobRatio: string | null;
  contractAmt: number | null;
  ownAmt: number | null;
  orderClient: string | null;
  remark: string | null;
  divisionRate: number | null;
  clientKind: string | null;
  businessType: string | null;
  overseeYn: boolean;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type CompanyPerformancePageResponse = {
  content: CompanyPerformanceRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type CompanyPerformanceSearchParams = {
  keyword: string;
  businessType: string;
  clientKind: string;
  jobOwnYn: "All" | "Y" | "N";
  jobFinishYn: "All" | string;
  contractFromDate: string;
  contractToDate: string;
  excludeDocumentTargetBidSeq?: number | null;
  page: number;
  size: number;
};

export type CompanyPerformanceUpsertRequest = Omit<
  CompanyPerformanceRecord,
  "seq" | "createdAt" | "lastChangedAt"
>;

export type CompanyPerformanceEngineerRecord = {
  id: number;
  isNew?: boolean;
  engineerId: string | null;
  name: string | null;
  participationStartDate: string | null;
  participationEndDate: string | null;
  category: string | null;
  participationFieldPosition: string | null;
  actualParticipationYn: string | null;
  reportYn: string | null;
  participationGrade: number | null;
  companyAtParticipation: string | null;
  departmentAtParticipation: string | null;
  positionAtParticipation: string | null;
  duty: string | null;
  jobField: string | null;
  specialtyField: string | null;
  method: string | null;
  remark: string | null;
};

export type CompanyPerformanceEngineerRequest = Omit<CompanyPerformanceEngineerRecord, "id" | "isNew" | "name">;

export type CompanyPerformanceEngineerCandidate = {
  engineerId: string;
  name: string | null;
  department: string | null;
  position: string | null;
};

export type CompanyPerformanceConstructionKindRecord = {
  id: number;
  isNew?: boolean;
  seq: number;
  level1Code: string | null;
  level2Code: string | null;
  level3Code: string | null;
};

export type CompanyPerformanceConstructionKindRequest = Omit<
  CompanyPerformanceConstructionKindRecord,
  "id" | "isNew" | "seq"
>;

export type CompanyPerformanceContractPeriodRecord = {
  id: number;
  isNew?: boolean;
  seq: number;
  contractFromDate: string | null;
  contractToDate: string | null;
  monthCount: number | null;
  dayCount: number | null;
  sortSeq: number | null;
};

export type CompanyPerformanceContractPeriodRequest = Omit<
  CompanyPerformanceContractPeriodRecord,
  "id" | "isNew" | "seq" | "monthCount" | "dayCount"
>;

export type CompanyPerformanceOutlineRecord = {
  id: number;
  isNew?: boolean;
  seq: number;
  outlineGroupSeq: number | null;
  outlineLineSeq: number | null;
  categoryCode: string | null;
  subcategoryCode: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
  subcategoryUnit: string | null;
  outlineContent: string | null;
  ddlbYn: string | null;
  ddlbGroupCode: string | null;
  sortSeq: number | null;
};

export type CompanyPerformanceOutlineRequest = Omit<CompanyPerformanceOutlineRecord, "id" | "isNew" | "seq">;

const normalizeQueryValue = (value: string | number | boolean | null | undefined) => {
  if (value === undefined || value === null || value === "" || value === "All") {
    return undefined;
  }
  return value;
};

export async function listCompanyPerformances(params: CompanyPerformanceSearchParams): Promise<CompanyPerformancePageResponse> {
  return apiRequest(
    apiClient.get<CompanyPerformancePageResponse>(COMPANY_PERFORMANCES_API, {
      params: {
        keyword: normalizeQueryValue(params.keyword.trim()),
        businessType: normalizeQueryValue(params.businessType.trim()),
        clientKind: normalizeQueryValue(params.clientKind.trim()),
        jobOwnYn: params.jobOwnYn === "All" ? undefined : params.jobOwnYn === "Y",
        jobFinishYn: params.jobFinishYn === "All" ? undefined : params.jobFinishYn,
        contractFromDate: normalizeQueryValue(params.contractFromDate),
        contractToDate: normalizeQueryValue(params.contractToDate),
        excludeDocumentTargetBidSeq: normalizeQueryValue(params.excludeDocumentTargetBidSeq),
        page: Math.max(0, Math.trunc(params.page)),
        size: Math.max(1, Math.trunc(params.size)),
      },
    }),
    "회사실적 목록을 불러오지 못했습니다.",
  );
}

export async function listAllCompanyPerformances(params: CompanyPerformanceSearchParams): Promise<CompanyPerformanceRecord[]> {
  return apiRequest(
    apiClient.get<CompanyPerformanceRecord[]>(`${COMPANY_PERFORMANCES_API}/all`, {
      params: {
        keyword: normalizeQueryValue(params.keyword.trim()),
        businessType: normalizeQueryValue(params.businessType.trim()),
        clientKind: normalizeQueryValue(params.clientKind.trim()),
        jobOwnYn: params.jobOwnYn === "All" ? undefined : params.jobOwnYn === "Y",
        jobFinishYn: params.jobFinishYn === "All" ? undefined : params.jobFinishYn,
        contractFromDate: normalizeQueryValue(params.contractFromDate),
        contractToDate: normalizeQueryValue(params.contractToDate),
        excludeDocumentTargetBidSeq: normalizeQueryValue(params.excludeDocumentTargetBidSeq),
      },
    }),
    "조건 적용 회사실적을 불러오지 못했습니다.",
  );
}

export type CompanyPerformanceDocumentTarget = {
  targetId: number;
  bidSeq: number;
  companyPerformanceSeq: number;
  displayOrder: number | null;
  companyPerformance: CompanyPerformanceRecord | null;
};

export async function listCompanyPerformanceDocumentTargets(bidSeq: number): Promise<CompanyPerformanceDocumentTarget[]> {
  return apiRequest(
    apiClient.get<CompanyPerformanceDocumentTarget[]>("/pq/company-performance-document-targets", { params: { bidSeq } }),
    "조건 적용 회사실적을 불러오지 못했습니다.",
  );
}

export async function addCompanyPerformanceDocumentTargets(request: { bidSeq: number; companyPerformanceSeqs: number[] }) {
  return apiRequest(
    apiClient.post<CompanyPerformanceDocumentTarget[]>("/pq/company-performance-document-targets", request),
    "회사실적 문서 대상을 추가하지 못했습니다.",
  );
}

export async function addCompanyPerformanceDocumentTargetsByConditions(request: {
  bidSeq: number;
  conditions: unknown[];
}) {
  return apiRequest(
    apiClient.post<CompanyPerformanceDocumentTarget[]>("/pq/company-performance-document-targets/conditions", request),
    "조건에 맞는 회사실적을 추가하지 못했습니다.",
  );
}

export async function deleteCompanyPerformanceDocumentTarget(bidSeq: number, targetId: number): Promise<void> {
  return apiRequest(
    apiClient.delete(`/pq/company-performance-document-targets/${encodeURIComponent(String(targetId))}`, { params: { bidSeq } }),
    "회사실적 문서 대상을 삭제하지 못했습니다.",
  );
}

export async function updateCompanyPerformanceDocumentTargetDisplayOrder(
  bidSeq: number,
  targetId: number,
  displayOrder: number,
): Promise<void> {
  return apiRequest(
    apiClient.put(`/pq/company-performance-document-targets/${encodeURIComponent(String(targetId))}/display-order`, { displayOrder }, { params: { bidSeq } }),
    "회사실적 순번을 저장하지 못했습니다.",
  );
}

export async function getCompanyPerformance(seq: number): Promise<CompanyPerformanceRecord> {
  return apiRequest(
    apiClient.get<CompanyPerformanceRecord>(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}`),
    "회사실적 정보를 불러오지 못했습니다.",
  );
}

export async function listCompanyPerformanceEngineers(seq: number): Promise<CompanyPerformanceEngineerRecord[]> {
  return apiRequest(
    apiClient.get<CompanyPerformanceEngineerRecord[]>(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/engineers`),
    "참여기술인 목록을 불러오지 못했습니다.",
  );
}

export async function listCompanyPerformanceEngineerCandidates(params: { keyword?: string; limit?: number } = {}): Promise<CompanyPerformanceEngineerCandidate[]> {
  return apiRequest(
    apiClient.get<CompanyPerformanceEngineerCandidate[]>(`${COMPANY_PERFORMANCES_API}/engineer-candidates`, {
      params: {
        keyword: normalizeQueryValue(params.keyword?.trim()),
        limit: params.limit ?? 30,
      },
    }),
    "참여기술인 목록을 불러오지 못했습니다.",
  );
}

export async function createCompanyPerformanceEngineer(
  seq: number,
  requestBody: CompanyPerformanceEngineerRequest,
): Promise<CompanyPerformanceEngineerRecord> {
  return apiRequest(
    apiClient.post<CompanyPerformanceEngineerRecord>(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/engineers`, requestBody),
    "참여기술인를 저장하지 못했습니다.",
  );
}

export async function updateCompanyPerformanceEngineer(
  seq: number,
  engineerHistoryId: number,
  requestBody: CompanyPerformanceEngineerRequest,
): Promise<CompanyPerformanceEngineerRecord> {
  return apiRequest(
    apiClient.put<CompanyPerformanceEngineerRecord>(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/engineers/${encodeURIComponent(String(engineerHistoryId))}`,
      requestBody,
    ),
    "참여기술인를 저장하지 못했습니다.",
  );
}

export async function deleteCompanyPerformanceEngineer(seq: number, engineerHistoryId: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/engineers/${encodeURIComponent(String(engineerHistoryId))}`),
    "참여기술인를 삭제하지 못했습니다.",
  );
}

export async function listCompanyPerformanceConstructionKinds(seq: number): Promise<CompanyPerformanceConstructionKindRecord[]> {
  return apiRequest(
    apiClient.get<CompanyPerformanceConstructionKindRecord[]>(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/construction-kinds`,
    ),
    "공사종류 목록을 불러오지 못했습니다.",
  );
}

export async function createCompanyPerformanceConstructionKind(
  seq: number,
  requestBody: CompanyPerformanceConstructionKindRequest,
): Promise<CompanyPerformanceConstructionKindRecord> {
  return apiRequest(
    apiClient.post<CompanyPerformanceConstructionKindRecord>(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/construction-kinds`,
      requestBody,
    ),
    "공사종류를 저장하지 못했습니다.",
  );
}

export async function updateCompanyPerformanceConstructionKind(
  seq: number,
  constructionKindId: number,
  requestBody: CompanyPerformanceConstructionKindRequest,
): Promise<CompanyPerformanceConstructionKindRecord> {
  return apiRequest(
    apiClient.put<CompanyPerformanceConstructionKindRecord>(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/construction-kinds/${encodeURIComponent(String(constructionKindId))}`,
      requestBody,
    ),
    "공사종류를 저장하지 못했습니다.",
  );
}

export async function deleteCompanyPerformanceConstructionKind(seq: number, constructionKindId: number): Promise<void> {
  await apiRequest(
    apiClient.delete(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/construction-kinds/${encodeURIComponent(String(constructionKindId))}`,
    ),
    "공사종류를 삭제하지 못했습니다.",
  );
}

export async function listCompanyPerformanceContractPeriods(seq: number): Promise<CompanyPerformanceContractPeriodRecord[]> {
  return apiRequest(
    apiClient.get<CompanyPerformanceContractPeriodRecord[]>(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/contract-periods`,
    ),
    "계약기간 목록을 불러오지 못했습니다.",
  );
}

export async function createCompanyPerformanceContractPeriod(
  seq: number,
  requestBody: CompanyPerformanceContractPeriodRequest,
): Promise<CompanyPerformanceContractPeriodRecord> {
  return apiRequest(
    apiClient.post<CompanyPerformanceContractPeriodRecord>(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/contract-periods`,
      requestBody,
    ),
    "계약기간을 저장하지 못했습니다.",
  );
}

export async function updateCompanyPerformanceContractPeriod(
  seq: number,
  contractPeriodId: number,
  requestBody: CompanyPerformanceContractPeriodRequest,
): Promise<CompanyPerformanceContractPeriodRecord> {
  return apiRequest(
    apiClient.put<CompanyPerformanceContractPeriodRecord>(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/contract-periods/${encodeURIComponent(String(contractPeriodId))}`,
      requestBody,
    ),
    "계약기간을 저장하지 못했습니다.",
  );
}

export async function deleteCompanyPerformanceContractPeriod(seq: number, contractPeriodId: number): Promise<void> {
  await apiRequest(
    apiClient.delete(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/contract-periods/${encodeURIComponent(String(contractPeriodId))}`,
    ),
    "계약기간을 삭제하지 못했습니다.",
  );
}

export async function listCompanyPerformanceOutlines(seq: number): Promise<CompanyPerformanceOutlineRecord[]> {
  return apiRequest(
    apiClient.get<CompanyPerformanceOutlineRecord[]>(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/outlines`),
    "공사개요 목록을 불러오지 못했습니다.",
  );
}

export async function createCompanyPerformanceOutline(
  seq: number,
  requestBody: CompanyPerformanceOutlineRequest,
): Promise<CompanyPerformanceOutlineRecord> {
  return apiRequest(
    apiClient.post<CompanyPerformanceOutlineRecord>(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/outlines`, requestBody),
    "공사개요를 저장하지 못했습니다.",
  );
}

export async function updateCompanyPerformanceOutline(
  seq: number,
  outlineId: number,
  requestBody: CompanyPerformanceOutlineRequest,
): Promise<CompanyPerformanceOutlineRecord> {
  return apiRequest(
    apiClient.put<CompanyPerformanceOutlineRecord>(
      `${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/outlines/${encodeURIComponent(String(outlineId))}`,
      requestBody,
    ),
    "공사개요를 저장하지 못했습니다.",
  );
}

export async function deleteCompanyPerformanceOutline(seq: number, outlineId: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}/outlines/${encodeURIComponent(String(outlineId))}`),
    "공사개요를 삭제하지 못했습니다.",
  );
}

export async function createCompanyPerformance(requestBody: CompanyPerformanceUpsertRequest): Promise<CompanyPerformanceRecord> {
  return apiRequest(apiClient.post<CompanyPerformanceRecord>(COMPANY_PERFORMANCES_API, requestBody), "회사실적 정보를 저장하지 못했습니다.");
}

export async function updateCompanyPerformance(
  seq: number,
  requestBody: CompanyPerformanceUpsertRequest,
): Promise<CompanyPerformanceRecord> {
  return apiRequest(
    apiClient.put<CompanyPerformanceRecord>(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}`, requestBody),
    "회사실적 정보를 저장하지 못했습니다.",
  );
}

export async function deleteCompanyPerformance(seq: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${COMPANY_PERFORMANCES_API}/${encodeURIComponent(String(seq))}`),
    "회사실적 정보를 삭제하지 못했습니다.",
  );
}
