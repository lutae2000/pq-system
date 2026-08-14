"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button } from "@mui/material";
import type { ReactNode } from "react";

export type CrudActionBarProps = {
  children?: ReactNode;
  deleteDisabled?: boolean;
  deleteLabel?: string;
  loading?: boolean;
  newDisabled?: boolean;
  newLabel?: string;
  onClose?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onNew?: () => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
};

export function CrudActionBar({
  children,
  deleteDisabled = false,
  deleteLabel = "삭제",
  loading = false,
  newDisabled = false,
  newLabel = "신규",
  onClose,
  onDelete,
  onExport,
  onNew,
  onSave,
  saveDisabled = false,
  saveLabel = "저장",
}: CrudActionBarProps) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
      {onNew ? (
        <Button disabled={newDisabled || loading} onClick={onNew} startIcon={<AddOutlinedIcon />} variant="outlined">
          {newLabel}
        </Button>
      ) : null}
      {onSave ? (
        <Button disabled={saveDisabled || loading} onClick={onSave} startIcon={<SaveOutlinedIcon />} variant="contained">
          {saveLabel}
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          color="error"
          disabled={deleteDisabled || loading}
          onClick={onDelete}
          startIcon={<DeleteOutlineOutlinedIcon />}
          variant="outlined"
        >
          {deleteLabel}
        </Button>
      ) : null}
      {onExport ? (
        <Button disabled={loading} onClick={onExport} startIcon={<DownloadOutlinedIcon />} variant="outlined">
          엑셀
        </Button>
      ) : null}
      {children}
      {onClose ? (
        <Button color="inherit" disabled={loading} onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          닫기
        </Button>
      ) : null}
    </Box>
  );
}
