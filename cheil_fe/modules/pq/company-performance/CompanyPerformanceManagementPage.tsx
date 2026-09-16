"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import dynamic from "next/dynamic";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { DateRangeField } from "@/components/common/DateRangeField";
import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import type { CompanyPerformanceCodeOption } from "@/modules/pq/company-performance/CompanyPerformanceDetailDialog";
import {
  COMPANY_PERFORMANCE_PAGE_SIZE,
  createCompanyPerformance,
  deleteCompanyPerformance,
  getCompanyPerformance,
  listCompanyPerformances,
  updateCompanyPerformance,
  type CompanyPerformancePageResponse,
  type CompanyPerformanceRecord,
  type CompanyPerformanceSearchParams,
  type CompanyPerformanceUpsertRequest,
} from "@/modules/pq/company-performance/api";

const EMPTY_ROWS: CompanyPerformanceRecord[] = [];
const CompanyPerformanceDetailDialog = dynamic(
  () => import("@/modules/pq/company-performance/CompanyPerformanceDetailDialog").then((module) => module.CompanyPerformanceDetailDialog),
  { ssr: false },
);

const emptyDraft = (): CompanyPerformanceRecord => ({
  seq: 0,
  jobSeq: null,
  jobName: "",
  jobOwnYn: false,
  generalManagementYn: false,
  contractFromDate: null,
  contractToDate: null,
  jobFinishYn: "",
  stopDate: null,
  summary: "",
  jobType: "",
  jobRatio: "",
  contractAmt: null,
  ownAmt: null,
  orderClient: "",
  remark: "",
  divisionRate: null,
  clientKind: "",
  businessType: "",
  overseeYn: false,
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

const text = (value: string | null | undefined) => value ?? "";
const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
const formatDateDisplay = (value: string | null | undefined) => {
  const normalized = text(value).trim();
  if (!normalized) {
    return "-";
  }
  if (normalized.includes("-")) {
    return normalized;
  }
  if (normalized.length === 8) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  return normalized;
};
const formatMoney = (value: number | null | undefined) => new Intl.NumberFormat("ko-KR").format(Number(value ?? 0));
const yesNoOptions = [
  { label: "전체", value: "All" },
  { label: "자사", value: "Y" },
  { label: "타사", value: "N" },
] as const;

const emptyPage = (page: number, size: number): CompanyPerformancePageResponse => ({
  content: EMPTY_ROWS,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const toRequest = (draft: CompanyPerformanceRecord): CompanyPerformanceUpsertRequest => ({
  jobSeq: draft.jobSeq,
  jobName: text(draft.jobName).trim(),
  jobOwnYn: draft.jobOwnYn,
  generalManagementYn: draft.generalManagementYn,
  contractFromDate: draft.contractFromDate,
  contractToDate: draft.contractToDate,
  jobFinishYn: draft.jobFinishYn,
  stopDate: draft.stopDate,
  summary: text(draft.summary).trim(),
  jobType: text(draft.jobType).trim(),
  jobRatio: text(draft.jobRatio).trim(),
  contractAmt: draft.contractAmt,
  ownAmt: draft.ownAmt,
  orderClient: text(draft.orderClient).trim(),
  remark: text(draft.remark).trim(),
  divisionRate: normalizeDivisionRate(draft.divisionRate),
  clientKind: text(draft.clientKind).trim(),
  businessType: text(draft.businessType).trim(),
  overseeYn: draft.overseeYn,
  createdId: text(draft.createdId).trim() || "admin",
  lastChangedId: "admin",
});

const toLabelMap = (options: CompanyPerformanceCodeOption[]) =>
  Object.fromEntries(options.map((option) => [option.value, option.label]));

const normalizeDivisionRate = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  return Math.min(Math.max(0, Math.trunc(value)), 100);
};

const codeLabel = (labelByValue: Record<string, string>, value: string | null | undefined) => {
  const normalized = text(value).trim();
  if (!normalized) {
    return "-";
  }
  return labelByValue[normalized] ?? normalized;
};

export function CompanyPerformanceManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [clientKind, setClientKind] = useState("");
  const [jobOwnFilter, setJobOwnFilter] = useState<"All" | "Y" | "N">("Y");
  const [jobFinishFilter, setJobFinishFilter] = useState("All");
  const [contractFromDate, setContractFromDate] = useState("");
  const [contractToDate, setContractToDate] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(COMPANY_PERFORMANCE_PAGE_SIZE);
  const [detailOpen, setDetailOpen] = useState(false);
  const [draft, setDraft] = useState<CompanyPerformanceRecord>(() => emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<CompanyPerformanceRecord | null>(null);
  const [notice, setNotice] = useState<{ message: string; severity: "error" | "info" | "success" } | null>(null);

  const businessTypeReferences = useCommonCodeLevel2Options("CA");
  const jobFinishReferences = useCommonCodeLevel2Options("VA");
  const clientKindReferences = useCommonCodeLevel3Options("PQ", "EA");

  const businessTypeOptions = useMemo<CompanyPerformanceCodeOption[]>(
    () => businessTypeReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [businessTypeReferences.options],
  );
  const jobFinishOptions = useMemo<CompanyPerformanceCodeOption[]>(
    () => jobFinishReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [jobFinishReferences.options],
  );
  const clientKindOptions = useMemo<CompanyPerformanceCodeOption[]>(
    () => clientKindReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [clientKindReferences.options],
  );
  const businessTypeLabelByValue = useMemo(() => toLabelMap(businessTypeOptions), [businessTypeOptions]);
  const jobFinishLabelByValue = useMemo(() => toLabelMap(jobFinishOptions), [jobFinishOptions]);
  const jobFinishFilterOptions = useMemo<CompanyPerformanceCodeOption[]>(
    () => [{ label: "전체", value: "All" }, ...jobFinishOptions],
    [jobFinishOptions],
  );

  const searchParams = useMemo<CompanyPerformanceSearchParams>(
    () => ({
      keyword: appliedKeyword,
      businessType,
      clientKind,
      jobOwnYn: jobOwnFilter,
      jobFinishYn: jobFinishFilter,
      contractFromDate,
      contractToDate,
      page,
      size: pageSize,
    }),
    [appliedKeyword, businessType, clientKind, contractFromDate, contractToDate, jobFinishFilter, jobOwnFilter, page, pageSize],
  );

  const companyPerformancesQuery = useQuery({
    queryKey: ["company-performances", searchParams],
    queryFn: () => listCompanyPerformances(searchParams),
    enabled: tabQueryEnabled,
    placeholderData: keepPreviousData,
  });

  const companyPerformancesPage = companyPerformancesQuery.data ?? emptyPage(page, pageSize);
  const rows = companyPerformancesPage.content;

  const columns = useMemo<GridColDef<CompanyPerformanceRecord>[]>(
    () => [
      {
        field: "jobFinishYn",
        headerName: "진행상태",
        width: 110,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const value = text(params.row.jobFinishYn).trim();
          if (value === "Y") {
            return (
              <Chip
                label="진행"
                size="small"
                sx={{
                  backgroundColor: (theme) => theme.palette.info.light,
                  color: (theme) => theme.palette.info.contrastText,
                  fontWeight: 700,
                }}
                variant="filled"
              />
            );
          }
          if (value === "N") {
            return <Chip color="warning" label="중지" size="small" variant="filled" />;
          }
          if (value === "E") {
            return <Chip color="success" label="준공" size="small" variant="filled" />;
          }
          return <Chip color="default" label={(jobFinishLabelByValue[value] ?? value) || "-"} size="small" variant="outlined" />;
        },
      },
      {
        field: "jobOwnYn",
        headerName: "자사/타사",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Chip
            color={params.row.jobOwnYn ? "success" : "default"}
            label={params.row.jobOwnYn ? "자사" : "타사"}
            size="small"
            variant={params.row.jobOwnYn ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "jobName",
        headerName: "용역명",
        minWidth: 260,
        flex: 1.4,
        renderCell: (params) => {
          const summary = text(params.row.summary).trim();
          return (
            <Tooltip
              arrow
              enterDelay={400}
              placement="top-start"
              title={
                summary ? (
                  <Box sx={{ fontSize: 13, lineHeight: 1.6, maxWidth: 560, whiteSpace: "pre-line" }}>
                    {summary}
                  </Box>
                ) : (
                  ""
                )
              }
            >
              <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                {display(params.row.jobName)}
              </Box>
            </Tooltip>
          );
        },
      },
      { field: "orderClient", headerName: "발주처", minWidth: 180, flex: 1, valueGetter: (_value, row) => display(row.orderClient) },
      { field: "businessType", headerName: "사업유형", width: 130, valueGetter: (_value, row) => codeLabel(businessTypeLabelByValue, row.businessType) },
      { field: "contractFromDate", headerName: "계약시작일", width: 120, valueGetter: (_value, row) => formatDateDisplay(row.contractFromDate) },
      { field: "contractToDate", headerName: "계약종료일", width: 120, valueGetter: (_value, row) => formatDateDisplay(row.contractToDate) },
      { field: "divisionRate", headerName: "지분율(%)", width: 90, align: "right", headerAlign: "right", valueGetter: (_value, row) => (row.divisionRate === null || row.divisionRate === undefined ? "-" : String(row.divisionRate)) },
      { field: "contractAmt", headerName: "계약금액", width: 140, align: "right", headerAlign: "right", valueFormatter: (value) => formatMoney(typeof value === "number" ? value : Number(value ?? 0)) },
      { field: "ownAmt", headerName: "자사금액", width: 140, align: "right", headerAlign: "right", valueFormatter: (value) => formatMoney(typeof value === "number" ? value : Number(value ?? 0)) },
    ],
    [businessTypeLabelByValue, jobFinishLabelByValue],
  );

  const paginationModel = useMemo<GridPaginationModel>(() => ({ page, pageSize }), [page, pageSize]);

  const detailMutation = useMutation({
    mutationFn: getCompanyPerformance,
    onSuccess: (detail) => {
      setDraft(detail);
      setDetailOpen(true);
    },
    onError: (error) => {
      setNotice({ message: error instanceof Error ? error.message : "회사 실적 상세 조회에 실패했습니다.", severity: "error" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (requestBody: CompanyPerformanceUpsertRequest) => (draft.seq ? updateCompanyPerformance(draft.seq, requestBody) : createCompanyPerformance(requestBody)),
    onSuccess: (saved) => {
      setDraft(saved);
      setDetailOpen(true);
      void queryClient.invalidateQueries({ queryKey: ["company-performances"] });
      setNotice({ message: "회사 실적 정보를 저장했습니다.", severity: "success" });
    },
    onError: (error) => {
      setNotice({ message: error instanceof Error ? error.message : "회사 실적 저장에 실패했습니다.", severity: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyPerformance,
    onSuccess: () => {
      setDeleteTarget(null);
      setDetailOpen(false);
      setDraft(emptyDraft());
      void queryClient.invalidateQueries({ queryKey: ["company-performances"] });
      setNotice({ message: "회사 실적 정보를 삭제했습니다.", severity: "success" });
    },
    onError: (error) => {
      setNotice({ message: error instanceof Error ? error.message : "회사 실적 삭제에 실패했습니다.", severity: "error" });
    },
  });

  const handleSearch = (nextKeyword: string) => {
    const normalizedKeyword = nextKeyword.trim();
    const shouldRefetch = page === 0 && appliedKeyword === normalizedKeyword;

    setKeyword(nextKeyword);
    setAppliedKeyword(normalizedKeyword);
    setPage(0);

    if (shouldRefetch) {
      void companyPerformancesQuery.refetch();
    }
  };

  const handleReset = () => {
    const shouldRefetch =
      keyword === "" &&
      appliedKeyword === "" &&
      businessType === "" &&
      clientKind === "" &&
      jobOwnFilter === "Y" &&
      jobFinishFilter === "All" &&
      contractFromDate === "" &&
      contractToDate === "" &&
      page === 0 &&
      pageSize === COMPANY_PERFORMANCE_PAGE_SIZE;

    setKeyword("");
    setAppliedKeyword("");
    setBusinessType("");
    setClientKind("");
    setJobOwnFilter("Y");
    setJobFinishFilter("All");
    setContractFromDate("");
    setContractToDate("");
    setPage(0);
    setPageSize(COMPANY_PERFORMANCE_PAGE_SIZE);

    if (shouldRefetch) {
      void companyPerformancesQuery.refetch();
    }
  };

  const handleNew = () => {
    if (!canCreate) {
      setNotice({ message: "등록 권한이 없습니다.", severity: "error" });
      return;
    }
    setDraft(emptyDraft());
    setDetailOpen(true);
  };

  const handleSave = () => {
    if (draft.seq && !canUpdate) {
      setNotice({ message: "수정 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!draft.seq && !canCreate) {
      setNotice({ message: "등록 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!text(draft.jobName).trim()) {
      setNotice({ message: "용역명은 필수입니다.", severity: "error" });
      return;
    }
    saveMutation.mutate(toRequest(draft));
  };

  return (
    <Box>
      <PageHeader title="회사 실적 관리" />

      {notice ? (
        <Box sx={{ position: "sticky", top: 16, zIndex: 2, mb: 2 }}>
          <Alert severity={notice.severity} variant="filled">
            {notice.message}
          </Alert>
        </Box>
      ) : null}

      <SearchPanel
        keyword={keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="용역명, 발주처, 개요, 비고"
        onKeywordChange={setKeyword}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
        actions={
          <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
            신규
          </Button>
        }
      >
        <TextField label="사업 유형" onChange={(event) => setBusinessType(event.target.value)} select size="small" sx={{ ...standardFieldSx, minWidth: 160 }} value={businessType}>
          <MenuItem value="">전체</MenuItem>
          {businessTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.value} - {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="발주처 구분" onChange={(event) => setClientKind(event.target.value)} select size="small" sx={{ ...standardFieldSx, minWidth: 180 }} value={clientKind}>
          <MenuItem value="">전체</MenuItem>
          {clientKindOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.value} - {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="자사 여부" onChange={(event) => setJobOwnFilter(event.target.value as "All" | "Y" | "N")} select size="small" sx={{ ...standardFieldSx, minWidth: 120 }} value={jobOwnFilter}>
          {yesNoOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="준공 상태" onChange={(event) => setJobFinishFilter(event.target.value)} select size="small" sx={{ ...standardFieldSx, minWidth: 120 }} value={jobFinishFilter}>
          {jobFinishFilterOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <DateRangeField
          endValue={contractToDate}
          label="계약 기간"
          onEndChange={setContractToDate}
          onStartChange={setContractFromDate}
          startValue={contractFromDate}
          sx={{ minWidth: 340 }}
        />
      </SearchPanel>

      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          minWidth: 0,
          p: 2,
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", gap: 2, justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            회사 실적 목록
          </Typography>
          <Chip label={`총 ${companyPerformancesPage.totalElements}건`} size="small" variant="outlined" />
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <EnterpriseDataGrid<CompanyPerformanceRecord>
          columns={columns}
          getRowId={(row) => row.seq}
          hideFooterSelectedRowCount
          loading={companyPerformancesQuery.isLoading || companyPerformancesQuery.isFetching}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          onRowDoubleClick={(params) => {
            setDraft(params.row);
            detailMutation.mutate(params.row.seq);
          }}
          onRowClick={(params) => setDraft(params.row)}
          pageSizeOptions={[25, 50, COMPANY_PERFORMANCE_PAGE_SIZE, 200]}
          paginationMode="server"
          paginationModel={paginationModel}
          rowCount={companyPerformancesPage.totalElements}
          rowHeight={30}
          rows={rows}
          showPageNumbers
          showToolbar={false}
          wrapperMinHeight="clamp(520px, calc(100vh - 360px), 760px)"
          sx={{
            border: 0,
            height: "100%",
            "& .MuiDataGrid-row:hover": { cursor: "pointer" },
          }}
        />
      </Box>

      {detailOpen ? <CompanyPerformanceDetailDialog
        businessTypeOptions={businessTypeOptions}
        clientKindOptions={clientKindOptions}
        jobFinishOptions={jobFinishOptions}
        deleteDisabled={!draft.seq || !canDelete || deleteMutation.isPending}
        onClose={() => setDetailOpen(false)}
        onDelete={() => {
          if (!canDelete) {
            setNotice({ message: "삭제 권한이 없습니다.", severity: "error" });
            return;
          }
          setDeleteTarget(draft);
        }}
        onFieldChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))}
        onSave={handleSave}
        open={detailOpen}
        record={draft}
        saveDisabled={saveMutation.isPending || detailMutation.isPending || (draft.seq ? !canUpdate : !canCreate)}
      /> : null}

      <Dialog onClose={() => setDeleteTarget(null)} open={Boolean(deleteTarget)}>
        <DialogTitle>회사 실적 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{deleteTarget ? `${deleteTarget.jobName} 실적을 삭제하시겠습니까?` : ""}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined">
            취소
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (deleteTarget?.seq) {
                deleteMutation.mutate(deleteTarget.seq);
              }
            }}
            variant="contained"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
