import type { ShinindoManagementRecord, ShinindoManagementRequest } from "@/modules/pq/shinindo-management/api";

export const EXPIRING_SOON_DAYS = 90;
export type ShinindoValidityStatus = "not-active" | "unknown" | "expired" | "expiring" | "valid";

export const emptyDraft = (clientCode = ""): ShinindoManagementRecord => ({
  id: 0,
  clientCode,
  clientName: "",
  itemName: "",
  appliedYn: "Y",
  score: null,
  acquiredDate: "",
  validUntil: "",
  remark: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

export const text = (value: string | null | undefined) => value ?? "";
export const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
export const numberValue = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));
export const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const compactDate = (value: string | null | undefined) => text(value).replace(/\D/g, "").slice(0, 8);
export const dashedDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "";
};
export const formatGridDate = (value: string | null | undefined) => dashedDate(value) || "-";

const parseDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  if (normalized.length !== 8) return null;
  const parsed = new Date(`${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const daysBetween = (left: Date, right: Date) => Math.floor((right.getTime() - left.getTime()) / 86400000);

export const isExpiringSoon = (validUntil: string | null | undefined, referenceDate: string | null | undefined) => {
  const validDate = parseDate(validUntil);
  const refDate = parseDate(referenceDate);
  if (!validDate || !refDate) return false;
  const diff = daysBetween(refDate, validDate);
  return diff >= 0 && diff <= EXPIRING_SOON_DAYS;
};

export const getValidityStatus = (
  row: Pick<ShinindoManagementRecord, "appliedYn" | "validUntil">,
  referenceDate: string | null | undefined,
): ShinindoValidityStatus => {
  if (row.appliedYn !== "Y") return "not-active";
  const validDate = parseDate(row.validUntil);
  const refDate = parseDate(referenceDate);
  if (!validDate || !refDate) return "unknown";
  if (validDate < refDate) return "expired";
  return daysBetween(refDate, validDate) <= EXPIRING_SOON_DAYS ? "expiring" : "valid";
};

export const toRequest = (draft: ShinindoManagementRecord): ShinindoManagementRequest => ({
  acquiredDate: compactDate(draft.acquiredDate) || null,
  appliedYn: draft.appliedYn,
  clientCode: text(draft.clientCode).trim(),
  itemName: text(draft.itemName).trim(),
  remark: text(draft.remark).trim() || null,
  score: draft.score,
  validUntil: compactDate(draft.validUntil) || null,
});
