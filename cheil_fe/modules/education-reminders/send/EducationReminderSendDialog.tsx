"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Switch,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";

import { getClosestEducationDeadline, type EducationReminderSendDialogTarget, type EducationReminderSendTemplate } from "./types";

type EducationReminderSendDialogProps = {
  loading?: boolean;
  open: boolean;
  targets: EducationReminderSendDialogTarget[];
  templates: EducationReminderSendTemplate[];
  onClose: () => void;
  onSend: (request: { manualChannel?: "LMS" | "SMS"; manualContent?: string; targetRowKeys?: string[]; templateId?: number; testPhoneNo?: string; testSend: boolean }) => Promise<void> | void;
};

const SMS_MAX_BYTES = 90;

const formatPhoneNo = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const getSmsByteLength = (value: string) =>
  Array.from(value).reduce((total, character) => total + (character.charCodeAt(0) > 0x7f ? 2 : 1), 0);

const targetColumns: GridColDef<EducationReminderSendDialogTarget>[] = [
  { field: "department", flex: 0.8, headerName: "부서명", minWidth: 90 },
  { field: "name", flex: 0.55, headerName: "이름", minWidth: 70 },
  { field: "grade", flex: 0.55, headerName: "직위", minWidth: 70 },
  {
    field: "templateName",
    flex: 1,
    headerName: "발송 템플릿",
    minWidth: 150,
    renderCell: ({ row }) => row.templateStatus === "ASSIGNED"
      ? row.templateName
      : <Chip color={row.templateStatus === "MIXED" ? "error" : "warning"} label={row.templateStatus === "MIXED" ? "교육별 템플릿 상이" : "미지정"} size="small" variant="outlined" />,
  },
  {
    field: "phoneNo",
    flex: 0.9,
    headerName: "전화번호",
    minWidth: 120,
    valueFormatter: (value) => formatPhoneNo(String(value ?? "")),
  },
    { field: "targetEducationNames", flex: 1.2, headerName: "교육명", minWidth: 150 },
  { field: "scheduledEducation1", flex: 0.9, headerName: "교육 예정일", minWidth: 110 },
  { field: "scheduledEducation2", flex: 0.9, headerName: "교육 예정일", minWidth: 110 },
];

const renderPreviewMessage = (templateContent: string, target: EducationReminderSendDialogTarget) => {
  const educationName = target.targetEducationNames?.trim() || "교육 알림";
  return (templateContent || "")
    .replaceAll("{수령자명}", target.name || "")
    .replaceAll("{이름}", target.name || "")
    .replaceAll("{부서명}", target.department || "")
    .replaceAll("{직위}", target.grade || "")
    .replaceAll("{교육명}", educationName)
    .replaceAll("{교육이름}", educationName)
    .replaceAll("{마감일}", target.deadline || getClosestEducationDeadline([target.scheduledEducation1, target.scheduledEducation2]))
    .replaceAll("{전화번호}", target.phoneNo || "")
    .trim();
};

