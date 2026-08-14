"use client";

import { Box, MenuItem, TextField, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useMemo } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";

import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type CommonSelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type QueryParamValue = string | number | boolean | null | undefined;

export type CommonSelectFieldProps<TItem, TValue extends string> = {
  disabled?: boolean;
  errorLabel?: string;
  label: string;
  labelPlacement?: "field" | "top";
  labelKey?: keyof TItem;
  leadingOptions?: readonly CommonSelectOption<TValue>[];
  loadingLabel?: string;
  mapOption?: (item: TItem) => CommonSelectOption<TValue>;
  onChange: (value: TValue | "") => void;
  options?: readonly CommonSelectOption<TValue>[];
  placeholder?: string;
  placeholderDisabled?: boolean;
  params?: Record<string, QueryParamValue>;
  queryFn?: () => Promise<readonly TItem[]>;
  queryKey?: QueryKey;
  required?: boolean;
  size?: "small" | "medium";
  sortOptions?: (left: CommonSelectOption<TValue>, right: CommonSelectOption<TValue>) => number;
  sx?: SxProps<Theme>;
  trailingOptions?: readonly CommonSelectOption<TValue>[];
  uri?: string;
  value: TValue | "";
  valueKey?: keyof TItem;
};

export type CommonSelectDataSource<TItem, TValue extends string> = Pick<
  CommonSelectFieldProps<TItem, TValue>,
  "labelKey" | "loadingLabel" | "mapOption" | "params" | "queryFn" | "queryKey" | "sortOptions" | "uri" | "valueKey"
>;

export const defineCommonSelectDataSource = <TItem, TValue extends string>(
  dataSource: CommonSelectDataSource<TItem, TValue>,
) => dataSource;

const normalizeParams = (params: Record<string, QueryParamValue> | undefined) => {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
};

const mapOptionByKeys = <TItem, TValue extends string>(
  item: TItem,
  valueKey: keyof TItem,
  labelKey: keyof TItem,
): CommonSelectOption<TValue> => {
  const record = item as Record<keyof TItem, unknown>;
  return {
    label: String(record[labelKey] ?? ""),
    value: String(record[valueKey] ?? "") as TValue,
  };
};

export function CommonSelectField<TItem, TValue extends string>({
  disabled = false,
  errorLabel = "선택 항목을 불러오지 못했습니다.",
  label,
  labelKey,
  labelPlacement = "field",
  leadingOptions,
  loadingLabel = "Loading...",
  mapOption,
  onChange,
  options: fixedOptions,
  params,
  placeholder = "Select",
  placeholderDisabled = true,
  queryFn,
  queryKey,
  required = false,
  size = "small",
  sortOptions,
  sx,
  trailingOptions,
  uri,
  value,
  valueKey,
}: CommonSelectFieldProps<TItem, TValue>) {
  const hasQuerySource = Boolean(queryFn || uri);
  const enabled = useTabQueryEnabled(hasQuerySource);
  const query = useQuery({
    queryKey: queryKey ?? ["common-select-field", uri ?? label, params ?? null],
    queryFn:
      queryFn ??
      (async () => {
        if (!uri) {
          return [] as readonly TItem[];
        }

        return apiRequest(apiClient.get<readonly TItem[]>(uri, { params: normalizeParams(params) }), errorLabel);
      }),
    enabled,
  });

  const options = useMemo(() => {
    const sourceOptions = fixedOptions
      ? [...fixedOptions]
      : mapOption
        ? (query.data ?? []).map(mapOption)
        : valueKey && labelKey
          ? (query.data ?? []).map((item) => mapOptionByKeys<TItem, TValue>(item, valueKey, labelKey))
          : [];
    const mapped = sortOptions ? [...sourceOptions].sort(sortOptions) : sourceOptions;
    const uniqueOptions = new Map<string, CommonSelectOption<TValue>>();

    [...(leadingOptions ?? []), ...mapped, ...(trailingOptions ?? [])].forEach((option) => {
      if (option.value && !uniqueOptions.has(option.value)) {
        uniqueOptions.set(option.value, option);
      }
    });

    if (value && !uniqueOptions.has(value)) {
      uniqueOptions.set(value, { label: value, value });
    }

    return [...uniqueOptions.values()];
  }, [fixedOptions, labelKey, leadingOptions, mapOption, query.data, sortOptions, trailingOptions, value, valueKey]);

  const field = (
    <TextField
      fullWidth
      label={labelPlacement === "field" ? label : undefined}
      onChange={(event) => onChange(event.target.value as TValue | "")}
      select
      size={size}
      sx={sx ?? standardFieldSx}
      value={value}
      disabled={disabled}
      helperText={query.isError ? errorLabel : undefined}
      error={query.isError}
      required={required}
      slotProps={{
        select: {
          displayEmpty: true,
          renderValue: (selected) => {
            if (selected === "") {
              return placeholder;
            }

            const matched = options.find((option) => option.value === selected);
            return matched?.label ?? String(selected);
          },
        },
      }}
    >
      <MenuItem value="" disabled={placeholderDisabled}>
        {placeholder}
      </MenuItem>
      {query.isLoading && hasQuerySource ? (
        <MenuItem value="" disabled>
          {loadingLabel}
        </MenuItem>
      ) : null}
      {options.map((option, index) => (
        <MenuItem key={`common-select-${label}-${index}-${option.value}`} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  if (labelPlacement === "top") {
    return (
      <Box sx={{ display: "grid", gap: 0.75, alignSelf: "start" }}>
        <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
        {field}
      </Box>
    );
  }

  return field;
}
