"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  GridActionsCellItem,
  GridRowModes,
  type GridCellClassNameParams,
  type GridColDef,
  type GridRenderEditCellParams,
  type GridRowId,
  type GridRowModesModel,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type SyntheticEvent } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { formatReferenceLabel, toSelectOptions } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";

import {
  listEducationReminderCompletions,
  listEducationReminderNotificationTargets,
  saveEducationReminderCompletion,
  saveEducationReminderNotificationPhone,
} from "./api";
import {
  formatDateText,
  type EducationReminderCompletionRecord,
  type EducationReminderCompletionSearchParams,
  type EducationReminderCompletionUpsertRequest,
  type EducationReminderNotificationTargetRecord,
} from "../types";

type RetireYnFilter = "" | "Y" | "N";

type FilterState = {
  educationRegistered: "" | boolean;
  jobField: string;
  name: string;
  recentEducationStartDate1: string;
  recentEducationStartDate2: string;
  retireYn: RetireYnFilter;
  specialtyField: string;
};

type CodeOption = {
  label: string;
  value: string;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const INITIAL_PAGE_SIZE = 50;

const editableDateFields = new Set<keyof EducationReminderCompletionRecord>([
  "recentEducationStartDate1",
  "recentEducationStartDate2",
]);

const nonMergedCompletionHighlightFields = new Set<keyof EducationReminderCompletionRecord | "__actions__">([
  "__actions__",
  "educationName",
  "recentEducationStartDate1",
  "recentEducationStartDate2",
  "scheduledEducation1",
  "scheduledEducation2",
  "educationRegistered",
  "remark",
  "lastChangedId",
  "lastChangedAt",
]);

const notificationHighlightFields = new Set<keyof EducationReminderNotificationTargetRecord | "__actions__">([
  "__actions__",
  "engineerId",
  "name",
  "department",
  "grade",
  "jobField",
  "specialtyField",
  "professionalCertNames",
  "targetEducationNames",
  "phoneNo",
]);

const upcomingSummaryCardSx: SxProps<Theme> = {
  backgroundColor: "rgba(250, 204, 21, 0.18)",
  border: (theme) => `1px solid ${theme.palette.warning.main}`,
};

const overdueSummaryCardSx: SxProps<Theme> = {
  backgroundColor: "rgba(239, 68, 68, 0.14)",
  border: (theme) => `1px solid ${theme.palette.error.main}`,
};

const emptyFilterState = (): FilterState => ({
  educationRegistered: "",
  jobField: "",
  name: "",
  recentEducationStartDate1: "",
  recentEducationStartDate2: "",
  retireYn: "",
  specialtyField: "",
});

const normalizeDateFilterInput = (value: string) => value.replace(/\D/g, "").slice(0, 8);
const normalizeEducationRegistered = (value: boolean | string | null | undefined) => value === true || value === "Y" || value === "true";
const normalizePhoneNo = (value: string | null | undefined) => String(value ?? "").trim();

function completionRowClassName(row: { highlightTone: "NONE" | "UPCOMING" | "OVERDUE" }) {
  if (row.highlightTone === "OVERDUE") {
    return "education-reminder-overdue-row";
  }
  if (row.highlightTone === "UPCOMING") {
    return "education-reminder-upcoming-row";
  }
  return "";
}

function completionCellClassName(params: GridCellClassNameParams<EducationReminderCompletionRecord>) {
  if (!nonMergedCompletionHighlightFields.has(params.field as keyof EducationReminderCompletionRecord | "__actions__")) {
    return "";
  }

  return completionRowClassName(params.row);
}

function notificationCellClassName(params: GridCellClassNameParams<EducationReminderNotificationTargetRecord>) {
  if (!notificationHighlightFields.has(params.field as keyof EducationReminderNotificationTargetRecord | "__actions__")) {
    return "";
  }

  return completionRowClassName(params.row);
}

function SummaryCard({
  color = "text.primary",
  label,
  sx,
  value,
}: {
  color?: string;
  label: string;
  sx?: SxProps<Theme>;
  value: string;
}) {
  return (
    <Card sx={sx}>
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

function ApplicationChip({ value }: { value: boolean }) {
  return (
    <Chip
      color={value ? "success" : "default"}
      label={value ? "신청" : "미신청"}
      size="small"
      variant={value ? "filled" : "outlined"}
    />
  );
}

function RetireChip({ value }: { value: "Y" | "N" }) {
  return (
    <Chip
      color={value === "Y" ? "default" : "primary"}
      label={value === "Y" ? "퇴사" : "재직"}
      size="small"
      variant={value === "Y" ? "outlined" : "filled"}
    />
  );
}

function DateEditCell(params: GridRenderEditCellParams<EducationReminderCompletionRecord, string>) {
  const { api, field, hasFocus, id, value } = params;

  return (
    <TextField
      autoFocus={hasFocus}
      fullWidth
      placeholder="YYYYMMDD"
      size="small"
      value={String(value ?? "").replace(/\D/g, "").slice(0, 8)}
      onChange={(event) => {
        const nextValue = event.target.value.replace(/\D/g, "").slice(0, 8);
        void api.setEditCellValue({ id, field, value: nextValue }, event);
      }}
      slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
    />
  );
}

function ApplicationYnEditCell(params: GridRenderEditCellParams<EducationReminderCompletionRecord, boolean>) {
  const { api, field, hasFocus, id, value } = params;

  return (
    <TextField
      autoFocus={hasFocus}
      fullWidth
      select
      size="small"
      value={normalizeEducationRegistered(value) ? "true" : "false"}
      onChange={(event) => {
        void api.setEditCellValue({ id, field, value: event.target.value === "true" }, event);
      }}
    >
      <MenuItem value="true">신청</MenuItem>
      <MenuItem value="false">미신청</MenuItem>
    </TextField>
  );
}

function NoteEditCell(params: GridRenderEditCellParams<EducationReminderCompletionRecord, string>) {
  const { api, field, hasFocus, id, value } = params;

  return (
    <TextField
      autoFocus={hasFocus}
      fullWidth
      size="small"
      value={value ?? ""}
      onChange={(event) => {
        void api.setEditCellValue({ id, field, value: event.target.value }, event);
      }}
    />
  );
}

function PhoneEditCell(params: GridRenderEditCellParams<EducationReminderNotificationTargetRecord, string>) {
  const { api, field, hasFocus, id, value } = params;

  return (
    <TextField
      autoFocus={hasFocus}
      fullWidth
      placeholder="전화번호"
      size="small"
      value={value ?? ""}
      onChange={(event) => {
        void api.setEditCellValue({ id, field, value: event.target.value }, event);
      }}
    />
  );
}

function normalizeCompletionRow(
  row: EducationReminderCompletionRecord,
  fallbackRow?: EducationReminderCompletionRecord,
): EducationReminderCompletionRecord {
  const normalizeDateInput = (value: string | null | undefined) => String(value ?? "").replace(/\D/g, "").slice(0, 8);

  return {
    ...fallbackRow,
    ...row,
    educationRegistered: normalizeEducationRegistered(row.educationRegistered ?? fallbackRow?.educationRegistered),
    professionalCertNames: row.professionalCertNames ?? fallbackRow?.professionalCertNames ?? "",
    recentEducationStartDate1: normalizeDateInput(row.recentEducationStartDate1 ?? fallbackRow?.recentEducationStartDate1),
    recentEducationStartDate2: normalizeDateInput(row.recentEducationStartDate2 ?? fallbackRow?.recentEducationStartDate2),
    remark: row.remark?.trim() ?? fallbackRow?.remark?.trim() ?? "",
  };
}

function normalizeNotificationRow(
  row: EducationReminderNotificationTargetRecord,
  fallbackRow?: EducationReminderNotificationTargetRecord,
): EducationReminderNotificationTargetRecord {
  return {
    ...fallbackRow,
    ...row,
    phoneNo: normalizePhoneNo(row.phoneNo ?? fallbackRow?.phoneNo),
  };
}

function toUpsertRequest(row: EducationReminderCompletionRecord): EducationReminderCompletionUpsertRequest {
  return {
    educationCode: row.educationCode,
    educationRegistered: normalizeEducationRegistered(row.educationRegistered),
    educationStartDate1: row.recentEducationStartDate1,
    educationStartDate2: row.recentEducationStartDate2,
    engrId: row.engineerId,
    remark: row.remark,
  };
}

function isSameUpsertRequest(
  left: EducationReminderCompletionUpsertRequest,
  right: EducationReminderCompletionUpsertRequest,
) {
  return (
    left.educationCode === right.educationCode &&
    left.educationRegistered === right.educationRegistered &&
    left.educationStartDate1 === right.educationStartDate1 &&
    left.educationStartDate2 === right.educationStartDate2 &&
    left.engrId === right.engrId &&
    left.remark === right.remark
  );
}

const engineerRowSpanValueGetter = (_value: unknown, row: EducationReminderCompletionRecord) => row.engineerId;
const uniqueRowSpanValueGetter = (_value: unknown, row: EducationReminderCompletionRecord) => row.rowKey;

function EducationReminderCompletionManagementContent() {
  const { canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const { showError, showSuccess } = useAppSnackbar();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(() => emptyFilterState());
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => emptyFilterState());
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [notificationTargetMode, setNotificationTargetMode] = useState(false);

  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: tabQueryEnabled });

  const specialtyFieldLabelByCode = specialtyFieldReferences.labelByValue;
  const jobFieldLabelByCode = jobFieldReferences.labelByValue;

  const specialtyFieldOptions = useMemo<CodeOption[]>(() => toSelectOptions(specialtyFieldReferences.options), [specialtyFieldReferences.options]);
  const jobFieldOptions = useMemo<CodeOption[]>(() => toSelectOptions(jobFieldReferences.options), [jobFieldReferences.options]);

  const completionSearchParams = useMemo<EducationReminderCompletionSearchParams>(
    () => ({
      educationRegistered: appliedFilters.educationRegistered,
      jobField: appliedFilters.jobField,
      name: appliedFilters.name.trim() || undefined,
      recentEducationStartDate1: appliedFilters.recentEducationStartDate1 || undefined,
      recentEducationStartDate2: appliedFilters.recentEducationStartDate2 || undefined,
      retireYn: appliedFilters.retireYn,
      specialtyField: appliedFilters.specialtyField,
    }),
    [appliedFilters],
  );

  const notificationSearchParams = useMemo<Pick<EducationReminderCompletionSearchParams, "jobField" | "name" | "specialtyField">>(
    () => ({
      jobField: appliedFilters.jobField || undefined,
      name: appliedFilters.name.trim() || undefined,
      specialtyField: appliedFilters.specialtyField || undefined,
    }),
    [appliedFilters],
  );

  const completionQuery = useQuery({
    queryKey: ["education-reminders", "completions", completionSearchParams],
    queryFn: () => listEducationReminderCompletions(completionSearchParams),
    enabled: tabQueryEnabled && !notificationTargetMode,
  });

  const notificationTargetQuery = useQuery({
    queryKey: ["education-reminders", "notification-targets", notificationSearchParams],
    queryFn: () => listEducationReminderNotificationTargets(notificationSearchParams),
    enabled: tabQueryEnabled && notificationTargetMode,
  });

  const completionRows = useMemo(() => completionQuery.data ?? [], [completionQuery.data]);
  const notificationRows = useMemo(() => notificationTargetQuery.data ?? [], [notificationTargetQuery.data]);

  const completionSummary = useMemo(() => {
    const totalEngineerIds = new Set<string>();
    const professionalEngineerIds = new Set<string>();
    const upcomingEngineerIds = new Set<string>();
    const overdueEngineerIds = new Set<string>();

    for (const row of completionRows) {
      totalEngineerIds.add(row.engineerId);

      if (row.hasProfessionalCert === "Y") {
        professionalEngineerIds.add(row.engineerId);
      }

      if (row.highlightTone === "UPCOMING") {
        upcomingEngineerIds.add(row.engineerId);
      }

      if (row.highlightTone === "OVERDUE") {
        overdueEngineerIds.add(row.engineerId);
      }
    }

    return {
      applied: completionRows.filter((row) => row.educationRegistered).length,
      notApplied: completionRows.filter((row) => !row.educationRegistered).length,
      overdue: overdueEngineerIds.size,
      professional: professionalEngineerIds.size,
      total: totalEngineerIds.size,
      upcoming: upcomingEngineerIds.size,
    };
  }, [completionRows]);

  const notificationSummary = useMemo(() => {
    const professionalEngineerIds = new Set<string>();
    const upcomingEngineerIds = new Set<string>();
    const overdueEngineerIds = new Set<string>();

    for (const row of notificationRows) {
      if (row.hasProfessionalCert === "Y") {
        professionalEngineerIds.add(row.engineerId);
      }
      if (row.highlightTone === "UPCOMING") {
        upcomingEngineerIds.add(row.engineerId);
      }
      if (row.highlightTone === "OVERDUE") {
        overdueEngineerIds.add(row.engineerId);
      }
    }

    return {
      missingPhoneNo: notificationRows.filter((row) => !normalizePhoneNo(row.phoneNo)).length,
      overdue: overdueEngineerIds.size,
      phoneNoRegistered: notificationRows.filter((row) => Boolean(normalizePhoneNo(row.phoneNo))).length,
      professional: professionalEngineerIds.size,
      total: notificationRows.length,
      upcoming: upcomingEngineerIds.size,
    };
  }, [notificationRows]);

  const saveMutation = useMutation({
    mutationFn: saveEducationReminderCompletion,
    onSuccess: async () => {
      showSuccess("교육 알림 이수 정보가 저장되었습니다.");
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "completions"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "교육 알림 이수 정보를 저장하지 못했습니다."),
  });

  const saveNotificationPhoneMutation = useMutation({
    mutationFn: ({ engrId, phoneNo }: { engrId: string; phoneNo: string }) =>
      saveEducationReminderNotificationPhone(engrId, { phoneNo }),
    onSuccess: async () => {
      showSuccess("전화번호가 저장되었습니다.");
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "notification-targets"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "전화번호를 저장하지 못했습니다."),
  });

  const startEditRow = useCallback((id: GridRowId) => {
    setRowModesModel((current) => ({ ...current, [id]: { mode: GridRowModes.Edit } }));
  }, []);

  const stopEditRow = useCallback((id: GridRowId) => {
    setRowModesModel((current) => ({ ...current, [id]: { ignoreModifications: true, mode: GridRowModes.View } }));
  }, []);

  const saveRow = useCallback((id: GridRowId) => {
    setRowModesModel((current) => ({ ...current, [id]: { mode: GridRowModes.View } }));
  }, []);

  const processCompletionRowUpdate = useCallback(
    async (updatedRow: EducationReminderCompletionRecord, originalRow: EducationReminderCompletionRecord) => {
      const normalizedRow = normalizeCompletionRow(updatedRow, originalRow);
      const nextRequest = toUpsertRequest(normalizedRow);
      const originalRequest = toUpsertRequest(normalizeCompletionRow(originalRow));

      if (isSameUpsertRequest(nextRequest, originalRequest)) {
        return normalizeCompletionRow(originalRow);
      }

      await saveMutation.mutateAsync(nextRequest);
      return normalizedRow;
    },
    [saveMutation],
  );

  const processNotificationRowUpdate = useCallback(
    async (updatedRow: EducationReminderNotificationTargetRecord, originalRow: EducationReminderNotificationTargetRecord) => {
      const normalizedRow = normalizeNotificationRow(updatedRow, originalRow);
      const originalPhoneNo = normalizePhoneNo(originalRow.phoneNo);

      if (normalizedRow.phoneNo === originalPhoneNo) {
        return normalizeNotificationRow(originalRow);
      }

      await saveNotificationPhoneMutation.mutateAsync({
        engrId: normalizedRow.engineerId,
        phoneNo: normalizedRow.phoneNo,
      });
      return normalizedRow;
    },
    [saveNotificationPhoneMutation],
  );

  const specialtyFieldValue = useMemo(
    () => specialtyFieldOptions.find((option) => option.value === filters.specialtyField) ?? null,
    [filters.specialtyField, specialtyFieldOptions],
  );
  const jobFieldValue = useMemo(
    () => jobFieldOptions.find((option) => option.value === filters.jobField) ?? null,
    [filters.jobField, jobFieldOptions],
  );

  const handleReset = useCallback(() => {
    const next = emptyFilterState();
    setFilters(next);
    setAppliedFilters(next);
    setRowModesModel({});
  }, []);

  const handleSearch = useCallback(
    (name: string) => {
      setAppliedFilters({
        ...filters,
        name,
      });
      setRowModesModel({});
    },
    [filters],
  );

  const handleToggleNotificationTargetMode = useCallback((_event: SyntheticEvent, checked: boolean) => {
    setNotificationTargetMode(checked);
    setRowModesModel({});
  }, []);

  const handleCompletionCellDoubleClick = useCallback(
    ({ row, field }: { row: EducationReminderCompletionRecord; field: string }) => {
      if (canUpdate && (editableDateFields.has(field as keyof EducationReminderCompletionRecord) || field === "educationRegistered" || field === "remark")) {
        startEditRow(row.rowKey);
      }
    },
    [canUpdate, startEditRow],
  );

  const handleNotificationCellDoubleClick = useCallback(
    ({ row, field }: { row: EducationReminderNotificationTargetRecord; field: string }) => {
      if (canUpdate && field === "phoneNo") {
        startEditRow(row.rowKey);
      }
    },
    [canUpdate, startEditRow],
  );

  const completionActionColumn = useMemo<GridColDef<EducationReminderCompletionRecord>>(
    () => ({
      field: "__actions__",
      type: "actions",
      width: 84,
      getActions: (params) => {
        const isEditing = rowModesModel[params.id]?.mode === GridRowModes.Edit;
        if (isEditing) {
          return [
            <GridActionsCellItem key="save" icon={<SaveOutlinedIcon />} label="저장" onClick={() => saveRow(params.id)} color="primary" />,
            <GridActionsCellItem key="cancel" icon={<RestartAltOutlinedIcon />} label="취소" onClick={() => stopEditRow(params.id)} color="inherit" />,
          ];
        }

        if (!canUpdate) {
          return [];
        }

        return [<GridActionsCellItem key="edit" icon={<EditOutlinedIcon />} label="수정" onClick={() => startEditRow(params.id)} color="inherit" />];
      },
    }),
    [canUpdate, rowModesModel, saveRow, startEditRow, stopEditRow],
  );

  const notificationActionColumn = useMemo<GridColDef<EducationReminderNotificationTargetRecord>>(
    () => ({
      field: "__actions__",
      type: "actions",
      width: 84,
      getActions: (params) => {
        const isEditing = rowModesModel[params.id]?.mode === GridRowModes.Edit;
        if (isEditing) {
          return [
            <GridActionsCellItem key="save" icon={<SaveOutlinedIcon />} label="저장" onClick={() => saveRow(params.id)} color="primary" />,
            <GridActionsCellItem key="cancel" icon={<RestartAltOutlinedIcon />} label="취소" onClick={() => stopEditRow(params.id)} color="inherit" />,
          ];
        }

        if (!canUpdate) {
          return [];
        }

        return [<GridActionsCellItem key="edit" icon={<EditOutlinedIcon />} label="수정" onClick={() => startEditRow(params.id)} color="inherit" />];
      },
    }),
    [canUpdate, rowModesModel, saveRow, startEditRow, stopEditRow],
  );

  const completionBaseColumns = useMemo<GridColDef<EducationReminderCompletionRecord>[]>(
    () => [
      { field: "department", headerName: "부서", minWidth: 120, flex: 0.8, rowSpanValueGetter: engineerRowSpanValueGetter },
      { field: "name", headerName: "이름", width: 80, rowSpanValueGetter: engineerRowSpanValueGetter },
      {
        field: "retireYn",
        headerName: "재직여부",
        width: 80,
        align: "center",
        headerAlign: "center",
        rowSpanValueGetter: engineerRowSpanValueGetter,
        renderCell: ({ row }) => <RetireChip value={row.retireYn} />,
      },
      {
        field: "specialtyField",
        headerName: "전문분야",
        minWidth: 100,
        flex: 0.8,
        rowSpanValueGetter: engineerRowSpanValueGetter,
        valueGetter: (_value, row) => formatReferenceLabel(specialtyFieldLabelByCode, row.specialtyField),
      },
      {
        field: "jobField",
        headerName: "직무분야",
        minWidth: 100,
        flex: 0.8,
        rowSpanValueGetter: engineerRowSpanValueGetter,
        valueGetter: (_value, row) => formatReferenceLabel(jobFieldLabelByCode, row.jobField),
      },
      { field: "grade", headerName: "직급", width: 60, rowSpanValueGetter: engineerRowSpanValueGetter },
      { field: "educationName", headerName: "교육명", minWidth: 180, flex: 1 },
      {
        field: "professionalCertNames",
        headerName: "기술사 자격증",
        minWidth: 180,
        flex: 1,
        rowSpanValueGetter: engineerRowSpanValueGetter,
        renderCell: ({ row }) => row.professionalCertNames?.trim() || "-",
      },
      {
        field: "recentEducationStartDate1",
        headerName: "최근 교육 시작일1",
        width: 132,
        editable: true,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => formatDateText(row.recentEducationStartDate1),
        renderEditCell: DateEditCell,
      },
      {
        field: "recentEducationStartDate2",
        headerName: "최근 교육 시작일2",
        width: 132,
        editable: true,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => formatDateText(row.recentEducationStartDate2),
        renderEditCell: DateEditCell,
      },
      {
        field: "scheduledEducation1",
        headerName: "교육 예정일1",
        width: 120,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => formatDateText(row.scheduledEducation1),
      },
      {
        field: "scheduledEducation2",
        headerName: "교육 예정일2",
        width: 120,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => formatDateText(row.scheduledEducation2),
      },
      {
        field: "educationRegistered",
        headerName: "교육 신청여부",
        width: 110,
        align: "center",
        headerAlign: "center",
        editable: true,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => <ApplicationChip value={row.educationRegistered} />,
        renderEditCell: ApplicationYnEditCell,
      },
      {
        field: "remark",
        headerName: "비고",
        minWidth: 180,
        flex: 1,
        editable: true,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => row.remark.trim() || "-",
        renderEditCell: NoteEditCell,
      },
      {
        field: "lastChangedId",
        headerName: "수정ID",
        width: 110,
        renderCell: ({ row }) => row.lastChangedId?.trim() || "-",
      },
      {
        field: "lastChangedAt",
        headerName: "수정시각",
        width: 160,
        renderCell: ({ row }) => formatDateText(row.lastChangedAt),
      },
    ],
    [jobFieldLabelByCode, specialtyFieldLabelByCode],
  );

  const notificationColumns = useMemo<GridColDef<EducationReminderNotificationTargetRecord>[]>(
    () => [
      notificationActionColumn,
      { field: "engineerId", headerName: "기술인ID", width: 120 },
      { field: "department", headerName: "부서", minWidth: 140, flex: 0.8 },
      { field: "name", headerName: "이름", width: 90 },
      {
        field: "specialtyField",
        headerName: "전문분야",
        minWidth: 120,
        flex: 0.8,
        valueGetter: (_value, row) => formatReferenceLabel(specialtyFieldLabelByCode, row.specialtyField),
      },
      {
        field: "jobField",
        headerName: "직무분야",
        minWidth: 120,
        flex: 0.8,
        valueGetter: (_value, row) => formatReferenceLabel(jobFieldLabelByCode, row.jobField),
      },
      { field: "grade", headerName: "직급", width: 80 },
      {
        field: "professionalCertNames",
        headerName: "기술사 자격증",
        minWidth: 180,
        flex: 1,
        renderCell: ({ row }) => row.professionalCertNames?.trim() || "-",
      },
      {
        field: "targetEducationNames",
        headerName: "발송 대상 교육",
        minWidth: 220,
        flex: 1.2,
        renderCell: ({ row }) => row.targetEducationNames?.trim() || "-",
      },
      {
        field: "phoneNo",
        headerName: "전화번호",
        minWidth: 160,
        flex: 0.8,
        editable: true,
        renderCell: ({ row }) => normalizePhoneNo(row.phoneNo) || "-",
        renderEditCell: PhoneEditCell,
      },
    ],
    [jobFieldLabelByCode, notificationActionColumn, specialtyFieldLabelByCode],
  );

  const completionColumns = useMemo<GridColDef<EducationReminderCompletionRecord>[]>(
    () => [completionActionColumn, ...completionBaseColumns],
    [completionActionColumn, completionBaseColumns],
  );

  const activeLoading = notificationTargetMode
    ? notificationTargetQuery.isLoading || notificationTargetQuery.isFetching || saveNotificationPhoneMutation.isPending
    : completionQuery.isLoading || completionQuery.isFetching || saveMutation.isPending;

  if (!canRead) {
    return <Alert severity="warning">교육 알림 이수 관리 조회 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      {notificationTargetMode ? (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" } }}>
          <SummaryCard label="발송 대상 기술인 수" value={`${notificationSummary.total}건`} />
          <SummaryCard color="success.main" label="전화번호 등록" value={`${notificationSummary.phoneNoRegistered}건`} />
          <SummaryCard color="warning.main" label="전화번호 미등록" value={`${notificationSummary.missingPhoneNo}건`} />
          <SummaryCard color="secondary.main" label="기술사 대상" value={`${notificationSummary.professional}건`} />
          <SummaryCard color="warning.dark" label="30일내 교육 미신청" sx={upcomingSummaryCardSx} value={`${notificationSummary.upcoming}건`} />
          <SummaryCard color="error.main" label="교육 기한 초과" sx={overdueSummaryCardSx} value={`${notificationSummary.overdue}건`} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" } }}>
          <SummaryCard label="조회된 전체 기술인 수" value={`${completionSummary.total}건`} />
          <SummaryCard color="success.main" label="교육 신청" value={`${completionSummary.applied}건`} />
          <SummaryCard color="warning.main" label="미신청" value={`${completionSummary.notApplied}건`} />
          <SummaryCard color="secondary.main" label="기술사 대상" value={`${completionSummary.professional}건`} />
          <SummaryCard color="warning.dark" label="30일내 교육 미신청" sx={upcomingSummaryCardSx} value={`${completionSummary.upcoming}건`} />
          <SummaryCard color="error.main" label="교육 기한 초과" sx={overdueSummaryCardSx} value={`${completionSummary.overdue}건`} />
        </Box>
      )}

      <SearchPanel
        keyword={filters.name}
        keywordLabel="이름"
        keywordPlaceholder="기술인 이름"
        keywordSx={{ flex: "0 1 240px", maxWidth: 320, minWidth: 220 }}
        onKeywordChange={(name) => setFilters((current) => ({ ...current, name }))}
        onReset={handleReset}
        onSearch={handleSearch}
        resetLabel="초기화"
        searchDisabled={activeLoading}
        searchLabel="조회"
      >
        {!notificationTargetMode ? (
          <TextField
            select
            label="교육 신청여부"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                educationRegistered: event.target.value === "" ? "" : event.target.value === "true",
              }))
            }
            size="small"
            sx={{ minWidth: 160 }}
            value={filters.educationRegistered === "" ? "" : String(filters.educationRegistered)}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="true">신청</MenuItem>
            <MenuItem value="false">미신청</MenuItem>
          </TextField>
        ) : null}

        {!notificationTargetMode ? (
          <TextField
            select
            label="재직여부"
            onChange={(event) => setFilters((current) => ({ ...current, retireYn: event.target.value as RetireYnFilter }))}
            size="small"
            sx={{ minWidth: 120 }}
            value={filters.retireYn}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="N">재직</MenuItem>
            <MenuItem value="Y">퇴사</MenuItem>
          </TextField>
        ) : null}

        <Autocomplete<CodeOption, false, false, false>
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          onChange={(_event, value) => setFilters((current) => ({ ...current, specialtyField: value?.value ?? "" }))}
          options={specialtyFieldOptions}
          renderInput={(params) => <TextField {...params} label="전문분야" size="small" sx={standardFieldSx} />}
          sx={{ minWidth: 220 }}
          value={specialtyFieldValue}
        />
        <Autocomplete<CodeOption, false, false, false>
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          onChange={(_event, value) => setFilters((current) => ({ ...current, jobField: value?.value ?? "" }))}
          options={jobFieldOptions}
          renderInput={(params) => <TextField {...params} label="직무분야" size="small" sx={standardFieldSx} />}
          sx={{ minWidth: 220 }}
          value={jobFieldValue}
        />

        {!notificationTargetMode ? (
          <TextField
            label="최근 교육 시작일1"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                recentEducationStartDate1: normalizeDateFilterInput(event.target.value),
              }))
            }
            placeholder="YYYY or YYYYMMDD"
            size="small"
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
            sx={{ minWidth: 180 }}
            value={filters.recentEducationStartDate1}
          />
        ) : null}

        {!notificationTargetMode ? (
          <TextField
            label="최근 교육 시작일2"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                recentEducationStartDate2: normalizeDateFilterInput(event.target.value),
              }))
            }
            placeholder="YYYY or YYYYMMDD"
            size="small"
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
            sx={{ minWidth: 180 }}
            value={filters.recentEducationStartDate2}
          />
        ) : null}
      </SearchPanel>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <FormControlLabel
                control={<Switch checked={notificationTargetMode} onChange={handleToggleNotificationTargetMode} />}
                label="알림 발송 대상"
            />
            {notificationTargetMode ? (
              <EnterpriseDataGrid<EducationReminderNotificationTargetRecord>
                columns={notificationColumns}
                getRowId={(row) => row.rowKey}
                getCellClassName={notificationCellClassName}
                hideFooterSelectedRowCount
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: INITIAL_PAGE_SIZE,
                    },
                  },
                }}
                loading={activeLoading}
                onCellDoubleClick={handleNotificationCellDoubleClick}
                onRowModesModelChange={setRowModesModel}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                processRowUpdate={processNotificationRowUpdate}
                rowModesModel={rowModesModel}
                rows={notificationRows}
                showPageNumbers
                showXlsxExportButton
                wrapperMinHeight={620}
                sx={{
                  height: 620,
                  minWidth: 0,
                  width: "100%",
                  "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                  "& .MuiDataGrid-cell.education-reminder-upcoming-row": {
                    bgcolor: "rgba(250, 204, 21, 0.26)",
                  },
                  "& .MuiDataGrid-row:hover .MuiDataGrid-cell.education-reminder-upcoming-row": {
                    bgcolor: "rgba(250, 204, 21, 0.36)",
                  },
                  "& .MuiDataGrid-cell.education-reminder-overdue-row": {
                    bgcolor: "rgba(239, 68, 68, 0.24)",
                  },
                  "& .MuiDataGrid-row:hover .MuiDataGrid-cell.education-reminder-overdue-row": {
                    bgcolor: "rgba(239, 68, 68, 0.34)",
                  },
                }}
              />
            ) : (
              <EnterpriseDataGrid<EducationReminderCompletionRecord>
                columns={completionColumns}
                getRowId={(row) => row.rowKey}
                getCellClassName={completionCellClassName}
                hideFooterSelectedRowCount
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: INITIAL_PAGE_SIZE,
                    },
                  },
                }}
                loading={activeLoading}
                onCellDoubleClick={handleCompletionCellDoubleClick}
                onRowModesModelChange={setRowModesModel}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                processRowUpdate={processCompletionRowUpdate}
                rowModesModel={rowModesModel}
                rowSpanning
                rows={completionRows}
                showPageNumbers
                showXlsxExportButton
                wrapperMinHeight={620}
                sx={{
                  height: 620,
                  minWidth: 0,
                  width: "100%",
                  "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                  "& .MuiDataGrid-cell.education-reminder-upcoming-row": {
                    bgcolor: "rgba(250, 204, 21, 0.26)",
                  },
                  "& .MuiDataGrid-row:hover .MuiDataGrid-cell.education-reminder-upcoming-row": {
                    bgcolor: "rgba(250, 204, 21, 0.36)",
                  },
                  "& .MuiDataGrid-cell.education-reminder-overdue-row": {
                    bgcolor: "rgba(239, 68, 68, 0.24)",
                  },
                  "& .MuiDataGrid-row:hover .MuiDataGrid-cell.education-reminder-overdue-row": {
                    bgcolor: "rgba(239, 68, 68, 0.34)",
                  },
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}

export function EducationReminderCompletionManagementPage() {
  const { canRead } = useCurrentMenuPermission();

  return (
    <Box>
      <PageHeader title="교육 이수 관리" />

      {!canRead ? (
        <Alert severity="warning">교육 이수 관리 조회 권한이 없습니다.</Alert>
      ) : (
        <EducationReminderCompletionManagementContent />
      )}
    </Box>
  );
}
