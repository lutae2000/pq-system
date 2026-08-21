"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import type { EducationReminderSendHistoryRecord } from "../send/types";

type RetryDraft = {
  actualPhoneNo: string;
  logId: number;
  row: EducationReminderSendHistoryRecord;
};

type EducationReminderSendRetryDialogProps = {
  loading?: boolean;
  open: boolean;
  rows: EducationReminderSendHistoryRecord[];
  onClose: () => void;
  onRetry: (items: Array<{ actualPhoneNo: string; logId: number }>) => Promise<void> | void;
};

const buildDrafts = (rows: EducationReminderSendHistoryRecord[]): RetryDraft[] =>
  rows.map((row) => ({
    actualPhoneNo: row.actualPhoneNo || row.targetPhoneNo || "",
    logId: row.logId,
    row,
  }));

export function EducationReminderSendRetryDialog({ loading = false, open, rows, onClose, onRetry }: EducationReminderSendRetryDialogProps) {
  const [drafts, setDrafts] = useState<RetryDraft[]>(() => buildDrafts(rows));

  const invalidCount = useMemo(
    () => drafts.filter((draft) => !draft.actualPhoneNo.trim()).length,
    [drafts],
  );

  const handleRetry = async () => {
    await onRetry(drafts.map((draft) => ({ actualPhoneNo: draft.actualPhoneNo.trim(), logId: draft.logId })));
  };

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={loading ? undefined : onClose}>
      <DialogTitle>교육알림 재발송</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            선택한 대상만 재발송됩니다. 발송번호가 잘못된 경우 아래에서 수정한 번호로 보내세요.
          </Alert>

          <Typography color="text.secondary" variant="body2">
            선택 {drafts.length}건
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxHeight: "60vh", overflow: "auto", pr: 0.5 }}>
            {drafts.map((draft, index) => (
              <Box
                key={draft.logId}
                sx={{
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                <Stack spacing={1}>
                  <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
                      <Typography color="text.secondary" variant="body2">
                        대상자
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {draft.row.engineerName || "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
                      <Typography color="text.secondary" variant="body2">
                        부서
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {draft.row.departmentName || "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
                      <Typography color="text.secondary" variant="body2">
                        현재 발송번호
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {draft.row.actualPhoneNo || "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
                      <Typography color="text.secondary" variant="body2">
                        대상번호
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {draft.row.targetPhoneNo || "-"}
                      </Typography>
                    </Box>
                  </Box>

                  <TextField
                    fullWidth
                    label="재발송 번호"
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setDrafts((current) =>
                        current.map((currentDraft) =>
                          currentDraft.logId === draft.logId
                            ? { ...currentDraft, actualPhoneNo: nextValue }
                            : currentDraft,
                        ),
                      );
                    }}
                    placeholder="010-0000-0000"
                    size="small"
                    value={draft.actualPhoneNo}
                  />

                  {index < drafts.length - 1 ? <Divider /> : null}
                </Stack>
              </Box>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onClose} variant="outlined">
          취소
        </Button>
        <Button disabled={loading || drafts.length === 0 || invalidCount > 0} onClick={() => void handleRetry()} variant="contained">
          재발송
        </Button>
      </DialogActions>
    </Dialog>
  );
}
