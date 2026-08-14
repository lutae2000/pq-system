"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  GridActionsCellItem,
  GridRowModes,
  type GridColDef,
  type GridRowId,
  type GridRowModesModel,
  type GridRowParams,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

import {
  createQualificationReviewAgency,
  createQualificationReviewCriterion,
  createQualificationScoreBand,
  deleteQualificationReviewAgency,
  deleteQualificationReviewCriterion,
  deleteQualificationScoreBand,
  listQualificationReviewAgencies,
  listQualificationReviewCriteria,
  listQualificationScoreBands,
  updateQualificationReviewAgency,
  updateQualificationReviewCriterion,
  updateQualificationScoreBand,
} from "./api";
import type {
  QualificationReviewAgencyRecord,
  QualificationReviewAgencyUpsertRequest,
  QualificationReviewCriterionRecord,
  QualificationReviewCriterionUpsertRequest,
  QualificationScoreBandRecord,
  QualificationScoreBandUpsertRequest,
  UseYnFilter,
} from "./qualificationCriteria.types";

type ReviewAgencyRow = QualificationReviewAgencyRecord & { isNew?: boolean };
type ReviewCriterionRow = QualificationReviewCriterionRecord & { isNew?: boolean };
type ScoreBandRow = QualificationScoreBandRecord & { isNew?: boolean };

type DeleteTarget =
  | { id: number; kind: "agency"; label: string }
  | { id: number; kind: "criterion"; label: string }
  | { id: number; kind: "scoreBand"; label: string };

const qualificationCriteriaQueryKeys = {
  agencies: (keyword: string, useYn: boolean | undefined) => ["qualification-criteria", "agencies", keyword, useYn] as const,
  criteria: (agencyId: number | null, keyword: string, useYn: boolean | undefined) =>
    ["qualification-criteria", "criteria", agencyId, keyword, useYn] as const,
  scoreBands: (criterionId: number | null) => ["qualification-criteria", "score-bands", criterionId] as const,
};

