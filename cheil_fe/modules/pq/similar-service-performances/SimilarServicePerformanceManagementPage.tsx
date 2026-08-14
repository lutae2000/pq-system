"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRowParams, GridRowSelectionModel } from "@mui/x-data-grid";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  createSimilarServicePerformance,
  deleteSimilarServicePerformance,
  listSimilarServicePerformances,
  SIMILAR_SERVICE_PERFORMANCE_PAGE_SIZE,
  updateSimilarServicePerformance,
  type SimilarServicePerformancePageResponse,
  type SimilarServicePerformanceRecord,
  type SimilarServicePerformanceSearchParams,
} from "@/modules/pq/similar-service-performances/api";
import { SimilarServicePerformanceDialog } from "@/modules/pq/similar-service-performances/SimilarServicePerformanceDialog";
import {
  calculateAppliedAmount,
  calculateRecentThreeYearPeriod,
  calculateRecentThreeYearRatio,
  defaultSimilarServicePerformanceRecord,
  displayText,
  formatNumberText,
  formatPeriodText,
  getTodayDateInputValue,
  toSimilarServicePerformanceRequest,
} from "@/modules/pq/similar-service-performances/similarServicePerformanceForm";

const EMPTY_ROWS: SimilarServicePerformanceRecord[] = [];
const PAGE_SIZE_OPTIONS = [25, 50, SIMILAR_SERVICE_PERFORMANCE_PAGE_SIZE];

