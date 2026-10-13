import type { G2bBidNoticeCandidateApiRecord } from "@/modules/pq/g2b-bid-notice-candidates/api";

export type G2bBidNoticeCandidateAttachment = {
  fileName: string;
  downloadUrl: string;
};

export type G2bBidNoticeCandidateSearchFilters = {
  bidNtceNo: string;
  ntceKindNm: string[];
  cntrctCnclsMthdNm: string[];
  srvceDivNm: string[];
  bidNtceNm: string;
  ntceInsttNm: string;
  befBidBbancNo: string;
  importedYn: string[];
};

export type G2bBidNoticeCandidateRow = {
  id: number;
  bidNtceNo: string;
  bidNtceOrd: string;
  befBidBbancNo: string;
  ntceKindNm: string;
  bidMethdNm: string;
  cntrctCnclsMthdNm: string;
  srvceDivNm: string;
  prtcptLmtRgnCd: string;
  cmmnSpldmdMethdNm: string;
  sucsfbidMthdNm: string;
  indstrytyLmtYn: string;
  pubPrcrmntMidClsfcNm: string;
  pubPrcrmntClsfcNm: string;
  sucsfbidMthdAppStd: string;
  asignBdgtAmt: string;
  bidDate: string;
  bidSubmissionDate: string;
  pqSubmitDate: string;
  bidNtceNm: string;
  ntceInsttNm: string;
  dminsttNm: string;
  dminsttCd: string;
  bidNtceDate: string;
  bidClseDt: string;
  opengDt: string;
  bidNtceUrl: string;
  importedAt: string;
  importedBidSeq: number | null;
  attachments: G2bBidNoticeCandidateAttachment[];
};

export const emptyG2bBidNoticeCandidateSearchFilters = (): G2bBidNoticeCandidateSearchFilters => ({
  bidNtceNo: "",
  ntceKindNm: [],
  cntrctCnclsMthdNm: ["일반경쟁", "제한경쟁", "지명경쟁"],
  srvceDivNm: ["기술용역"],
  bidNtceNm: "",
  ntceInsttNm: "",
  befBidBbancNo: "",
  importedYn: ["N"],
});

export const toG2bBidNoticeCandidateRow = (record: G2bBidNoticeCandidateApiRecord): G2bBidNoticeCandidateRow => ({
  id: record.id,
  bidNtceNo: record.bidNtceNo ?? "",
  bidNtceOrd: record.bidNtceOrd ?? "",
  befBidBbancNo: record.befBidBbancNo ?? "",
  ntceKindNm: record.ntceKindNm ?? "",
  bidMethdNm: record.bidMethdNm ?? "",
  cntrctCnclsMthdNm: record.cntrctCnclsMthdNm ?? "",
  srvceDivNm: record.srvceDivNm ?? "",
  prtcptLmtRgnCd: record.prtcptLmtRgnCd ?? "",
  cmmnSpldmdMethdNm: record.cmmnSpldmdMethdNm ?? "",
  sucsfbidMthdNm: record.sucsfbidMthdNm ?? "",
  indstrytyLmtYn: record.indstrytyLmtYn ?? "",
  pubPrcrmntMidClsfcNm: record.pubPrcrmntMidClsfcNm ?? "",
  pubPrcrmntClsfcNm: record.pubPrcrmntClsfcNm ?? "",
  sucsfbidMthdAppStd: record.sucsfbidMthdAppStd ?? "",
  asignBdgtAmt: record.asignBdgtAmt ?? "",
  bidDate: record.bidDate ?? "",
  bidSubmissionDate: record.bidSubmissionDate ?? "",
  pqSubmitDate: record.pqSubmitDate ?? "",
  bidNtceNm: record.bidNtceNm ?? "",
  ntceInsttNm: record.ntceInsttNm ?? "",
  dminsttNm: record.dminsttNm ?? "",
  dminsttCd: record.dminsttCd ?? "",
  bidNtceDate: record.bidNtceDate ?? "",
  bidClseDt: record.bidClseDt ?? "",
  opengDt: record.opengDt ?? "",
  bidNtceUrl: record.bidNtceUrl ?? "",
  importedAt: record.importedAt ?? "",
  importedBidSeq: record.importedBidSeq ?? null,
  attachments: (record.attachments ?? [])
    .filter((attachment) => Boolean(attachment.fileName || attachment.downloadUrl))
    .map((attachment) => ({
      fileName: attachment.fileName ?? "첨부파일",
      downloadUrl: attachment.downloadUrl ?? "",
    })),
});
