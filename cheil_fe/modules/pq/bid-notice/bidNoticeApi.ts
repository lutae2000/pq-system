import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const BID_NOTICES_API = "/pq/bid-notice";
export const BID_NOTICE_PAGE_SIZE = 200;

export type BidNoticeApiRecord = {
  announceDate: string | null;
  bidClosingDate: string | null;
  bidDate: string | null;
  bidMethod: string | null;
  bidMethodLabel?: string | null;
  bidSeq: number | null;
  bidSubmissionDate: string | null;
  bidSuccessYn: string | null;
  bidSuccessYnLabel?: string | null;
  bidType: string | null;
  bidTypeLabel?: string | null;
  businessType: string | null;
  businessTypeLabel?: string | null;
  createdAt: string | null;
  createdId: string | null;
  departmentCode: string | null;
  departmentName?: string | null;
  designAmt: number | null;
  fieldOfWorkCode: string | null;
  fieldOfWorkLabel?: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
  orderClient: string | null;
  orderClientName?: string | null;
  orderMethod: string | null;
  orderMethodLabel?: string | null;
  participateYn: string | null;
  participateYnLabel?: string | null;
  pqDecideDate: string | null;
  pqDecideEmpno: string | null;
  pqRegistDate: string | null;
  pqSubmitDate: string | null;
  primeContractor: string | null;
  processTag: string | null;
  projectName: string;
  reasonOfAbsenceCode: string | null;
  refmatYn: string | null;
  remark: string | null;
  scopeOfWorkCode: string | null;
  scopeOfWorkLabel?: string | null;
  siteBriefingDate: string | null;
  superDecideEmpno: string | null;
  tpPassYn: string | null;
  tpSubmitDate: string | null;
};

export type BidNoticeOption = {
  clientCode?: string;
  deptCode?: string;
  deptName?: string | null;
  label: string;
  level1Code?: string;
  level2Code?: string;
  orderName?: string | null;
  sortOrder?: number | null;
  value: string;
};

export type BidNoticeDetailOptions = {
  bidMethods: BidNoticeOption[];
  bidTypes: BidNoticeOption[];
  businessFields: BidNoticeOption[];
  businessScopes: BidNoticeOption[];
  businessTypes: BidNoticeOption[];
  clients: BidNoticeOption[];
  departments: BidNoticeOption[];
  finalParticipationStatuses: BidNoticeOption[];
  orderMethods: BidNoticeOption[];
};

export type BidNoticePageResponse = {
  content: BidNoticeApiRecord[];
  first?: boolean;
  last?: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type BidNoticeSearchParams = {
  bidClosingDateFrom: string;
  bidClosingDateTo: string;
  bidDateFrom: string;
  bidDateTo: string;
  bidSuccessYn: string;
  bidType: string;
  businessType: string;
  departmentCode: string;
  keyword: string;
  page?: number;
  pqSubmitDateFrom: string;
  pqSubmitDateTo: string;
  size?: number;
  superDecideEmpno: string;
};

export type BidNoticeUpsertRequest = Omit<BidNoticeApiRecord, "createdAt" | "lastChangedAt">;

const normalizeQueryValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "" || value === "All") {
    return undefined;
  }
  return value;
};

export async function listBidNotices(params: BidNoticeSearchParams): Promise<BidNoticePageResponse> {
  return apiRequest(
    apiClient.get<BidNoticePageResponse>(BID_NOTICES_API, {
      params: {
        bidClosingDateFrom: normalizeQueryValue(params.bidClosingDateFrom),
        bidClosingDateTo: normalizeQueryValue(params.bidClosingDateTo),
        bidDateFrom: normalizeQueryValue(params.bidDateFrom),
        bidDateTo: normalizeQueryValue(params.bidDateTo),
        bidSuccessYn: normalizeQueryValue(params.bidSuccessYn),
        bidType: normalizeQueryValue(params.bidType),
        businessType: normalizeQueryValue(params.businessType),
        departmentCode: normalizeQueryValue(params.departmentCode),
        keyword: normalizeQueryValue(params.keyword.trim()),
        page: Math.max(0, Math.trunc(params.page ?? 0)),
        pqSubmitDateFrom: normalizeQueryValue(params.pqSubmitDateFrom),
        pqSubmitDateTo: normalizeQueryValue(params.pqSubmitDateTo),
        size: params.size ?? BID_NOTICE_PAGE_SIZE,
        superDecideEmpno: normalizeQueryValue(params.superDecideEmpno),
      },
    }),
    "공고문 목록을 불러오지 못했습니다.",
  );
}

export async function getBidNotice(bidSeq: number): Promise<BidNoticeApiRecord> {
  return apiRequest(apiClient.get<BidNoticeApiRecord>(`${BID_NOTICES_API}/${bidSeq}`), "공고문 상세를 불러오지 못했습니다.");
}

export async function createBidNotice(requestBody: BidNoticeUpsertRequest): Promise<BidNoticeApiRecord> {
  return apiRequest(apiClient.post<BidNoticeApiRecord>(BID_NOTICES_API, requestBody), "공고문을 저장하지 못했습니다.");
}

export async function updateBidNotice(bidSeq: number, requestBody: BidNoticeUpsertRequest): Promise<BidNoticeApiRecord> {
  return apiRequest(apiClient.put<BidNoticeApiRecord>(`${BID_NOTICES_API}/${bidSeq}`, requestBody), "공고문을 저장하지 못했습니다.");
}

export async function deleteBidNotice(bidSeq: number): Promise<void> {
  await apiRequest(apiClient.delete(`${BID_NOTICES_API}/${bidSeq}`), "공고문을 삭제하지 못했습니다.");
}
