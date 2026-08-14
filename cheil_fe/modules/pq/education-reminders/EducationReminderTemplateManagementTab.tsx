"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { EducationReminderTemplateDialog } from "@/modules/pq/education-reminders/EducationReminderDialogs";
import {
  display,
  emptyTarget,
  emptyTemplate,
  fillTemplate,
  type EducationReminderTarget,
  type MessageTemplate,
} from "@/modules/pq/education-reminders/educationReminderTypes";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

type EducationReminderTemplateManagementTabProps = {
  templates: MessageTemplate[];
  onTemplatesChange: (nextTemplates: MessageTemplate[]) => void;
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

export function EducationReminderTemplateManagementTab({ onTemplatesChange, templates }: EducationReminderTemplateManagementTabProps) {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(templates[0]?.id ?? null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const columns = useMemo<GridColDef<MessageTemplate>[]>(
    () => [
      { field: "name", headerName: "템플릿명", minWidth: 220, flex: 1 },
      { field: "title", headerName: "제목", minWidth: 180, flex: 0.9 },
      { field: "channel", headerName: "채널", width: 90 },
      { field: "description", headerName: "설명", minWidth: 220, flex: 1 },
      {
        field: "active",
        headerName: "사용",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Chip color={row.active ? "success" : "default"} label={row.active ? "Y" : "N"} size="small" variant={row.active ? "filled" : "outlined"} />
        ),
      },
      { field: "updatedAt", headerName: "수정일시", width: 150, valueGetter: (_value, row) => display(row.updatedAt) },
    ],
    [],
  );

  const updateTemplates = (nextTemplate: MessageTemplate) => {
    onTemplatesChange(
      templates.some((item) => item.id === nextTemplate.id)
        ? templates.map((item) => (item.id === nextTemplate.id ? nextTemplate : item))
        : [nextTemplate, ...templates],
    );
    setSelectedTemplateId(nextTemplate.id);
  };

  const handleSaveTemplate = (record: MessageTemplate) => {
    const normalized = {
      ...record,
      id: record.id || Math.max(0, ...templates.map((item) => item.id)) + 1,
      updatedAt: record.updatedAt || new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    updateTemplates(normalized);
    setEditingTemplate(null);
  };

  const onDelete = () => {
    if (!deleteTarget) {
      return;
    }

    onTemplatesChange(templates.filter((item) => item.id !== deleteTarget.id));
    if (selectedTemplateId === deleteTarget.id) {
      setSelectedTemplateId(null);
    }
    setDeleteTarget(null);
  };

  const previewTarget: EducationReminderTarget | null = selectedTemplate
    ? {
        ...emptyTarget(),
        channel: selectedTemplate.channel,
        educationName: "법정 필수교육",
        engineerName: "홍길동",
        departmentName: "관리부",
        dueDate: "2026-09-30",
      }
    : null;

  if (!canRead) {
    return <Alert severity="warning">법정 필수교육 템플릿 관리 조회 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
        <SummaryCard label="사용" value={`${templates.filter((item) => item.active).length}건`} />
        <SummaryCard color="text.secondary" label="미사용" value={`${templates.filter((item) => !item.active).length}건`} />
        <SummaryCard color="success.main" label="LMS" value={`${templates.filter((item) => item.channel === "LMS").length}건`} />
        <SummaryCard color="warning.main" label="SMS" value={`${templates.filter((item) => item.channel === "SMS").length}건`} />
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                템플릿 관리
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button disabled={!canCreate} onClick={() => setEditingTemplate(emptyTemplate())} startIcon={<AddOutlinedIcon />} variant="outlined">
                  신규
                </Button>
                <Button
                  disabled={!selectedTemplate || !canUpdate}
                  onClick={() => setEditingTemplate(selectedTemplate)}
                  startIcon={<EditOutlinedIcon />}
                  variant="outlined"
                >
                  수정
                </Button>
                <Button color="error" disabled={!selectedTemplate || !canDelete} onClick={() => setDeleteTarget(selectedTemplate)} startIcon={<DeleteOutlineOutlinedIcon />} variant="outlined">
                  삭제
                </Button>
              </Stack>
            </Box>

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" } }}>
              <Box sx={{ minWidth: 0 }}>
                <EnterpriseDataGrid<MessageTemplate>
                  columns={columns}
                  getRowId={(row) => row.id}
                  hideFooterSelectedRowCount
                  onRowClick={(params: GridRowParams<MessageTemplate>) => setSelectedTemplateId(params.row.id)}
                  onRowDoubleClick={(params: GridRowParams<MessageTemplate>) => setEditingTemplate(params.row)}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  rows={templates}
                  showPageNumbers
                  showXlsxExportButton
                  wrapperMinHeight={620}
                  sx={{ height: 620, minWidth: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </Box>

              <Card variant="outlined" sx={{ minWidth: 0 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    템플릿 상세
                  </Typography>
                  <Divider />
                  {!selectedTemplate ? (
                    <Alert severity="info">템플릿을 선택하세요.</Alert>
                  ) : (
                    <Stack spacing={1.25}>
                      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                        <DetailItem label="템플릿명" value={selectedTemplate.name} />
                        <DetailItem label="채널" value={selectedTemplate.channel} />
                        <DetailItem label="제목" value={selectedTemplate.title} />
                        <DetailItem label="사용여부" value={selectedTemplate.active ? "사용" : "미사용"} />
                        <DetailItem label="수정일시" value={selectedTemplate.updatedAt} />
                        <DetailItem label="설명" value={selectedTemplate.description} />
                      </Box>
                      <Chip color={selectedTemplate.active ? "success" : "default"} label={selectedTemplate.active ? "사용" : "미사용"} size="small" variant={selectedTemplate.active ? "filled" : "outlined"} />
                      <TextField
                        label="미리보기"
                        multiline
                        minRows={6}
                        size="small"
                        sx={{ width: "100%" }}
                        value={fillTemplate(selectedTemplate.content, previewTarget ?? emptyTarget())}
                        slotProps={{ input: { readOnly: true } }}
                      />
                      <TextField
                        label="내용"
                        multiline
                        minRows={8}
                        size="small"
                        sx={{ width: "100%" }}
                        value={selectedTemplate.content}
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

      <EducationReminderTemplateDialog
        key={`template-${editingTemplate?.id ?? "new"}-${Boolean(editingTemplate)}`}
        onClose={() => setEditingTemplate(null)}
        onSave={handleSaveTemplate}
        open={Boolean(editingTemplate)}
        previewTarget={previewTarget}
        record={editingTemplate ?? emptyTemplate()}
      />

      <ConfirmDeleteDialog
        message="선택한 템플릿을 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        title="템플릿 삭제"
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
      />
    </Stack>
  );
}
