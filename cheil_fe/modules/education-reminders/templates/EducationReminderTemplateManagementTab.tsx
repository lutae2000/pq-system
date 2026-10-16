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
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";

import { AuditFields } from "@/components/common/AuditFields";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";

import {
  channelLabel,
  emptyTemplate,
  type EducationReminderTemplateRecord,
  type EducationReminderTemplateRequest,
} from "../types";
import { useEducationReminderTemplates } from "./application/useEducationReminderTemplates";

type FilterState = {
  active: "" | "Y" | "N";
  channel: "" | "LMS" | "SMS";
  keyword: string;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const INITIAL_PAGE_SIZE = 25;

const emptyFilterState = (): FilterState => ({
  active: "",
  channel: "",
  keyword: "",
});

const matchesKeyword = (row: EducationReminderTemplateRecord, keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.name, row.description ?? "", row.channel, row.content, row.lastChangedAt]
    .some((value) => value.toLowerCase().includes(normalized));
};

function normalizeEditingRecord(record: EducationReminderTemplateRequest): EducationReminderTemplateRequest {
  return {
    ...record,
    channel: "LMS",
    content: record.content.trim(),
    description: record.description?.trim() || "",
    homepageUrl: record.homepageUrl.trim(),
    name: record.name.trim(),
  };
}

function toTemplateRequest(record: EducationReminderTemplateRecord): EducationReminderTemplateRequest {
  return {
    active: record.active,
    channel: "LMS",
    content: record.content,
    description: record.description ?? "",
    homepageUrl: record.homepageUrl ?? "",
    id: record.id,
    name: record.name,
  };
}

