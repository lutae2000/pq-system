import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

import type { SubmissionCount, SubmissionDetailFilters, SubmissionStatusFilters } from "./domain/submissionStatus";

export type SubmissionDetailResponse = {
  bidSeq: number;
  projectName: string;
  departmentCode: string | null;
  pqSubmitDate: string;
  g2bBidNtceNo: string | null;
  participateYn: string | null;
  bidSuccessYn: string | null;
  businessType: string | null;
  orderClient: string | null;
  orderClientName: string | null;
  announceDate: string | null;
  bidClosingDate: string | null;
  bidSubmissionDate: string | null;
  bidDate: string | null;
  designAmt: number | null;
  superDecideEmpno: string | null;
};

type SubmissionDetailPage = {
  content: SubmissionDetailResponse[];
  totalElements: number;
  totalPages: number;
};

export function listBidNoticeSubmissionCounts(params: SubmissionStatusFilters): Promise<SubmissionCount[]> {
  return apiRequest(
    apiClient.get<SubmissionCount[]>("/pq/submit-stat", { params }),
    "PQ 제출 현황을 불러오지 못했습니다.",
  );
}

export function listBidNoticeSubmissionDetails(params: SubmissionDetailFilters, page: number, size: number): Promise<SubmissionDetailPage> {
  return apiRequest(
    apiClient.get<SubmissionDetailPage>("/pq/submit-stat/details", { params: { ...params, page, size } }),
    "PQ 제출 상세 목록을 불러오지 못했습니다.",
  );
}
