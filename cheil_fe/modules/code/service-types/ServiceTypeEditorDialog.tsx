"use client";

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import { standardFieldSx } from "@/components/common/FormControls";

import type { ServiceTypeUpsertRequest } from "./serviceTypes.types";

type ServiceTypeEditorDialogProps = {
  open: boolean;
  editingCode: string | null;
  draft: ServiceTypeUpsertRequest;
  onDraftChange: (next: ServiceTypeUpsertRequest) => void;
  onClose: () => void;
  onSave: () => void;
  savePending?: boolean;
};

type FieldErrorState = {
  serviceTypeCode?: string;
  serviceTypeName?: string;
};

const MAX_SERVICE_TYPE_CODE = 20;
const MAX_SERVICE_TYPE_NAME = 200;

const fieldSx = {
  ...standardFieldSx,
  "& .MuiInputBase-root": { minHeight: 40 },
} as const;

const normalizeText = (value: string | null | undefined) => (value ?? "").trim();

export function ServiceTypeEditorDialog({
  open,
  editingCode,
  draft,
  onDraftChange,
  onClose,
  onSave,
  savePending = false,
}: ServiceTypeEditorDialogProps) {
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo<FieldErrorState>(() => {
    const next: FieldErrorState = {};
    const serviceTypeCode = normalizeText(draft.serviceTypeCode);
    const serviceTypeName = normalizeText(draft.serviceTypeName);

    if (!serviceTypeCode) {
      next.serviceTypeCode = "용역구분 코드를 입력하세요.";
    } else if (serviceTypeCode.length > MAX_SERVICE_TYPE_CODE) {
      next.serviceTypeCode = `용역구분 코드는 ${MAX_SERVICE_TYPE_CODE}자 이내로 입력하세요.`;
    }

    if (!serviceTypeName) {
      next.serviceTypeName = "용역구분명을 입력하세요.";
    } else if (serviceTypeName.length > MAX_SERVICE_TYPE_NAME) {
      next.serviceTypeName = `용역구분명은 ${MAX_SERVICE_TYPE_NAME}자 이내로 입력하세요.`;
    }

    return next;
  }, [draft.serviceTypeCode, draft.serviceTypeName]);

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
          {editingCode ? "용역구분 수정" : "용역구분 추가"}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            disabled={Boolean(editingCode)}
            error={showError("serviceTypeCode")}
            helperText={showError("serviceTypeCode") ? errors.serviceTypeCode : `${normalizeText(draft.serviceTypeCode).length}/${MAX_SERVICE_TYPE_CODE}`}
            label="용역구분 코드"
            onChange={(event) => onDraftChange({ ...draft, serviceTypeCode: event.target.value })}
            size="small"
            slotProps={{ htmlInput: { maxLength: MAX_SERVICE_TYPE_CODE } }}
            sx={fieldSx}
            value={draft.serviceTypeCode}
          />
          <TextField
            fullWidth
            error={showError("serviceTypeName")}
            helperText={showError("serviceTypeName") ? errors.serviceTypeName : `${normalizeText(draft.serviceTypeName).length}/${MAX_SERVICE_TYPE_NAME}`}
            label="용역구분명"
            onChange={(event) => onDraftChange({ ...draft, serviceTypeName: event.target.value })}
            size="small"
            slotProps={{ htmlInput: { maxLength: MAX_SERVICE_TYPE_NAME } }}
            sx={fieldSx}
            value={draft.serviceTypeName}
          />
          <FormControlLabel
            control={<Switch checked={draft.useYn} onChange={(event) => onDraftChange({ ...draft, useYn: event.target.checked })} />}
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
