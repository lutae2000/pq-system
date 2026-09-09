import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const PQ_PARTICIPATING_ENGINEERS_API = "/pq/participating-engineers";
export const PQ_PARTICIPATING_ENGINEER_PAGE_SIZE = 50;

export type PqParticipatingEngineerProjectHistoryConditionType = "constructionKind" | "general" | "outline";
export type PqParticipatingEngineerProjectHistoryConditionOperator = "=" | "!=" | ">=" | "<=" | ">" | "<" | "LIKE" | "BETWEEN";
export type PqParticipatingEngineerProjectHistoryConditionValueType = "code" | "date" | "number" | "text";

export type PqParticipatingEngineerProjectHistoryCondition = {
  conditionType: PqParticipatingEngineerProjectHistoryConditionType;
  logicalOperator?: "AND" | "OR";
  label?: string;
  level1Code?: string;
  level2Code?: string;
  level3Code?: string;
  generalCode?: string;
  outlineCategoryCode?: string;
  outlineSubcategoryCode?: string;
  operator?: PqParticipatingEngineerProjectHistoryConditionOperator;
  value?: string;
  valueTo?: string;
  valueType?: PqParticipatingEngineerProjectHistoryConditionValueType;
};

export type PqParticipatingEngineerCandidate = {
  engrId: string;
  name: string | null;
  birthDate: string | null;
  department: string | null;
  position: string | null;
  jobField: string | null;
  specialtyField: string | null;
  designGrade: string | null;
  constructionManagementGrade: string | null;
  retireYn: "Y" | "N" | null;
};

export type PqParticipatingEngineerCandidatePage = {
  content: PqParticipatingEngineerCandidate[];
  first?: boolean;
  last?: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PqParticipatingEngineerCandidateSearchParams = {
  bidSeq?: number | null;
  certificationName?: string;
  constructionManagementGrade?: string;
  designGrade?: string;
  jobField?: string;
  keyword?: string;
  page: number;
  projectHistoryConditions?: PqParticipatingEngineerProjectHistoryCondition[];
  retireYn?: "Y" | "N";
  size: number;
  specialtyField?: string;
  workDutyId?: string | null;
};

export type PqParticipatingEngineerRecord = {
  bidSeq: number;
  engrId: string;
  workDutyId: string;
  priority: number | null;
  responsibility: string | null;
  role: string | null;
  memo: string | null;
  name?: string | null;
  birthDate?: string | null;
  department?: string | null;
  position?: string | null;
  jobField?: string | null;
  specialtyField?: string | null;
  retireYn?: "Y" | "N" | null;
};

export type PqParticipatingEngineerRequest = {
  bidSeq: number;
  engrId: string;
  workDutyId: string;
  priority?: number | null;
  responsibility?: string | null;
  role?: string | null;
  memo?: string | null;
};

export type ReplacePqParticipatingEngineersRequest = {
  bidSeq: number;
  workDutyId: string;
  engineers: Array<{
    engrId: string;
    priority?: number | null;
    responsibility?: string | null;
    role?: string | null;
    memo?: string | null;
  }>;
};

export type RelatedProjectHistoryConditionSetResponse = {
  bidSeq: number;
  conditionsJson: string;
  createdAt?: string | null;
  createdId?: string | null;
  lastChangedAt?: string | null;
  lastChangedId?: string | null;
};

const normalizeQueryValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
};

const normalizeProjectHistoryConditions = (filters: PqParticipatingEngineerProjectHistoryCondition[] = []) =>
  filters
    .map((filter) => ({
      conditionType: filter.conditionType,
      generalCode: filter.generalCode?.trim() ?? "",
      label: filter.label?.trim() ?? "",
      level1Code: filter.level1Code?.trim() ?? "",
      level2Code: filter.level2Code?.trim() ?? "",
      level3Code: filter.level3Code?.trim() ?? "",
      logicalOperator: filter.logicalOperator ?? "AND",
      operator: filter.operator ?? "=",
      outlineCategoryCode: filter.outlineCategoryCode?.trim() ?? "",
      outlineSubcategoryCode: filter.outlineSubcategoryCode?.trim() ?? "",
      value: filter.value?.trim() ?? "",
      valueTo: filter.valueTo?.trim() ?? "",
      valueType: filter.valueType ?? "text",
    }))
    .filter((filter) => {
      if (filter.conditionType === "constructionKind") {
        return filter.level1Code;
      }
      if (filter.conditionType === "general") {
        return filter.generalCode;
      }
      if (filter.conditionType === "outline") {
        return filter.outlineCategoryCode || filter.outlineSubcategoryCode;
      }
      return false;
    });

const parseProjectHistoryConditions = (conditionsJson: string | null | undefined): PqParticipatingEngineerProjectHistoryCondition[] => {
  if (!conditionsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(conditionsJson);
    return Array.isArray(parsed) ? normalizeProjectHistoryConditions(parsed) : [];
  } catch {
    return [];
  }
};

