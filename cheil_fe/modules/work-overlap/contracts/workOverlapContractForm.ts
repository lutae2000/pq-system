import type { WorkOverlapContractRecord, WorkOverlapContractRequest } from "@/modules/work-overlap/contracts/api";

const text = (value: string | null | undefined) => value ?? "";


export const defaultWorkOverlapContractRecord = (): WorkOverlapContractRecord => ({

  contractNo: "",
  serviceType: "",
  clientName: "",
  supervisingDepartmentCode: null,
  serviceName: "",
  constructionStartDate: null,
  constructionCompleteDate: null,
  managementServiceCompleteDate: null,
  constructionStopFromDate: null,
  constructionStopToDate: null,
  restartDate: null,
  contractAmount: null,
  shareAmount: null,
  performanceCertification: "",
  participateListDocument: "",
  cemsConfirm: "",
  remark: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

export const displayText = (value: string | null | undefined) => (value?.trim() ? value : "");
export const formatNumberText = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : Number(value).toLocaleString("ko-KR");
export const formatNumberInputValue = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export const normalizeNumberInputValue = (value: string) => {
  const normalized = value.replaceAll(",", "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatDateInputValue = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "";
};

export const normalizeDateInputValue = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? normalized : null;
};

export const formatDateText = (value: string | null | undefined) => {
  const formatted = formatDateInputValue(value);
  return formatted || "";
};

export const formatPeriodText = (fromDate: string | null | undefined, toDate: string | null | undefined) => {
  const from = formatDateInputValue(fromDate);
  const to = formatDateInputValue(toDate);
  return from || to ? `${from || ""} ~ ${to || ""}` : "";
};

export const toWorkOverlapContractRequest = (
  draft: WorkOverlapContractRecord,
  periodChangeReason: string | null = null,
): WorkOverlapContractRequest => ({

  serviceType: text(draft.serviceType).trim() || null,
  clientName: text(draft.clientName).trim() || null,
  supervisingDepartmentCode: text(draft.supervisingDepartmentCode).trim() || null,
  serviceName: text(draft.serviceName).trim(),
  constructionStartDate: normalizeDateInputValue(draft.constructionStartDate),
  constructionCompleteDate: normalizeDateInputValue(draft.constructionCompleteDate),
  managementServiceCompleteDate: normalizeDateInputValue(draft.managementServiceCompleteDate),
  constructionStopFromDate: normalizeDateInputValue(draft.constructionStopFromDate),
  constructionStopToDate: normalizeDateInputValue(draft.constructionStopToDate),
  restartDate: normalizeDateInputValue(draft.restartDate),
  contractAmount: draft.contractAmount,
  shareAmount: draft.shareAmount,
  performanceCertification: text(draft.performanceCertification).trim() || null,
  participateListDocument: text(draft.participateListDocument).trim() || null,
  cemsConfirm: text(draft.cemsConfirm).trim() || null,
  remark: text(draft.remark).trim() || null,
  periodChangeReason: text(periodChangeReason).trim() || null,
});
