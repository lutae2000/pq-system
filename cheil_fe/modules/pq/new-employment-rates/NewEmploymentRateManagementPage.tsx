"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  type GridColDef,
  type GridPaginationModel,
  type GridRowParams,
} from "@mui/x-data-grid";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { AuditFields } from "@/components/common/AuditFields";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { FileActionCard } from "@/components/common/FileActionCard";
import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useCommonCodeLevel3Options, useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import {
  NewEmploymentMonthlyStatusDialog,
  type EditableMonthlyStatusRow,
} from "@/modules/pq/new-employment-rates/NewEmploymentMonthlyStatusDialog";
import {
  createNewEmploymentMonthlyStatus,
  createNewEmploymentEmployee,
  deleteNewEmploymentMonthlyStatus,
  deleteNewEmploymentEmployee,
  getNewEmploymentEmployee,
  listNewEmploymentEmployees,
  listNewEmploymentMonthlyStatuses,
  listNewEmploymentMonthlyStatusPivot,
  listNewEmploymentPreviousYearSamePeriodMonthlyStatusPivot,
  NEW_EMPLOYMENT_CERTIFICATE_ATTACHMENT_TYPE,
  NEW_EMPLOYMENT_RATE_PAGE_SIZE,
  NEW_EMPLOYMENT_RATE_PROGRAM_ATTACHMENT_OWNER_TYPE,
  type NewEmploymentEmployeePageResponse,
  type NewEmploymentEmployeeRecord,
  type NewEmploymentEmployeeRequest,
  type NewEmploymentMonthlyStatusPivotRecord,
  type NewEmploymentMonthlyStatusRequest,
  updateNewEmploymentMonthlyStatus,
  updateNewEmploymentEmployee,
} from "@/modules/pq/new-employment-rates/api";

const EMPTY_EMPLOYEES: NewEmploymentEmployeeRecord[] = [];

type AutocompleteOption = {
  label: string;
  value: string;
};

type MonthlyStatusPivotRow = {
  id: string;
  label: string;
  average: number | null;
  months: Array<number | null>;
  monthKeys: string[];
};

type MonthlyStatusPivotMetric = {
  id: string;
  label: string;
  valueByMonth: Array<number | null>;
};

type MonthlyStatusPivotGrid = {
  columns: GridColDef<MonthlyStatusPivotRow>[];
  rows: MonthlyStatusPivotRow[];
};

type MonthlyStatusCounts = {
  employeeCount: number | null;
  newHireCount: number | null;
};

const today = new Date();
const currentYearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;

