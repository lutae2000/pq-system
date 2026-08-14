"use client";

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
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

import type { CertificationUpsertRequest } from "./certificates.types";

type CertificationEditorDialogProps = {
  open: boolean;
  editingCode: string | null;
  draft: CertificationUpsertRequest;
  onDraftChange: (next: CertificationUpsertRequest) => void;
  onClose: () => void;
  onSave: () => void;
  savePending?: boolean;
};

const fieldSx = {
  ...standardFieldSx,
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    py: 1.1,
  },
} as const;

const MAX_CERT_CODE = 20;
const MAX_CERT_NAME = 200;
const MAX_SATIS_CODE = 20;
const MAX_SATIS_NAME = 200;

const certKindOptions = [
  { value: "1", label: "기능사" },
  { value: "2", label: "산업기사" },
  { value: "3", label: "기사" },
  { value: "4", label: "기술사" },
] as const;

type FieldErrorState = {
  certCode?: string;
  certName?: string;
  satisCode?: string;
  satisName?: string;
};

const normalizeText = (value: string | null | undefined) => (value ?? "").trim();

export function CertificationEditorDialog({
  open,
  editingCode,
  draft,
  onDraftChange,
  onClose,
  onSave,
  savePending = false,
}: CertificationEditorDialogProps) {
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo<FieldErrorState>(() => {
    const next: FieldErrorState = {};
    const certCode = normalizeText(draft.certCode);
    const certName = normalizeText(draft.certName);
    const satisCode = normalizeText(draft.satisCode);
    const satisName = normalizeText(draft.satisName);

    if (!certCode) {
      next.certCode = "자격증 코드를 입력하세요.";
    } else if (certCode.length > MAX_CERT_CODE) {
      next.certCode = `자격증 코드는 ${MAX_CERT_CODE}자 이내로 입력하세요.`;
    }

    if (!certName) {
      next.certName = "자격증명을 입력하세요.";
    } else if (certName.length > MAX_CERT_NAME) {
      next.certName = `자격증명은 ${MAX_CERT_NAME}자 이내로 입력하세요.`;
    }

    if (satisCode.length > MAX_SATIS_CODE) {
      next.satisCode = `SATIS 코드는 ${MAX_SATIS_CODE}자 이내로 입력하세요.`;
    }

    if (satisName.length > MAX_SATIS_NAME) {
      next.satisName = `SATIS명은 ${MAX_SATIS_NAME}자 이내로 입력하세요.`;
    }

    return next;
  }, [draft.certCode, draft.certName, draft.satisCode, draft.satisName]);

  const isValid = Object.keys(errors).length === 0;

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid) {
      return;
    }
    onSave();
  };

  const showError = (key: keyof FieldErrorState) => submitted && Boolean(errors[key]);

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: { borderRadius: 2 },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography sx={{ fontWeight: 800 }} variant="h6">
          {editingCode ? "자격증 수정" : "자격증 추가"}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            error={showError("certCode")}
            helperText={showError("certCode") ? errors.certCode : `${normalizeText(draft.certCode).length}/${MAX_CERT_CODE}`}
            label="자격증 코드"
            size="small"
            value={draft.certCode}
            onChange={(event) => onDraftChange({ ...draft, certCode: event.target.value })}
            disabled={Boolean(editingCode)}
            sx={fieldSx}
            slotProps={{ htmlInput: { maxLength: MAX_CERT_CODE } }}
          />
          <TextField
            fullWidth
            error={showError("certName")}
            helperText={showError("certName") ? errors.certName : `${normalizeText(draft.certName).length}/${MAX_CERT_NAME}`}
            label="자격증명"
            size="small"
            value={draft.certName}
            onChange={(event) => onDraftChange({ ...draft, certName: event.target.value })}
            sx={fieldSx}
            slotProps={{ htmlInput: { maxLength: MAX_CERT_NAME } }}
          />
          <TextField
            select
            fullWidth
            label="구분"
            size="small"
            value={String(draft.certKind >= 1 && draft.certKind <= 4 ? draft.certKind : 1)}
            onChange={(event) => onDraftChange({ ...draft, certKind: Number(event.target.value) })}
            sx={fieldSx}
          >
            {certKindOptions.map((kind) => (
              <MenuItem key={kind.value} value={kind.value}>
                {kind.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            error={showError("satisCode")}
            helperText={showError("satisCode") ? errors.satisCode : `${normalizeText(draft.satisCode).length}/${MAX_SATIS_CODE}`}
            label="SATIS 코드"
            size="small"
            value={draft.satisCode ?? ""}
            onChange={(event) => onDraftChange({ ...draft, satisCode: event.target.value })}
            sx={fieldSx}
            slotProps={{ htmlInput: { maxLength: MAX_SATIS_CODE } }}
          />
          <TextField
            fullWidth
            error={showError("satisName")}
            helperText={showError("satisName") ? errors.satisName : `${normalizeText(draft.satisName).length}/${MAX_SATIS_NAME}`}
            label="SATIS명"
            size="small"
            value={draft.satisName ?? ""}
            onChange={(event) => onDraftChange({ ...draft, satisName: event.target.value })}
            sx={fieldSx}
            slotProps={{ htmlInput: { maxLength: MAX_SATIS_NAME } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={draft.useYn}
                onChange={(event) => onDraftChange({ ...draft, useYn: event.target.checked })}
              />
            }
            label="사용"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button color="inherit" onClick={onClose} startIcon={<CancelOutlinedIcon />} variant="outlined">
          취소
        </Button>
        <Button disabled={savePending || !isValid} onClick={handleSave} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
