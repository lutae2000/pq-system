"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import { useGridApiRef, type GridColDef, type GridPaginationModel, type GridRowParams } from "@mui/x-data-grid";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { CheckboxSelectInput } from "@/components/common/CheckboxSelectInput";
import { AutoCompleteField } from "@/components/common/AutoCompleteField";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmActionDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { ResizeHandle } from "@/components/common/ResizeHandle";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { compactFieldSx } from "@/components/common/FormControls";
import { PeriodRangeField } from "@/components/common/PeriodRangeField";
import { dateOnly, formatMoney } from "@/modules/common/formatters";
import { openBidNoticePrintWindow } from "@/modules/pq/bid-notice/bidNoticePrint";
import {
  formatBidSuccessForXlsx,
  formatDepartmentForXlsx,
  formatOrderClientForXlsx,
  formatRegistrantForXlsx,
} from "@/modules/pq/bid-notice/bidNoticeXlsxFormatters";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useCommonCodeLevel2Options, useDepartmentOptions, useUserOptions } from "@/modules/common/reference/useReferenceOptions";
import { useBidNoticeCommands } from "@/modules/pq/bid-notice/application/useBidNoticeCommands";
import { useBidNoticeList, useImportedBidNoticeAttachments } from "@/modules/pq/bid-notice/application/useBidNoticeQueries";
import { toBidNoticeRecord, toSearchParams } from "@/modules/pq/bid-notice/application/mapper";
import { emptyDraft, filterBidNoticeRecords } from "@/modules/pq/bid-notice/domain/rules";
import type {
  BidNoticeFilters,
  BidNoticeRecord,
  BidNoticePeriodType,
} from "@/modules/pq/bid-notice/bidNotice.types";

const BidNoticeDetailDialog = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeDetailDialog").then((module) => module.BidNoticeDetailDialog),
  { ssr: false },
);

const periodOptions: { label: string; value: BidNoticePeriodType }[] = [
  { label: "공고기간", value: "NOTICE" },
  { label: "입찰기간", value: "BID" },
  { label: "PQ제출기간", value: "PQ" },
];
const bidSuccessOptions = [
  { label: "낙찰", value: "Y" },
  { label: "미낙찰", value: "N" },
] as const;

const buildDefaultFilters = (): BidNoticeFilters => {
  return {
    bidMethod: "",
    department: "",
    superDecideEmpno: "",
    keyword: "",
    businessType: "",
    periodType: "NOTICE",
    periodStartDate: dayjs().subtract(1, "year").format("YYYYMMDD"),
    periodEndDate: dayjs().add(1, "month").format("YYYYMMDD"),
    bidSuccessYn: "",
    participationStatuses: [],
  };
};

const handleSearchEnter =
  (onSearch: () => void) =>
  (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearch();
    }
  };

const BID_NOTICE_GRID_CARD_DEFAULT_HEIGHT = 560;
const BID_NOTICE_GRID_CARD_MIN_HEIGHT = 420;
const BID_NOTICE_GRID_CARD_MAX_HEIGHT = 860;
const BID_NOTICE_GRID_CARD_OFFSET = 32;

type BidNoticeGridColDef = GridColDef<BidNoticeRecord> & {
  excludeFromXlsxExport?: boolean;
};

