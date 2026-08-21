"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef, GridRowParams, GridRowSelectionModel } from "@mui/x-data-grid";
import RetryOutlinedIcon from "@mui/icons-material/ReplayOutlined";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";

import { listEducationReminderSendHistory, retryEducationReminderSend } from "../send/api";
import type { EducationReminderSendHistoryRecord } from "../send/types";
import { EducationReminderSendRetryDialog } from "./EducationReminderSendRetryDialog";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

type FilterState = {
  channel: "" | "LMS" | "SMS" | "KAKAO";
  keyword: string;
  requestedFrom: string;
  requestedTo: string;
  status: "" | "PENDING" | "SUCCESS" | "FAILED";
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDateFilters() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 30);
  return { requestedFrom: toDateInputValue(from), requestedTo: toDateInputValue(today) };
}

function formatRequestDateTime(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return "-";
  }

  return normalized.replace("T", " ").slice(0, 19);
}

const emptyFilters = (): FilterState => ({
  channel: "",
  keyword: "",
  ...getDefaultDateFilters(),
  status: "",
});

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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }} variant="body2">
        {value || "-"}
      </Typography>
    </Box>
  );
}

function statusChip(status: EducationReminderSendHistoryRecord["status"]) {
  const color = status === "SUCCESS" ? "success" : status === "FAILED" ? "error" : "info";
  const label = status === "SUCCESS" ? "성공" : status === "FAILED" ? "실패" : "대기";
  return <Chip color={color} label={label} size="small" variant="filled" />;
}

function channelChip(channel: EducationReminderSendHistoryRecord["channel"]) {
  const color = channel === "LMS" ? "primary" : channel === "SMS" ? "warning" : "secondary";
  return <Chip color={color} label={channel} size="small" variant="outlined" />;
}

