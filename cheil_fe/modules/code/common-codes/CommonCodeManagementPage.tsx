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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { CommonSelectField } from "@/components/common/CommonSelectField";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

import {
  createCommonCode,
  deleteCommonCode,
  listCommonCodes,
  type CommonCodeLevel,
  type CommonCodeRecord,
  type CommonCodeUpsertRequest,
  updateCommonCode,
} from "./api";

type CommonCodeDraft = {
  codeId: number | null;
  codeLevel: CommonCodeLevel;
  level1Code: string;
  level2Code: string;
  level3Code: string;
  codeName: string;
  codeDetailName: string;
  refValue1: string;
  sortOrder: string;
  remark: string;
  useYn: boolean;
  createdAt: string | null;
  createdId: string;
  lastChangedAt: string | null;
  lastChangedId: string;
};

type FilterState = {
  codeLevel: "All" | CommonCodeLevel;
  keyword: string;
  useYn: "All" | "Y" | "N";
};

const emptyFilters = (): FilterState => ({
  codeLevel: "All",
  keyword: "",
  useYn: "All",
});

const displayLevel1Code = (record: CommonCodeRecord) => (record.codeLevel === 1 ? record.level2Code : record.level1Code);
const displayName = (record: CommonCodeRecord) =>
  record.codeLevel === 3 ? record.codeDetailName || record.codeName : record.codeName;

const emptyDraft = (level: CommonCodeLevel = 1, parent?: CommonCodeRecord): CommonCodeDraft => ({
  codeId: null,
  codeLevel: level,
  level1Code: level >= 2 && parent ? displayLevel1Code(parent) : "",
  level2Code: level >= 3 && parent ? parent.level2Code : "",
  level3Code: "",
  codeName: level === 3 && parent ? parent.codeName : "",
  codeDetailName: "",
  refValue1: "",
  sortOrder: "",
  remark: "",
  useYn: true,
  createdAt: null,
  createdId: "",
  lastChangedAt: null,
  lastChangedId: "",
});

const toDraft = (record: CommonCodeRecord): CommonCodeDraft => ({
  codeId: record.codeId,
  codeLevel: record.codeLevel,
  level1Code: displayLevel1Code(record),
  level2Code: record.codeLevel >= 2 ? record.level2Code : "",
  level3Code: record.codeLevel === 3 ? record.level3Code : "",
  codeName: record.codeName,
  codeDetailName: record.codeDetailName ?? "",
  refValue1: record.refValue1 ?? "",
  sortOrder: record.sortOrder == null ? "" : String(record.sortOrder),
  remark: record.remark ?? "",
  useYn: record.useYn,
  createdAt: record.createdAt,
  createdId: record.createdId ?? "",
  lastChangedAt: record.lastChangedAt,
  lastChangedId: record.lastChangedId ?? "",
});

const trimOrEmpty = (value: string) => value.trim();
const formatValue = (value: string | null | undefined) => (value && value.trim() ? value : "-");
const levelLabel = (level: CommonCodeLevel) => `${level}레벨`;

const fieldSx = {
  ...standardFieldSx,
  "& .MuiInputBase-root": {
    minHeight: 40,
  },
} as const;

const sortCommonCodes = (records: CommonCodeRecord[]) =>
  [...records].sort(
    (a, b) =>
      displayLevel1Code(a).localeCompare(displayLevel1Code(b)) ||
      a.level2Code.localeCompare(b.level2Code) ||
      a.level3Code.localeCompare(b.level3Code) ||
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      displayName(a).localeCompare(displayName(b)),
  );

const selectedRowModel = (codeId: number | null) => ({
  type: "include" as const,
  ids: new Set(codeId ? [codeId] : []),
});

