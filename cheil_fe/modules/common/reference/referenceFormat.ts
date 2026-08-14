import type { ReferenceOption } from "@/modules/common/reference/referenceApi";

export type SelectOption<TValue extends string | number = string> = {
  label: string;
  value: TValue;
};

export function formatReferenceLabel(labelByValue: Record<string, string>, value: unknown) {
  const code = String(value ?? "").trim();
  return code ? labelByValue[code] ?? code : "";
}

export function formatPaddedLevel2CodeLabel(labelByValue: Record<string, string>, value: unknown) {
  const code = String(value ?? "").trim();
  if (!code) {
    return "";
  }

  const exactLabel = labelByValue[code];
  if (exactLabel) {
    return exactLabel;
  }

  const numericValue = Number(code);
  if (!Number.isFinite(numericValue)) {
    return code;
  }

  const paddedCode = String(Math.trunc(numericValue)).padStart(3, "0");
  const multipliedPaddedCode = String(Math.trunc(numericValue * 10)).padStart(3, "0");

  return labelByValue[paddedCode] ?? labelByValue[multipliedPaddedCode] ?? code;
}

export function toSelectOptions(options: Array<ReferenceOption>, includeCode = false): SelectOption[] {
  return options.map((option) => ({
    label: includeCode ? `${option.value} - ${option.label}` : option.label,
    value: option.value,
  }));
}

export function toNumericLevel2SelectOptions(options: Array<ReferenceOption>): SelectOption<number>[] {
  return options
    .map((option) => {
      const numericValue = Number(option.value);
      return {
        label: option.label,
        value: Number.isFinite(numericValue) ? Math.trunc(numericValue / 10) : NaN,
      };
    })
    .filter((option) => Number.isFinite(option.value));
}
