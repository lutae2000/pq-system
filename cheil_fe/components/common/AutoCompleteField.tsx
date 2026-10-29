"use client";

import { Autocomplete, Box, MenuItem, TextField, Typography, type TextFieldProps } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { CLIENT_CODE_PAGE_SIZE } from "@/modules/code/clients/api";
import type { CommonCodeSearchParams } from "@/modules/code/common-codes/api";
import type { ConstructionTypeSearchParams } from "@/modules/code/construction-types/api";
import type { DepartmentSearchParams } from "@/modules/code/departments/api";
import type { ClientReferenceSearchParams, CommonCodeReferenceSort, UserReferenceSearchParams } from "@/modules/common/reference/referenceApi";
import { useClientOptions, useCommonCodeLevel1Options, useCommonCodeLevel2Options, useCommonCodeLevel3Options, useConstructionTypeOptions, useDepartmentOptions, useRoleOptions, useUserOptions } from "@/modules/common/reference/useReferenceOptions";
import { listEngineerProfiles, type EngineerProfileListFilters } from "@/modules/pq/engineers/api";
import type { SystemRoleSearchParams } from "@/modules/system/roles/api";

export type ReferenceOption = { label: string; value: string };
type ReferenceControlProps = Omit<TextFieldProps, "onChange" | "select" | "value"> & { onChange: (value: string) => void; value: string };

export type AutoCompleteSource =
  | { type: "department"; params?: DepartmentSearchParams; valueMode?: "code" | "name" }
  | { type: "client"; params?: ClientReferenceSearchParams; searchOnInput?: boolean; valueMode?: "code" | "name"; initialSearchKeyword?: string }
  | { type: "user"; params?: UserReferenceSearchParams; searchOnInput?: boolean }
  | { type: "engineer"; params?: EngineerProfileListFilters }
  | { type: "role"; params?: SystemRoleSearchParams }
  | { type: "construction-type"; params?: ConstructionTypeSearchParams }
  | { type: "common-code-level1"; params?: CommonCodeSearchParams }
  | { type: "common-code-level2"; level1Code: string; params?: Omit<CommonCodeSearchParams, "level1Code">; sort?: CommonCodeReferenceSort }
  | { type: "common-code-level3"; level1Code: string; level2Code: string; params?: Omit<CommonCodeSearchParams, "codeLevel" | "level1Code" | "level2Code"> };

type FieldProps = ReferenceControlProps & {
  allValue?: string;
  clearOnEscape?: boolean;
  freeSolo?: boolean;
  includeAll?: boolean;
  inputValue?: string;
  enabled?: boolean;
  labelPlacement?: "inside" | "top";
  loading?: boolean;
  loadingLabel?: string;
  mode?: "autocomplete" | "select";
  noOptionsText?: string;
  onSearchChange?: (keyword: string) => void;
  onInputValueChange?: (value: string) => void;
  placeholderDisabled?: boolean;
  readOnly?: boolean;
  showCode?: boolean;
  valueLabel?: string;
};

export type AutoCompleteFieldProps<T = ReferenceOption> = FieldProps & (
  | { source: AutoCompleteSource; options?: never; items?: never; mapOption?: never }
  | { source?: never; options: readonly ReferenceOption[]; items?: never; mapOption?: never }
  | { source?: never; options?: never; items: readonly T[]; mapOption: (item: T) => ReferenceOption }
);

/** source는 내부 조회, items/mapOption은 호출자가 조회한 API 응답을 표시할 때 사용한다. */
export function AutoCompleteField<T = ReferenceOption>(props: AutoCompleteFieldProps<T>) {
  if (props.source) {
    switch (props.source.type) {
      case "department": return <DepartmentField {...props} source={props.source} />;
      case "client": return <ClientField {...props} source={props.source} />;
      case "user": return <UserField {...props} source={props.source} />;
      case "engineer": return <EngineerField {...props} source={props.source} />;
      case "role": return <RoleField {...props} source={props.source} />;
      case "construction-type": return <ConstructionTypeField {...props} source={props.source} />;
      case "common-code-level1": return <CommonCodeLevel1Field {...props} source={props.source} />;
      case "common-code-level2": return <CommonCodeLevel2Field {...props} source={props.source} />;
      case "common-code-level3": return <CommonCodeLevel3Field {...props} source={props.source} />;
    }
  }
  if (props.items) {
    const { items, mapOption, ...fieldProps } = props;
    return <FieldControl {...fieldProps} options={items.map(mapOption)} />;
  }
  const { options, ...fieldProps } = props;
  return <FieldControl {...fieldProps} options={options} />;
}

