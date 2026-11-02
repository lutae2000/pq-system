import type { NewTechnologyDevelopmentRecord, NewTechnologyDevelopmentRequest } from "@/modules/pq/new-technology-developments/api";
import { todayLocalDate, toDateInputValueFromDigits } from "@/modules/common/formatters";

export const TECHNOLOGY_TYPES = ["신기술", "특허"] as const;
export const WORK_CATEGORIES = ["설계", "감리", "건축"] as const;

export const today = () => todayLocalDate().replaceAll("-", "");

export const emptyDraft = (): NewTechnologyDevelopmentRecord => ({
  id: 0,
  title: "",
  technologyType: "신기술",
  workCategory: "",
  applicantCount: 1,
  useYn: true,
  applicationDate: "",
  elapsedYears: null,
  calculatedScore: null,
  autoCalculatedScore: null,
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
  return toDateInputValueFromDigits(value) || "-";
};
export const toDateInputValue = toDateInputValueFromDigits;
export const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
export const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const calculateAutoScore = (
  workCategory: string | null | undefined,
  baseScore: number | null | undefined,
  applicantCount: number | null | undefined,
) => {
  if ((workCategory !== "설계" && workCategory !== "감리") || baseScore === null || baseScore === undefined || applicantCount === null || applicantCount === undefined || applicantCount <= 0) {
    return null;
  }
  return Math.trunc((baseScore / applicantCount) * 1000) / 1000;
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
  workCategory: text(draft.workCategory).trim() || null,
  registrationNo: text(draft.registrationNo).trim(),
  remark: text(draft.remark).trim(),
  summary: text(draft.summary).trim(),
  targetField: text(draft.targetField).trim(),
  technologyType: text(draft.technologyType).trim(),
  title: text(draft.title).trim(),
  validUntil: compactDate(draft.validUntil),
  useYn: draft.useYn,
});
