"use client";

import { InputAdornment, TextField } from "@mui/material";
import type { ReactNode } from "react";

import { standardFieldSx } from "@/components/common/FormControls";
import { formatMoney } from "@/modules/common/formatters";

export type MoneyInputFieldProps = {
  disabled?: boolean;
  endAdornment?: ReactNode;
  hideZero?: boolean;
  integerOnly?: boolean;
  onChange: (value: number | null) => void;
  placeholder?: string;
  readOnly?: boolean;
  value: number | null | undefined;
};

export function MoneyInputField({
  disabled = false,
  endAdornment,
  hideZero = false,
  integerOnly = false,
  onChange,
  placeholder,
  readOnly = false,
  value,
}: MoneyInputFieldProps) {
  const formattedValue = value === null || value === undefined || (hideZero && value === 0) ? "" : formatMoney(value);

  return (
    <TextField
      fullWidth
      disabled={disabled}
      inputMode={integerOnly ? "numeric" : "decimal"}
      onChange={(event) => {
        const normalized = integerOnly
          ? event.target.value.replace(/[^\d]/g, "")
          : event.target.value.replaceAll(",", "").trim();
        if (!normalized) {
          onChange(null);
          return;
        }

        const parsed = Number(normalized);
        onChange(Number.isFinite(parsed) ? parsed : null);
      }}
      placeholder={placeholder}
      size="small"
      slotProps={{
        htmlInput: { readOnly },
        ...(endAdornment ? { input: { endAdornment: <InputAdornment position="end">{endAdornment}</InputAdornment> } } : {}),
      }}
      sx={standardFieldSx}
      value={formattedValue}
    />
  );
}