function DepartmentField({ source, enabled = true, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "department" }> }) {
  const result = useDepartmentOptions(source.params ?? { useYn: true }, { enabled });
  const options = source.valueMode === "name"
    ? result.options.map((option) => ({ label: option.label, value: option.label }))
    : result.options;
  return <FieldControl {...props} loading={result.isLoading} options={options} />;
}

function ClientField({ source, enabled = true, onChange, readOnly = false, value, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "client" }> }) {
  const [keyword, setKeyword] = useState("");
  const { params = {}, searchOnInput = false, valueMode = "code", initialSearchKeyword = "" } = source;
  const result = useClientOptions(
    searchOnInput ? { ...params, businessName: keyword || initialSearchKeyword, page: 0, size: params.size ?? CLIENT_CODE_PAGE_SIZE } : params,
    { enabled: enabled && (!searchOnInput || (!readOnly && Boolean(keyword.trim() || (!value && initialSearchKeyword.trim())))) },
  );

  useEffect(() => {
    if (!searchOnInput || readOnly || value || !initialSearchKeyword.trim() || !result.isSuccess) return;
    const name = initialSearchKeyword.trim();
    const matched = result.items.find((client) => client.orderName?.trim().toLowerCase() === name.toLowerCase());
    onChange(matched ? (valueMode === "code" ? matched.clientCode : matched.orderName) : name);
  }, [initialSearchKeyword, onChange, readOnly, result.isSuccess, result.items, searchOnInput, value, valueMode]);

  const options: ReferenceOption[] = searchOnInput
    ? result.items.map((client) => ({
        label: client.orderName ? `${client.orderName} (${client.clientCode})` : client.clientCode,
        value: valueMode === "code" ? client.clientCode : client.orderName || client.clientCode,
      }))
    : result.options;
  return <FieldControl {...props} loading={result.isLoading} onChange={onChange} onSearchChange={searchOnInput ? setKeyword : props.onSearchChange} options={options} readOnly={readOnly} value={value} />;
}

function UserField({ source, enabled = true, value, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "user" }> }) {
  const [keyword, setKeyword] = useState("");
  const result = useUserOptions(source.searchOnInput ? { ...source.params, keyword: keyword || value } : source.params, { enabled });
  return <FieldControl {...props} loading={result.isLoading} onSearchChange={source.searchOnInput ? setKeyword : props.onSearchChange} options={result.options} value={value} />;
}

function EngineerField({ source, enabled = true, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "engineer" }> }) {
  const queryEnabled = useTabQueryEnabled(enabled);
  const result = useQuery({
    queryKey: ["reference-selects", "engineers", source.params],
    queryFn: () => listEngineerProfiles(source.params),
    enabled: queryEnabled,
    staleTime: 10 * 60 * 1000,
  });
  const options = (result.data ?? []).map((profile) => ({ label: profile.summary.name || profile.summary.id, value: profile.summary.id }));
  return <FieldControl {...props} loading={result.isLoading} options={options} />;
}

function RoleField({ source, enabled = true, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "role" }> }) {
  const result = useRoleOptions(source.params ?? { useYn: true }, { enabled });
  return <FieldControl {...props} loading={result.isLoading} options={result.options} />;
}

function ConstructionTypeField({ source, enabled = true, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "construction-type" }> }) {
  const result = useConstructionTypeOptions(source.params ?? { useYn: "Y" }, { enabled });
  return <FieldControl {...props} loading={result.isLoading} options={result.options} />;
}

function CommonCodeLevel1Field({ source, enabled = true, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "common-code-level1" }> }) {
  const result = useCommonCodeLevel1Options(source.params ?? { useYn: "Y" }, { enabled });
  return <FieldControl {...props} loading={result.isLoading} options={result.options} />;
}

function CommonCodeLevel2Field({ source, enabled = true, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "common-code-level2" }> }) {
  const result = useCommonCodeLevel2Options(source.level1Code, source.params ?? { useYn: "Y" }, { enabled }, source.sort);
  return <FieldControl {...props} disabled={props.disabled || !source.level1Code} loading={result.isLoading} options={result.options} />;
}

function CommonCodeLevel3Field({ source, enabled = true, ...props }: FieldProps & { source: Extract<AutoCompleteSource, { type: "common-code-level3" }> }) {
  const result = useCommonCodeLevel3Options(source.level1Code, source.level2Code, source.params ?? { useYn: "Y" }, { enabled });
  return <FieldControl {...props} disabled={props.disabled || !source.level1Code || !source.level2Code} loading={result.isLoading} options={result.options} />;
}

