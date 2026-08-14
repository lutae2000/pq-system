"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
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
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  display,
  initialEducationRequirements,
  nowText,
  type EducationRequirementCycleUnit,
  type EducationRequirementRecord,
} from "@/modules/pq/education-reminders/educationReminderTypes";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const CYCLE_UNIT_OPTIONS: Array<{ label: string; value: EducationRequirementCycleUnit }> = [
  { label: "개월", value: "개월" },
  { label: "년", value: "년" },
];

type FilterState = {
  keyword: string;
  active: "" | "Y" | "N";
};

const emptyFilterState = (): FilterState => ({
  active: "",
  keyword: "",
});

const emptyRecord = (): EducationRequirementRecord => ({
  active: true,
  code: "",
  description: "",
  id: 0,
  name: "",
  cycleUnit: "년",
  cycleValue: 1,
  updatedAt: nowText(),
});

const matchesKeyword = (row: EducationRequirementRecord, keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.code, row.name, row.description, `${row.cycleValue}${row.cycleUnit}`, row.updatedAt]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalized));
};

function SummaryCard({ color = "text.primary", label, value }: { color?: string; label: string; value: string }) {
  return (
    <Card>
      <CardContent sx={{ p: 1.5 }}>
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography color={color} sx={{ fontWeight: 800, mt: 0.5 }} variant="h5">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }} variant="body2">
        {value || "-"}
      </Typography>
    </Box>
  );
}

