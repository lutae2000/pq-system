"use client";

import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select, TextField } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type SelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

export type CheckboxOption<TValue extends string> = {
  label: string;
  value: TValue;
};

export type TextInputProps = {
  label: string;
  name: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
  sx?: SxProps<Theme>;
  type?: string;
  value: string;
};

export const standardFieldSx = {
  "& .MuiInputBase-root": {
    minHeight: 34,
  },
  "& .MuiInputBase-input": {
    py: 0.6,
  },
  "& .MuiSelect-select": {
    py: 0.6,
  },
} as const;

export const compactFieldSx = standardFieldSx;

export function TextInput({ label, name, onChange, required, sx, type = "text", value }: TextInputProps) {
  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      onChange={(event) => onChange(name, event.target.value)}
      required={required}
      size="small"
      sx={sx ?? standardFieldSx}
      type={type}
      value={value}
    />
  );
}

export type SelectInputProps<TValue extends string> = {
  label: string;
  name: string;
  onChange: (name: string, value: TValue) => void;
  options: SelectOption<TValue>[];
  value: TValue;
};

export function SelectInput<TValue extends string>({
  label,
  name,
  onChange,
  options,
  value,
}: SelectInputProps<TValue>) {
  const labelId = `${name}-label`;

  return (
    <FormControl fullWidth size="small">
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        label={label}
        labelId={labelId}
        name={name}
        onChange={(event: SelectChangeEvent<TValue>) => onChange(name, event.target.value as TValue)}
        value={value}
      >
        {options.map((option, index) => (
          <MenuItem key={`select-${name}-${index}-${option.value}`} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export type CheckboxListInputProps<TValue extends string> = {
  label: string;
  name: string;
  onChange: (name: string, value: TValue[]) => void;
  options: CheckboxOption<TValue>[];
  value: TValue[];
};

export function CheckboxListInput<TValue extends string>({
  label,
  name,
  onChange,
  options,
  value,
}: CheckboxListInputProps<TValue>) {
  const labelId = `${name}-label`;

  return (
    <FormControl fullWidth size="small">
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        multiple
        label={label}
        labelId={labelId}
        name={name}
        onChange={((event: SelectChangeEvent<string[]>) => {
          const rawValue = event.target.value as unknown as string | string[];
          const next =
            typeof rawValue === "string"
              ? (rawValue.split(",") as unknown as TValue[])
              : (rawValue as unknown as TValue[]);
          onChange(name, next);
        }) as (event: SelectChangeEvent<TValue[]>) => void}
        renderValue={(selected) =>
          selected.length > 0
            ? options
                .filter((option) => (selected as TValue[]).includes(option.value))
                .map((option) => option.label)
                .join(", ")
            : "선택"
        }
        value={value}
      >
        {options.map((option, index) => (
          <MenuItem key={`checkbox-${name}-${index}-${option.value}`} value={option.value}>
            <Checkbox checked={value.includes(option.value)} size="small" />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
