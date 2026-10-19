import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const G2B_BID_NOTICE_CANDIDATES_API = "/pq/g2b-bid-notice-candidates";
export const G2B_BID_NOTICE_CANDIDATE_PAGE_SIZE = 50;

export type G2bBidNoticeCandidateApiRecord = {
  id: number;
  bidNtceNo: string | null;
  bidNtceOrd: string | null;
  befBidBbancNo: string | null;
  ntceKindNm: string | null;
  bidMethdNm: string | null;
  cmmnSpldmdAgrmntRcptdocMethd: string | null;
  pqApplDocRcptMthdNm: string | null;
  pqApplDocRcptDt: string | null;
  cntrctCnclsMthdNm: string | null;
  srvceDivNm: string | null;
  prtcptLmtRgnCd: string | null;
  cmmnSpldmdMethdNm: string | null;
  sucsfbidMthdNm: string | null;
  indstrytyLmtYn: string | null;
  pubPrcrmntMidClsfcNm: string | null;
  pubPrcrmntClsfcNm: string | null;
  sucsfbidMthdAppStd: string | null;
  asignBdgtAmt: string | null;
  bidDate: string | null;
  bidSubmissionDate: string | null;
  pqSubmitDate: string | null;
  bidNtceNm: string | null;
  ntceInsttNm: string | null;
  dminsttNm: string | null;
  dminsttCd: string | null;
  bidNtceDate: string | null;
  bidBeginDt: string | null;
  bidQlfctRgstDt: string | null;
  bidWgrnteeRcptClseDt: string | null;
  bidClseDt: string | null;
  opengDt: string | null;
  bidNtceUrl: string | null;
  importedAt: string | null;
  importedBidSeq: number | null;
  attachments: G2bBidNoticeCandidateAttachmentApiRecord[];
};

export type G2bBidNoticeCandidateAttachmentApiRecord = {
  fileName: string | null;
  downloadUrl: string | null;
};

export type G2bBidNoticeCandidatePageResponse = {
  content: G2bBidNoticeCandidateApiRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type G2bBidNoticeCandidateSyncStatusResponse = {
  lastSeenAt: string | null;
};

export type G2bBidNoticeCandidateSearchParams = {
  bidNtceNo: string;
  ntceKindNm: string[];
  cntrctCnclsMthdNm: string[];
  srvceDivNm: string[];
  bidNtceNm: string;
  ntceInsttNm: string;
  befBidBbancNo: string;
  importedYn: string[];
  bidNtceDateFrom: string;
  bidNtceDateTo: string;
  relatedBidNtceNos?: string[];
  orderById?: boolean;
  page: number;
  size: number;
};

const normalize = (value: string) => (value.trim() ? value.trim() : undefined);
const normalizeMultiValue = (values: string[]) => {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized.join(",") : undefined;
};

export async function listG2bBidNoticeCandidates(
  params: G2bBidNoticeCandidateSearchParams,
): Promise<G2bBidNoticeCandidatePageResponse> {
  return apiRequest(
    apiClient.get<G2bBidNoticeCandidatePageResponse>(G2B_BID_NOTICE_CANDIDATES_API, {
      params: {
        bidNtceNo: normalize(params.bidNtceNo),
        ntceKindNm: normalizeMultiValue(params.ntceKindNm),
        cntrctCnclsMthdNm: normalizeMultiValue(params.cntrctCnclsMthdNm),
        srvceDivNm: normalizeMultiValue(params.srvceDivNm),
        bidNtceNm: normalize(params.bidNtceNm),
        ntceInsttNm: normalize(params.ntceInsttNm),
        befBidBbancNo: normalize(params.befBidBbancNo),
        importedYn: normalizeMultiValue(params.importedYn),
        bidNtceDateFrom: normalize(params.bidNtceDateFrom),
        bidNtceDateTo: normalize(params.bidNtceDateTo),
        relatedBidNtceNos: normalizeMultiValue(params.relatedBidNtceNos ?? []),
        orderById: params.orderById,
        page: Math.max(0, Math.trunc(params.page)),
        size: Math.max(1, Math.trunc(params.size)),
      },
    }),
    "나라장터 연계 공고문 목록을 불러오지 못했습니다.",
  );
}

export type G2bBidNoticeBatchTriggerResponse = {
  status: string;
  message: string;
};

export async function syncG2bBidNoticeCandidates(): Promise<G2bBidNoticeBatchTriggerResponse> {
  return apiRequest(
    apiClient.post<G2bBidNoticeBatchTriggerResponse>(`${G2B_BID_NOTICE_CANDIDATES_API}/sync`),
    "나라장터 용역 API 조회에 실패했습니다.",
  );
}

export async function getG2bBidNoticeCandidateSyncStatus(): Promise<G2bBidNoticeCandidateSyncStatusResponse> {
  return apiRequest(
    apiClient.get<G2bBidNoticeCandidateSyncStatusResponse>(`${G2B_BID_NOTICE_CANDIDATES_API}/sync-status`),
    "나라장터 최근 조회 시각을 불러오지 못했습니다.",
  );
}

export async function markG2bBidNoticeCandidateImported(candidateId: number, bidSeq: number, importedBy = "admin"): Promise<void> {
  await apiRequest(
    apiClient.patch(`${G2B_BID_NOTICE_CANDIDATES_API}/${candidateId}/import`, { bidSeq, importedBy }),
    "공고문 반영 상태를 저장하지 못했습니다.",
  );
}

export async function listImportedG2bBidNoticeCandidateAttachments(
  bidSeq: number,
): Promise<G2bBidNoticeCandidateAttachmentApiRecord[]> {
  return apiRequest(
    apiClient.get<G2bBidNoticeCandidateAttachmentApiRecord[]>(`${G2B_BID_NOTICE_CANDIDATES_API}/imported/${bidSeq}/attachments`),
    "나라장터 원본 첨부파일을 불러오지 못했습니다.",
  );
}

export async function getImportedG2bBidNoticeCandidate(
  bidSeq: number,
): Promise<G2bBidNoticeCandidateApiRecord> {
  return apiRequest(
    apiClient.get<G2bBidNoticeCandidateApiRecord>(`${G2B_BID_NOTICE_CANDIDATES_API}/imported/${bidSeq}`),
    "나라장터 원본 공고 정보를 불러오지 못했습니다.",
  );
}

export async function getImportedG2bBidNoticeCandidateByNoticeNumber(
  bidNoticeNumber: string,
): Promise<G2bBidNoticeCandidateApiRecord> {
  return apiRequest(
    apiClient.get<G2bBidNoticeCandidateApiRecord>(`${G2B_BID_NOTICE_CANDIDATES_API}/imported/by-notice/${encodeURIComponent(bidNoticeNumber)}`),
    "기존 나라장터 공고 정보를 불러오지 못했습니다.",
  );
}

export async function deleteG2bBidNoticeCandidates(ids: number[]): Promise<void> {
  await apiRequest(
    apiClient.delete(G2B_BID_NOTICE_CANDIDATES_API, { data: { ids } }),
    "선택한 나라장터 공고를 삭제하지 못했습니다.",
  );
}
