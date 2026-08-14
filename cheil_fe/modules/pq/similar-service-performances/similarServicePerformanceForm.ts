import type { SimilarServicePerformanceRecord, SimilarServicePerformanceRequest } from "@/modules/pq/similar-service-performances/api";

export type { SimilarServicePerformanceRecord };

const text = (value: string | null | undefined) => value ?? "";

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatYmd = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseDateInput = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  if (normalized.length !== 8) {
    return null;
  }

  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));
  const day = Number(normalized.slice(6, 8));
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day ? null : date;
};

const minDate = (left: Date | null, right: Date | null) => {
  if (!left || !right) {
    return left ?? right;
  }

  return left.getTime() <= right.getTime() ? left : right;
};

const maxDate = (left: Date | null, right: Date | null) => {
  if (!left || !right) {
    return left ?? right;
  }

  return left.getTime() >= right.getTime() ? left : right;
};

export const defaultSimilarServicePerformanceRecord = (): SimilarServicePerformanceRecord => ({
  id: null,
  companyPerformanceSeq: null,
  serviceName: "",
  constructionType: null,
  client: null,
  contractFromDate: null,
  contractToDate: null,
  constructionFromDate: null,
  constructionToDate: null,
  contractPrice: null,
  shareRatio: null,
  weight: null,
  summary: null,
  remark: null,
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

export const formatText = (value: string | null | undefined) => value ?? "";
export const displayText = (value: string | null | undefined) => (value?.trim() ? value : "-");
export const formatNumberText = (value: number | null | undefined) => (value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR"));
export const formatNumberInputValue = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));

export const calculateAppliedAmount = (contractPrice: number | null | undefined, weight: number | null | undefined) => {
  const price = Number(contractPrice ?? 0);
  const weightRate = Number(weight ?? 0);

  return price * (1 + weightRate / 100);
};

export const getTodayDateInputValue = () => formatYmd(new Date());

export const subtractYearsFromDateInputValue = (value: string | null | undefined, years: number) => {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return "";
  }

  const next = new Date(parsed);
  next.setFullYear(next.getFullYear() - years);
  return formatYmd(next);
};

export const calculateInclusiveDayCount = (fromValue: string | null | undefined, toValue: string | null | undefined) => {
  const from = parseDateInput(fromValue);
  const to = parseDateInput(toValue);
  if (!from || !to || to < from) {
    return 0;
  }

  const inclusiveTo = new Date(to);
  inclusiveTo.setDate(inclusiveTo.getDate() + 1);
  return Math.max(0, Math.round((inclusiveTo.getTime() - from.getTime()) / 86400000));
};

export const calculateRecentThreeYearPeriod = (referenceDate: string | null | undefined, contractFromDate: string | null | undefined, contractToDate: string | null | undefined) => {
  const reference = parseDateInput(referenceDate);
  const contractFrom = parseDateInput(contractFromDate);
  const contractTo = parseDateInput(contractToDate);
  const windowStart = parseDateInput(subtractYearsFromDateInputValue(referenceDate, 3));
  const effectiveEnd = minDate(contractTo, reference);
  const periodStart = maxDate(contractFrom, windowStart);

  if (!periodStart || !effectiveEnd || effectiveEnd < periodStart) {
    return "-";
  }

  return formatPeriodText(formatYmd(periodStart), formatYmd(effectiveEnd));
};

export const calculateRecentThreeYearRatio = (referenceDate: string | null | undefined, contractFromDate: string | null | undefined, contractToDate: string | null | undefined) => {
  const reference = parseDateInput(referenceDate);
  const contractFrom = parseDateInput(contractFromDate);
  const contractTo = parseDateInput(contractToDate);
  const windowStart = parseDateInput(subtractYearsFromDateInputValue(referenceDate, 3));
  const effectiveEnd = minDate(contractTo, reference);
  const periodStart = maxDate(contractFrom, windowStart);

  if (!periodStart || !effectiveEnd || effectiveEnd < periodStart) {
    return null;
  }

  const recentDays = calculateInclusiveDayCount(formatYmd(periodStart), formatYmd(effectiveEnd));
  const contractDays = calculateInclusiveDayCount(contractFromDate, formatYmd(effectiveEnd));
  if (!contractDays) {
    return null;
  }

  return (recentDays / contractDays) * 100;
};

export const formatPercentageText = (value: number | null | undefined, fractionDigits = 1) =>
  value === null || value === undefined ? "-" : `${Number(value).toFixed(fractionDigits)}%`;

export const normalizeNumberInputValue = (value: string) => {
  const normalized = value.trim();
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
  const normalized = text(value).trim();
  return normalized ? normalized.replaceAll("-", "") : null;
};

export const formatPeriodText = (fromDate: string | null | undefined, toDate: string | null | undefined) => {
  const from = formatDateInputValue(fromDate);
  const to = formatDateInputValue(toDate);
  return from || to ? `${from || "-"} ~ ${to || "-"}` : "-";
};

export const toSimilarServicePerformanceRequest = (
  draft: SimilarServicePerformanceRecord,
): SimilarServicePerformanceRequest => ({
  serviceName: text(draft.serviceName).trim() || null,
  constructionType: draft.constructionType?.trim() ? draft.constructionType.trim() : null,
  client: draft.client?.trim() ? draft.client.trim() : null,
  contractFromDate: normalizeDateInputValue(draft.contractFromDate),
  contractToDate: normalizeDateInputValue(draft.contractToDate),
  constructionFromDate: normalizeDateInputValue(draft.constructionFromDate),
  constructionToDate: normalizeDateInputValue(draft.constructionToDate),
  contractPrice: draft.contractPrice,
  shareRatio: draft.shareRatio,
  weight: draft.weight,
  summary: draft.summary?.trim() ? draft.summary.trim() : null,
  remark: draft.remark?.trim() ? draft.remark.trim() : null,
});
