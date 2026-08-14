"use client";

import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";

export type StatusChipTone = "default" | "primary" | "success" | "warning" | "error" | "info";

export type StatusChipOption = {
  color?: StatusChipTone;
  label: string;
  variant?: "filled" | "outlined";
};

export type StatusChipProps<TValue extends string | number | boolean> = {
  defaultLabel?: string;
  options?: Partial<Record<string, StatusChipOption>>;
  size?: ChipProps["size"];
  value: TValue;
  variant?: ChipProps["variant"];
};

const booleanOptions: Record<string, StatusChipOption> = {
  false: { color: "default", label: "미사용", variant: "outlined" },
  true: { color: "success", label: "사용", variant: "filled" },
};

export function StatusChip<TValue extends string | number | boolean>({
  defaultLabel = "-",
  options,
  size = "small",
  value,
  variant = "filled",
}: StatusChipProps<TValue>) {
  const key = String(value);
  const resolved = options?.[key] ?? (typeof value === "boolean" ? booleanOptions[key] : undefined);

  return (
    <Chip
      color={resolved?.color ?? "default"}
      label={resolved?.label ?? defaultLabel}
      size={size}
      variant={resolved?.variant ?? variant}
    />
  );
}
