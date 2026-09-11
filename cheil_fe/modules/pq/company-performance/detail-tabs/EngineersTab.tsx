"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Autocomplete, Box, Button, TextField } from "@mui/material";
import {
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  type DataGridProps,
  type GridColDef,
  type GridRenderEditCellParams,
  type GridRowModesModel,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EnterpriseDataGrid, type EnterpriseRowActionConfirm } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  formatPaddedLevel2CodeLabel,
  formatReferenceLabel,
  toNumericLevel2SelectOptions,
  toSelectOptions,
} from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import {
  createCompanyPerformanceEngineer,
  deleteCompanyPerformanceEngineer,
  listCompanyPerformanceEngineerCandidates,
  listCompanyPerformanceEngineers,
  updateCompanyPerformanceEngineer,
  type CompanyPerformanceEngineerRecord,
  type CompanyPerformanceEngineerRequest,
  type CompanyPerformanceRecord,
} from "@/modules/pq/company-performance/api";
import {
  displayBlank,
  displayTarget,
  tempId,
  text,
  toNullableNumber,
  type CodeOption,
} from "@/modules/pq/company-performance/detail-tabs/detailTabUtils";
type EngineersTabProps = {
  readOnly?: boolean;
  record: CompanyPerformanceRecord;
  requestConfirmation: (action: EnterpriseRowActionConfirm) => void;
};

const formatEngineerDate = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  if (normalized.length === 8) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  return "";
};

const toDateValue = (value: string | null | undefined) => text(value).replaceAll("-", "").slice(0, 8) || null;


const toEngineerRequest = (row: CompanyPerformanceEngineerRecord): CompanyPerformanceEngineerRequest => ({
  actualParticipationYn: text(row.actualParticipationYn).toUpperCase() === "Y" ? "Y" : "N",
  category: text(row.category) || null,
  companyAtParticipation: text(row.companyAtParticipation) || null,
  departmentAtParticipation: text(row.departmentAtParticipation) || null,
  duty: text(row.duty) || null,
  engineerId: text(row.engineerId) || null,
  jobField: text(row.jobField) || null,
  participationEndDate: toDateValue(row.participationEndDate),
  participationFieldPosition: text(row.participationFieldPosition) || null,
  participationGrade: toNullableNumber(row.participationGrade),
  participationStartDate: toDateValue(row.participationStartDate),
  positionAtParticipation: text(row.positionAtParticipation) || null,
  remark: text(row.remark) || null,
  reportYn: text(row.reportYn).toUpperCase() === "Y" ? "Y" : "N",
  specialtyField: text(row.specialtyField) || null,
});

function EngineerAutocompleteEditCell({
  loading,
  onSearch,
  onSelectEngineer,
  options,
  params,
}: {
  loading: boolean;
  onSearch: (keyword: string) => void;
  onSelectEngineer: (engineerId: string) => void;
  options: CodeOption[];
  params: GridRenderEditCellParams<CompanyPerformanceEngineerRecord, string | null>;
}) {
  const value =
    options.find((option) => String(option.value) === text(params.value)) ??
    (text(params.value)
      ? {
          label: displayBlank(params.row.name) || text(params.value),
          value: text(params.value),
        }
      : null);

  return (
    <Autocomplete
      autoHighlight
      disablePortal
      fullWidth
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, currentValue) => String(option.value) === String(currentValue.value)}
      loading={loading}
      onChange={(event, nextValue) => {
        const engineerId = String(nextValue?.value ?? "");
        void params.api.setEditCellValue({ id: params.id, field: params.field, value: engineerId }, event);
        onSelectEngineer(engineerId);
      }}
      onInputChange={(_event, nextInputValue, reason) => {
        if (reason === "input") {
          onSearch(nextInputValue);
        }
      }}
      options={options}
      renderInput={(inputParams) => <TextField {...inputParams} autoFocus size="small" sx={standardFieldSx} />}
      value={value}
    />
  );
}

function YmdEditCell(params: GridRenderEditCellParams<CompanyPerformanceEngineerRecord, string | null>) {
  return (
    <TextField
      autoFocus
      fullWidth
      onChange={(event) => {
        void params.api.setEditCellValue({ id: params.id, field: params.field, value: event.target.value.replace(/\D/g, "").slice(0, 8) }, event);
      }}
      placeholder="YYYYMMDD"
      size="small"
      slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
      sx={standardFieldSx}
      value={text(params.value).replace(/\D/g, "").slice(0, 8)}
    />
  );
}

