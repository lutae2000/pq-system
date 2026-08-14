"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import {
  Alert,
  Box,
  Button,
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
import { useMemo, useState, type ReactNode } from "react";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { EducationReminderTargetDialog } from "@/modules/pq/education-reminders/EducationReminderDialogs";
import {
  daysUntil,
  display,
  emptyTarget,
  initialTargets,
  nowText,
  renderDueLabel,
  statusColor,
  statusLabel,
  type MessageTemplate,
  type EducationReminderTarget,
  type ReminderStatus,
  type SendHistoryRow,
} from "@/modules/pq/education-reminders/educationReminderTypes";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const STATUS_OPTIONS: Array<{ label: string; value: "" | ReminderStatus }> = [
  { label: "전체", value: "" },
  { label: "작성중", value: "DRAFT" },
  { label: "예약", value: "SCHEDULED" },
  { label: "중지", value: "PAUSED" },
  { label: "완료", value: "SENT" },
  { label: "실패", value: "FAILED" },
];

type TargetFilterState = {
  keyword: string;
  status: "" | ReminderStatus;
};

type EducationReminderTargetManagementTabProps = {
  historyRows: SendHistoryRow[];
  onHistoryRowsChange: (nextRows: SendHistoryRow[]) => void;
  templates: MessageTemplate[];
};

const emptyFilterState = (): TargetFilterState => ({
  keyword: "",
  status: "",
});

const getTargetStatus = (target: EducationReminderTarget) => target.status;

