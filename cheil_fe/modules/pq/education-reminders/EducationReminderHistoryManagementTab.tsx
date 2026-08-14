"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { display, type SendHistoryRow } from "@/modules/pq/education-reminders/educationReminderTypes";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

type HistoryFilters = {
  keyword: string;
  status: "" | "FAILED" | "SUCCESS";
};

type EducationReminderHistoryManagementTabProps = {
  historyRows: SendHistoryRow[];
};

const emptyFilters = (): HistoryFilters => ({
  keyword: "",
  status: "",
});

const matchesKeyword = (row: SendHistoryRow, keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.engineerName, row.departmentName, row.phoneNumber, row.templateName, row.messageContent, row.failureReason]
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

export function EducationReminderHistoryManagementTab({ historyRows }: EducationReminderHistoryManagementTabProps) {
  const { canRead } = useCurrentMenuPermission();
  const [filters, setFilters] = useState<HistoryFilters>(() => emptyFilters());
  const [selectedRowId, setSelectedRowId] = useState<number | null>(historyRows[0]?.id ?? null);

  const filteredRows = useMemo(
    () =>
      historyRows.filter((row) => {
        if (filters.status && row.status !== filters.status) {
          return false;
        }
        return matchesKeyword(row, filters.keyword);
      }),
    [filters.keyword, filters.status, historyRows],
  );

  const selectedRow = useMemo(() => filteredRows.find((row) => row.id === selectedRowId) ?? null, [filteredRows, selectedRowId]);

  const summary = useMemo(() => {
    const success = historyRows.filter((row) => row.status === "SUCCESS").length;
    const failed = historyRows.filter((row) => row.status === "FAILED").length;
    const total = historyRows.length;
    return { failed, success, total };
  }, [historyRows]);

  const columns = useMemo<GridColDef<SendHistoryRow>[]>(
    () => [
      { field: "sentAt", headerName: "발송일시", width: 150 },
      { field: "engineerName", headerName: "이름", width: 120 },
      { field: "departmentName", headerName: "부서", minWidth: 150, flex: 0.7 },
      { field: "phoneNumber", headerName: "전화번호", width: 140 },
      { field: "templateName", headerName: "템플릿", minWidth: 180, flex: 0.8 },
      { field: "channel", headerName: "채널", width: 90 },
      {
        field: "status",
        headerName: "결과",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Chip color={row.status === "SUCCESS" ? "success" : "error"} label={row.status === "SUCCESS" ? "성공" : "실패"} size="small" variant="filled" />
        ),
      },
      { field: "failureReason", headerName: "실패 사유", minWidth: 220, flex: 1, valueGetter: (_value, row) => display(row.failureReason) },
      { field: "messageContent", headerName: "발송 내용", minWidth: 320, flex: 1.2 },
    ],
    [],
  );

  if (!canRead) {
    return <Alert severity="warning">법정 필수교육 발송 이력 조회 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
        <SummaryCard label="전체 이력" value={`${summary.total}건`} />
        <SummaryCard color="success.main" label="성공" value={`${summary.success}건`} />
        <SummaryCard color="error.main" label="실패" value={`${summary.failed}건`} />
      </Box>

      <SearchPanel
        keyword={filters.keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="이름, 부서, 전화번호, 템플릿, 내용"
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
          label="결과"
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as HistoryFilters["status"] }))}
          size="small"
          sx={{ minWidth: 140 }}
          value={filters.status}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="SUCCESS">성공</MenuItem>
          <MenuItem value="FAILED">실패</MenuItem>
        </TextField>
      </SearchPanel>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 800, mb: 1.5 }} variant="h6">
              발송 이력 목록
            </Typography>

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" } }}>
              <Box sx={{ minWidth: 0 }}>
                <EnterpriseDataGrid<SendHistoryRow>
                  columns={columns}
                  getRowId={(row) => row.id}
                  hideFooterSelectedRowCount
                  onRowClick={(params: GridRowParams<SendHistoryRow>) => setSelectedRowId(params.row.id)}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  rows={filteredRows}
                  showPageNumbers
                  showXlsxExportButton
                  wrapperMinHeight={620}
                  sx={{ height: 620, minWidth: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </Box>

              <Card variant="outlined" sx={{ minWidth: 0 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    이력 상세
                  </Typography>
                  <Divider />
                  {!selectedRow ? (
                    <Alert severity="info">이력을 선택하세요.</Alert>
                  ) : (
                    <Stack spacing={1.25}>
                      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                        <DetailItem label="이름" value={selectedRow.engineerName} />
                        <DetailItem label="부서" value={selectedRow.departmentName} />
                        <DetailItem label="전화번호" value={selectedRow.phoneNumber} />
                        <DetailItem label="채널" value={selectedRow.channel} />
                        <DetailItem label="템플릿" value={selectedRow.templateName} />
                        <DetailItem label="발송일시" value={selectedRow.sentAt} />
                        <DetailItem label="결과" value={selectedRow.status === "SUCCESS" ? "성공" : "실패"} />
                        <DetailItem label="대상 ID" value={selectedRow.targetId === null ? "-" : String(selectedRow.targetId)} />
                      </Box>
                      <TextField
                        label="발송 내용"
                        multiline
                        minRows={8}
                        size="small"
                        sx={{ width: "100%" }}
                        value={selectedRow.messageContent}
                        slotProps={{ input: { readOnly: true } }}
                      />
                      <TextField
                        label="실패 사유"
                        multiline
                        minRows={3}
                        size="small"
                        sx={{ width: "100%" }}
                        value={display(selectedRow.failureReason)}
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
    </Stack>
  );
}
