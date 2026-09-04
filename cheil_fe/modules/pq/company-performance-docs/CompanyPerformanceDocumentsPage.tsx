"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { RelatedProjectHistoryConditionsPanel } from "@/components/common/RelatedProjectHistoryConditionsPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useCommonCodeLevel2Options } from "@/modules/common/reference/useReferenceOptions";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import {
  COMPANY_PERFORMANCE_PAGE_SIZE,
  addCompanyPerformanceDocumentTargets,
  addCompanyPerformanceDocumentTargetsByConditions,
  getCompanyPerformance,
  listCompanyPerformances,
  listCompanyPerformanceDocumentTargets,
  type CompanyPerformanceRecord,
  type CompanyPerformanceSearchParams,
} from "@/modules/pq/company-performance/api";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";

const BidNoticeSelectDialog = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeSelectDialog").then((module) => module.BidNoticeSelectDialog),
  { ssr: false },
);
const BidNoticeDetailPopup = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeDetailPopup").then((module) => module.BidNoticeDetailPopup),
  { ssr: false },
);
const CompanyPerformanceDetailDialog = dynamic(
  () => import("@/modules/pq/company-performance/CompanyPerformanceDetailDialog").then((module) => module.CompanyPerformanceDetailDialog),
  { ssr: false },
);
const CompanyHwpxTemplateGenerationPanel = dynamic(
  () => import("@/modules/pq/company-performance-docs/CompanyHwpxTemplateGenerationPanel").then((module) => module.CompanyHwpxTemplateGenerationPanel),
  { ssr: false },
);

