"use client";

import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRowParams } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { compactFieldSx } from "@/components/common/FormControls";
import { dateOnly, dateTimeText, formatMoney, text } from "@/modules/common/formatters";
import { useCommonCodeLevel2Options, useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import { BID_NOTICE_PAGE_SIZE, listBidNotices, type BidNoticeRecord, type BidNoticeSearchParams } from "@/modules/pq/bid-notice/bidNoticeApi";

type PeriodType = "NOTICE" | "BID" | "PQ";

type BidNoticeSearchState = {
  bidMethod: string;
  bidSuccessYn: string;
  departmentCode: string;
  keyword: string;
  periodEndDate: string;
  periodStartDate: string;
  periodType: PeriodType;
};

export type BidNoticeSelectDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (record: BidNoticeRecord) => void;
  stateCacheKey?: string;
  title?: string;
};

const emptySearchState = (): BidNoticeSearchState => ({
  bidMethod: "",
  bidSuccessYn: "",
  departmentCode: "",
  keyword: "",
  periodEndDate: dayjs().add(1, "month").format("YYYY-MM-DD"),
  periodStartDate: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
  periodType: "NOTICE",
});

const toSearchParams = (search: BidNoticeSearchState): BidNoticeSearchParams => ({
  bidClosingDateFrom: search.periodType === "NOTICE" ? search.periodStartDate : "",
  bidClosingDateTo: search.periodType === "NOTICE" ? search.periodEndDate : "",
  bidDateFrom: search.periodType === "BID" ? search.periodStartDate : "",
  bidDateTo: search.periodType === "BID" ? search.periodEndDate : "",
  bidSuccessYn: search.bidSuccessYn,
  bidType: "",
  businessType: "",
  departmentCode: search.departmentCode,
  keyword: search.keyword,
  page: 0,
  pqSubmitDateFrom: search.periodType === "PQ" ? search.periodStartDate : "",
  pqSubmitDateTo: search.periodType === "PQ" ? search.periodEndDate : "",
  size: BID_NOTICE_PAGE_SIZE,
  superDecideEmpno: "",
});

const getRowId = (row: BidNoticeRecord) => row.bidSeq ?? `${row.projectName}-${row.announceDate ?? ""}-${row.bidDate ?? ""}`;
const PAGE_SIZE_OPTIONS = [25, 50, 100];

type BidNoticeSelectDialogCachedState = {
  draft: BidNoticeSearchState;
  search: BidNoticeSearchState;
  selectedRecord: BidNoticeRecord | null;
};

const bidNoticeSelectDialogStateCache = new Map<string, BidNoticeSelectDialogCachedState>();

const getInitialDialogState = (stateCacheKey: string | undefined): BidNoticeSelectDialogCachedState => {
  const emptyState = emptySearchState();
  return (
    (stateCacheKey ? bidNoticeSelectDialogStateCache.get(stateCacheKey) : undefined) ?? {
      draft: emptyState,
      search: emptyState,
      selectedRecord: null,
    }
  );
};

