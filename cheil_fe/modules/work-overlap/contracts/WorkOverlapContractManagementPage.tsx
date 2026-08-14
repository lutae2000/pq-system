"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { Alert, Autocomplete, Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRenderCellParams, GridRowParams } from "@mui/x-data-grid";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { ConfirmActionDialog, ConfirmDeleteDialog } from "@/components/common/ConfirmActionDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  createWorkOverlapContract,
  deleteWorkOverlapContract,
  getWorkOverlapContractSummary,
  listWorkOverlapContractEngineerCandidates,
  listWorkOverlapContracts,
  updateWorkOverlapContract,
  WORK_OVERLAP_CONTRACT_PAGE_SIZE,
  type WorkOverlapContractEngineerCandidate,
  type WorkOverlapContractPageResponse,
  type WorkOverlapContractRecord,
  type WorkOverlapContractSearchParams,
  type WorkOverlapContractSummaryParams,
  type WorkOverlapContractSummaryResponse,
} from "@/modules/work-overlap/contracts/api";
import { WorkOverlapContractDetailDialog } from "@/modules/work-overlap/contracts/WorkOverlapContractDetailDialog";
import type { WorkOverlapContractSavePayload } from "@/modules/work-overlap/contracts/WorkOverlapContractDetailDialog";
import {
  defaultWorkOverlapContractRecord,
  displayText,
  formatDateText,
  formatNumberText,
  formatPeriodText,
  toWorkOverlapContractRequest,
} from "@/modules/work-overlap/contracts/workOverlapContractForm";

type WorkOverlapContractFilters = Omit<WorkOverlapContractSearchParams, "page" | "size"> & {
  cemsConfirm: "" | "true" | "false";
  referenceDate: string;
};

const EMPTY_ROWS: WorkOverlapContractRecord[] = [];
const PAGE_SIZE_OPTIONS = [25, 50, WORK_OVERLAP_CONTRACT_PAGE_SIZE];

const todayInputValue = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const DEFAULT_FILTERS: WorkOverlapContractFilters = {
  clientName: "",
  engineerName: "",
  constructionStartDateFrom: "",
  constructionStartDateTo: "",
  cemsConfirm: "",
  participateListDocument: "",
  performanceCertification: "",
  status: "",
  keyword: "",
  referenceDate: todayInputValue(),
  serviceType: "",
};

const RECEIPT_STATUS_OPTIONS = [
  { label: "전체", value: "" },
  { label: "수령", value: "true" },
  { label: "미수령", value: "false" },
];

const CEMS_CONFIRM_OPTIONS = [
  { label: "전체", value: "" },
  { label: "승인", value: "true" },
  { label: "미승인", value: "false" },
];

