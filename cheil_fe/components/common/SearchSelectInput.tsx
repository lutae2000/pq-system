"use client";

import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import { standardFieldSx } from "@/components/common/FormControls";

export type SearchSelectInputProps = {
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  sx?: SxProps<Theme>;
  value: string;
};

export function SearchSelectInput({ label, onChange, options, placeholder = "전체", sx, value }: SearchSelectInputProps) {
  return (
    <Box sx={{ display: "grid", gap: 0.75, alignSelf: "start" }}>
      <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
      <Autocomplete
        freeSolo
        disableClearable={false}
        filterSelectedOptions
        inputValue={value}
        onChange={(_, nextValue) => onChange(nextValue ?? "")}
        onInputChange={(_, nextInputValue) => onChange(nextInputValue)}
        options={[...options]}
        renderInput={(params) => (
          <TextField {...params} fullWidth placeholder={placeholder} size="small" sx={[standardFieldSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} />
        )}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              mt: 0.5,
              "& .MuiAutocomplete-option": {
                fontSize: 13,
                minHeight: 34,
              },
            },
          },
        }}
        value={value}
      />
    </Box>
  );
}
