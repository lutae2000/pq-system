"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CommonSelectField } from "@/components/common/CommonSelectField";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  createDepartment,
  getDepartment,
  listDepartments,
  type DepartmentRecord,
  type DepartmentSearchParams,
  type DepartmentUpsertRequest,
  updateDepartment,
} from "./api";

type DepartmentFilters = {
  keyword: string;
  useYn: string;
};

const initialFilters: DepartmentFilters = {
  keyword: "",
  useYn: "true",
};

type DepartmentFormState = {
  chgDate: string;
  chgDutyId: string;
  costDept: string;
  deptCode: string;
  deptDiv: string;
  deptName: string;
  headquarterCode: string;
  inputDate: string;
  inputDutyId: string;
  mhYn: boolean;
  projDiv: string;
  sortSeq: string;
  terminateDate: string;
  useYn: boolean;
};

type DepartmentTreeNode = {
  children: DepartmentTreeNode[];
  record: DepartmentRecord;
};

type DepartmentTreeRow = {
  depth: number;
  node: DepartmentTreeNode;
};

type DepartmentGridRow = DepartmentRecord & {
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

const defaultForm = (headquarterCode = "100"): DepartmentFormState => ({
  chgDate: "",
  chgDutyId: "admin",
  costDept: "",
  deptCode: "",
  deptDiv: "1",
  deptName: "",
  headquarterCode,
  inputDate: "",
  inputDutyId: "admin",
  mhYn: false,
  projDiv: "20",
  sortSeq: "0001",
  terminateDate: "2999-12-31",
  useYn: true,
});

const toFormState = (record: DepartmentRecord): DepartmentFormState => ({
  chgDate: record.chgDate ?? "",
  chgDutyId: record.chgDutyId ?? "",
  costDept: record.costDept ?? "",
  deptCode: record.deptCode,
  deptDiv: record.deptDiv,
  deptName: record.deptName,
  headquarterCode: record.headquarterCode,
  inputDate: record.inputDate ?? "",
  inputDutyId: record.inputDutyId ?? "",
  mhYn: record.mhYn,
  projDiv: record.projDiv,
  sortSeq: record.sortSeq,
  terminateDate: record.terminateDate ?? "",
  useYn: record.useYn,
});

const buildRequest = (form: DepartmentFormState): DepartmentUpsertRequest => ({
  costDept: form.costDept.trim() || null,
  deptCode: form.deptCode.trim(),
  deptDiv: form.deptDiv.trim(),
  deptName: form.deptName.trim(),
  headquarterCode: form.headquarterCode.trim(),
  inputDutyId: form.inputDutyId.trim() || null,
  mhYn: form.mhYn,
  projDiv: form.projDiv.trim(),
  sortSeq: form.sortSeq.trim(),
  terminateDate: form.terminateDate.trim() || null,
  useYn: form.useYn,
  chgDutyId: form.chgDutyId.trim() || null,
});

const toBooleanFilter = (value: string) => {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
};

const compareDepartments = (left: DepartmentRecord, right: DepartmentRecord) => {
  const leftSort = Number(left.sortSeq);
  const rightSort = Number(right.sortSeq);
  if (Number.isFinite(leftSort) && Number.isFinite(rightSort) && leftSort !== rightSort) {
    return leftSort - rightSort;
  }
  return left.sortSeq.localeCompare(right.sortSeq) || left.deptCode.localeCompare(right.deptCode);
};

const buildDepartmentTree = (records: DepartmentRecord[]): DepartmentTreeNode[] => {
  const nodes = new Map<string, DepartmentTreeNode>(
    records.map((record) => [record.deptCode, { record, children: [] }]),
  );
  const roots: DepartmentTreeNode[] = [];

  records.forEach((record) => {
    const node = nodes.get(record.deptCode);
    if (!node) {
      return;
    }

    const parentCode = record.headquarterCode?.trim();
    if (!parentCode || parentCode === record.deptCode) {
      roots.push(node);
      return;
    }

    const parentNode = nodes.get(parentCode);
    if (!parentNode) {
      roots.push(node);
      return;
    }

    parentNode.children.push(node);
  });

  const sortTree = (treeNode: DepartmentTreeNode): DepartmentTreeNode => ({
    ...treeNode,
    children: [...treeNode.children].sort((left, right) => compareDepartments(left.record, right.record)).map(sortTree),
  });

  return roots.sort((left, right) => compareDepartments(left.record, right.record)).map(sortTree);
};

const flattenDepartmentTree = (
  nodes: DepartmentTreeNode[],
  expandedDeptCodes: Set<string>,
  depth = 0,
): DepartmentTreeRow[] =>
  nodes.flatMap((node) => {
    const currentRow: DepartmentTreeRow = { depth, node };
    if (!node.children.length || !expandedDeptCodes.has(node.record.deptCode)) {
      return [currentRow];
    }

    return [currentRow, ...flattenDepartmentTree(node.children, expandedDeptCodes, depth + 1)];
  });

const collectAncestorCodes = (deptCode: string | null, parentByCode: Map<string, string | null>) => {
  const ancestors: string[] = [];
  const visited = new Set<string>();
  let current = deptCode;

  while (current) {
    const parentCode = parentByCode.get(current);
    if (!parentCode || parentCode === current || visited.has(parentCode)) {
      break;
    }

    ancestors.push(parentCode);
    visited.add(parentCode);
    current = parentCode;
  }

  return ancestors;
};

const useYnOptions = [
  { label: "사용", value: "true" },
  { label: "미사용", value: "false" },
];

export function DepartmentManagementPage() {
  const { canCreate, canRead } = useCurrentMenuPermission();
  const [records, setRecords] = useState<DepartmentRecord[]>([]);
  const [filters, setFilters] = useState<DepartmentFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<DepartmentFilters>(initialFilters);
  const [selectedDeptCode, setSelectedDeptCode] = useState<string | null>(null);
  const [manualExpandedDeptCodes, setManualExpandedDeptCodes] = useState<string[]>([]);
  const [draft, setDraft] = useState<DepartmentFormState>(() => defaultForm());
  const [isNewDepartment, setIsNewDepartment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ message: string; severity: "success" | "info" | "error" } | null>(null);

  const selectedDepartment = useMemo(
    () => records.find((item) => item.deptCode === selectedDeptCode) ?? null,
    [records, selectedDeptCode],
  );

  const departmentTree = useMemo(() => buildDepartmentTree(records), [records]);
  const rootDeptCodes = useMemo(() => departmentTree.map((node) => node.record.deptCode), [departmentTree]);

  const parentByCode = useMemo(
    () =>
      new Map(
        records.map((record) => [
          record.deptCode,
          record.headquarterCode && record.headquarterCode !== record.deptCode ? record.headquarterCode : null,
        ]),
      ),
    [records],
  );

  const autoExpandedDeptCodes = useMemo(
    () => [...rootDeptCodes, ...collectAncestorCodes(selectedDeptCode, parentByCode)],
    [parentByCode, rootDeptCodes, selectedDeptCode],
  );

  const expandedDeptCodeSet = useMemo(
    () => new Set([...autoExpandedDeptCodes, ...manualExpandedDeptCodes]),
    [autoExpandedDeptCodes, manualExpandedDeptCodes],
  );

  const handleToggleExpand = useCallback((deptCode: string) => {
    setManualExpandedDeptCodes((current) =>
      current.includes(deptCode) ? current.filter((code) => code !== deptCode) : [...current, deptCode],
    );
  }, []);

  const visibleTreeRows = useMemo(
    () => flattenDepartmentTree(departmentTree, expandedDeptCodeSet),
    [departmentTree, expandedDeptCodeSet],
  );

  const departmentGridRows = useMemo<DepartmentGridRow[]>(
    () =>
      visibleTreeRows.map(({ depth, node }) => ({
        ...node.record,
        depth,
        hasChildren: node.children.length > 0,
        isExpanded: expandedDeptCodeSet.has(node.record.deptCode),
      })),
    [expandedDeptCodeSet, visibleTreeRows],
  );

  const departmentColumns = useMemo<GridColDef<DepartmentGridRow>[]>(
    () => [
      {
        field: "deptCode",
        headerName: "부서코드",
        width: 140,
      },
      {
        field: "deptName",
        headerName: "부서명",
        flex: 1,
        minWidth: 220,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, pl: `${params.row.depth * 20}px`, width: "100%" }}>
            {params.row.hasChildren ? (
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleExpand(params.row.deptCode);
                }}
                sx={{ mr: 0.5 }}
              >
                {params.row.isExpanded ? (
                  <ExpandMoreOutlinedIcon fontSize="inherit" />
                ) : (
                  <ChevronRightOutlinedIcon fontSize="inherit" />
                )}
              </IconButton>
            ) : (
              <Box sx={{ width: 30, flexShrink: 0 }} />
            )}
            <Typography noWrap sx={{ color: "#0f172a", fontSize: 13, fontWeight: params.row.deptCode === selectedDeptCode ? 700 : 500 }}>
              {params.row.deptName}
            </Typography>
          </Box>
        ),
      },
      {
        field: "useYn",
        headerName: "사용 여부",
        width: 110,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Chip
            color={params.value ? "success" : "default"}
            label={params.value ? "Y" : "N"}
            size="small"
            variant={params.value ? "filled" : "outlined"}
          />
        ),
      },
    ],
    [handleToggleExpand, selectedDeptCode],
  );

  const departmentSelectionModel = useMemo(
    () => ({ type: "include" as const, ids: new Set(selectedDeptCode ? [selectedDeptCode] : []) }),
    [selectedDeptCode],
  );

  const loadDepartments = useCallback(async (criteria: DepartmentFilters, preferredDeptCode?: string | null) => {
      setLoading(true);
      try {
        const params: DepartmentSearchParams = {
          keyword: criteria.keyword.trim() || undefined,
          useYn: toBooleanFilter(criteria.useYn),
        };

        const data = await listDepartments(params);
        const sorted = [...data].sort(compareDepartments);

        setRecords(sorted);

        const nextSelected = preferredDeptCode ? sorted.find((item) => item.deptCode === preferredDeptCode) : sorted[0];
        if (nextSelected) {
          setSelectedDeptCode(nextSelected.deptCode);
          setDraft(toFormState(nextSelected));
          setIsNewDepartment(false);
        } else {
          setSelectedDeptCode(null);
          setDraft(defaultForm());
          setIsNewDepartment(true);
        }
      } catch (error) {
        setNotice({
          message: error instanceof Error ? error.message : "부서 데이터를 불러오지 못했습니다.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDepartments(initialFilters);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDepartments]);

  const handleSelect = async (deptCode: string) => {
    try {
      const record = await getDepartment(deptCode);
      setSelectedDeptCode(record.deptCode);
      setDraft(toFormState(record));
      setIsNewDepartment(false);
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "부서 상세 정보를 불러오지 못했습니다.",
        severity: "error",
      });
    }
  };

  const handleNewDepartment = () => {
    const baseHeadquarter = records[0]?.headquarterCode ?? "100";

    setSelectedDeptCode(null);
    setDraft(defaultForm(baseHeadquarter));
    setIsNewDepartment(true);
  };

  const handleSearch = (keyword: string) => {
    const nextFilters = { ...filters, keyword };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    void loadDepartments(nextFilters, selectedDeptCode);
  };

  const handleSave = async () => {
    if (!draft.deptCode.trim() || !draft.deptName.trim()) {
      setNotice({ message: "부서코드와 부서명은 필수입니다.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const request = buildRequest(draft);
      const saved = isNewDepartment
        ? await createDepartment(request)
        : await updateDepartment(draft.deptCode, request);

      await loadDepartments(appliedFilters, saved.deptCode);
      setNotice({ message: "부서 정보가 저장되었습니다.", severity: "success" });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "부서 정보를 저장하지 못했습니다.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4">
          부서 관리
        </Typography>
      </Box>

      <SearchPanel
        keyword={filters.keyword}
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onSearch={handleSearch}
        onReset={() => {
          setFilters(initialFilters);
          setAppliedFilters(initialFilters);
          void loadDepartments(initialFilters, null);
        }}
        searchDisabled={!canRead}
      >
        <CommonSelectField
          label="사용 여부"
          onChange={(value) => setFilters((current) => ({ ...current, useYn: value || "All" }))}
          options={useYnOptions}
          placeholder="전체"
          placeholderDisabled={false}
          sx={{ ...standardFieldSx, minWidth: 120 }}
          value={filters.useYn}
        />
      </SearchPanel>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 5fr) minmax(0, 7fr)" },
          alignItems: "start",
        }}
      >
        <Card sx={{ borderRadius: 2, minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  부서 목록
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  총 {records.length}건
                </Typography>
              </Box>
              <Button disabled={!canCreate} onClick={handleNewDepartment} startIcon={<AddOutlinedIcon />} size="small" variant="outlined">
                신규 부서 추가
              </Button>
            </Box>

            <EnterpriseDataGrid<DepartmentGridRow>
              columns={departmentColumns}
              getRowId={(row) => row.deptCode}
              hideFooterSelectedRowCount
              loading={loading}
              localeText={{ noRowsLabel: "조회된 부서가 없습니다." }}
              onRowClick={(params) => void handleSelect(params.row.deptCode)}
              rowSelectionModel={departmentSelectionModel}
              rows={departmentGridRows}
              showPageNumbers
              showToolbar={false}
              wrapperMinHeight={{ xs: 520, lg: "clamp(560px, calc(100vh - 300px), 720px)" }}
              sx={{
                "& .MuiDataGrid-row:hover": { cursor: "pointer" },
              }}
            />
          </CardContent>
        </Card>

        <Stack spacing={2}>
          <Card sx={{ borderRadius: 2, minWidth: 0 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    부서 상세
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {selectedDepartment
                      ? `${selectedDepartment.deptCode} ${selectedDepartment.deptName}`
                      : isNewDepartment
                        ? "신규 부서를 입력하는 중입니다."
                        : "부서를 선택해 주세요."}
                  </Typography>
                </Box>
                <Button onClick={handleSave} startIcon={<SaveOutlinedIcon />} variant="contained" disabled={saving}>
                  저장
                </Button>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                <TextField
                  fullWidth
                  label="부서코드"
                  onChange={(event) => setDraft((current) => ({ ...current, deptCode: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.deptCode}
                  disabled={!isNewDepartment}
                />
                <TextField
                  fullWidth
                  label="부서명"
                  onChange={(event) => setDraft((current) => ({ ...current, deptName: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.deptName}
                />
                <TextField
                  fullWidth
                  label="부서구분"
                  onChange={(event) => setDraft((current) => ({ ...current, deptDiv: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.deptDiv}
                />
                <TextField
                  fullWidth
                  label="프로젝트 구분"
                  onChange={(event) => setDraft((current) => ({ ...current, projDiv: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.projDiv}
                />
                <TextField
                  fullWidth
                  label="상위 부서"
                  onChange={(event) => setDraft((current) => ({ ...current, headquarterCode: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.headquarterCode}
                />
                <TextField
                  fullWidth
                  label="정렬 순서"
                  onChange={(event) => setDraft((current) => ({ ...current, sortSeq: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.sortSeq}
                />
                <TextField
                  fullWidth
                  label="마감 부서"
                  onChange={(event) => setDraft((current) => ({ ...current, costDept: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.costDept}
                />
                <TextField
                  fullWidth
                  label="입력 담당"
                  onChange={(event) => setDraft((current) => ({ ...current, inputDutyId: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.inputDutyId}
                />
                <TextField
                  fullWidth
                  label="수정 담당"
                  onChange={(event) => setDraft((current) => ({ ...current, chgDutyId: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.chgDutyId}
                />
                <TextField
                  fullWidth
                  label="종료일"
                  onChange={(event) => setDraft((current) => ({ ...current, terminateDate: event.target.value }))}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={standardFieldSx}
                  type="date"
                  value={draft.terminateDate}
                />
                <Box sx={{ display: "flex", alignItems: "center", minHeight: 40, gap: 1, flexWrap: "wrap" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={draft.useYn}
                        onChange={(_, checked) => setDraft((current) => ({ ...current, useYn: checked }))}
                      />
                    }
                    label={draft.useYn ? "사용" : "미사용"}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={draft.mhYn}
                        onChange={(_, checked) => setDraft((current) => ({ ...current, mhYn: checked }))}
                      />
                    }
                    label={draft.mhYn ? "MH 사용" : "MH 미사용"}
                  />
                </Box>
                <TextField fullWidth label="입력일시" size="small" sx={standardFieldSx} value={draft.inputDate} disabled />
                <TextField fullWidth label="수정일시" size="small" sx={standardFieldSx} value={draft.chgDate} disabled />
              </Box>
            </CardContent>
          </Card>

        </Stack>
      </Box>

      {notice ? (
        <Snackbar autoHideDuration={2500} open onClose={() => setNotice(null)}>
          <Alert severity={notice.severity} variant="filled">
            {notice.message}
          </Alert>
        </Snackbar>
      ) : null}
    </Box>
  );
}



