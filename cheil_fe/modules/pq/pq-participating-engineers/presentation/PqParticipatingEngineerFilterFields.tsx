"use client";

import { SearchOutlined as SearchOutlinedIcon } from "@mui/icons-material";
import { Autocomplete, Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";

import { standardFieldSx } from "@/components/common/FormControls";
import { RelatedProjectHistoryConditionsPanel } from "@/components/common/RelatedProjectHistoryConditionsPanel";
import type { SelectOption } from "@/modules/common/reference/referenceFormat";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";

export type PqParticipatingEngineerFilterValues = {
  certificationCode: string;
  constructionManagementGrade: string;
  designGrade: string;
  jobField: string;
  referenceDate: string;
  relatedProjectHistoryConditions: RelatedProjectHistoryCondition[];
  specialtyField: string;
  taskPeriodUnit: "일" | "개월";
  taskPeriodValue: string;
  remainingDays: string;
};

type PqParticipatingEngineerFilterFieldsProps = {
  certificationOptions: SelectOption[];
  bidSeq: number | null;
  companyPerformanceName: string;
  designGradeOptions: SelectOption[];
  disabled: boolean;
  filters: PqParticipatingEngineerFilterValues;
  jobFieldOptions: SelectOption[];
  onChange: (patch: Partial<PqParticipatingEngineerFilterValues>) => void;
  onOpenCompanyPerformance: () => void;
  onApplyRelatedProjectHistoryConditions: (conditions: RelatedProjectHistoryCondition[]) => void;
  specialtyFieldOptions: SelectOption[];
};

const filterAutocompleteSx = {
  flex: "0 1 140px",
  maxWidth: 155,
  minWidth: 125,
  width: "auto",
} as const;

const certificationFilterSx = {
  ...filterAutocompleteSx,
  flex: "0 1 220px",
  maxWidth: 240,
  minWidth: 190,
} as const;

const fullWidthRowSx = {
  flex: "0 0 100% !important",
  flexBasis: "100% !important",
  maxWidth: "100% !important",
  minWidth: 0,
  width: "100%",
} as const;

export function PqParticipatingEngineerFilterFields({
  certificationOptions,
  bidSeq,
  companyPerformanceName,
  designGradeOptions,
  disabled,
  filters,
  jobFieldOptions,
  onChange,
  onOpenCompanyPerformance,
  onApplyRelatedProjectHistoryConditions,
  specialtyFieldOptions,
}: PqParticipatingEngineerFilterFieldsProps) {
  const renderAutocomplete = (
    label: string,
    options: SelectOption[],
    value: string,
    patchKey: keyof PqParticipatingEngineerFilterValues,
    sx = filterAutocompleteSx,
  ) => (
    <Autocomplete
      disabled={disabled}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.value === selected.value}
      onChange={(_, option) => onChange({ [patchKey]: option?.value ?? "" })}
      options={options}
      sx={sx}
      value={options.find((option) => option.value === value) ?? null}
      renderInput={(params) => <TextField {...params} label={label} size="small" sx={standardFieldSx} />}
    />
  );

  return (
    <>
      <Stack sx={fullWidthRowSx}>
        <Stack direction="row" sx={{ display: "flex", gap: 0.75, maxWidth: 760, minWidth: 0, width: "100%" }}>
          <TextField
            fullWidth
            label="PQ참여 공고문 선택"
            placeholder="공고문 선택"
            size="small"
            sx={standardFieldSx}
            value={companyPerformanceName}
            slotProps={{ input: { readOnly: true } }}
          />
          <Button
            disabled={disabled}
            onClick={onOpenCompanyPerformance}
            startIcon={<SearchOutlinedIcon />}
            sx={{ flex: "0 0 auto", minWidth: 88, whiteSpace: "nowrap" }}
            type="button"
            variant="outlined"
          >
            선택
          </Button>
        </Stack>
      </Stack>
      <Autocomplete
        disabled={disabled}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, selected) => option.value === selected.value}
        onChange={(_, option) => onChange({ certificationCode: option?.value ?? "" })}
        options={certificationOptions}
        sx={certificationFilterSx}
        value={certificationOptions.find((option) => option.value === filters.certificationCode) ?? null}
        renderInput={(params) => <TextField {...params} label="보유 자격증" size="small" sx={standardFieldSx} />}
      />
      {renderAutocomplete("전문분야", specialtyFieldOptions, filters.specialtyField, "specialtyField")}
      {renderAutocomplete("직무분야", jobFieldOptions, filters.jobField, "jobField")}
      {renderAutocomplete("설계등급", designGradeOptions, filters.designGrade, "designGrade")}
      {renderAutocomplete("건설사업 관리등급", designGradeOptions, filters.constructionManagementGrade, "constructionManagementGrade")}

      <Box sx={fullWidthRowSx}>
        <Box sx={{ display: "grid", gap: 0.75, width: "100%" }}>
          <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>
            업무중복도 조회조건
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }}>
            <TextField
              disabled={disabled}
              label="기준일"
              size="small"
              type="date"
              value={filters.referenceDate}
              onChange={(event) => onChange({ referenceDate: event.target.value })}
              sx={{ ...standardFieldSx, width: { xs: "100%", sm: 170 } }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              disabled={disabled}
              label="과업기간"
              size="small"
              value={filters.taskPeriodValue}
              onChange={(event) => onChange({ taskPeriodValue: event.target.value.replace(/\D/g, "") })}
              sx={{ ...standardFieldSx, width: { xs: "100%", sm: 120 } }}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
            <TextField
              disabled={disabled}
              select
              label="단위"
              size="small"
              value={filters.taskPeriodUnit}
              onChange={(event) => onChange({ taskPeriodUnit: event.target.value as PqParticipatingEngineerFilterValues["taskPeriodUnit"] })}
              sx={{ ...standardFieldSx, width: { xs: "100%", sm: 100 } }}
            >
              <MenuItem value="일">일</MenuItem>
              <MenuItem value="개월">개월</MenuItem>
            </TextField>
            <TextField
              disabled={disabled}
              label="잔여일"
              size="small"
              value={filters.remainingDays}
              onChange={(event) => onChange({ remainingDays: event.target.value.replace(/\D/g, "") })}
              sx={{ ...standardFieldSx, width: { xs: "100%", sm: 100 } }}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
          </Stack>
        </Box>
      </Box>
      <Box sx={fullWidthRowSx}>
        <RelatedProjectHistoryConditionsPanel
          bidSeq={bidSeq}
          disabled={disabled}
          onApply={onApplyRelatedProjectHistoryConditions}
          value={filters.relatedProjectHistoryConditions}
        />
      </Box>
    </>
  );
}