export function EducationReminderBasicInfoManagementTab() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const [filters, setFilters] = useState<FilterState>(() => emptyFilterState());
  const [rows, setRows] = useState<EducationRequirementRecord[]>(initialEducationRequirements);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(initialEducationRequirements[0]?.id ?? null);
  const [draft, setDraft] = useState<EducationRequirementRecord>(() => initialEducationRequirements[0] ?? emptyRecord());
  const [deleteTarget, setDeleteTarget] = useState<EducationRequirementRecord | null>(null);

  const selectedRow = useMemo(() => rows.find((row) => row.id === selectedRowId) ?? null, [rows, selectedRowId]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (filters.active === "Y" && !row.active) {
          return false;
        }
        if (filters.active === "N" && row.active) {
          return false;
        }
        return matchesKeyword(row, filters.keyword);
      }),
    [filters.active, filters.keyword, rows],
  );

  const summary = useMemo(() => {
    const active = rows.filter((row) => row.active).length;
    const inactive = rows.filter((row) => !row.active).length;
    const yearly = rows.filter((row) => row.cycleUnit === "년").length;
    const monthly = rows.filter((row) => row.cycleUnit === "개월").length;
    return { active, inactive, monthly, yearly };
  }, [rows]);

  const columns = useMemo<GridColDef<EducationRequirementRecord>[]>(
    () => [
      { field: "code", headerName: "코드", width: 120 },
      { field: "name", headerName: "명칭", minWidth: 220, flex: 1.1 },
      {
        field: "cycle",
        headerName: "이수 주기",
        width: 130,
        valueGetter: (_value, row) => `${row.cycleValue}${row.cycleUnit}`,
      },
      { field: "description", headerName: "설명", minWidth: 220, flex: 1 },
      {
        field: "active",
        headerName: "사용",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Chip color={row.active ? "success" : "default"} label={row.active ? "Y" : "N"} size="small" variant={row.active ? "filled" : "outlined"} />
        ),
      },
      { field: "updatedAt", headerName: "수정일시", width: 150, valueGetter: (_value, row) => display(row.updatedAt) },
    ],
    [],
  );

  const resetDraft = (row?: EducationRequirementRecord | null) => {
    if (row) {
      setDraft(row);
      return;
    }
    setDraft(emptyRecord());
    setSelectedRowId(null);
  };

  const saveDraft = () => {
    const normalized: EducationRequirementRecord = {
      ...draft,
      id: draft.id || Math.max(0, ...rows.map((item) => item.id)) + 1,
      updatedAt: nowText(),
    };

    setRows((current) => {
      const exists = current.some((item) => item.id === normalized.id);
      return exists ? current.map((item) => (item.id === normalized.id ? normalized : item)) : [normalized, ...current];
    });
    setSelectedRowId(normalized.id);
    setDraft(normalized);
  };

  const deleteSelected = () => {
    if (!deleteTarget) {
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    if (selectedRowId === deleteTarget.id) {
      setSelectedRowId(null);
      setDraft(emptyRecord());
    }
    setDeleteTarget(null);
  };

  if (!canRead) {
    return <Alert severity="warning">법정 필수교육 기초정보 조회 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
        <SummaryCard label="활성" value={`${summary.active}건`} />
        <SummaryCard color="text.secondary" label="비활성" value={`${summary.inactive}건`} />
        <SummaryCard color="success.main" label="년 주기" value={`${summary.yearly}건`} />
        <SummaryCard color="warning.main" label="개월 주기" value={`${summary.monthly}건`} />
      </Box>

      <SearchPanel
        keyword={filters.keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="코드, 명칭, 설명, 주기"
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
          label="사용여부"
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
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                필수 이수 교육 기초정보
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button disabled={!canCreate} onClick={() => resetDraft(emptyRecord())} startIcon={<AddOutlinedIcon />} variant="outlined">
                  신규
                </Button>
                <Button
                  disabled={!selectedRow || !canUpdate}
                  onClick={() => selectedRow && resetDraft(selectedRow)}
                  startIcon={<AddOutlinedIcon />}
                  variant="outlined"
                >
                  불러오기
                </Button>
                <Button disabled={!draft.code.trim() || !draft.name.trim() || !canUpdate} onClick={saveDraft} startIcon={<SaveOutlinedIcon />} variant="contained">
                  저장
                </Button>
                <Button color="error" disabled={!selectedRow || !canDelete} onClick={() => setDeleteTarget(selectedRow)} startIcon={<DeleteOutlineOutlinedIcon />} variant="outlined">
                  삭제
                </Button>
              </Stack>
            </Box>

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" } }}>
              <Box sx={{ minWidth: 0 }}>
                <EnterpriseDataGrid<EducationRequirementRecord>
                  columns={columns}
                  getRowId={(row) => row.id}
                  hideFooterSelectedRowCount
                  onRowClick={(params: GridRowParams<EducationRequirementRecord>) => {
                    setSelectedRowId(params.row.id);
                    setDraft(params.row);
                  }}
                  onRowDoubleClick={(params: GridRowParams<EducationRequirementRecord>) => {
                    setSelectedRowId(params.row.id);
                    setDraft(params.row);
                  }}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  rows={filteredRows}
                  showPageNumbers
                  showXlsxExportButton
                  wrapperMinHeight={620}
                  sx={{ height: 620, minWidth: 0, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </Box>

              <Card variant="outlined" sx={{ minWidth: 0 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    편집 상세
                  </Typography>
                  <Divider />
                  <Stack spacing={1.25}>
                    <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                      <TextField
                        label="코드"
                        onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))}
                        size="small"
                        sx={{ minWidth: 0 }}
                        value={draft.code}
                      />
                      <TextField
                        label="명칭"
                        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                        size="small"
                        sx={{ minWidth: 0 }}
                        value={draft.name}
                      />
                      <TextField
                        label="이수 주기"
                        onChange={(event) => setDraft((current) => ({ ...current, cycleValue: Number(event.target.value) || 0 }))}
                        size="small"
                        sx={{ minWidth: 0 }}
                        type="number"
                        value={draft.cycleValue}
                      />
                      <TextField
                        select
                        label="단위"
                        onChange={(event) => setDraft((current) => ({ ...current, cycleUnit: event.target.value as EducationRequirementCycleUnit }))}
                        size="small"
                        sx={{ minWidth: 0 }}
                        value={draft.cycleUnit}
                      >
                        {CYCLE_UNIT_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="설명"
                        multiline
                        minRows={4}
                        onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                        size="small"
                        sx={{ gridColumn: "1 / -1", minWidth: 0 }}
                        value={draft.description}
                      />
                      <TextField
                        disabled
                        label="수정일시"
                        size="small"
                        sx={{ minWidth: 0 }}
                        value={draft.updatedAt}
                      />
                      <TextField
                        select
                        label="사용여부"
                        onChange={(event) => setDraft((current) => ({ ...current, active: event.target.value === "Y" }))}
                        size="small"
                        sx={{ minWidth: 0 }}
                        value={draft.active ? "Y" : "N"}
                      >
                        <MenuItem value="Y">사용</MenuItem>
                        <MenuItem value="N">미사용</MenuItem>
                      </TextField>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip color={draft.active ? "success" : "default"} label={draft.active ? "사용" : "미사용"} size="small" variant={draft.active ? "filled" : "outlined"} />
                      <Chip label={`${draft.cycleValue}${draft.cycleUnit}`} size="small" variant="outlined" />
                    </Box>

                    <DetailItem label="현재 선택" value={selectedRow ? `${selectedRow.code} / ${selectedRow.name}` : "-"} />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        message="선택한 필수 이수 교육 기초정보를 삭제하시겠습니까?"
        open={Boolean(deleteTarget)}
        title="기초정보 삭제"
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteSelected}
      />
    </Stack>
  );
}
