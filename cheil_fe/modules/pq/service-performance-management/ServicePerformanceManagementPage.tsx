"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import SubjectOutlinedIcon from "@mui/icons-material/SubjectOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridRowParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { ClientSelect } from "@/components/common/reference-selects";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  createServicePerformance,
  deleteServicePerformance,
  listServicePerformances,
  SERVICE_PERFORMANCE_PAGE_SIZE,
  updateServicePerformance,
  type ServicePerformancePageResponse,
  type ServicePerformanceRecord,
  type ServicePerformanceRequest,
  type ServicePerformanceSearchParams,
} from "@/modules/pq/service-performance-management/api";
import { ServicePerformanceDetailDialog } from "@/modules/pq/service-performance-management/ServicePerformanceDetailDialog";

const EMPTY_ROWS: ServicePerformanceRecord[] = [];
const PAGE_SIZE = SERVICE_PERFORMANCE_PAGE_SIZE;
const CLIENT_SELECT_PARAMS = { size: 1000 };
type SearchFilterState = Pick<
  ServicePerformanceSearchParams,
  "clientCode" | "fieldName" | "periodType" | "referenceDate" | "siteName"
>;

const PERIOD_OPTIONS: Array<{
  label: string;
  value: ServicePerformanceSearchParams["periodType"];
}> = [
  { label: "최근 3년", value: "3" },
  { label: "최근 5년", value: "5" },
  { label: "전체", value: "ALL" },
];

const today = () => new Date().toISOString().slice(0, 10);

const defaultSearchFilters = (): SearchFilterState => ({
  clientCode: "",
  fieldName: "",
  periodType: "3",
  referenceDate: today(),
  siteName: "",
});

const emptyDraft = (): ServicePerformanceRecord => ({
  clientCode: "",
  clientName: null,
  amountReflectedEvaluationScore: null,
  createdAt: null,
  createdId: null,
  evaluationDate: today(),
  evaluationScore: null,
  fieldName: "",
  id: 0,
  lastChangedAt: null,
  lastChangedId: null,
  remark: null,
  serviceAmount: null,
  siteName: "",
});