const STATUS_OPTIONS = [
  { label: "전체", value: "" },
  { label: "진행", value: "progress" },
  { label: "완료", value: "completed" },
  { label: "중지", value: "stopped" },
];
const emptyPage = (page: number, size: number): WorkOverlapContractPageResponse => ({
  content: EMPTY_ROWS,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const engineerOptionLabel = (engineer: WorkOverlapContractEngineerCandidate | string) => {
  if (typeof engineer === "string") {
    return engineer;
  }
  return engineer.name ? `${engineer.name} (${engineer.engineerId})` : engineer.engineerId;
};

const EMPTY_SUMMARY: WorkOverlapContractSummaryResponse = {
  completedCount: 0,
  contractAmount: 0,
  contractCount: 0,
  progressCount: 0,
  processedCount: 0,
  unprocessedCount: 0,
  stoppedCount: 0,
};

const SUMMARY_ITEMS = [
  {
    key: "progress",
    label: "진행중",
    note: "현재 진행 중인 계약",
    color: "primary.main",
    icon: TrendingUpOutlinedIcon,
  },
  {
    key: "completed",
    label: "완료",
    note: "준공이 완료된 계약",
    color: "success.main",
    icon: CheckCircleOutlineOutlinedIcon,
  },
  {
    key: "stopped",
    label: "중지",
    note: "중지 기간에 있는 계약",
    color: "warning.main",
    icon: PauseCircleOutlineOutlinedIcon,
  },
  {
    key: "count",
    label: "계약건수",
    note: "조회된 계약의 총 건수",
    color: "info.main",
    icon: FactCheckOutlinedIcon,
  },
  {
    key: "amount",
    label: "계약금액",
    note: "조회된 계약의 총 금액",
    color: "secondary.main",
    icon: MonetizationOnOutlinedIcon,
  },
  {
    key: "processed",
    label: "처리완료",
    note: "실적증명, 참여명단, CEMS가 모두 승인된 건수",
    color: "success.main",
    icon: CheckCircleOutlineOutlinedIcon,
  },
  {
    key: "unprocessed",
    label: "미처리",
    note: "처리가 완료되지 않은 건수",
    color: "error.main",
    icon: HighlightOffOutlinedIcon,
  },
] as const;

const toLocalDate = (dateKey: string) => {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(4, 6));
  const day = Number(dateKey.slice(6, 8));
  return new Date(year, month - 1, day);
};

const normalizeDateKey = (value: string | null | undefined) => {
  const normalized = (value ?? "").replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? normalized : "";
};

const isBetweenDates = (targetKey: string, fromKey: string, toKey: string) => {
  if (!targetKey) {
    return false;
  }
  if (fromKey && targetKey < fromKey) {
    return false;
  }
  if (toKey && targetKey > toKey) {
    return false;
  }
  return Boolean(fromKey || toKey);
};

const diffDays = (leftKey: string, rightKey: string) => {
  if (!leftKey || !rightKey) {
    return null;
  }

  const left = toLocalDate(leftKey);
  const right = toLocalDate(rightKey);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((left.getTime() - right.getTime()) / msPerDay);
};

export function WorkOverlapContractManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useAppSnackbar();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [engineerKeyword, setEngineerKeyword] = useState("");
  const [debouncedEngineerKeyword, setDebouncedEngineerKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(WORK_OVERLAP_CONTRACT_PAGE_SIZE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSeed, setDialogSeed] = useState(0);
  const [editingRecord, setEditingRecord] = useState<WorkOverlapContractRecord | null>(null);
  const [pendingSave, setPendingSave] = useState<WorkOverlapContractSavePayload | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkOverlapContractRecord | null>(null);

  const searchParams = useMemo<WorkOverlapContractSearchParams>(
    () => ({
      ...appliedFilters,
      page,
      size: pageSize,
    }),
    [appliedFilters, page, pageSize],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedEngineerKeyword(engineerKeyword.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [engineerKeyword]);

  const engineerCandidatesQuery = useQuery({
    queryKey: ["work-overlap-contract-engineer-candidates", debouncedEngineerKeyword],
    queryFn: () => listWorkOverlapContractEngineerCandidates({ keyword: debouncedEngineerKeyword, limit: 30 }),
    enabled: tabQueryEnabled && debouncedEngineerKeyword.length > 0,
  });

  const engineerOptions = useMemo(() => engineerCandidatesQuery.data ?? [], [engineerCandidatesQuery.data]);

  const contractsQuery = useQuery({
    queryKey: ["work-overlap-contracts", searchParams],
    queryFn: () => listWorkOverlapContracts(searchParams),
    enabled: tabQueryEnabled,
    placeholderData: keepPreviousData,
  });

  const pageData = contractsQuery.data ?? emptyPage(page, pageSize);
  const referenceDate = appliedFilters.referenceDate || todayInputValue();
  const summaryParams = useMemo<WorkOverlapContractSummaryParams>(
    () => ({
      clientName: appliedFilters.clientName,
      engineerName: appliedFilters.engineerName,
      constructionStartDateFrom: appliedFilters.constructionStartDateFrom,
      constructionStartDateTo: appliedFilters.constructionStartDateTo,
      cemsConfirm: appliedFilters.cemsConfirm,
      participateListDocument: appliedFilters.participateListDocument,
      performanceCertification: appliedFilters.performanceCertification,
      keyword: appliedFilters.keyword,
      referenceDate,
      status: appliedFilters.status,
      serviceType: appliedFilters.serviceType,
    }),
    [appliedFilters, referenceDate],
  );

  const summaryQuery = useQuery({
    queryKey: ["work-overlap-contracts", "summary", summaryParams],
    queryFn: () => getWorkOverlapContractSummary(summaryParams),
    enabled: tabQueryEnabled,
    placeholderData: keepPreviousData,
  });

  const pageSummary = summaryQuery.data ?? EMPTY_SUMMARY;

  const getSummaryValue = (key: (typeof SUMMARY_ITEMS)[number]["key"]) => {
    switch (key) {
      case "progress":
        return pageSummary.progressCount.toLocaleString("ko-KR");
      case "completed":
        return pageSummary.completedCount.toLocaleString("ko-KR");
      case "stopped":
        return pageSummary.stoppedCount.toLocaleString("ko-KR");
      case "count":
        return pageSummary.contractCount.toLocaleString("ko-KR");
      case "amount":
        return formatNumberText(pageSummary.contractAmount);
      case "processed":
        return pageSummary.processedCount.toLocaleString("ko-KR");
      case "unprocessed":
        return pageSummary.unprocessedCount.toLocaleString("ko-KR");
      default:
        return "";
    }
  };

  const renderReceiptChip = (value: string | null | undefined) => {
    const normalized = (value ?? "").trim();
    const received = normalized === "true" || normalized === "received";

    return (
      <Chip
        color={received ? "success" : "default"}
        label={received ? "수령" : "미수령"}
        size="small"
        variant={received ? "filled" : "outlined"}
      />
    );
  };

  const renderCemsChip = (value: string | boolean | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const approved = value === true || String(value).trim().toLowerCase() === "true";

    return (
      <Chip
        color={approved ? "success" : "default"}
        label={approved ? "승인" : "미승인"}
        size="small"
        variant={approved ? "filled" : "outlined"}
      />
    );
  };

  const renderRemainingDays = (row: WorkOverlapContractRecord) => {
    const completeKey = normalizeDateKey(row.constructionCompleteDate);
    const baseKey = normalizeDateKey(referenceDate);
    const remaining = diffDays(completeKey, baseKey);
    return remaining === null ? "-" : `${remaining}일`;
  };

  const renderStatusChip = (row: WorkOverlapContractRecord) => {
    const baseKey = normalizeDateKey(referenceDate);
    const stopFromKey = normalizeDateKey(row.constructionStopFromDate);
    const stopToKey = normalizeDateKey(row.constructionStopToDate);
    const completeKey = normalizeDateKey(row.constructionCompleteDate);

    if (isBetweenDates(baseKey, stopFromKey, stopToKey)) {
      return <Chip color="warning" label="중지" size="small" variant="filled" />;
    }

    if (completeKey && baseKey > completeKey) {
      return <Chip color="success" label="완료" size="small" variant="filled" />;
    }

    return <Chip color="primary" label="진행" size="small" variant="filled" />;
  };

  const columns: GridColDef<WorkOverlapContractRecord>[] = [
    {
      field: "status",
      headerName: "상태",
      width: 96,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }: GridRenderCellParams<WorkOverlapContractRecord>) => renderStatusChip(row),
    },
    { field: "contractNo", headerName: "계약번호", width: 100, valueGetter: (_value, row) => displayText(row.contractNo) },
    { field: "serviceType", headerName: "구분", width: 50, valueGetter: (_value, row) => displayText(row.serviceType) },
    { field: "clientName", headerName: "발주처", minWidth: 170, flex: 0.8, valueGetter: (_value, row) => displayText(row.clientName) },
    { field: "serviceName", headerName: "용역명", minWidth: 300, flex: 1.4, valueGetter: (_value, row) => displayText(row.serviceName) },
    {
      field: "constructionPeriod",
      headerName: "계약기간",
      width: 210,
      valueGetter: (_value, row) => formatPeriodText(row.constructionStartDate, row.constructionCompleteDate),
    },
    {
      field: "managementServiceCompleteDate",
      headerName: "관리용역 준공일",
      width: 115,
      valueGetter: (_value, row) => formatDateText(row.managementServiceCompleteDate),
    },
    {
      field: "stopPeriod",
      headerName: "중지기간",
      width: 210,
      valueGetter: (_value, row) => formatPeriodText(row.constructionStopFromDate, row.constructionStopToDate),
    },
    {
      field: "remainingDays",
      headerName: "잔여일",
      width: 90,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }: GridRenderCellParams<WorkOverlapContractRecord>) => renderRemainingDays(row),
    },
    { field: "contractAmount", headerName: "계약금액", width: 135, align: "right", headerAlign: "center", valueFormatter: (value) => formatNumberText(value as number | null) },
    { field: "shareAmount", headerName: "지분금액", width: 135, align: "right", headerAlign: "center", valueFormatter: (value) => formatNumberText(value as number | null) },
    { field: "remark", headerName: "비고", minWidth: 180, flex: 0.8, valueGetter: (_value, row) => displayText(row.remark) },
    {
      field: "performanceCertification",
      headerName: "실적증명",
      width: 105,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }: GridRenderCellParams<WorkOverlapContractRecord>) => renderReceiptChip(row.performanceCertification),
    },
    {
      field: "participateListDocument",
      headerName: "참여명단",
      width: 105,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }: GridRenderCellParams<WorkOverlapContractRecord>) => renderReceiptChip(row.participateListDocument),
    },
    {
      field: "cemsConfirm",
      headerName: "CEMS 승인여부",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }: GridRenderCellParams<WorkOverlapContractRecord>) => renderCemsChip(row.cemsConfirm),
    },
  ];
  const saveMutation = useMutation({
    mutationFn: async (payload: WorkOverlapContractSavePayload) => {
      const request = toWorkOverlapContractRequest(payload.record, payload.periodChangeReason);
      if (!request.serviceName) {
        throw new Error("용역명을 입력해 주세요.");
      }

      return payload.record.contractNo ? updateWorkOverlapContract(payload.record.contractNo, request) : createWorkOverlapContract(request);
    },
    onSuccess: async (savedRecord) => {
      setDialogOpen(false);
      setEditingRecord(null);
      setPendingSave(null);
      await queryClient.invalidateQueries({ queryKey: ["work-overlap-contracts"] });
      if (savedRecord.contractNo) {
        await queryClient.invalidateQueries({
          queryKey: ["work-overlap-contract-period-histories", savedRecord.contractNo],
        });
      }
      showSuccess("계약 정보를 저장했습니다.");
    },
    onError: (error) => {
      setPendingSave(null);
      showError(error instanceof Error ? error.message : "저장에 실패했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (target: WorkOverlapContractRecord) => deleteWorkOverlapContract(target.contractNo),
    onSuccess: async () => {
      setDeleteTarget(null);
      setDialogOpen(false);
      setEditingRecord(null);
      await queryClient.invalidateQueries({ queryKey: ["work-overlap-contracts"] });
      showSuccess("계약 정보를 삭제했습니다.");
    },
    onError: (error) => {
      setDeleteTarget(null);
      showError(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    },
  });

  const paginationModel = useMemo<GridPaginationModel>(() => ({ page, pageSize }), [page, pageSize]);

  const handleSearch = (keyword: string) => {
    setAppliedFilters((current) => ({ ...current, ...filters, keyword }));
    setPage(0);
  };

  const handleReset = () => {
    const resetFilters = { ...DEFAULT_FILTERS, referenceDate: todayInputValue() };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setEngineerKeyword("");
    setPage(0);
  };

  const openNewDialog = () => {
    setEditingRecord(defaultWorkOverlapContractRecord());
    setDialogSeed((current) => current + 1);
    setDialogOpen(true);
  };

  const openEditDialog = (record: WorkOverlapContractRecord | null) => {
    if (!record) {
      return;
    }

    setEditingRecord(record);
    setDialogSeed((current) => current + 1);
    setDialogOpen(true);
  };

  return (
    <Box>
      <PageHeader title="업무중복도 계약관리" />

      {!canRead ? (
        <Alert severity="warning">업무중복도 계약관리 조회 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <SearchPanel
            keyword={filters.keyword}
            keywordLabel="검색어"
            keywordPlaceholder="계약번호, 용역명, 발주처"
            onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
            onReset={handleReset}
            onSearch={handleSearch}
            resetLabel="초기화"
            searchLabel="조회"
          >
            <TextField
              label="기준일"
              onChange={(event) => setFilters((current) => ({ ...current, referenceDate: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              type="date"
              value={filters.referenceDate}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="상태"
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.status}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="구분"
              onChange={(event) => setFilters((current) => ({ ...current, serviceType: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.serviceType}
            />
            <TextField
              label="발주처"
              onChange={(event) => setFilters((current) => ({ ...current, clientName: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.clientName}
            />
            <Autocomplete<WorkOverlapContractEngineerCandidate, false, false, true>
              freeSolo
              getOptionLabel={engineerOptionLabel}
              inputValue={filters.engineerName}
              isOptionEqualToValue={(option, value) => typeof value !== "string" && option.engineerId === value.engineerId}
              loading={engineerCandidatesQuery.isFetching}
              onChange={(_event, nextValue) => {
                const nextEngineerName = typeof nextValue === "string" ? nextValue : nextValue?.name ?? nextValue?.engineerId ?? "";
                setFilters((current) => ({ ...current, engineerName: nextEngineerName }));
                setEngineerKeyword(nextEngineerName);
              }}
              onInputChange={(_event, nextInputValue) => {
                setFilters((current) => ({ ...current, engineerName: nextInputValue }));
                setEngineerKeyword(nextInputValue);
              }}
              options={engineerOptions}
              renderInput={(params) => <TextField {...params} label="기술인" size="small" sx={{ ...standardFieldSx, flex: "1 1 160px", minWidth: 160, width: "100%" }} />}
            />
            <Box sx={{ flexBasis: "100%", height: 0, m: 0, p: 0 }} />
            <TextField
              label="계약시작일 From"
              onChange={(event) => setFilters((current) => ({ ...current, constructionStartDateFrom: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              type="date"
              value={filters.constructionStartDateFrom}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="계약시작일 To"
              onChange={(event) => setFilters((current) => ({ ...current, constructionStartDateTo: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              type="date"
              value={filters.constructionStartDateTo}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="실적증명"
              onChange={(event) => setFilters((current) => ({ ...current, performanceCertification: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.performanceCertification}
            >
              {RECEIPT_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="참여명단"
              onChange={(event) => setFilters((current) => ({ ...current, participateListDocument: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.participateListDocument}
            >
              {RECEIPT_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="CEMS 승인여부"
              onChange={(event) => setFilters((current) => ({ ...current, cemsConfirm: event.target.value as WorkOverlapContractFilters["cemsConfirm"] }))}
              size="small"
              sx={standardFieldSx}
              value={filters.cemsConfirm}
            >
              {CEMS_CONFIRM_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </SearchPanel>

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              overflowX: "auto",
              pb: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            {SUMMARY_ITEMS.map((item) => {
              const Icon = item.icon;
              const isAmount = item.key === "amount";

              return (
                <Card
                  key={item.key}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    flex: isAmount ? "1.4 1 280px" : "1 1 180px",
                    minWidth: isAmount ? 280 : 180,
                    height: 104,
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      p: 1.25,
                      height: "100%",
                      "&:last-child": { pb: 1.25 },
                    }}
                  >
                    <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                      <Typography color="text.secondary" variant="caption">
                        {item.label}
                      </Typography>
                      <Typography sx={{ mt: 0.25, fontWeight: 900, letterSpacing: 0, lineHeight: 1.1 }} variant={isAmount ? "h5" : "h6"}>
                        {getSummaryValue(item.key)}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.15, whiteSpace: "pre-line" }} variant="caption">
                        {item.note}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        alignItems: "center",
                        bgcolor: item.color,
                        borderRadius: 1.5,
                        color: "common.white",
                        display: "flex",
                        flexShrink: 0,
                        height: 36,
                        justifyContent: "center",
                        width: 36,
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  계약 목록
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button disabled={!canCreate} onClick={openNewDialog} startIcon={<AddOutlinedIcon />} variant="outlined">
                    신규
                  </Button>
                </Stack>
              </Box>

              <EnterpriseDataGrid<WorkOverlapContractRecord>
                columns={columns}
                getRowId={(row) => row.contractNo}
                loading={contractsQuery.isLoading || contractsQuery.isFetching}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                onRowDoubleClick={(params: GridRowParams<WorkOverlapContractRecord>) => {
                  openEditDialog(params.row);
                }}
                paginationMode="server"
                paginationModel={paginationModel}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                rowCount={pageData.totalElements}
                rows={pageData.content ?? EMPTY_ROWS}
                showPageNumbers
                showXlsxExportButton
                wrapperMinHeight={640}
                sx={{ height: 640, "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
              />
            </CardContent>
          </Card>
        </Stack>
      )}

      <WorkOverlapContractDetailDialog
        deleting={deleteMutation.isPending}
        deleteDisabled={!canDelete}
        key={`work-overlap-contract-${dialogSeed}`}
        onClose={() => {
          setDialogOpen(false);
          setEditingRecord(null);
        }}
        onDelete={(record) => setDeleteTarget(record)}
        onSave={setPendingSave}
        open={dialogOpen}
        record={editingRecord}
        saveDisabled={editingRecord?.contractNo ? !canUpdate : !canCreate}
        saving={saveMutation.isPending}
      />

      <ConfirmActionDialog
        confirmLabel="저장"
        message="선택한 계약을 저장하시겠습니까?"
        open={Boolean(pendingSave)}
        onClose={() => setPendingSave(null)}
        title="저장 확인"
        onConfirm={() => {
          if (pendingSave) {
            saveMutation.mutate(pendingSave);
          }
        }}
      />

      <ConfirmDeleteDialog
        message="선택한 계약을 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="삭제 확인"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget);
          }
        }}
      />

    </Box>
  );
}
