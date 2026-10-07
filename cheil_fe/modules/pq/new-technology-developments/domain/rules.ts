import type { NewTechnologyDevelopmentRecord, NewTechnologyDevelopmentRequest } from "@/modules/pq/new-technology-developments/api";

export const TECHNOLOGY_TYPES = ["신기술", "특허", "신안"] as const;

export const today = () => new Date().toISOString().slice(0, 10).replaceAll("-", "");

export const emptyDraft = (): NewTechnologyDevelopmentRecord => ({
  id: 0,
  title: "",
  technologyType: "신기술",
  applicantCount: 1,
  useYn: true,
  applicationDate: "",
  elapsedYears: null,
  calculatedScore: null,
  targetField: "",
  applicationNo: "",
  registrationNo: "",
  validUntil: "",
  summary: "",
  remark: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

export const text = (value: string | null | undefined) => value ?? "";
export const compactDate = (value: string | null | undefined) => text(value).replace(/\D/g, "").slice(0, 8);
export const formatGridDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "-";
};
export const toDateInputValue = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "";
};
export const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
export const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const calculateAutoScore = (
  technologyType: string | null | undefined,
  applicantCount: number | null | undefined,
  elapsedYears: number | null | undefined,
) => {
  if (applicantCount === null || applicantCount === undefined || applicantCount <= 0) {
    return null;
  }

  const years = elapsedYears ?? 0;
  const baseScore = technologyType === "신기술" ? 2 : technologyType === "특허" ? (years < 5 ? 1 : years < 10 ? 0.8 : 0.6) : technologyType === "신안" ? (years < 5 ? 0.5 : years < 10 ? 0.4 : 0) : 0;
  return Number((baseScore / applicantCount).toFixed(2));
};

export const getValidityLabel = (validUntil: string | null | undefined, referenceDate: string | null | undefined) => {
  const normalizedValidUntil = compactDate(validUntil);
  const normalizedReferenceDate = compactDate(referenceDate);
  if (normalizedValidUntil.length !== 8 || normalizedReferenceDate.length !== 8) {
    return "-";
  }
  return normalizedValidUntil >= normalizedReferenceDate ? "유효" : "만료";
};

export const toDevelopmentRequest = (draft: NewTechnologyDevelopmentRecord): NewTechnologyDevelopmentRequest => ({
  applicantCount: draft.applicantCount,
  applicationDate: compactDate(draft.applicationDate),
  applicationNo: text(draft.applicationNo).trim(),
  calculatedScore: draft.calculatedScore,
  registrationNo: text(draft.registrationNo).trim(),
  remark: text(draft.remark).trim(),
  summary: text(draft.summary).trim(),
  targetField: text(draft.targetField).trim(),
  technologyType: text(draft.technologyType).trim(),
  title: text(draft.title).trim(),
  validUntil: compactDate(draft.validUntil),
  useYn: draft.useYn,
});
