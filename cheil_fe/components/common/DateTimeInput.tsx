"use client";

import { TextField } from "@mui/material";
import { standardFieldSx } from "@/components/common/FormControls";

export type DateTimeInputProps = {
  label?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  value: string;
};

function toInputValue(value: string) {
  if (!value) {
    return "";
  }

  return value.trim().replace(" ", "T").slice(0, 16);
}

function fromInputValue(value: string) {
  const normalized = value.trim().replace("T", " ");
  if (!normalized) {
    return "";
  }

  const [datePart = "", timePart = ""] = normalized.split(" ");
  if (!datePart || !timePart) {
    return normalized;
  }

  return `${datePart} ${timePart.slice(0, 5)}`;
}

export function DateTimeInput({ label, onChange, readOnly = false, value }: DateTimeInputProps) {
  return (
    <TextField
      fullWidth
      label={label}
      onChange={(event) => onChange(fromInputValue(event.target.value))}
      size="small"
      slotProps={{ htmlInput: { readOnly }, inputLabel: { shrink: true } }}
      sx={standardFieldSx}
      type="datetime-local"
      value={toInputValue(value)}
    />
  );
}