const matchesKeyword = (target: EducationReminderTarget, keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [target.engineerName, target.departmentName, target.phoneNumber, target.educationName, target.managerName]
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

function SectionHeader({ action, title }: { action?: ReactNode; title: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
      <Typography sx={{ fontWeight: 800 }} variant="h6">
        {title}
      </Typography>
      {action}
    </Box>
  );
}

export function EducationReminderTargetManagementTab({
  historyRows,
  onHistoryRowsChange,
  templates,
}: EducationReminderTargetManagementTabProps) {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const [filters, setFilters] = useState<TargetFilterState>(() => emptyFilterState());
  const [targets, setTargets] = useState<EducationReminderTarget[]>(initialTargets);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(initialTargets[0]?.id ?? null);
  const [editingTarget, setEditingTarget] = useState<EducationReminderTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EducationReminderTarget | null>(null);
  const [sendTarget, setSendTarget] = useState<EducationReminderTarget | null>(null);

  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === selectedTargetId) ?? null,
    [selectedTargetId, targets],
  );

  const filteredTargets = useMemo(
    () =>
      targets.filter((target) => {
        if (filters.status && getTargetStatus(target) !== filters.status) {
          return false;
        }
        return matchesKeyword(target, filters.keyword);
      }),
    [filters.keyword, filters.status, targets],
  );

  const summary = useMemo(() => {
    const ready = targets.filter((target) => target.status === "SCHEDULED" || target.status === "DRAFT").length;
    const sent = targets.filter((target) => target.status === "SENT").length;
    const dueSoon = targets.filter((target) => target.status !== "SENT" && daysUntil(target.dueDate) <= 30).length;
    const missingPhone = targets.filter((target) => !target.phoneNumber.trim()).length;
    return { dueSoon, missingPhone, ready, sent };
  }, [targets]);

  const columns = useMemo<GridColDef<EducationReminderTarget>[]>(
    () => [
      { field: "engineerName", headerName: "이름", width: 120 },
      { field: "departmentName", headerName: "부서", minWidth: 150, flex: 0.8 },
      { field: "phoneNumber", headerName: "전화번호", width: 150 },
      { field: "educationName", headerName: "교육명", minWidth: 220, flex: 1.1 },
      { field: "managerName", headerName: "담당자", width: 110 },
      { field: "dueDate", headerName: "이수 마감일", width: 120 },
      { field: "dueStatus", headerName: "잔여", width: 110, valueGetter: (_value, row) => renderDueLabel(row.dueDate) },
      {
        field: "status",
        headerName: "상태",
        width: 92,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Chip
            color={statusColor[row.status]}
            label={statusLabel[row.status]}
            size="small"
            variant={row.status === "DRAFT" ? "outlined" : "filled"}
          />
        ),
      },
      { field: "sendPlanDate", headerName: "발송 예정일", width: 120 },
      { field: "lastSentAt", headerName: "최종 발송일시", width: 150, valueGetter: (_value, row) => display(row.lastSentAt) },
      { field: "failureReason", headerName: "실패 사유", minWidth: 180, flex: 0.9, valueGetter: (_value, row) => display(row.failureReason) },
    ],
    [],
  );

  const onSaveTarget = (record: EducationReminderTarget) => {
    const normalized: EducationReminderTarget = {
      ...record,
      id: record.id || Math.max(0, ...targets.map((item) => item.id)) + 1,
      status: record.status === "DRAFT" ? "SCHEDULED" : record.status,
      templateId: record.templateId || templates[0]?.id || 1,
    };

    setTargets((current) => {
      const exists = current.some((item) => item.id === normalized.id);
      return exists ? current.map((item) => (item.id === normalized.id ? normalized : item)) : [normalized, ...current];
    });
    setSelectedTargetId(normalized.id);
    setEditingTarget(null);
  };

  const onSendTarget = () => {
    if (!sendTarget) {
      return;
    }

    const sentAt = nowText();
    setTargets((current) =>
      current.map((item) =>
        item.id === sendTarget.id
          ? {
              ...item,
              lastSentAt: sentAt,
              status: "SENT",
              failureReason: null,
            }
          : item,
      ),
    );
    onHistoryRowsChange([
      {
        id: Math.max(0, ...historyRows.map((item) => item.id)) + 1,
        channel: sendTarget.channel,
        departmentName: sendTarget.departmentName,
        engineerName: sendTarget.engineerName,
        failureReason: null,
        messageContent: `${sendTarget.engineerName}님 교육 이수 여부를 확인해 주십시오.`,
        phoneNumber: sendTarget.phoneNumber,
        sentAt,
        status: "SUCCESS",
        targetId: sendTarget.id,
        templateName: sendTarget.educationName,
      },
      ...historyRows,
    ]);
    setSendTarget(null);
  };

  const onDeleteTarget = () => {
    if (!deleteTarget) {
      return;
    }

    setTargets((current) => current.filter((item) => item.id !== deleteTarget.id));
    if (selectedTargetId === deleteTarget.id) {
      setSelectedTargetId(null);
    }
    setDeleteTarget(null);
  };

  if (!canRead) {
    return <Alert severity="warning">법정 필수교육 이수 알림 관리 조회 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
        <SummaryCard label="발송 대기" value={`${summary.ready}건`} />
        <SummaryCard color="warning.main" label="30일 내 마감" value={`${summary.dueSoon}건`} />
        <SummaryCard color="success.main" label="발송 완료" value={`${summary.sent}건`} />
        <SummaryCard color="error.main" label="연락처 미입력" value={`${summary.missingPhone}건`} />
      </Box>

      <SearchPanel
        keyword={filters.keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="이름, 부서, 전화번호, 교육명"
        keywordSx={{ flex: "1 1 360px", maxWidth: 560, minWidth: 260 }}
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onReset={() => setFilters(emptyFilterState())}
        onSearch={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        resetLabel="초기화"
        searchDisabled={false}
        searchLabel="조회"
      >
        <TextField
          select
          label="상태"
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as TargetFilterState["status"] }))}
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
            <SectionHeader
              action={
                <Stack direction="row" spacing={1}>
                  <Button
                  disabled={!canCreate}
                    onClick={() => setEditingTarget(emptyTarget(templates[0]?.id ?? 1))}
                    startIcon={<AddOutlinedIcon />}
                    variant="outlined"
                  >
                    신규
                  </Button>
                  <Button
                    disabled={!selectedTarget || !canUpdate}
                    onClick={() => setEditingTarget(selectedTarget)}
                    startIcon={<AddOutlinedIcon />}
                    variant="outlined"
                  >
                    수정
                  </Button>
                  <Button
                    disabled={!selectedTarget || !canUpdate}
                    onClick={() => setSendTarget(selectedTarget)}
                    startIcon={<SendOutlinedIcon />}
                    variant="contained"
                  >
                    실시간 발송
                  </Button>
                  <Button
                    color="error"
                    disabled={!selectedTarget || !canDelete}
                    onClick={() => setDeleteTarget(selectedTarget)}
                    startIcon={<DeleteOutlineOutlinedIcon />}
                    variant="outlined"
                  >
                    삭제
                  </Button>
                </Stack>
              }
              title="발송 대상 목록"
            />

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" } }}>
              <Box sx={{ minWidth: 0 }}>
                <EnterpriseDataGrid<EducationReminderTarget>
                  columns={columns}
                  getRowId={(row) => row.id}
                  hideFooterSelectedRowCount
                  onRowClick={(params: GridRowParams<EducationReminderTarget>) => setSelectedTargetId(params.row.id)}
                  onRowDoubleClick={(params: GridRowParams<EducationReminderTarget>) => setEditingTarget(params.row)}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  rows={filteredTargets}
                  showPageNumbers
                  showXlsxExportButton
                  wrapperMinHeight={620}
                  sx={{ height: 620, minWidth: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </Box>

              <Card variant="outlined" sx={{ minWidth: 0 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    선택 대상 상세
                  </Typography>
                  <Divider />
                  {!selectedTarget ? (
                    <Alert severity="info">발송 대상을 선택하세요.</Alert>
                  ) : (
                    <Stack spacing={1.25}>
                      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                        <DetailItem label="이름" value={selectedTarget.engineerName} />
                        <DetailItem label="부서" value={selectedTarget.departmentName} />
                        <DetailItem label="전화번호" value={selectedTarget.phoneNumber} />
                        <DetailItem label="담당자" value={selectedTarget.managerName} />
                        <DetailItem label="교육명" value={selectedTarget.educationName} />
                        <DetailItem label="상태" value={statusLabel[selectedTarget.status]} />
                        <DetailItem label="이수 마감일" value={selectedTarget.dueDate} />
                        <DetailItem label="발송 예정일" value={selectedTarget.sendPlanDate} />
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip label={renderDueLabel(selectedTarget.dueDate)} size="small" variant="outlined" />
                        <Chip label={display(selectedTarget.lastSentAt)} size="small" variant="outlined" />
                        <Chip color={selectedTarget.active ? "success" : "default"} label={selectedTarget.active ? "대상 포함" : "대상 제외"} size="small" variant={selectedTarget.active ? "filled" : "outlined"} />
                      </Box>
                      <TextField
                        label="실패 사유"
                        multiline
                        minRows={3}
                        size="small"
                        sx={{ width: "100%" }}
                        value={display(selectedTarget.failureReason)}
                        slotProps={{ input: { readOnly: true } }}
                      />
                      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                        <DetailItem label="최근 발송" value={display(selectedTarget.lastSentAt)} />
                        <DetailItem label="발송 이력" value={`${historyRows.filter((row) => !selectedTargetId || row.targetId === selectedTargetId).length}건`} />
                      </Box>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <EducationReminderTargetDialog
        key={`target-${editingTarget?.id ?? "new"}-${Boolean(editingTarget)}`}
        onClose={() => setEditingTarget(null)}
        onSave={onSaveTarget}
        open={Boolean(editingTarget)}
        record={editingTarget ?? emptyTarget(templates[0]?.id ?? 1)}
        templates={templates}
      />

      <ConfirmActionDialog
        confirmColor="primary"
        confirmLabel="발송"
        message="선택한 대상에게 교육 이수 알림을 즉시 발송하시겠습니까?"
        open={Boolean(sendTarget)}
        title="실시간 발송"
        onClose={() => setSendTarget(null)}
        onConfirm={onSendTarget}
      />

      <ConfirmDeleteDialog
        message="선택한 발송 대상을 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        title="발송 대상 삭제"
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDeleteTarget}
      />
    </Stack>
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