export function EducationReminderSendHistoryPage() {
  const { canCreate, canRead, canUpdate } = useCurrentMenuPermission();
  const canRetry = canCreate || canUpdate;
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const { showError, showSuccess } = useAppSnackbar();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FilterState>(() => emptyFilters());
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => emptyFilters());
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [selectedRowSelection, setSelectedRowSelection] = useState<GridRowSelectionModel>({
    ids: new Set(),
    type: "include",
  });
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);

  const query = useQuery({
    queryKey: ["education-reminders", "send-history", appliedFilters],
    queryFn: () =>
      listEducationReminderSendHistory({
        channel: appliedFilters.channel || undefined,
        keyword: appliedFilters.keyword.trim() || undefined,
        requestedFrom: appliedFilters.requestedFrom || undefined,
        requestedTo: appliedFilters.requestedTo || undefined,
        status: appliedFilters.status || undefined,
      }),
    enabled: tabQueryEnabled,
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);
  const selectedRow = useMemo(
    () => rows.find((row) => row.logId === selectedRowId) ?? rows[0] ?? null,
    [rows, selectedRowId],
  );
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedRowSelection.ids.has(row.logId)),
    [rows, selectedRowSelection],
  );
  const retryDialogKey = useMemo(
    () => selectedRows.map((row) => row.logId).sort((left, right) => left - right).join(","),
    [selectedRows],
  );

  const summary = useMemo(() => {
    const total = rows.length;
    const success = rows.filter((row) => row.status === "SUCCESS").length;
    const failed = rows.filter((row) => row.status === "FAILED").length;
    const pending = rows.filter((row) => row.status === "PENDING").length;
    return { failed, pending, success, total };
  }, [rows]);

  const retryMutation = useMutation({
    mutationFn: retryEducationReminderSend,
    onSuccess: async (response) => {
      showSuccess(`재발송을 등록했습니다. ${response.insertedCount}건 처리 대기.`);
      setRetryDialogOpen(false);
      setSelectedRowSelection({ ids: new Set(), type: "include" });
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "send-history"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "재발송을 처리하지 못했습니다."),
  });

  const columns = useMemo<GridColDef<EducationReminderSendHistoryRecord>[]>(
    () => [
        {
            field: "status",
            headerName: "결과",
            width: 100,
            align: "center",
            headerAlign: "center",
            renderCell: ({ row }) => statusChip(row.status),
        },
      { field: "requestedAt", headerName: "요청시각", width: 180, valueGetter: (_value, row) => formatRequestDateTime(row.requestedAt) },
      { field: "requestedBy", headerName: "요청자", width: 120 },
      { field: "templateName", headerName: "템플릿", minWidth: 180, flex: 0.9 },
      {
        field: "channel",
        headerName: "채널",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => channelChip(row.channel),
      },
      { field: "engineerName", headerName: "대상자", width: 120 },
      { field: "departmentName", headerName: "부서", minWidth: 160, flex: 0.8 },
      { field: "targetPhoneNo", headerName: "대상번호", width: 140 },
      { field: "actualPhoneNo", headerName: "발송번호", width: 140 },
      {
        field: "testSend",
        headerName: "테스트",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => <Chip color={row.testSend ? "warning" : "default"} label={row.testSend ? "테스트" : "실발송"} size="small" variant={row.testSend ? "filled" : "outlined"} />,
      },
      { field: "sentAt", headerName: "발송시각", width: 180, valueGetter: (_value, row) => formatRequestDateTime(row.sentAt) },
      { field: "failureReason", headerName: "실패사유", minWidth: 220, flex: 1, valueGetter: (_value, row) => row.failureReason ?? "-" },
      { field: "messageContent", headerName: "발송문구", minWidth: 320, flex: 1.3 },
    ],
    [],
  );

  if (!canRead) {
    return <Alert severity="warning">교육알림 발송 이력 조회 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <PageHeader title="교육알림 발송 이력" />

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
        <SummaryCard label="전체" value={`${summary.total}건`} />
        <SummaryCard color="success.main" label="성공" value={`${summary.success}건`} />
        <SummaryCard color="error.main" label="실패" value={`${summary.failed}건`} />
        <SummaryCard color="info.main" label="대기" value={`${summary.pending}건`} />
      </Box>

      <SearchPanel
        actions={
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Typography color="text.secondary" variant="body2">
              선택 {selectedRows.length}건
            </Typography>
            <Button
              disabled={!canRetry || selectedRows.length === 0}
              onClick={() => setRetryDialogOpen(true)}
              startIcon={<RetryOutlinedIcon />}
              variant="contained"
            >
              재발송
            </Button>
          </Box>
        }
        keyword={filters.keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="대상자, 부서, 번호, 템플릿, 메시지"
        keywordSx={{ flex: "1 1 360px", maxWidth: 560, minWidth: 260 }}
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onReset={() => {
          const next = emptyFilters();
          setFilters(next);
          setAppliedFilters(next);
        }}
        onSearch={(keyword) => setAppliedFilters({ ...filters, keyword })}
        resetLabel="초기화"
        searchDisabled={query.isLoading}
        searchLabel="조회"
      >
        <TextField
          label="요청 시작일"
          onChange={(event) => setFilters((current) => ({ ...current, requestedFrom: event.target.value }))}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="date"
          value={filters.requestedFrom}
        />
        <TextField
          label="요청 종료일"
          onChange={(event) => setFilters((current) => ({ ...current, requestedTo: event.target.value }))}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="date"
          value={filters.requestedTo}
        />
        <TextField
          select
          label="결과"
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as FilterState["status"] }))}
          size="small"
          sx={{ minWidth: 120 }}
          value={filters.status}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="PENDING">대기</MenuItem>
          <MenuItem value="SUCCESS">성공</MenuItem>
          <MenuItem value="FAILED">실패</MenuItem>
        </TextField>
        <TextField
          select
          label="채널"
          onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value as FilterState["channel"] }))}
          size="small"
          sx={{ minWidth: 120 }}
          value={filters.channel}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="LMS">LMS</MenuItem>
          <MenuItem value="SMS">SMS</MenuItem>
          <MenuItem value="KAKAO">KAKAO</MenuItem>
        </TextField>
      </SearchPanel>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" } }}>
              <Box sx={{ minWidth: 0 }}>
                <EnterpriseDataGrid<EducationReminderSendHistoryRecord>
                  checkboxSelection
                  columns={columns}
                  getRowId={(row) => row.logId}
                  hideFooterSelectedRowCount
                  initialState={{
                    pagination: {
                      paginationModel: {
                        page: 0,
                        pageSize: 50,
                      },
                    },
                  }}
                  loading={query.isLoading || query.isFetching}
                  onRowClick={(params: GridRowParams<EducationReminderSendHistoryRecord>) => setSelectedRowId(params.row.logId)}
                  onRowSelectionModelChange={setSelectedRowSelection}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  rowSelectionModel={selectedRowSelection}
                  rows={rows}
                  showPageNumbers
                  showXlsxExportButton
                  wrapperMinHeight={620}
                  sx={{ height: 620, minWidth: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </Box>

              <Card variant="outlined" sx={{ minWidth: 0 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    발송 상세
                  </Typography>
                  <Divider />
                  {!selectedRow ? (
                    <Alert severity="info">발송 내역을 선택하세요.</Alert>
                  ) : (
                    <Stack spacing={1.25}>
                      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                        <DetailItem label="요청시각" value={formatRequestDateTime(selectedRow.requestedAt)} />
                        <DetailItem label="요청자" value={selectedRow.requestedBy} />
                        <DetailItem label="대상자" value={selectedRow.engineerName} />
                        <DetailItem label="부서" value={selectedRow.departmentName} />
                        <DetailItem label="채널" value={selectedRow.channel} />
                        <DetailItem label="결과" value={selectedRow.status} />
                        <DetailItem label="대상번호" value={selectedRow.targetPhoneNo} />
                        <DetailItem label="발송번호" value={selectedRow.actualPhoneNo} />
                        <DetailItem label="템플릿" value={selectedRow.templateName} />
                        <DetailItem label="테스트 발송" value={selectedRow.testSend ? "예" : "아니오"} />
                        <DetailItem label="발송시각" value={formatRequestDateTime(selectedRow.sentAt)} />
                        <DetailItem label="실패사유" value={selectedRow.failureReason ?? "-"} />
                      </Box>
                      <TextField
                        label="발송문구"
                        multiline
                        minRows={8}
                        size="small"
                        sx={{ width: "100%" }}
                        value={selectedRow.messageContent}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <EducationReminderSendRetryDialog
        key={retryDialogKey}
        loading={retryMutation.isPending}
        open={retryDialogOpen}
        rows={selectedRows}
        onClose={() => setRetryDialogOpen(false)}
        onRetry={async (items) => {
          await retryMutation.mutateAsync({ items });
        }}
      />
    </Stack>
  );
}
