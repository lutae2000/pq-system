"use client";

import { Autocomplete, MenuItem, TextField, type TextFieldProps } from "@mui/material";

import { standardFieldSx } from "@/components/common/FormControls";
import {
  useClientOptions,
  useCommonCodeLevel1Options,
  useCommonCodeLevel2Options,
  useConstructionTypeOptions,
  useDepartmentOptions,
  useRoleOptions,
  useUserOptions,
} from "@/modules/common/reference/useReferenceOptions";
import type { CommonCodeSearchParams } from "@/modules/code/common-codes/api";
import type { ConstructionTypeSearchParams } from "@/modules/code/construction-types/api";
import type { DepartmentSearchParams } from "@/modules/code/departments/api";
import type { UserReferenceSearchParams } from "@/modules/common/reference/referenceApi";
import type { SystemRoleSearchParams } from "@/modules/system/roles/api";

type ReferenceSelectProps<TValue extends string = string> = Omit<TextFieldProps, "onChange" | "select" | "value"> & {
  includeAll?: boolean;
  loadingLabel?: string;
  onChange: (value: TValue | "") => void;
  placeholder?: string;
  placeholderDisabled?: boolean;
  value: TValue | "";
};

const allOption = { label: "전체", value: "All" };

function ReferenceSelect<TValue extends string>({
  children,
  disabled,
  includeAll = false,
  loadingLabel = "조회 중입니다.",
  onChange,
  placeholder = "선택",
  placeholderDisabled = true,
  value,
  ...props
}: ReferenceSelectProps<TValue> & {
  children: React.ReactNode;
  isLoading?: boolean;
}) {
  const isLoading = props.isLoading;
  const textFieldProps = { ...props };
  delete textFieldProps.isLoading;

  return (
    <TextField
      fullWidth
      select
      size="small"
      sx={standardFieldSx}
      {...textFieldProps}
      disabled={disabled || isLoading}
      onChange={(event) => onChange(event.target.value as TValue | "")}
      value={value}
    >
      {includeAll ? (
        <MenuItem value={allOption.value}>{allOption.label}</MenuItem>
      ) : (
        <MenuItem value="" disabled={placeholderDisabled}>
          {placeholder}
        </MenuItem>
      )}
      {isLoading ? (
        <MenuItem value="" disabled>
          {loadingLabel}
        </MenuItem>
      ) : null}
      {children}
    </TextField>
  );
}

export function RoleSelect({
  params = { useYn: true },
  ...props
}: ReferenceSelectProps & {
  params?: SystemRoleSearchParams;
}) {
  const { isLoading, options } = useRoleOptions(params);

  return (
    <ReferenceSelect {...props} isLoading={isLoading}>
      {options.map((option, index) => (
        <MenuItem key={`role-${index}-${option.value}`} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </ReferenceSelect>
  );
}

export function UserSelect({
  params = {},
  ...props
}: ReferenceSelectProps & {
  params?: UserReferenceSearchParams;
}) {
  const { isLoading, options } = useUserOptions(params);

  return (
    <ReferenceSelect {...props} isLoading={isLoading}>
      {options.map((option, index) => (
        <MenuItem key={`user-${index}-${option.value}`} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </ReferenceSelect>
  );
}

export function ClientSelect({
  disabled,
  includeAll = false,
  loadingLabel = "조회 중입니다.",
  onChange,
  params = {},
  placeholder = "선택",
  placeholderDisabled = true,
  sx,
  value,
  ...props
}: ReferenceSelectProps & {
  params?: import("@/modules/common/reference/referenceApi").ClientReferenceSearchParams;
}) {
  const { isLoading, options } = useClientOptions(params);
  const autocompleteOptions = [
    ...(!placeholderDisabled || includeAll ? [{ label: includeAll ? allOption.label : placeholder, value: "" }] : []),
    ...options.map((option) => ({ label: option.label, value: option.value })),
  ];
  const selectedOption = autocompleteOptions.find((option) => option.value === value) ?? null;

  return (
    <Autocomplete
      autoHighlight
      disabled={disabled || isLoading}
      fullWidth
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.value === selected.value}
      loading={isLoading}
      noOptionsText={loadingLabel}
      onChange={(_, nextValue) => onChange(nextValue?.value ?? "")}
      options={autocompleteOptions}
      sx={sx}
      value={selectedOption}
      renderInput={(params) => (
        <TextField
          {...params}
          {...props}
          placeholder={placeholder}
          size="small"
          sx={standardFieldSx}
        />
      )}
    />
  );
}

export function DepartmentSelect({
  params = { useYn: true },
  ...props
}: ReferenceSelectProps & {
  params?: DepartmentSearchParams;
}) {
  const { isLoading, options } = useDepartmentOptions(params);

  return (
    <ReferenceSelect {...props} isLoading={isLoading}>
      {options.map((option, index) => (
        <MenuItem key={`department-${index}-${option.value}`} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </ReferenceSelect>
  );
}

export function ConstructionTypeSelect({
  params = { useYn: "Y" },
  ...props
}: ReferenceSelectProps & {
  params?: ConstructionTypeSearchParams;
}) {
  const { isLoading, options } = useConstructionTypeOptions(params);

  return (
    <ReferenceSelect {...props} isLoading={isLoading}>
      {options.map((option, index) => (
        <MenuItem key={`construction-type-${index}-${option.value}`} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </ReferenceSelect>
  );
}

export function CommonCodeLevel1Select({
  params = { useYn: "Y" },
  ...props
}: ReferenceSelectProps & {
  params?: CommonCodeSearchParams;
}) {
  const { isLoading, options } = useCommonCodeLevel1Options(params);

  return (
    <ReferenceSelect {...props} isLoading={isLoading}>
      {options.map((option, index) => (
        <MenuItem key={`common-code-l1-${index}-${option.value}`} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </ReferenceSelect>
  );
}

export function CommonCodeLevel2Select({
  level1Code,
  params = { useYn: "Y" },
  ...props
}: ReferenceSelectProps & {
  level1Code: string;
  params?: Omit<CommonCodeSearchParams, "level1Code">;
}) {
  const { isLoading, options } = useCommonCodeLevel2Options(level1Code, params);

  return (
    <ReferenceSelect {...props} disabled={props.disabled || !level1Code} isLoading={isLoading}>
      {options.map((option, index) => (
        <MenuItem key={`common-code-l2-${index}-${option.value}`} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </ReferenceSelect>
  );
}
