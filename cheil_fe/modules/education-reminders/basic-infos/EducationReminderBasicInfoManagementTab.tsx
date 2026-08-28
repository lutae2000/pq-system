"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";

import {
  addEducationReminderBasicInfoEngineers,
  createEducationReminderBasicInfo,
  deleteEducationReminderBasicInfo,
  deleteEducationReminderBasicInfoEngineer,
  listEducationReminderBasicInfoEngineers,
  listEducationReminderBasicInfos,
  updateEducationReminderBasicInfo,
} from "./api";
import { EducationReminderBasicInfoEngineerSelectDialog } from "./EducationReminderBasicInfoEngineerSelectDialog";
import { EducationReminderBasicInfoRightPanel } from "./EducationReminderBasicInfoRightPanel";
import {
  emptyBasicInfo,
  formatDateTime,
  type EducationReminderBasicInfoEngineerRecord,
  type EducationReminderBasicInfoRecord,
  type EducationReminderBasicInfoRequest,
} from "../types";

type FilterState = {
  active: "" | "Y" | "N";
  keyword: string;
};

type AssignmentSelectionState = {
  ids: Set<string>;
  type: "include";
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const INITIAL_PAGE_SIZE = 25;

const emptyFilterState = (): FilterState => ({
  active: "",
  keyword: "",
});

function cycleUnitLabel(value: EducationReminderBasicInfoRecord["cycleUnit"]) {
  return value === "YEAR" ? "년" : "개월";
}

function matchesKeyword(row: EducationReminderBasicInfoRecord, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.code, row.name, row.description ?? "", row.cycleUnit, `${row.cycleValue}`, row.lastChangedAt].some((value) =>
    value.toLowerCase().includes(normalized),
  );
}

