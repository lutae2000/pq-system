"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
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
import { useMemo, useState } from "react";

import { AuditFields } from "@/components/common/AuditFields";
import { standardFieldSx } from "@/components/common/FormControls";

import {
  channelLabel,
  emptyBasicInfo,
  emptyTemplate,
  type EducationReminderBasicInfoRequest,
  type EducationReminderTemplateRequest,
} from "../types";

type BasicInfoDialogProps = {
  open: boolean;
  record: EducationReminderBasicInfoRequest | null;
  onClose: () => void;
  onSave: (record: EducationReminderBasicInfoRequest) => void;
};

type TemplateDialogProps = {
  open: boolean;
  record: EducationReminderTemplateRequest | null;
  onClose: () => void;
  onSave: (record: EducationReminderTemplateRequest) => void;
  audit?: {
    createdAt?: string | null;
    createdBy?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
  } | null;
};

export function EducationReminderBasicInfoDialog({ open, record, onClose, onSave }: BasicInfoDialogProps) {
  const [form, setForm] = useState<EducationReminderBasicInfoRequest>(() => record ?? emptyBasicInfo());

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            교육 알림 기초 정보
          </Typography>
        </Box>
        <Button color="inherit" onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          닫기
        </Button>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
            <TextField
              label="코드"
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              required
              size="small"
              sx={standardFieldSx}
              value={form.code}
            />
            <TextField
              label="교육명"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              size="small"
              sx={standardFieldSx}
              value={form.name}
            />
            <TextField
              label="주기 단위"
              onChange={(event) => setForm((current) => ({ ...current, cycleUnit: event.target.value as EducationReminderBasicInfoRequest["cycleUnit"] }))}
              select
              size="small"
              sx={standardFieldSx}
              value={form.cycleUnit}
            >
              <MenuItem value="YEAR">년</MenuItem>
              <MenuItem value="MONTH">개월</MenuItem>
            </TextField>
            <TextField
              label="주기 값"
              onChange={(event) => setForm((current) => ({ ...current, cycleValue: Number(event.target.value) || 0 }))}
              required
              size="small"
              sx={standardFieldSx}
              type="number"
              value={form.cycleValue}
            />
            <TextField
              label="설명"
              multiline
              minRows={4}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              size="small"
              sx={{ ...standardFieldSx, gridColumn: "1 / -1" }}
              value={form.description ?? ""}
            />
          </Box>

          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Switch checked={form.active} onChange={(_event, checked) => setForm((current) => ({ ...current, active: checked }))} />
            <Typography variant="body2">사용</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          취소
        </Button>
        <Button
          onClick={() => onSave({ ...form, code: form.code.trim(), name: form.name.trim(), description: form.description?.trim() || "" })}
          startIcon={<SaveOutlinedIcon />}
          variant="contained"
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function EducationReminderTemplateDialog({ audit, open, record, onClose, onSave }: TemplateDialogProps) {
  const [form, setForm] = useState<EducationReminderTemplateRequest>(() => record ?? emptyTemplate());

  const channelText = useMemo(() => channelLabel[form.channel], [form.channel]);

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            교육 알림 템플릿
          </Typography>
          <Typography color="text.secondary" variant="body2">
            발송 문구와 채널을 관리합니다.
          </Typography>
        </Box>
        <Button color="inherit" onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          닫기
        </Button>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
            <TextField
              label="템플릿명"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              size="small"
              sx={standardFieldSx}
              value={form.name}
            />
            <TextField
              label="채널"
              onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value as EducationReminderTemplateRequest["channel"] }))}
              select
              size="small"
              sx={standardFieldSx}
              value={form.channel}
            >
              <MenuItem value="LMS">LMS</MenuItem>
              <MenuItem value="SMS">SMS</MenuItem>
              <MenuItem value="KAKAO">카카오 알림톡</MenuItem>
            </TextField>
            <TextField
              label="제목"
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
              size="small"
              sx={{ ...standardFieldSx, gridColumn: "1 / -1" }}
              value={form.title}
            />
            <TextField
              label="설명"
              multiline
              minRows={3}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              size="small"
              sx={{ ...standardFieldSx, gridColumn: "1 / -1" }}
              value={form.description ?? ""}
            />
            <TextField
              label="본문"
              multiline
              minRows={8}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              required
              size="small"
              sx={{ ...standardFieldSx, gridColumn: "1 / -1" }}
              value={form.content}
            />
          </Box>

          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Switch checked={form.active} onChange={(_event, checked) => setForm((current) => ({ ...current, active: checked }))} />
            <Typography variant="body2">사용</Typography>
            <Typography color="text.secondary" variant="body2">
              현재 채널: {channelText}
            </Typography>
          </Box>

          <AuditFields
            createdAt={audit?.createdAt}
            createdBy={audit?.createdBy}
            updatedAt={audit?.updatedAt}
            updatedBy={audit?.updatedBy}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          취소
        </Button>
        <Button
          onClick={() =>
            onSave({
              ...form,
              content: form.content.trim(),
              description: form.description?.trim() || "",
              name: form.name.trim(),
              title: form.title.trim(),
            })
          }
          startIcon={<SaveOutlinedIcon />}
          variant="contained"
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