const emptyPage = (
  page: number,
  size: number,
): ServicePerformancePageResponse => ({
  content: EMPTY_ROWS,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const text = (value: string | null | undefined) => value || "";
const display = (value: string | null | undefined) =>
  value?.trim() ? value : "-";
const compactDate = (value: string | null | undefined) =>
  text(value).replace(/\D/g, "").slice(0, 8);
const formatDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8
    ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`
    : display(value);
};
const formatMoney = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("ko-KR");
const formatScore = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("ko-KR", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
const normalizeDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? normalized : "";
};

const toRequest = (
  draft: ServicePerformanceRecord,
): ServicePerformanceRequest => ({
  clientCode: text(draft.clientCode).trim(),
  evaluationDate: normalizeDate(draft.evaluationDate),
  evaluationScore: draft.evaluationScore,
  fieldName: text(draft.fieldName).trim(),
  remark: text(draft.remark).trim() || null,
  serviceAmount: draft.serviceAmount,
  siteName: text(draft.siteName).trim(),
});

export function ServicePerformanceManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } =
    useCurrentMenuPermission();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [searchFilters, setSearchFilters] = useState<SearchFilterState>(() =>
    defaultSearchFilters(),
  );
  const [appliedSearchFilters, setAppliedSearchFilters] =
    useState<SearchFilterState>(() => defaultSearchFilters());
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<ServicePerformanceRecord>(() =>
    emptyDraft(),
  );
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [rowSelectionIds, setRowSelectionIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] =
    useState<ServicePerformanceRecord | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    severity: "error" | "info" | "success";
  } | null>(null);

  const searchParams = useMemo<ServicePerformanceSearchParams>(
    () => ({
      clientCode: appliedSearchFilters.clientCode,
      fieldName: appliedSearchFilters.fieldName,
      keyword: appliedKeyword,
      page,
      periodType: appliedSearchFilters.periodType,
      referenceDate: appliedSearchFilters.referenceDate,
      siteName: appliedSearchFilters.siteName,
      size: PAGE_SIZE,
    }),
    [
      appliedKeyword,
      appliedSearchFilters.clientCode,
      appliedSearchFilters.fieldName,
      appliedSearchFilters.periodType,
      appliedSearchFilters.referenceDate,
      appliedSearchFilters.siteName,
      page,
    ],
  );

  const performancesQuery = useQuery<ServicePerformancePageResponse>({
    // useQuery v5 does not support onSuccess; selection sync happens below.
    queryKey: ["service-performances", searchParams],
    queryFn: () => listServicePerformances(searchParams),
    enabled: canRead,
  });

  const pageData = performancesQuery.data || emptyPage(page, PAGE_SIZE);
  const rows = pageData.content || EMPTY_ROWS;
  const selectedRecord = draft;
  const selectedIdsSet = useMemo(
    () => new Set(rowSelectionIds),
    [rowSelectionIds],
  );
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIdsSet.has(row.id)),
    [rows, selectedIdsSet],
  );
  const basisRows = selectedRows.length > 0 ? selectedRows : rows;
  const selectedCount = selectedRows.length;
  const selectedServiceAmountTotal = useMemo(
    () =>
      basisRows.reduce((sum, row) => sum + Number(row.serviceAmount || 0), 0),
    [basisRows],
  );
  const basisAverageScore = useMemo(() => {
    if (basisRows.length === 0) {
      return null;
    }
    const total = basisRows.reduce(
      (sum, row) => sum + Number(row.evaluationScore || 0),
      0,
    );
    return total / basisRows.length;
  }, [basisRows]);
  const weightedAverageScore = useMemo(() => {
    if (selectedServiceAmountTotal === 0) {
      return null;
    }
    const weightedTotal = basisRows.reduce(
      (sum, row) =>
        sum + Number(row.serviceAmount || 0) * Number(row.evaluationScore || 0),
      0,
    );
    return weightedTotal / selectedServiceAmountTotal;
  }, [basisRows, selectedServiceAmountTotal]);
  const resolvedAmountReflectedEvaluationScore = useMemo(() => {
    if (
      selectedRecord.amountReflectedEvaluationScore !== null &&
      selectedRecord.amountReflectedEvaluationScore !== undefined
    ) {
      return selectedRecord.amountReflectedEvaluationScore;
    }
    if (selectedServiceAmountTotal === 0) {
      return null;
    }
    if (
      selectedRecord.serviceAmount === null ||
      selectedRecord.serviceAmount === undefined
    ) {
      return null;
    }
    if (
      selectedRecord.evaluationScore === null ||
      selectedRecord.evaluationScore === undefined
    ) {
      return null;
    }
    return (
      (Number(selectedRecord.serviceAmount) *
        Number(selectedRecord.evaluationScore)) /
      selectedServiceAmountTotal
    );
  }, [
    selectedRecord.amountReflectedEvaluationScore,
    selectedRecord.evaluationScore,
    selectedRecord.serviceAmount,
    selectedServiceAmountTotal,
  ]);

  useEffect(() => {
    if (!canRead) {
      return;
    }

    if (detailDialogOpen && draft.id === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (rows.length === 0) {
        if (
          selectedRowId !== null ||
          rowSelectionIds.length > 0 ||
          draft.id > 0
        ) {
          setSelectedRowId(null);
          setDraft(emptyDraft());
          setRowSelectionIds([]);
        }
        return;
      }

      if (
        selectedRowId === null ||
        !rows.some((row) => row.id === selectedRowId)
      ) {
        setSelectedRowId(rows[0].id);
        setDraft(rows[0]);
        setRowSelectionIds([rows[0].id]);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    canRead,
    detailDialogOpen,
    draft.id,
    rowSelectionIds.length,
    rows,
    selectedRowId,
  ]);

  const invalidatePerformances = async () => {
    await queryClient.invalidateQueries({ queryKey: ["service-performances"] });
    await queryClient.invalidateQueries({ queryKey: ["service-performance"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const request = toRequest(draft);
      if (!request.clientCode) {
        throw new Error("발주청을 선택해 주세요.");
      }
      if (!request.fieldName) {
        throw new Error("분야를 입력해 주세요.");
      }
      if (!request.siteName) {
        throw new Error("현장명을 입력해 주세요.");
      }
      if (!request.evaluationDate) {
        throw new Error("평가일을 입력해 주세요.");
      }
      return draft.id > 0
        ? updateServicePerformance(draft.id, request)
        : createServicePerformance(request);
    },
    onSuccess: async (saved) => {
      setDraft(saved);
      setSelectedRowId(saved.id);
      setSaveConfirmOpen(false);
      await invalidatePerformances();
      setNotice({
        message: "용역 수행성과 정보를 저장했습니다.",
        severity: "success",
      });
    },
    onError: (error) =>
      setNotice({
        message:
          error instanceof Error ? error.message : "저장에 실패했습니다.",
        severity: "error",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: ServicePerformanceRecord) =>
      deleteServicePerformance(target.id),
    onSuccess: async (_saved, deletedRow) => {
      const nextRows = rows.filter((row) => row.id !== deletedRow.id);
      const nextSelected = nextRows[0] || null;
      setDeleteTarget(null);
      if (nextSelected) {
        setSelectedRowId(nextSelected.id);
        setDraft(nextSelected);
        setRowSelectionIds([nextSelected.id]);
      } else {
        setSelectedRowId(null);
        setDraft(emptyDraft());
        setRowSelectionIds([]);
      }
      await invalidatePerformances();
      setNotice({
        message: "용역 수행성과 정보를 삭제했습니다.",
        severity: "success",
      });
    },
    onError: (error) =>
      setNotice({
        message:
          error instanceof Error ? error.message : "삭제에 실패했습니다.",
        severity: "error",
      }),
  });

  const columns = useMemo<GridColDef<ServicePerformanceRecord>[]>(
    () => [
      {
        field: "fieldName",
        headerName: "분야",
        minWidth: 150,
        flex: 0.7,
        valueGetter: (_value, row) => display(row.fieldName),
      },
      {
        field: "siteName",
        headerName: "현장명",
        minWidth: 220,
        flex: 1.3,
        valueGetter: (_value, row) => display(row.siteName),
      },
      {
        field: "clientName",
        headerName: "발주처",
        minWidth: 180,
        flex: 0.9,
        valueGetter: (_value, row) => display(row.clientName),
      },
      {
        field: "evaluationDate",
        headerName: "평가일",
        width: 120,
        align: "center",
        headerAlign: "center",
        valueGetter: (_value, row) => formatDate(row.evaluationDate),
      },
      {
        field: "serviceAmount",
        headerName: "용역금액(백만)",
        width: 140,
        align: "right",
        headerAlign: "center",
        valueGetter: (_value, row) => formatMoney(row.serviceAmount),
      },
      {
        field: "evaluationScore",
        headerName: "평가점수(점)",
        width: 115,
        align: "right",
        headerAlign: "center",
        valueGetter: (_value, row) => formatScore(row.evaluationScore),
      },
      {
        field: "amountReflectedEvaluationScore",
        headerName: "금액반영 평가점수(점)",
        width: 150,
        align: "right",
        headerAlign: "center",
        valueGetter: (_value, row) =>
          formatScore(row.amountReflectedEvaluationScore),
      },
    ],
    [],
  );
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ type: "include", ids: new Set(rowSelectionIds) }),
    [rowSelectionIds],
  );

  const handleSearch = (nextKeyword: string) => {
    const nextAppliedKeyword = nextKeyword.trim();
    const shouldRefetch =
      page === 0 &&
      appliedKeyword === nextAppliedKeyword &&
      appliedSearchFilters.clientCode === searchFilters.clientCode &&
      appliedSearchFilters.fieldName === searchFilters.fieldName &&
      appliedSearchFilters.periodType === searchFilters.periodType &&
      appliedSearchFilters.referenceDate === searchFilters.referenceDate &&
      appliedSearchFilters.siteName === searchFilters.siteName;

    setPage(0);
    setAppliedKeyword(nextAppliedKeyword);
    setAppliedSearchFilters(searchFilters);

    if (shouldRefetch) {
      void performancesQuery.refetch();
    }
  };

  const handleReset = () => {
    const nextFilters = defaultSearchFilters();
    const shouldRefetch =
      page === 0 &&
      keyword === "" &&
      appliedKeyword === "" &&
      searchFilters.clientCode === nextFilters.clientCode &&
      searchFilters.fieldName === nextFilters.fieldName &&
      searchFilters.periodType === nextFilters.periodType &&
      searchFilters.referenceDate === nextFilters.referenceDate &&
      searchFilters.siteName === nextFilters.siteName &&
      appliedSearchFilters.clientCode === nextFilters.clientCode &&
      appliedSearchFilters.fieldName === nextFilters.fieldName &&
      appliedSearchFilters.periodType === nextFilters.periodType &&
      appliedSearchFilters.referenceDate === nextFilters.referenceDate &&
      appliedSearchFilters.siteName === nextFilters.siteName;

    setKeyword("");
    setAppliedKeyword("");
    setSearchFilters(nextFilters);
    setAppliedSearchFilters(nextFilters);
    setPage(0);

    if (shouldRefetch) {
      void performancesQuery.refetch();
    }
  };

  const updateSearchFilter = <K extends keyof SearchFilterState>(
    field: K,
    value: SearchFilterState[K],
  ) => {
    setSearchFilters((current) => ({ ...current, [field]: value }));
  };

  const handleNew = () => {
    setSelectedRowId(null);
    setDraft(emptyDraft());
    setDetailDialogOpen(true);
  };

  const handleOpenDetail = () => {
    if (draft.id === 0 && selectedRowId === null) {
      setNotice({
        message: "먼저 선택할 수행성과를 골라 주세요.",
        severity: "error",
      });
      return;
    }
    setDetailDialogOpen(true);
  };

  const handleSaveClick = () => {
    if (draft.id > 0 && !canUpdate) {
      setNotice({ message: "수정 권한이 없습니다.", severity: "error" });
      return;
    }
    if (draft.id === 0 && !canCreate) {
      setNotice({ message: "등록 권한이 없습니다.", severity: "error" });
      return;
    }
    setSaveConfirmOpen(true);
  };

  const handleDeleteClick = () => {
    if (!draft.id) {
      setNotice({
        message: "삭제할 대상을 먼저 선택해 주세요.",
        severity: "error",
      });
      return;
    }
    setDeleteTarget(draft);
  };

  const handleRowClick = (params: GridRowParams<ServicePerformanceRecord>) => {
    setSelectedRowId(params.row.id);
    setDraft(params.row);
  };

  const handleRowDoubleClick = (
    params: GridRowParams<ServicePerformanceRecord>,
  ) => {
    setSelectedRowId(params.row.id);
    setDraft(params.row);
    setDetailDialogOpen(true);
  };

  const handleSelectionModelChange = (model: GridRowSelectionModel) => {
    const nextIds = Array.isArray(model)
      ? model
      : model.type === "exclude"
        ? rows.filter((row) => !model.ids.has(row.id)).map((row) => row.id)
        : Array.from(model.ids);

    setRowSelectionIds(
      nextIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value)),
    );
  };
  const updateDraft = <K extends keyof ServicePerformanceRecord>(
    field: K,
    value: ServicePerformanceRecord[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const selectedContextLabel =
    selectedRows.length > 0
      ? `${selectedRows.length}건 선택`
      : `${rows.length}건 전체`;

  return (
    <Box>
      <PageHeader title="용역 수행성과 관리" />

      <SearchPanel
        keyword={keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="용역명, 발주처, 현장명 검색"
        onKeywordChange={setKeyword}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
        resetLabel="초기화"
        searchLabel="조회"
      >
        <ClientSelect
          label="발주처"
          onChange={(value) => updateSearchFilter("clientCode", value)}
          params={CLIENT_SELECT_PARAMS}
          placeholder="전체"
          placeholderDisabled={false}
          sx={{
            ...standardFieldSx,
            flex: "0 1 240px",
            maxWidth: 280,
            minWidth: 220,
          }}
          value={searchFilters.clientCode}
        />
        <TextField
          fullWidth
          label="세부분야"
          onChange={(event) =>
            updateSearchFilter("fieldName", event.target.value)
          }
          placeholder="세부분야 직접 입력"
          size="small"
          sx={standardFieldSx}
          value={searchFilters.fieldName}
        />
        <TextField
          label="현장명"
          onChange={(event) =>
            updateSearchFilter("siteName", event.target.value)
          }
          size="small"
          sx={{ ...standardFieldSx, minWidth: 180 }}
          value={searchFilters.siteName}
        />
        <div
          style={{
            display: "grid",
            flex: "1 1 100%",
            gap: "8px",
            gridTemplateColumns: "180px minmax(0, 1fr)",
            minWidth: 0,
            width: "100%",
          }}
        >
          <TextField
            label="기준일"
            onChange={(event) =>
              updateSearchFilter("referenceDate", event.target.value)
            }
            size="small"
            sx={{ ...standardFieldSx, minWidth: 180 }}
            type="date"
            value={searchFilters.referenceDate}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Box
            sx={{ alignItems: "center", display: "flex", gap: 1, minWidth: 0 }}
          >
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              조회기간
            </Typography>
            <FormControl sx={{ flex: 1, minWidth: 0 }}>
              <RadioGroup
                row
                onChange={(event) =>
                  updateSearchFilter(
                    "periodType",
                    event.target
                      .value as ServicePerformanceSearchParams["periodType"],
                  )
                }
                value={searchFilters.periodType}
                sx={{
                  alignItems: "center",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                  "& .MuiFormControlLabel-root": { mr: 0 },
                }}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={<Radio size="small" />}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        </div>
      </SearchPanel>
      {!canRead ? (
        <Alert severity="warning">
          용역 수행성과를 조회할 권한이 없습니다.
        </Alert>
      ) : (
        <Stack spacing={2}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    실적 요약 정보
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {selectedContextLabel}
                  </Typography>
                </Box>
                <Chip
                  label={`총 ${pageData.totalElements.toLocaleString("ko-KR")}건`}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                }}
              >
                <SummaryCard
                  icon={<SubjectOutlinedIcon />}
                  label="수행성과 건수"
                  value={`${pageData.totalElements.toLocaleString("ko-KR")}건`}
                />
                <SummaryCard
                  icon={<SellOutlinedIcon />}
                  label="선택 건수"
                  value={`${selectedCount.toLocaleString("ko-KR")}건`}
                />
                <SummaryCard
                  icon={<StarOutlineOutlinedIcon />}
                  label="평균점수"
                  value={formatScore(basisAverageScore)}
                />
                <SummaryCard
                  icon={<PercentOutlinedIcon />}
                  label="금액반영 평가점수"
                  value={formatScore(weightedAverageScore)}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  mt: 1.5,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    minWidth: 0,
                    p: 1.25,
                  }}
                >
                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}
                  >
                    선택된 용역금액 합계
                  </Typography>
                  <Typography sx={{ fontWeight: 800, mt: 0.5 }} variant="body1">
                    {formatMoney(selectedServiceAmountTotal)}백만원
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    minWidth: 0,
                    p: 1.25,
                  }}
                >
                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}
                  >
                    금액반영 평가점수 산정식
                  </Typography>
                  <Typography sx={{ mt: 0.5 }} variant="body2">
                    금액반영 평가점수 = (용역금액 * 평가점수) / 선택된 용역금액
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    용역 수행성과 목록
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    행을 더블클릭하면 상세 팝업을 열 수 있습니다.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={`총 ${pageData.totalElements.toLocaleString("ko-KR")}건`}
                    size="small"
                    variant="outlined"
                  />
                  <Button
                    disabled={!canCreate}
                    onClick={handleNew}
                    startIcon={<AddOutlinedIcon />}
                    variant="contained"
                  >
                    신규
                  </Button>
                  <Button
                    disabled={draft.id === 0 && selectedRowId === null}
                    onClick={handleOpenDetail}
                    variant="outlined"
                  >
                    상세
                  </Button>
                </Stack>
              </Box>
              <EnterpriseDataGrid<ServicePerformanceRecord>
                columns={columns}
                getRowId={(row) => row.id}
                checkboxSelection
                hideFooter
                hideFooterSelectedRowCount
                loading={
                  performancesQuery.isLoading || performancesQuery.isFetching
                }
                onPaginationModelChange={(model: GridPaginationModel) =>
                  setPage(model.page)
                }
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
                onRowSelectionModelChange={handleSelectionModelChange}
                pageSizeOptions={[PAGE_SIZE]}
                paginationMode="server"
                paginationModel={{ page, pageSize: PAGE_SIZE }}
                rowCount={pageData.totalElements}
                rowSelectionModel={rowSelectionModel}
                rows={rows}
                showXlsxExportButton
                showToolbar
                sx={{
                  height: 440,
                  minHeight: 440,
                  "& .MuiDataGrid-columnHeaders": {
                    bgcolor: "rgba(15, 23, 42, 0.02)",
                  },
                  "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                  "& .selected-performance-row": {
                    bgcolor: "rgba(25, 118, 210, 0.08)",
                  },
                }}
                getRowClassName={(params) =>
                  params.row.id === selectedRowId
                    ? "selected-performance-row"
                    : ""
                }
                wrapperMinHeight={440}
              />
            </CardContent>
          </Card>
        </Stack>
      )}
      <ServicePerformanceDetailDialog
        amountReflectedEvaluationScore={resolvedAmountReflectedEvaluationScore}
        canCreate={canCreate}
        canDelete={canDelete}
        canUpdate={canUpdate}
        clientSelectParams={CLIENT_SELECT_PARAMS}
        deleting={deleteMutation.isPending}
        draft={draft}
        onClose={() => setDetailDialogOpen(false)}
        onDelete={handleDeleteClick}
        onDraftChange={updateDraft}
        onSave={handleSaveClick}
        open={detailDialogOpen}
        saving={saveMutation.isPending}
      />
      <ConfirmActionDialog
        confirmLabel="저장"
        loading={saveMutation.isPending}
        message="용역 수행성과 정보를 저장하시겠습니까?"
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={() => saveMutation.mutate()}
        open={saveConfirmOpen}
        targetLabel={draft.siteName || draft.fieldName}
        title="저장 확인"
      />
      <ConfirmDeleteDialog
        loading={deleteMutation.isPending}
        message="용역 수행성과 정보를 삭제하시겠습니까?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        open={Boolean(deleteTarget)}
        targetLabel={deleteTarget?.siteName || deleteTarget?.fieldName}
        title="삭제 확인"
      />

      {notice ? (
        <Snackbar
          anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
          autoHideDuration={2500}
          onClose={() => setNotice(null)}
          open
        >
          <Alert
            onClose={() => setNotice(null)}
            severity={notice.severity}
            variant="filled"
          >
            {notice.message}
          </Alert>
        </Snackbar>
      ) : null}
    </Box>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        display: "flex",
        gap: 1.25,
        minWidth: 0,
        px: 1.5,
        py: 1.25,
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "50%",
          color: "primary.main",
          display: "inline-flex",
          flex: "0 0 auto",
          height: 48,
          justifyContent: "center",
          width: 48,
          "& .MuiSvgIcon-root": { fontSize: 26 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          color="text.secondary"
          sx={{ fontWeight: 700 }}
          variant="body2"
        >
          {label}
        </Typography>
        <Typography
          sx={{
            color: "primary.main",
            fontWeight: 900,
            lineHeight: 1.15,
            mt: 0.25,
          }}
          variant="h5"
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