const emptyDraft = (departmentCode = "", baseYearMonth = currentYearMonth): NewEmploymentEmployeeRecord => ({
  id: 0,
  baseYearMonth,
  employeeNo: "",
  employeeName: "",
  birthDate: null,
  hireDate: "",
  departmentCode,
  departmentName: null,
  jobCategory: "",
  remark: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

const emptyEmployeePage = (page: number, size: number): NewEmploymentEmployeePageResponse => ({
  content: EMPTY_EMPLOYEES,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const text = (value: string | null | undefined) => value ?? "";
const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
const yearMonthValue = (value: string | null | undefined) => text(value).replace(/\D/g, "").slice(0, 6);
const dashedDate = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : text(value);
};
const toRequestDate = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? normalized : null;
};
const formatMonth = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 6);
  return normalized.length === 6 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}` : text(value);
};
const formatDate = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : display(value);
};
const formatNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 1 });
const buildMonthlyStatusPivotGrid = (
  sourceRows: NewEmploymentMonthlyStatusPivotRecord[],
  rowIdPrefix: string,
  monthLabel: string,
): MonthlyStatusPivotGrid => {
  const monthRows = sourceRows.slice().sort((left, right) => yearMonthValue(left.yearMonth).localeCompare(yearMonthValue(right.yearMonth)));
  const monthKeys = monthRows.map((item) => text(item.yearMonth));
  const metrics: MonthlyStatusPivotMetric[] = [
    {
      id: `${rowIdPrefix}-employee-count`,
      label: "고용인원",
      valueByMonth: monthRows.map((item) => item.employeeCount),
    },
    {
      id: `${rowIdPrefix}-new-hire-count`,
      label: "신규 고용현황",
      valueByMonth: monthRows.map((item) => item.newHireCount),
    },
  ];

  const rows: MonthlyStatusPivotRow[] = metrics.map((metric) => ({
    average:
      metric.valueByMonth.length > 0
        ? metric.valueByMonth.reduce<number>((sum: number, value) => sum + Number(value ?? 0), 0) / metric.valueByMonth.length
        : null,
    id: metric.id,
    label: metric.label,
    monthKeys,
    months: metric.valueByMonth,
  }));

  const columns: GridColDef<MonthlyStatusPivotRow>[] = [
    { field: "label", headerName: "구분", minWidth: 96, flex: 0.9, renderHeader: () => <span>구분</span> },
    {
      field: "average",
      headerName: "평균",
      minWidth: 72,
      align: "right",
      headerAlign: "center",
      renderHeader: () => <span>평균</span>,
      valueGetter: (_value, pivotRow) => formatNumber(pivotRow.average),
    },
    ...monthKeys.map((yearMonth, index) => ({
      field: `month-${index}`,
      headerName: yearMonth || `${monthLabel}-${index + 1}`,
      minWidth: 72,
      align: "right" as const,
      headerAlign: "center" as const,
      renderHeader: () => <span>{yearMonth || `${monthLabel}-${index + 1}`}</span>,
      valueGetter: (_value: unknown, pivotRow: MonthlyStatusPivotRow) => formatNumber(pivotRow.months[index]),
    })),
  ];

  return {
    columns,
    rows,
  };
};

const calculateEmploymentRate = (grid: MonthlyStatusPivotGrid) => {
  const employeeCountRow = grid.rows.find((row) => row.label === "고용인원");
  const newHireCountRow = grid.rows.find((row) => row.label === "신규 고용현황");
  const averageEmployeeCount = employeeCountRow?.average ?? 0;
  const totalNewHireCount = (newHireCountRow?.months ?? []).reduce<number>(
    (sum: number, value) => sum + Number(value ?? 0),
    0,
  );

  if (averageEmployeeCount <= 0) {
    return "-";
  }

  return `${Math.trunc((totalNewHireCount / averageEmployeeCount) * 100)}%`;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const emptyMonthlyStatusRow = (
  baseYearMonth = currentYearMonth,
  counts: Partial<MonthlyStatusCounts> = {},
): EditableMonthlyStatusRow => ({
  id: Date.now(),
  baseYearMonth,
  employeeCount: counts.employeeCount ?? null,
  newHireCount: counts.newHireCount ?? null,
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
  isNew: true,
});

const toMonthlyStatusRequest = (row: EditableMonthlyStatusRow): NewEmploymentMonthlyStatusRequest => ({
  baseYearMonth: yearMonthValue(row.baseYearMonth),
  employeeCount: toNullableNumber(row.employeeCount),
  newHireCount: toNullableNumber(row.newHireCount),
});

const toRequest = (draft: NewEmploymentEmployeeRecord, fallbackBaseYearMonth: string): NewEmploymentEmployeeRequest => ({
  baseYearMonth: yearMonthValue(draft.baseYearMonth) || yearMonthValue(fallbackBaseYearMonth) || currentYearMonth,
  birthDate: toRequestDate(draft.birthDate),
  departmentCode: text(draft.departmentCode).trim(),
  employeeName: text(draft.employeeName).trim(),
  employeeNo: text(draft.employeeNo).trim() || null,
  hireDate: toRequestDate(draft.hireDate) ?? "",
  jobCategory: text(draft.jobCategory).trim() || null,
  remark: text(draft.remark).trim() || null,
});

export function NewEmploymentRateManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [appliedEmployeeName, setAppliedEmployeeName] = useState("");
  const [baseYearMonth, setBaseYearMonth] = useState(currentYearMonth);
  const [departmentCode, setDepartmentCode] = useState("");
  const [selectedYearMonth, setSelectedYearMonth] = useState(currentYearMonth);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<NewEmploymentEmployeeRecord>(() => emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<NewEmploymentEmployeeRecord | null>(null);
  const [deleteMonthlyStatusTarget, setDeleteMonthlyStatusTarget] = useState<EditableMonthlyStatusRow | null>(null);
  const [monthlyStatusDialogOpen, setMonthlyStatusDialogOpen] = useState(false);
  const [monthlyStatusDraft, setMonthlyStatusDraft] = useState<EditableMonthlyStatusRow | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const { showSnackbar } = useAppSnackbar();

  const departmentReferences = useDepartmentOptions({ useYn: true }, { enabled: canRead });
  const jobCategoryReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: canRead });
  const departmentOptions = departmentReferences.options;
  const jobCategoryOptions = jobCategoryReferences.options;

  const monthlyStatusPivotQuery = useQuery({
    queryKey: ["new-employment-monthly-status-pivot", baseYearMonth],
    queryFn: () => listNewEmploymentMonthlyStatusPivot(baseYearMonth),
    enabled: tabQueryEnabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const previousYearSamePeriodMonthlyStatusPivotQuery = useQuery({
    queryKey: ["new-employment-previous-year-same-period-monthly-status-pivot", baseYearMonth],
    queryFn: () => listNewEmploymentPreviousYearSamePeriodMonthlyStatusPivot(baseYearMonth),
    enabled: tabQueryEnabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const monthlyStatusesQuery = useQuery({
    queryKey: ["new-employment-monthly-statuses", baseYearMonth],
    queryFn: () => listNewEmploymentMonthlyStatuses(baseYearMonth),
    enabled: tabQueryEnabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const employeeParams = useMemo(
    () => ({
      page,
      selectedYearMonth,
      departmentCode,
      employeeName: appliedEmployeeName,
      size: NEW_EMPLOYMENT_RATE_PAGE_SIZE,
    }),
    [appliedEmployeeName, departmentCode, page, selectedYearMonth],
  );

  const employeesQuery = useQuery({
    queryKey: ["new-employment-employees", employeeParams],
    queryFn: () => listNewEmploymentEmployees(employeeParams),
    enabled: tabQueryEnabled,
  });

  const selectedEmployeeId = draft.id;
  const detailQuery = useQuery({
    queryKey: ["new-employment-employee", selectedEmployeeId],
    queryFn: () => getNewEmploymentEmployee(selectedEmployeeId),
    enabled: tabQueryEnabled && selectedEmployeeId > 0,
  });

  const employeePage = employeesQuery.data ?? emptyEmployeePage(page, NEW_EMPLOYMENT_RATE_PAGE_SIZE);
  const selectedRecord = detailQuery.data ?? draft;
  const selectedYearMonthLabel = formatMonth(selectedYearMonth);
  const canSave = draft.id > 0 ? canUpdate : canCreate;
  const programAttachmentOwnerId = selectedYearMonth.trim();

  const monthlyStatusPivotGrid = useMemo(
    () => buildMonthlyStatusPivotGrid(monthlyStatusPivotQuery.data ?? [], "monthly-status-pivot", "월별 고용현황"),
    [monthlyStatusPivotQuery.data],
  );

  const previousYearSamePeriodMonthlyStatusPivotGrid = useMemo(
    () =>
      buildMonthlyStatusPivotGrid(
        previousYearSamePeriodMonthlyStatusPivotQuery.data ?? [],
        "previous-year-same-period-monthly-status-pivot",
        "직전년도 동기간 고용현황",
      ),
    [previousYearSamePeriodMonthlyStatusPivotQuery.data],
  );

  const monthlyStatusSaveMutation = useMutation({
    mutationFn: async (row: EditableMonthlyStatusRow) => {
      const request = toMonthlyStatusRequest(row);
      if (!request.baseYearMonth) {
        throw new Error("기준년월을 입력해 주세요.");
      }
      return row.isNew ? createNewEmploymentMonthlyStatus(request) : updateNewEmploymentMonthlyStatus(row.id, request);
    },
    onSuccess: async (saved) => {
      setMonthlyStatusDraft({ ...saved, isNew: false });
      setMonthlyStatusDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["new-employment-monthly-statuses"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-monthly-status-pivot"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-previous-year-same-period-monthly-status-pivot"] });
      showSnackbar({ message: "월별 고용현황이 저장되었습니다.", severity: "success" });
    },
    onError: (error) =>
      showSnackbar({ message: error instanceof Error ? error.message : "월별 고용현황 저장에 실패했습니다.", severity: "error" }),
  });

  const monthlyStatusDeleteMutation = useMutation({
    mutationFn: async (row: EditableMonthlyStatusRow) => {
      if (!row.isNew) {
        await deleteNewEmploymentMonthlyStatus(row.id);
      }
    },
    onSuccess: async () => {
      setDeleteMonthlyStatusTarget(null);
      setMonthlyStatusDraft(null);
      setMonthlyStatusDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["new-employment-monthly-statuses"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-monthly-status-pivot"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-previous-year-same-period-monthly-status-pivot"] });
      showSnackbar({ message: "월별 고용현황이 삭제되었습니다.", severity: "success" });
    },
    onError: (error) =>
      showSnackbar({ message: error instanceof Error ? error.message : "월별 고용현황 삭제에 실패했습니다.", severity: "error" }),
  });


  const employeeColumns = useMemo<GridColDef<NewEmploymentEmployeeRecord>[]>(
    () => [
      { field: "employeeName", headerName: "이름", minWidth: 120, flex: 0.8 },
      { field: "employeeNo", headerName: "사번", minWidth: 110, flex: 0.7, valueGetter: (_value, row) => display(row.employeeNo) },
      { field: "birthDate", headerName: "생년월일", width: 120, align: "center", headerAlign: "center", valueGetter: (_value, row) => formatDate(row.birthDate) },
      { field: "hireDate", headerName: "입사일", width: 120, align: "center", headerAlign: "center", valueGetter: (_value, row) => formatDate(row.hireDate) },
      { field: "departmentName", headerName: "부서", minWidth: 150, flex: 1, valueGetter: (_value, row) => display(row.departmentName) },
      {
        field: "jobCategory",
        headerName: "직무분야",
        minWidth: 140,
        flex: 0.9,
        valueGetter: (_value, row) => display(jobCategoryReferences.labelByValue[text(row.jobCategory)] ?? row.jobCategory),
      },
      { field: "remark", headerName: "비고", minWidth: 180, flex: 1, valueGetter: (_value, row) => display(row.remark) },
    ],
    [jobCategoryReferences.labelByValue],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const request = toRequest(draft, selectedYearMonth);
      if (!request.employeeName) {
        throw new Error("이름을 입력해 주세요.");
      }
      if (!request.hireDate) {
        throw new Error("입사일을 입력해 주세요.");
      }
      if (!request.departmentCode) {
        throw new Error("부서를 선택해 주세요.");
      }
      if (!request.baseYearMonth) {
        throw new Error("기준년월을 입력해 주세요.");
      }
      return draft.id > 0 ? updateNewEmploymentEmployee(draft.id, request) : createNewEmploymentEmployee(request);
    },
    onSuccess: async (saved) => {
      setDraft(saved);
      setSelectedYearMonth(saved.baseYearMonth);
      setSaveConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["new-employment-employees"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-employee"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-monthly-status-pivot"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-previous-year-same-period-monthly-status-pivot"] });
      showSnackbar({ message: "저장되었습니다.", severity: "success" });
    },
    onError: (error) => showSnackbar({ message: error instanceof Error ? error.message : "저장에 실패했습니다.", severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: NewEmploymentEmployeeRecord) => deleteNewEmploymentEmployee(target.id),
    onSuccess: async () => {
      setDraft(emptyDraft(departmentCode === "All" ? "" : departmentCode, selectedYearMonth));
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["new-employment-employees"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-employee"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-monthly-status-pivot"] });
      await queryClient.invalidateQueries({ queryKey: ["new-employment-previous-year-same-period-monthly-status-pivot"] });
      showSnackbar({ message: "삭제되었습니다.", severity: "success" });
    },
    onError: (error) => showSnackbar({ message: error instanceof Error ? error.message : "삭제에 실패했습니다.", severity: "error" }),
  });

  const handleSearch = (nextKeyword: string) => {
    const normalizedMonth = yearMonthValue(baseYearMonth);
    setBaseYearMonth(normalizedMonth);
    setSelectedYearMonth(normalizedMonth);
    setAppliedEmployeeName(nextKeyword.trim());
    setPage(0);
    setDraft(emptyDraft(departmentCode === "All" ? "" : departmentCode, normalizedMonth));
  };

  const handleReset = () => {
    setKeyword("");
    setAppliedEmployeeName("");
    setBaseYearMonth(currentYearMonth);
    setDepartmentCode("");
    setSelectedYearMonth(currentYearMonth);
    setPage(0);
    setDraft(emptyDraft("", currentYearMonth));
  };

  const handleNew = () => {
    setDraft(emptyDraft(departmentCode === "All" ? "" : departmentCode, selectedYearMonth));
  };

  const handleAddMonthlyStatus = () => {
    if (!canCreate) {
      showSnackbar({ message: "등록 권한이 없습니다.", severity: "error" });
      return;
    }
    setMonthlyStatusDraft(emptyMonthlyStatusRow(baseYearMonth));
    setMonthlyStatusDialogOpen(true);
  };

  const openMonthlyStatusDialog = (baseYearMonthValue: string, fallbackCounts?: MonthlyStatusCounts) => {
    const normalizedBaseYearMonth = yearMonthValue(baseYearMonthValue);
    const existing = (monthlyStatusesQuery.data ?? []).find(
      (item) => yearMonthValue(item.baseYearMonth) === normalizedBaseYearMonth,
    );

    setMonthlyStatusDraft(
      existing
        ? { ...existing, isNew: false }
        : emptyMonthlyStatusRow(normalizedBaseYearMonth || baseYearMonth, fallbackCounts),
    );
    setMonthlyStatusDialogOpen(true);
  };

  const handleSaveClick = () => {
    if (draft.id > 0 && !canUpdate) {
      showSnackbar({ message: "수정 권한이 없습니다.", severity: "error" });
      return;
    }
    if (draft.id === 0 && !canCreate) {
      showSnackbar({ message: "등록 권한이 없습니다.", severity: "error" });
      return;
    }
    setSaveConfirmOpen(true);
  };

  const updateDraft = <K extends keyof NewEmploymentEmployeeRecord>(field: K, value: NewEmploymentEmployeeRecord[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  if (!canRead) {
    return <Alert severity="warning">신규 고용자 정보를 조회할 권한이 없습니다.</Alert>;
  }

  return (
    <Box>
      <PageHeader title="신규 고용률 관리" />

      <SearchPanel
        keyword={keyword}
        keywordLabel="이름"
        keywordPlaceholder="이름, 부서, 사번"
        onKeywordChange={setKeyword}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <ReferenceAutocompleteField
          includeAll
          label="부서"
          loading={departmentReferences.isLoading}
          onChange={setDepartmentCode}
          options={departmentOptions}
          sx={{ flex: "0 1 260px", minWidth: 240 }}
          value={departmentCode}
        />
        <TextField
          label="기준년월"
          onChange={(event) => setBaseYearMonth(yearMonthValue(event.target.value))}
          size="small"
          sx={standardFieldSx}
          type="text"
          value={yearMonthValue(baseYearMonth)}
          placeholder="YYYYMM"
        />
      </SearchPanel>

      <Stack spacing={2}>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  월별 고용현황
                </Typography>
                <Tooltip title="현황 = (신규 고용인원 합계 ÷ 월평균 고용인원) × 100 (소수점 버림)">
                  <Typography color="text.secondary" sx={{ cursor: "help", fontWeight: 700 }} variant="body2">
                    현황: {calculateEmploymentRate(monthlyStatusPivotGrid)}
                  </Typography>
                </Tooltip>
                <Chip label={`${formatMonth(baseYearMonth)} 기준 최근 12개월`} size="small" variant="outlined" />
              </Box>
              <Button disabled={!canCreate} onClick={handleAddMonthlyStatus} startIcon={<AddOutlinedIcon />} variant="outlined">
                신규
              </Button>
            </Box>
            <EnterpriseDataGrid<MonthlyStatusPivotRow>
                columns={monthlyStatusPivotGrid.columns}
                getRowId={(row) => row.id}
                hideFooter
                hideFooterSelectedRowCount
                loading={monthlyStatusPivotQuery.isLoading}
                onCellDoubleClick={(params) => {
                  if (params.field === "label" || params.field === "average") {
                    return;
                  }
                  const index = Number(params.field.replace("month-", ""));
                  const yearMonth = params.row.monthKeys[index];
                  if (!yearMonth) {
                    return;
                  }
                  openMonthlyStatusDialog(yearMonth);
                }}
                readOnly
                rows={monthlyStatusPivotGrid.rows}
                showToolbar={false}
                sx={{ height: 140, minHeight: 140 }}
                wrapperMinHeight={140}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  직전년도 동기간 고용현황
                </Typography>
                <Tooltip title="현황 = 신규 고용인원 합계 ÷ 고용인원 월평균 × 100 (소수점 버림)">
                  <Typography color="text.secondary" sx={{ cursor: "help", fontWeight: 700 }} variant="body2">
                    현황: {calculateEmploymentRate(previousYearSamePeriodMonthlyStatusPivotGrid)}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
            <EnterpriseDataGrid<MonthlyStatusPivotRow>
              columns={previousYearSamePeriodMonthlyStatusPivotGrid.columns}
              getRowId={(row) => row.id}
              hideFooter
              hideFooterSelectedRowCount
              loading={previousYearSamePeriodMonthlyStatusPivotQuery.isLoading}
              onCellDoubleClick={(params) => {
                if (params.field === "label" || params.field === "average") {
                  return;
                }
                const index = Number(params.field.replace("month-", ""));
                const yearMonth = params.row.monthKeys[index];
                if (!yearMonth) {
                  return;
                }
                const employeeCountRow = previousYearSamePeriodMonthlyStatusPivotGrid.rows.find(
                  (row) => row.label === "고용인원",
                );
                const newHireCountRow = previousYearSamePeriodMonthlyStatusPivotGrid.rows.find(
                  (row) => row.label === "신규 고용현황",
                );
                openMonthlyStatusDialog(yearMonth, {
                  employeeCount: employeeCountRow?.months[index] ?? null,
                  newHireCount: newHireCountRow?.months[index] ?? null,
                });
              }}
              readOnly
              rows={previousYearSamePeriodMonthlyStatusPivotGrid.rows}
              showToolbar={false}
              sx={{ height: 140, minHeight: 140 }}
              wrapperMinHeight={140}
            />
          </CardContent>
        </Card>

        <Box sx={{ alignItems: "start", display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.15fr) minmax(440px, 0.85fr)" } }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", mb: 1.5 }}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  신규 고용자 목록
                </Typography>
                <Chip label={`${selectedYearMonthLabel} / ${employeePage.totalElements.toLocaleString("ko-KR")}건`} size="small" variant="outlined" />
              </Box>
              <EnterpriseDataGrid<NewEmploymentEmployeeRecord>
                columns={employeeColumns}
                getRowId={(row) => row.id}
                loading={employeesQuery.isLoading || employeesQuery.isFetching}
                onPaginationModelChange={(model: GridPaginationModel) => setPage(model.page)}
                onRowClick={(params: GridRowParams<NewEmploymentEmployeeRecord>) => {
                  setDraft(params.row);
                  setSelectedYearMonth(params.row.baseYearMonth);
                }}
                pageSizeOptions={[NEW_EMPLOYMENT_RATE_PAGE_SIZE]}
                paginationMode="server"
                paginationModel={{ page, pageSize: NEW_EMPLOYMENT_RATE_PAGE_SIZE }}
                rowCount={employeePage.totalElements}
                rows={employeePage.content ?? EMPTY_EMPLOYEES}
                showPageInfo
                showPageNumbers
                showXlsxExportButton
                sx={{ height: 640, "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                wrapperMinHeight={640}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", mb: 1.5 }}>
                <Box sx={{ alignItems: "center", display: "flex", gap: 0.5, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    신규 고용자 상세
                  </Typography>
                  {!jobCategoryReferences.isLoading && jobCategoryOptions.length === 0 ? (
                    <Tooltip title="PQ / QA 공통코드가 없습니다.">
                      <IconButton aria-label="직무분야 도움말" size="small">
                        <HelpOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
                    신규
                  </Button>
                  <Button disabled={!canSave || saveMutation.isPending} onClick={handleSaveClick} startIcon={<SaveOutlinedIcon />} variant="contained">
                    저장
                  </Button>
                  <Button
                    color="error"
                    disabled={!canDelete || draft.id === 0 || deleteMutation.isPending}
                    onClick={() => setDeleteTarget(draft)}
                    startIcon={<DeleteOutlineOutlinedIcon />}
                    variant="outlined"
                  >
                    삭제
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                <TextField label="사번" onChange={(event) => updateDraft("employeeNo", event.target.value)} size="small" sx={standardFieldSx} value={text(draft.employeeNo)} />
                <TextField label="이름" onChange={(event) => updateDraft("employeeName", event.target.value)} required size="small" sx={standardFieldSx} value={text(draft.employeeName)} />
                <TextField label="생년월일" onChange={(event) => updateDraft("birthDate", event.target.value)} size="small" sx={standardFieldSx} type="date" value={dashedDate(draft.birthDate)} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="입사일" onChange={(event) => updateDraft("hireDate", event.target.value)} required size="small" sx={standardFieldSx} type="date" value={dashedDate(draft.hireDate)} slotProps={{ inputLabel: { shrink: true } }} />
                <ReferenceAutocompleteField
                  label="부서"
                  loading={departmentReferences.isLoading}
                  onChange={(value) => updateDraft("departmentCode", value)}
                  options={departmentOptions}
                  value={text(draft.departmentCode)}
                />
                <ReferenceAutocompleteField
                  label="직무분야"
                  loading={jobCategoryReferences.isLoading}
                  noOptionsText="PQ / QA 직무분야가 없습니다."
                  onChange={(value) => updateDraft("jobCategory", value)}
                  options={jobCategoryOptions}
                  value={text(draft.jobCategory)}
                />
                <TextField label="비고" minRows={4} multiline onChange={(event) => updateDraft("remark", event.target.value)} sx={{ gridColumn: "1 / -1" }} value={text(draft.remark)} />
              </Box>

              <AuditFields
                createdAt={selectedRecord.createdAt}
                createdBy={selectedRecord.createdId}
                updatedAt={selectedRecord.lastChangedAt}
                updatedBy={selectedRecord.lastChangedId}
              />

              <Box sx={{ mt: 2 }}>
                <FileActionCard
                  attachmentTarget={
                    programAttachmentOwnerId
                      ? {
                          attachmentType: NEW_EMPLOYMENT_CERTIFICATE_ATTACHMENT_TYPE,
                          ownerId: programAttachmentOwnerId,
                          ownerType: NEW_EMPLOYMENT_RATE_PROGRAM_ATTACHMENT_OWNER_TYPE,
                        }
                      : undefined
                  }
                  deleteDisabled={!canDelete}
                  description={programAttachmentOwnerId ? "선택된 기준년월의 첨부파일을 관리합니다." : "기준년월을 선택하면 첨부파일을 등록할 수 있습니다."}
                  multiple
                  title="증빙정보 / 파일 목록"
                  uploadDisabled={!programAttachmentOwnerId || (!canCreate && !canUpdate)}
                  uploadLabel="업로드"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      <ConfirmActionDialog
        confirmLabel="저장"
        loading={saveMutation.isPending}
        message="신규 고용자 정보를 저장합니다."
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={() => saveMutation.mutate()}
        open={saveConfirmOpen}
        targetLabel={draft.employeeName}
        title="저장 확인"
      />
      <NewEmploymentMonthlyStatusDialog
        canCreate={canCreate}
        canDelete={canDelete}
        canUpdate={canUpdate}
        key={`${monthlyStatusDialogOpen ? "open" : "closed"}-${monthlyStatusDraft?.id ?? "none"}`}
        loading={monthlyStatusSaveMutation.isPending || monthlyStatusDeleteMutation.isPending}
        onClose={() => setMonthlyStatusDialogOpen(false)}
        onDeleteRequest={(record) => setDeleteMonthlyStatusTarget(record)}
        onSave={async (record) => {
          await monthlyStatusSaveMutation.mutateAsync(record);
        }}
        open={monthlyStatusDialogOpen}
        record={monthlyStatusDraft}
      />
      <ConfirmDeleteDialog
        loading={monthlyStatusDeleteMutation.isPending}
        message="선택한 월별 고용현황을 삭제합니다."
        onClose={() => setDeleteMonthlyStatusTarget(null)}
        onConfirm={() => deleteMonthlyStatusTarget && monthlyStatusDeleteMutation.mutate(deleteMonthlyStatusTarget)}
        open={Boolean(deleteMonthlyStatusTarget)}
        targetLabel={deleteMonthlyStatusTarget ? formatMonth(deleteMonthlyStatusTarget.baseYearMonth) : undefined}
        title="삭제 확인"
      />
      <ConfirmDeleteDialog
        loading={deleteMutation.isPending}
        message="선택한 신규 고용자 정보를 삭제합니다."
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        open={Boolean(deleteTarget)}
        targetLabel={deleteTarget?.employeeName}
        title="삭제 확인"
      />
    </Box>
  );
}

function ReferenceAutocompleteField({
  includeAll = false,
  label,
  loading = false,
  noOptionsText = "조회 결과가 없습니다.",
  onChange,
  options,
  sx,
  value,
}: {
  includeAll?: boolean;
  label: string;
  loading?: boolean;
  noOptionsText?: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  sx?: SxProps<Theme>;
  value: string;
}) {
  const resolvedOptions = useMemo(
    () => (includeAll ? [{ label: "전체", value: "All" }, ...options] : options),
    [includeAll, options],
  );
  const selectedOption = resolvedOptions.find((option) => option.value === value) ?? null;

  return (
    <Autocomplete<AutocompleteOption>
      autoHighlight
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.value === selected.value}
      loading={loading}
      noOptionsText={noOptionsText}
      onChange={(_, option) => onChange(option?.value ?? "")}
      options={resolvedOptions}
      sx={sx}
      value={selectedOption}
      renderInput={(params) => <TextField {...params} label={label} size="small" sx={standardFieldSx} />}
    />
  );
}
