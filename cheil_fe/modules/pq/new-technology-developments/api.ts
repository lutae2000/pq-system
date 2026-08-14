import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const NEW_TECHNOLOGY_DEVELOPMENTS_API = "/pq/new-technology-developments";
export const NEW_TECHNOLOGY_DEVELOPMENT_PAGE_SIZE = 200;
export const NEW_TECHNOLOGY_ATTACHMENT_OWNER_TYPE = "NEW_TECHNOLOGY_DEVELOPMENT";
export const NEW_TECHNOLOGY_ATTACHMENT_TYPE = "REFERENCE";

export type NewTechnologyDevelopmentRecord = {
  id: number;
  sequenceLabel: string | null;
  title: string;
  technologyType: string | null;
  applicantCount: number | null;
  useYn: boolean;
  applicationDate: string | null;
  elapsedYears: number | null;
  calculatedScore: number | null;
  targetField: string | null;
  applicationNo: string | null;
  registrationNo: string | null;
  validUntil: string | null;
  summary: string | null;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type NewTechnologyDevelopmentPageResponse = {
  content: NewTechnologyDevelopmentRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type NewTechnologyDevelopmentSearchParams = {
  applicationDateFrom: string;
  applicationDateTo: string;
  keyword: string;
  page: number;
  useYn: boolean;
  scoreReferenceDate: string;
  size: number;
  targetField: string;
  technologyType: string;
};

export type NewTechnologyDevelopmentRequest = Omit<
  NewTechnologyDevelopmentRecord,
  "id" | "elapsedYears" | "createdAt" | "createdId" | "lastChangedAt" | "lastChangedId"
>;

const normalizeQueryValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
};

const normalizeDateValue = (value: string | null | undefined) => {
  const normalized = value?.replace(/\D/g, "").slice(0, 8) ?? "";
  return normalizeQueryValue(normalized);
};

const normalizeRequestBody = (requestBody: NewTechnologyDevelopmentRequest): NewTechnologyDevelopmentRequest => ({
  ...requestBody,
  applicationDate: (normalizeDateValue(requestBody.applicationDate) as string | undefined) ?? "",
  calculatedScore: requestBody.calculatedScore,
  validUntil: (normalizeDateValue(requestBody.validUntil) as string | undefined) ?? "",
});

export async function listNewTechnologyDevelopments(
  params: NewTechnologyDevelopmentSearchParams,
): Promise<NewTechnologyDevelopmentPageResponse> {
  return apiRequest(
    apiClient.get<NewTechnologyDevelopmentPageResponse>(NEW_TECHNOLOGY_DEVELOPMENTS_API, {
      params: {
        applicationDateFrom: normalizeDateValue(params.applicationDateFrom),
        applicationDateTo: normalizeDateValue(params.applicationDateTo),
        keyword: normalizeQueryValue(params.keyword.trim()),
        page: Math.max(0, Math.trunc(params.page)),
        scoreReferenceDate: normalizeDateValue(params.scoreReferenceDate),
        size: Math.max(1, Math.trunc(params.size)),
        targetField: normalizeQueryValue(params.targetField.trim()),
        technologyType: normalizeQueryValue(params.technologyType),
        useYn: params.useYn,
      },
    }),
    "신기술 개발실적 목록을 불러오지 못했습니다.",
  );
}

export async function getNewTechnologyDevelopment(
  id: number,
  scoreReferenceDate?: string,
): Promise<NewTechnologyDevelopmentRecord> {
  return apiRequest(
    apiClient.get<NewTechnologyDevelopmentRecord>(`${NEW_TECHNOLOGY_DEVELOPMENTS_API}/${encodeURIComponent(String(id))}`, {
      params: { scoreReferenceDate: normalizeDateValue(scoreReferenceDate) },
    }),
    "신기술 개발실적 정보를 불러오지 못했습니다.",
  );
}

export async function createNewTechnologyDevelopment(
  requestBody: NewTechnologyDevelopmentRequest,
): Promise<NewTechnologyDevelopmentRecord> {
  return apiRequest(
    apiClient.post<NewTechnologyDevelopmentRecord>(NEW_TECHNOLOGY_DEVELOPMENTS_API, normalizeRequestBody(requestBody)),
    "신기술 개발실적을 저장하지 못했습니다.",
  );
}

export async function updateNewTechnologyDevelopment(
  id: number,
  requestBody: NewTechnologyDevelopmentRequest,
): Promise<NewTechnologyDevelopmentRecord> {
  return apiRequest(
    apiClient.put<NewTechnologyDevelopmentRecord>(`${NEW_TECHNOLOGY_DEVELOPMENTS_API}/${encodeURIComponent(String(id))}`, normalizeRequestBody(requestBody)),
    "신기술 개발실적을 저장하지 못했습니다.",
  );
}

export async function deleteNewTechnologyDevelopment(id: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${NEW_TECHNOLOGY_DEVELOPMENTS_API}/${encodeURIComponent(String(id))}`),
    "신기술 개발실적을 삭제하지 못했습니다.",
  );
}
