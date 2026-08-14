"use client";

import { Box, MenuItem, TextField, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import { standardFieldSx } from "@/components/common/FormControls";

export type PeriodRangeOption<TValue extends string> = {
  label: string;
  value: TValue;
};

export type PeriodRangeFieldProps<TValue extends string> = {
  endValue: string;
  label: string;
  onEndChange: (value: string) => void;
  onPeriodChange: (value: TValue) => void;
  onStartChange: (value: string) => void;
  options: readonly PeriodRangeOption<TValue>[];
  periodValue: TValue;
  startValue: string;
  sx?: SxProps<Theme>;
};

export function PeriodRangeField<TValue extends string>({
  endValue,
  label,
  onEndChange,
  onPeriodChange,
  onStartChange,
  options,
  periodValue,
  startValue,
  sx,
}: PeriodRangeFieldProps<TValue>) {
  return (
    <Box sx={[{ alignSelf: "start", display: "grid", gap: 0.75 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
      <Box
        sx={{
          alignItems: "center",
          display: "grid",
          gap: 1,
          gridTemplateColumns: "minmax(96px, 116px) minmax(0, 1.15fr) auto minmax(0, 1.15fr)",
        }}
      >
        <TextField
          fullWidth
          onChange={(event) => onPeriodChange(event.target.value as TValue)}
          select
          size="small"
          sx={standardFieldSx}
          value={periodValue}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          onChange={(event) => onStartChange(event.target.value)}
          size="small"
          sx={standardFieldSx}
          type="date"
          value={startValue}
        />
        <Typography color="text.secondary" sx={{ fontSize: 18, lineHeight: 1 }}>
          ~
        </Typography>
        <TextField
          fullWidth
          onChange={(event) => onEndChange(event.target.value)}
          size="small"
          sx={standardFieldSx}
          type="date"
          value={endValue}
        />
      </Box>
    </Box>
  );
}