const useYnFilterToBoolean = (value: UseYnFilter) => {
  if (value === "Y") {
    return true;
  }
  if (value === "N") {
    return false;
  }
  return undefined;
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR");

const formatRatio = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : Number(value).toFixed(2);

const makeDraftId = () => -Date.now();

const emptyToNull = (value: string | null | undefined) => {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : null;
};

const toAgencyRequest = (row: ReviewAgencyRow): QualificationReviewAgencyUpsertRequest => ({
  agencyCode: row.agencyCode.trim(),
  agencyName: row.agencyName.trim(),
  remark: emptyToNull(row.remark),
  useYn: row.useYn,
});

const toCriterionRequest = (row: ReviewCriterionRow): QualificationReviewCriterionUpsertRequest => ({
  agencyId: row.agencyId,
  ruleCode: row.ruleCode.trim(),
  revisionNo: row.revisionNo.trim(),
  effectiveDate: emptyToNull(row.effectiveDate),
  legalBasis: emptyToNull(row.legalBasis),
  technicalWeight: toNumber(row.technicalWeight),
  priceWeight: toNumber(row.priceWeight),
  decisionMethod: emptyToNull(row.decisionMethod),
  thresholdRatio: toNumber(row.thresholdRatio),
  useYn: row.useYn,
});

const toScoreBandRequest = (row: ScoreBandRow): QualificationScoreBandUpsertRequest => ({
  criterionId: row.criterionId,
  sortOrder: Number(row.sortOrder) || 1,
  minPrice: toNumber(row.minPrice),
  maxPrice: toNumber(row.maxPrice),
  priceText: emptyToNull(row.priceText),
  passScore: toNumber(row.passScore),
  technicalScore: toNumber(row.technicalScore),
  careerScore: toNumber(row.careerScore),
  regionScore: toNumber(row.regionScore),
  managementScore: toNumber(row.managementScore),
  priceScore: toNumber(row.priceScore),
  priceMultiplier: toNumber(row.priceMultiplier),
  priceFormula: emptyToNull(row.priceFormula),
  technicalAverageScore: toNumber(row.technicalAverageScore),
  totalAverageScore: toNumber(row.totalAverageScore),
  lowestBidPrice: toNumber(row.lowestBidPrice),
  pqAvailableScore: toNumber(row.pqAvailableScore),
  useYn: row.useYn,
  remark: emptyToNull(row.remark),
});

export function QualificationCriteriaPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [useYnFilter, setUseYnFilter] = useState<UseYnFilter>("All");
  const [draftAgencyRows, setDraftAgencyRows] = useState<ReviewAgencyRow[]>([]);
  const [draftCriterionRows, setDraftCriterionRows] = useState<ReviewCriterionRow[]>([]);
  const [draftScoreBandRows, setDraftScoreBandRows] = useState<ScoreBandRow[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [selectedCriterionId, setSelectedCriterionId] = useState<number | null>(null);
  const [agencyRowModes, setAgencyRowModes] = useState<GridRowModesModel>({});
  const [criterionRowModes, setCriterionRowModes] = useState<GridRowModesModel>({});
  const [scoreBandRowModes, setScoreBandRowModes] = useState<GridRowModesModel>({});
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [notice, setNotice] = useState<{ message: string; severity: "info" | "success" | "error" } | null>(null);

  const useYnParam = useYnFilterToBoolean(useYnFilter);

  const agenciesQuery = useQuery({
    enabled: canRead,
    queryFn: () => listQualificationReviewAgencies({ keyword: appliedKeyword || undefined, useYn: useYnParam }),
    queryKey: qualificationCriteriaQueryKeys.agencies(appliedKeyword, useYnParam),
  });

  const agencyRows = useMemo<ReviewAgencyRow[]>(
    () => [...draftAgencyRows, ...(agenciesQuery.data ?? [])],
    [agenciesQuery.data, draftAgencyRows],
  );
  const effectiveSelectedAgencyId =
    selectedAgencyId !== null && agencyRows.some((agency) => agency.id === selectedAgencyId)
      ? selectedAgencyId
      : agencyRows[0]?.id ?? null;

  const enabledCriteriaQuery = useQuery({
    enabled: canRead && effectiveSelectedAgencyId !== null && effectiveSelectedAgencyId > 0,
    queryFn: () =>
      listQualificationReviewCriteria(effectiveSelectedAgencyId as number, { keyword: appliedKeyword || undefined, useYn: useYnParam }),
    queryKey: qualificationCriteriaQueryKeys.criteria(effectiveSelectedAgencyId, appliedKeyword, useYnParam),
  });

  const criterionRows = useMemo<ReviewCriterionRow[]>(
    () => [...draftCriterionRows, ...(enabledCriteriaQuery.data ?? [])],
    [draftCriterionRows, enabledCriteriaQuery.data],
  );
  const effectiveSelectedCriterionId =
    selectedCriterionId !== null && criterionRows.some((criterion) => criterion.id === selectedCriterionId)
      ? selectedCriterionId
      : criterionRows[0]?.id ?? null;

  const enabledScoreBandsQuery = useQuery({
    enabled: canRead && effectiveSelectedCriterionId !== null && effectiveSelectedCriterionId > 0,
    queryFn: () => listQualificationScoreBands(effectiveSelectedCriterionId as number),
    queryKey: qualificationCriteriaQueryKeys.scoreBands(effectiveSelectedCriterionId),
  });

  const scoreBandRows = useMemo<ScoreBandRow[]>(
    () => [...draftScoreBandRows, ...(enabledScoreBandsQuery.data ?? [])],
    [draftScoreBandRows, enabledScoreBandsQuery.data],
  );

  const selectedAgency = agencyRows.find((agency) => agency.id === effectiveSelectedAgencyId) ?? null;
  const selectedCriterion = criterionRows.find((criterion) => criterion.id === effectiveSelectedCriterionId) ?? null;

  const invalidateAgencies = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["qualification-criteria", "agencies"] }),
    [queryClient],
  );

  const invalidateCriteria = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["qualification-criteria", "criteria"] }),
    [queryClient],
  );

  const invalidateScoreBands = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["qualification-criteria", "score-bands"] }),
    [queryClient],
  );

  const saveAgencyMutation = useMutation({
    mutationFn: async (row: ReviewAgencyRow) => (row.isNew ? createQualificationReviewAgency(toAgencyRequest(row)) : updateQualificationReviewAgency(row.id, toAgencyRequest(row))),
    onSuccess: async (saved, row) => {
      setDraftAgencyRows((current) => current.filter((item) => item.id !== row.id));
      setSelectedAgencyId(saved.id);
      await invalidateAgencies();
      setNotice({ message: "기관 정보를 저장했습니다.", severity: "success" });
    },
  });

  const saveCriterionMutation = useMutation({
    mutationFn: async (row: ReviewCriterionRow) =>
      row.isNew ? createQualificationReviewCriterion(toCriterionRequest(row)) : updateQualificationReviewCriterion(row.id, toCriterionRequest(row)),
    onSuccess: async (saved, row) => {
      setDraftCriterionRows((current) => current.filter((item) => item.id !== row.id));
      setSelectedCriterionId(saved.id);
      await invalidateCriteria();
      setNotice({ message: "시행기준을 저장했습니다.", severity: "success" });
    },
  });

  const saveScoreBandMutation = useMutation({
    mutationFn: async (row: ScoreBandRow) =>
      row.isNew ? createQualificationScoreBand(toScoreBandRequest(row)) : updateQualificationScoreBand(row.id, toScoreBandRequest(row)),
    onSuccess: async (_saved, row) => {
      setDraftScoreBandRows((current) => current.filter((item) => item.id !== row.id));
      await invalidateScoreBands();
      setNotice({ message: "가격구간을 저장했습니다.", severity: "success" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      if (target.kind === "agency") {
        await deleteQualificationReviewAgency(target.id);
      }
      if (target.kind === "criterion") {
        await deleteQualificationReviewCriterion(target.id);
      }
      if (target.kind === "scoreBand") {
        await deleteQualificationScoreBand(target.id);
      }
      return target;
    },
    onSuccess: async (target) => {
      if (target.kind === "agency") {
        setSelectedAgencyId(null);
        setSelectedCriterionId(null);
        await Promise.all([invalidateAgencies(), invalidateCriteria(), invalidateScoreBands()]);
      }
      if (target.kind === "criterion") {
        setSelectedCriterionId(null);
        await Promise.all([invalidateCriteria(), invalidateScoreBands()]);
      }
      if (target.kind === "scoreBand") {
        await invalidateScoreBands();
      }
      setDeleteTarget(null);
      setNotice({ message: "선택한 항목을 삭제했습니다.", severity: "success" });
    },
    onError: (error) => {
      setNotice({ message: error instanceof Error ? error.message : "삭제하지 못했습니다.", severity: "error" });
    },
  });

  const updateRowMode = (
    setter: (updater: (current: GridRowModesModel) => GridRowModesModel) => void,
    id: GridRowId,
    mode: GridRowModes,
  ) => {
    setter((current) => ({ ...current, [id]: { mode } }));
  };

  const cancelEdit = (
    setter: (updater: (current: GridRowModesModel) => GridRowModesModel) => void,
    id: GridRowId,
  ) => {
    setter((current) => ({ ...current, [id]: { mode: GridRowModes.View, ignoreModifications: true } }));
  };

  const handleAddAgency = () => {
    if (!canCreate) {
      return;
    }

    const next: ReviewAgencyRow = {
      id: makeDraftId(),
      agencyCode: "",
      agencyName: "",
      remark: "",
      useYn: true,
      createdAt: null,
      createdId: null,
      lastChangedAt: null,
      lastChangedId: null,
      isNew: true,
    };
    setDraftAgencyRows((current) => [next, ...current]);
    setSelectedAgencyId(next.id);
    updateRowMode(setAgencyRowModes, next.id, GridRowModes.Edit);
  };

  const handleAddCriterion = () => {
    if (!canCreate || effectiveSelectedAgencyId === null) {
      return;
    }

    const next: ReviewCriterionRow = {
      id: makeDraftId(),
      agencyId: effectiveSelectedAgencyId,
      decisionMethod: "",
      effectiveDate: "",
      legalBasis: "",
      priceWeight: null,
      revisionNo: "",
      ruleCode: "",
      technicalWeight: null,
      thresholdRatio: null,
      useYn: true,
      createdAt: null,
      createdId: null,
      lastChangedAt: null,
      lastChangedId: null,
      isNew: true,
    };
    setDraftCriterionRows((current) => [next, ...current]);
    setSelectedCriterionId(next.id);
    updateRowMode(setCriterionRowModes, next.id, GridRowModes.Edit);
  };

  const handleAddScoreBand = () => {
    if (!canCreate || effectiveSelectedCriterionId === null) {
      return;
    }

    const nextSortOrder = Math.max(0, ...scoreBandRows.map((band) => band.sortOrder)) + 1;
    const next: ScoreBandRow = {
      id: makeDraftId(),
      careerScore: null,
      criterionId: effectiveSelectedCriterionId,
      managementScore: null,
      maxPrice: null,
      minPrice: null,
      passScore: null,
      priceMultiplier: null,
      priceFormula: "",
      priceScore: null,
      priceText: "",
      pqAvailableScore: null,
      regionScore: null,
      remark: "",
      sortOrder: nextSortOrder,
      technicalAverageScore: null,
      technicalScore: null,
      totalAverageScore: null,
      lowestBidPrice: null,
      useYn: true,
      createdAt: null,
      createdId: null,
      lastChangedAt: null,
      lastChangedId: null,
      isNew: true,
    };
    setDraftScoreBandRows((current) => [next, ...current]);
    updateRowMode(setScoreBandRowModes, next.id, GridRowModes.Edit);
  };

  const requestDelete = useCallback((target: DeleteTarget) => {
    if (!canDelete) {
      return;
    }
    setDeleteTarget(target);
  }, [canDelete]);

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.id < 0) {
      if (deleteTarget.kind === "agency") {
        setDraftAgencyRows((current) => current.filter((row) => row.id !== deleteTarget.id));
      }
      if (deleteTarget.kind === "criterion") {
        setDraftCriterionRows((current) => current.filter((row) => row.id !== deleteTarget.id));
      }
      if (deleteTarget.kind === "scoreBand") {
        setDraftScoreBandRows((current) => current.filter((row) => row.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
      return;
    }

    deleteMutation.mutate(deleteTarget);
  };

  const handleSaveError = (error: unknown) => {
    setNotice({ message: error instanceof Error ? error.message : "저장하지 못했습니다.", severity: "error" });
  };

  const actionColumn = useCallback(
    <Row extends { id: number }>(
      rowModes: GridRowModesModel,
      setRowModes: (updater: (current: GridRowModesModel) => GridRowModesModel) => void,
      getDeleteTarget: (row: Row) => DeleteTarget,
    ): GridColDef<Row> => ({
      field: "actions",
      type: "actions",
      headerName: "",
      width: 94,
      getActions: ({ id, row }) => {
        const editing = rowModes[id]?.mode === GridRowModes.Edit;

        if (editing) {
          return [
            <GridActionsCellItem
              icon={<SaveOutlinedIcon />}
              key="save"
              label="저장"
              onClick={() => updateRowMode(setRowModes, id, GridRowModes.View)}
            />,
            <GridActionsCellItem
              icon={<CancelOutlinedIcon />}
              key="cancel"
              label="취소"
              onClick={() => cancelEdit(setRowModes, id)}
            />,
          ];
        }

        return [
          <GridActionsCellItem
            disabled={!canUpdate}
            icon={<EditOutlinedIcon />}
            key="edit"
            label="수정"
            onClick={() => updateRowMode(setRowModes, id, GridRowModes.Edit)}
          />,
          <GridActionsCellItem
            disabled={!canDelete}
            icon={<DeleteOutlineOutlinedIcon />}
            key="delete"
            label="삭제"
            onClick={() => requestDelete(getDeleteTarget(row))}
            showInMenu
          />,
        ];
      },
    }),
    [canDelete, canUpdate, requestDelete],
  );

  const agencyColumns = useMemo<GridColDef<ReviewAgencyRow>[]>(
    () => [
      { field: "agencyCode", headerName: "기관코드", width: 96, editable: true },
      { field: "agencyName", headerName: "기관명", minWidth: 170, flex: 1, editable: true },
      { field: "remark", headerName: "비고", minWidth: 160, flex: 0.7, editable: true },
      actionColumn(agencyRowModes, setAgencyRowModes, (row) => ({
        id: row.id,
        kind: "agency",
        label: `${row.agencyCode || "-"} / ${row.agencyName || "-"}`,
      })),
    ],
    [actionColumn, agencyRowModes],
  );

  const criterionColumns = useMemo<GridColDef<ReviewCriterionRow>[]>(
    () => [
      { field: "ruleCode", headerName: "심사기준", width: 105, editable: true },
      { field: "revisionNo", headerName: "차수", width: 70, editable: true },
      { field: "effectiveDate", headerName: "시행일", width: 120, editable: true },
      { field: "legalBasis", headerName: "관련근거", minWidth: 210, flex: 0.9, editable: true },
      {
        field: "technicalWeight",
        headerName: "기술",
        width: 76,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumber(value as number | null),
        valueParser: toNumber,
      },
      {
        field: "priceWeight",
        headerName: "가격",
        width: 76,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumber(value as number | null),
        valueParser: toNumber,
      },
      { field: "decisionMethod", headerName: "낙찰자 결정방법", minWidth: 260, flex: 1.1, editable: true },
      {
        field: "thresholdRatio",
        headerName: "기준",
        width: 78,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatRatio(value as number | null),
        valueParser: toNumber,
      },
      actionColumn(criterionRowModes, setCriterionRowModes, (row) => ({
        id: row.id,
        kind: "criterion",
        label: `${row.ruleCode || "-"} / ${row.revisionNo || "-"}`,
      })),
    ],
    [actionColumn, criterionRowModes],
  );

  const scoreBandColumns = useMemo<GridColDef<ScoreBandRow>[]>(
    () => [
      { field: "sortOrder", headerName: "순번", width: 70, align: "right", editable: true, headerAlign: "center", type: "number" },
      {
        field: "minPrice",
        headerName: "추정가격 이상",
        width: 135,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumber(value as number | null),
        valueParser: toNumber,
      },
      {
        field: "maxPrice",
        headerName: "추정가격 미만",
        width: 135,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumber(value as number | null),
        valueParser: toNumber,
      },
      { field: "priceText", headerName: "가격구간 표시", minWidth: 190, flex: 0.8, editable: true },
      { field: "passScore", headerName: "적격", width: 78, align: "right", editable: true, headerAlign: "center", type: "number", valueParser: toNumber },
      { field: "technicalScore", headerName: "기술", width: 78, align: "right", editable: true, headerAlign: "center", type: "number", valueParser: toNumber },
      { field: "careerScore", headerName: "경력", width: 78, align: "right", editable: true, headerAlign: "center", type: "number", valueParser: toNumber },
      { field: "regionScore", headerName: "지역업체", width: 88, align: "right", editable: true, headerAlign: "center", type: "number", valueParser: toNumber },
      { field: "managementScore", headerName: "경영상태", width: 88, align: "right", editable: true, headerAlign: "center", type: "number", valueParser: toNumber },
      { field: "priceScore", headerName: "가격", width: 78, align: "right", editable: true, headerAlign: "center", type: "number", valueParser: toNumber },
      { field: "priceMultiplier", headerName: "배율", width: 78, align: "right", editable: true, headerAlign: "center", type: "number", valueParser: toNumber },
      { field: "priceFormula", headerName: "가격점수 산식", minWidth: 260, flex: 1.1, editable: true },
      {
        field: "technicalAverageScore",
        headerName: "기술평점",
        width: 95,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueParser: toNumber,
      },
      {
        field: "totalAverageScore",
        headerName: "종합평점",
        width: 95,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueParser: toNumber,
      },
      {
        field: "lowestBidPrice",
        headerName: "최저 투찰가",
        width: 110,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueParser: toNumber,
      },
      {
        field: "pqAvailableScore",
        headerName: "투찰 가능 PQ점수",
        width: 135,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueParser: toNumber,
      },
      {
        field: "useYn",
        headerName: "사용여부",
        width: 90,
        align: "center",
        editable: true,
        headerAlign: "center",
        type: "boolean",
      },
      { field: "remark", headerName: "비고", minWidth: 180, flex: 0.8, editable: true },
      actionColumn(scoreBandRowModes, setScoreBandRowModes, (row) => ({
        id: row.id,
        kind: "scoreBand",
        label: `${row.sortOrder}. ${row.priceText || "가격구간"}`,
      })),
    ],
    [actionColumn, scoreBandRowModes],
  );

  const handleSearch = (nextKeyword: string) => {
    setAppliedKeyword(nextKeyword);
  };

  const handleReset = () => {
    setKeyword("");
    setAppliedKeyword("");
    setUseYnFilter("All");
  };

  return (
    <Box>
      <PageHeader
        title="적격심사기준"
      />

      <SearchPanel
        keyword={keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="기관명, 관련근거, 낙찰자 결정방법"
        onKeywordChange={setKeyword}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <TextField
          label="사용여부"
          onChange={(event) => setUseYnFilter(event.target.value as UseYnFilter)}
          select
          size="small"
          sx={standardFieldSx}
          value={useYnFilter}
        >
          <MenuItem value="All">전체</MenuItem>
          <MenuItem value="Y">사용</MenuItem>
          <MenuItem value="N">미사용</MenuItem>
        </TextField>
      </SearchPanel>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "360px minmax(0, 1fr)" } }}>
        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                기관
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip label={`${agencyRows.length.toLocaleString("ko-KR")}건`} size="small" variant="outlined" />
                <Button disabled={!canCreate} onClick={handleAddAgency} size="small" startIcon={<AddOutlinedIcon />} variant="outlined">
                  추가
                </Button>
              </Stack>
            </Box>
            <EnterpriseDataGrid<ReviewAgencyRow>
              columns={agencyColumns}
              confirmProcessRowUpdate={(row) => ({
                confirmColor: "primary",
                confirmLabel: row.isNew ? "등록" : "수정",
                message: "기관 정보를 저장하시겠습니까?",
                title: "저장 확인",
              })}
              editMode="row"
              getRowId={(row) => row.id}
              isCellEditable={(params) => (params.row.isNew ? canCreate : canUpdate)}
              loading={agenciesQuery.isFetching || saveAgencyMutation.isPending}
              onProcessRowUpdateError={handleSaveError}
              onRowClick={(params: GridRowParams<ReviewAgencyRow>) => setSelectedAgencyId(params.row.id)}
              onRowModesModelChange={setAgencyRowModes}
              processRowUpdate={async (updatedRow) => {
                const saved = await saveAgencyMutation.mutateAsync(updatedRow);
                return saved;
              }}
              rowModesModel={agencyRowModes}
              rowSelectionModel={{ ids: new Set(effectiveSelectedAgencyId !== null ? [effectiveSelectedAgencyId] : []), type: "include" }}
              rows={agencyRows}
              showToolbar={false}
              wrapperMinHeight={520}
              sx={{ "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
            />
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  시행기준
                </Typography>
                <Typography color="text.secondary" noWrap variant="body2">
                  {selectedAgency ? `${selectedAgency.agencyCode} / ${selectedAgency.agencyName}` : "기관을 선택하세요"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={`${criterionRows.length.toLocaleString("ko-KR")}건`} size="small" variant="outlined" />
                <Button disabled={!canCreate || effectiveSelectedAgencyId === null} onClick={handleAddCriterion} size="small" startIcon={<AddOutlinedIcon />} variant="outlined">
                  추가
                </Button>
              </Stack>
            </Box>
            <EnterpriseDataGrid<ReviewCriterionRow>
              columns={criterionColumns}
              confirmProcessRowUpdate={(row) => ({
                confirmColor: "primary",
                confirmLabel: row.isNew ? "등록" : "수정",
                message: "시행기준을 저장하시겠습니까?",
                title: "저장 확인",
              })}
              editMode="row"
              getRowId={(row) => row.id}
              isCellEditable={(params) => (params.row.isNew ? canCreate : canUpdate)}
              loading={enabledCriteriaQuery.isFetching || saveCriterionMutation.isPending}
              onProcessRowUpdateError={handleSaveError}
              onRowClick={(params: GridRowParams<ReviewCriterionRow>) => setSelectedCriterionId(params.row.id)}
              onRowModesModelChange={setCriterionRowModes}
              processRowUpdate={async (updatedRow) => {
                const saved = await saveCriterionMutation.mutateAsync(updatedRow);
                return saved;
              }}
              rowModesModel={criterionRowModes}
              rowSelectionModel={{ ids: new Set(effectiveSelectedCriterionId !== null ? [effectiveSelectedCriterionId] : []), type: "include" }}
              rows={criterionRows}
              showToolbar={false}
              wrapperMinHeight={520}
              sx={{ "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
            />
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 2, minWidth: 0 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                가격구간 및 평가점수
              </Typography>
              <Typography color="text.secondary" noWrap variant="body2">
                {selectedCriterion ? `${selectedCriterion.ruleCode} / ${selectedCriterion.revisionNo}차 / ${selectedCriterion.effectiveDate || "-"}` : "시행기준을 선택하세요"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip label={`${scoreBandRows.length.toLocaleString("ko-KR")}건`} size="small" variant="outlined" />
              <Button disabled={!canCreate || effectiveSelectedCriterionId === null} onClick={handleAddScoreBand} size="small" startIcon={<AddOutlinedIcon />} variant="outlined">
                추가
              </Button>
            </Stack>
          </Box>
          <EnterpriseDataGrid<ScoreBandRow>
            columns={scoreBandColumns}
            confirmProcessRowUpdate={(row) => ({
              confirmColor: "primary",
              confirmLabel: row.isNew ? "등록" : "수정",
              message: "가격구간을 저장하시겠습니까?",
              title: "저장 확인",
            })}
            editMode="row"
            getRowId={(row) => row.id}
            isCellEditable={(params) => (params.row.isNew ? canCreate : canUpdate)}
            loading={enabledScoreBandsQuery.isFetching || saveScoreBandMutation.isPending}
            onProcessRowUpdateError={handleSaveError}
            onRowModesModelChange={setScoreBandRowModes}
            processRowUpdate={async (updatedRow) => {
              const saved = await saveScoreBandMutation.mutateAsync(updatedRow);
              return saved;
            }}
            rowModesModel={scoreBandRowModes}
            rows={scoreBandRows}
            showToolbar={false}
            showXlsxExportButton
            wrapperMinHeight={420}
          />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        message="삭제하면 하위 시행기준 또는 가격구간도 함께 제거될 수 있습니다. 계속하시겠습니까?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleteTarget)}
        targetLabel={deleteTarget?.label}
        title="삭제 확인"
      />
      <Snackbar autoHideDuration={2200} onClose={() => setNotice(null)} open={Boolean(notice)}>
        <Chip color={notice?.severity === "success" ? "success" : notice?.severity === "error" ? "error" : "default"} label={notice?.message ?? ""} />
      </Snackbar>
    </Box>
  );
}
