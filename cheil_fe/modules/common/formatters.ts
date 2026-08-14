export const formatMoney = (value: number) => new Intl.NumberFormat("ko-KR").format(value);

export const text = (value: string | null | undefined) => value ?? "";

export const dateOnly = (value: string | null | undefined) => text(value).slice(0, 10);

export const ymdText = (value: string | null | undefined) => dateOnly(value).replaceAll("-", "");

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
