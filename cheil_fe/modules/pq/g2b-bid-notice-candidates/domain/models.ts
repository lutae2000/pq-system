import { dateTimeText, toDateInputValue } from "@/modules/common/formatters";
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
  bidNtceDateFrom: string;
  bidNtceDateTo: string;
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type G2bBidNoticeCandidateRow = {
  id: number;
  bidNtceNo: string;
  bidNtceOrd: string;
  befBidBbancNo: string;
  ntceKindNm: string;
  bidMethdNm: string;
  cmmnSpldmdAgrmntRcptdocMethd: string;
  pqApplDocRcptMthdNm: string;
  pqApplDocRcptDt: string;
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
  agreementSubmissionDeadline: string;
  bidNtceNm: string;
  ntceInsttNm: string;
  dminsttNm: string;
  dminsttCd: string;
  bidNtceDate: string;
  bidBeginDt: string;
  bidQlfctRgstDt: string;
  bidWgrnteeRcptClseDt: string;
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
  bidNtceDateFrom: formatLocalDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  bidNtceDateTo: formatLocalDate(new Date()),
});

const candidateDateTime = (value: string | null) => {
  const compact = /^(\d{8})(\d{2})(\d{2})(?:\d{2})?$/.exec(value?.trim() ?? "");
  if (compact) {
    const [, date, hour, minute] = compact;
    return `${toDateInputValue(date)} ${hour}:${minute}`;
  }
  const trimmed = value?.trim() ?? "";
  const formatted = /^\d{8}$/.test(trimmed) ? toDateInputValue(trimmed) : dateTimeText(trimmed);
  return /^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?$/.test(formatted) ? formatted : "";
};

export const toG2bBidNoticeCandidateRow = (record: G2bBidNoticeCandidateApiRecord): G2bBidNoticeCandidateRow => ({
  id: record.id,
  bidNtceNo: record.bidNtceNo ?? "",
  bidNtceOrd: record.bidNtceOrd ?? "",
  befBidBbancNo: record.befBidBbancNo ?? "",
  ntceKindNm: record.ntceKindNm ?? "",
  bidMethdNm: record.bidMethdNm ?? "",
  cmmnSpldmdAgrmntRcptdocMethd: record.cmmnSpldmdAgrmntRcptdocMethd ?? "",
  pqApplDocRcptMthdNm: record.pqApplDocRcptMthdNm ?? "",
  pqApplDocRcptDt: candidateDateTime(record.pqApplDocRcptDt),
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
  bidDate: candidateDateTime(record.bidClseDt) || candidateDateTime(record.bidDate),
  // The candidate API stores the joint agreement deadline under this legacy key.
  agreementSubmissionDeadline: candidateDateTime(record.pqSubmitDate),
  bidNtceNm: record.bidNtceNm ?? "",
  ntceInsttNm: record.ntceInsttNm ?? "",
  dminsttNm: record.dminsttNm ?? "",
  dminsttCd: record.dminsttCd ?? "",
  bidNtceDate: candidateDateTime(record.bidNtceDate),
  bidBeginDt: candidateDateTime(record.bidBeginDt),
  bidQlfctRgstDt: candidateDateTime(record.bidQlfctRgstDt),
  bidWgrnteeRcptClseDt: candidateDateTime(record.bidWgrnteeRcptClseDt),
  opengDt: candidateDateTime(record.opengDt) || candidateDateTime(record.bidSubmissionDate),
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
