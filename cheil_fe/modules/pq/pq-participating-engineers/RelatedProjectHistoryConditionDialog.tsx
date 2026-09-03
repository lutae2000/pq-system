"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { GridColDef, GridRowParams, GridRowSelectionModel } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { listCommonCodes } from "@/modules/code/common-codes/api";
import { listConstructionTypes, type ConstructionTypeRecord } from "@/modules/code/construction-types/api";
import type {
  PqParticipatingEngineerProjectHistoryCondition,
  PqParticipatingEngineerProjectHistoryConditionOperator,
  PqParticipatingEngineerProjectHistoryConditionType,
  PqParticipatingEngineerProjectHistoryConditionValueType,
} from "@/modules/pq/pq-participating-engineers/api";

export type RelatedProjectHistoryCondition = PqParticipatingEngineerProjectHistoryCondition & {
  id: string;
};

type RelatedProjectHistoryConditionDialogProps = {
  applyLoading?: boolean;
  disabled?: boolean;
  onApply: (conditions: RelatedProjectHistoryCondition[]) => void | Promise<void>;
  onClose: () => void;
  open: boolean;
  value: RelatedProjectHistoryCondition[];
};

type CodeOption = {
  code: string;
  label: string;
};

type ConstructionKindRow = {
  id: string;
  level1Code: string;
  level1Name: string;
  level2Code: string;
  level2Name: string;
  level3Code: string;
  level3Name: string;
};

type OutlineCategoryRow = {
  id: string;
  code: string;
  name: string;
};

type OutlineDetailRow = {
  id: string;
  categoryCode: string;
  categoryName: string;
  code: string;
  name: string;
};

const conditionTypeLabels: Record<PqParticipatingEngineerProjectHistoryConditionType, string> = {
  constructionKind: "공종",
  general: "일반조건",
  outline: "상세조건",
};

const operatorLabels: Record<PqParticipatingEngineerProjectHistoryConditionOperator, string> = {
  "=": "같음",
  "!=": "다름",
  ">=": "이상",
  "<=": "이하",
  ">": "초과",
  "<": "미만",
  LIKE: "포함",
  BETWEEN: "범위",
};

const operatorsByValueType: Record<PqParticipatingEngineerProjectHistoryConditionValueType, PqParticipatingEngineerProjectHistoryConditionOperator[]> = {
  code: ["="],
  date: ["=", ">=", "<=", "BETWEEN"],
  number: ["=", ">=", "<=", ">", "<", "BETWEEN"],
  text: ["=", "LIKE", "!="],
};

const constructionTypePathKey = (...codes: Array<string | null | undefined>) => codes.map((code) => code ?? "").join("\u0000");

const optionLabel = (code: string, name: string) => (name ? `${code} - ${name}` : code);