export function EducationReminderSendDialog({
  loading = false,
  open,
  targets,
  templates,
  onClose,
  onSend,
}: EducationReminderSendDialogProps) {
  const [manualMode, setManualMode] = useState(false);
  const [manualContent, setManualContent] = useState("");
  const [testPhoneNo, setTestPhoneNo] = useState("");
  const [selectedTargetRowKey, setSelectedTargetRowKey] = useState<string | null>(null);
  const selectedTarget = targets.find((target) => target.rowKey === selectedTargetRowKey) ?? targets[0];
  const defaultTestPhoneNo = formatPhoneNo(selectedTarget?.phoneNo ?? "");
  const isTestPhoneNo = Boolean(testPhoneNo && testPhoneNo !== defaultTestPhoneNo);
  const canTestSend = Boolean(selectedTargetRowKey) && isTestPhoneNo && Boolean(testPhoneNo.replace(/\D/g, ""));

  const selectedTemplate = useMemo(
    () => selectedTarget?.templateId == null ? null : templates.find((template) => template.id === selectedTarget.templateId) ?? null,
    [selectedTarget, templates],
  );
  const hasSingleAssignedTemplate = targets.length > 0
    && targets.every((target) => target.templateStatus === "ASSIGNED" && target.templateId === selectedTemplate?.id);
  const hasTemplateMismatch = targets.length > 0
    && new Set(targets.map((target) => target.templateId).filter((templateId): templateId is number => templateId !== null)).size > 1;
  const hasUnassignedTemplate = targets.some((target) => target.templateStatus === "UNASSIGNED");
  const hasMixedTemplate = targets.some((target) => target.templateStatus === "MIXED");
  const templateWarning = hasMixedTemplate || hasTemplateMismatch
    ? "한 대상자에게 서로 다른 교육 템플릿이 선택되었습니다. 같은 템플릿의 교육만 선택해 주세요."
    : hasUnassignedTemplate
      ? "선택한 교육에 발송 템플릿이 지정되지 않았습니다. 기초 정보 관리에서 템플릿을 지정해 주세요."
      : selectedTemplate && !selectedTemplate.active
        ? "선택한 발송 템플릿이 미사용 상태입니다. 템플릿 관리에서 사용 상태를 확인해 주세요."
        : templates.length > 0 && !selectedTemplate && targets.some((target) => target.templateStatus === "ASSIGNED")
          ? "연결된 발송 템플릿을 찾을 수 없습니다. 템플릿 연결 상태를 확인해 주세요."
          : null;
  const previewTarget = selectedTarget ?? null;
  const previewMessage = useMemo(() => {
    const content = manualMode ? manualContent : selectedTemplate?.content ?? "";
    return previewTarget ? renderPreviewMessage(content, previewTarget) : content;
  }, [manualContent, manualMode, previewTarget, selectedTemplate]);
  const previewByteLength = useMemo(() => getSmsByteLength(previewMessage), [previewMessage]);
  const selectedChannel = previewByteLength > SMS_MAX_BYTES ? "LMS" : manualMode ? "SMS" : selectedTemplate?.channel ?? "-";
  const canSend = targets.length > 0 && (manualMode ? Boolean(manualContent.trim()) : Boolean(selectedTemplate?.active) && hasSingleAssignedTemplate);

  const handleSend = async (testSend: boolean) => {
    const normalizedTestPhoneNo = testPhoneNo.replace(/\D/g, "");
    if (testSend && (!selectedTargetRowKey || !normalizedTestPhoneNo)) {
      return;
    }

    await onSend({
      manualChannel: manualMode ? selectedChannel as "LMS" | "SMS" : undefined,
      manualContent: manualMode ? manualContent : undefined,
      targetRowKeys: testSend ? [selectedTargetRowKey!] : undefined,
      templateId: manualMode ? undefined : selectedTemplate?.id,
      testPhoneNo: testSend ? normalizedTestPhoneNo : undefined,
      testSend,
    });
  };

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={loading ? undefined : onClose}
      open={open}
      sx={{
        "& .MuiDialog-paper": {
          margin: { xs: 1.5, sm: 2 },
          maxWidth: "calc(100vw - 24px)",
          width: { xs: "calc(100vw - 24px)", sm: 1280 },
        },
      }}
    >
      <DialogTitle>교육 알림 발송</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography color="text.secondary" variant="body2">
            {isTestPhoneNo
              ? "수신 전화번호가 변경되어 테스트 전화번호로 1건만 발송합니다."
              : `선택한 ${targets.length}건에 대해 발송합니다. 수신 전화번호를 변경하면 테스트 발송으로 전환됩니다.`}
          </Typography>
          {!manualMode && templateWarning && <Alert severity="warning">{templateWarning}</Alert>}

          <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, width: "fit-content" }}>
            <Switch
              checked={manualMode}
              onChange={(event) => {
                const nextManualMode = event.target.checked;
                setManualMode(nextManualMode);
                if (nextManualMode && !testPhoneNo && defaultTestPhoneNo) {
                  setTestPhoneNo(defaultTestPhoneNo);
                }
              }}
              size="small"
            />
            <Typography color="text.secondary" variant="body2">
              {manualMode ? "직접 입력" : "템플릿 사용"}
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.5fr) minmax(300px, 1fr)" } }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography color="text.secondary" sx={{ mb: 1 }} variant="subtitle2">
                발송 대상</Typography>
              <EnterpriseDataGrid<EducationReminderSendDialogTarget>
                columns={targetColumns}
                disableColumnMenu
                disableRowSelectionOnClick
                getRowId={(row) => row.rowKey}
                readOnly
                rows={targets}
                rowHeight={44}
                onRowClick={(params) => {
                  setSelectedTargetRowKey(params.row.rowKey);
                  setTestPhoneNo(formatPhoneNo(params.row.phoneNo ?? ""));
                }}
                showPageInfo={false}
                showPageNumbers
                showToolbar={false}
                showXlsxExportButton={false}
                showPrintButton={false}
                wrapperMinHeight={300}
                sx={{
                  "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word" },
                  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, whiteSpace: "normal" },
                  minWidth: 0,
                  width: "100%",
                }}
              />
            </Box>
            <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: manualMode ? "minmax(88px, 0.4fr) minmax(0, 1fr)" : "1fr",
                }}
              >
                {manualMode && <TextField disabled label="발송 채널" size="small" value={selectedChannel} />}
                <TextField
                  label={isTestPhoneNo ? "테스트 전화번호" : "수신 전화번호"}
                  onChange={(event) => setTestPhoneNo(formatPhoneNo(event.target.value))}
                  placeholder="010-0000-0000"
                  size="small"
                  value={testPhoneNo}
                />
              </Box>
              {manualMode ? (
                <TextField
                  label="직접 입력 문구"
                  multiline
                  minRows={8}
                  onChange={(event) => setManualContent(event.target.value)}
                  placeholder="발송할 문구를 입력하세요."
                  size="small"
                  sx={{
                    "& .MuiInputBase-inputMultiline": { overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
                    "& .MuiInputBase-root": { alignItems: "flex-start", height: "100%" },
                    display: "flex",
                    flex: 1,
                    minHeight: 0,
                  }}
                  value={manualContent}
                  helperText={`${previewByteLength} / ${SMS_MAX_BYTES} bytes${previewByteLength > SMS_MAX_BYTES ? " · 90바이트 초과 시 LMS로 발송" : ""}`}
                  slotProps={{
                    formHelperText: {
                      sx: {
                        color: previewByteLength > SMS_MAX_BYTES ? "info.main" : "text.disabled",
                        textAlign: "right",
                      },
                    },
                  }}
                />
              ) : (
                <TextField
                  key={`preview-${selectedTemplate?.id ?? "none"}`}
                  label="발송 예시 문구"
                  multiline
                  minRows={8}
                  size="small"
                  sx={{
                    "& .MuiInputBase-inputMultiline": { overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
                    "& .MuiInputBase-root": { alignItems: "flex-start", height: "100%" },
                    display: "flex",
                    flex: 1,
                    minHeight: 0,
                  }}
                  value={previewMessage}
                  helperText={`${previewByteLength} / ${SMS_MAX_BYTES} bytes${previewByteLength > SMS_MAX_BYTES ? " · 90바이트 초과 시 LMS로 발송" : ""}`}
                  slotProps={{
                    formHelperText: {
                      sx: {
                        color: previewByteLength > SMS_MAX_BYTES ? "error.main" : "text.disabled",
                        textAlign: "right",
                      },
                    },
                    input: { readOnly: true },
                  }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ gap: 1.5 }}>
        <Button disabled={loading} onClick={onClose} variant="outlined">
          취소
        </Button>
        <Button
          disabled={loading || !canSend || !canTestSend || !selectedTarget}
          onClick={() => void handleSend(true)}
          variant="outlined"
        >
          테스트 발송
        </Button>
        <Button
          disabled={loading || !canSend || isTestPhoneNo}
          onClick={() => void handleSend(false)}
          sx={{ ml: 1 }}
          variant="contained"
        >
          발송
        </Button>
      </DialogActions>
    </Dialog>
  );
}
