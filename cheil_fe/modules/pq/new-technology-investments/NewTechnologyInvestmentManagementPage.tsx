"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import { BarPlot, ChartsContainer, ChartsGrid, ChartsLegend, ChartsTooltip, ChartsXAxis, ChartsYAxis, LinePlot, MarkPlot } from "@mui/x-charts";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { AuditFields } from "@/components/common/AuditFields";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import {
  createNewTechnologyInvestment,
  deleteNewTechnologyInvestment,
  getNewTechnologyInvestment,
  listNewTechnologyInvestments,
  NEW_TECHNOLOGY_INVESTMENT_PAGE_SIZE,
  updateNewTechnologyInvestment,
  type NewTechnologyInvestmentPageResponse,
  type NewTechnologyInvestmentRecord,
  type NewTechnologyInvestmentRequest,
  type NewTechnologyInvestmentSearchParams,
} from "@/modules/pq/new-technology-investments/api";

const EMPTY_ROWS: NewTechnologyInvestmentRecord[] = [];

const emptyDraft = (): NewTechnologyInvestmentRecord => ({
  id: 0,
  investmentYear: "",
  revenue: null,
  totalAssets: null,
  equityCapital: null,
  currentLiabilities: null,
  fixedLiabilities: null,
  currentAssets: null,
  netIncome: null,
  totalLiabilities: null,
  technologyDevelopmentInvestment: null,
  technologyDevelopmentInvestmentRatio: null,
  equityRatio: null,
  returnOnEquity: null,
  currentRatio: null,
  debtRatio: null,
  remark: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

const emptyPage = (page: number, size: number): NewTechnologyInvestmentPageResponse => ({
  content: EMPTY_ROWS,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const text = (value: string | null | undefined) => value ?? "";
const numberValue = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));
const formatAmount = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
const formatPercent = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "-"
    : `${Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`;
const yearValue = (value: string) => value.replace(/\D/g, "").slice(0, 4);
const toInvestmentRequest = (draft: NewTechnologyInvestmentRecord): NewTechnologyInvestmentRequest => ({
  currentAssets: draft.currentAssets,
  currentLiabilities: draft.currentLiabilities,
  equityCapital: draft.equityCapital,
  fixedLiabilities: draft.fixedLiabilities,
  investmentYear: yearValue(draft.investmentYear),
  netIncome: draft.netIncome,
  remark: text(draft.remark).trim(),
  revenue: draft.revenue,
  technologyDevelopmentInvestment: draft.technologyDevelopmentInvestment,
  totalAssets: draft.totalAssets,
  totalLiabilities: draft.totalLiabilities,
});

export function NewTechnologyInvestmentManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = NEW_TECHNOLOGY_INVESTMENT_PAGE_SIZE;
  const [draft, setDraft] = useState<NewTechnologyInvestmentRecord>(() => emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<NewTechnologyInvestmentRecord | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const { showSnackbar } = useAppSnackbar();

  const searchParams = useMemo<NewTechnologyInvestmentSearchParams>(
    () => ({ page, size: pageSize, yearFrom, yearTo }),
    [page, pageSize, yearFrom, yearTo],
  );

  const investmentsQuery = useQuery({
    queryKey: ["new-technology-investments", searchParams],
    queryFn: () => listNewTechnologyInvestments(searchParams),
    enabled: tabQueryEnabled,
  });

  const selectedInvestmentId = draft.id;
  const detailQuery = useQuery({
    queryKey: ["new-technology-investment", selectedInvestmentId],
    queryFn: () => getNewTechnologyInvestment(selectedInvestmentId),
    enabled: tabQueryEnabled && selectedInvestmentId > 0,
  });

  const pageData = investmentsQuery.data ?? emptyPage(page, pageSize);
  const selectedRecord = detailQuery.data ?? draft;
  const paginationModel = useMemo(() => ({ page, pageSize }), [page, pageSize]);
  const summaryRecord = selectedInvestmentId > 0 ? selectedRecord : pageData.content[0] ?? emptyDraft();
  const totalInvestment = pageData.content.reduce((sum, row) => sum + Number(row.technologyDevelopmentInvestment ?? 0), 0);
  const averageInvestment =
    pageData.content.length === 0
      ? null
      : pageData.content.reduce((sum, row) => sum + Number(row.technologyDevelopmentInvestment ?? 0), 0) / pageData.content.length;
  const chartRows = useMemo(
    () => [...pageData.content].sort((left, right) => left.investmentYear.localeCompare(right.investmentYear)),
    [pageData.content],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const request = toInvestmentRequest(draft);
      if (!request.investmentYear) {
        throw new Error("연도를 입력하세요.");
      }
      return draft.id > 0 ? updateNewTechnologyInvestment(draft.id, request) : createNewTechnologyInvestment(request);
    },
    onSuccess: async (saved) => {
      setDraft(saved);
      setSaveConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["new-technology-investments"] });
      await queryClient.invalidateQueries({ queryKey: ["new-technology-investment", saved.id] });
      showSnackbar({ message: "투자실적을 저장했습니다.", severity: "success" });
    },
    onError: (error) => showSnackbar({ message: error instanceof Error ? error.message : "저장에 실패했습니다.", severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: NewTechnologyInvestmentRecord) => deleteNewTechnologyInvestment(target.id),
    onSuccess: async () => {
      setDraft(emptyDraft());
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["new-technology-investments"] });
      showSnackbar({ message: "투자실적을 삭제했습니다.", severity: "success" });
    },
    onError: (error) => showSnackbar({ message: error instanceof Error ? error.message : "삭제에 실패했습니다.", severity: "error" }),
  });

  const columns = useMemo<GridColDef<NewTechnologyInvestmentRecord>[]>(
    () => [
      { field: "investmentYear", headerName: "연도", width: 90, align: "center", headerAlign: "center" },
      { field: "revenue", headerName: "매출액", width: 145, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "technologyDevelopmentInvestment", headerName: "기술개발투자액", width: 150, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "technologyDevelopmentInvestmentRatio", headerName: "투자비율", width: 110, align: "right", headerAlign: "center", valueFormatter: (value) => formatPercent(value as number | null) },
      { field: "totalAssets", headerName: "총자산", width: 140, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "equityCapital", headerName: "자기자본", width: 140, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "currentAssets", headerName: "유동자산", width: 140, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "currentLiabilities", headerName: "유동부채", width: 140, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "fixedLiabilities", headerName: "고정부채", width: 130, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "totalLiabilities", headerName: "부채총계", width: 140, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "netIncome", headerName: "당기순이익", width: 140, align: "right", headerAlign: "center", valueFormatter: (value) => formatAmount(value as number | null) },
      { field: "equityRatio", headerName: "자기자본비율", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatPercent(value as number | null) },
      { field: "returnOnEquity", headerName: "자기자본이익율", width: 130, align: "right", headerAlign: "center", valueFormatter: (value) => formatPercent(value as number | null) },
      { field: "currentRatio", headerName: "유동비율", width: 110, align: "right", headerAlign: "center", valueFormatter: (value) => formatPercent(value as number | null) },
      { field: "debtRatio", headerName: "부채비율", width: 110, align: "right", headerAlign: "center", valueFormatter: (value) => formatPercent(value as number | null) },
    ],
    [],
  );

  const updateDraft = (field: keyof NewTechnologyInvestmentRecord, value: string | number | null) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateNumberDraft = (field: keyof NewTechnologyInvestmentRecord, value: string) => {
    updateDraft(field, value === "" ? null : Number(value));
  };

  const handleSearch = (nextYear?: string) => {
    const shouldRefetch = page === 0 && (nextYear === undefined || (yearFrom === nextYear && yearTo === nextYear));

    setPage(0);

    if (shouldRefetch) {
      void investmentsQuery.refetch();
    }
  };

  const handleReset = () => {
    const shouldRefetch = keyword === "" && yearFrom === "" && yearTo === "" && page === 0;

    setKeyword("");
    setYearFrom("");
    setYearTo("");
    setPage(0);

    if (shouldRefetch) {
      void investmentsQuery.refetch();
    }
  };

  const handleNew = () => {
    setDraft(emptyDraft());
  };

  const handleSaveClick = () => {
    if (draft.id > 0 && !canUpdate) {
      showSnackbar({ message: "투자실적 수정 권한이 없습니다.", severity: "error" });
      return;
    }
    if (draft.id === 0 && !canCreate) {
      showSnackbar({ message: "투자실적 등록 권한이 없습니다.", severity: "error" });
      return;
    }
    setSaveConfirmOpen(true);
  };

  const canSave = draft.id > 0 ? canUpdate : canCreate;

  return (
    <Box>
      <PageHeader
        title="신기술 투자실적"
      />

      <SearchPanel
        keyword={keyword}
        keywordLabel="연도"
        keywordPlaceholder="연도 입력"
        onKeywordChange={(value) => setKeyword(yearValue(value))}
        onReset={handleReset}
        onSearch={(nextKeyword) => {
          const year = yearValue(nextKeyword);
          setYearFrom(year);
          setYearTo(year);
          handleSearch(year);
        }}
        searchDisabled={!canRead}
      >
        <TextField
          label="연도 시작"
          onChange={(event) => setYearFrom(yearValue(event.target.value))}
          size="small"
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }}
          sx={standardFieldSx}
          value={yearFrom}
        />
        <TextField
          label="연도 종료"
          onChange={(event) => setYearTo(yearValue(event.target.value))}
          size="small"
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }}
          sx={standardFieldSx}
          value={yearTo}
        />
      </SearchPanel>

      {!canRead ? (
        <Alert severity="warning">투자실적을 조회할 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <YearlyInvestmentCharts rows={chartRows} />

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" } }}>
            <SummaryBox helper="조회 결과 기준" label="평균 기술개발 투자액" value={`${formatAmount(averageInvestment)}원`} />
            <SummaryBox helper="기술개발투자액/매출액" label="투자비율" value={formatPercent(summaryRecord.technologyDevelopmentInvestmentRatio)} />
            <SummaryBox helper="자기자본/총자산" label="자기자본비율" value={formatPercent(summaryRecord.equityRatio)} />
            <SummaryBox helper="당기순이익/자기자본" label="자기자본이익율" value={formatPercent(summaryRecord.returnOnEquity)} />
            <SummaryBox helper="유동자산/유동부채" label="유동비율" value={formatPercent(summaryRecord.currentRatio)} />
            <SummaryBox helper="부채총계/자기자본" label="부채비율" value={formatPercent(summaryRecord.debtRatio)} />
          </Box>

          <Box
            sx={{
              alignItems: "start",
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.25fr) minmax(430px, 0.75fr)" },
            }}
          >
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    투자실적 목록
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Chip label={`총 ${pageData.totalElements.toLocaleString("ko-KR")}건`} size="small" variant="outlined" />
                    <Chip label={`투자액 ${formatAmount(totalInvestment)}원`} size="small" variant="outlined" />
                  </Stack>
                </Box>
                <EnterpriseDataGrid<NewTechnologyInvestmentRecord>
                  columns={columns}
                  getRowId={(row) => row.id}
                  loading={investmentsQuery.isLoading || investmentsQuery.isFetching}
                  onPaginationModelChange={(model) => {
                    setPage((currentPage) => (currentPage === model.page ? currentPage : model.page));
                  }}
                  onRowClick={(params: GridRowParams<NewTechnologyInvestmentRecord>) => setDraft(params.row)}
                  paginationModel={paginationModel}
                  rows={pageData.content ?? EMPTY_ROWS}
                  paginationMode="server"
                  rowCount={pageData.totalElements}
                  pageSizeOptions={[pageSize]}
                  showXlsxExportButton
                  showPageNumbers
                  sx={{ height: 640, "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                  wrapperMinHeight={640}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    상세 정보
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
                      신규
                    </Button>
                    <Button disabled={!canSave || saveMutation.isPending} onClick={handleSaveClick} startIcon={<SaveOutlinedIcon />} variant="contained">
                      저장
                    </Button>
                    <Button
                      color="error"
                      disabled={!canDelete || draft.id === 0 || deleteMutation.isPending}
                      onClick={() => setDeleteTarget(draft)}
                      startIcon={<DeleteOutlineOutlinedIcon />}
                      variant="outlined"
                    >
                      삭제
                    </Button>
                  </Stack>
                </Box>

                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                  <TextField
                    label="연도"
                    onChange={(event) => updateDraft("investmentYear", yearValue(event.target.value))}
                    required
                    size="small"
                    slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }}
                    sx={standardFieldSx}
                    value={text(draft.investmentYear)}
                  />
                  <TextField label="매출액" onChange={(event) => updateNumberDraft("revenue", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.revenue)} />
                  <TextField label="총자산" onChange={(event) => updateNumberDraft("totalAssets", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.totalAssets)} />
                  <TextField label="자기자본" onChange={(event) => updateNumberDraft("equityCapital", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.equityCapital)} />
                  <TextField label="유동자산" onChange={(event) => updateNumberDraft("currentAssets", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.currentAssets)} />
                  <TextField label="유동부채" onChange={(event) => updateNumberDraft("currentLiabilities", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.currentLiabilities)} />
                  <TextField label="고정부채" onChange={(event) => updateNumberDraft("fixedLiabilities", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.fixedLiabilities)} />
                  <TextField label="부채총계" onChange={(event) => updateNumberDraft("totalLiabilities", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.totalLiabilities)} />
                  <TextField label="당기순이익" onChange={(event) => updateNumberDraft("netIncome", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.netIncome)} />
                  <TextField label="기술개발투자액" onChange={(event) => updateNumberDraft("technologyDevelopmentInvestment", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.technologyDevelopmentInvestment)} />
                  <TextField label="비고" minRows={3} multiline onChange={(event) => updateDraft("remark", event.target.value)} sx={{ gridColumn: "1 / -1" }} value={text(draft.remark)} />
                </Box>

                <AuditFields
                  createdAt={selectedRecord.createdAt}
                  createdBy={selectedRecord.createdId}
                  updatedAt={selectedRecord.lastChangedAt}
                  updatedBy={selectedRecord.lastChangedId}
                />
              </CardContent>
            </Card>
          </Box>

        </Stack>
      )}

      <ConfirmActionDialog
        confirmLabel="저장"
        loading={saveMutation.isPending}
        message="투자실적을 저장하시겠습니까?"
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={() => saveMutation.mutate()}
        open={saveConfirmOpen}
        targetLabel={draft.investmentYear}
        title="저장 확인"
      />
      <ConfirmDeleteDialog
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        open={Boolean(deleteTarget)}
        targetLabel={deleteTarget?.investmentYear}
      />
    </Box>
  );
}