const emptyPage = (page: number, size: number): SimilarServicePerformancePageResponse => ({
  content: EMPTY_ROWS,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const formatOneDecimalText = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

const DEFAULT_FILTERS = {
  client: "",
  constructionType: "",
  contractFromDate: "",
  contractToDate: "",
  keyword: "",
  referenceDate: getTodayDateInputValue(),
};

export function SimilarServicePerformanceManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(SIMILAR_SERVICE_PERFORMANCE_PAGE_SIZE);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SimilarServicePerformanceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SimilarServicePerformanceRecord | null>(null);
  const [bulkWeightDialogOpen, setBulkWeightDialogOpen] = useState(false);
  const [bulkWeightConfirmOpen, setBulkWeightConfirmOpen] = useState(false);
  const [bulkWeightValue, setBulkWeightValue] = useState("");
  const [bulkWeightTargets, setBulkWeightTargets] = useState<SimilarServicePerformanceRecord[]>([]);
  const [notice, setNotice] = useState<{ message: string; severity: "error" | "info" | "success" } | null>(null);

  const searchParams = useMemo<SimilarServicePerformanceSearchParams>(
    () => ({
      ...appliedFilters,
      page,
      size: pageSize,
    }),
    [appliedFilters, page, pageSize],
  );

  const performancesQuery = useQuery({
    queryKey: ["similar-service-performances", searchParams],
    queryFn: () => listSimilarServicePerformances(searchParams),
    enabled: tabQueryEnabled,
    placeholderData: keepPreviousData,
  });

  const pageData = performancesQuery.data ?? emptyPage(page, pageSize);
  const referenceDate = appliedFilters.referenceDate || getTodayDateInputValue();
  const selectedRows = useMemo(() => {
    const selectedIds = rowSelectionModel.ids;

    return pageData.content.filter((row) => {
      const rowId = row.id;
      if (rowId === null || rowId === undefined) {
        return false;
      }

      return rowSelectionModel.type === "include" ? selectedIds.has(rowId) : !selectedIds.has(rowId);
    });
  }, [pageData.content, rowSelectionModel]);
  const selectedSummary = useMemo(
    () =>
      selectedRows.reduce(
        (summary, row) => {
          const contractPrice = Number(row.contractPrice ?? 0);
          const recentThreeYearRatio = calculateRecentThreeYearRatio(referenceDate, row.contractFromDate, row.contractToDate);

          return {
            appliedAmount: summary.appliedAmount + calculateAppliedAmount(row.contractPrice, row.weight),
            contractPrice: summary.contractPrice + contractPrice,
            recentThreeYearContractAmount: summary.recentThreeYearContractAmount + contractPrice * ((recentThreeYearRatio ?? 0) / 100),
          };
        },
        { appliedAmount: 0, contractPrice: 0, recentThreeYearContractAmount: 0 },
      ),
    [referenceDate, selectedRows],
  );

  const bulkWeightNumber = useMemo(() => {
    const normalized = bulkWeightValue.trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }, [bulkWeightValue]);

  const confirmProcessRowUpdate = useCallback(
    (updatedRow: SimilarServicePerformanceRecord, originalRow: SimilarServicePerformanceRecord) => {
      if (updatedRow.weight === originalRow.weight) {
        return null;
      }

      return {
        confirmColor: "primary" as const,
        confirmLabel: "저장",
        message: "가중치를 저장하시겠습니까?",
        targetLabel: displayText(updatedRow.serviceName),
        title: "가중치 수정",
      };
    },
    [],
  );

  const processRowUpdate = useCallback(
    async (updatedRow: SimilarServicePerformanceRecord, originalRow: SimilarServicePerformanceRecord) => {
      if (updatedRow.weight === originalRow.weight) {
        return originalRow;
      }

      if (!updatedRow.id) {
        throw new Error("저장할 행을 찾을 수 없습니다.");
      }

      const saved = await updateSimilarServicePerformance(updatedRow.id, toSimilarServicePerformanceRequest(updatedRow));
      return saved;
    },
    [],
  );

  const columns = useMemo<GridColDef<SimilarServicePerformanceRecord>[]>(
    () => [
      { field: "serviceName", headerName: "용역명", minWidth: 260, flex: 1.2, valueGetter: (_value, row) => displayText(row.serviceName) },
      { field: "constructionType", headerName: "공종", width: 150, valueGetter: (_value, row) => displayText(row.constructionType) },
      { field: "client", headerName: "발주처", minWidth: 170, flex: 0.8, valueGetter: (_value, row) => displayText(row.client) },
      { field: "contractPeriod", headerName: "계약기간", width: 180, valueGetter: (_value, row) => formatPeriodText(row.contractFromDate, row.contractToDate) },
      {
        field: "recentThreeYearPeriod",
        headerName: "최근 3년간 수행한 기간",
        width: 190,
        valueGetter: (_value, row) => calculateRecentThreeYearPeriod(referenceDate, row.contractFromDate, row.contractToDate),
      },
      {
        field: "recentThreeYearRatio",
        headerName: "최근 3년간 수행한 기간 비율",
        width: 170,
        align: "right",
        headerAlign: "center",
        renderHeader: () => (
          <Tooltip title="소수점 둘째 자리에서 반올림하여 소수점 첫째 자리까지 표시합니다.">
            <span style={{ fontWeight: 700 }}>최근 3년간 수행한 기간 비율</span>
          </Tooltip>
        ),
        valueGetter: (_value, row) => calculateRecentThreeYearRatio(referenceDate, row.contractFromDate, row.contractToDate),
        valueFormatter: (value) => formatOneDecimalText(value as number | null),
      },
      { field: "constructionPeriod", headerName: "공사기간", width: 180, valueGetter: (_value, row) => formatPeriodText(row.constructionFromDate, row.constructionToDate) },
      { field: "contractPrice", headerName: "용역비", width: 130, align: "right", headerAlign: "center", valueFormatter: (value) => formatNumberText(value as number | null) },
      { field: "shareRatio", headerName: "지분율(%)", width: 90, align: "right", headerAlign: "center", valueFormatter: (value) => formatNumberText(value as number | null) },
      {
        field: "weight",
        headerName: "가중치(%)",
        width: 90,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumberText(value as number | null),
        valueParser: (value) => {
          if (value === null || value === undefined || value === "") {
            return null;
          }

          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        },
      },
      {
        field: "appliedAmount",
        headerName: "가중치 적용금액",
        width: 140,
        align: "right",
        headerAlign: "center",
        valueGetter: (_value, row) => calculateAppliedAmount(row.contractPrice, row.weight),
        valueFormatter: (value) => formatNumberText(value as number | null),
      },
      {
        field: "recentThreeYearAppliedAmount",
        headerName: "최근 3년 가중치 적용금액",
        width: 170,
        align: "right",
        headerAlign: "center",
        valueGetter: (_value, row) => {
          const weightAppliedAmount = calculateAppliedAmount(row.contractPrice, row.weight);
          const ratio = calculateRecentThreeYearRatio(referenceDate, row.contractFromDate, row.contractToDate);
          return weightAppliedAmount * ((ratio ?? 0) / 100);
        },
        valueFormatter: (value) => formatNumberText(value as number | null),
      },
      { field: "summary", headerName: "개요", minWidth: 220, flex: 1, valueGetter: (_value, row) => displayText(row.summary) },
      { field: "remark", headerName: "비고", minWidth: 180, flex: 0.8, valueGetter: (_value, row) => displayText(row.remark) },
    ],
    [referenceDate],
  );

  const saveMutation = useMutation({
    mutationFn: async (record: SimilarServicePerformanceRecord) => {
      const request = toSimilarServicePerformanceRequest(record);
      return record.id ? updateSimilarServicePerformance(record.id, request) : createSimilarServicePerformance(request);
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setEditingRecord(null);
      await queryClient.invalidateQueries({ queryKey: ["similar-service-performances"] });
      setNotice({ message: "유사용역 수행실적을 저장했습니다.", severity: "success" });
    },
    onError: (error) => setNotice({ message: error instanceof Error ? error.message : "저장에 실패했습니다.", severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: SimilarServicePerformanceRecord) => deleteSimilarServicePerformance(target.id ?? 0),
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["similar-service-performances"] });
      setNotice({ message: "유사용역 수행실적을 삭제했습니다.", severity: "success" });
    },
    onError: (error) => setNotice({ message: error instanceof Error ? error.message : "삭제에 실패했습니다.", severity: "error" }),
  });

  const bulkWeightMutation = useMutation({
    mutationFn: async ({ rows, weight }: { rows: SimilarServicePerformanceRecord[]; weight: number }) => {
      await Promise.all(
        rows.map((row) => {
          if (!row.id) {
            throw new Error("가중치를 저장할 행을 찾을 수 없습니다.");
          }

          return updateSimilarServicePerformance(row.id, toSimilarServicePerformanceRequest({ ...row, weight }));
        }),
      );
    },
    onSuccess: async (_saved, variables) => {
      setBulkWeightConfirmOpen(false);
      setBulkWeightDialogOpen(false);
      setBulkWeightValue("");
      setBulkWeightTargets([]);
      setRowSelectionModel({ ids: new Set(), type: "include" });
      await queryClient.invalidateQueries({ queryKey: ["similar-service-performances"] });
      setNotice({ message: `${variables.rows.length.toLocaleString("ko-KR")}건의 가중치를 일괄 저장했습니다.`, severity: "success" });
    },
    onError: (error) => setNotice({ message: error instanceof Error ? error.message : "가중치 일괄 저장에 실패했습니다.", severity: "error" }),
  });

  const paginationModel = useMemo<GridPaginationModel>(() => ({ page, pageSize }), [page, pageSize]);

  const handleSearch = (keyword: string) => {
    setAppliedFilters((current) => ({ ...current, ...filters, keyword }));
    setPage(0);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(0);
    setRowSelectionModel({ ids: new Set(), type: "include" });
  };

  const handleNew = () => {
    setEditingRecord(defaultSimilarServicePerformanceRecord());
    setDialogOpen(true);
  };

  const handleBulkWeightOpen = () => {
    setBulkWeightTargets(selectedRows);
    setBulkWeightValue("");
    setBulkWeightDialogOpen(true);
  };

  const handleBulkWeightApply = () => {
    if (bulkWeightTargets.length === 0 || bulkWeightNumber === null) {
      return;
    }

    setBulkWeightConfirmOpen(true);
  };

  return (
    <Box>
      <PageHeader title="유사용역 수행실적 관리" />

      {!canRead ? (
        <Alert severity="warning">유사용역 수행실적 조회 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <SearchPanel
            keyword={filters.keyword}
            keywordLabel="검색어"
            keywordPlaceholder="용역명, 공종, 발주처, 개요"
            onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
            onReset={handleReset}
            onSearch={handleSearch}
            resetLabel="초기화"
            searchDisabled={!canRead}
            searchLabel="조회"
          >
            <TextField
              label="공종"
              onChange={(event) => setFilters((current) => ({ ...current, constructionType: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.constructionType}
            />
            <TextField
              label="발주처"
              onChange={(event) => setFilters((current) => ({ ...current, client: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.client}
            />
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
              label="계약 시작일"
              onChange={(event) => setFilters((current) => ({ ...current, contractFromDate: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              type="date"
              value={filters.contractFromDate}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="계약 종료일"
              onChange={(event) => setFilters((current) => ({ ...current, contractToDate: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              type="date"
              value={filters.contractToDate}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </SearchPanel>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            <Card variant="outlined" sx={{ minHeight: 94 }}>
              <CardContent sx={{ px: 1.75, py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }} variant="body2">
                  총 가중치 적용금액(백만원)
                </Typography>
                <Typography sx={{ color: "primary.main", fontWeight: 900, lineHeight: 1.15, mt: 0.75 }} variant="h5">
                  {formatNumberText(selectedSummary.appliedAmount)}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minHeight: 94 }}>
              <CardContent sx={{ px: 1.75, py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }} variant="body2">
                  총 계약금액(백만원)
                </Typography>
                <Typography sx={{ color: "primary.main", fontWeight: 900, lineHeight: 1.15, mt: 0.75 }} variant="h5">
                  {formatNumberText(selectedSummary.contractPrice)}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minHeight: 94 }}>
              <CardContent sx={{ px: 1.75, py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }} variant="body2">
                  최근 3년 총 계약금액(백만원)
                </Typography>
                <Typography sx={{ color: "primary.main", fontWeight: 900, lineHeight: 1.15, mt: 0.75 }} variant="h5">
                  {formatNumberText(selectedSummary.recentThreeYearContractAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  목록
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
                    신규
                  </Button>
                  <Button
                    disabled={!canUpdate || selectedRows.length === 0}
                    onClick={handleBulkWeightOpen}
                    startIcon={<TuneOutlinedIcon />}
                    variant="outlined"
                  >
                    가중치 일괄 설정
                  </Button>
                </Stack>
              </Box>

              <EnterpriseDataGrid<SimilarServicePerformanceRecord>
                checkboxSelection
                columns={columns}
                getRowId={(row) => row.id as number}
                hideFooterSelectedRowCount
                confirmProcessRowUpdate={confirmProcessRowUpdate}
                loading={performancesQuery.isLoading || performancesQuery.isFetching}
                isCellEditable={({ field }) => field === "weight" && canUpdate}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                onRowDoubleClick={(params: GridRowParams<SimilarServicePerformanceRecord>) => {
                  setEditingRecord(params.row);
                  setDialogOpen(true);
                }}
                onRowSelectionModelChange={(model) => {
                  setRowSelectionModel(model);
                }}
                processRowUpdate={processRowUpdate}
                paginationMode="server"
                paginationModel={paginationModel}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                rowCount={pageData.totalElements}
                rowSelectionModel={rowSelectionModel}
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

      <SimilarServicePerformanceDialog
        deleting={deleteMutation.isPending}
        deleteDisabled={deleteMutation.isPending}
        onClose={() => {
          setDialogOpen(false);
          setEditingRecord(null);
        }}
        onDelete={(record) => setDeleteTarget(record)}
        onFieldChange={(field, value) => setEditingRecord((current) => (current ? { ...current, [field]: value } : current))}
        onSave={(record) => saveMutation.mutate(record)}
        open={dialogOpen}
        permissions={{ canCreate, canDelete, canUpdate }}
        record={editingRecord}
        saving={saveMutation.isPending}
      />

      <ConfirmDeleteDialog
        message="선택한 유사용역 수행실적을 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        title="삭제 확인"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget);
          }
        }}
      />
      <Dialog fullWidth maxWidth="xs" onClose={() => setBulkWeightDialogOpen(false)} open={bulkWeightDialogOpen}>
        <DialogTitle sx={{ fontWeight: 800 }}>가중치 일괄 설정</DialogTitle>
        <DialogContent dividers sx={{ display: "grid", gap: 2, pt: 2 }}>
          <Typography color="text.secondary" variant="body2">
            선택한 {bulkWeightTargets.length.toLocaleString("ko-KR")}건의 가중치를 동일한 값으로 저장합니다.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="가중치"
            onChange={(event) => setBulkWeightValue(event.target.value)}
            size="small"
            sx={standardFieldSx}
            type="number"
            value={bulkWeightValue}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setBulkWeightDialogOpen(false)} variant="outlined">
            취소
          </Button>
          <Button disabled={bulkWeightNumber === null || bulkWeightMutation.isPending} onClick={handleBulkWeightApply} variant="contained">
            적용
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmActionDialog
        confirmLabel="적용"
        loading={bulkWeightMutation.isPending}
        message="선택한 항목들의 가중치를 일괄 저장하시겠습니까?"
        onClose={() => setBulkWeightConfirmOpen(false)}
        onConfirm={() => {
          if (bulkWeightNumber === null || bulkWeightTargets.length === 0) {
            return;
          }

          bulkWeightMutation.mutate({ rows: bulkWeightTargets, weight: bulkWeightNumber });
        }}
        open={bulkWeightConfirmOpen}
        targetLabel={`${bulkWeightTargets.length.toLocaleString("ko-KR")}건 / 가중치 ${bulkWeightValue || "-"}`}
        title="일괄 저장 확인"
      />
      <Snackbar anchorOrigin={{ horizontal: "center", vertical: "bottom" }} autoHideDuration={3000} open={Boolean(notice)} onClose={() => setNotice(null)}>
        <Alert onClose={() => setNotice(null)} severity={notice?.severity ?? "info"} variant="filled">
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
