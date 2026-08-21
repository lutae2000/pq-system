"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";

import { AuditFields } from "@/components/common/AuditFields";
import { standardFieldSx } from "@/components/common/FormControls";
import type { NewEmploymentMonthlyStatusRecord } from "@/modules/pq/new-employment-rates/api";

export type EditableMonthlyStatusRow = NewEmploymentMonthlyStatusRecord & {
  isNew?: boolean;
};

type NewEmploymentMonthlyStatusDialogProps = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  loading: boolean;
  onClose: () => void;
  onDeleteRequest: (record: EditableMonthlyStatusRow) => void;
  onSave: (record: EditableMonthlyStatusRow) => void | Promise<void>;
  open: boolean;
  record: EditableMonthlyStatusRow | null;
};

const text = (value: string | null | undefined) => value ?? "";

const yearMonthValue = (value: string | null | undefined) => text(value).replace(/\D/g, "").slice(0, 6);

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeRecord = (record: EditableMonthlyStatusRow): EditableMonthlyStatusRow => ({
  ...record,
  baseYearMonth: yearMonthValue(record.baseYearMonth),
  employeeCount: toNullableNumber(record.employeeCount),
  newHireCount: toNullableNumber(record.newHireCount),
});

export function NewEmploymentMonthlyStatusDialog({
  canCreate,
  canDelete,
  canUpdate,
  loading,
  onClose,
  onDeleteRequest,
  onSave,
  open,
  record,
}: NewEmploymentMonthlyStatusDialogProps) {
  const [form, setForm] = useState<EditableMonthlyStatusRow | null>(() => (record ? { ...record } : null));

  const activeForm = form ?? record;
  const isNew = activeForm?.isNew ?? record?.isNew ?? true;

  const handleSave = async () => {
    if (!activeForm) {
      return;
    }
    await onSave(normalizeRecord(activeForm));
  };

  const handleChange = <K extends keyof EditableMonthlyStatusRow>(field: K, value: EditableMonthlyStatusRow[K]) => {
    setForm((current) => ({ ...(current ?? activeForm ?? {}), [field]: value }) as EditableMonthlyStatusRow);
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{isNew ? "월별 고용현황 등록" : "월별 고용현황 수정"}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, pt: 0.5 }}>
          <TextField
            label="기준년월"
            onChange={(event) => handleChange("baseYearMonth", yearMonthValue(event.target.value))}
            size="small"
            sx={standardFieldSx}
            value={yearMonthValue(activeForm?.baseYearMonth)}
            placeholder="YYYYMM"
          />
          <TextField
            label="고용인원"
            onChange={(event) => handleChange("employeeCount", toNullableNumber(event.target.value))}
            size="small"
            sx={standardFieldSx}
            type="number"
            value={activeForm?.employeeCount ?? ""}
          />
          <TextField
            label="신규 고용현황"
            onChange={(event) => handleChange("newHireCount", toNullableNumber(event.target.value))}
            size="small"
            sx={standardFieldSx}
            type="number"
            value={activeForm?.newHireCount ?? ""}
          />
        </Box>
        <AuditFields
          createdAt={activeForm?.createdAt ?? null}
          createdBy={activeForm?.createdId ?? null}
          updatedAt={activeForm?.lastChangedAt ?? null}
          updatedBy={activeForm?.lastChangedId ?? null}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {!activeForm?.isNew ? (
          <Button
            color="error"
            disabled={!canDelete || loading}
            onClick={() => activeForm && onDeleteRequest(activeForm)}
            startIcon={<DeleteOutlineOutlinedIcon />}
            variant="outlined"
          >
            삭제
          </Button>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}
        <Button onClick={onClose} variant="outlined">
          취소
        </Button>
        <Button
          disabled={loading || (activeForm?.isNew ? !canCreate : !canUpdate)}
          onClick={() => void handleSave()}
          startIcon={<SaveOutlinedIcon />}
          variant="contained"
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
