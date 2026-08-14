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
  Divider,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { AuditFields } from "@/components/common/AuditFields";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";

import {
  createEducationReminderBasicInfo,
  deleteEducationReminderBasicInfo,
  listEducationReminderBasicInfos,
  updateEducationReminderBasicInfo,
} from "./api";
import {
  emptyBasicInfo,
  formatDateTime,
  type EducationReminderBasicInfoRecord,
  type EducationReminderBasicInfoRequest,
} from "../types";

type FilterState = {
  active: "" | "Y" | "N";
  keyword: string;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const INITIAL_PAGE_SIZE = 25;

const emptyFilterState = (): FilterState => ({
  active: "",
  keyword: "",
});

const cycleUnitText = (value: EducationReminderBasicInfoRecord["cycleUnit"]) => (value === "YEAR" ? "년" : "개월");

const matchesKeyword = (row: EducationReminderBasicInfoRecord, keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.code, row.name, row.description ?? "", row.cycleUnit, `${row.cycleValue}`, row.lastChangedAt]
    .some((value) => value.toLowerCase().includes(normalized));
};

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
  const { showError, showSuccess } = useAppSnackbar();
  const queryClient = useQueryClient();
  const canEdit = canCreate || canUpdate;
  const [filters, setFilters] = useState<FilterState>(() => emptyFilterState());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<EducationReminderBasicInfoRequest>(() => emptyBasicInfo());
  const [deleteTarget, setDeleteTarget] = useState<EducationReminderBasicInfoRecord | null>(null);

  const basicInfosQuery = useQuery({
    queryKey: ["education-reminders", "basic-infos"],
    queryFn: listEducationReminderBasicInfos,
    enabled: canRead,
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

  const resolvedSelectedId =
    selectedId && filteredRows.some((row) => row.id === selectedId) ? selectedId : filteredRows[0]?.id ?? basicInfos[0]?.id ?? null;

  const selectedRecord = useMemo(
    () => basicInfos.find((row) => row.id === resolvedSelectedId) ?? null,
    [basicInfos, resolvedSelectedId],
  );

  const columns = useMemo<GridColDef<EducationReminderBasicInfoRecord>[]>(
    () => [
      { field: "code", headerName: "코드", width: 130 },
      { field: "name", headerName: "교육명", minWidth: 220, flex: 1.1 },
      {
        field: "cycle",
        headerName: "주기",
        width: 120,
        valueGetter: (_value, row) => `${row.cycleValue}${cycleUnitText(row.cycleUnit)}`,
      },
      { field: "description", headerName: "설명", minWidth: 220, flex: 1 },
      {
        field: "active",
        headerName: "사용",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Chip
            color={row.active ? "success" : "default"}
            label={row.active ? "사용" : "미사용"}
            size="small"
            variant={row.active ? "filled" : "outlined"}
          />
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

  const saveMutation = useMutation({
    mutationFn: async (request: EducationReminderBasicInfoRequest) => {
      if (request.id) {
        return updateEducationReminderBasicInfo(request.id, request);
      }
      return createEducationReminderBasicInfo(request);
    },
    onSuccess: async (saved) => {
      showSuccess("기초 정보가 저장되었습니다.");
      setEditingRecord({
        active: saved.active,
        code: saved.code,
        cycleUnit: saved.cycleUnit,
        cycleValue: saved.cycleValue,
        description: saved.description ?? "",
        id: saved.id,
        name: saved.name,
      });
      setSelectedId(saved.id);
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "basic-infos"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "기초 정보 저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEducationReminderBasicInfo,
    onSuccess: async () => {
      showSuccess("기초 정보가 삭제되었습니다.");
      setDeleteTarget(null);
      setSelectedId(null);
      setEditingRecord(emptyBasicInfo());
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "basic-infos"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "기초 정보 삭제에 실패했습니다."),
  });

  if (!canRead) {
    return <Alert severity="warning">교육 알림 기초 정보를 조회할 권한이 없습니다.</Alert>;
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

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  교육 알림 기초 정보
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  disabled={!canCreate}
                  onClick={() => {
                    setEditingRecord(emptyBasicInfo());
                    setSelectedId(null);
                  }}
                  startIcon={<AddOutlinedIcon />}
                  variant="contained"
                >
                  추가
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
                <Button
                  disabled={!canEdit}
                  onClick={() => {
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
                  variant="contained"
                >
                  저장
                </Button>
              </Stack>
            </Box>

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" } }}>
              <Box sx={{ minWidth: 0 }}>
                <EnterpriseDataGrid<EducationReminderBasicInfoRecord>
                  columns={columns}
                  getRowId={(row) => row.id}
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
                    setSelectedId(params.row.id);
                    setEditingRecord({
                      active: params.row.active,
                      code: params.row.code,
                      cycleUnit: params.row.cycleUnit,
                      cycleValue: params.row.cycleValue,
                      description: params.row.description ?? "",
                      id: params.row.id,
                      name: params.row.name,
                    });
                  }}
                  onRowDoubleClick={(params: GridRowParams<EducationReminderBasicInfoRecord>) =>
                    setEditingRecord({
                      active: params.row.active,
                      code: params.row.code,
                      cycleUnit: params.row.cycleUnit,
                      cycleValue: params.row.cycleValue,
                      description: params.row.description ?? "",
                      id: params.row.id,
                      name: params.row.name,
                    })
                  }
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  rows={filteredRows}
                  showPageNumbers
                  showXlsxExportButton
                  wrapperMinHeight={620}
                  sx={{ height: 620, minWidth: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </Box>

              <Card sx={{ minWidth: 0 }} variant="outlined">
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    기초 정보 입력
                  </Typography>
                  <Divider />
                  <Stack spacing={1.5}>
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "minmax(160px, 220px) minmax(0, 1fr)" } }}>
                      <TextField
                        disabled={!canEdit}
                        label="코드"
                        onChange={(event) => setEditingRecord((current) => ({ ...current, code: event.target.value }))}
                        required
                        size="small"
                        sx={{ minWidth: 0, width: "100%" }}
                        value={editingRecord.code}
                      />
                      <TextField
                        disabled={!canEdit}
                        label="교육명"
                        onChange={(event) => setEditingRecord((current) => ({ ...current, name: event.target.value }))}
                        required
                        size="small"
                        sx={{ minWidth: 0 }}
                        value={editingRecord.name}
                      />
                      <TextField
                        disabled={!canEdit}
                        label="주기 값"
                        onChange={(event) => setEditingRecord((current) => ({ ...current, cycleValue: Number(event.target.value) || 0 }))}
                        required
                        size="small"
                        sx={{ minWidth: 0 }}
                        type="number"
                        value={editingRecord.cycleValue}
                      />
                      <TextField
                        disabled={!canEdit}
                        label="주기 단위"
                        onChange={(event) =>
                          setEditingRecord((current) => ({ ...current, cycleUnit: event.target.value as EducationReminderBasicInfoRequest["cycleUnit"] }))
                        }
                        select
                        size="small"
                        sx={{ minWidth: 0 }}
                        value={editingRecord.cycleUnit}
                      >
                        <MenuItem value="YEAR">년</MenuItem>
                        <MenuItem value="MONTH">개월</MenuItem>
                      </TextField>

                      <TextField
                        disabled={!canEdit}
                        label="설명"
                        minRows={4}
                        multiline
                        onChange={(event) => setEditingRecord((current) => ({ ...current, description: event.target.value }))}
                        size="small"
                        sx={{ gridColumn: "1 / -1", minWidth: 0 }}
                        value={editingRecord.description ?? ""}
                      />
                    </Box>
                    <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                      <Switch
                        checked={editingRecord.active}
                        disabled={!canEdit}
                        onChange={(_event, checked) => setEditingRecord((current) => ({ ...current, active: checked }))}
                      />
                      <Typography variant="body2">사용</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button onClick={() => setEditingRecord(emptyBasicInfo())} variant="outlined">
                        초기화
                      </Button>
                    </Box>
                    <AuditFields
                      createdAt={selectedRecord?.createdAt}
                      createdBy={selectedRecord?.createdId}
                      updatedAt={selectedRecord?.lastChangedAt}
                      updatedBy={selectedRecord?.lastChangedId}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        message="선택한 기초 정보를 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        title="기초 정보 삭제"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </Stack>
  );
}
