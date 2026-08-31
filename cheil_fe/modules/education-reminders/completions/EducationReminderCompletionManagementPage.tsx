"use client";

import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Autocomplete,
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
import type { SxProps, Theme } from "@mui/material/styles";
import {
  type GridRowSelectionModel,
  type GridColDef,
  type GridRenderEditCellParams,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { CheckboxSelectInput } from "@/components/common/CheckboxSelectInput";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { formatReferenceLabel, toSelectOptions } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";

import {
  listEducationReminderCompletions,
  listEducationReminderNotificationTargets,
  saveEducationReminderCompletion,
  saveEducationReminderNotificationPhone,
} from "./api";
import { listEducationReminderBasicInfos } from "../basic-infos/api";
import { createEducationReminderSend } from "../send/api";
import { EducationReminderSendDialog } from "../send/EducationReminderSendDialog";
import { getClosestEducationDeadline, type EducationReminderSendDialogTarget } from "../send/types";
import { listEducationReminderTemplates } from "../templates/api";
import {
  formatDateText,
  type EducationReminderCompletionRecord,
  type EducationReminderCompletionSearchParams,
  type EducationReminderCompletionUpsertRequest,
} from "../types";

type FilterState = {
  educationRegistered: "" | boolean;
  jobField: string;
  name: string;
  scheduledEducationYear: string;
  specialtyField: string;
  educationCodes: string[];
  upcomingWithinDays: "" | "30" | "60";
};

type CodeOption = {
  label: string;
  value: string;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const INITIAL_PAGE_SIZE = 50;
const UPCOMING_REMINDER_DAYS = 60;

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
  scheduledEducationYear: currentYear(),
  specialtyField: "",
  upcomingWithinDays: "",
  educationCodes: [],
});

const currentYear = () => new Date().getFullYear().toString();
const normalizeDateFilterInput = (value: string) => value.replace(/\D/g, "").slice(0, 4);
const normalizeEducationRegistered = (value: boolean | string | null | undefined) => value === true || value === "Y" || value === "true";

const getCompletionHighlightTone = (row: EducationReminderCompletionRecord) => {
  if (row.educationRegistered) {
    return "NONE";
  }

  return row.highlightTone;
};