const text = (value: string | null | undefined) => value ?? "";
const digits = (value: string | null | undefined) => text(value).replace(/\D/g, "");
const display = (value: string | number | null | undefined) => (value === null || value === undefined || value === "" ? "-" : String(value));
const displayMoney = (value: number | null | undefined) => value === null || value === undefined ? "-" : new Intl.NumberFormat("ko-KR").format(value);
const displayDate = (value: string | null | undefined) => {
  const normalized = digits(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6)}` : display(value);
};
const displayRate = (value: number | null | undefined) => value === null || value === undefined ? "-" : String(value);
const displayGeneralManagement = (value: boolean | null | undefined) => value ? "Y" : "N";

// 조건 적용은 화면 페이지와 별개로 전체 대상의 식별자만 확인하므로 한 번의 서버 조회로 처리한다.
export function CompanyPerformanceDocumentsPage() {
  const { canRead } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const serviceTypeReferences = useCommonCodeLevel2Options("ST");
  const columns = useMemo<GridColDef<CompanyPerformanceRecord>[]>(
    () => [
      { field: "jobName", headerName: "사업명", minWidth: 260, flex: 1.4, valueGetter: (_value, row) => display(row.jobName) },
      { field: "orderClient", headerName: "발주처", minWidth: 160, flex: 1, valueGetter: (_value, row) => display(row.orderClient) },
      { field: "contractFromDate", headerName: "계약시작일", width: 120, valueGetter: (_value, row) => displayDate(row.contractFromDate) },
      { field: "contractToDate", headerName: "계약종료일", width: 120, valueGetter: (_value, row) => displayDate(row.contractToDate) },
      { field: "contractAmt", headerName: "총계약금액", width: 130, align: "right", headerAlign: "right", valueGetter: (_value, row) => displayMoney(row.contractAmt) },
      { field: "ownAmt", headerName: "당사금액", width: 130, align: "right", headerAlign: "right", valueGetter: (_value, row) => displayMoney(row.ownAmt) },
      { field: "jobRatio", headerName: "공동도급내역", minWidth: 160, flex: 1, valueGetter: (_value, row) => display(row.jobRatio) },
      { field: "divisionRate", headerName: "지분율", width: 90, align: "right", headerAlign: "right", valueGetter: (_value, row) => displayRate(row.divisionRate) },
      { field: "jobType", headerName: "용역구분", width: 120, valueGetter: (_value, row) => serviceTypeReferences.labelByValue[row.jobType ?? ""] ?? display(row.jobType) },
      { field: "generalManagementYn", headerName: "총괄", width: 80, align: "center", headerAlign: "center", valueGetter: (_value, row) => displayGeneralManagement(row.generalManagementYn) },
    ],
    [serviceTypeReferences.labelByValue],
  );
  const [bidNotice, setBidNotice] = useState<BidNoticeApiRecord | null>(null);
  const [bidNoticeDialogOpen, setBidNoticeDialogOpen] = useState(false);
  const [bidNoticeDetailOpen, setBidNoticeDetailOpen] = useState(false);
  const [conditions, setConditions] = useState<RelatedProjectHistoryCondition[]>([]);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: COMPANY_PERFORMANCE_PAGE_SIZE });
  const [selectedCompanyPerformanceIds, setSelectedCompanyPerformanceIds] = useState<number[]>([]);
  const [detailRecord, setDetailRecord] = useState<CompanyPerformanceRecord | null>(null);
  const searchParams = useMemo<CompanyPerformanceSearchParams>(() => ({
    keyword: appliedKeyword,
    businessType: "",
    clientKind: "",
    jobOwnYn: "All",
    jobFinishYn: "All",
    contractFromDate: "",
    contractToDate: "",
    excludeDocumentTargetBidSeq: bidNotice?.bidSeq,
    page: paginationModel.page,
    size: paginationModel.pageSize,
  }), [appliedKeyword, bidNotice?.bidSeq, paginationModel]);
  const companyPerformancesQuery = useQuery({
    queryKey: ["company-performance-documents", searchParams],
    queryFn: () => listCompanyPerformances(searchParams),
    enabled: tabQueryEnabled && Boolean(bidNotice?.bidSeq),
    placeholderData: keepPreviousData,
  });
  const documentTargetsQuery = useQuery({
    queryKey: ["company-performance-document-targets", bidNotice?.bidSeq],
    queryFn: () => listCompanyPerformanceDocumentTargets(bidNotice!.bidSeq!),
    enabled: tabQueryEnabled && Boolean(bidNotice?.bidSeq),
  });
  const detailMutation = useMutation({
    mutationFn: getCompanyPerformance,
    onSuccess: (record) => setDetailRecord(record),
  });
  const rows = useMemo(() => companyPerformancesQuery.data?.content ?? [], [companyPerformancesQuery.data?.content]);
  const matchedRows = useMemo(() => {
    return (documentTargetsQuery.data ?? [])
      .map((target) => target.companyPerformance)
      .filter((row): row is CompanyPerformanceRecord => row !== null);
  }, [documentTargetsQuery.data]);
  const addTargetMutation = useMutation({
    mutationFn: (companyPerformanceSeqs: number[]) => addCompanyPerformanceDocumentTargets({ bidSeq: bidNotice!.bidSeq!, companyPerformanceSeqs }),
    onSuccess: async () => {
      setSelectedCompanyPerformanceIds([]);
      await companyPerformancesQuery.refetch();
      await documentTargetsQuery.refetch();
    },
  });
  const handleAdd = () => {
    if (!bidNotice?.bidSeq || selectedCompanyPerformanceIds.length === 0) return;
    addTargetMutation.mutate(selectedCompanyPerformanceIds);
  };
  const handleConditionsApply = async (nextConditions: RelatedProjectHistoryCondition[]) => {
    setConditions(nextConditions);
    if (!bidNotice?.bidSeq || nextConditions.length === 0) return;

    await addCompanyPerformanceDocumentTargetsByConditions({ bidSeq: bidNotice.bidSeq, conditions: nextConditions });
    await Promise.all([companyPerformancesQuery.refetch(), documentTargetsQuery.refetch()]);
  };
  const handleLoad = () => {
    if (!bidNotice) return;
    const nextKeyword = keyword.trim();
    const shouldRefetch = nextKeyword === appliedKeyword;
    setPaginationModel((current) => ({ ...current, page: 0 }));
    setAppliedKeyword(nextKeyword);
    if (shouldRefetch) void companyPerformancesQuery.refetch();
  };

  if (!canRead) {
    return <><PageHeader title="회사 실적문서 생성" description="회사실적 문서 생성 대상과 조건을 관리합니다." /><Alert severity="warning">조회 권한이 없습니다.</Alert></>;
  }
  return (
    <Box>
      <PageHeader title="회사 실적문서 생성" description="공고를 선택하고 회사실적 조건을 적용해 문서 생성 대상을 구성합니다." />
      <Stack spacing={2}>
        <Card variant="outlined"><CardContent><Stack spacing={1.5}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack direction="row" spacing={1}>
                <TextField fullWidth label="공고명" placeholder="공고문을 선택하세요" size="small" value={bidNotice?.projectName ?? ""} slotProps={{ input: { readOnly: true } }} />
                <Button disabled={!canRead} onClick={() => setBidNoticeDialogOpen(true)} startIcon={<SearchOutlinedIcon />} sx={{ flex: "0 0 auto", minWidth: 88, whiteSpace: "nowrap" }} type="button" variant="outlined">선택</Button>
                <Button disabled={!bidNotice || !canRead} onClick={() => setBidNoticeDetailOpen(true)} startIcon={<VisibilityOutlinedIcon />} sx={{ flex: "0 0 auto", minWidth: 112, whiteSpace: "nowrap" }} type="button" variant="outlined">상세보기</Button>
              </Stack>
            </Grid>
            {bidNotice ? <>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}><TextField fullWidth label="발주처" size="small" value={text(bidNotice.orderClientName ?? bidNotice.orderClient)} slotProps={{ input: { readOnly: true } }} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 1.5 }}><TextField fullWidth label="공고일" size="small" value={text(bidNotice.announceDate).slice(0, 10)} slotProps={{ input: { readOnly: true } }} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 1.5 }}><TextField fullWidth label="입찰등록 마감" size="small" value={text(bidNotice.bidClosingDate).slice(0, 10)} slotProps={{ input: { readOnly: true } }} /></Grid>
            </> : null}
            <Grid size={{ xs: 12, md: 8 }}><TextField fullWidth label="회사실적 검색" onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleLoad(); } }} placeholder="용역명, 발주처 검색" size="small" value={keyword} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Box sx={{ display: "flex", gap: 1, justifyContent: { xs: "flex-start", md: "flex-end" }, flexWrap: "wrap" }}><Button disabled={!canRead || !bidNotice || companyPerformancesQuery.isFetching} onClick={handleLoad} startIcon={<SearchOutlinedIcon />} variant="contained">조회</Button><Button onClick={() => { setKeyword(""); setAppliedKeyword(""); }} startIcon={<RefreshOutlinedIcon />} variant="outlined">초기화</Button></Box></Grid>
          </Grid>
        </Stack></CardContent></Card>
        <Card variant="outlined"><CardContent>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontWeight: 800 }} variant="subtitle1">회사실적 목록</Typography>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Chip label={`${rows.length}건`} size="small" variant="outlined" />
              <Button disabled={selectedCompanyPerformanceIds.length === 0 || addTargetMutation.isPending} onClick={handleAdd} size="small" startIcon={<AddOutlinedIcon />} variant="contained">추가</Button>
            </Box>
          </Box>
          <EnterpriseDataGrid<CompanyPerformanceRecord>
            checkboxSelection
            columns={columns}
            disableRowSelectionOnClick
            getRowId={(row) => row.seq}
            loading={companyPerformancesQuery.isLoading || companyPerformancesQuery.isFetching}
            onPaginationModelChange={setPaginationModel}
            onRowSelectionModelChange={(model: GridRowSelectionModel) => {
              const selectedIds = model.type === "exclude"
                ? rows.filter((row) => !model.ids.has(row.seq)).map((row) => row.seq)
                : Array.from(model.ids, Number);
              setSelectedCompanyPerformanceIds(selectedIds);
            }}
            onRowDoubleClick={(params) => detailMutation.mutate(params.row.seq)}
            paginationMode="server"
            paginationModel={paginationModel}
            pageSizeOptions={[25, 50, 100]}
            rowCount={companyPerformancesQuery.data?.totalElements ?? 0}
            rowHeight={30}
            rows={rows}
            rowSelectionModel={{ ids: new Set(selectedCompanyPerformanceIds), type: "include" }}
            showPageNumbers
            showToolbar={false}
            wrapperMinHeight={520}
            sx={{ border: 0, height: 520 }}
          />
        </CardContent></Card>
        <Card variant="outlined"><CardContent>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1, gap: 1, flexWrap: "wrap" }}><Box><Typography sx={{ fontWeight: 800 }} variant="subtitle1">조건 적용 회사실적</Typography><Typography color="text.secondary" variant="body2">조건에 맞는 실적은 설정 즉시 문서 생성 대상으로 저장됩니다.</Typography></Box><Box sx={{ alignItems: "center", display: "flex", gap: 1, flexWrap: "wrap" }}><RelatedProjectHistoryConditionsPanel bidSeq={bidNotice?.bidSeq} disabled={!bidNotice || addTargetMutation.isPending} onApply={handleConditionsApply} value={conditions} /><Chip color={conditions.length > 0 ? "primary" : "default"} label={`${matchedRows.length}건`} size="small" variant="outlined" /></Box></Box>
          <EnterpriseDataGrid<CompanyPerformanceRecord>
            checkboxSelection
            columns={columns}
            disableRowSelectionOnClick
            getRowId={(row) => row.seq}
            loading={companyPerformancesQuery.isLoading || companyPerformancesQuery.isFetching}
            onRowDoubleClick={(params) => detailMutation.mutate(params.row.seq)}
            rowHeight={30}
            rows={matchedRows}
            showPageNumbers
            showToolbar={false}
            wrapperMinHeight={520}
            sx={{ border: 0, height: 520 }}
          />
        </CardContent></Card>
        <CompanyHwpxTemplateGenerationPanel bidNotice={bidNotice} open={Boolean(bidNotice)} targets={documentTargetsQuery.data ?? []} />
      </Stack>
      {bidNoticeDialogOpen ? <BidNoticeSelectDialog open onClose={() => setBidNoticeDialogOpen(false)} onSelect={(record) => { setBidNotice(record); setConditions([]); setSelectedCompanyPerformanceIds([]); setPaginationModel((current) => ({ ...current, page: 0 })); setBidNoticeDialogOpen(false); }} stateCacheKey="company-performance-documents:bid-notice-select" /> : null}
      {bidNoticeDetailOpen ? <BidNoticeDetailPopup bidSeq={bidNotice?.bidSeq ?? null} onClose={() => setBidNoticeDetailOpen(false)} open readOnly /> : null}
      {detailRecord ? <CompanyPerformanceDetailDialog
        businessTypeOptions={[]}
        clientKindOptions={[]}
        deleteDisabled
        jobFinishOptions={[]}
        onClose={() => setDetailRecord(null)}
        onDelete={() => undefined}
        onFieldChange={() => undefined}
        onSave={() => undefined}
        open
        readOnly
        record={detailRecord}
        saveDisabled
      /> : null}
    </Box>
  );
}