function SummaryBox({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, px: 2, py: 1.25 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, mt: 0.25 }} variant="h6">
        {value}
      </Typography>
      <Typography color="text.secondary" variant="caption">
        {helper}
      </Typography>
    </Box>
  );
}

function YearlyInvestmentCharts({ rows }: { rows: NewTechnologyInvestmentRecord[] }) {
  const maxInvestment = Math.max(...rows.map((row) => Number(row.technologyDevelopmentInvestment ?? 0)), 1);
  const averageInvestment =
    rows.length === 0 ? null : rows.reduce((sum, row) => sum + Number(row.technologyDevelopmentInvestment ?? 0), 0) / rows.length;
  const latest = rows.at(-1);
  const previous = rows.at(-2);
  const investmentDelta =
    latest?.technologyDevelopmentInvestment !== null &&
    latest?.technologyDevelopmentInvestment !== undefined &&
    previous?.technologyDevelopmentInvestment !== null &&
    previous?.technologyDevelopmentInvestment !== undefined
      ? latest.technologyDevelopmentInvestment - previous.technologyDevelopmentInvestment
      : null;

  return (
    <Card>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            연도별 지표 추이
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip label={`최근 연도 ${latest?.investmentYear ?? "-"}`} size="small" variant="outlined" />
            <Chip
              color={investmentDelta === null ? "default" : investmentDelta >= 0 ? "success" : "warning"}
              label={`투자액 증감 ${investmentDelta === null ? "-" : formatAmount(investmentDelta)}원`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>

        {rows.length === 0 ? (
          <Box sx={{ alignItems: "center", border: "1px dashed", borderColor: "divider", borderRadius: 1, display: "flex", minHeight: 220, justifyContent: "center" }}>
            <Typography color="text.secondary" variant="body2">
              표시할 투자실적이 없습니다.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) minmax(0, 1fr)" } }}>
            <InvestmentTrendChart averageInvestment={averageInvestment} maxInvestment={maxInvestment} rows={rows} />
            <RatioTrendChart rows={rows} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function InvestmentTrendChart({
  averageInvestment,
  maxInvestment,
  rows,
}: {
  averageInvestment: number | null;
  maxInvestment: number;
  rows: NewTechnologyInvestmentRecord[];
}) {
  const dataset = rows.map((row) => ({
    investmentAmount: Number(row.technologyDevelopmentInvestment ?? 0),
    investmentRatio: Number(row.technologyDevelopmentInvestmentRatio ?? 0),
    investmentYear: row.investmentYear,
  }));
  const maxRatio = Math.max(...dataset.map((row) => row.investmentRatio), 1);

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, minWidth: 0, p: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", mb: 0.5 }}>
        <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
          기술개발투자액 및 투자비율
        </Typography>
        <Chip label={`평균 기술개발 투자액 ${formatAmount(averageInvestment)}원`} size="small" variant="outlined" />
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <ChartsContainer
          dataset={dataset}
          height={300}
          margin={{ bottom: 36, left: 70, right: 62, top: 36 }}
          series={[
            {
              color: "#0ea5e9",
              dataKey: "investmentAmount",
              label: "투자액",
              type: "bar",
              valueFormatter: (value: number | null) => `${formatAmount(value)}원`,
              yAxisId: "amountAxis",
            },
            {
              color: "#f59e0b",
              curve: "monotoneX",
              dataKey: "investmentRatio",
              label: "투자비율",
              showMark: true,
              type: "line",
              valueFormatter: (value: number | null) => formatPercent(value),
              yAxisId: "ratioAxis",
            },
          ]}
          sx={{ minWidth: 640 }}
          xAxis={[{ dataKey: "investmentYear", id: "yearAxis", scaleType: "band" }]}
          yAxis={[
            {
              id: "amountAxis",
              label: "투자액",
              max: maxInvestment,
              min: 0,
              valueFormatter: (value: number) => `${formatAmount(Math.round(Number(value) / 100000000))}억`,
            },
            {
              id: "ratioAxis",
              label: "투자비율",
              max: maxRatio,
              min: 0,
              position: "right",
              valueFormatter: (value: number) => formatPercent(Number(value)),
            },
          ]}
        >
          <ChartsGrid horizontal />
          <BarPlot />
          <LinePlot />
          <MarkPlot />
          <ChartsXAxis axisId="yearAxis" />
          <ChartsYAxis axisId="amountAxis" />
          <ChartsYAxis axisId="ratioAxis" />
          <ChartsTooltip trigger="axis" />
          <ChartsLegend direction="horizontal" />
        </ChartsContainer>
      </Box>
    </Box>
  );
}

function RatioTrendChart({ rows }: { rows: NewTechnologyInvestmentRecord[] }) {
  const dataset = rows.map((row) => ({
    currentRatio: Number(row.currentRatio ?? 0),
    debtRatio: Number(row.debtRatio ?? 0),
    equityRatio: Number(row.equityRatio ?? 0),
    investmentYear: row.investmentYear,
    returnOnEquity: Number(row.returnOnEquity ?? 0),
  }));
  const series = [
    { color: "#2563eb", dataKey: "equityRatio", label: "자기자본비율", type: "line" as const },
    { color: "#16a34a", dataKey: "returnOnEquity", label: "자기자본이익율", type: "line" as const },
    { color: "#0891b2", dataKey: "currentRatio", label: "유동비율", type: "line" as const },
    { color: "#dc2626", dataKey: "debtRatio", label: "부채비율", type: "line" as const },
  ] as const;

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, minWidth: 0, p: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", mb: 0.5 }}>
        <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
          주요 비율
        </Typography>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <ChartsContainer
          dataset={dataset}
          height={300}
          margin={{ bottom: 36, left: 58, right: 20, top: 36 }}
          series={series.map((item) => ({
            ...item,
            curve: "monotoneX" as const,
            showMark: true,
            valueFormatter: (value: number | null) => formatPercent(value),
          }))}
          sx={{ minWidth: 640 }}
          xAxis={[{ dataKey: "investmentYear", id: "yearAxis", scaleType: "band" }]}
          yAxis={[{ id: "ratioAxis", label: "비율", min: 0, valueFormatter: (value: number) => formatPercent(Number(value)) }]}
        >
          <ChartsGrid horizontal />
          <LinePlot />
          <MarkPlot />
          <ChartsXAxis axisId="yearAxis" />
          <ChartsYAxis axisId="ratioAxis" />
          <ChartsTooltip trigger="axis" />
          <ChartsLegend direction="horizontal" />
        </ChartsContainer>
      </Box>
    </Box>
  );
}