function completionRowClassName(row: { highlightTone: "NONE" | "UPCOMING" | "OVERDUE" }) {
  const tone = row.highlightTone;

  if (tone === "OVERDUE") {
    return "education-reminder-overdue-row";
  }
  if (tone === "UPCOMING") {
    return "education-reminder-upcoming-row";
  }
  return "";
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

function formatPhoneNo(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function PhoneEditCell(params: GridRenderEditCellParams<EducationReminderCompletionRecord, string>) {
  const { api, field, hasFocus, id, value } = params;

  return (
    <TextField
      autoFocus={hasFocus}
      fullWidth
      size="small"
      slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 11 } }}
      value={String(value ?? "").replace(/\D/g, "").slice(0, 11)}
      onChange={(event) => {
        const nextValue = event.target.value.replace(/\D/g, "").slice(0, 11);
        void api.setEditCellValue({ id, field, value: nextValue }, event);
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
    phoneNo: String(row.phoneNo ?? fallbackRow?.phoneNo ?? "").replace(/\D/g, "").slice(0, 11),
    recentEducationStartDate1: normalizeDateInput(row.recentEducationStartDate1 ?? fallbackRow?.recentEducationStartDate1),
    recentEducationStartDate2: normalizeDateInput(row.recentEducationStartDate2 ?? fallbackRow?.recentEducationStartDate2),
    remark: row.remark?.trim() ?? fallbackRow?.remark?.trim() ?? "",
  };
}

function toUpsertRequest(
  row: EducationReminderCompletionRecord,
  advanceCycle = false,
): EducationReminderCompletionUpsertRequest {
  return {
    advanceCycle,
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
  const { canCreate, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const { showError, showSuccess } = useAppSnackbar();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(() => emptyFilterState());
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => emptyFilterState());
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const designGradeReferences = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const basicInfosQuery = useQuery({
    queryKey: ["education-reminders", "basic-infos"],
    queryFn: listEducationReminderBasicInfos,
    enabled: tabQueryEnabled,
  });
  const templatesQuery = useQuery({
    queryKey: ["education-reminders", "templates"],
    queryFn: listEducationReminderTemplates,
    enabled: tabQueryEnabled,
  });
  const notificationTargetQuery = useQuery({
    queryKey: ["education-reminders", "notification-targets"],
    queryFn: () => listEducationReminderNotificationTargets(),
    enabled: tabQueryEnabled && sendDialogOpen,
  });

  const specialtyFieldLabelByCode = specialtyFieldReferences.labelByValue;
  const jobFieldLabelByCode = jobFieldReferences.labelByValue;
  const designGradeLabelByCode = designGradeReferences.labelByValue;

  const specialtyFieldOptions = useMemo<CodeOption[]>(() => toSelectOptions(specialtyFieldReferences.options), [specialtyFieldReferences.options]);
  const jobFieldOptions = useMemo<CodeOption[]>(() => toSelectOptions(jobFieldReferences.options), [jobFieldReferences.options]);

  const completionSearchParams = useMemo<EducationReminderCompletionSearchParams>(
    () => ({
      educationRegistered: appliedFilters.educationRegistered === "" ? undefined : appliedFilters.educationRegistered,
      jobField: appliedFilters.jobField,
      name: appliedFilters.name.trim() || undefined,
      educationCodes: appliedFilters.educationCodes.length ? appliedFilters.educationCodes : undefined,
      scheduledEducationYear: appliedFilters.scheduledEducationYear || undefined,
      specialtyField: appliedFilters.specialtyField,
      upcomingWithinDays: appliedFilters.upcomingWithinDays ? Number(appliedFilters.upcomingWithinDays) as 30 | 60 : undefined,
    }),
    [appliedFilters],
  );

  const completionQuery = useQuery({
    queryKey: ["education-reminders", "completions", completionSearchParams],
    queryFn: () => listEducationReminderCompletions(completionSearchParams),
    enabled: tabQueryEnabled,
  });

  const completionRows = useMemo(() => completionQuery.data ?? [], [completionQuery.data]);
  const educationCodeOptions = useMemo(
    () => (basicInfosQuery.data ?? []).map((item) => ({ label: item.name, value: item.code })),
    [basicInfosQuery.data],
  );

  const selectedEngineerIds = useMemo(() => {
    const selectedRowKeys = new Set(Array.from(rowSelectionModel.ids).map(String));
    return new Set(completionRows.filter((row) => selectedRowKeys.has(row.rowKey)).map((row) => row.engineerId));
  }, [completionRows, rowSelectionModel]);

  const selectedCompletionRows = useMemo(() => {
    const selectedRowKeys = new Set(Array.from(rowSelectionModel.ids).map(String));
    return completionRows.filter((row) => selectedRowKeys.has(row.rowKey));
  }, [completionRows, rowSelectionModel]);

  const selectedSendTargets = useMemo<EducationReminderSendDialogTarget[]>(
    () => {
      const notificationTargetsByEngineerId = new Map((notificationTargetQuery.data ?? []).map((target) => [target.engineerId, target]));
      const rowsByEngineerId = new Map<string, EducationReminderCompletionRecord[]>();

      for (const row of selectedCompletionRows) {
        const rows = rowsByEngineerId.get(row.engineerId) ?? [];
        rows.push(row);
        rowsByEngineerId.set(row.engineerId, rows);
      }

      return Array.from(rowsByEngineerId.entries()).map(([engineerId, rows]) => {
        const firstRow = rows[0];
        const notificationTarget = notificationTargetsByEngineerId.get(engineerId);
        const educationNames = Array.from(new Set(rows.map((row) => row.educationName).filter(Boolean))).join(", ");
        const scheduledEducation1 = Array.from(new Set(rows.map((row) => row.scheduledEducation1).filter(Boolean))).join(", ");
        const scheduledEducation2 = Array.from(new Set(rows.map((row) => row.scheduledEducation2).filter(Boolean))).join(", ");

        return {
          department: notificationTarget?.department ?? firstRow.department,
          deadline: notificationTarget?.deadline ?? getClosestEducationDeadline([scheduledEducation1, scheduledEducation2]),
          engineerId,
          grade: notificationTarget?.grade ?? firstRow.grade,
          highlightTone: notificationTarget?.highlightTone ?? getCompletionHighlightTone(firstRow),
          name: notificationTarget?.name ?? firstRow.name,
          phoneNo: notificationTarget?.phoneNo ?? firstRow.phoneNo,
          rowKey: notificationTarget?.rowKey ?? engineerId,
          scheduledEducation1,
          scheduledEducation2,
          targetEducationNames: educationNames || notificationTarget?.targetEducationNames || "",
        };
      });
    },
    [notificationTargetQuery.data, selectedCompletionRows],
  );

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

      const highlightTone = getCompletionHighlightTone(row);

      if (highlightTone === "UPCOMING") {
        upcomingEngineerIds.add(row.engineerId);
      }

      if (highlightTone === "OVERDUE") {
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

  const saveMutation = useMutation({
    mutationFn: saveEducationReminderCompletion,
    onSuccess: async () => {
      showSuccess("교육 알림 이수 정보가 저장되었습니다.");
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "completions"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "교육 알림 이수 정보 저장에 실패했습니다."),
  });

  const savePhoneMutation = useMutation({
    mutationFn: ({ engrId, phoneNo }: { engrId: string; phoneNo: string }) =>
      saveEducationReminderNotificationPhone(engrId, { phoneNo }),
    onSuccess: async () => {
      showSuccess("전화번호가 저장되었습니다.");
      await queryClient.invalidateQueries({ queryKey: ["education-reminders", "completions"] });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "전화번호 저장에 실패했습니다."),
  });

  const sendMutation = useMutation({
    mutationFn: createEducationReminderSend,
    onSuccess: (result) => {
      showSuccess(`${result.targetCount}명에게 교육알림 발송을 요청했습니다.`);
      setSendDialogOpen(false);
      setRowSelectionModel({ ids: new Set(), type: "include" });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "교육알림 발송에 실패했습니다."),
  });


  const processCompletionRowUpdate = useCallback(
    async (updatedRow: EducationReminderCompletionRecord, originalRow: EducationReminderCompletionRecord) => {
      const normalizedRow = normalizeCompletionRow(updatedRow, originalRow);
      const normalizedOriginalRow = normalizeCompletionRow(originalRow);
      const advanceCycle = !normalizedOriginalRow.educationRegistered && normalizedRow.educationRegistered;
      const nextRequest = toUpsertRequest(normalizedRow, advanceCycle);
      const originalRequest = toUpsertRequest(normalizedOriginalRow);
      const completionChanged = !isSameUpsertRequest(nextRequest, originalRequest);
      const phoneChanged = normalizedRow.phoneNo !== normalizedOriginalRow.phoneNo;

      if (!completionChanged && !phoneChanged) {
        return normalizedOriginalRow;
      }

      if (completionChanged) {
        await saveMutation.mutateAsync(nextRequest);
      }
      if (phoneChanged) {
        await savePhoneMutation.mutateAsync({ engrId: normalizedRow.engineerId, phoneNo: normalizedRow.phoneNo });
      }
      return normalizedRow;
    },
    [saveMutation, savePhoneMutation],
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
    setRowSelectionModel({ ids: new Set(), type: "include" });
  }, []);

  const handleSearch = useCallback(
    (name: string) => {
      setAppliedFilters({
        ...filters,
        name,
      });
      setRowSelectionModel({ ids: new Set(), type: "include" });
    },
    [filters],
  );

  const completionBaseColumns = useMemo<GridColDef<EducationReminderCompletionRecord>[]>(
    () => [
      { field: "department", headerName: "부서명", minWidth: 120, flex: 0.8, rowSpanValueGetter: engineerRowSpanValueGetter },
      { field: "name", headerName: "이름", width: 80, rowSpanValueGetter: engineerRowSpanValueGetter },
      { field: "grade", headerName: "직위", width: 60, rowSpanValueGetter: engineerRowSpanValueGetter },
      {
        field: "phoneNo",
        headerName: "전화번호",
        width: 120,
        editable: true,
        rowSpanValueGetter: engineerRowSpanValueGetter,
        renderCell: ({ row }) => formatPhoneNo(row.phoneNo) || "-",
        renderEditCell: PhoneEditCell,
      },
      {
        field: "jobField",
        headerName: "직무분야",
        minWidth: 100,
        flex: 0.8,
        rowSpanValueGetter: engineerRowSpanValueGetter,
        valueGetter: (_value, row) => formatReferenceLabel(jobFieldLabelByCode, row.jobField),
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
        field: "designGrade",
        headerName: "설계등급",
        width: 90,
        rowSpanValueGetter: engineerRowSpanValueGetter,
        valueGetter: (_value, row) => formatReferenceLabel(designGradeLabelByCode, row.designGrade),
      },
      { field: "educationName", headerName: "교육명", minWidth: 180, flex: 1 },
      {
        field: "professionalCertNames",
        headerName: "전문자격명",
        minWidth: 180,
        flex: 1,
        rowSpanValueGetter: engineerRowSpanValueGetter,
        renderCell: ({ row }) => row.professionalCertNames?.trim() || "-",
      },
      {
        field: "recentEducationStartDate1",
        headerName: "최근 교육 시작일 1",
        width: 132,
        editable: true,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => formatDateText(row.recentEducationStartDate1),
        renderEditCell: DateEditCell,
      },
      {
        field: "recentEducationStartDate2",
        headerName: "최근 교육 시작일 2",
        width: 132,
        editable: true,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => formatDateText(row.recentEducationStartDate2),
        renderEditCell: DateEditCell,
      },
      {
        field: "scheduledEducation1",
        headerName: "교육 예정일 1",
        width: 120,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => formatDateText(row.scheduledEducation1),
      },
      {
        field: "scheduledEducation2",
        headerName: "교육 예정일 2",
        width: 120,
        rowSpanValueGetter: uniqueRowSpanValueGetter,
        renderCell: ({ row }) => formatDateText(row.scheduledEducation2),
      },
      {
        field: "educationRegistered",
        headerName: "교육신청여부",
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
        headerName: "수정일시",
        width: 160,
        renderCell: ({ row }) => formatDateText(row.lastChangedAt),
      },
    ],
    [designGradeLabelByCode, jobFieldLabelByCode, specialtyFieldLabelByCode],
  );

  const completionColumns = completionBaseColumns;

  const activeLoading = completionQuery.isLoading || completionQuery.isFetching || saveMutation.isPending || savePhoneMutation.isPending || sendMutation.isPending;

  if (!canRead) {
    return <Alert severity="warning">조회 권한이 없습니다.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" } }}>
          <SummaryCard label="전체" value={`${completionSummary.total}`} />
          <SummaryCard color="success.main" label="신청" value={`${completionSummary.applied}`} />
          <SummaryCard color="warning.main" label="미신청" value={`${completionSummary.notApplied}`} />
          <SummaryCard color="secondary.main" label="기술사 자격" value={`${completionSummary.professional}`} />
          <SummaryCard color="warning.dark" label={`${UPCOMING_REMINDER_DAYS}일내 교육예정`} sx={upcomingSummaryCardSx} value={`${completionSummary.upcoming}`} />
          <SummaryCard color="error.main" label="교육예정일 초과" sx={overdueSummaryCardSx} value={`${completionSummary.overdue}`} />
      </Box>

      <SearchPanel
        keyword={filters.name}
        keywordLabel="이름"
        keywordPlaceholder="이름 검색"
        keywordSx={{ flex: "0 1 240px", maxWidth: 320, minWidth: 220 }}
        onKeywordChange={(name) => setFilters((current) => ({ ...current, name }))}
        onReset={handleReset}
        onSearch={handleSearch}
        resetLabel="초기화"
        searchDisabled={activeLoading}
        searchLabel="조회"
        actions={
          <Button
            disabled={!canCreate || activeLoading || selectedEngineerIds.size === 0}
            onClick={() => setSendDialogOpen(true)}
            startIcon={<SendIcon />}
            variant="outlined"
          >
            발송
          </Button>
        }
      >
        <TextField
            select
            label="교육신청여부"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                educationRegistered: event.target.value === "" ? "" : event.target.value === "true",
              }))
            }
            size="small"
            sx={{ flex: "0 0 130px !important", maxWidth: "130px !important", minWidth: "110px !important", width: "110px !important" }}
            value={filters.educationRegistered === "" ? "" : String(filters.educationRegistered)}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="true">신청</MenuItem>
            <MenuItem value="false">미신청</MenuItem>
        </TextField>

        <TextField
            select
            label="교육예정"
            onChange={(event) =>
              setFilters((current) => ({ ...current, upcomingWithinDays: event.target.value as "" | "30" | "60" }))
            }
            size="small"
            sx={{ minWidth: 160 }}
            value={filters.upcomingWithinDays}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="30">30일 내 예정</MenuItem>
            <MenuItem value="60">60일 내 예정</MenuItem>
        </TextField>

        <TextField
          label="교육예정일"
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              scheduledEducationYear: normalizeDateFilterInput(event.target.value),
            }))
          }
          placeholder="YYYY"
          size="small"
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }}
          sx={{ flex: "0 0 100px !important", maxWidth: "100px !important", minWidth: "100px !important", width: "100px !important" }}
          value={filters.scheduledEducationYear}
        />

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

        <CheckboxSelectInput
          label="교육명"
          name="educationCodes"
          onChange={(_, value) => setFilters((current) => ({ ...current, educationCodes: value }))}
          options={educationCodeOptions}
          sx={{ minWidth: 220 }}
          value={filters.educationCodes}
        />

      </SearchPanel>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <EnterpriseDataGrid<EducationReminderCompletionRecord>
                checkboxSelection
                columns={completionColumns}
                getRowId={(row) => row.rowKey}
                getRowClassName={(params) => completionRowClassName({ highlightTone: getCompletionHighlightTone(params.row) })}
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
                isCellEditable={() => canUpdate}
                onRowSelectionModelChange={setRowSelectionModel}
                onProcessRowUpdateError={(error) => {
                  showError(error instanceof Error ? error.message : "교육 이수 정보 저장에 실패했습니다.");
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                processRowUpdate={processCompletionRowUpdate}
                rowSelectionModel={rowSelectionModel}
                rows={completionRows}
                showPageNumbers
                showXlsxExportButton
                wrapperMinHeight={620}
                sx={{
                  height: 620,
                  minWidth: 0,
                  width: "100%",
                  "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                  "& .MuiDataGrid-row.education-reminder-upcoming-row .MuiDataGrid-cell": {
                    bgcolor: "rgba(250, 204, 21, 0.26)",
                  },
                  "& .MuiDataGrid-row.education-reminder-upcoming-row:hover .MuiDataGrid-cell": {
                    bgcolor: "rgba(250, 204, 21, 0.36)",
                  },
                  "& .MuiDataGrid-row.education-reminder-overdue-row .MuiDataGrid-cell": {
                    bgcolor: "rgba(239, 68, 68, 0.24)",
                  },
                  "& .MuiDataGrid-row.education-reminder-overdue-row:hover .MuiDataGrid-cell": {
                    bgcolor: "rgba(239, 68, 68, 0.34)",
                  },
                }}
            />
          </Box>
        </CardContent>
      </Card>

      <EducationReminderSendDialog
        loading={sendMutation.isPending || notificationTargetQuery.isLoading}
        onClose={() => setSendDialogOpen(false)}
          onSend={(request) =>
          sendMutation.mutateAsync({
            ...request,
            targetRowKeys: request.targetRowKeys ?? selectedSendTargets.map((target) => target.rowKey),
          }).then(() => undefined)
        }
        open={sendDialogOpen}
        targets={selectedSendTargets}
        templates={templatesQuery.data ?? []}
      />

    </Stack>
  );
}

export function EducationReminderCompletionManagementPage() {
  const { canRead } = useCurrentMenuPermission();

  return (
    <Box>
      <PageHeader title="교육이수 관리" />

      {!canRead ? (
        <Alert severity="warning">조회 권한이 없습니다.</Alert>
      ) : (
        <EducationReminderCompletionManagementContent />
      )}
    </Box>
  );
}
