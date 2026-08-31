"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
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
    field: "phoneNo",
    flex: 0.9,
    headerName: "전화번호",
    minWidth: 120,
    valueFormatter: (value) => formatPhoneNo(String(value ?? "")),
  },
  { field: "targetEducationNames", flex: 1.2, headerName: "교육명", minWidth: 150 },
  { field: "scheduledEducation1", flex: 0.9, headerName: "교육 예정일1", minWidth: 110 },
  { field: "scheduledEducation2", flex: 0.9, headerName: "교육 예정일2", minWidth: 110 },
];

const renderPreviewMessage = (templateContent: string, target: EducationReminderSendDialogTarget) => {
  const educationName = target.targetEducationNames?.trim() || "교육알림";
  return (templateContent || "")
    .replaceAll("{대상자명}", target.name || "")
    .replaceAll("{이름}", target.name || "")
    .replaceAll("{부서명}", target.department || "")
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
  const firstTemplateId = templates.find((template) => template.active)?.id ?? templates[0]?.id ?? 0;
  const [templateId, setTemplateId] = useState<number>(firstTemplateId);
  const [manualMode, setManualMode] = useState(false);
  const [manualContent, setManualContent] = useState("");
  const [testPhoneNo, setTestPhoneNo] = useState("");
  const [selectedTargetRowKey, setSelectedTargetRowKey] = useState<string | null>(null);
  const selectedTarget = targets.find((target) => target.rowKey === selectedTargetRowKey) ?? targets[0];
  const defaultTestPhoneNo = formatPhoneNo(selectedTarget?.phoneNo ?? "");
  const isTestPhoneNo = Boolean(testPhoneNo && testPhoneNo !== defaultTestPhoneNo);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? templates[0] ?? null,
    [templateId, templates],
  );
  const previewTarget = selectedTarget ?? null;
  const previewMessage = useMemo(() => {
    const content = manualMode ? manualContent : selectedTemplate?.content ?? "";
    return previewTarget ? renderPreviewMessage(content, previewTarget) : content;
  }, [manualContent, manualMode, previewTarget, selectedTemplate]);
  const previewByteLength = useMemo(() => getSmsByteLength(previewMessage), [previewMessage]);
  const selectedChannel = previewByteLength > SMS_MAX_BYTES ? "LMS" : manualMode ? "SMS" : selectedTemplate?.channel ?? "-";
  const canSend = targets.length > 0 && (manualMode ? Boolean(manualContent.trim()) : Boolean(selectedTemplate));

  const handleSend = async (testSend: boolean) => {
    await onSend({
      manualChannel: manualMode ? selectedChannel as "LMS" | "SMS" : undefined,
      manualContent: manualMode ? manualContent : undefined,
      targetRowKeys: testSend && selectedTarget ? [selectedTarget.rowKey] : undefined,
      templateId: manualMode ? undefined : selectedTemplate?.id ?? templateId,
      testPhoneNo: testSend ? testPhoneNo.replace(/\D/g, "") : undefined,
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
      <DialogTitle>교육알림 발송</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography color="text.secondary" variant="body2">
            {isTestPhoneNo
              ? "수신 전화번호가 변경되어 테스트 발송 전화번호로 입력된 항목 1건만 발송됩니다."
              : `선택된 대상 ${targets.length}건에 대해 발송합니다. 수신 전화번호를 변경하면 테스트 발송으로 전환됩니다.`}
          </Typography>

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
              {manualMode ? "수기 입력" : "템플릿 사용"}
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.5fr) minmax(300px, 1fr)" } }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography color="text.secondary" sx={{ mb: 1 }} variant="subtitle2">
                발송 대상
              </Typography>
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
                  gridTemplateColumns: manualMode ? "minmax(88px, 0.4fr) minmax(0, 1fr)" : "minmax(300px, 1.8fr) minmax(0, 1fr)",
                }}
              >
                {manualMode ? (
                  <TextField disabled label="발송 채널" size="small" value={selectedChannel} />
                ) : (
                  <TextField
                    select
                    label="발송 템플릿"
                    onChange={(event) => setTemplateId(Number(event.target.value))}
                    size="small"
                    value={templateId}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} {template.channel ? `(${template.channel})` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
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
                  label="수기 입력 문구"
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
          disabled={loading || !canSend}
          onClick={() => void handleSend(isTestPhoneNo)}
          sx={{ ml: 1 }}
          variant="contained"
        >
          {isTestPhoneNo ? "테스트 발송" : "발송"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
