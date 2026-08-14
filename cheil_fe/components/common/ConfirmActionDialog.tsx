"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { KeyboardEvent } from "react";

export type ConfirmActionDialogProps = {
  cancelLabel?: string;
  confirmColor?: "primary" | "error" | "warning" | "success";
  confirmLabel?: string;
  enableKeyboardActions?: boolean;
  loading?: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  targetLabel?: string;
  title: string;
};

export function ConfirmActionDialog({
  cancelLabel = "취소",
  confirmColor = "primary",
  confirmLabel = "확인",
  enableKeyboardActions = false,
  loading = false,
  message,
  onClose,
  onConfirm,
  open,
  targetLabel,
  title,
}: ConfirmActionDialogProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!enableKeyboardActions || loading || event.defaultPrevented || event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      onConfirm();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={loading ? undefined : onClose} onKeyDown={handleKeyDown} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {targetLabel ? (
          <>
            <Typography color="text.secondary" variant="body2">
              대상
            </Typography>
            <Typography sx={{ fontWeight: 700, mt: 0.75 }} variant="body1">
              {targetLabel}
            </Typography>
          </>
        ) : null}
        <Typography sx={{ mt: targetLabel ? 1.5 : 0 }} variant="body2">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={loading} onClick={onClose} variant="outlined">
          {cancelLabel}
        </Button>
        <Button color={confirmColor} disabled={loading} onClick={onConfirm} variant="contained">
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export type ConfirmDeleteDialogProps = Omit<
  ConfirmActionDialogProps,
  "confirmColor" | "confirmLabel" | "message" | "title"
> & {
  message?: string;
  title?: string;
};

export function ConfirmDeleteDialog({
  message = "삭제하면 복구할 수 없습니다. 계속하시겠습니까?",
  title = "삭제 확인",
  ...props
}: ConfirmDeleteDialogProps) {
  return (
    <ConfirmActionDialog
      {...props}
      confirmColor="error"
      confirmLabel="삭제"
      message={message}
      title={title}
    />
  );
}
