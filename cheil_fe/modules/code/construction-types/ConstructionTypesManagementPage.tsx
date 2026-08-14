"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
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
  createConstructionType,
  deleteConstructionType,
  listConstructionTypes,
  type ConstructionTypeLevel,
  type ConstructionTypeRecord,
  updateConstructionType,
} from "@/modules/code/construction-types/api";

type ConstructionTypeDraft = {
  codeId: number | null;
  codeLevel: ConstructionTypeLevel;
  codeName: string;
  createdAt: string | null;
  createdId: string;
  lastChangedAt: string | null;
  lastChangedId: string;
  level1Code: string;
  level2Code: string;
  level3Code: string;
  useYn: boolean;
};

type FilterState = {
  codeLevel: "All" | ConstructionTypeLevel;
  keyword: string;
  useYn: "All" | "Y" | "N";
};

const emptyFilters = (): FilterState => ({
  codeLevel: "All",
  keyword: "",
  useYn: "All",
});

const emptyDraft = (level: ConstructionTypeLevel = 1, parent?: ConstructionTypeRecord): ConstructionTypeDraft => ({
  codeId: null,
  codeLevel: level,
  codeName: "",
  createdAt: null,
  createdId: "",
  lastChangedAt: null,
  lastChangedId: "",
  level1Code: parent?.level1Code ?? "",
  level2Code: level >= 3 ? parent?.level2Code ?? "" : "",
  level3Code: "",
  useYn: true,
});

const toDraft = (record: ConstructionTypeRecord): ConstructionTypeDraft => ({
  codeId: record.codeId,
  codeLevel: record.codeLevel,
  codeName: record.codeName,
  createdAt: record.createdAt,
  createdId: record.createdId ?? "",
  lastChangedAt: record.lastChangedAt,
  lastChangedId: record.lastChangedId ?? "",
  level1Code: record.level1Code,
  level2Code: record.level2Code,
  level3Code: record.level3Code,
  useYn: record.useYn,
});

const trimOrEmpty = (value: string) => value.trim();
const formatValue = (value: string | null | undefined) => (value && value.trim() ? value : "-");
const levelLabel = (level: ConstructionTypeLevel) => `${level}단계`;

const fieldSx = {
  ...standardFieldSx,
  "& .MuiInputBase-root": {
    minHeight: 40,
  },
} as const;

const sortConstructionTypes = (records: ConstructionTypeRecord[]) =>
  [...records].sort(
    (a, b) =>
      a.level1Code.localeCompare(b.level1Code) ||
      a.level2Code.localeCompare(b.level2Code) ||
      a.level3Code.localeCompare(b.level3Code) ||
      a.codeName.localeCompare(b.codeName),
  );