export async function getRelatedProjectHistoryConditions(bidSeq: number): Promise<PqParticipatingEngineerProjectHistoryCondition[]> {
  const response = await apiRequest<RelatedProjectHistoryConditionSetResponse>(
    apiClient.get(`/pq/related-project-history-conditions/${encodeURIComponent(String(bidSeq))}`),
    "관련공사 참여이력 조건을 불러오지 못했습니다.",
  );
  return parseProjectHistoryConditions(response.conditionsJson);
}

export async function saveRelatedProjectHistoryConditions(params: {
  bidSeq: number;
  conditions: PqParticipatingEngineerProjectHistoryCondition[];
}): Promise<PqParticipatingEngineerProjectHistoryCondition[]> {
  const conditions = normalizeProjectHistoryConditions(params.conditions);
  const response = await apiRequest<RelatedProjectHistoryConditionSetResponse>(
    apiClient.put(`/pq/related-project-history-conditions/${encodeURIComponent(String(params.bidSeq))}`, {
      conditionsJson: JSON.stringify(conditions),
    }),
    "관련공사 참여이력 조건을 저장하지 못했습니다.",
  );
  return parseProjectHistoryConditions(response.conditionsJson);
}

export async function listPqParticipatingEngineerCandidates(
  params: PqParticipatingEngineerCandidateSearchParams,
): Promise<PqParticipatingEngineerCandidatePage> {
  const projectHistoryConditions = normalizeProjectHistoryConditions(params.projectHistoryConditions);

  return apiRequest(
    apiClient.get<PqParticipatingEngineerCandidatePage>(`${PQ_PARTICIPATING_ENGINEERS_API}/candidates`, {
      params: {
        bidSeq: normalizeQueryValue(params.bidSeq ?? undefined),
        certificationName: normalizeQueryValue(params.certificationName?.trim()),
        constructionManagementGrade: normalizeQueryValue(params.constructionManagementGrade?.trim()),
        designGrade: normalizeQueryValue(params.designGrade?.trim()),
        jobField: normalizeQueryValue(params.jobField?.trim()),
        keyword: normalizeQueryValue(params.keyword?.trim()),
        page: Math.max(0, Math.trunc(params.page)),
        projectHistoryConditions: projectHistoryConditions.length > 0 ? JSON.stringify(projectHistoryConditions) : undefined,
        retireYn: params.retireYn,
        size: Math.max(1, Math.trunc(params.size)),
        specialtyField: normalizeQueryValue(params.specialtyField?.trim()),
        workDutyId: normalizeQueryValue(params.workDutyId ?? undefined),
      },
    }),
    "PQ참여 후보 기술인 목록을 불러오지 못했습니다.",
  );
}

export async function listPqParticipatingEngineers(params: {
  bidSeq: number;
  workDutyId?: string | null;
}): Promise<PqParticipatingEngineerRecord[]> {
  return apiRequest(
    apiClient.get<PqParticipatingEngineerRecord[]>(PQ_PARTICIPATING_ENGINEERS_API, {
      params: {
        bidSeq: params.bidSeq,
        workDutyId: normalizeQueryValue(params.workDutyId ?? undefined),
      },
    }),
    "PQ참여 기술인 목록을 불러오지 못했습니다.",
  );
}

export async function createPqParticipatingEngineer(
  requestBody: PqParticipatingEngineerRequest,
): Promise<PqParticipatingEngineerRecord> {
  return apiRequest(
    apiClient.post<PqParticipatingEngineerRecord>(PQ_PARTICIPATING_ENGINEERS_API, requestBody),
    "PQ참여 기술인를 저장하지 못했습니다.",
  );
}

export async function updatePqParticipatingEngineer(
  bidSeq: number,
  workDutyId: string,
  engrId: string,
  requestBody: PqParticipatingEngineerRequest,
): Promise<PqParticipatingEngineerRecord> {
  return apiRequest(
    apiClient.put<PqParticipatingEngineerRecord>(
      `${PQ_PARTICIPATING_ENGINEERS_API}/${encodeURIComponent(String(bidSeq))}/${encodeURIComponent(workDutyId)}/${encodeURIComponent(engrId)}`,
      requestBody,
    ),
    "PQ참여 기술인를 저장하지 못했습니다.",
  );
}

export async function deletePqParticipatingEngineer(bidSeq: number, workDutyId: string, engrId: string): Promise<void> {
  await apiRequest(
    apiClient.delete(
      `${PQ_PARTICIPATING_ENGINEERS_API}/${encodeURIComponent(String(bidSeq))}/${encodeURIComponent(workDutyId)}/${encodeURIComponent(engrId)}`,
    ),
    "PQ참여 기술인를 삭제하지 못했습니다.",
  );
}

export async function replacePqParticipatingEngineers(
  requestBody: ReplacePqParticipatingEngineersRequest,
): Promise<PqParticipatingEngineerRecord[]> {
  return apiRequest(
    apiClient.put<PqParticipatingEngineerRecord[]>(PQ_PARTICIPATING_ENGINEERS_API, requestBody),
    "PQ참여 기술인 목록을 저장하지 못했습니다.",
  );
}