const createConditionId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `condition-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const defaultOperator = (valueType: PqParticipatingEngineerProjectHistoryConditionValueType) =>
  valueType === "number" || valueType === "date" ? ">=" : "=";

const DATE_GENERAL_CONDITION_CODES = new Set(["C0104C1", "C0105C1", "C0120C1"]);
const NUMBER_GENERAL_CONDITION_CODES = new Set(["C0107C1", "C0108C1_AMT"]);

const generalConditionValueType = (code: string, label = ""): PqParticipatingEngineerProjectHistoryConditionValueType => {
  if (DATE_GENERAL_CONDITION_CODES.has(code)) {
    return "date";
  }
  if (NUMBER_GENERAL_CONDITION_CODES.has(code)) {
    return "number";
  }
  // Keep a fallback for legacy conditions whose code is not mapped yet.
  if (label.includes("일")) {
    return "date";
  }
  if (label.includes("금액")) {
    return "number";
  }
  return "text";
};

const normalizeLogicalOperator = (operator: string | undefined, index: number): "AND" | "OR" => {
  // The first item has no previous condition to join with. Keeping it as AND
  // prevents a stale OR value from being sent after conditions are removed.
  if (index === 0) {
    return "AND";
  }
  return operator === "OR" ? "OR" : "AND";
};

const normalizeCondition = (condition: RelatedProjectHistoryCondition, index: number): RelatedProjectHistoryCondition => {
  const valueType =
    condition.conditionType === "general" && condition.label
      ? generalConditionValueType(condition.generalCode ?? "", condition.label)
      : condition.valueType ?? (condition.conditionType === "outline" ? "number" : "text");
  const availableOperators = operatorsByValueType[valueType];
  const candidateOperator = condition.operator;
  const operator = candidateOperator && availableOperators.includes(candidateOperator) ? candidateOperator : defaultOperator(valueType);

  return {
    ...condition,
    logicalOperator: normalizeLogicalOperator(condition.logicalOperator, index),
    operator,
    valueTo: operator === "BETWEEN" ? condition.valueTo : "",
    valueType,
  };
};

const needsValueInput = (condition: RelatedProjectHistoryCondition) => condition.conditionType !== "constructionKind";

const valueLabel = (condition: RelatedProjectHistoryCondition) => {
  if (condition.conditionType === "outline") {
    return "조회값";
  }
  if (condition.valueType === "date") {
    return "일자";
  }
  return "조건값";
};

const conditionGridSx = {
  border: "1px solid",
  borderColor: "#d6e0eb",
  borderRadius: 2,
  bgcolor: "#ffffff",
  height: 430,
  "& .MuiDataGrid-columnHeaders": {
    bgcolor: "#eff6ff",
  },
  "& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader": {
    borderColor: "#e2e8f0",
  },
  "& .MuiDataGrid-row:hover": {
    cursor: "pointer",
  },
} as const;

function includesKeyword(values: string[], keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return values.some((value) => value.toLowerCase().includes(normalized));
}

function buildConstructionRows(records: ConstructionTypeRecord[]): ConstructionKindRow[] {
  const level1NameByCode = new Map<string, string>();
  const level2NameByPath = new Map<string, string>();

  for (const record of records) {
    if (record.codeLevel === 1 && record.level1Code) {
      level1NameByCode.set(record.level1Code, record.codeName);
    }
    if (record.codeLevel === 2 && record.level1Code && record.level2Code) {
      level2NameByPath.set(constructionTypePathKey(record.level1Code, record.level2Code), record.codeName);
    }
  }

  return records
    .filter((record) => record.codeLevel === 3 && record.level1Code && record.level2Code && record.level3Code)
    .map((record) => ({
      id: constructionTypePathKey(record.level1Code, record.level2Code, record.level3Code),
      level1Code: record.level1Code,
      level1Name: level1NameByCode.get(record.level1Code) ?? "",
      level2Code: record.level2Code,
      level2Name: level2NameByPath.get(constructionTypePathKey(record.level1Code, record.level2Code)) ?? "",
      level3Code: record.level3Code,
      level3Name: record.codeName,
    }))
    .sort(
      (left, right) =>
        left.level1Code.localeCompare(right.level1Code) ||
        left.level2Code.localeCompare(right.level2Code) ||
        left.level3Code.localeCompare(right.level3Code),
    );
}

export function RelatedProjectHistoryConditionDialog({
  applyLoading = false,
  disabled = false,
  onApply,
  onClose,
  open,
  value,
}: RelatedProjectHistoryConditionDialogProps) {
  const [conditionType, setConditionType] = useState<PqParticipatingEngineerProjectHistoryConditionType>("constructionKind");
  const [keyword, setKeyword] = useState("");
  const [draft, setDraft] = useState<RelatedProjectHistoryCondition[]>(value);
  const [selectedOutlineCategoryCode, setSelectedOutlineCategoryCode] = useState("");

  useEffect(() => {
    if (open) {
      const timeoutId = window.setTimeout(() => {
        setDraft(value);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [open, value]);

  const constructionTypesQuery = useQuery({
    queryKey: ["construction-types", "pq-participating-engineers", "condition-dialog", "useYn=true"],
    queryFn: () => listConstructionTypes({ useYn: "Y" }),
    enabled: open,
  });

  const outlineCodesQuery = useQuery({
    queryKey: ["common-codes", "PQCT", "pq-participating-engineers", "condition-dialog"],
    queryFn: () => listCommonCodes({ level1Code: "PQCT", useYn: "Y", sort: "level3Code" }),
    enabled: open,
  });

  const generalConditionsQuery = useQuery({
    queryKey: ["common-codes", "PQCT", "C*", "C1", "pq-participating-engineers", "condition-dialog"],
    queryFn: () =>
      listCommonCodes({
        level1Code: "PQCT",
        level2CodePrefix: "C",
        level3Code: "C1",
        sort: "level3Code",
      }),
    enabled: open,
  });

  const constructionRows = useMemo(() => buildConstructionRows(constructionTypesQuery.data ?? []), [constructionTypesQuery.data]);

  const outlineCategoryRows = useMemo<OutlineCategoryRow[]>(
    () =>
      (outlineCodesQuery.data ?? [])
        .filter((code) => code.level2Code.startsWith("Z") && code.level3Code === "")
        .map((code) => ({ code: code.level2Code, id: code.level2Code, name: code.codeName }))
        .sort((left, right) => left.code.localeCompare(right.code)),
    [outlineCodesQuery.data],
  );

  const selectedOutlineCategory = outlineCategoryRows.find((row) => row.code === selectedOutlineCategoryCode) ?? outlineCategoryRows[0];
  const activeOutlineCategoryCode = selectedOutlineCategory?.code ?? "";

  const outlineDetailRows = useMemo<OutlineDetailRow[]>(
    () =>
      (outlineCodesQuery.data ?? [])
        .filter((code) => code.level2Code === activeOutlineCategoryCode && code.level3Code)
        .map((code) => ({
          categoryCode: code.level2Code,
          categoryName: selectedOutlineCategory?.name ?? "",
          code: code.level3Code,
          id: constructionTypePathKey(code.level2Code, code.level3Code),
          name: code.codeDetailName || code.codeName,
        })),
    [activeOutlineCategoryCode, outlineCodesQuery.data, selectedOutlineCategory?.name],
  );

  const filteredConstructionRows = useMemo(
    () =>
      constructionRows.filter((row) =>
        includesKeyword(
          [row.level1Code, row.level1Name, row.level2Code, row.level2Name, row.level3Code, row.level3Name],
          keyword,
        ),
      ),
    [constructionRows, keyword],
  );

  const filteredGeneralRows = useMemo(
    () => {
      const rows = (generalConditionsQuery.data ?? []).map((code) => ({
        code: `${code.level2Code}${code.level3Code}`,
        label: code.codeDetailName || code.codeName,
      }));
      return rows.filter((row) => includesKeyword([row.code, row.label], keyword));
    },
    [generalConditionsQuery.data, keyword],
  );

  const filteredOutlineCategoryRows = useMemo(
    () => outlineCategoryRows.filter((row) => includesKeyword([row.code, row.name], keyword)),
    [outlineCategoryRows, keyword],
  );

  const filteredOutlineDetailRows = useMemo(
    () => outlineDetailRows.filter((row) => includesKeyword([row.code, row.name, row.categoryCode, row.categoryName], keyword)),
    [keyword, outlineDetailRows],
  );

  const commitDraft = (updater: (current: RelatedProjectHistoryCondition[]) => RelatedProjectHistoryCondition[]) => {
    setDraft((current) => updater(current));
  };

  const addCondition = (condition: RelatedProjectHistoryCondition) => {
    commitDraft((current) => {
      const duplicated = current.some((item) => {
        if (item.conditionType !== condition.conditionType) return false;
        if (condition.conditionType === "constructionKind") {
          return item.level1Code === condition.level1Code && item.level2Code === condition.level2Code && item.level3Code === condition.level3Code;
        }
        if (condition.conditionType === "general") {
          return item.generalCode === condition.generalCode;
        }
        return item.outlineCategoryCode === condition.outlineCategoryCode && item.outlineSubcategoryCode === condition.outlineSubcategoryCode;
      });
      return duplicated ? current : [...current, condition];
    });
  };

  const removeCondition = (id: string) => {
    commitDraft((current) => current.filter((condition) => condition.id !== id));
  };

  const updateCondition = (id: string, patch: Partial<RelatedProjectHistoryCondition>) => {
    commitDraft((current) =>
      current.map((condition) => {
        if (condition.id !== id) {
          return condition;
        }
        const next = { ...condition, ...patch };
        if (patch.valueType && !operatorsByValueType[patch.valueType].includes(next.operator ?? "=")) {
          next.operator = defaultOperator(patch.valueType);
          next.valueTo = "";
        }
        if (patch.operator && patch.operator !== "BETWEEN") {
          next.valueTo = "";
        }
        return next;
      }),
    );
  };

  const handleApply = () => {
    onApply(draft.map((condition, index) => normalizeCondition(condition, index)));
  };

  const constructionColumns = useMemo<GridColDef<ConstructionKindRow>[]>(
    () => [
      { field: "level1Name", headerName: "1레벨", flex: 1, minWidth: 120 },
      { field: "level2Name", headerName: "2레벨", flex: 1, minWidth: 140 },
      { field: "level3Name", headerName: "3레벨", flex: 1, minWidth: 140 },
      { field: "level3Code", headerName: "코드", width: 90, align: "center", headerAlign: "center" },
    ],
    [],
  );

  const generalColumns = useMemo<GridColDef<CodeOption>[]>(
    () => [
      { field: "code", headerName: "구분", width: 130 },
      { field: "label", headerName: "구분명", flex: 1, minWidth: 220 },
    ],
    [],
  );

  const outlineCategoryColumns = useMemo<GridColDef<OutlineCategoryRow>[]>(
    () => [
      { field: "code", headerName: "구분", width: 100 },
      { field: "name", headerName: "구분명", flex: 1, minWidth: 150 },
    ],
    [],
  );

  const outlineDetailColumns = useMemo<GridColDef<OutlineDetailRow>[]>(
    () => [
      { field: "categoryName", headerName: "개요구분", flex: 1, minWidth: 140 },
      { field: "name", headerName: "세부개요항목", flex: 1.2, minWidth: 160 },
    ],
    [],
  );

  const selectedOutlineCategorySelectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      ids: activeOutlineCategoryCode ? new Set([activeOutlineCategoryCode]) : new Set(),
      type: "include",
    }),
    [activeOutlineCategoryCode],
  );

  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              {"관련 공사 참여 이력 조건"}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {"공종, 일반조건, 상세조건 중 필요한 조건을 선택해 후보 기술인를 조회합니다."}
            </Typography>
          </Box>
          <Chip label={`${draft.length}개 조건`} size="small" variant="outlined" />
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="공종명"
              onChange={(event) => setKeyword(event.target.value)}
              size="small"
              sx={{ ...standardFieldSx, width: 260 }}
              value={keyword}
            />
            <RadioGroup
              onChange={(event) => setConditionType(event.target.value as PqParticipatingEngineerProjectHistoryConditionType)}
              row
              value={conditionType}
            >
              <FormControlLabel control={<Radio size="small" />} label="공종" value="constructionKind" />
              <FormControlLabel control={<Radio size="small" />} label="일반조건" value="general" />
              <FormControlLabel control={<Radio size="small" />} label="상세조건" value="outline" />
            </RadioGroup>
          </Stack>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 460px" } }}>
            <Box>
              {conditionType === "constructionKind" ? (
                <EnterpriseDataGrid<ConstructionKindRow>
                  columns={constructionColumns}
                  getRowId={(row) => row.id}
                  hideFooterSelectedRowCount
                  initialState={{ pagination: { paginationModel: { page: 0, pageSize: 40 } } }}
                  loading={constructionTypesQuery.isLoading || constructionTypesQuery.isFetching}
                  onRowDoubleClick={(params: GridRowParams<ConstructionKindRow>) =>
                    addCondition({
                      conditionType: "constructionKind",
                      id: createConditionId(),
                      label: [
                        optionLabel(params.row.level1Code, params.row.level1Name),
                        optionLabel(params.row.level2Code, params.row.level2Name),
                        optionLabel(params.row.level3Code, params.row.level3Name),
                      ].join(" / "),
                      level1Code: params.row.level1Code,
                      level2Code: params.row.level2Code,
                      level3Code: params.row.level3Code,
                      logicalOperator: "AND",
                      operator: "=",
                      value: params.row.level3Code,
                      valueType: "code",
                    })
                  }
                  pageSizeOptions={[20, 40, 100]}
                  rows={filteredConstructionRows}
                  showCellVerticalBorder
                  showColumnVerticalBorder
                  sx={conditionGridSx}
                />
              ) : null}

              {conditionType === "general" ? (
                <EnterpriseDataGrid<CodeOption>
                  columns={generalColumns}
                  getRowId={(row) => row.code}
                  hideFooterSelectedRowCount
                  initialState={{ pagination: { paginationModel: { page: 0, pageSize: 40 } } }}
                  loading={generalConditionsQuery.isLoading || generalConditionsQuery.isFetching}
                  onRowDoubleClick={(params: GridRowParams<CodeOption>) =>
                    addCondition({
                      conditionType: "general",
                      generalCode: params.row.code,
                      id: createConditionId(),
                      label: `${params.row.code} - ${params.row.label}`,
                      logicalOperator: "AND",
                      operator: defaultOperator(generalConditionValueType(params.row.code, params.row.label)),
                      value: "",
                      valueType: generalConditionValueType(params.row.code, params.row.label),
                    })
                  }
                  pageSizeOptions={[20, 40, 100]}
                  rows={filteredGeneralRows}
                  showCellVerticalBorder
                  showColumnVerticalBorder
                  sx={conditionGridSx}
                />
              ) : null}

              {conditionType === "outline" ? (
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "0.85fr 1.15fr" } }}>
                  <EnterpriseDataGrid<OutlineCategoryRow>
                    columns={outlineCategoryColumns}
                    getRowId={(row) => row.id}
                    hideFooterSelectedRowCount
                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 40 } } }}
                    loading={outlineCodesQuery.isLoading || outlineCodesQuery.isFetching}
                    onRowClick={(params: GridRowParams<OutlineCategoryRow>) => setSelectedOutlineCategoryCode(params.row.code)}
                    pageSizeOptions={[20, 40, 100]}
                    rowSelectionModel={selectedOutlineCategorySelectionModel}
                    rows={filteredOutlineCategoryRows}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    sx={conditionGridSx}
                  />
                  <EnterpriseDataGrid<OutlineDetailRow>
                    columns={outlineDetailColumns}
                    getRowId={(row) => row.id}
                    hideFooterSelectedRowCount
                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 40 } } }}
                    loading={outlineCodesQuery.isLoading || outlineCodesQuery.isFetching}
                    onRowDoubleClick={(params: GridRowParams<OutlineDetailRow>) =>
                      addCondition({
                        conditionType: "outline",
                        id: createConditionId(),
                        label: `${params.row.categoryName} / ${params.row.name}`,
                        logicalOperator: "AND",
                        operator: ">=",
                        outlineCategoryCode: params.row.categoryCode,
                        outlineSubcategoryCode: params.row.code,
                        value: "",
                        valueType: "number",
                      })
                    }
                    pageSizeOptions={[20, 40, 100]}
                    rows={filteredOutlineDetailRows}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    sx={conditionGridSx}
                  />
                </Box>
              ) : null}
            </Box>

            <Stack spacing={1}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 800 }} variant="body2">
                  {"선택 조건"}
                </Typography>
                <Button color="inherit" disabled={disabled || draft.length === 0} onClick={() => setDraft([])} size="small">
                  {"전체 삭제"}
                </Button>
              </Stack>
              <Stack spacing={0.75} sx={{ maxHeight: 430, overflow: "auto", pr: 0.5 }}>
                {draft.length === 0 ? (
                  <Box
                    sx={{
                      alignItems: "center",
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 1,
                      display: "flex",
                      justifyContent: "center",
                      minHeight: 120,
                    }}
                  >
                    <Typography color="text.secondary" variant="body2">
                      {"조건을 더블클릭해 추가하세요."}
                    </Typography>
                  </Box>
                ) : (
                  draft.map((condition, index) => {
                    const valueType =
                      condition.conditionType === "general" && condition.label
                        ? generalConditionValueType(condition.generalCode ?? "", condition.label)
                        : condition.valueType ?? (condition.conditionType === "outline" ? "number" : "text");
                    const availableOperators = operatorsByValueType[valueType];
                    const configuredOperator = condition.operator ?? defaultOperator(valueType);
                    const operator = availableOperators.includes(configuredOperator) ? configuredOperator : defaultOperator(valueType);

                    return (
                      <Box
                        key={condition.id}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          px: 1,
                          py: 1,
                        }}
                      >
                        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                          <Chip label={conditionTypeLabels[condition.conditionType]} size="small" />
                          <Typography sx={{ flex: 1, minWidth: 0 }} variant="body2">
                            {condition.label}
                          </Typography>
                          <IconButton
                            aria-label="조건 삭제"
                            color="error"
                            disabled={disabled}
                            onClick={() => removeCondition(condition.id)}
                            size="small"
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Box
                          sx={{
                            display: "grid",
                            gap: 0.75,
                            gridTemplateColumns: needsValueInput(condition) ? { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } : { xs: "1fr", sm: "150px 1fr" },
                            mt: 1,
                          }}
                        >
                          <TextField
                            disabled={disabled || index === 0}
                            label="논리연산자"
                            onChange={(event) =>
                              updateCondition(condition.id, {
                                logicalOperator: event.target.value as "AND" | "OR",
                              })
                            }
                            select
                            size="small"
                            sx={standardFieldSx}
                            value={index === 0 ? "AND" : condition.logicalOperator ?? "AND"}
                          >
                            <MenuItem value="AND">AND</MenuItem>
                            <MenuItem value="OR">OR</MenuItem>
                          </TextField>
                          {condition.conditionType === "outline" ? (
                            <TextField
                              disabled={disabled}
                              label="값 형식"
                              onChange={(event) =>
                                updateCondition(condition.id, {
                                  valueType: event.target.value as PqParticipatingEngineerProjectHistoryConditionValueType,
                                })
                              }
                              select
                              size="small"
                              sx={standardFieldSx}
                              value={valueType}
                            >
                              <MenuItem value="number">숫자</MenuItem>
                              <MenuItem value="text">문자</MenuItem>
                            </TextField>
                          ) : null}
                          {needsValueInput(condition) ? (
                            <TextField
                              disabled={disabled}
                              label="연산자"
                              onChange={(event) =>
                                updateCondition(condition.id, {
                                  operator: event.target.value as PqParticipatingEngineerProjectHistoryConditionOperator,
                                })
                              }
                              select
                              size="small"
                              sx={standardFieldSx}
                              value={operator}
                            >
                              {availableOperators.map((item) => (
                                <MenuItem key={item} value={item}>
                                  {operatorLabels[item]}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : null}
                          {needsValueInput(condition) ? (
                            <TextField
                              disabled={disabled}
                              label={operator === "BETWEEN" ? `${valueLabel(condition)} 시작` : valueLabel(condition)}
                              onChange={(event) => updateCondition(condition.id, { value: event.target.value })}
                              placeholder={condition.conditionType === "outline" ? "예: 1000" : undefined}
                              size="small"
                              slotProps={valueType === "date" ? { inputLabel: { shrink: true } } : undefined}
                              sx={standardFieldSx}
                              type={valueType === "number" ? "number" : valueType === "date" ? "date" : "text"}
                              value={condition.value ?? ""}
                            />
                          ) : null}
                          {operator === "BETWEEN" ? (
                            <TextField
                              disabled={disabled}
                              label={`${valueLabel(condition)} 끝`}
                              onChange={(event) => updateCondition(condition.id, { valueTo: event.target.value })}
                              placeholder={condition.conditionType === "outline" ? "예: 2000" : undefined}
                              size="small"
                              slotProps={valueType === "date" ? { inputLabel: { shrink: true } } : undefined}
                              sx={standardFieldSx}
                              type={valueType === "number" ? "number" : valueType === "date" ? "date" : "text"}
                              value={condition.valueTo ?? ""}
                            />
                          ) : null}
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button color="inherit" onClick={onClose} type="button" variant="outlined">
          {"취소"}
        </Button>
        <Button disabled={disabled || applyLoading} onClick={handleApply} startIcon={<CheckOutlinedIcon />} type="button" variant="contained">
          {"적용"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