export function ConstructionTypesManagementPage() {
  const { canCreate, canRead } = useCurrentMenuPermission();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(() => emptyFilters());
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => emptyFilters());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCodeId, setSelectedCodeId] = useState<number | null>(null);
  const [selectedLevel1Code, setSelectedLevel1Code] = useState<string>("");
  const [selectedLevel2Code, setSelectedLevel2Code] = useState<string>("");
  const [draft, setDraft] = useState<ConstructionTypeDraft>(() => emptyDraft());
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConstructionTypeRecord | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const constructionTypesQuery = useQuery({
    queryKey: ["construction-types", appliedFilters],
    queryFn: () =>
      listConstructionTypes({
        codeLevel: appliedFilters.codeLevel,
        keyword: appliedFilters.keyword,
        useYn: appliedFilters.useYn,
      }),
  });

  const records = useMemo(() => sortConstructionTypes(constructionTypesQuery.data ?? []), [constructionTypesQuery.data]);
  const level1Rows = useMemo(() => records.filter((item) => item.codeLevel === 1), [records]);
  const activeLevel1Code = selectedLevel1Code || level1Rows[0]?.level1Code || "";
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
    if (isCreating) {
      return null;
    }

    if (selectedRecord) {
      return selectedRecord;
    }

    return level1Rows[0] ?? null;
  }, [isCreating, level1Rows, selectedRecord]);
  const activeDraft = useMemo<ConstructionTypeDraft>(() => {
    if (isCreating || selectedRecord) {
      return draft;
    }

    if (displayRecord) {
      return toDraft(displayRecord);
    }

    return draft;
  }, [displayRecord, draft, isCreating, selectedRecord]);

  const selectedRowModel = (codeId: number | null) => ({
    type: "include" as const,
    ids: new Set(codeId ? [codeId] : []),
  });

  const basicColumns = useMemo<GridColDef<ConstructionTypeRecord>[]>(
    () => [
      { field: "codeName", headerName: "공사종류명", minWidth: 160, flex: 1 },
      {
        field: "useYn",
        headerName: "사용",
        width: 82,
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

  const level1Columns = useMemo<GridColDef<ConstructionTypeRecord>[]>(
    () => [{ field: "level1Code", headerName: "1단계 코드", width: 110 }, ...basicColumns],
    [basicColumns],
  );

  const level2Columns = useMemo<GridColDef<ConstructionTypeRecord>[]>(
    () => [{ field: "level2Code", headerName: "2단계 코드", width: 110 }, ...basicColumns],
    [basicColumns],
  );

  const level3Columns = useMemo<GridColDef<ConstructionTypeRecord>[]>(
    () => [{ field: "level3Code", headerName: "3단계 코드", width: 110 }, ...basicColumns],
    [basicColumns],
  );

  const handleSearch = (keyword: string) => {
    const nextFilters = {
      keyword: keyword.trim(),
      codeLevel: filters.codeLevel,
      useYn: filters.useYn,
    };

    setAppliedFilters(nextFilters);
    setSelectedCodeId(null);
    setSelectedLevel1Code("");
    setSelectedLevel2Code("");
    setIsCreating(false);
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["construction-types"] });
    }, 0);
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
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["construction-types"] });
    }, 0);
  };

  const handleNew = (level: ConstructionTypeLevel) => {
    if (level === 2 && !activeLevel1Code) {
      setSnackbar({ message: "먼저 1단계 공사종류를 선택하세요.", severity: "error" });
      return;
    }

    if (level === 3 && (!activeLevel1Code || !activeLevel2Code)) {
      setSnackbar({ message: "먼저 1단계와 2단계 공사종류를 선택하세요.", severity: "error" });
      return;
    }

    const parent =
      level === 2
        ? level1Rows.find((item) => item.level1Code === activeLevel1Code)
        : level2Rows.find((item) => item.level2Code === activeLevel2Code);

    setSelectedCodeId(null);
    setIsCreating(true);
    setDraft(emptyDraft(level, parent));
    setSnackbar({ message: `${levelLabel(level)} 공사종류를 입력하세요.`, severity: "info" });
  };

  const handleSelect = (record: ConstructionTypeRecord) => {
    setSelectedCodeId(record.codeId);
    setSelectedLevel1Code(record.level1Code);
    setSelectedLevel2Code(record.codeLevel === 1 ? "" : record.level2Code);
    setIsCreating(false);
    setDraft(toDraft(record));
  };

  const normalizeDraft = (current: ConstructionTypeDraft): ConstructionTypeDraft => {
    const next: ConstructionTypeDraft = {
      ...current,
      codeName: trimOrEmpty(current.codeName),
      createdId: trimOrEmpty(current.createdId),
      lastChangedId: trimOrEmpty(current.lastChangedId),
      level1Code: trimOrEmpty(current.level1Code),
      level2Code: trimOrEmpty(current.level2Code),
      level3Code: trimOrEmpty(current.level3Code),
    };

    if (next.codeLevel === 1) {
      next.level2Code = "";
      next.level3Code = "";
    } else if (next.codeLevel === 2) {
      next.level3Code = "";
    }

    return next;
  };

  const validateDraft = (current: ConstructionTypeDraft) => {
    const normalized = normalizeDraft(current);

    if (!normalized.codeName) {
      return "공사종류명은 필수입니다.";
    }

    if (!normalized.level1Code) {
      return "1단계 코드는 필수입니다.";
    }

    if (normalized.codeLevel >= 2 && !normalized.level2Code) {
      return "2단계 코드는 필수입니다.";
    }

    if (normalized.codeLevel === 3 && !normalized.level3Code) {
      return "3단계 코드는 필수입니다.";
    }

    return "";
  };

  const handleSave = () => {
    const errorMessage = validateDraft(activeDraft);

    if (errorMessage) {
      setSnackbar({ message: errorMessage, severity: "error" });
      return;
    }

    saveMutation.mutate(activeDraft);
  };

  const saveMutation = useMutation({
    mutationFn: async (value: ConstructionTypeDraft) => {
      const normalized = normalizeDraft(value);
      const requestBody = {
        codeLevel: normalized.codeLevel,
        codeName: normalized.codeName,
        createdId: normalized.createdId || null,
        lastChangedId: normalized.lastChangedId || null,
        level1Code: normalized.level1Code,
        level2Code: normalized.level2Code || null,
        level3Code: normalized.level3Code || null,
        useYn: normalized.useYn,
      };

      if (normalized.codeId === null) {
        return createConstructionType(requestBody);
      }

      return updateConstructionType(normalized.codeId, requestBody);
    },
    onSuccess: (saved) => {
      setSelectedCodeId(saved.codeId);
      setSelectedLevel1Code(saved.level1Code);
      setSelectedLevel2Code(saved.codeLevel === 1 ? "" : saved.level2Code);
      setIsCreating(false);
      setDraft(toDraft(saved));
      queryClient.invalidateQueries({ queryKey: ["construction-types"] });
      setSnackbar({ message: "공사종류를 저장했습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({
        message: error instanceof Error ? error.message : "공사종류 저장에 실패했습니다.",
        severity: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConstructionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["construction-types"] });
      setSelectedCodeId(null);
      setIsCreating(false);
      setDraft(emptyDraft());
      setDeleteTarget(null);
      setSnackbar({ message: "공사종류를 삭제했습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({
        message: error instanceof Error ? error.message : "공사종류 삭제에 실패했습니다.",
        severity: "error",
      });
    },
  });

  const selectedStatusLabel = activeDraft.useYn ? "사용" : "미사용";
  const selectedLevelLabel = levelLabel(activeDraft.codeLevel);
  const selectedStatusColor = activeDraft.useYn ? ("success" as const) : ("default" as const);
  const level2Disabled = activeDraft.codeLevel === 1;
  const level3Disabled = activeDraft.codeLevel !== 3;
  const selectedLevel1Record = level1Rows.find((item) => item.level1Code === activeLevel1Code) ?? null;
  const selectedLevel2Record = level2Rows.find((item) => item.level2Code === activeLevel2Code) ?? null;
  const level1Count = level1Rows.length;
  const level2Count = level2Rows.length;
  const level3Count = level3Rows.length;

  const gridSx = {
    border: 0,
    minHeight: 360,
    "& .MuiDataGrid-row:hover": {
      cursor: "pointer",
    },
  } as const;

  return (
    <Box>
      <PageHeader title="공사종류" description="공사종류를 1단계, 2단계, 3단계 구조로 조회하고 관리합니다." />


      <SearchPanel
        keyword={searchKeyword}
        keywordPlaceholder="코드, 공사종류명 검색"
        onKeywordChange={setSearchKeyword}
        onReset={handleResetSearch}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <CommonSelectField
          label="단계"
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              codeLevel: value === "All" || value === "" ? "All" : (Number(value) as ConstructionTypeLevel),
            }))
          }
          options={[
            { label: "전체", value: "All" },
            { label: "1단계", value: "1" },
            { label: "2단계", value: "2" },
            { label: "3단계", value: "3" },
          ]}
          placeholder="전체"
          placeholderDisabled={false}
          sx={{ ...fieldSx, minWidth: 140 }}
          value={String(filters.codeLevel) as "All" | "1" | "2" | "3"}
        />
        <CommonSelectField
          label="사용 여부"
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              useYn: (value || "All") as FilterState["useYn"],
            }))
          }
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

      <Box
        sx={{
          alignItems: "start",
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 9.2fr) minmax(300px, 2.8fr)" },
      }}
      >
        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  공사종류 목록
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  상위 단계를 선택하면 하위 단계 목록이 함께 필터링됩니다.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                      1단계
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      대분류
                    </Typography>
                  </Box>
                  <Button disabled={!canCreate} size="small" startIcon={<AddOutlinedIcon />} onClick={() => handleNew(1)} variant="outlined">
                    추가
                  </Button>
                </Box>
                <EnterpriseDataGrid<ConstructionTypeRecord>
                  columns={level1Columns}
                  getRowId={(row) => row.codeId}
                  hideFooterSelectedRowCount
                  loading={constructionTypesQuery.isLoading}
                  onRowClick={(params) => handleSelect(params.row)}
                  rowSelectionModel={selectedRowModel(selectedLevel1Record?.codeId ?? null)}
                  rows={level1Rows}
                  showToolbar={false}
                  sx={gridSx}
                />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                  <Chip label={`총 ${level1Count}건`} size="small" variant="outlined" />
                </Box>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                      2단계
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {selectedLevel1Record ? selectedLevel1Record.codeName : "1단계를 선택하세요."}
                    </Typography>
                  </Box>
                  <Button disabled={!canCreate} size="small" startIcon={<AddOutlinedIcon />} onClick={() => handleNew(2)} variant="outlined">
                    추가
                  </Button>
                </Box>
                <EnterpriseDataGrid<ConstructionTypeRecord>
                  columns={level2Columns}
                  getRowId={(row) => row.codeId}
                  hideFooterSelectedRowCount
                  loading={constructionTypesQuery.isLoading}
                  onRowClick={(params) => handleSelect(params.row)}
                  rowSelectionModel={selectedRowModel(selectedLevel2Record?.codeId ?? null)}
                  rows={level2Rows}
                  showToolbar={false}
                  sx={gridSx}
                />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                  <Chip label={`총 ${level2Count}건`} size="small" variant="outlined" />
                </Box>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                      3단계
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {selectedLevel2Record ? selectedLevel2Record.codeName : "2단계를 선택하세요."}
                    </Typography>
                  </Box>
                  <Button disabled={!canCreate} size="small" startIcon={<AddOutlinedIcon />} onClick={() => handleNew(3)} variant="outlined">
                    추가
                  </Button>
                </Box>
                <EnterpriseDataGrid<ConstructionTypeRecord>
                  columns={level3Columns}
                  getRowId={(row) => row.codeId}
                  hideFooterSelectedRowCount
                  loading={constructionTypesQuery.isLoading}
                  onRowClick={(params) => handleSelect(params.row)}
                  rowSelectionModel={selectedRowModel(selectedRecord?.codeLevel === 3 ? selectedRecord.codeId : null)}
                  rows={level3Rows}
                  showToolbar={false}
                  sx={gridSx}
                />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                  <Chip label={`총 ${level3Count}건`} size="small" variant="outlined" />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  공사종류 상세
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {displayRecord ? `${displayRecord.codeId} / ${displayRecord.codeName}` : "신규 공사종류를 입력합니다."}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Chip label={selectedLevelLabel} variant="outlined" />
                <Chip label={selectedStatusLabel} color={selectedStatusColor} />
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap", mb: 2, width: "100%" }}>
              <Button startIcon={<SaveOutlinedIcon />} disabled={saveMutation.isPending} onClick={handleSave} variant="contained">
                저장
              </Button>
              <Button
                color="error"
                disabled={!displayRecord}
                startIcon={<DeleteOutlineOutlinedIcon />}
                onClick={() => {
                  if (displayRecord) {
                    setDeleteTarget(displayRecord);
                  }
                }}
                variant="outlined"
              >
                삭제
              </Button>
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField fullWidth label="ID" size="small" value={activeDraft.codeId ?? ""} disabled sx={fieldSx} />
              <TextField
                fullWidth
                label="단계"
                select
                size="small"
                value={activeDraft.codeLevel}
                onChange={(event) =>
                  setDraft((current) => {
                    const nextLevel = Number(event.target.value) as ConstructionTypeLevel;
                    const next: ConstructionTypeDraft = { ...current, codeLevel: nextLevel };
                    if (nextLevel === 1) {
                      next.level2Code = "";
                      next.level3Code = "";
                    } else if (nextLevel === 2) {
                      next.level3Code = "";
                    }
                    return next;
                  })
                }
                sx={fieldSx}
              >
                <MenuItem value={1}>1단계</MenuItem>
                <MenuItem value={2}>2단계</MenuItem>
                <MenuItem value={3}>3단계</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="1단계 코드"
                size="small"
                value={activeDraft.level1Code}
                onChange={(event) => setDraft((current) => ({ ...current, level1Code: event.target.value }))}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="2단계 코드"
                size="small"
                disabled={level2Disabled}
                value={activeDraft.level2Code}
                onChange={(event) => setDraft((current) => ({ ...current, level2Code: event.target.value }))}
                sx={fieldSx}
              />

              <TextField
                fullWidth
                label="3단계 코드"
                size="small"
                disabled={level3Disabled}
                value={activeDraft.level3Code}
                onChange={(event) => setDraft((current) => ({ ...current, level3Code: event.target.value }))}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="공사종류명"
                size="small"
                value={activeDraft.codeName}
                onChange={(event) => setDraft((current) => ({ ...current, codeName: event.target.value }))}
                sx={fieldSx}
              />

              <Box sx={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Switch checked={activeDraft.useYn} onChange={(_, checked) => setDraft((current) => ({ ...current, useYn: checked }))} />
                <Typography variant="body2">사용</Typography>
              </Box>

              <TextField
                fullWidth
                label="생성자"
                size="small"
                disabled
                value={activeDraft.createdId}
                onChange={(event) => setDraft((current) => ({ ...current, createdId: event.target.value }))}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="최종 변경자"
                size="small"
                disabled
                value={activeDraft.lastChangedId}
                onChange={(event) => setDraft((current) => ({ ...current, lastChangedId: event.target.value }))}
                sx={fieldSx}
              />

              <TextField fullWidth label="생성일시" size="small" value={formatValue(activeDraft.createdAt)} disabled sx={fieldSx} />
              <TextField fullWidth label="최종 변경일시" size="small" value={formatValue(activeDraft.lastChangedAt)} disabled sx={fieldSx} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>공사종류를 삭제하시겠습니까?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            선택된 공사종류
          </Typography>
          <Typography sx={{ mt: 0.75, fontWeight: 700 }} variant="body1">
            {deleteTarget ? `${deleteTarget.codeId} / ${deleteTarget.codeName}` : ""}
          </Typography>
          <Typography sx={{ mt: 1.5 }} variant="body2">
            하위 항목이 있으면 삭제할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)} variant="outlined">
            취소
          </Button>
          <Button
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (deleteTarget) {
                deleteMutation.mutate(deleteTarget.codeId);
              }
            }}
            variant="contained"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snackbar)} autoHideDuration={2500} onClose={() => setSnackbar(null)} message={snackbar?.message} />
    </Box>
  );
}
