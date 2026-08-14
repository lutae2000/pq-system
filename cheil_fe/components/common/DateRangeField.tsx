"use client";

import { Box, TextField, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import { standardFieldSx } from "@/components/common/FormControls";

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
    <Box sx={[{ alignSelf: "start", display: "grid", gap: 0.75 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
      <Box sx={{ alignItems: "center", display: "grid", gap: 1, gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)" }}>
        <TextField
          fullWidth
          onChange={(event) => onStartChange(event.target.value)}
          placeholder={startLabel}
          size="small"
          slotProps={{ htmlInput: { max, min }, inputLabel: { shrink: true } }}
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
          placeholder={endLabel}
          size="small"
          slotProps={{ htmlInput: { max, min }, inputLabel: { shrink: true } }}
          sx={standardFieldSx}
          type="date"
          value={endValue}
        />
      </Box>
    </Box>
  );
}
