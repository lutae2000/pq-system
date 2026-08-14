"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, Chip } from "@mui/material";
import type { ReactNode } from "react";

export type EditableGridToolbarProps = {
  children?: ReactNode;
  loading?: boolean;
  onAdd?: () => void;
  onCancel?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  selectedCount?: number;
};

export function EditableGridToolbar({
  children,
  loading = false,
  onAdd,
  onCancel,
  onCopy,
  onDelete,
  onSave,
  selectedCount = 0,
}: EditableGridToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", mb: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
        {onAdd ? (
          <Button disabled={loading} onClick={onAdd} startIcon={<AddOutlinedIcon />} variant="outlined">
            행 추가
          </Button>
        ) : null}
        {onCopy ? (
          <Button disabled={loading || !hasSelection} onClick={onCopy} startIcon={<ContentCopyOutlinedIcon />} variant="outlined">
            복사
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            color="error"
            disabled={loading || !hasSelection}
            onClick={onDelete}
            startIcon={<DeleteOutlineOutlinedIcon />}
            variant="outlined"
          >
            행 삭제
          </Button>
        ) : null}
        {onSave ? (
          <Button disabled={loading} onClick={onSave} startIcon={<SaveOutlinedIcon />} variant="contained">
            저장
          </Button>
        ) : null}
        {onCancel ? (
          <Button color="inherit" disabled={loading} onClick={onCancel} startIcon={<RefreshOutlinedIcon />} variant="outlined">
            취소
          </Button>
        ) : null}
        {children}
      </Box>
      <Chip label={`선택 ${selectedCount}건`} size="small" variant="outlined" />
    </Box>
  );
}
