export const formatMoney = (value: number) => new Intl.NumberFormat("ko-KR").format(value);

export const formatLocalizedNumber = (
  value: string | number | null | undefined,
  options: { emptyValue?: string; maximumFractionDigits?: number; minimumFractionDigits?: number } = {},
) => {
  if (value === null || value === undefined || value === "") {
    return options.emptyValue ?? "";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? new Intl.NumberFormat("ko-KR", {
        maximumFractionDigits: options.maximumFractionDigits,
        minimumFractionDigits: options.minimumFractionDigits,
      }).format(numericValue)
    : String(value);
};

export const text = (value: string | null | undefined) => value ?? "";

export const dateOnly = (value: string | null | undefined) => text(value).slice(0, 10);

export const ymdText = (value: string | null | undefined) => dateOnly(value).replaceAll("-", "");

/** Convert a date input value (YYYY-MM-DD) to the compact YYYYMMDD format used by APIs. */
export const toCompactDate = (value: string | null | undefined) => {
  const normalized = text(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized.replaceAll("-", "") : normalized;
};

/** Convert compact YYYYMMDD dates to the YYYY-MM-DD value required by HTML date inputs. */
export const toDateInputValue = (value: string | null | undefined) => {
  const normalized = text(value).trim();
  if (/^\d{8}$/.test(normalized)) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  return normalized.slice(0, 10);
};

/** Accept compact dates and date-time strings while returning a value usable by an HTML date input. */
export const toDateInputValueFromDigits = (value: string | null | undefined) => {
  const digits = text(value).replace(/\D/g, "").slice(0, 8);
  return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : "";
};

/** Use the browser's local calendar date instead of the UTC date from toISOString(). */
export const todayLocalDate = (date: Date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const localDateTimeText = (date: Date = new Date()) =>
  `${todayLocalDate(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export const dateTimeText = (value: string | null | undefined) => {
  const normalized = text(value).trim().replace("T", " ");
  if (!normalized) {
    return "";
  }
  return normalized.length > 10 ? normalized.slice(0, 16) : normalized;
};

export const apiDate = (value: string) => {
  const normalized = value.trim();
  if (/^\d{8}$/.test(normalized)) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  return dateOnly(normalized);
};

export const apiDateTime = (value: string) => {
  const normalized = value.trim().replace("T", " ");
  if (!normalized) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T00:00:00`;
  }
  return `${normalized.slice(0, 16).replace(" ", "T")}:00`;
};

export const ynToBool = (value: string | null | undefined) => text(value).toUpperCase() === "Y";

export const boolToYn = (value: boolean) => (value ? "Y" : "N");
