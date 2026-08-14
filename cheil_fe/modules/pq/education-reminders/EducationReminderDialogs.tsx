"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import { standardFieldSx } from "@/components/common/FormControls";
import {
  emptyTarget,
  emptyTemplate,
  fillTemplate,
  nowText,
  numberValue,
  text,
  type EducationReminderTarget,
  type MessageTemplate,
  type SendChannel,
} from "@/modules/pq/education-reminders/educationReminderTypes";

type EducationReminderTargetDialogProps = {
  onClose: () => void;
  onSave: (record: EducationReminderTarget) => void;
  open: boolean;
  record: EducationReminderTarget | null;
  templates: MessageTemplate[];
};

type EducationReminderTemplateDialogProps = {
  onClose: () => void;
  onSave: (record: MessageTemplate) => void;
  open: boolean;
  previewTarget?: EducationReminderTarget | null;
  record: MessageTemplate | null;
};

const toNumberOrNull = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export function EducationReminderTargetDialog({ onClose, onSave, open, record, templates }: EducationReminderTargetDialogProps) {
  const activeTemplates = useMemo(() => templates.filter((template) => template.active), [templates]);
  const [form, setForm] = useState<EducationReminderTarget>(() => record ?? emptyTarget(activeTemplates[0]?.id ?? 1));

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.templateId) ?? activeTemplates[0] ?? templates[0] ?? emptyTemplate(),
    [activeTemplates, form.templateId, templates],
  );

  const previewMessage = useMemo(() => fillTemplate(selectedTemplate.content, form), [form, selectedTemplate.content]);

  const handleSave = () => {
    onSave({
      ...form,
      channel: selectedTemplate.channel,
    });
  };

  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            발송 대상 입력
          </Typography>
          <Typography color="text.secondary" variant="body2">
            교육 이수 마감 알림을 보낼 사람과 발송 시점을 등록합니다.
          </Typography>
        </Box>
        <Button color="inherit" onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          닫기
        </Button>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
            <TextField label="이름" onChange={(event) => setForm((current) => ({ ...current, engineerName: event.target.value }))} required size="small" sx={standardFieldSx} value={text(form.engineerName)} />
            <TextField label="부서" onChange={(event) => setForm((current) => ({ ...current, departmentName: event.target.value }))} required size="small" sx={standardFieldSx} value={text(form.departmentName)} />
            <TextField label="연락처" onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} required size="small" sx={standardFieldSx} value={text(form.phoneNumber)} />
            <TextField label="담당자" onChange={(event) => setForm((current) => ({ ...current, managerName: event.target.value }))} size="small" sx={standardFieldSx} value={text(form.managerName)} />
            <TextField
              label="교육명"
              onChange={(event) => setForm((current) => ({ ...current, educationName: event.target.value }))}
              required
              size="small"
              sx={{ ...standardFieldSx, gridColumn: "1 / -1" }}
              value={text(form.educationName)}
            />
            <TextField
              label="템플릿"
              onChange={(event) => {
                const templateId = Number(event.target.value);
                const nextTemplate = templates.find((template) => template.id === templateId);
                setForm((current) => ({ ...current, channel: nextTemplate?.channel ?? current.channel, templateId }));
              }}
              required
              select
              size="small"
              sx={{ ...standardFieldSx, gridColumn: "1 / -1" }}
              value={form.templateId}
            >
              {activeTemplates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name} / {template.channel}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="이수 마감일"
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              required
              size="small"
              sx={standardFieldSx}
              type="date"
              value={form.dueDate}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="발송 예정일"
              onChange={(event) => setForm((current) => ({ ...current, sendPlanDate: event.target.value }))}
              required
              size="small"
              sx={standardFieldSx}
              type="date"
              value={form.sendPlanDate}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField disabled label="발송 채널" size="small" sx={standardFieldSx} value={selectedTemplate.channel} />
            <TextField
              label="상태"
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as EducationReminderTarget["status"] }))}
              select
              size="small"
              sx={standardFieldSx}
              value={form.status}
            >
              <MenuItem value="DRAFT">작성중</MenuItem>
              <MenuItem value="SCHEDULED">예약</MenuItem>
              <MenuItem value="PAUSED">중지</MenuItem>
              <MenuItem value="SENT">완료</MenuItem>
              <MenuItem value="FAILED">실패</MenuItem>
            </TextField>
            <TextField
              label="마감 며칠 전 발송"
              onChange={(event) => setForm((current) => ({ ...current, reminderDaysBefore: toNumberOrNull(event.target.value) ?? 0 }))}
              size="small"
              sx={standardFieldSx}
              type="number"
              value={numberValue(form.reminderDaysBefore)}
            />
            <TextField
              label="실패 재시도 횟수"
              onChange={(event) => setForm((current) => ({ ...current, retryCount: toNumberOrNull(event.target.value) ?? 0 }))}
              size="small"
              sx={standardFieldSx}
              type="number"
              value={numberValue(form.retryCount)}
            />
          </Box>

          <FormControlLabel control={<Switch checked={form.active} onChange={(_event, checked) => setForm((current) => ({ ...current, active: checked }))} />} label="배치 발송 대상에 포함" />

          <Alert severity="info">선택한 템플릿이 대상에 자동 적용됩니다.</Alert>

          <TextField label="미리보기" multiline minRows={6} size="small" sx={standardFieldSx} value={previewMessage} slotProps={{ input: { readOnly: true } }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          취소
        </Button>
        <Button onClick={handleSave} startIcon={<SaveOutlinedIcon />} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function EducationReminderTemplateDialog({
  onClose,
  onSave,
  open,
  previewTarget,
  record,
}: EducationReminderTemplateDialogProps) {
  const [form, setForm] = useState<MessageTemplate>(() => record ?? emptyTemplate());

  const previewMessage = useMemo(() => fillTemplate(form.content, previewTarget ?? emptyTarget()), [form.content, previewTarget]);

  const handleSave = () => {
    onSave({
      ...form,
      updatedAt: form.updatedAt || nowText(),
    });
  };

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            발송 템플릿 입력
          </Typography>
          <Typography color="text.secondary" variant="body2">
            공통 문구를 등록하고 대상 정보로 미리보기를 확인합니다.
          </Typography>
        </Box>
        <Button color="inherit" onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          닫기
        </Button>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
            <TextField label="템플릿명" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required size="small" sx={standardFieldSx} value={text(form.name)} />
            <TextField label="채널" onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value as SendChannel }))} select size="small" sx={standardFieldSx} value={form.channel}>
              <MenuItem value="LMS">LMS</MenuItem>
              <MenuItem value="SMS">SMS</MenuItem>
            </TextField>
            <TextField label="제목" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} size="small" sx={{ ...standardFieldSx, gridColumn: "1 / -1" }} value={text(form.title)} />
            <TextField label="설명" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} size="small" sx={{ ...standardFieldSx, gridColumn: "1 / -1" }} value={text(form.description)} />
          </Box>

          <FormControlLabel control={<Switch checked={form.active} onChange={(_event, checked) => setForm((current) => ({ ...current, active: checked }))} />} label="사용" />

          <TextField label="내용" onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} multiline minRows={8} required size="small" sx={standardFieldSx} value={text(form.content)} />

          <Alert severity="info">사용 가능 변수: {"{이름}"}, {"{부서}"}, {"{교육명}"}, {"{마감일}"}, {"{남은일수}"}</Alert>

          <TextField label="미리보기" multiline minRows={6} size="small" sx={standardFieldSx} value={previewMessage} slotProps={{ input: { readOnly: true } }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          취소
        </Button>
        <Button onClick={handleSave} startIcon={<SaveOutlinedIcon />} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
