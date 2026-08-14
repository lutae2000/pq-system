"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  completionStatusColor,
  completionStatusLabel,
  daysUntil,
  display,
  initialCompletionRows,
  nowText,
  type EducationCompletionRecord,
  type EducationCompletionStatus,
} from "@/modules/pq/education-reminders/educationReminderTypes";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const STATUS_OPTIONS: Array<{ label: string; value: "" | EducationCompletionStatus }> = [
  { label: "전체", value: "" },
  { label: "이수완료", value: "COMPLETE" },
  { label: "미이수", value: "INCOMPLETE" },
  { label: "기한초과", value: "OVERDUE" },
];

type CompletionFilters = {
  keyword: string;
  status: "" | EducationCompletionStatus;
};

const emptyFilters = (): CompletionFilters => ({
  keyword: "",
  status: "",
});

const getCompletionStatus = (row: EducationCompletionRecord): EducationCompletionStatus => {
  if (row.completed) {
    return "COMPLETE";
  }
  return daysUntil(row.dueDate) < 0 ? "OVERDUE" : "INCOMPLETE";
};

const matchesKeyword = (row: EducationCompletionRecord, keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.engineerName, row.departmentName, row.phoneNumber, row.educationName, row.managerName, row.note]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalized));
};

function SummaryCard({ color = "text.primary", label, value }: { color?: string; label: string; value: string }) {
  return (
    <Card>
      <CardContent sx={{ p: 1.5 }}>
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography color={color} sx={{ fontWeight: 800, mt: 0.5 }} variant="h5">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function EducationReminderCompletionManagementTab() {
  const { canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const [filters, setFilters] = useState<CompletionFilters>(() => emptyFilters());
  const [rows, setRows] = useState<EducationCompletionRecord[]>(initialCompletionRows);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(initialCompletionRows[0]?.id ?? null);
  const [deleteTarget, setDeleteTarget] = useState<EducationCompletionRecord | null>(null);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const status = getCompletionStatus(row);
        if (filters.status && status !== filters.status) {
          return false;
        }
        return matchesKeyword(row, filters.keyword);
      }),
    [filters.keyword, filters.status, rows],
  );

  const summary = useMemo(() => {
    const complete = rows.filter((row) => getCompletionStatus(row) === "COMPLETE").length;
    const overdue = rows.filter((row) => getCompletionStatus(row) === "OVERDUE").length;
    const pending = rows.filter((row) => getCompletionStatus(row) === "INCOMPLETE").length;
    return { complete, overdue, pending };
  }, [rows]);

  const columns = useMemo<GridColDef<EducationCompletionRecord>[]>(
    () => [
      { field: "engineerName", headerName: "이름", width: 120 },
      { field: "departmentName", headerName: "부서", minWidth: 150, flex: 0.8 },
      { field: "phoneNumber", headerName: "전화번호", width: 150 },
      { field: "educationName", headerName: "교육명", minWidth: 220, flex: 1.1 },
      { field: "dueDate", headerName: "마감일", width: 112 },
      { field: "completionDate", headerName: "이수일", width: 112, valueGetter: (_value, row) => display(row.completionDate) },
      {
        field: "status",
        headerName: "이수 상태",
        width: 110,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => {
          const status = getCompletionStatus(row);
          return (
            <Chip
              color={completionStatusColor[status]}
              label={completionStatusLabel[status]}
              size="small"
              variant={status === "COMPLETE" ? "filled" : "outlined"}
            />
          );
        },
      },
      { field: "lastCheckedAt", headerName: "최근 확인", width: 150, valueGetter: (_value, row) => display(row.lastCheckedAt) },
      { field: "managerName", headerName: "담당자", width: 110 },
      { field: "note", headerName: "비고", minWidth: 220, flex: 1, valueGetter: (_value, row) => display(row.note) },
    ],
    [],
  );

  const selectedRow = useMemo(() => rows.find((row) => row.id === selectedRowId) ?? null, [rows, selectedRowId]);

  const updateSelectedRow = (updater: (row: EducationCompletionRecord) => EducationCompletionRecord) => {
    if (!selectedRow) {
      return;
    }

    setRows((current) => current.map((row) => (row.id === selectedRow.id ? updater(row) : row)));
  };

  const markComplete = () => {
    updateSelectedRow((row) => ({
      ...row,
      completed: true,
      completionDate: row.completionDate || nowText().slice(0, 10),
      lastCheckedAt: nowText(),
    }));
  };

  const markIncomplete = () => {
    updateSelectedRow((row) => ({
      ...row,
      completed: false,
      completionDate: null,
      lastCheckedAt: nowText(),
    }));
  };

  const onDelete = () => {
    if (!deleteTarget) {
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    if (selectedRowId === deleteTarget.id) {
      setSelectedRowId(null);
    }
    setDeleteTarget(null);
  };

  if (!canRead) {
    return <Alert severity="warning">법정 필수교육 이수 여부 관리 조회 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
        <SummaryCard label="이수완료" value={`${summary.complete}건`} />
        <SummaryCard color="warning.main" label="미이수" value={`${summary.pending}건`} />
        <SummaryCard color="error.main" label="기한초과" value={`${summary.overdue}건`} />
      </Box>

      <SearchPanel
        keyword={filters.keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="이름, 부서, 전화번호, 교육명, 비고"
        keywordSx={{ flex: "1 1 360px", maxWidth: 560, minWidth: 260 }}
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onReset={() => setFilters(emptyFilters())}
        onSearch={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        resetLabel="초기화"
        searchDisabled={false}
        searchLabel="조회"
      >
        <TextField
          select
          label="이수 상태"
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as CompletionFilters["status"] }))}
          size="small"
          sx={{ minWidth: 140 }}
          value={filters.status}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value || "all"} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </SearchPanel>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                이수 여부 목록
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button disabled={!selectedRow || !canUpdate} onClick={markComplete} startIcon={<DoneOutlinedIcon />} variant="contained">
                  이수완료
                </Button>
                <Button disabled={!selectedRow || !canUpdate} onClick={markIncomplete} startIcon={<UndoOutlinedIcon />} variant="outlined">
                  미이수
                </Button>
                <Button color="error" disabled={!selectedRow || !canDelete} onClick={() => setDeleteTarget(selectedRow)} startIcon={<DeleteOutlineOutlinedIcon />} variant="outlined">
                  삭제
                </Button>
              </Stack>
            </Box>

            <EnterpriseDataGrid<EducationCompletionRecord>
              columns={columns}
              getRowId={(row) => row.id}
              hideFooterSelectedRowCount
              onRowClick={(params: GridRowParams<EducationCompletionRecord>) => setSelectedRowId(params.row.id)}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              rows={filteredRows}
              showPageNumbers
              showXlsxExportButton
              wrapperMinHeight={620}
              sx={{ height: 620, minWidth: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
            />
          </Box>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        message="선택한 이수 여부 항목을 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        title="이수 여부 삭제"
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
      />
    </Stack>
  );
}
