import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const NEW_EMPLOYMENT_RATES_API = "/pq/new-employment-rates";

export const NEW_EMPLOYMENT_RATE_PAGE_SIZE = 50;
export const NEW_EMPLOYMENT_CERTIFICATE_ATTACHMENT_OWNER_TYPE = "NEW_EMPLOYMENT_EMPLOYEE";
export const NEW_EMPLOYMENT_CERTIFICATE_ATTACHMENT_TYPE = "CAREER_CERTIFICATE";
export const NEW_EMPLOYMENT_RATE_PROGRAM_ATTACHMENT_OWNER_TYPE = "NEW_EMPLOYMENT_RATE";

export type NewEmploymentRateSummary = {
  recentYearNewHireCount: number | null;
  samePeriodAverageEmployeeCount: number | null;
  recentYearMonthlyAverageEmployeeCount: number | null;
  samePeriodRate: number | null;
  recentYearRate: number | null;
};

export type NewEmploymentMonthlyStatusRecord = {
  id: number;
  baseYearMonth: string;
  employeeCount: number | null;
  newHireCount: number | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
  isNew?: boolean;
};

export type NewEmploymentMonthlyStatusRequest = {
  baseYearMonth: string;
  employeeCount: number | null;
  newHireCount: number | null;
};

export type NewEmploymentMonthlyStatusPivotRecord = {
  yearMonth: string;
  cnt: number | null;
};

export type NewEmploymentEmployeeRecord = {
  id: number;
  baseYearMonth: string;
  employeeNo: string | null;
  employeeName: string;
  birthDate: string | null;
  hireDate: string;
  departmentCode: string;
  departmentName: string | null;
  jobCategory: string | null;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type NewEmploymentEmployeePageResponse = {
  content: NewEmploymentEmployeeRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type NewEmploymentEmployeeSearchParams = {
  selectedYearMonth: string;
  departmentCode: string;
  employeeName: string;
  page: number;
  size: number;
};

export type NewEmploymentEmployeeRequest = {
  baseYearMonth: string;
  employeeNo: string | null;
  employeeName: string;
  birthDate: string | null;
  hireDate: string;
  departmentCode: string;
  jobCategory: string | null;
  remark: string | null;
};

const normalizeQueryValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "" || value === "All") {
    return undefined;
  }
  return value;
};

const normalizePage = (value: number) => Math.max(0, Math.trunc(value));
const normalizeSize = (value: number) => Math.max(1, Math.trunc(value));

const normalizeYearMonth = (value: string | null | undefined) => {
  const normalized = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
  return normalized.length === 6 ? normalized : undefined;
};

export async function getNewEmploymentRateSummary(baseYearMonth: string): Promise<NewEmploymentRateSummary> {
  return apiRequest(
    apiClient.get<NewEmploymentRateSummary>(`${NEW_EMPLOYMENT_RATES_API}/summary`, {
      params: {
        baseYearMonth: normalizeYearMonth(baseYearMonth),
      },
    }),
    "신규 고용률 요약을 불러오지 못했습니다.",
  );
}

export async function listNewEmploymentMonthlyStatuses(baseYearMonth?: string): Promise<NewEmploymentMonthlyStatusRecord[]> {
  return apiRequest(
    apiClient.get<NewEmploymentMonthlyStatusRecord[]>(`${NEW_EMPLOYMENT_RATES_API}/monthly-statuses`, {
      params: {
        baseYearMonth: normalizeYearMonth(baseYearMonth),
      },
    }),
    "?붾퀎 怨좎슜?꾪솴??遺덈윭?ㅼ? 紐삵뻽?듬땲??",
  );
}

export async function listNewEmploymentMonthlyStatusPivot(baseYearMonth?: string): Promise<NewEmploymentMonthlyStatusPivotRecord[]> {
  return apiRequest(
    apiClient.get<NewEmploymentMonthlyStatusPivotRecord[]>(`${NEW_EMPLOYMENT_RATES_API}/monthly-statuses/pivot`, {
      params: {
        baseYearMonth: normalizeYearMonth(baseYearMonth),
      },
    }),
    "?붾퀎 怨좎슜?꾪솴?꾪븞 ?멸퀬瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??",
  );
}

