"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { GridColDef, GridEventListener } from "@mui/x-data-grid";

import { ResizableCard } from "@/components/common/ResizableCard";
import { SelectedEngineerGrid } from "@/modules/pq/pq-participating-engineers/presentation/SelectedEngineerGrid";
import type { SelectedPqEngineer } from "@/modules/pq/pq-participating-engineers/domain/models";

type SelectedEngineerCardProps = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  candidateCardWidth: number;
  columns: GridColDef<SelectedPqEngineer>[];
  focusHeight: number;
  gridHeight: number;
  hasUnsavedChanges: boolean;
  height: number;
  onHeightChange: (height: number) => void;
  onRowClick: GridEventListener<"rowClick">;
  onSave: () => void;
  onToggleFocus: () => void;
  onRemove: () => void;
  onWidthChange: (width: number) => void;
  performanceFocusMode: boolean;
  rows: SelectedPqEngineer[];
  savePending: boolean;
  selectedIds: ReadonlySet<string>;
  sx?: SxProps<Theme>;
};

const MIN_HEIGHT = 240;
const MAX_HEIGHT = 560;
const MIN_WIDTH = 320;
const MAX_WIDTH = 760;
const actionButtonSx = { minWidth: 128 } as const;
const heightHandleSx = { "&::before": { clipPath: "inset(0 0 50% 0)" } } as const;

export function SelectedEngineerCard({
  canCreate,
  canDelete,
  canUpdate,
  candidateCardWidth,
  columns,
  focusHeight,
  gridHeight,
  hasUnsavedChanges,
  height,
  onHeightChange,
  onRowClick,
  onSave,
  onToggleFocus,
  onRemove,
  onWidthChange,
  performanceFocusMode,
  rows,
  savePending,
  selectedIds,
  sx,
}: SelectedEngineerCardProps) {
  return (
    <ResizableCard
      height={performanceFocusMode ? focusHeight : height}
      maxHeight={MAX_HEIGHT}
      maxWidth={performanceFocusMode ? MAX_WIDTH : undefined}
      minHeight={MIN_HEIGHT}
      minWidth={performanceFocusMode ? MIN_WIDTH : undefined}
      onHeightChange={onHeightChange}
      onWidthChange={onWidthChange}
      resizeEdges={performanceFocusMode ? ["right"] : ["bottom"]}
      handleSx={performanceFocusMode ? undefined : heightHandleSx}
      width={performanceFocusMode ? candidateCardWidth : undefined}
      sx={{
        height: { lg: performanceFocusMode ? focusHeight : height },
        minHeight: MIN_HEIGHT,
        minWidth: 0,
        position: "relative",
        width: { xs: "100%", lg: performanceFocusMode ? candidateCardWidth : "100%" },
      }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", pb: 0 }}>
        <Box sx={{ alignItems: performanceFocusMode ? "stretch" : "center", display: "flex", flexDirection: performanceFocusMode ? "column" : "row", gap: 1, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 800 }} variant="h6">선정 기술인</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: 1, flexWrap: "wrap", justifyContent: "flex-end", width: "100%" }}>
            <Chip label={`선택 ${selectedIds.size}명`} size="small" variant={selectedIds.size > 0 ? "filled" : "outlined"} />
            {hasUnsavedChanges ? <Chip color="warning" label="저장 필요" size="small" variant="outlined" /> : null}
            <Button color="error" disabled={!canDelete || selectedIds.size === 0} onClick={onRemove} startIcon={<DeleteOutlineOutlinedIcon />} size="small" sx={actionButtonSx} variant="outlined">
              선택 삭제
            </Button>
            <Button disabled={(!canCreate && !canUpdate) || savePending || !hasUnsavedChanges} onClick={onSave} size="small" startIcon={<SaveOutlinedIcon />} sx={actionButtonSx} variant="contained">
              선정 목록 저장
            </Button>
            <Tooltip title={performanceFocusMode ? "기본 배치로 보기" : "선정 기술인 기준으로 보기"}>
              <IconButton aria-label={performanceFocusMode ? "기본 배치로 보기" : "선정 기술인 기준으로 보기"} color="primary" onClick={onToggleFocus} size="small" sx={{ mt: -0.25 }}>
                {performanceFocusMode ? <KeyboardDoubleArrowRightOutlinedIcon fontSize="small" /> : <KeyboardDoubleArrowLeftOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <SelectedEngineerGrid columns={columns} height={gridHeight} onRowClick={onRowClick} rows={rows} selectedEngineerIdSet={selectedIds} sx={sx} />
      </CardContent>
    </ResizableCard>
  );
}