export function CommonCodeManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(() => emptyFilters());
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => emptyFilters());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCodeId, setSelectedCodeId] = useState<number | null>(null);
  const [selectedLevel1Code, setSelectedLevel1Code] = useState("");
  const [selectedLevel2Code, setSelectedLevel2Code] = useState("");
  const [draft, setDraft] = useState<CommonCodeDraft>(() => emptyDraft());
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommonCodeRecord | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const commonCodesQuery = useQuery({
    queryKey: ["common-codes", appliedFilters],
    queryFn: () =>
      listCommonCodes({
        codeLevel: appliedFilters.codeLevel,
        keyword: appliedFilters.keyword,
        useYn: appliedFilters.useYn,
      }),
    enabled: canRead,
  });

  const records = useMemo(() => sortCommonCodes(commonCodesQuery.data ?? []), [commonCodesQuery.data]);
  const level1Rows = useMemo(() => records.filter((item) => item.codeLevel === 1), [records]);
  const activeLevel1Code = selectedLevel1Code || (level1Rows[0] ? displayLevel1Code(level1Rows[0]) : "");
  const level2Rows = useMemo(
    () => records.filter((item) => item.codeLevel === 2 && item.level1Code === activeLevel1Code),
    [activeLevel1Code, records],
  );
  const activeLevel2Code = selectedLevel2Code || level2Rows[0]?.level2Code || "";
  const level3Rows = useMemo(
    () =>
      records.filter(
        (item) => item.codeLevel === 3 && item.level1Code === activeLevel1Code && item.level2Code === activeLevel2Code,
      ),
    [activeLevel1Code, activeLevel2Code, records],
  );

  const selectedRecord = useMemo(
    () => records.find((item) => item.codeId === selectedCodeId) ?? null,
    [records, selectedCodeId],
  );
  const displayRecord = useMemo(() => {
    if (isCreating) return null;
    if (selectedRecord) return selectedRecord;
    return level1Rows[0] ?? null;
  }, [isCreating, level1Rows, selectedRecord]);

  const activeDraft = useMemo<CommonCodeDraft>(() => {
    if (isCreating || selectedRecord) return draft;
    if (displayRecord) return toDraft(displayRecord);
    return draft;
  }, [displayRecord, draft, isCreating, selectedRecord]);

  const selectedLevel1Record = level1Rows.find((item) => displayLevel1Code(item) === activeLevel1Code) ?? null;
  const selectedLevel2Record = level2Rows.find((item) => item.level2Code === activeLevel2Code) ?? null;
  const selectedLevel3Record = selectedRecord?.codeLevel === 3 ? selectedRecord : null;
  const canSaveCurrent = isCreating ? canCreate : canUpdate;

  const basicColumns = useMemo<GridColDef<CommonCodeRecord>[]>(
    () => [
      { field: "displayName", headerName: "코드명", minWidth: 150, flex: 1, valueGetter: (_, row) => displayName(row) },
      {
        field: "useYn",
        headerName: "사용",
        width: 78,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Chip
            color={params.value ? "success" : "default"}
            label={params.value ? "사용" : "미사용"}
            size="small"
            variant={params.value ? "filled" : "outlined"}
          />
        ),
      },
    ],
    [],
  );

  const level1Columns = useMemo<GridColDef<CommonCodeRecord>[]>(
    () => [{ field: "level2Code", headerName: "1레벨 코드", width: 110 }, ...basicColumns],
    [basicColumns],
  );
  const level2Columns = useMemo<GridColDef<CommonCodeRecord>[]>(
    () => [{ field: "level2Code", headerName: "2레벨 코드", width: 110 }, ...basicColumns],
    [basicColumns],
  );
  const level3Columns = useMemo<GridColDef<CommonCodeRecord>[]>(
    () => [
      { field: "level3Code", headerName: "3레벨 코드", width: 110 },
      ...basicColumns,
    ],
    [basicColumns],
  );

  const handleSearch = (keyword: string) => {
    setAppliedFilters({ ...filters, keyword: keyword.trim() });
    setSelectedCodeId(null);
    setSelectedLevel1Code("");
    setSelectedLevel2Code("");
    setIsCreating(false);
  };

  const handleResetSearch = () => {
    const next = emptyFilters();
    setFilters(next);
    setSearchKeyword("");
    setAppliedFilters(next);
    setSelectedCodeId(null);
    setSelectedLevel1Code("");
    setSelectedLevel2Code("");
    setIsCreating(false);
  };

  const handleNew = (level: CommonCodeLevel) => {
    if (level === 2 && !selectedLevel1Record) {
      setSnackbar({ message: "먼저 1레벨 코드를 선택하세요.", severity: "error" });
      return;
    }
    if (level === 3 && !selectedLevel2Record) {
      setSnackbar({ message: "먼저 2레벨 코드를 선택하세요.", severity: "error" });
      return;
    }

    const parent = level === 2 ? selectedLevel1Record : selectedLevel2Record;
    setSelectedCodeId(null);
    setIsCreating(true);
    setDraft(emptyDraft(level, parent ?? undefined));
    setSnackbar({ message: `${levelLabel(level)} 공통코드를 입력하세요.`, severity: "info" });
  };

  const handleSelect = (record: CommonCodeRecord) => {
    setSelectedCodeId(record.codeId);
    setSelectedLevel1Code(displayLevel1Code(record));
    setSelectedLevel2Code(record.codeLevel >= 2 ? record.level2Code : "");
    setIsCreating(false);
    setDraft(toDraft(record));
  };

  const normalizeDraft = (current: CommonCodeDraft): CommonCodeDraft => ({
    ...current,
    codeName: trimOrEmpty(current.codeName),
    codeDetailName: current.codeLevel === 3 ? trimOrEmpty(current.codeDetailName) : "",
    createdId: trimOrEmpty(current.createdId),
    lastChangedId: trimOrEmpty(current.lastChangedId),
    level1Code: trimOrEmpty(current.level1Code),
    level2Code: current.codeLevel >= 2 ? trimOrEmpty(current.level2Code) : "",
    level3Code: current.codeLevel === 3 ? trimOrEmpty(current.level3Code) : "",
    refValue1: trimOrEmpty(current.refValue1),
    remark: trimOrEmpty(current.remark),
    sortOrder: trimOrEmpty(current.sortOrder),
  });

  const validateDraft = (current: CommonCodeDraft) => {
    const normalized = normalizeDraft(current);
    if (!normalized.level1Code) return "1레벨 코드는 필수입니다.";
    if (normalized.codeLevel >= 2 && !normalized.level2Code) return "2레벨 코드는 필수입니다.";
    if (normalized.codeLevel === 3 && !normalized.level3Code) return "3레벨 코드는 필수입니다.";
    if (!normalized.codeName) return "코드명은 필수입니다.";
    if (normalized.sortOrder && !Number.isFinite(Number(normalized.sortOrder))) return "정렬순서는 숫자로 입력하세요.";
    return "";
  };

  const saveMutation = useMutation({
    mutationFn: async (value: CommonCodeDraft) => {
      const normalized = normalizeDraft(value);
      const requestBody: CommonCodeUpsertRequest = {
        codeLevel: normalized.codeLevel,
        codeName: normalized.codeName,
        codeDetailName: normalized.codeDetailName || null,
        createdId: normalized.createdId || null,
        lastChangedId: normalized.lastChangedId || null,
        level1Code: normalized.level1Code,
        level2Code: normalized.codeLevel >= 2 ? normalized.level2Code : null,
        level3Code: normalized.codeLevel === 3 ? normalized.level3Code : null,
        refValue1: normalized.refValue1 || null,
        remark: normalized.remark || null,
        sortOrder: normalized.sortOrder ? Number(normalized.sortOrder) : null,
        useYn: normalized.useYn,
      };

      if (normalized.codeId === null) {
        return createCommonCode(requestBody);
      }
      return updateCommonCode(normalized.codeId, requestBody);
    },
    onSuccess: (saved) => {
      setSelectedCodeId(saved.codeId);
      setSelectedLevel1Code(displayLevel1Code(saved));
      setSelectedLevel2Code(saved.codeLevel >= 2 ? saved.level2Code : "");
      setIsCreating(false);
      setDraft(toDraft(saved));
      queryClient.invalidateQueries({ queryKey: ["common-codes"] });
      setSnackbar({ message: "공통코드를 저장했습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({ message: error instanceof Error ? error.message : "공통코드 저장에 실패했습니다.", severity: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCommonCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["common-codes"] });
      setSelectedCodeId(null);
      setIsCreating(false);
      setDraft(emptyDraft());
      setDeleteTarget(null);
      setSnackbar({ message: "공통코드를 삭제했습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({ message: error instanceof Error ? error.message : "공통코드 삭제에 실패했습니다.", severity: "error" });
    },
  });

  const handleSave = () => {
    if (!canSaveCurrent) {
      setSnackbar({ message: "저장 권한이 없습니다.", severity: "error" });
      return;
    }

    const errorMessage = validateDraft(activeDraft);
    if (errorMessage) {
      setSnackbar({ message: errorMessage, severity: "error" });
      return;
    }

    saveMutation.mutate(activeDraft);
  };

  const selectedStatusLabel = activeDraft.useYn ? "사용" : "미사용";
  const selectedStatusColor = activeDraft.useYn ? ("success" as const) : ("default" as const);
  const level2CodeDisabled = activeDraft.codeLevel === 1;
  const level3CodeDisabled = activeDraft.codeLevel !== 3;

  const gridSx = {
    border: 0,
    height: { xs: 360, lg: "clamp(420px, calc(100vh - 340px), 560px)" },
    minHeight: 0,
    "& .MuiDataGrid-main": {
      overflow: "hidden",
    },
    "& .MuiDataGrid-row:hover": {
      cursor: "pointer",
    },
    "& .MuiDataGrid-virtualScroller": {
      overflowY: "auto",
      overscrollBehavior: "contain",
    },
  } as const;

  return (
    <Box>
      <PageHeader title="공통코드 관리" />

      <SearchPanel
        keyword={searchKeyword}
        keywordPlaceholder="코드, 코드명, 참조값, 비고 검색"
        onKeywordChange={setSearchKeyword}
        onReset={handleResetSearch}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <CommonSelectField
          label="레벨"
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              codeLevel: value === "All" || value === "" ? "All" : (Number(value) as CommonCodeLevel),
            }))
          }
          options={[
            { label: "전체", value: "All" },
            { label: "1레벨", value: "1" },
            { label: "2레벨", value: "2" },
            { label: "3레벨", value: "3" },
          ]}
          placeholder="전체"
          placeholderDisabled={false}
          sx={{ ...fieldSx, minWidth: 140 }}
          value={String(filters.codeLevel) as "All" | "1" | "2" | "3"}
        />
        <CommonSelectField
          label="사용 여부"
          onChange={(value) => setFilters((current) => ({ ...current, useYn: (value || "All") as FilterState["useYn"] }))}
          options={[
            { label: "전체", value: "All" },
            { label: "사용", value: "Y" },
            { label: "미사용", value: "N" },
          ]}
          placeholder="전체"
          placeholderDisabled={false}
          sx={{ ...fieldSx, minWidth: 150 }}
          value={filters.useYn}
        />
      </SearchPanel>

      <Box sx={{ alignItems: "start", display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 9fr) minmax(360px, 3fr)" } }}>
        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
              {[
                {
                  title: "1레벨",
                  subtitle: "분류 코드",
                  rows: level1Rows,
                  columns: level1Columns,
                  selectedId: selectedLevel1Record?.codeId ?? null,
                  onNew: () => handleNew(1),
                },
                {
                  title: "2레벨",
                  subtitle: selectedLevel1Record ? selectedLevel1Record.codeName : "1레벨을 선택하세요",
                  rows: level2Rows,
                  columns: level2Columns,
                  selectedId: selectedLevel2Record?.codeId ?? null,
                  onNew: () => handleNew(2),
                },
                {
                  title: "3레벨",
                  subtitle: selectedLevel2Record ? selectedLevel2Record.codeName : "2레벨을 선택하세요",
                  rows: level3Rows,
                  columns: level3Columns,
                  selectedId: selectedLevel3Record?.codeId ?? null,
                  onNew: () => handleNew(3),
                },
              ].map((section) => (
                <Box key={section.title} sx={{ minWidth: 0 }}>
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                        {section.title}
                      </Typography>
                      <Typography color="text.secondary" noWrap variant="body2">
                        {section.subtitle}
                      </Typography>
                    </Box>
                    <Button disabled={!canCreate} onClick={section.onNew} size="small" startIcon={<AddOutlinedIcon />} variant="outlined">
                      추가
                    </Button>
                  </Box>
                  <EnterpriseDataGrid<CommonCodeRecord>
                    columns={section.columns}
                    getRowId={(row) => row.codeId}
                    hideFooter
                    hideFooterSelectedRowCount
                    loading={commonCodesQuery.isLoading}
                    onRowClick={(params) => handleSelect(params.row)}
                    paginationMode="server"
                    rowCount={section.rows.length}
                    rowSelectionModel={selectedRowModel(section.selectedId)}
                    rows={section.rows}
                    showToolbar={false}
                    wrapperMinHeight={{ xs: 360, lg: "clamp(420px, calc(100vh - 340px), 560px)" }}
                    sx={gridSx}
                  />
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                    <Chip label={`총 ${section.rows.length}건`} size="small" variant="outlined" />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Box sx={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  공통코드 상세
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {displayRecord ? `${displayRecord.codeId} / ${displayName(displayRecord)}` : "신규 공통코드를 입력합니다."}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
                <Chip label={levelLabel(activeDraft.codeLevel)} variant="outlined" />
                <Chip color={selectedStatusColor} label={selectedStatusLabel} />
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end", mb: 2, width: "100%" }}>
              <Button disabled={!canSaveCurrent || saveMutation.isPending} onClick={handleSave} startIcon={<SaveOutlinedIcon />} variant="contained">
                저장
              </Button>
              <Button
                color="error"
                disabled={!canDelete || !displayRecord || deleteMutation.isPending}
                onClick={() => displayRecord && setDeleteTarget(displayRecord)}
                startIcon={<DeleteOutlineOutlinedIcon />}
                variant="outlined"
              >
                삭제
              </Button>
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField disabled fullWidth label="ID" size="small" sx={fieldSx} value={activeDraft.codeId ?? ""} />
              <TextField
                fullWidth
                label="레벨"
                onChange={(event) =>
                  setDraft((current) => {
                    const nextLevel = Number(event.target.value) as CommonCodeLevel;
                    return {
                      ...current,
                      codeLevel: nextLevel,
                      codeDetailName: nextLevel === 3 ? current.codeDetailName : "",
                      level2Code: nextLevel >= 2 ? current.level2Code : "",
                      level3Code: nextLevel === 3 ? current.level3Code : "",
                    };
                  })
                }
                select
                size="small"
                sx={fieldSx}
                value={activeDraft.codeLevel}
              >
                <MenuItem value={1}>1레벨</MenuItem>
                <MenuItem value={2}>2레벨</MenuItem>
                <MenuItem value={3}>3레벨</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="1레벨 코드"
                onChange={(event) => setDraft((current) => ({ ...current, level1Code: event.target.value }))}
                size="small"
                sx={fieldSx}
                value={activeDraft.level1Code}
              />
              <TextField
                disabled={level2CodeDisabled}
                fullWidth
                label="2레벨 코드"
                onChange={(event) => setDraft((current) => ({ ...current, level2Code: event.target.value }))}
                size="small"
                sx={fieldSx}
                value={activeDraft.level2Code}
              />
              <TextField
                disabled={level3CodeDisabled}
                fullWidth
                label="3레벨 코드"
                onChange={(event) => setDraft((current) => ({ ...current, level3Code: event.target.value }))}
                size="small"
                sx={fieldSx}
                value={activeDraft.level3Code}
              />
              <TextField
                fullWidth
                label="정렬순서"
                onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
                size="small"
                sx={fieldSx}
                value={activeDraft.sortOrder}
              />

              <TextField
                fullWidth
                label="코드명"
                onChange={(event) => setDraft((current) => ({ ...current, codeName: event.target.value }))}
                size="small"
                sx={fieldSx}
                value={activeDraft.codeName}
              />
              <TextField
                disabled={activeDraft.codeLevel !== 3}
                fullWidth
                label="상세 코드명"
                onChange={(event) => setDraft((current) => ({ ...current, codeDetailName: event.target.value }))}
                size="small"
                sx={fieldSx}
                value={activeDraft.codeDetailName}
              />
              <TextField
                fullWidth
                label="참조값1"
                minRows={6}
                multiline
                onChange={(event) => setDraft((current) => ({ ...current, refValue1: event.target.value }))}
                size="small"
                sx={{ ...fieldSx, gridColumn: "1 / -1" }}
                value={activeDraft.refValue1}
              />
              <TextField
                fullWidth
                label="비고"
                onChange={(event) => setDraft((current) => ({ ...current, remark: event.target.value }))}
                size="small"
                sx={fieldSx}
                value={activeDraft.remark}
              />

              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5, gridColumn: "1 / -1" }}>
                <Switch checked={activeDraft.useYn} onChange={(_, checked) => setDraft((current) => ({ ...current, useYn: checked }))} />
                <Typography variant="body2">사용</Typography>
              </Box>

              <TextField disabled fullWidth label="생성자" size="small" sx={fieldSx} value={activeDraft.createdId} />
              <TextField disabled fullWidth label="최종 변경자" size="small" sx={fieldSx} value={activeDraft.lastChangedId} />
              <TextField disabled fullWidth label="생성일시" size="small" sx={fieldSx} value={formatValue(activeDraft.createdAt)} />
              <TextField disabled fullWidth label="최종 변경일시" size="small" sx={fieldSx} value={formatValue(activeDraft.lastChangedAt)} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Dialog fullWidth maxWidth="xs" onClose={() => setDeleteTarget(null)} open={Boolean(deleteTarget)}>
        <DialogTitle>공통코드를 삭제하시겠습니까?</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" variant="body2">
            선택한 공통코드
          </Typography>
          <Typography sx={{ fontWeight: 700, mt: 0.75 }} variant="body1">
            {deleteTarget ? `${deleteTarget.codeId} / ${displayName(deleteTarget)}` : ""}
          </Typography>
          <Typography sx={{ mt: 1.5 }} variant="body2">
            하위 코드가 있으면 삭제할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)} variant="outlined">
            취소
          </Button>
          <Button color="error" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.codeId)} variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar autoHideDuration={2500} onClose={() => setSnackbar(null)} open={Boolean(snackbar)}>
        <Alert severity={snackbar?.severity ?? "info"} sx={{ width: "100%" }} variant="filled">
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