export async function getNewEmploymentMonthlyStatus(id: number): Promise<NewEmploymentMonthlyStatusRecord> {
  return apiRequest(
    apiClient.get<NewEmploymentMonthlyStatusRecord>(`${NEW_EMPLOYMENT_RATES_API}/monthly-statuses/${encodeURIComponent(String(id))}`),
    "월별 고용현황을 불러오지 못했습니다.",
  );
}

export async function createNewEmploymentMonthlyStatus(
  requestBody: NewEmploymentMonthlyStatusRequest,
): Promise<NewEmploymentMonthlyStatusRecord> {
  return apiRequest(
    apiClient.post<NewEmploymentMonthlyStatusRecord>(`${NEW_EMPLOYMENT_RATES_API}/monthly-statuses`, {
      baseYearMonth: normalizeYearMonth(requestBody.baseYearMonth),
      employeeCount: requestBody.employeeCount,
      newHireCount: requestBody.newHireCount,
    }),
    "월별 고용현황을 저장하지 못했습니다.",
  );
}

export async function updateNewEmploymentMonthlyStatus(
  id: number,
  requestBody: NewEmploymentMonthlyStatusRequest,
): Promise<NewEmploymentMonthlyStatusRecord> {
  return apiRequest(
    apiClient.put<NewEmploymentMonthlyStatusRecord>(`${NEW_EMPLOYMENT_RATES_API}/monthly-statuses/${encodeURIComponent(String(id))}`, {
      baseYearMonth: normalizeYearMonth(requestBody.baseYearMonth),
      employeeCount: requestBody.employeeCount,
      newHireCount: requestBody.newHireCount,
    }),
    "월별 고용현황을 저장하지 못했습니다.",
  );
}

export async function deleteNewEmploymentMonthlyStatus(id: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${NEW_EMPLOYMENT_RATES_API}/monthly-statuses/${encodeURIComponent(String(id))}`),
    "월별 고용현황을 삭제하지 못했습니다.",
  );
}

export async function listNewEmploymentEmployees(
  params: NewEmploymentEmployeeSearchParams,
): Promise<NewEmploymentEmployeePageResponse> {
  return apiRequest(
    apiClient.get<NewEmploymentEmployeePageResponse>(`${NEW_EMPLOYMENT_RATES_API}/employees`, {
      params: {
        selectedYearMonth: normalizeYearMonth(params.selectedYearMonth),
        departmentCode: normalizeQueryValue(params.departmentCode.trim()),
        employeeName: normalizeQueryValue(params.employeeName.trim()),
        page: normalizePage(params.page),
        size: normalizeSize(params.size),
      },
    }),
    "신규 고용자 목록을 불러오지 못했습니다.",
  );
}

export async function getNewEmploymentEmployee(id: number): Promise<NewEmploymentEmployeeRecord> {
  return apiRequest(
    apiClient.get<NewEmploymentEmployeeRecord>(`${NEW_EMPLOYMENT_RATES_API}/employees/${encodeURIComponent(String(id))}`),
    "신규 고용자 정보를 불러오지 못했습니다.",
  );
}

export async function createNewEmploymentEmployee(
  requestBody: NewEmploymentEmployeeRequest,
): Promise<NewEmploymentEmployeeRecord> {
  return apiRequest(
    apiClient.post<NewEmploymentEmployeeRecord>(`${NEW_EMPLOYMENT_RATES_API}/employees`, requestBody),
    "신규 고용자 정보를 저장하지 못했습니다.",
  );
}

export async function updateNewEmploymentEmployee(
  id: number,
  requestBody: NewEmploymentEmployeeRequest,
): Promise<NewEmploymentEmployeeRecord> {
  return apiRequest(
    apiClient.put<NewEmploymentEmployeeRecord>(
      `${NEW_EMPLOYMENT_RATES_API}/employees/${encodeURIComponent(String(id))}`,
      requestBody,
    ),
    "신규 고용자 정보를 저장하지 못했습니다.",
  );
}

export async function deleteNewEmploymentEmployee(id: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${NEW_EMPLOYMENT_RATES_API}/employees/${encodeURIComponent(String(id))}`),
    "신규 고용자 정보를 삭제하지 못했습니다.",
  );
}
