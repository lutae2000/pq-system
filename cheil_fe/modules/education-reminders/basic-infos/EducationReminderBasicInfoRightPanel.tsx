"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, Card, CardContent, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import type { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";

import { AuditFields } from "@/components/common/AuditFields";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { EducationReminderBasicInfoEngineerRecord, EducationReminderBasicInfoRecord, EducationReminderBasicInfoRequest } from "../types";

type EducationReminderBasicInfoRightPanelProps = {
  assignmentColumns: GridColDef<EducationReminderBasicInfoEngineerRecord>[];
  assignedEngineers: EducationReminderBasicInfoEngineerRecord[];
  assignedEngineersLoading: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
  editingRecord: EducationReminderBasicInfoRequest;
  onAddAssignments: () => void;
  onAssignmentSelectionModelChange: (model: GridRowSelectionModel) => void;
  onDeleteAssignments: () => void;
  onPatchChange: (patch: Partial<EducationReminderBasicInfoRequest>) => void;
  onReset: () => void;
  onSave: () => void;
  onToggleAssignmentPanel: (checked: boolean) => void;
  rowSelectionModel: GridRowSelectionModel;
  selectedAssignmentCount: number;
  selectedRecord: EducationReminderBasicInfoRecord | null;
  showAssignmentPanel: boolean;
};

export function EducationReminderBasicInfoRightPanel({
  assignmentColumns,
  assignedEngineers,
  assignedEngineersLoading,
  canCreate,
  canDelete,
  canEdit,
  editingRecord,
  onAddAssignments,
  onAssignmentSelectionModelChange,
  onDeleteAssignments,
  onPatchChange,
  onReset,
  onSave,
  onToggleAssignmentPanel,
  rowSelectionModel,
  selectedAssignmentCount,
  selectedRecord,
  showAssignmentPanel,
}: EducationReminderBasicInfoRightPanelProps) {
  return (
    <Card sx={{ height: "100%", minWidth: 0, position: "relative", overflow: "hidden" }} variant="outlined">
      <Box sx={{ bgcolor: "primary.main", height: 8 }} />
      <CardContent sx={{ display: "flex", flexDirection: "column", flex: 1, gap: 2, minHeight: 0 }}>
        <Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              {showAssignmentPanel ? "할당 기술인" : "상세 편집"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <Typography color={showAssignmentPanel ? "text.secondary" : "text.primary"} variant="body2">
                상세
              </Typography>
              <Switch
                checked={showAssignmentPanel}
                disabled={!selectedRecord?.code}
                onChange={(_event, checked) => onToggleAssignmentPanel(checked)}
                size="small"
              />
              <Typography color={showAssignmentPanel ? "text.primary" : "text.secondary"} variant="body2">
                기술인 할당
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {!showAssignmentPanel ? (
          <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1fr)" } }}>
              <TextField
                disabled={!canEdit}
                label="코드"
                onChange={(event) => onPatchChange({ code: event.target.value })}
                required
                size="small"
                value={editingRecord.code}
              />
              <TextField
                disabled={!canEdit}
                label="교육명"
                onChange={(event) => onPatchChange({ name: event.target.value })}
                required
                size="small"
                value={editingRecord.name}
              />
              <TextField
                disabled={!canEdit}
                label="주기 값"
                onChange={(event) => onPatchChange({ cycleValue: Number(event.target.value) || 0 })}
                required
                size="small"
                type="number"
                value={editingRecord.cycleValue}
              />
              <TextField
                disabled={!canEdit}
                label="주기 단위"
                onChange={(event) => onPatchChange({ cycleUnit: event.target.value as EducationReminderBasicInfoRequest["cycleUnit"] })}
                select
                size="small"
                value={editingRecord.cycleUnit}
              >
                <MenuItem value="YEAR">년</MenuItem>
                <MenuItem value="MONTH">개월</MenuItem>
              </TextField>
              <TextField
                disabled={!canEdit}
                label="설명"
                minRows={5}
                multiline
                onChange={(event) => onPatchChange({ description: event.target.value })}
                size="small"
                sx={{ gridColumn: "1 / -1" }}
                value={editingRecord.description ?? ""}
              />
            </Box>

            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Switch checked={editingRecord.active} disabled={!canEdit} onChange={(_event, checked) => onPatchChange({ active: checked })} />
                <Typography variant="body2">사용</Typography>
              </Box>

              <Button onClick={onReset} variant="outlined">
                초기화
              </Button>
            </Box>

            <AuditFields
              createdAt={selectedRecord?.createdAt}
              createdBy={selectedRecord?.createdId}
              updatedAt={selectedRecord?.lastChangedAt}
              updatedBy={selectedRecord?.lastChangedId}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 0.5 }}>
              <Button
                disabled={!canEdit}
                onClick={onSave}
                startIcon={<SaveOutlinedIcon />}
                variant="contained"
              >
                저장
              </Button>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <Stack direction="row" spacing={1}>
                <Button disabled={!selectedRecord?.code || !canCreate} onClick={onAddAssignments} startIcon={<AddOutlinedIcon />} variant="contained">
                  추가
                </Button>
                <Button
                  color="error"
                  disabled={!selectedRecord?.code || !canDelete || selectedAssignmentCount === 0}
                  onClick={onDeleteAssignments}
                  startIcon={<DeleteOutlineOutlinedIcon />}
                  variant="outlined"
                >
                  선택 삭제
                </Button>
              </Stack>
            </Box>

            <EnterpriseDataGrid<EducationReminderBasicInfoEngineerRecord>
              columns={assignmentColumns}
              getRowId={(row) => row.engineerId}
              hideFooterSelectedRowCount
              checkboxSelection
              initialState={{
                pagination: {
                  paginationModel: {
                    page: 0,
                    pageSize: 25,
                  },
                },
              }}
              loading={assignedEngineersLoading}
              onRowSelectionModelChange={onAssignmentSelectionModelChange}
              rowSelectionModel={rowSelectionModel}
              rows={assignedEngineers}
              pageSizeOptions={[25, 50, 100]}
              showPageNumbers
              wrapperMinHeight={520}
              sx={{
                height: 520,
                minWidth: 0,
                width: "100%",
                "& .MuiDataGrid-row:hover": {
                  cursor: "pointer",
                },
              }}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
