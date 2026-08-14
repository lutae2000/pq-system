export type CodeOption = {
  label: string;
  level1Code?: string;
  level2Code?: string;
  value: string | number;
};

export const text = (value: string | null | undefined) => value ?? "";

export const display = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

export const displayBlank = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "" : String(value);

export const displayTarget = (value: string | number | null | undefined, fallback: string) => displayBlank(value) || fallback;

export const tempId = () => -Date.now();

export const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
