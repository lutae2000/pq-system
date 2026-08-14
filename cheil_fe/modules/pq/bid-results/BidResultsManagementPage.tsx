"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, Card, CardContent, Chip, MenuItem, Snackbar, Stack, TextField, Typography } from "@mui/material";
import {
  GridActionsCellItem,
  GridRowModes,
  type GridColDef,
  type GridRowId,
  type GridRowModesModel,
} from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

type BidResultStatus = "낙찰" | "패찰" | "유찰" | "심사중";
type SearchStatus = "All" | BidResultStatus;

type BidResultRow = {
  id: string;
  bidNo: string;
  projectName: string;
  orderClientName: string;
  departmentName: string;
  bidDate: string;
  openingDate: string;
  estimateAmount: number | null;
  baseAmount: number | null;
  expectedAmount: number | null;
  firstRankVendor: string;
  winningVendor: string;
  winningAmount: number | null;
  bidRate: number | null;
  rank: number | null;
  status: BidResultStatus;
  managerName: string;
  noticeUrl: string;
  remark: string;
  isNew?: boolean;
};

type DeleteTarget = {
  id: string;
  label: string;
};

const statusOptions: BidResultStatus[] = ["낙찰", "패찰", "유찰", "심사중"];

const sampleRows: BidResultRow[] = [
  {
    id: "result-2026-001",
    bidNo: "202608-001",
    projectName: "OO 하수관로 정비사업 건설사업관리용역",
    orderClientName: "서울특별시",
    departmentName: "PQ팀",
    bidDate: "2026-08-01",
    openingDate: "2026-08-04",
    estimateAmount: 350000000,
    baseAmount: 352100000,
    expectedAmount: 349820000,
    firstRankVendor: "제일엔지니어링",
    winningVendor: "제일엔지니어링",
    winningAmount: 307841600,
    bidRate: 88.0,
    rank: 1,
    status: "낙찰",
    managerName: "홍길동",
    noticeUrl: "https://www.g2b.go.kr",
    remark: "최종 낙찰 확인",
  },
  {
    id: "result-2026-002",
    bidNo: "202608-002",
    projectName: "국도 확장공사 감독권한대행 등 건설사업관리용역",
    orderClientName: "국토교통부",
    departmentName: "입찰관리팀",
    bidDate: "2026-08-02",
    openingDate: "2026-08-05",
    estimateAmount: 820000000,
    baseAmount: 819400000,
    expectedAmount: 817700000,
    firstRankVendor: "대한기술단",
    winningVendor: "",
    winningAmount: null,
    bidRate: null,
    rank: 3,
    status: "심사중",
    managerName: "김민수",
    noticeUrl: "",
    remark: "적격심사 진행",
  },
  {
    id: "result-2026-003",
    bidNo: "202607-018",
    projectName: "지방상수도 현대화사업 통합건설사업관리용역",
    orderClientName: "한국수자원공사",
    departmentName: "PQ팀",
    bidDate: "2026-07-28",
    openingDate: "2026-07-31",
    estimateAmount: 420000000,
    baseAmount: 421200000,
    expectedAmount: 419900000,
    firstRankVendor: "성진엔지니어링",
    winningVendor: "성진엔지니어링",
    winningAmount: 369512000,
    bidRate: 88.0,
    rank: 2,
    status: "패찰",
    managerName: "이서연",
    noticeUrl: "",
    remark: "2순위",
  },
];

const makeId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR");

const formatRate = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : `${Number(value).toFixed(3)}%`;

const normalizeText = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";

