"use client";

import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { DateInput } from "./DateTimeInput";

export type DateRangeFieldProps = {
  endLabel?: string;
  endValue: string;
  label: string;
  max?: string;
  min?: string;
  onEndChange: (value: string) => void;
  onStartChange: (value: string) => void;
  startLabel?: string;
  startValue: string;
  sx?: SxProps<Theme>;
};

export function DateRangeField({
  endLabel = "종료일",
  endValue,
  label,
  max,
  min,
  onEndChange,
  onStartChange,
  startLabel = "시작일",
  startValue,
  sx,
}: DateRangeFieldProps) {
  return (
    <Box sx={[{ alignSelf: "start" }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      <Box sx={{ alignItems: "center", display: "grid", gap: 1, gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)" }}>
        <DateInput
          ariaLabel={`${label} ${startLabel}`}
          label={label}
          max={max}
          min={min}
          onChange={onStartChange}
          value={startValue}
        />
        <Typography color="text.secondary" sx={{ fontSize: 18, lineHeight: 1 }}>
          ~
        </Typography>
        <DateInput
          label={endLabel}
          max={max}
          min={min}
          onChange={onEndChange}
          showLabel={false}
          value={endValue}
        />
      </Box>
    </Box>
  );
}
