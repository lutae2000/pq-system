import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const NEW_TECHNOLOGY_INVESTMENTS_API = "/pq/new-technology-investments";
export const NEW_TECHNOLOGY_INVESTMENT_PAGE_SIZE = 200;

export type NewTechnologyInvestmentRecord = {
  id: number;
  investmentYear: string;
  revenue: number | null;
  totalAssets: number | null;
  equityCapital: number | null;
  currentLiabilities: number | null;
  fixedLiabilities: number | null;
  currentAssets: number | null;
  netIncome: number | null;
  totalLiabilities: number | null;
  technologyDevelopmentInvestment: number | null;
  technologyDevelopmentInvestmentRatio: number | null;
  equityRatio: number | null;
  returnOnEquity: number | null;
  currentRatio: number | null;
  debtRatio: number | null;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type NewTechnologyInvestmentPageResponse = {
  content: NewTechnologyInvestmentRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type NewTechnologyInvestmentSearchParams = {
  yearFrom: string;
  yearTo: string;
  page: number;
  size: number;
};

export type NewTechnologyInvestmentRequest = Omit<
  NewTechnologyInvestmentRecord,
  | "id"
  | "technologyDevelopmentInvestmentRatio"
  | "equityRatio"
  | "returnOnEquity"
  | "currentRatio"
  | "debtRatio"
  | "createdAt"
  | "createdId"
  | "lastChangedAt"
  | "lastChangedId"
>;

const normalizeQueryValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
};

export async function listNewTechnologyInvestments(
  params: NewTechnologyInvestmentSearchParams,
): Promise<NewTechnologyInvestmentPageResponse> {
  return apiRequest(
    apiClient.get<NewTechnologyInvestmentPageResponse>(NEW_TECHNOLOGY_INVESTMENTS_API, {
      params: {
        yearFrom: normalizeQueryValue(params.yearFrom.trim()),
        yearTo: normalizeQueryValue(params.yearTo.trim()),
        page: Math.max(0, Math.trunc(params.page)),
        size: Math.max(1, Math.trunc(params.size)),
      },
    }),
    "투자실적 목록을 불러오지 못했습니다.",
  );
}

export async function getNewTechnologyInvestment(id: number): Promise<NewTechnologyInvestmentRecord> {
  return apiRequest(
    apiClient.get<NewTechnologyInvestmentRecord>(`${NEW_TECHNOLOGY_INVESTMENTS_API}/${encodeURIComponent(String(id))}`),
    "투자실적 정보를 불러오지 못했습니다.",
  );
}

export async function createNewTechnologyInvestment(
  requestBody: NewTechnologyInvestmentRequest,
): Promise<NewTechnologyInvestmentRecord> {
  return apiRequest(
    apiClient.post<NewTechnologyInvestmentRecord>(NEW_TECHNOLOGY_INVESTMENTS_API, requestBody),
    "투자실적을 저장하지 못했습니다.",
  );
}

export async function updateNewTechnologyInvestment(
  id: number,
  requestBody: NewTechnologyInvestmentRequest,
): Promise<NewTechnologyInvestmentRecord> {
  return apiRequest(
    apiClient.put<NewTechnologyInvestmentRecord>(`${NEW_TECHNOLOGY_INVESTMENTS_API}/${encodeURIComponent(String(id))}`, requestBody),
    "투자실적을 저장하지 못했습니다.",
  );
}

export async function deleteNewTechnologyInvestment(id: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`${NEW_TECHNOLOGY_INVESTMENTS_API}/${encodeURIComponent(String(id))}`),
    "투자실적을 삭제하지 못했습니다.",
  );
}