export function BidNoticeSelectDialog({ open, onClose, onSelect, stateCacheKey, title = "공고문 선택" }: BidNoticeSelectDialogProps) {
  const initialDialogState = useMemo(() => getInitialDialogState(stateCacheKey), [stateCacheKey]);
  const [draft, setDraft] = useState<BidNoticeSearchState>(() => initialDialogState.draft);
  const [search, setSearch] = useState<BidNoticeSearchState>(() => initialDialogState.search);
  const [selectedRecord, setSelectedRecord] = useState<BidNoticeRecord | null>(() => initialDialogState.selectedRecord);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });

  const searchParams = useMemo(() => toSearchParams(search), [search]);
  const departmentOptions = useDepartmentOptions({ useYn: true });
  const bidMethodOptions = useCommonCodeLevel2Options("ZA");

  const bidNoticesQuery = useQuery({
    queryKey: ["bid-notice", "select-dialog", searchParams],
    queryFn: () => listBidNotices(searchParams),
    enabled: open,
  });

  const rows = useMemo(() => {
    const content = bidNoticesQuery.data?.content ?? [];
    if (!search.bidMethod) {
      return content;
    }
    return content.filter((row) => text(row.bidMethod) === search.bidMethod);
  }, [bidNoticesQuery.data?.content, search.bidMethod]);

  useEffect(() => {
    if (!stateCacheKey) {
      return;
    }

    bidNoticeSelectDialogStateCache.set(stateCacheKey, {
      draft,
      search,
      selectedRecord,
    });
  }, [draft, search, selectedRecord, stateCacheKey]);

  const columns = useMemo<GridColDef<BidNoticeRecord>[]>(
    () => [
      { field: "bidSeq", headerName: "입찰순번", width: 95, align: "center", headerAlign: "center" },
      {
        field: "participateYn",
        headerName: "최종 참여",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => {
          const label = text(row.participateYnLabel) || text(row.participateYn) || "-";
          const isParticipating = row.participateYn === "Y" || label === "참여";
          return (
            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <Chip color={isParticipating ? "success" : "default"} label={label} size="small" variant={isParticipating ? "filled" : "outlined"} />
            </Box>
          );
        },
      },
      {
        field: "bidSuccessYn",
        headerName: "낙찰여부",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <Chip
              color={row.bidSuccessYn === "Y" ? "primary" : "default"}
              label={row.bidSuccessYn === "Y" ? "낙찰" : "미낙찰"}
              size="small"
              variant={row.bidSuccessYn === "Y" ? "filled" : "outlined"}
            />
          </Box>
        ),
      },
      { field: "departmentCode", headerName: "부서", width: 100, valueGetter: (_value, row) => text(row.departmentName) || text(row.departmentCode) },
      { field: "businessType", headerName: "구분", width: 90, valueGetter: (_value, row) => text(row.businessTypeLabel) || text(row.businessType) },
      { field: "orderClient", headerName: "발주처", minWidth: 150, flex: 0.7, valueGetter: (_value, row) => text(row.orderClientName) || text(row.orderClient) },
      { field: "projectName", headerName: "용역명", minWidth: 280, flex: 1.4 },
      { field: "announceDate", headerName: "공고일", width: 110, valueGetter: (_value, row) => dateOnly(row.announceDate) },
      { field: "pqSubmitDate", headerName: "PQ제출일", width: 125, valueGetter: (_value, row) => dateTimeText(row.pqSubmitDate) },
      { field: "bidClosingDate", headerName: "입찰등록 마감", width: 145, valueGetter: (_value, row) => dateTimeText(row.bidClosingDate) },
      { field: "bidDate", headerName: "입찰일", width: 145, valueGetter: (_value, row) => dateTimeText(row.bidDate) },
      {
        field: "designAmt",
        headerName: "설계금액",
        width: 130,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => formatMoney(Number(row.designAmt ?? 0)),
      },
    ],
    [],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch({ ...draft });
    setSelectedRecord(null);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const handleReset = () => {
    const nextSearch = emptySearchState();
    setDraft(nextSearch);
    setSearch(nextSearch);
    setSelectedRecord(null);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const handleSelect = (record: BidNoticeRecord | null) => {
    if (!record) {
      return;
    }
    onSelect(record);
    onClose();
  };

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            height: "79vh",
            maxWidth: "min(1680px, calc(100vw - 48px))",
            width: "min(1680px, calc(100vw - 48px))",
          },
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
              <TextField
                label="용역명"
                onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
                size="small"
                sx={{ ...compactFieldSx, minWidth: 220 }}
                value={draft.keyword}
              />
              <TextField
                label="조회기간"
                onChange={(event) => setDraft((current) => ({ ...current, periodType: event.target.value as PeriodType }))}
                select
                size="small"
                sx={{ ...compactFieldSx, minWidth: 120 }}
                value={draft.periodType}
              >
                <MenuItem value="NOTICE">공고기간</MenuItem>
                <MenuItem value="BID">입찰기간</MenuItem>
                <MenuItem value="PQ">PQ제출기간</MenuItem>
              </TextField>
              <TextField
                label="시작일"
                onChange={(event) => setDraft((current) => ({ ...current, periodStartDate: event.target.value }))}
                size="small"
                sx={{ ...compactFieldSx, minWidth: 150 }}
                type="date"
                value={draft.periodStartDate}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="종료일"
                onChange={(event) => setDraft((current) => ({ ...current, periodEndDate: event.target.value }))}
                size="small"
                sx={{ ...compactFieldSx, minWidth: 150 }}
                type="date"
                value={draft.periodEndDate}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="업무부서"
                onChange={(event) => setDraft((current) => ({ ...current, departmentCode: event.target.value }))}
                select
                size="small"
                sx={{ ...compactFieldSx, minWidth: 150 }}
                value={draft.departmentCode}
              >
                <MenuItem value="">전체</MenuItem>
                {departmentOptions.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="입찰방식"
                onChange={(event) => setDraft((current) => ({ ...current, bidMethod: event.target.value }))}
                select
                size="small"
                sx={{ ...compactFieldSx, minWidth: 150 }}
                value={draft.bidMethod}
              >
                <MenuItem value="">전체</MenuItem>
                {bidMethodOptions.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="낙찰여부"
                onChange={(event) => setDraft((current) => ({ ...current, bidSuccessYn: event.target.value }))}
                select
                size="small"
                sx={{ ...compactFieldSx, minWidth: 120 }}
                value={draft.bidSuccessYn}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="Y">낙찰</MenuItem>
                <MenuItem value="N">미낙찰</MenuItem>
              </TextField>
              <Button disabled={bidNoticesQuery.isFetching} startIcon={<SearchOutlinedIcon />} type="submit" variant="contained">
                조회
              </Button>
              <Button disabled={bidNoticesQuery.isFetching} onClick={handleReset} startIcon={<RefreshOutlinedIcon />} type="button" variant="outlined">
                초기화
              </Button>
            </Stack>
          </Box>

          <EnterpriseDataGrid<BidNoticeRecord>
            columns={columns}
            getRowId={getRowId}
            hideFooterSelectedRowCount
            loading={bidNoticesQuery.isLoading || bidNoticesQuery.isFetching}
            onRowClick={(params: GridRowParams<BidNoticeRecord>) => setSelectedRecord(params.row)}
            onRowDoubleClick={(params: GridRowParams<BidNoticeRecord>) => handleSelect(params.row)}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            paginationModel={paginationModel}
            rowHeight={30}
            rows={rows}
            showPageNumbers
            showToolbar={false}
            stateCacheKey={stateCacheKey ? `${stateCacheKey}:grid` : undefined}
            wrapperMinHeight="56vh"
            sx={{
              border: 0,
              height: "56vh",
              minHeight: 400,
              "& .MuiDataGrid-row:hover": { cursor: "pointer" },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          취소
        </Button>
        <Button disabled={!selectedRecord} onClick={() => handleSelect(selectedRecord)} variant="contained">
          선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}