export function BidNoticePage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const gridApiRef = useGridApiRef();
  const [draft, setDraft] = useState<BidNoticeRecord>(emptyDraft());
  const [filters, setFilters] = useState<BidNoticeFilters>(() => buildDefaultFilters());
  const [searchDraft, setSearchDraft] = useState<BidNoticeFilters>(() => buildDefaultFilters());
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const { showError, showSuccess } = useAppSnackbar();
  const [searchRevision, setSearchRevision] = useState(0);
  const [bidNoticeGridCardHeight, setBidNoticeGridCardHeight] = useState(BID_NOTICE_GRID_CARD_DEFAULT_HEIGHT);
  const hasG2bNotice = Boolean(draft.g2bBidNtceNo.trim() && draft.g2bBidNtceOrd.trim());
  const sourceAttachmentsQuery = useImportedBidNoticeAttachments(draft.seqNo, open && hasG2bNotice);
  const sourceCandidate = hasG2bNotice ? sourceAttachmentsQuery.data : null;
  const searchParams = useMemo(() => toSearchParams(filters, paginationModel), [filters, paginationModel]);
  const bidNoticesQuery = useBidNoticeList(searchParams, searchRevision, tabQueryEnabled);
  const bidMethodOptions = useCommonCodeLevel2Options("ZA");
  const orderMethodOptions = useCommonCodeLevel2Options("FA", { useYn: "Y" }, undefined, "level2Code");
  const bidTypeOptions = useCommonCodeLevel2Options("MB");
  const businessTypeOptions = useCommonCodeLevel2Options("CA");
  const businessTypeSearchOptions = useMemo(
    () => businessTypeOptions.options.map((option) => ({ label: option.label, value: option.label })),
    [businessTypeOptions.options],
  );
  const finalParticipationOptions = useCommonCodeLevel2Options("YA");
  const departmentOptions = useDepartmentOptions({ useYn: true });
  const registrantOptions = useUserOptions({ useYn: "Y" });
  const userNameByEmployeeNo = useMemo(
    () => Object.fromEntries(registrantOptions.items.map((user) => [user.employeeNo, user.userName || user.employeeNo])),
    [registrantOptions.items],
  );

  const records = useMemo(
    () => (bidNoticesQuery.data?.content ?? []).map(toBidNoticeRecord),
    [bidNoticesQuery.data?.content],
  );

  const printLabelMaps = useMemo(
    () => ({
      bidMethod: bidMethodOptions.labelByValue,
      bidType: bidTypeOptions.labelByValue,
      businessType: businessTypeOptions.labelByValue,
      department: departmentOptions.labelByValue,
      orderMethod: orderMethodOptions.labelByValue,
      registrant: userNameByEmployeeNo,
    }),
    [
      bidMethodOptions.labelByValue,
      bidTypeOptions.labelByValue,
      businessTypeOptions.labelByValue,
      departmentOptions.labelByValue,
      orderMethodOptions.labelByValue,
      userNameByEmployeeNo,
    ],
  );

  const filteredRecords = useMemo(() => filterBidNoticeRecords(records, filters), [filters, records]);

  const { deleteMutation, loadDetail, saveMutation } = useBidNoticeCommands({
    canCreate,
    canDelete,
    canRead,
    canUpdate,
    participationOptions: finalParticipationOptions.options,
    onSaved: (saved) => {
      setDraft(saved);
      showSuccess("저장되었습니다.");
      setOpen(false);
    },
    onDeleted: () => {
      showSuccess("삭제되었습니다.");
      setDeleteConfirmOpen(false);
      setOpen(false);
    },
    onError: (error, fallback) => showError(error instanceof Error ? error.message : fallback),
  });

  const openEditor = async (record: BidNoticeRecord) => {
    if (!canRead) {
      showError("조회 권한이 없습니다.");
      return;
    }

    if (!record.seqNo) {
      setDraft({ ...record });
      setOpen(true);
      return;
    }

    try {
      setDraft(await loadDetail(record.seqNo));
      setOpen(true);
    } catch (error) {
      showError(error instanceof Error ? error.message : "공고문 상세를 불러오지 못했습니다.");
    }
  };

  const openNew = () => {
    if (!canCreate) {
      showError("등록 권한이 없습니다.");
      return;
    }
    setDraft(emptyDraft());
    setOpen(true);
  };

  const closeDialog = () => {
    setDeleteConfirmOpen(false);
    setOpen(false);
  };

  const updateDraft = <K extends keyof BidNoticeRecord>(name: K, value: BidNoticeRecord[K]) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const saveRecord = () => {
    saveMutation.mutate(draft);
  };

  const requestDeleteRecord = () => {
    if (!canDelete) {
      showError("삭제 권한이 없습니다.");
      return;
    }
    if (!draft.seqNo) {
      setOpen(false);
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRecord = () => {
    if (draft.seqNo) {
      deleteMutation.mutate(draft.seqNo);
    }
  };

  const handleSearch = () => {
    if (!canRead) {
      showError("조회 권한이 없습니다.");
      return;
    }
    setFilters({ ...searchDraft });
    setPaginationModel((current) => ({ ...current, page: 0 }));
    setSearchRevision((current) => current + 1);
  };

  const columns = useMemo<BidNoticeGridColDef[]>(
    () => [
      { field: "bidNo", headerName: "관리번호", width: 110, align: "center", headerAlign: "center" },
      {
        field: "participationStatus",
        headerName: "최종 참여",
        width: 80,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row, value }) => {
          const label = String(value ?? "-");
          const isParticipating = row.finalParticipationStatus === "Y" || label === "참여" || label === "Y";
          return (
            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <Chip
                color={isParticipating ? "success" : "default"}
                label={label}
                size="small"
                variant={isParticipating ? "filled" : "outlined"}
              />
            </Box>
          );
        },
      },
      {
        field: "bidSuccessYn",
        headerName: "낙찰여부",
        width: 80,
        align: "center",
        headerAlign: "center",
        excludeFromXlsxExport: true,
        valueFormatter: formatBidSuccessForXlsx,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <Chip
              color={row.bidSuccessYn === "Y" ? "primary" : "default"}
              label={row.bidSuccessYn === "Y" ? "낙찰" : "미낙찰"}
              sx={row.bidSuccessYn === "Y" ? { fontWeight: 400 } : undefined}
              size="small"
              variant={row.bidSuccessYn === "Y" ? "filled" : "outlined"}
            />
          </Box>
        ),
      },
      {
        field: "department",
        headerName: "부서",
        width: 90,
        align: "center",
        headerAlign: "center",
        valueFormatter: formatDepartmentForXlsx,
        renderCell: ({ row, value }) => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            {row.departmentName || String(value ?? "")}
          </Box>
        ),
      },
      { field: "businessTypeLabel", headerName: "구분", width: 60, align: "center", headerAlign: "center" },
      {
        field: "client",
        headerName: "발주처",
        width: 120,
        valueFormatter: formatOrderClientForXlsx,
        renderCell: ({ row, value }) => row.orderClientName || String(value ?? ""),
      },
      { field: "projectName", headerName: "용역명", flex: 1, minWidth: 240 },
      { field: "noticeDate", headerName: "공고일", width: 110 },
      {
        field: "pqSubmissionDate",
        headerName: "PQ제출일",
        width: 110,
        renderCell: ({ row }) => dateOnly(row.pqSubmissionDate),
      },
      { field: "bidClosingDate", headerName: "입찰등록 마감", width: 145 },
      { field: "bidSubmissionDate", headerName: "투찰마감", width: 145 },
      { field: "bidDate", headerName: "입찰일", width: 145 },
      {
        field: "designAmt",
        headerName: "설계금액",
        width: 140,
        renderCell: ({ row }) => formatMoney(Number(row.designAmt ?? row.estimateAmount ?? 0)),
      },
      {
        field: "pqDecideEmpno",
        headerName: "작성자",
        width: 90,
        align: "center",
        headerAlign: "center",
        valueFormatter: formatRegistrantForXlsx(userNameByEmployeeNo),
        renderCell: ({ value }) => userNameByEmployeeNo[String(value ?? "")] ?? String(value ?? ""),
      },
    ],
    [userNameByEmployeeNo],
  );

  const bidNoticeGridHeight = Math.max(320, bidNoticeGridCardHeight - BID_NOTICE_GRID_CARD_OFFSET);

  const handleBidNoticeGridResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = bidNoticeGridCardHeight;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextHeight = Math.min(
          BID_NOTICE_GRID_CARD_MAX_HEIGHT,
          Math.max(BID_NOTICE_GRID_CARD_MIN_HEIGHT, startHeight + moveEvent.clientY - startY),
        );
        setBidNoticeGridCardHeight(nextHeight);
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [bidNoticeGridCardHeight],
  );

  const handleBidNoticeGridResizeClick = useCallback(() => {
    setBidNoticeGridCardHeight((currentHeight) =>
      currentHeight >= BID_NOTICE_GRID_CARD_MAX_HEIGHT ? BID_NOTICE_GRID_CARD_DEFAULT_HEIGHT : BID_NOTICE_GRID_CARD_MAX_HEIGHT,
    );
  }, []);

  const handleExportPrint = () => {
    const gridApi = gridApiRef.current;
    const sortedRecords = gridApi
      ? gridApi
          .getSortedRowIds()
          .map((rowId) => gridApi.getRow<BidNoticeRecord>(rowId))
          .filter((row): row is BidNoticeRecord => Boolean(row))
      : filteredRecords;

    openBidNoticePrintWindow(sortedRecords, filters, printLabelMaps, showError);
  };

  return (
    <Box>
      <PageHeader
        title="공고문"
        action={
          <Button disabled={!canCreate} onClick={openNew} startIcon={<AddOutlinedIcon />} variant="contained">
            신규
          </Button>
        }
      />

      <Card sx={{ mb: 3 }} variant="outlined">
        <CardContent>
          <Stack spacing={2}>
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", xl: "repeat(5, minmax(0, 1fr))" } }}>
              <Box sx={{ display: "grid", gap: 0.75, gridColumn: { xs: "auto", xl: "span 1" }, alignSelf: "start" }}>
                <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>용역명</Typography>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    onKeyDown={handleSearchEnter(handleSearch)}
                    onChange={(event) => setSearchDraft((current) => ({ ...current, keyword: event.target.value }))}
                    size="small"
                    sx={compactFieldSx}
                    value={searchDraft.keyword}
                  />
                </Box>
              </Box>

              <PeriodRangeField
                label="조회기간"
                options={periodOptions}
                onEndChange={(value) => setSearchDraft((current) => ({ ...current, periodEndDate: value }))}
                onPeriodChange={(value) => setSearchDraft((current) => ({ ...current, periodType: value }))}
                onStartChange={(value) => setSearchDraft((current) => ({ ...current, periodStartDate: value }))}
                periodValue={searchDraft.periodType}
                startValue={searchDraft.periodStartDate}
                endValue={searchDraft.periodEndDate}
                sx={[compactFieldSx, { gridColumn: { xs: "auto", xl: "span 2" } }]}
              />

              <AutoCompleteField mode="select"
                label="업무부서"
                labelPlacement="top"
                onChange={(value) => setSearchDraft((current) => ({ ...current, department: value as BidNoticeFilters["department"] }))}
                options={departmentOptions.options}
                placeholder="전체"
                placeholderDisabled={false}
                sx={compactFieldSx}
                value={searchDraft.department}
              />

              <Box sx={{ display: "grid", gap: 0.75, alignSelf: "start" }}>
                <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>작성자</Typography>
                <AutoCompleteField
                  loading={registrantOptions.isLoading}
                  items={registrantOptions.items}
                  mapOption={(user) => ({ label: user.userName ? `${user.userName} (${user.loginId})` : user.loginId, value: user.employeeNo })}
                  sx={compactFieldSx}
                  value={searchDraft.superDecideEmpno}
                  onChange={(value) =>
                    setSearchDraft((current) => ({
                      ...current,
                      superDecideEmpno: value,
                    }))
                  }
                />
              </Box>

              <CheckboxSelectInput
                label="참여 상태"
                name="participationStatuses"
                onChange={(name, value) => setSearchDraft((current) => ({ ...current, [name]: value }))}
                options={finalParticipationOptions.options}
                sx={compactFieldSx}
                value={searchDraft.participationStatuses}
              />

              <AutoCompleteField mode="select"
                label="낙찰여부"
                labelPlacement="top"
                onChange={(value) => setSearchDraft((current) => ({ ...current, bidSuccessYn: value as BidNoticeFilters["bidSuccessYn"] }))}
                options={bidSuccessOptions}
                placeholder="전체"
                placeholderDisabled={false}
                sx={compactFieldSx}
                value={searchDraft.bidSuccessYn}
              />

              <AutoCompleteField mode="select"
                label="사업구분"
                labelPlacement="top"
                onChange={(value) => setSearchDraft((current) => ({ ...current, businessType: value }))}
                options={businessTypeSearchOptions}
                placeholder="전체"
                placeholderDisabled={false}
                sx={compactFieldSx}
                value={searchDraft.businessType}
              />

              <AutoCompleteField mode="select"
                label="입찰방식"
                labelPlacement="top"
                onChange={(value) => setSearchDraft((current) => ({ ...current, bidMethod: value as BidNoticeFilters["bidMethod"] }))}
                options={bidMethodOptions.options}
                placeholder="전체"
                placeholderDisabled={false}
                sx={compactFieldSx}
                value={searchDraft.bidMethod}
              />

            </Box>

            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  const defaultFilters = buildDefaultFilters();
                  setSearchDraft(defaultFilters);
                  setFilters(defaultFilters);
                  setPaginationModel((current) => ({ ...current, page: 0 }));
                  setSearchRevision((current) => current + 1);
                }}
                disabled={!canRead}
                startIcon={<RefreshOutlinedIcon />}
                variant="outlined"
              >
                초기화
              </Button>
              <Button disabled={!canRead || bidNoticesQuery.isFetching} onClick={handleSearch} startIcon={<SearchOutlinedIcon />} variant="contained">
                조회
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card
        sx={{
          height: { xs: "auto", lg: bidNoticeGridCardHeight },
          minHeight: BID_NOTICE_GRID_CARD_MIN_HEIGHT,
          minWidth: 0,
          position: "relative",
        }}
        variant="outlined"
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", pb: 2.5 }}>
          <EnterpriseDataGrid<BidNoticeRecord>
            apiRef={gridApiRef}
            columns={columns}
            loading={bidNoticesQuery.isLoading || bidNoticesQuery.isFetching}
            onExportPrint={handleExportPrint}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            paginationModel={paginationModel}
            showXlsxExportButton
            showPrintButton
            showPageNumbers
            pageSizeOptions={[20, 40, 80, 120]}
            getRowId={(row) => row.id}
            onRowDoubleClick={(params: GridRowParams<BidNoticeRecord>) => openEditor(params.row)}
            rowCount={bidNoticesQuery.data?.totalElements ?? 0}
            rows={records}
            wrapperMinHeight={bidNoticeGridHeight}
            sx={{
              height: bidNoticeGridHeight,
              "& .MuiDataGrid-row:hover": { cursor: "pointer" },
            }}
          />
        </CardContent>
        <ResizeHandle
          ariaLabel="공고문 그리드 높이 조정"
          onClick={handleBidNoticeGridResizeClick}
          onPointerDown={handleBidNoticeGridResizeStart}
          orientation="horizontal"
          sx={{ display: { xs: "none", lg: "flex" } }}
        />
      </Card>

      {open ? (
        <BidNoticeDetailDialog
          onClose={closeDialog}
          onDeleteRequest={requestDeleteRecord}
          onFieldChange={updateDraft}
          onSave={saveRecord}
          open
          record={draft}
          saveDisabled={saveMutation.isPending || (draft.seqNo ? !canUpdate : !canCreate)}
          deleteDisabled={deleteMutation.isPending || !draft.seqNo || !canDelete}
          g2bBidNoticeNumber={sourceCandidate?.bidNtceNo ?? ""}
          g2bBidNoticeUrl={sourceCandidate?.bidNtceUrl ?? ""}
          sourceAttachments={sourceCandidate?.attachments?.map((attachment) => ({
            downloadUrl: attachment.downloadUrl ?? "",
            fileName: attachment.fileName ?? "첨부파일",
          })) ?? []}
        />
      ) : null}
      <ConfirmDeleteDialog
        loading={deleteMutation.isPending}
        message="삭제 후에는 복구할 수 없습니다. 연결된 첨부파일도 함께 삭제됩니다. 계속하시겠습니까?"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteRecord}
        open={deleteConfirmOpen}
        targetLabel={draft.projectName}
        title="입찰공고 삭제 확인"
      />

    </Box>
  );
}