const resolveParticipationGradeValue = (value: string | null, options: CodeOption[]) => {
  const numericValue = Number(text(value));
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const matchedOption = options.find((option) => option.value === Math.trunc(numericValue)) ??
    options.find((option) => option.value === Math.trunc(numericValue / 10));
  return matchedOption ? Number(matchedOption.value) : null;
};

export function EngineersTab({ readOnly = false, record, requestConfirmation }: EngineersTabProps) {
  const queryClient = useQueryClient();
  const { canCreate, canDelete, canUpdate } = useCurrentMenuPermission();
  const [newRows, setNewRows] = useState<CompanyPerformanceEngineerRecord[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [engineerKeyword, setEngineerKeyword] = useState("");
  const [debouncedEngineerKeyword, setDebouncedEngineerKeyword] = useState("");

  const engineersQuery = useQuery({
    queryKey: ["company-performance-engineers", record.seq],
    queryFn: () => listCompanyPerformanceEngineers(record.seq),
    enabled: Boolean(record.seq),
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedEngineerKeyword(engineerKeyword.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [engineerKeyword]);

  const engineerProfilesQuery = useQuery({
    queryKey: ["company-performance-engineer-candidates", debouncedEngineerKeyword],
    queryFn: () => listCompanyPerformanceEngineerCandidates({ keyword: debouncedEngineerKeyword, limit: 30 }),
    enabled: debouncedEngineerKeyword.length > 0,
  });

  const participationFieldPositionReferences = useCommonCodeLevel3Options("PQ", "DA", { useYn: "Y" });
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" });
  const categoryReferences = useCommonCodeLevel2Options("CA", { useYn: "Y" });
  const participationGradeReferences = useCommonCodeLevel2Options("52", { useYn: "Y" });

  const engineerOptions = useMemo<CodeOption[]>(
    () =>
      (engineerProfilesQuery.data ?? []).map((engineer) => {
        const detail = [engineer.department, engineer.position].filter(Boolean).join(" / ");
        return {
          label: detail ? `${engineer.name ?? ""} (${engineer.engineerId}) - ${detail}` : `${engineer.name ?? ""} (${engineer.engineerId})`,
          value: engineer.engineerId,
        };
      }),
    [engineerProfilesQuery.data],
  );

  const engineerNameById = useMemo(() => new Map(engineerOptions.map((option) => [String(option.value), option.label])), [engineerOptions]);

  const categoryOptions = useMemo<CodeOption[]>(() => toSelectOptions(categoryReferences.options), [categoryReferences.options]);
  const categoryLabelByCode = categoryReferences.labelByValue;
  const participationFieldPositionOptions = useMemo<CodeOption[]>(
    () => toSelectOptions(participationFieldPositionReferences.options),
    [participationFieldPositionReferences.options],
  );
  const participationFieldPositionLabelByCode = participationFieldPositionReferences.labelByValue;
  const jobFieldLabelByCode = jobFieldReferences.labelByValue;
  const specialtyFieldLabelByCode = specialtyFieldReferences.labelByValue;
  const participationGradeOptions = useMemo<CodeOption[]>(
    () => toNumericLevel2SelectOptions(participationGradeReferences.options),
    [participationGradeReferences.options],
  );
  const participationGradeLabelByCode = participationGradeReferences.labelByValue;

  const engineerCandidateById = useMemo(
    () => new Map((engineerProfilesQuery.data ?? []).map((engineer) => [engineer.engineerId, engineer])),
    [engineerProfilesQuery.data],
  );

  const participationFieldPositionOrder = useMemo(
    () => new Map(participationFieldPositionOptions.map((option, index) => [String(option.value), index])),
    [participationFieldPositionOptions],
  );

  const yesNoOptions = useMemo<CodeOption[]>(() => [{ label: "Y", value: "Y" }, { label: "N", value: "N" }], []);

  const rows = useMemo(
    () => [...newRows, ...(engineersQuery.data ?? [])].sort((left, right) => {
      const leftOrder = participationFieldPositionOrder.get(text(left.participationFieldPosition)) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = participationFieldPositionOrder.get(text(right.participationFieldPosition)) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.id - right.id;
    }),
    [engineersQuery.data, newRows, participationFieldPositionOrder],
  );

  const invalidateEngineers = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["company-performance-engineers", record.seq] }),
    [queryClient, record.seq],
  );

  const saveMutation = useMutation({
    mutationFn: async (row: CompanyPerformanceEngineerRecord) => {
      if (!record.seq) {
        throw new Error("회사 실적 저장 후 참여기술인를 등록할 수 있습니다.");
      }
      if (row.isNew && !canCreate) {
        throw new Error("참여기술인를 등록할 권한이 없습니다.");
      }
      if (!row.isNew && !canUpdate) {
        throw new Error("참여기술인를 수정할 권한이 없습니다.");
      }
      if (!text(row.engineerId)) {
        throw new Error("성명은 필수입니다.");
      }
      const requestBody = toEngineerRequest(row);
      return row.isNew ? createCompanyPerformanceEngineer(record.seq, requestBody) : updateCompanyPerformanceEngineer(record.seq, row.id, requestBody);
    },
    onSuccess: (_saved, row) => {
      setNewRows((current) => current.filter((item) => item.id !== row.id));
      void invalidateEngineers();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      if (!record.seq) {
        throw new Error("회사 실적 저장 후 참여기술인를 삭제할 수 있습니다.");
      }
      if (!canDelete) {
        throw new Error("참여기술인를 삭제할 권한이 없습니다.");
      }
      return deleteCompanyPerformanceEngineer(record.seq, id);
    },
    onSuccess: () => {
      void invalidateEngineers();
    },
  });

  const confirmProcessRowUpdate = useCallback(
    (row: CompanyPerformanceEngineerRecord): Omit<EnterpriseRowActionConfirm, "onConfirm"> | null => {
      if (row.isNew && !text(row.name)) {
        return null;
      }

      return {
        confirmColor: "primary",
        confirmLabel: row.isNew ? "등록" : "수정",
        message: row.isNew ? "참여기술인를 등록하시겠습니까?" : "참여기술인 정보를 수정하시겠습니까?",
        targetLabel: displayTarget(row.name, row.isNew ? "신규 참여기술인" : String(row.id)),
        title: row.isNew ? "참여기술인 등록" : "참여기술인 수정",
      };
    },
    [],
  );

  const confirmDeleteRow = useCallback(
    (row: CompanyPerformanceEngineerRecord) => {
      requestConfirmation({
        confirmColor: "error",
        confirmLabel: "삭제",
        message: "참여기술인를 삭제하시겠습니까?",
        targetLabel: displayTarget(row.name, String(row.id)),
        title: "참여기술인 삭제",
        onConfirm: () => deleteMutation.mutateAsync(row.id),
      });
    },
    [deleteMutation, requestConfirmation],
  );

  const addRow = () => {
    const id = tempId();
    const newRow: CompanyPerformanceEngineerRecord = {
      actualParticipationYn: "Y",
      category: "",
      companyAtParticipation: "(주)제일엔지니어링종합건축사사무소",
      departmentAtParticipation: "",
      duty: "",
      engineerId: "",
      id,
      isNew: true,
      jobField: "",
      name: "",
      participationEndDate: toDateValue(record.contractToDate),
      participationFieldPosition: "",
      participationGrade: null,
      participationStartDate: toDateValue(record.contractFromDate),
      positionAtParticipation: "",
      remark: "",
      reportYn: "Y",
      specialtyField: "",
    };
    setNewRows((current) => [newRow, ...current]);
    setRowModesModel((current) => ({ ...current, [id]: { mode: GridRowModes.Edit, fieldToFocus: "engineerId" } }));
  };

  const applyEngineerMasterValues = useCallback(
    (params: GridRenderEditCellParams<CompanyPerformanceEngineerRecord>, engineerId: string) => {
      const engineer = engineerCandidateById.get(engineerId);
      if (!engineer) {
        return;
      }

      const values: Partial<CompanyPerformanceEngineerRecord> = {
        departmentAtParticipation: engineer.department,
        jobField: formatReferenceLabel(jobFieldLabelByCode, engineer.dutyPart) || engineer.dutyPart,
        name: engineer.name,
        participationGrade: resolveParticipationGradeValue(engineer.designGrade, participationGradeOptions),
        positionAtParticipation: engineer.position,
        specialtyField: formatReferenceLabel(specialtyFieldLabelByCode, engineer.proPart) || engineer.proPart,
      };

      void Promise.all(
        Object.entries(values).map(([field, value]) =>
          params.api.setEditCellValue({ id: params.id, field, value: value ?? "" }),
        ),
      );
    },
    [engineerCandidateById, jobFieldLabelByCode, participationGradeOptions, specialtyFieldLabelByCode],
  );

  const handleRowEditStop: NonNullable<DataGridProps<CompanyPerformanceEngineerRecord>["onRowEditStop"]> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
      return;
    }

    if (params.reason === GridRowEditStopReasons.escapeKeyDown) {
      setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
      setNewRows((current) => current.filter((row) => row.id !== params.id));
    }
  };

  const handleNewRowEditCancel = (
    row: CompanyPerformanceEngineerRecord,
    params: { reason?: GridRowEditStopReasons },
  ) => {
    if (params.reason !== GridRowEditStopReasons.rowFocusOut || !row.isNew) {
      return;
    }

    if (text(row.name)) {
      return false;
    }

    setRowModesModel((current) => {
      const next = { ...current };
      delete next[String(row.id)];
      return next;
    });
    setNewRows((current) => current.filter((item) => item.id !== row.id));
    return true;
  };

  const columns = useMemo<GridColDef<CompanyPerformanceEngineerRecord>[]>(
    () => [
      {
        field: "engineerId",
        headerName: "성명",
        width: 190,
        editable: true,
        // 화면에는 기술인명을 표시하지만 실제 값은 engineerId이므로,
        // 기본 그리드 필터가 성명으로도 검색할 수 있도록 필터용 값을 명시한다.
        valueGetter: (_value, row) => [text(row.name), text(row.engineerId)].filter(Boolean).join(" "),
        renderCell: (params) => engineerNameById.get(text(params.row.engineerId)) ?? displayBlank(params.row.name),
        renderEditCell: (params) => (
          <EngineerAutocompleteEditCell
            loading={engineerProfilesQuery.isFetching}
            onSearch={setEngineerKeyword}
            onSelectEngineer={(engineerId) => applyEngineerMasterValues(params, engineerId)}
            options={engineerOptions}
            params={params}
          />
        ),
      },
      {
        field: "participationStartDate",
        headerName: "참여시작",
        width: 115,
        editable: true,
        renderEditCell: (params) => <YmdEditCell {...params} />,
        valueGetter: (_value, row) => formatEngineerDate(row.participationStartDate),
      },
      {
        field: "participationEndDate",
        headerName: "참여종료",
        width: 115,
        editable: true,
        renderEditCell: (params) => <YmdEditCell {...params} />,
        valueGetter: (_value, row) => formatEngineerDate(row.participationEndDate),
      },
      {
        field: "category",
        headerName: "구분",
        width: 90,
        editable: true,
        type: "singleSelect",
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        renderCell: (params) => formatReferenceLabel(categoryLabelByCode, params.row.category) || displayBlank(params.row.category),
        valueGetter: (_value, row) => displayBlank(row.category),
        valueOptions: categoryOptions,
      },
      {
        field: "participationFieldPosition",
        headerName: "참여분야직위",
        width: 140,
        editable: true,
        type: "singleSelect",
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        renderCell: (params) =>
          formatReferenceLabel(participationFieldPositionLabelByCode, params.row.participationFieldPosition) ||
          displayBlank(params.row.participationFieldPosition),
        valueOptions: participationFieldPositionOptions,
      },
      {
        field: "actualParticipationYn",
        headerName: "실제참여",
        width: 90,
        align: "center",
        editable: true,
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        headerAlign: "center",
        type: "singleSelect",
        valueOptions: yesNoOptions,
      },
      {
        field: "reportYn",
        headerName: "신고",
        width: 80,
        align: "center",
        editable: true,
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        headerAlign: "center",
        type: "singleSelect",
        valueOptions: yesNoOptions,
      },
      {
        field: "participationGrade",
        headerName: "참여등급",
        width: 100,
        align: "center",
        editable: true,
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        headerAlign: "center",
        renderCell: (params) => formatPaddedLevel2CodeLabel(participationGradeLabelByCode, params.row.participationGrade) || displayBlank(params.row.participationGrade),
        type: "singleSelect",
        valueGetter: (_value, row) => row.participationGrade ?? "",
        valueOptions: participationGradeOptions,
      },
      { field: "companyAtParticipation", headerName: "참여당시회사", width: 150, editable: true, valueGetter: (_value, row) => displayBlank(row.companyAtParticipation) },
      { field: "departmentAtParticipation", headerName: "참여당시 부서", width: 130, editable: true, valueGetter: (_value, row) => displayBlank(row.departmentAtParticipation) },
      { field: "positionAtParticipation", headerName: "참여당시 직위", width: 120, editable: true, valueGetter: (_value, row) => displayBlank(row.positionAtParticipation) },
      { field: "duty", headerName: "담당업무", width: 130, editable: true, valueGetter: (_value, row) => displayBlank(row.duty) },
      {
        field: "jobField",
        headerName: "직무분야",
        width: 130,
        editable: true,
        renderCell: (params) => formatReferenceLabel(jobFieldLabelByCode, params.row.jobField) || displayBlank(params.row.jobField),
        valueGetter: (_value, row) => displayBlank(row.jobField),
      },
      {
        field: "specialtyField",
        headerName: "전문분야",
        width: 130,
        editable: true,
        renderCell: (params) => formatReferenceLabel(specialtyFieldLabelByCode, params.row.specialtyField) || displayBlank(params.row.specialtyField),
        valueGetter: (_value, row) => displayBlank(row.specialtyField),
      },
      { field: "remark", headerName: "비고", minWidth: 180, flex: 1, editable: true, valueGetter: (_value, row) => displayBlank(row.remark) },
      {
        field: "actions",
        type: "actions",
        headerName: "관리",
        width: 96,
        getActions: (params) => {
          const rowIsEditing = rowModesModel[params.id]?.mode === GridRowModes.Edit;
          if (rowIsEditing) {
            return [
              <GridActionsCellItem
                color="primary"
                disabled={params.row.isNew ? !canCreate : !canUpdate}
                icon={<SaveOutlinedIcon />}
                key="save"
                label="저장"
                onClick={() => setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View } }))}
              />,
              <GridActionsCellItem
                color="inherit"
                icon={<CancelOutlinedIcon />}
                key="cancel"
                label="취소"
                onClick={() => {
                  setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
                  if (params.row.isNew) {
                    setNewRows((current) => current.filter((row) => row.id !== params.row.id));
                  }
                }}
              />,
            ];
          }

          return [
            <GridActionsCellItem
              color="inherit"
              disabled={!canUpdate}
              icon={<EditOutlinedIcon />}
              key="edit"
              label="수정"
              onClick={() => setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.Edit } }))}
            />,
            <GridActionsCellItem
              color="inherit"
              disabled={!canDelete || deleteMutation.isPending || params.row.isNew}
              icon={<DeleteOutlineOutlinedIcon />}
              key="delete"
              label="삭제"
              onClick={() => confirmDeleteRow(params.row)}
            />,
          ];
        },
      },
    ],
    [
      applyEngineerMasterValues,
      canCreate,
      canDelete,
      canUpdate,
      confirmDeleteRow,
      deleteMutation.isPending,
      engineerNameById,
      engineerOptions,
      engineerProfilesQuery.isFetching,
      categoryOptions,
      categoryLabelByCode,
      participationFieldPositionLabelByCode,
      participationFieldPositionOptions,
      participationGradeLabelByCode,
      participationGradeOptions,
      jobFieldLabelByCode,
      specialtyFieldLabelByCode,
      rowModesModel,
      yesNoOptions,
    ],
  );

  const processRowUpdate = async (
    updatedRow: CompanyPerformanceEngineerRecord,
    originalRow: CompanyPerformanceEngineerRecord,
  ) => {
    if (updatedRow.isNew && !text(updatedRow.name)) {
      setRowModesModel((current) => {
        const next = { ...current };
        delete next[String(updatedRow.id)];
        return next;
      });
      setNewRows((current) => current.filter((row) => row.id !== updatedRow.id));
      return originalRow;
    }

    if (readOnly) {
      return updatedRow;
    }
    const saved = await saveMutation.mutateAsync(updatedRow);
    return saved;
  };
  const gridColumns = useMemo(
    () => (readOnly ? columns.filter((column) => column.type !== "actions") : columns),
    [columns, readOnly],
  );

  return (
    <Box sx={{ p: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button disabled={readOnly || !canCreate || !record.seq || saveMutation.isPending} onClick={addRow} size="small" startIcon={<AddOutlinedIcon />} sx={{ display: readOnly ? "none" : undefined }} variant="outlined">
          추가
        </Button>
      </Box>
      <EnterpriseDataGrid<CompanyPerformanceEngineerRecord>
        columns={gridColumns}
        confirmProcessRowUpdate={readOnly ? undefined : confirmProcessRowUpdate}
        editMode={readOnly ? undefined : "row"}
        getRowId={(row) => row.id}
        isNewRow={(row) => row.isNew === true}
        hideFooterSelectedRowCount
        loading={engineersQuery.isLoading || engineersQuery.isFetching || saveMutation.isPending || deleteMutation.isPending}
        onProcessRowUpdateError={() => undefined}
        onNewRowEditCancel={readOnly ? undefined : handleNewRowEditCancel}
        onRowEditStop={readOnly ? undefined : handleRowEditStop}
        onRowModesModelChange={readOnly ? undefined : setRowModesModel}
        processRowUpdate={readOnly ? undefined : processRowUpdate}
        readOnly={readOnly}
        rowHeight={34}
        wrapperMinHeight={475}
        rowModesModel={readOnly ? undefined : rowModesModel}
        rows={rows}
        showPageNumbers
        showToolbar={false}
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
        }}
      />
    </Box>
  );
}
