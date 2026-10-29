"use client";

import { Box, Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import { standardFieldSx } from "@/components/common/FormControls";

export type CheckboxOption<TValue extends string> = { label: string; value: TValue };

export type CheckboxSelectInputProps<TValue extends string> = {
  label: string;
  labelPlacement?: "inside" | "top";
  name: string;
  onChange: (name: string, value: TValue[]) => void;
  options: CheckboxOption<TValue>[];
  placeholder?: string;
  sx?: SxProps<Theme>;
  value: TValue[];
};

export function CheckboxSelectInput<TValue extends string>({
  label,
  labelPlacement = "top",
  name,
  onChange,
  options,
  placeholder = "전체",
  sx,
  value,
}: CheckboxSelectInputProps<TValue>) {
  const select = (
    <Select
        multiple
        label={labelPlacement === "inside" ? label : undefined}
        labelId={labelPlacement === "inside" ? `${name}-label` : undefined}
        name={name}
        onChange={((event: SelectChangeEvent<string[]>) => {
          const rawValue = event.target.value as unknown as string | string[];
          const next =
            typeof rawValue === "string"
              ? (rawValue.split(",") as unknown as TValue[])
              : (rawValue as unknown as TValue[]);
          onChange(name, next);
        }) as (event: SelectChangeEvent<TValue[]>) => void}
        renderValue={(selected) => {
          const selectedValues = selected as TValue[];
          if (selectedValues.length === 0) {
            return placeholder;
          }

          return options
            .filter((option) => selectedValues.includes(option.value))
            .map((option) => option.label)
            .join(", ");
        }}
        size="small"
        sx={[standardFieldSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
        value={value}
      >
        {options.map((option, index) => (
          <MenuItem key={`checkbox-select-${name}-${index}-${option.value}`} value={option.value}>
            <Checkbox checked={value.includes(option.value)} size="small" />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
  );

  return labelPlacement === "inside" ? (
    <FormControl fullWidth size="small">
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      {select}
    </FormControl>
  ) : (
    <Box sx={{ display: "grid", gap: 0.75, alignSelf: "start" }}>
      <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
      {select}
    </Box>
  );
}
