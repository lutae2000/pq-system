"use client";

import type { GridRenderEditCellParams } from "@mui/x-data-grid";
import { toCompactDate } from "@/modules/common/formatters";
import { DateInput, type DateTimeInputProps } from "./DateTimeInput";

const gridDateInputSx = {
  "& .MuiInputBase-root": { pr: 0.5 },
  "& .MuiInputBase-input": { fontSize: 13, px: 0.5, textAlign: "center" },
  "& .MuiInputAdornment-root": { ml: 0 },
  "& .MuiIconButton-root": { mr: 0, p: 0.25 },
};

export function GridDateEditInput({ params, onKeyDown }: {
  params: GridRenderEditCellParams;
  onKeyDown?: DateTimeInputProps["onKeyDown"];
}) {
  return (
    <DateInput
      autoFocus={params.hasFocus}
      inGrid
      label={params.colDef.headerName}
      onChange={(value) => void params.api.setEditCellValue({ id: params.id, field: params.field, value: toCompactDate(value) })}
      onKeyDown={onKeyDown}
      showLabel={false}
      sx={gridDateInputSx}
      value={String(params.value ?? "")}
    />
  );
}