function FieldControl({
  allValue = "",
  clearOnEscape,
  disabled,
  enabled,
  freeSolo = false,
  includeAll = false,
  inputValue,
  label,
  labelPlacement = "inside",
  loading = false,
  loadingLabel = "조회 중입니다.",
  mode = "autocomplete",
  noOptionsText,
  onChange,
  onSearchChange,
  onInputValueChange,
  options,
  placeholder = "선택",
  placeholderDisabled = true,
  readOnly = false,
  showCode = false,
  sx,
  value,
  valueLabel,
  ...textFieldProps
}: FieldProps & { options: readonly ReferenceOption[] }) {
  void enabled;
  const [selectedOverride, setSelectedOverride] = useState<ReferenceOption | null>(null);
  if (mode === "select") {
    const hasValue = !value || options.some((option) => option.value === value);
    const field = <TextField fullWidth select size="small" sx={sx ?? standardFieldSx} {...textFieldProps}
      disabled={disabled || loading || readOnly} label={labelPlacement === "inside" ? label : undefined}
      onChange={(event) => onChange(event.target.value)} value={value || (includeAll ? allValue || "All" : "")}
      slotProps={{
        select: {
          displayEmpty: true,
          renderValue: (selected) => {
            if (!selected) return placeholder;
            if (includeAll && selected === (allValue || "All")) return "전체";
            const option = options.find((item) => item.value === selected);
            return option ? (showCode ? `${option.value} - ${option.label}` : option.label) : valueLabel || String(selected);
          },
        },
      }}>
      {includeAll ? <MenuItem value={allValue || "All"}>전체</MenuItem> : <MenuItem disabled={placeholderDisabled} value="">{placeholder}</MenuItem>}
      {loading ? <MenuItem disabled value="">{loadingLabel}</MenuItem> : null}
      {!hasValue ? <MenuItem value={value}>{valueLabel || value}</MenuItem> : null}
      {options.map((option) => <MenuItem key={option.value} value={option.value}>{showCode ? `${option.value} - ${option.label}` : option.label}</MenuItem>)}
    </TextField>;
    return labelPlacement === "top" && label ? (
      <Box sx={{ display: "grid", gap: 0.75, alignSelf: "start" }}>
        <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</Typography>
        {field}
      </Box>
    ) : field;
  }
  const resolvedOptions = [
    ...(!placeholderDisabled || includeAll ? [{ label: includeAll ? "전체" : placeholder, value: includeAll ? allValue : "" }] : []),
    ...options,
    ...(selectedOverride?.value === value ? [selectedOverride] : []),
  ];
  if (value && !resolvedOptions.some((option) => option.value === value)) {
    resolvedOptions.push({ label: valueLabel || value, value });
  }
  const uniqueOptions = [...new Map(resolvedOptions.map((option) => [option.value, option])).values()];
  const selectedOption = uniqueOptions.find((option) => option.value === value) ?? null;

  const autocomplete = (
    <Autocomplete
      autoHighlight
      autoSelect={freeSolo}
      clearOnEscape={clearOnEscape ?? labelPlacement === "top"}
      disabled={disabled || (labelPlacement === "top" && readOnly) || (loading && !onSearchChange && !onInputValueChange)}
      filterOptions={onSearchChange ? (items) => items : undefined}
      freeSolo={freeSolo}
      fullWidth
      inputValue={inputValue}
      getOptionLabel={(option) => typeof option === "string" ? option : option.label}
      isOptionEqualToValue={(option, selected) => typeof selected !== "string" && option.value === selected.value}
      loading={loading}
      loadingText={loadingLabel}
      noOptionsText={noOptionsText}
      onChange={(_, nextValue) => {
        const selected = typeof nextValue === "string" ? null : nextValue;
        setSelectedOverride(selected);
        onChange(typeof nextValue === "string" ? nextValue.trim() : nextValue?.value ?? "");
        onSearchChange?.("");
      }}
      onInputChange={(_, input, reason) => {
        if (reason === "input" || reason === "clear") onInputValueChange?.(input);
        if (reason === "input") onSearchChange?.(input);
        else if (reason === "clear") onSearchChange?.("");
      }}
      options={uniqueOptions}
      readOnly={readOnly}
      sx={sx}
      renderInput={(inputProps) => (
        <TextField
          {...inputProps}
          {...textFieldProps}
          label={labelPlacement === "inside" ? label : undefined}
          placeholder={placeholder}
          size="small"
          slotProps={{ ...inputProps.slotProps, htmlInput: { ...inputProps.slotProps.htmlInput, readOnly } }}
          sx={sx ?? standardFieldSx}
        />
      )}
      renderOption={(optionProps, option) => <Box component="li" {...optionProps} key={option.value}>{option.label}</Box>}
      value={selectedOption}
    />
  );

  return labelPlacement === "top" && label ? (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</Typography>
      {autocomplete}
    </Box>
  ) : autocomplete;
}