export function EducationReminderTemplateManagementTab() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const { showError, showSuccess } = useAppSnackbar();
  const canEdit = canCreate || canUpdate;
  const [filters, setFilters] = useState<FilterState>(() => emptyFilterState());
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => emptyFilterState());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EducationReminderTemplateRequest>(() => emptyTemplate());
  const [deleteTarget, setDeleteTarget] = useState<EducationReminderTemplateRecord | null>(null);

  const { deleteMutation, saveMutation, templatesQuery } = useEducationReminderTemplates({
    canCreate,
    canDelete,
    canRead,
    canUpdate,
    onDeleted: () => {
      setDeleteTarget(null);
      setSelectedId(null);
      setIsCreating(false);
      setEditingRecord(emptyTemplate());
    },
    onSaved: (saved) => {
      setEditingRecord(toTemplateRequest(saved));
      setSelectedId(saved.id);
      setIsCreating(false);
    },
    showError,
    showSuccess,
    tabQueryEnabled,
  });

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

  const filteredRows = useMemo(
    () =>
      templates.filter((row) => {
        if (appliedFilters.active === "Y" && !row.active) {
          return false;
        }
        if (appliedFilters.active === "N" && row.active) {
          return false;
        }
        if (appliedFilters.channel && row.channel !== appliedFilters.channel) {
          return false;
        }
        return matchesKeyword(row, appliedFilters.keyword);
      }),
    [appliedFilters.active, appliedFilters.channel, appliedFilters.keyword, templates],
  );

  const resolvedSelectedId = selectedId && filteredRows.some((row) => row.id === selectedId)
    ? selectedId
    : filteredRows[0]?.id ?? templates[0]?.id ?? null;

  const selectedRecord = useMemo(
    () => templates.find((row) => row.id === resolvedSelectedId) ?? null,
    [resolvedSelectedId, templates],
  );

  // The first available row must hydrate the detail form after the query resolves.
  useEffect(() => {
    if (!isCreating && selectedId === null && filteredRows[0]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(filteredRows[0].id);
      setEditingRecord(toTemplateRequest(filteredRows[0]));
    }
  }, [filteredRows, isCreating, selectedId]);

  const columns = useMemo<GridColDef<EducationReminderTemplateRecord>[]>(
    () => [
      { field: "name", headerName: "템플릿명", minWidth: 220, flex: 1.1 },
      { field: "channel", headerName: "채널", width: 90, valueGetter: (_value, row) => channelLabel[row.channel] },
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
    ],
    [],
  );

  if (!canRead) {
    return <Alert severity="warning">교육 알림 템플릿을 조회할 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <SearchPanel
        keyword={filters.keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="템플릿명, 설명, 본문"
        keywordSx={{ flex: "1 1 360px", maxWidth: 560, minWidth: 260 }}
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onReset={() => {
          const next = emptyFilterState();
          setFilters(next);
          setAppliedFilters(next);
          setSelectedId(null);
          setIsCreating(false);
          setEditingRecord(emptyTemplate());
        }}
        onSearch={(keyword) => {
          const next = { ...filters, keyword };
          setFilters(next);
          setAppliedFilters(next);
          setSelectedId(null);
          setIsCreating(false);
        }}
        resetLabel="초기화"
        searchDisabled={templatesQuery.isFetching}
        searchLabel="조회"
      >
        <TextField
          select
          label="채널"
          onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value as FilterState["channel"] }))}
          size="small"
          sx={{ minWidth: 120 }}
          value={filters.channel}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="LMS">LMS</MenuItem>
          <MenuItem value="SMS">SMS</MenuItem>
        </TextField>
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
                  교육 알림 템플릿
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  disabled={!canCreate}
                  onClick={() => {
                    setEditingRecord(emptyTemplate());
                    setSelectedId(null);
                    setIsCreating(true);
                  }}
                  startIcon={<AddOutlinedIcon />}
                  variant="contained"
                >
                  추가
                </Button>
                <Button
                  color="error"
                  disabled={!selectedRecord || !canDelete || deleteMutation.isPending}
                  onClick={() => setDeleteTarget(selectedRecord)}
                  startIcon={<DeleteOutlineOutlinedIcon />}
                  variant="outlined"
                >
                  삭제
                </Button>
                <Button
                  onClick={() => {
                    if (!editingRecord.name.trim() || !editingRecord.content.trim()) {
                      showError("템플릿명과 본문을 입력해 주세요.");
                      return;
                    }
                    saveMutation.mutate({
                      id: editingRecord.id ?? null,
                      isCreating,
                      request: normalizeEditingRecord(editingRecord),
                    });
                  }}
                  disabled={!canEdit || saveMutation.isPending}
                  variant="contained"
                >
                  저장
                </Button>
              </Stack>
            </Box>

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" } }}>
              <Box sx={{ minWidth: 0 }}>
                <EnterpriseDataGrid<EducationReminderTemplateRecord>
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
                  onRowClick={(params: GridRowParams<EducationReminderTemplateRecord>) => {
                    setSelectedId(params.row.id);
                    setIsCreating(false);
                    setEditingRecord(toTemplateRequest(params.row));
                  }}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  rows={filteredRows}
                  showPageNumbers
                  showXlsxExportButton
                  wrapperMinHeight={860}
                  sx={{ height: 620, minWidth: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </Box>

              <Card variant="outlined" sx={{ minWidth: 0 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    템플릿 입력
                  </Typography>
                  <Divider />
                  <Stack spacing={1.5}>
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "minmax(160px, 220px) minmax(0, 1fr)" } }}>
                      <TextField
                        label="템플릿명"
                        disabled={!canEdit}
                        onChange={(event) => setEditingRecord((current) => ({ ...current, name: event.target.value }))}
                        required
                        size="small"
                        sx={{ minWidth: 0, width: "100%" }}
                        value={editingRecord.name}
                      />
                      <TextField
                        disabled
                        label="채널"
                        size="small"
                        sx={{ minWidth: 0 }}
                        value="LMS"
                      />
                      <Box sx={{ alignItems: "center", display: "flex", gap: 1, minHeight: 40 }}>
                        <Switch
                          checked={editingRecord.active}
                          disabled={!canEdit}
                          onChange={(_event, checked) => setEditingRecord((current) => ({ ...current, active: checked }))}
                        />
                        <Typography variant="body2">사용</Typography>
                      </Box>
                      <Alert severity="info" sx={{ alignItems: "flex-start", gridColumn: "1 / -1", py: 0.5 }}>
                        <Typography sx={{ fontWeight: 700 }} variant="body2">
                          본문 자동 치환 안내
                        </Typography>
                        <Box
                          sx={{
                            bgcolor: "rgba(255, 255, 255, 0.5)",
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            display: "grid",
                            gridTemplateColumns: "minmax(100px, 0.35fr) minmax(160px, 1fr)",
                            mt: 0.75,
                            overflow: "hidden",
                          }}
                        >
                          <Typography sx={{ borderBottom: 1, borderColor: "divider", fontWeight: 700, px: 1, py: 0.5 }} variant="caption">
                            문자열
                          </Typography>
                          <Typography sx={{ borderBottom: 1, borderColor: "divider", fontWeight: 700, px: 1, py: 0.5 }} variant="caption">
                            자동 매핑 값
                          </Typography>
                          {[
                            ["{이름}", "이름"],
                            ["{직위}", "직위"],
                            ["{교육명}", "교육명"],
                            ["{마감일}", "교육 예정일"],
                          ].map(([token, label]) => (
                            <Box key={token} sx={{ display: "contents" }}>
                              <Typography sx={{ borderBottom: 1, borderColor: "divider", fontFamily: "monospace", px: 1, py: 0.5 }} variant="caption">
                                {token}
                              </Typography>
                              <Typography sx={{ borderBottom: 1, borderColor: "divider", px: 1, py: 0.5 }} variant="caption">
                                {label}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Alert>
                      <TextField
                        label="본문"
                        disabled={!canEdit}
                        multiline
                        minRows={10}
                        onChange={(event) => setEditingRecord((current) => ({ ...current, content: event.target.value }))}
                        required
                        size="small"
                        sx={{ gridColumn: "1 / -1", minWidth: 0 }}
                        value={editingRecord.content}
                      />
                      <TextField
                          label="설명"
                          disabled={!canEdit}
                          multiline
                          minRows={3}
                          onChange={(event) => setEditingRecord((current) => ({ ...current, description: event.target.value }))}
                          size="small"
                          sx={{ gridColumn: "1 / -1", minWidth: 0 }}
                          value={editingRecord.description ?? ""}
                      />
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
        message="선택한 템플릿을 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        loading={deleteMutation.isPending}
        title="템플릿 삭제"
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