function normalizeEditingRecord(record: EducationReminderBasicInfoRequest): EducationReminderBasicInfoRequest {
  return {
    ...record,
    code: record.code.trim(),
    description: record.description?.trim() || "",
    name: record.name.trim(),
  };
}
export function EducationReminderBasicInfoManagementTab() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const { showError, showSuccess } = useAppSnackbar();
  const queryClient = useQueryClient();
  const canEdit = canCreate || canUpdate;
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const [filters, setFilters] = useState<FilterState>(() => emptyFilterState());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);
  const [editingPatch, setEditingPatch] = useState<Partial<EducationReminderBasicInfoRequest>>({});
  const [deleteTarget, setDeleteTarget] = useState<EducationReminderBasicInfoRecord | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignmentSelection, setAssignmentSelection] = useState<AssignmentSelectionState>({ ids: new Set<string>(), type: "include" });
  const [pendingAssignmentDeleteIds, setPendingAssignmentDeleteIds] = useState<string[] | null>(null);

  const basicInfosQuery = useQuery({
    queryKey: ["education-reminders", "basic-infos"],
    queryFn: listEducationReminderBasicInfos,
    enabled: tabQueryEnabled,
  });

  const basicInfos = useMemo(() => basicInfosQuery.data ?? [], [basicInfosQuery.data]);

  const filteredRows = useMemo(
    () =>
      basicInfos.filter((row) => {
        if (filters.active === "Y" && !row.active) {
          return false;
        }
        if (filters.active === "N" && row.active) {
          return false;
        }
        return matchesKeyword(row, filters.keyword);
      }),
    [basicInfos, filters.active, filters.keyword],
  );

  const resolvedSelectedCode =
    creatingNew
      ? null
       : selectedId && filteredRows.some((row) => row.code === selectedId)
        ? selectedId
        : filteredRows[0]?.code ?? basicInfos[0]?.code ?? null;

  const selectedRecord = useMemo(
    () => basicInfos.find((row) => row.code === resolvedSelectedCode) ?? null,
    [basicInfos, resolvedSelectedCode],
  );

  const assignedEngineersQuery = useQuery({
    queryKey: ["education-reminders", "basic-infos", selectedRecord?.code, "engineers"],
    queryFn: () => listEducationReminderBasicInfoEngineers(selectedRecord!.code),
    enabled: tabQueryEnabled && Boolean(selectedRecord?.code),
  });

  const assignedEngineers = useMemo(() => assignedEngineersQuery.data ?? [], [assignedEngineersQuery.data]);
  const baseEditingRecord = useMemo<EducationReminderBasicInfoRequest>(
    () =>
      creatingNew || !selectedRecord
        ? emptyBasicInfo()
        : {
            active: selectedRecord.active,
            code: selectedRecord.code,
            cycleUnit: selectedRecord.cycleUnit,
            cycleValue: selectedRecord.cycleValue,
            description: selectedRecord.description ?? "",
            name: selectedRecord.name,
          },
    [creatingNew, selectedRecord],
  );
  const editingRecord = useMemo(
    () => ({
      ...baseEditingRecord,
      ...editingPatch,
    }),
    [baseEditingRecord, editingPatch],
  );
  const selectedAssignmentIds = useMemo(
    () => Array.from(assignmentSelection.ids),
    [assignmentSelection.ids],
  );
  const jobFieldLabelByValue = jobFieldReferences.labelByValue;
  const specialtyFieldLabelByValue = specialtyFieldReferences.labelByValue;

  const basicInfoColumns = useMemo<GridColDef<EducationReminderBasicInfoRecord>[]>(
    () => [
      { field: "code", headerName: "코드", width: 130 },
      { field: "name", headerName: "교육명", minWidth: 220, flex: 1.1 },
      {
        field: "cycle",
        headerName: "주기",
        width: 120,
        valueGetter: (_value, row) => `${row.cycleValue}${cycleUnitLabel(row.cycleUnit)}`,
      },
      { field: "description", headerName: "설명", minWidth: 220, flex: 1 },
      {
        field: "active",
        headerName: "사용",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Chip color={row.active ? "success" : "default"} label={row.active ? "사용" : "미사용"} size="small" variant={row.active ? "filled" : "outlined"} />
        ),
      },
      {
        field: "lastChangedAt",
        headerName: "수정시각",
        width: 170,
        valueGetter: (_value, row) => formatDateTime(row.lastChangedAt),
      },
    ],
    [],
  );

  const assignmentColumns = useMemo<GridColDef<EducationReminderBasicInfoEngineerRecord>[]>(
    () => [
      { field: "engineerId", headerName: "기술인ID", width: 120 },
      { field: "engineerName", headerName: "성명", width: 110 },
      { field: "departmentName", headerName: "부서", minWidth: 160, flex: 1 },
      { field: "grade", headerName: "직위", width: 100 },
      {
        field: "jobField",
        headerName: "직무분야",
        width: 140,
        valueGetter: (_value, row) => formatReferenceLabel(jobFieldLabelByValue, row.jobField),
      },
      {
        field: "specialtyField",
        headerName: "전문분야",
        width: 140,
        valueGetter: (_value, row) => formatReferenceLabel(specialtyFieldLabelByValue, row.specialtyField),
      },
      {
        field: "retireYn",
        headerName: "재직",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => <Chip label={value === "Y" ? "퇴직" : "재직"} size="small" variant="outlined" />,
      },
    ],
    [jobFieldLabelByValue, specialtyFieldLabelByValue],
  );

  const saveMutation = useMutation({
    mutationFn: async (request: EducationReminderBasicInfoRequest) => {
      if (!creatingNew && selectedRecord) {
        return updateEducationReminderBasicInfo(selectedRecord.code, request);
      }
      return createEducationReminderBasicInfo(request);
    },
    onSuccess: async (saved) => {
      showSuccess("교육 알림 기초정보를 저장했습니다.");
      setCreatingNew(false);
      setEditingPatch({
        active: saved.active,
        code: saved.code,
        cycleUnit: saved.cycleUnit,
        cycleValue: saved.cycleValue,
        description: saved.description ?? "",
        name: saved.name,
      });
      setSelectedId(saved.code);
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "basic-infos"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "교육 알림 기초정보 저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEducationReminderBasicInfo,
    onSuccess: async () => {
      showSuccess("교육 알림 기초정보를 삭제했습니다.");
      setDeleteTarget(null);
      setSelectedId(null);
      setCreatingNew(false);
      setEditingPatch({});
      setAssignmentSelection({ ids: new Set<string>(), type: "include" });
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "basic-infos"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "교육 알림 기초정보 삭제에 실패했습니다."),
  });

  const addAssignmentsMutation = useMutation({
    mutationFn: async (engineerIds: string[]) => {
      if (!selectedRecord?.code) {
        throw new Error("교육 알림 기초정보를 먼저 선택해 주세요.");
      }
      return addEducationReminderBasicInfoEngineers(selectedRecord.code, { engineerIds });
    },
    onSuccess: async () => {
      showSuccess("기술인을 할당했습니다.");
      setAssignDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "basic-infos", selectedRecord?.code, "engineers"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "기술인 할당에 실패했습니다."),
  });

  const removeAssignmentsMutation = useMutation({
    mutationFn: async (engineerIds: string[]) => {
      if (!selectedRecord?.code) {
        throw new Error("교육 알림 기초정보를 먼저 선택해 주세요.");
      }
      await Promise.all(engineerIds.map((engineerId) => deleteEducationReminderBasicInfoEngineer(selectedRecord.code, engineerId)));
    },
    onSuccess: async () => {
      showSuccess("할당된 기술인을 삭제했습니다.");
      setPendingAssignmentDeleteIds(null);
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "basic-infos", selectedRecord?.code, "engineers"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "할당 기술인 삭제에 실패했습니다."),
  });

  if (!canRead) {
    return <Alert severity="warning">교육 알림 기초정보를 조회할 권한이 없습니다.</Alert>;
  }


  return (
    <Stack spacing={2}>
      <SearchPanel
        keyword={filters.keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="코드, 교육명, 설명, 주기"
        keywordSx={{ flex: "1 1 360px", maxWidth: 560, minWidth: 260 }}
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onReset={() => setFilters(emptyFilterState())}
        onSearch={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        resetLabel="초기화"
        searchDisabled={false}
        searchLabel="조회"
      >
        <TextField
          select
          label="사용 여부"
          onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value as FilterState["active"] }))}
          size="small"
          sx={{ minWidth: 140 }}
          value={filters.active}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="Y">사용</MenuItem>
          <MenuItem value="N">미사용</MenuItem>
        </TextField>
      </SearchPanel>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.2fr) minmax(0, 1fr)" }, alignItems: "stretch" }}>
        <Card sx={{ height: "100%", minWidth: 0, overflow: "hidden" }} variant="outlined">
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  교육 알림 기본정보 목록
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  disabled={!canCreate}
                  onClick={() => {
                    setEditingPatch({});
                    setSelectedId(null);
                    setCreatingNew(true);
                    setShowAssignmentPanel(false);
                    setAssignmentSelection({ ids: new Set<string>(), type: "include" });
                  }}
                  startIcon={<AddOutlinedIcon />}
                  variant="contained"
                >
                  신규
                </Button>
                <Button
                  color="error"
                  disabled={!selectedRecord || !canDelete}
                  onClick={() => setDeleteTarget(selectedRecord)}
                  startIcon={<DeleteOutlineOutlinedIcon />}
                  variant="outlined"
                >
                  삭제
                </Button>
              </Stack>
            </Box>

            <EnterpriseDataGrid<EducationReminderBasicInfoRecord>
              columns={basicInfoColumns}
              getRowId={(row) => row.code}
              hideFooterSelectedRowCount
              initialState={{
                pagination: {
                  paginationModel: {
                    page: 0,
                    pageSize: INITIAL_PAGE_SIZE,
                  },
                },
              }}
              onRowClick={(params: GridRowParams<EducationReminderBasicInfoRecord>) => {
                setCreatingNew(false);
                setShowAssignmentPanel(false);
                setSelectedId(params.row.code);
                setAssignmentSelection({ ids: new Set<string>(), type: "include" });
                setEditingPatch({});
              }}
              onRowDoubleClick={(params: GridRowParams<EducationReminderBasicInfoRecord>) => {
                setCreatingNew(false);
                setShowAssignmentPanel(false);
                setSelectedId(params.row.code);
                setAssignmentSelection({ ids: new Set<string>(), type: "include" });
                setEditingPatch({});
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              rows={filteredRows}
              showPageNumbers
              showXlsxExportButton
              wrapperMinHeight={620}
              sx={{ height: 620, minWidth: 0, width: "100%", '& .MuiDataGrid-row:hover': { cursor: "pointer" } }}
            />
          </CardContent>
        </Card>

        <EducationReminderBasicInfoRightPanel
          assignmentColumns={assignmentColumns}
          assignedEngineers={assignedEngineers}
          assignedEngineersLoading={assignedEngineersQuery.isLoading || assignedEngineersQuery.isFetching}
          canCreate={canCreate}
          canDelete={canDelete}
          canEdit={canEdit}
          editingRecord={editingRecord}
          onAddAssignments={() => setAssignDialogOpen(true)}
          onAssignmentSelectionModelChange={(model) => setAssignmentSelection(model as AssignmentSelectionState)}
          onDeleteAssignments={() => setPendingAssignmentDeleteIds(selectedAssignmentIds)}
          onPatchChange={(patch) => setEditingPatch((current) => ({ ...current, ...patch }))}
          onReset={() => setEditingPatch(emptyBasicInfo())}
          onSave={() => {
            if (!editingRecord.code.trim() || !editingRecord.name.trim()) {
              showError("코드와 교육명을 입력해 주세요.");
              return;
            }
            if (editingRecord.cycleValue < 1) {
              showError("주기 값은 1 이상이어야 합니다.");
              return;
            }
            saveMutation.mutate(normalizeEditingRecord(editingRecord));
          }}
          onToggleAssignmentPanel={setShowAssignmentPanel}
          rowSelectionModel={assignmentSelection}
          selectedAssignmentCount={selectedAssignmentIds.length}
          selectedRecord={selectedRecord}
          showAssignmentPanel={showAssignmentPanel}
        />
      </Box>
      <ConfirmDeleteDialog
        message="선택한 교육 알림 기초정보를 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        title="교육 알림 기초정보 삭제"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
              deleteMutation.mutate(deleteTarget.code);
          }
        }}
      />
      <ConfirmDeleteDialog
        message={`선택한 ${pendingAssignmentDeleteIds?.length ?? 0}명의 기술인을 할당 목록에서 제외하시겠습니까?`}
        open={Boolean(pendingAssignmentDeleteIds?.length)}
        title="할당 기술인 제외"
        onClose={() => setPendingAssignmentDeleteIds(null)}
        onConfirm={() => {
          if (pendingAssignmentDeleteIds && pendingAssignmentDeleteIds.length > 0) {
            removeAssignmentsMutation.mutate(pendingAssignmentDeleteIds);
          }
        }}
      />

      <EducationReminderBasicInfoEngineerSelectDialog
        assignedEngineerIds={assignedEngineers.map((row) => row.engineerId)}
        educationName={selectedRecord?.name ?? ""}
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        onSave={(engineerIds) => {
          if (engineerIds.length === 0) {
            showError("추가할 기술인을 먼저 선택해 주세요.");
            return;
          }
          addAssignmentsMutation.mutate(engineerIds);
        }}
      />
    </Stack>
  );
}