export function BidResultsManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<SearchStatus>("All");
  const [openingDateFrom, setOpeningDateFrom] = useState("");
  const [openingDateTo, setOpeningDateTo] = useState("");
  const [rows, setRows] = useState<BidResultRow[]>(sampleRows);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [notice, setNotice] = useState<{ message: string; severity: "success" | "info" } | null>(null);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalizeText(appliedKeyword);

    return rows.filter((row) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          row.bidNo,
          row.projectName,
          row.orderClientName,
          row.departmentName,
          row.firstRankVendor,
          row.winningVendor,
          row.managerName,
          row.remark,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword);
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesDateFrom = !openingDateFrom || row.openingDate >= openingDateFrom;
      const matchesDateTo = !openingDateTo || row.openingDate <= openingDateTo;

      return matchesKeyword && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [appliedKeyword, openingDateFrom, openingDateTo, rows, statusFilter]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const won = filteredRows.filter((row) => row.status === "낙찰").length;
    const lost = filteredRows.filter((row) => row.status === "패찰").length;
    const reviewing = filteredRows.filter((row) => row.status === "심사중").length;
    const winningAmount = filteredRows.reduce((sum, row) => sum + (row.winningAmount ?? 0), 0);

    return { total, won, lost, reviewing, winningAmount };
  }, [filteredRows]);

  const updateRowMode = (id: GridRowId, mode: GridRowModes) => {
    setRowModesModel((current) => ({ ...current, [id]: { mode } }));
  };

  const cancelEdit = (row: BidResultRow) => {
    if (row.isNew) {
      setRows((current) => current.filter((item) => item.id !== row.id));
      return;
    }

    setRowModesModel((current) => ({ ...current, [row.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
  };

  const handleAdd = () => {
    if (!canCreate) {
      return;
    }

    const next: BidResultRow = {
      id: makeId(),
      bidNo: "",
      projectName: "",
      orderClientName: "",
      departmentName: "",
      bidDate: "",
      openingDate: "",
      estimateAmount: null,
      baseAmount: null,
      expectedAmount: null,
      firstRankVendor: "",
      winningVendor: "",
      winningAmount: null,
      bidRate: null,
      rank: null,
      status: "심사중",
      managerName: "",
      noticeUrl: "",
      remark: "",
      isNew: true,
    };

    setRows((current) => [next, ...current]);
    updateRowMode(next.id, GridRowModes.Edit);
  };

  const processRowUpdate = (updatedRow: BidResultRow) => {
    const normalizedRow: BidResultRow = {
      ...updatedRow,
      estimateAmount: toNumber(updatedRow.estimateAmount),
      baseAmount: toNumber(updatedRow.baseAmount),
      expectedAmount: toNumber(updatedRow.expectedAmount),
      winningAmount: toNumber(updatedRow.winningAmount),
      bidRate: toNumber(updatedRow.bidRate),
      rank: toNumber(updatedRow.rank),
      isNew: false,
    };

    setRows((current) => current.map((row) => (row.id === normalizedRow.id ? normalizedRow : row)));
    setNotice({ message: "입찰결과를 저장했습니다.", severity: "success" });
    return normalizedRow;
  };

  const requestDelete = useCallback(
    (row: BidResultRow) => {
      if (!canDelete) {
        return;
      }

      setDeleteTarget({ id: row.id, label: `${row.bidNo || "-"} / ${row.projectName || "-"}` });
    },
    [canDelete],
  );

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    setNotice({ message: "입찰결과를 삭제했습니다.", severity: "success" });
  };

  const columns = useMemo<GridColDef<BidResultRow>[]>(
    () => [
      { field: "bidNo", headerName: "공고번호", width: 120, editable: true },
      { field: "projectName", headerName: "용역명", minWidth: 260, flex: 1.2, editable: true },
      { field: "orderClientName", headerName: "발주처", minWidth: 150, flex: 0.6, editable: true },
      { field: "departmentName", headerName: "담당부서", width: 110, editable: true },
      { field: "bidDate", headerName: "입찰일", width: 110, editable: true },
      { field: "openingDate", headerName: "개찰일", width: 110, editable: true },
      {
        field: "estimateAmount",
        headerName: "추정가격",
        width: 125,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumber(value as number | null),
        valueParser: toNumber,
      },
      {
        field: "baseAmount",
        headerName: "기초금액",
        width: 125,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumber(value as number | null),
        valueParser: toNumber,
      },
      {
        field: "expectedAmount",
        headerName: "예정가격",
        width: 125,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumber(value as number | null),
        valueParser: toNumber,
      },
      { field: "firstRankVendor", headerName: "1순위 업체", minWidth: 150, flex: 0.6, editable: true },
      { field: "winningVendor", headerName: "낙찰업체", minWidth: 150, flex: 0.6, editable: true },
      {
        field: "winningAmount",
        headerName: "낙찰금액",
        width: 125,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatNumber(value as number | null),
        valueParser: toNumber,
      },
      {
        field: "bidRate",
        headerName: "투찰률",
        width: 95,
        align: "right",
        editable: true,
        headerAlign: "center",
        type: "number",
        valueFormatter: (value) => formatRate(value as number | null),
        valueParser: toNumber,
      },
      { field: "rank", headerName: "순위", width: 75, align: "right", editable: true, headerAlign: "center", type: "number", valueParser: toNumber },
      {
        field: "status",
        headerName: "결과",
        width: 95,
        editable: true,
        type: "singleSelect",
        valueOptions: statusOptions,
      },
      { field: "managerName", headerName: "담당자", width: 95, editable: true },
      { field: "noticeUrl", headerName: "공고 URL", minWidth: 190, flex: 0.7, editable: true },
      { field: "remark", headerName: "비고", minWidth: 180, flex: 0.7, editable: true },
      {
        field: "actions",
        type: "actions",
        headerName: "",
        width: 94,
        getActions: ({ id, row }) => {
          const editing = rowModesModel[id]?.mode === GridRowModes.Edit;

          if (editing) {
            return [
              <GridActionsCellItem
                icon={<SaveOutlinedIcon />}
                key="save"
                label="저장"
                onClick={() => updateRowMode(id, GridRowModes.View)}
              />,
              <GridActionsCellItem
                icon={<CancelOutlinedIcon />}
                key="cancel"
                label="취소"
                onClick={() => cancelEdit(row)}
              />,
            ];
          }

          return [
            <GridActionsCellItem
              disabled={!canUpdate}
              icon={<EditOutlinedIcon />}
              key="edit"
              label="수정"
              onClick={() => updateRowMode(id, GridRowModes.Edit)}
            />,
            <GridActionsCellItem
              disabled={!canDelete}
              icon={<DeleteOutlineOutlinedIcon />}
              key="delete"
              label="삭제"
              onClick={() => requestDelete(row)}
              showInMenu
            />,
          ];
        },
      },
    ],
    [canDelete, canUpdate, requestDelete, rowModesModel],
  );

  const handleReset = () => {
    setKeyword("");
    setAppliedKeyword("");
    setStatusFilter("All");
    setOpeningDateFrom("");
    setOpeningDateTo("");
  };

  return (
    <Box>
      <PageHeader
        title="입찰결과 관리"
        description="입찰 공고별 개찰 결과, 낙찰 정보, 투찰률과 후속 상태를 인라인으로 관리합니다."
      />

      <SearchPanel
        keyword={keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="공고번호, 용역명, 발주처, 업체명, 담당자"
        onKeywordChange={setKeyword}
        onReset={handleReset}
        onSearch={setAppliedKeyword}
        searchDisabled={!canRead}
      >
        <TextField
          label="결과"
          onChange={(event) => setStatusFilter(event.target.value as SearchStatus)}
          select
          size="small"
          sx={standardFieldSx}
          value={statusFilter}
        >
          <MenuItem value="All">전체</MenuItem>
          {statusOptions.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="개찰일 시작"
          onChange={(event) => setOpeningDateFrom(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          size="small"
          sx={standardFieldSx}
          type="date"
          value={openingDateFrom}
        />
        <TextField
          label="개찰일 종료"
          onChange={(event) => setOpeningDateTo(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          size="small"
          sx={standardFieldSx}
          type="date"
          value={openingDateTo}
        />
      </SearchPanel>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <Chip label={`전체 ${summary.total.toLocaleString("ko-KR")}건`} variant="outlined" />
        <Chip color="success" label={`낙찰 ${summary.won.toLocaleString("ko-KR")}건`} variant="outlined" />
        <Chip color="default" label={`패찰 ${summary.lost.toLocaleString("ko-KR")}건`} variant="outlined" />
        <Chip color="info" label={`심사중 ${summary.reviewing.toLocaleString("ko-KR")}건`} variant="outlined" />
        <Chip label={`낙찰금액 ${summary.winningAmount.toLocaleString("ko-KR")}원`} variant="outlined" />
      </Stack>

      <Card sx={{ minWidth: 0 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                입찰결과 목록
              </Typography>
              <Typography color="text.secondary" noWrap variant="body2">
                API 개발 전까지는 화면 확인용 로컬 데이터로 동작합니다.
              </Typography>
            </Box>
            <Button disabled={!canCreate} onClick={handleAdd} size="small" startIcon={<AddOutlinedIcon />} variant="outlined">
              신규
            </Button>
          </Box>

          <EnterpriseDataGrid<BidResultRow>
            columns={columns}
            confirmProcessRowUpdate={(row) => ({
              confirmColor: "primary",
              confirmLabel: row.isNew ? "등록" : "수정",
              message: "입찰결과를 저장하시겠습니까?",
              title: "저장 확인",
            })}
            editMode="row"
            getRowId={(row) => row.id}
            isCellEditable={(params) => (params.row.isNew ? canCreate : canUpdate)}
            onRowModesModelChange={setRowModesModel}
            processRowUpdate={processRowUpdate}
            rowModesModel={rowModesModel}
            rows={filteredRows}
            showToolbar={false}
            showXlsxExportButton
            wrapperMinHeight={620}
          />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        message="선택한 입찰결과를 삭제하시겠습니까?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleteTarget)}
        targetLabel={deleteTarget?.label}
        title="삭제 확인"
      />
      <Snackbar autoHideDuration={2200} onClose={() => setNotice(null)} open={Boolean(notice)}>
        <Chip color={notice?.severity === "success" ? "success" : "default"} label={notice?.message ?? ""} />
      </Snackbar>
    </Box>
  );
}
