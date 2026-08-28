"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  GridRowModes,
  type GridColDef,
  type GridRenderEditCellParams,
  type GridRowId,
  type GridRowParams,
  type GridRowSelectionModel,
  type GridRowModesModel,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmActionDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { FileActionCard } from "@/components/common/FileActionCard";
import { standardFieldSx } from "@/components/common/FormControls";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  useCommonCodeLevel3Options,
  useDepartmentOptions,
} from "@/modules/common/reference/useReferenceOptions";
import {
  createWorkOverlapContractEngineer,
  deleteWorkOverlapContractEngineer,
  deleteWorkOverlapContractEngineerHistory,
  deleteWorkOverlapContractPeriodHistory,
  listWorkOverlapContractEngineerCandidates,
  listWorkOverlapContractEngineerHistories,
  listWorkOverlapContractEngineers,
  listWorkOverlapContractPeriodHistories,
  updateWorkOverlapContractEngineer,
  type WorkOverlapContractEngineerCandidate,
  type WorkOverlapContractEngineerChangeRequest,
  type WorkOverlapContractEngineerHistoryRecord,
  type WorkOverlapContractEngineerRecord,
  type WorkOverlapContractEngineerRequest,
  type WorkOverlapContractPeriodHistoryRecord,
  type WorkOverlapContractRecord,
} from "@/modules/work-overlap/contracts/api";
import {
  WorkOverlapContractEngineerChangeDialog,
  type EngineerChangeDraft,
} from "@/modules/work-overlap/contracts/WorkOverlapContractEngineerChangeDialog";
import {
  defaultWorkOverlapContractRecord,
  formatDateInputValue,
  formatNumberText,
  normalizeNumberInputValue,
} from "@/modules/work-overlap/contracts/workOverlapContractForm";

type WorkOverlapContractDetailDialogProps = {
  deleting?: boolean;
  deleteDisabled?: boolean;
  onClose: () => void;
  onDelete?: (record: WorkOverlapContractRecord) => void;
  onSave: (payload: WorkOverlapContractSavePayload) => void;
  open: boolean;
  record: WorkOverlapContractRecord | null;
  saveDisabled?: boolean;
  saving?: boolean;
};

export type WorkOverlapContractSavePayload = {
  periodChangeReason: string | null;
  record: WorkOverlapContractRecord;
};

type FieldOption = {
  label: string;
  value: string;
};

const toText = (value: string | null | undefined) => value ?? "";

const isTrueValue = (value: string | null | undefined) => {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "수령";
};

const toBooleanString = (checked: boolean) => (checked ? "true" : "false");
const WORK_OVERLAP_CONTRACT_ATTACHMENT_OWNER_TYPE = "WORK_OVERLAP_CONTRACT";
const WORK_OVERLAP_CONTRACT_EVIDENCE_ATTACHMENT_TYPE = "EVIDENCE";
const PERIOD_FIELD_NAMES = [
  "constructionStartDate",
  "constructionCompleteDate",
  "managementServiceCompleteDate",
  "constructionStopFromDate",
  "constructionStopToDate",
  "restartDate",
] as const;

const getTodayYmdValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}${month}${day}`;
};

const tempId = () => -Date.now();

const normalizeDateValue = (value: string | null | undefined) =>
  toText(value).replace(/\D/g, "").slice(0, 8) || null;

const formatDisplayDate = (value: string | null | undefined) => {
  const normalized = toText(value).replace(/\D/g, "").slice(0, 8);
  if (normalized.length === 8) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  return toText(value);
};

const engineerLabel = (
  engineer: Pick<WorkOverlapContractEngineerCandidate, "engineerId" | "name">,
) => `${toText(engineer.name) || engineer.engineerId} (${engineer.engineerId})`;

const toEngineerRequest = (
  row: WorkOverlapContractEngineerRecord,
): WorkOverlapContractEngineerRequest => ({
  engineerId: toText(row.engineerId) || null,
  field: toText(row.field) || null,
  participationDate: normalizeDateValue(row.participationDate),
  participationType: toText(row.participationType) || null,
  pqTargetYn: Boolean(row.pqTargetYn),
  remark: toText(row.remark) || null,
});

const historyColumns: GridColDef<WorkOverlapContractEngineerHistoryRecord>[] = [
  {
    field: "changedAt",
    headerName: "변경일",
    width: 112,
    valueGetter: (_value, row) => formatDisplayDate(row.changedAt),
  },
  {
    field: "beforeEngineerName",
    headerName: "변경전 기술인",
    width: 124,
    valueGetter: (_value, row) => toText(row.beforeEngineerName) || "-",
  },
  {
    field: "afterEngineerName",
    headerName: "변경후 기술인",
    width: 124,
    valueGetter: (_value, row) => toText(row.afterEngineerName) || "-",
  },
  { field: "changeContent", headerName: "변경내용", flex: 1.1, minWidth: 180 },
];

const periodHistoryColumns: GridColDef<WorkOverlapContractPeriodHistoryRecord>[] = [
  {
    field: "changedAt",
    headerName: "변경일",
    width: 112,
    valueGetter: (_value, row) => formatDisplayDate(row.changedAt),
  },
  { field: "periodName", headerName: "항목", width: 132 },
  {
    field: "beforeValue",
    headerName: "변경전",
    flex: 0.95,
    minWidth: 120,
    valueGetter: (_value, row) => formatDisplayDate(row.beforeValue) || "-",
  },
  {
    field: "afterValue",
    headerName: "변경후",
    flex: 0.95,
    minWidth: 120,
    valueGetter: (_value, row) => formatDisplayDate(row.afterValue) || "-",
  },
  {
    field: "changeReason",
    headerName: "변경사유",
    flex: 1.2,
    minWidth: 180,
    valueGetter: (_value, row) => toText(row.changeReason) || "-",
  },
];

function EngineerAutocompleteEditCell({
  loading,
  onSearch,
  onSelect,
  options,
  params,
}: {
  loading: boolean;
  onSearch: (keyword: string) => void;
  onSelect: (
    rowId: GridRowId,
    engineer: WorkOverlapContractEngineerCandidate | null,
  ) => void;
  options: WorkOverlapContractEngineerCandidate[];
  params: GridRenderEditCellParams<
    WorkOverlapContractEngineerRecord,
    string | null
  >;
}) {
  const selected =
    options.find((option) => option.engineerId === toText(params.value)) ??
    (toText(params.value)
      ? {
          birthDate: params.row.birthDate,
          engineerId: toText(params.value),
          field: params.row.field,
          name: params.row.name,
        }
      : null);

  return (
    <Autocomplete
      autoHighlight
      disablePortal
      fullWidth
      getOptionLabel={engineerLabel}
      isOptionEqualToValue={(option, value) =>
        option.engineerId === value.engineerId
      }
      loading={loading}
      onChange={(event, nextValue) => {
        void params.api.setEditCellValue(
          {
            id: params.id,
            field: "engineerId",
            value: nextValue?.engineerId ?? "",
          },
          event,
        );
        void params.api.setEditCellValue(
          { id: params.id, field: "name", value: nextValue?.name ?? "" },
          event,
        );
        void params.api.setEditCellValue(
          {
            id: params.id,
            field: "birthDate",
            value: nextValue?.birthDate ?? "",
          },
          event,
        );
        void params.api.setEditCellValue(
          { id: params.id, field: "field", value: nextValue?.field ?? "" },
          event,
        );
        onSelect(params.id, nextValue);
      }}
      onInputChange={(_event, nextInputValue, reason) => {
        if (reason === "input") {
          onSearch(nextInputValue);
        }
      }}
      options={options}
      renderInput={(inputParams) => (
        <TextField
          {...inputParams}
          autoFocus
          size="small"
          sx={standardFieldSx}
        />
      )}
      value={selected}
    />
  );
}

function YmdEditCell(
  params: GridRenderEditCellParams<
    WorkOverlapContractEngineerRecord,
    string | null
  >,
) {
  return (
    <TextField
      autoFocus
      fullWidth
      onChange={(event) => {
        void params.api.setEditCellValue(
          {
            id: params.id,
            field: params.field,
            value: event.target.value.replace(/\D/g, "").slice(0, 8),
          },
          event,
        );
      }}
      placeholder="YYYYMMDD"
      size="small"
      slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
      sx={standardFieldSx}
      value={toText(params.value).replace(/\D/g, "").slice(0, 8)}
    />
  );
}

function CheckboxEditCell(
  params: GridRenderEditCellParams<
    WorkOverlapContractEngineerRecord,
    boolean | null
  >,
) {
  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        height: "100%",
        justifyContent: "center",
      }}
    >
      <Checkbox
        checked={Boolean(params.value)}
        onChange={(event) => {
          void params.api.setEditCellValue(
            { id: params.id, field: params.field, value: event.target.checked },
            event,
          );
        }}
        size="small"
      />
    </Box>
  );
}

function FieldAutocompleteEditCell({
  options,
  params,
}: {
  options: FieldOption[];
  params: GridRenderEditCellParams<
    WorkOverlapContractEngineerRecord,
    string | null
  >;
}) {
  const selected =
    options.find((option) => option.value === toText(params.value)) ??
    (toText(params.value)
      ? {
          label: toText(params.value),
          value: toText(params.value),
        }
      : null);

  return (
    <Autocomplete
      autoHighlight
      disablePortal
      fullWidth
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      onChange={(event, nextValue) => {
        void params.api.setEditCellValue(
          { id: params.id, field: params.field, value: nextValue?.value ?? "" },
          event,
        );
      }}
      options={options}
      renderInput={(inputParams) => (
        <TextField
          {...inputParams}
          autoFocus
          size="small"
          sx={standardFieldSx}
        />
      )}
      value={selected}
    />
  );
}

const Section = ({
  title,
  children,
  dense = false,
}: {
  children: ReactNode;
  dense?: boolean;
  title: string;
}) => (
  <Box
    sx={{
      backgroundColor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1.5,
      display: "grid",
      gap: dense ? 0.75 : 1.25,
      height: "100%",
      gridTemplateRows: "auto minmax(0, 1fr)",
      minWidth: 0,
      overflow: "hidden",
      p: dense ? 1 : 1.5,
    }}
  >
    <Box
      sx={{
        alignItems: "center",
        borderLeft: "4px solid",
        borderColor: "primary.main",
        display: "flex",
        height: dense ? 24 : 28,
        minHeight: dense ? 24 : 28,
        pl: 1,
      }}
    >
      <Typography
        sx={{ color: "text.primary", fontSize: 13, fontWeight: 800 }}
        variant="subtitle2"
      >
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

const SubHeader = ({
  action,
  title,
  tooltip,
}: {
  action?: ReactNode;
  title: string;
  tooltip?: string;
}) => (
  <Box
    sx={{
      alignItems: "center",
      display: "flex",
      justifyContent: "space-between",
      gap: 1,
      minWidth: 0,
    }}
  >
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.5, minWidth: 0 }}>
      <Typography
        sx={{ fontSize: 13, fontWeight: 800, minWidth: 0 }}
        variant="subtitle2"
      >
        {title}
      </Typography>
      {tooltip ? (
        <Tooltip arrow title={tooltip}>
          <IconButton
            aria-label={`${title} 안내`}
            size="small"
            sx={{ color: "text.secondary", flexShrink: 0, p: 0.25 }}
          >
            <HelpOutlineOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
    <Box sx={{ flexShrink: 0 }}>{action}</Box>
  </Box>
);

const DetailRow = ({
  alignItems = "stretch",
  left,
  right,
}: {
  alignItems?: "start" | "stretch";
  left: ReactNode;
  right: ReactNode;
}) => (
  <Box
    sx={{
      alignItems,
      display: "grid",
      gap: 2.25,
      gridTemplateColumns: {
        xs: "1fr",
        lg: "minmax(0, 1fr) minmax(380px, 0.84fr)",
      },
    }}
  >
    <Box sx={{ display: "grid", minWidth: 0 }}>{left}</Box>
    <Box sx={{ display: "grid", minWidth: 0 }}>{right}</Box>
  </Box>
);

export function WorkOverlapContractDetailDialog({
  deleting = false,
  deleteDisabled = false,
  onClose,
  onDelete,
  onSave,
  open,
  record,
  saveDisabled = false,
  saving = false,
}: WorkOverlapContractDetailDialogProps) {
  const queryClient = useQueryClient();
  const { showError } = useAppSnackbar();
  const { canCreate, canDelete, canRead, canUpdate } =
    useCurrentMenuPermission();
  const { isLoading: departmentsLoading, options: departmentOptions } =
    useDepartmentOptions({ useYn: true }, { enabled: open && canRead });
  const [draft, setDraft] = useState<WorkOverlapContractRecord>(
    () => record ?? defaultWorkOverlapContractRecord(),
  );
  const [newRows, setNewRows] = useState<WorkOverlapContractEngineerRecord[]>(
    [],
  );
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });
  const [engineerKeyword, setEngineerKeyword] = useState("");
  const [debouncedEngineerKeyword, setDebouncedEngineerKeyword] = useState("");
  const [changeTarget, setChangeTarget] =
    useState<WorkOverlapContractEngineerRecord | null>(null);
  const [changeDraft, setChangeDraft] = useState<EngineerChangeDraft | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<WorkOverlapContractEngineerRecord | null>(null);
  const [historySelectionModel, setHistorySelectionModel] =
    useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });
  const [historyDeleteTarget, setHistoryDeleteTarget] =
    useState<WorkOverlapContractEngineerHistoryRecord | null>(null);
  const [periodHistorySelectionModel, setPeriodHistorySelectionModel] =
    useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });
  const [periodHistoryDeleteTarget, setPeriodHistoryDeleteTarget] =
    useState<WorkOverlapContractPeriodHistoryRecord | null>(null);
  const [periodChangeReason, setPeriodChangeReason] = useState("");
  const isEdit = Boolean(draft.contractNo);
  const contractNo = draft.contractNo;
  const selectedDepartment = useMemo(
    () =>
      departmentOptions.find(
        (option) => option.value === draft.supervisingDepartmentCode,
      ) ?? null,
    [departmentOptions, draft.supervisingDepartmentCode],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedEngineerKeyword(engineerKeyword.trim()),
      250,
    );
    return () => window.clearTimeout(timeoutId);
  }, [engineerKeyword]);

  const engineersQuery = useQuery({
    queryKey: ["work-overlap-contract-engineers", contractNo],
    queryFn: () => listWorkOverlapContractEngineers(contractNo),
    enabled: open && canRead && Boolean(contractNo),
  });

  const historiesQuery = useQuery({
    queryKey: ["work-overlap-contract-engineer-histories", contractNo],
    queryFn: () => listWorkOverlapContractEngineerHistories(contractNo),
    enabled: open && canRead && Boolean(contractNo),
  });

  const periodHistoriesQuery = useQuery({
    queryKey: ["work-overlap-contract-period-histories", contractNo],
    queryFn: () => listWorkOverlapContractPeriodHistories(contractNo),
    enabled: open && canRead && Boolean(contractNo),
  });

  const engineerCandidatesQuery = useQuery({
    queryKey: [
      "work-overlap-contract-engineer-candidates",
      debouncedEngineerKeyword,
    ],
    queryFn: () =>
      listWorkOverlapContractEngineerCandidates({
        keyword: debouncedEngineerKeyword,
        limit: 30,
      }),
    enabled: open && canRead && debouncedEngineerKeyword.length > 0,
  });

  const engineerCandidates = useMemo(() => {
    const candidateMap = new Map<
      string,
      WorkOverlapContractEngineerCandidate
    >();
    (engineerCandidatesQuery.data ?? []).forEach((engineer) => {
      if (engineer.engineerId && !candidateMap.has(engineer.engineerId)) {
        candidateMap.set(engineer.engineerId, engineer);
      }
    });
    return [...candidateMap.values()];
  }, [engineerCandidatesQuery.data]);
  const engineerRows = useMemo(() => {
    const rowMap = new Map<string, WorkOverlapContractEngineerRecord>();
    [...newRows, ...(engineersQuery.data ?? [])].forEach((row) => {
      const rowId = row.isNew
        ? `new-${row.tempRowId ?? ""}`
        : toText(row.engineerId);
      if (rowId && !rowMap.has(rowId)) {
        rowMap.set(rowId, row);
      }
    });
    return [...rowMap.values()];
  }, [engineersQuery.data, newRows]);
  const historyRows = useMemo(
    () => historiesQuery.data ?? [],
    [historiesQuery.data],
  );
  const periodHistoryRows = useMemo(
    () => periodHistoriesQuery.data ?? [],
    [periodHistoriesQuery.data],
  );
  const selectedHistory = useMemo(() => {
    const selectedIds = historySelectionModel.ids;
    return (
      historyRows.find((row) => {
        return historySelectionModel.type === "include"
          ? selectedIds.has(row.id)
          : !selectedIds.has(row.id);
      }) ?? null
    );
  }, [historyRows, historySelectionModel]);
  const selectedPeriodHistory = useMemo(() => {
    const selectedIds = periodHistorySelectionModel.ids;
    return (
      periodHistoryRows.find((row) => {
        return periodHistorySelectionModel.type === "include"
          ? selectedIds.has(row.id)
          : !selectedIds.has(row.id);
      }) ?? null
    );
  }, [periodHistoryRows, periodHistorySelectionModel]);
  const selectedEngineer = useMemo(() => {
    const selectedIds = rowSelectionModel.ids;
    return (
      engineerRows.find((row) => {
        const rowId = row.isNew ? row.tempRowId : toText(row.engineerId);
        return rowSelectionModel.type === "include"
          ? selectedIds.has(rowId ?? "")
          : !selectedIds.has(rowId ?? "");
      }) ?? null
    );
  }, [engineerRows, rowSelectionModel]);
  const hasPeriodChanges = useMemo(() => {
    if (!isEdit || !record) {
      return false;
    }

    return PERIOD_FIELD_NAMES.some((field) => {
      return normalizeDateValue(record[field]) !== normalizeDateValue(draft[field]);
    });
  }, [draft, isEdit, record]);

  useEffect(() => {
    if (!hasPeriodChanges) {
      startTransition(() => setPeriodChangeReason(""));
    }
  }, [hasPeriodChanges]);

  const updateField = <Key extends keyof WorkOverlapContractRecord>(
    field: Key,
    value: WorkOverlapContractRecord[Key],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const invalidateEngineerData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["work-overlap-contract-engineers", contractNo],
      }),
      queryClient.invalidateQueries({
        queryKey: ["work-overlap-contract-engineer-histories", contractNo],
      }),
    ]);
  }, [contractNo, queryClient]);

  const createEngineerMutation = useMutation({
    mutationFn: (row: WorkOverlapContractEngineerRecord) => {
      if (!contractNo) {
        throw new Error(
          "업무중복도 계약 저장 후 참여기술인을 등록할 수 있습니다.",
        );
      }
      if (!toText(row.engineerId)) {
        throw new Error("이름은 필수입니다.");
      }
      return createWorkOverlapContractEngineer(
        contractNo,
        toEngineerRequest(row),
      );
    },
    onSuccess: (_saved, row) => {
      setNewRows((current) =>
        current.filter((item) => item.tempRowId !== row.tempRowId),
      );
      void invalidateEngineerData();
    },
  });

  const updateEngineerMutation = useMutation({
    mutationFn: (requestBody: WorkOverlapContractEngineerChangeRequest) => {
      if (!contractNo || !changeTarget) {
        throw new Error("수정할 참여기술인을 선택해 주세요.");
      }
      const targetEngineerId = toText(changeTarget.engineerId);
      if (!targetEngineerId) {
        throw new Error("수정할 참여기술인을 선택해 주세요.");
      }
      return updateWorkOverlapContractEngineer(
        contractNo,
        targetEngineerId,
        requestBody,
      );
    },
    onSuccess: () => {
      setChangeTarget(null);
      setChangeDraft(null);
      void invalidateEngineerData();
    },
  });

  const deleteEngineerMutation = useMutation({
    mutationFn: (target: WorkOverlapContractEngineerRecord) => {
      if (!contractNo) {
        throw new Error(
          "업무중복도 계약 저장 후 참여기술인을 삭제할 수 있습니다.",
        );
      }
      return deleteWorkOverlapContractEngineer(
        contractNo,
        toText(target.engineerId),
      );
    },
    onSuccess: () => {
      setDeleteTarget(null);
      setRowSelectionModel({ ids: new Set(), type: "include" });
      void invalidateEngineerData();
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: (target: WorkOverlapContractEngineerHistoryRecord) => {
      if (!contractNo) {
        throw new Error(
          "업무중복도 계약 저장 후 변경이력을 삭제할 수 있습니다.",
        );
      }
      return deleteWorkOverlapContractEngineerHistory(contractNo, target.id);
    },
    onSuccess: () => {
      setHistoryDeleteTarget(null);
      setHistorySelectionModel({ ids: new Set(), type: "include" });
      void invalidateEngineerData();
    },
  });

  const deletePeriodHistoryMutation = useMutation({
    mutationFn: (target: WorkOverlapContractPeriodHistoryRecord) => {
      if (!contractNo) {
        throw new Error(
          "업무중복도 계약 저장 후 기간정보 변경이력을 삭제할 수 있습니다.",
        );
      }
      return deleteWorkOverlapContractPeriodHistory(contractNo, target.id);
    },
    onSuccess: () => {
      setPeriodHistoryDeleteTarget(null);
      setPeriodHistorySelectionModel({ ids: new Set(), type: "include" });
      void queryClient.invalidateQueries({
        queryKey: ["work-overlap-contract-period-histories", contractNo],
      });
    },
  });

  const handleAddEngineer = () => {
    if (!contractNo) {
      return;
    }
    const id = tempId();
    const newRow: WorkOverlapContractEngineerRecord = {
      birthDate: "",
      engineerId: "",
      field: "",
      isNew: true,
      name: "",
      participationDate:
        normalizeDateValue(draft.constructionStartDate) ?? getTodayYmdValue(),
      participationType: "",
      pqTargetYn: false,
      remark: "",
      tempRowId: id,
    };
    setNewRows((current) => [newRow, ...current]);
    setRowSelectionModel({ ids: new Set([id]), type: "include" });
    setRowModesModel((current) => ({
      ...current,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "engineerId" },
    }));
  };

  const handleNewEngineerRowEditCancel = (
    row: WorkOverlapContractEngineerRecord,
  ) => {
    const rowId = row.tempRowId ?? toText(row.engineerId);
    setRowModesModel((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
    setNewRows((current) =>
      current.filter((newRow) => newRow.tempRowId !== row.tempRowId),
    );
    setRowSelectionModel({ ids: new Set(), type: "include" });
  };

  const processEngineerRowUpdate = async (
    updatedRow: WorkOverlapContractEngineerRecord,
  ) => {
    if (!updatedRow.isNew) {
      return updatedRow;
    }
    return createEngineerMutation.mutateAsync(updatedRow);
  };

  const handleEngineerSelect = useCallback(
    (
      rowId: GridRowId,
      engineer: WorkOverlapContractEngineerCandidate | null,
    ) => {
      setNewRows((current) =>
        current.map((row) =>
          row.tempRowId === rowId
            ? {
                ...row,
                birthDate: engineer?.birthDate ?? "",
                engineerId: engineer?.engineerId ?? "",
                field: engineer?.field ?? "",
                name: engineer?.name ?? "",
              }
            : row,
        ),
      );
    },
    [],
  );

  const handleDeleteHistoryClick = () => {
    if (!selectedHistory) {
      return;
    }
    setHistoryDeleteTarget(selectedHistory);
  };

  const openChangeDialog = (targetEngineer = selectedEngineer) => {
    if (!targetEngineer || targetEngineer.isNew) {
      return;
    }
    const beforeEngineer = {
      birthDate: targetEngineer.birthDate,
      engineerId: toText(targetEngineer.engineerId),
      field: targetEngineer.field,
      name: targetEngineer.name,
    };
    setEngineerKeyword(toText(targetEngineer.name));
    setChangeTarget(targetEngineer);
    setChangeDraft({
      afterEngineer: beforeEngineer,
      beforeEngineer,
      changeContent: "",
      participationDate: formatDisplayDate(targetEngineer.participationDate),
      participationType: toText(targetEngineer.participationType),
      pqTargetYn: Boolean(targetEngineer.pqTargetYn),
      remark: toText(targetEngineer.remark),
    });
  };

  const submitChangeDialog = () => {
    if (
      !changeDraft?.beforeEngineer ||
      !changeDraft.afterEngineer ||
      !changeDraft.changeContent.trim()
    ) {
      return;
    }
    updateEngineerMutation.mutate({
      afterEngineerId: changeDraft.afterEngineer.engineerId,
      beforeEngineerId: changeDraft.beforeEngineer.engineerId,
      changeContent: changeDraft.changeContent.trim(),
      field: toText(changeDraft.afterEngineer.field) || null,
      participationDate: normalizeDateValue(changeDraft.participationDate),
      participationType: toText(changeDraft.participationType) || null,
      pqTargetYn: Boolean(changeDraft.pqTargetYn),
      remark: toText(changeDraft.remark) || null,
    });
  };

  const jobFieldReferences = useCommonCodeLevel3Options(
    "PQ",
    "QA",
    { useYn: "Y" },
    { enabled: open && canRead },
  );
  const specialtyFieldReferences = useCommonCodeLevel3Options(
    "PQ",
    "PA",
    { useYn: "Y" },
    { enabled: open && canRead },
  );
  const fieldLabelByCode = useMemo(
    () => ({
      ...jobFieldReferences.labelByValue,
      ...specialtyFieldReferences.labelByValue,
    }),
    [jobFieldReferences.labelByValue, specialtyFieldReferences.labelByValue],
  );
  const fieldOptions = useMemo<FieldOption[]>(() => {
    const optionMap = new Map<string, FieldOption>();
    [
      ...jobFieldReferences.options,
      ...specialtyFieldReferences.options,
    ].forEach((option) => {
      if (!optionMap.has(option.value)) {
        optionMap.set(option.value, {
          label: option.label,
          value: option.value,
        });
      }
    });
    return [...optionMap.values()];
  }, [jobFieldReferences.options, specialtyFieldReferences.options]);
  const formatFieldLabel = useCallback(
    (value: string | null | undefined) => {
      const code = toText(value).trim();
      return fieldLabelByCode[code] ?? code;
    },
    [fieldLabelByCode],
  );

  const engineerColumns = useMemo<
    GridColDef<WorkOverlapContractEngineerRecord>[]
  >(
    () => [
      {
        field: "engineerId",
        headerName: "이름",
        editable: true,
        flex: 0.65,
        minWidth: 96,
        valueGetter: (_value, row) =>
          toText(row.name) || toText(row.engineerId),
        renderCell: (params) =>
          toText(params.row.name) || toText(params.row.engineerId),
        renderEditCell: (params) => (
          <EngineerAutocompleteEditCell
            loading={engineerCandidatesQuery.isFetching}
            onSearch={setEngineerKeyword}
            onSelect={handleEngineerSelect}
            options={engineerCandidates}
            params={params}
          />
        ),
      },
      {
        field: "birthDate",
        headerName: "생년월일",
        width: 104,
        valueGetter: (_value, row) => formatDisplayDate(row.birthDate),
      },
      {
        field: "participationDate",
        headerName: "참여날짜",
        editable: true,
        renderEditCell: (params) => <YmdEditCell {...params} />,
        width: 110,
        valueGetter: (_value, row) => formatDisplayDate(row.participationDate),
      },
      {
        field: "field",
        headerName: "분야",
        editable: true,
        flex: 0.8,
        minWidth: 100,
        valueGetter: (_value, row) => formatFieldLabel(row.field),
        renderCell: (params) => formatFieldLabel(params.row.field),
        renderEditCell: (params) => (
          <FieldAutocompleteEditCell options={fieldOptions} params={params} />
        ),
      },
      {
        field: "participationType",
        headerName: "참여구분",
        editable: true,
        width: 112,
      },
      {
        field: "pqTargetYn",
        headerName: "PQ대상자",
        editable: true,
        width: 92,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              height: "100%",
              justifyContent: "center",
            }}
          >
            <Checkbox
              checked={Boolean(params.value)}
              disabled
              size="small"
              sx={{ p: 0 }}
            />
          </Box>
        ),
        renderEditCell: (params) => <CheckboxEditCell {...params} />,
      },
      {
        field: "remark",
        headerName: "비고",
        editable: true,
        flex: 1.6,
        minWidth: 180,
      },
    ],
    [
      engineerCandidates,
      engineerCandidatesQuery.isFetching,
      fieldOptions,
      formatFieldLabel,
      handleEngineerSelect,
    ],
  );

  const changeEngineerOptions = useMemo(() => {
    const optionMap = new Map(
      engineerCandidates.map((engineer) => [engineer.engineerId, engineer]),
    );
    [changeDraft?.beforeEngineer, changeDraft?.afterEngineer].forEach(
      (engineer) => {
        if (engineer?.engineerId) {
          optionMap.set(engineer.engineerId, engineer);
        }
      },
    );
    return [...optionMap.values()];
  }, [
    changeDraft?.afterEngineer,
    changeDraft?.beforeEngineer,
    engineerCandidates,
  ]);
  const changeSubmitDisabled =
    !canUpdate ||
    updateEngineerMutation.isPending ||
    !changeDraft?.beforeEngineer ||
    !changeDraft.afterEngineer ||
    !changeDraft.changeContent.trim();

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 24px)",
            maxHeight: "calc(100vh - 24px)",
            width: { xs: "100%", lg: "min(1740px, calc(100vw - 24px))" },
            maxWidth: "none",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <Typography component="div" sx={{ fontWeight: 800 }} variant="h6">
          업무중복도 계약 {isEdit ? "수정" : "입력"}
        </Typography>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}
      >
        {!canRead ? (
          <Alert severity="warning">
            업무중복도 계약 상세를 조회할 권한이 없습니다.
          </Alert>
        ) : (
          <Stack spacing={2.25} sx={{ minHeight: 0 }}>
            <DetailRow
              alignItems="start"
              left={
                <Section title="기본 정보">
                  <Box sx={{ display: "grid", gap: 1.25 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.25,
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "220px minmax(0, 1fr)",
                        },
                      }}
                    >
                      <TextField
                        disabled
                        label="계약번호"
                        size="small"
                        sx={standardFieldSx}
                        value={draft.contractNo}
                      />
                      <TextField
                        label="업역명"
                        onChange={(event) =>
                          updateField("serviceName", event.target.value)
                        }
                        required
                        size="small"
                        sx={standardFieldSx}
                        value={draft.serviceName}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.25,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                      }}
                    >
                      <TextField
                        label="업역구분"
                        onChange={(event) =>
                          updateField("serviceType", event.target.value || null)
                        }
                        size="small"
                        sx={standardFieldSx}
                        value={toText(draft.serviceType)}
                      />
                      <TextField
                        label="발주처"
                        onChange={(event) =>
                          updateField("clientName", event.target.value || null)
                        }
                        size="small"
                        sx={standardFieldSx}
                        value={toText(draft.clientName)}
                      />
                      <TextField
                        inputMode="numeric"
                        label="계약금액"
                        onChange={(event) =>
                          updateField(
                            "contractAmount",
                            normalizeNumberInputValue(event.target.value),
                          )
                        }
                        size="small"
                        sx={standardFieldSx}
                        type="text"
                        value={
                          draft.contractAmount === null ||
                          draft.contractAmount === undefined
                            ? ""
                            : formatNumberText(draft.contractAmount)
                        }
                      />
                      <TextField
                        inputMode="numeric"
                        label="지분금액"
                        onChange={(event) =>
                          updateField(
                            "shareAmount",
                            normalizeNumberInputValue(event.target.value),
                          )
                        }
                        size="small"
                        sx={standardFieldSx}
                        type="text"
                        value={
                          draft.shareAmount === null ||
                          draft.shareAmount === undefined
                            ? ""
                            : formatNumberText(draft.shareAmount)
                        }
                      />
                        <Autocomplete
                            loading={departmentsLoading}
                            onChange={(_, option) =>
                                updateField(
                                    "supervisingDepartmentCode",
                                    option?.value ?? null,
                                )
                            }
                            options={departmentOptions}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="주관부서"
                                    size="small"
                                    sx={standardFieldSx}
                                />
                            )}
                            value={selectedDepartment}
                            isOptionEqualToValue={(option, value) =>
                                option.value === value.value
                            }
                        />
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                minHeight: 40,
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={draft.publicContractYn}
                                        onChange={(_event, checked) =>
                                            updateField("publicContractYn", checked)
                                        }
                                        size="small"
                                    />
                                }
                                label="공개계약 여부"
                                sx={{ m: 0, width: "100%" }}
                            />
                        </Box>
                    </Box>
                  </Box>
                </Section>
              }
              right={
                <Box
                  sx={{
                    display: "grid",
                    gap: 2.25,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "minmax(240px, 0.78fr) minmax(0, 1fr)",
                    },
                    minWidth: 0,
                  }}
                >
                  <Section title="증빙 정보">
                    <Box
                      sx={{
                        alignContent: "start",
                        display: "grid",
                        gap: 1,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          minHeight: 40,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueValue(
                                draft.performanceCertification,
                              )}
                              onChange={(_event, checked) =>
                                updateField(
                                  "performanceCertification",
                                  toBooleanString(checked),
                                )
                              }
                              size="small"
                            />
                          }
                          label="실적증명"
                          sx={{ m: 0, width: "100%" }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          minHeight: 40,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueValue(
                                draft.participateListDocument,
                              )}
                              onChange={(_event, checked) =>
                                updateField(
                                  "participateListDocument",
                                  toBooleanString(checked),
                                )
                              }
                              size="small"
                            />
                          }
                          label="참여명단 문서"
                          sx={{ m: 0, width: "100%" }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gridColumn: "1 / -1",
                          minHeight: 40,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueValue(draft.cemsConfirm)}
                              onChange={(_event, checked) =>
                                updateField(
                                  "cemsConfirm",
                                  toBooleanString(checked),
                                )
                              }
                              size="small"
                            />
                          }
                          label="CEMS"
                          sx={{ m: 0, width: "100%" }}
                        />
                      </Box>
                    </Box>
                  </Section>

                  <Box
                    sx={{
                      minWidth: 0,
                      "& > .MuiBox-root > .MuiStack-root > .MuiBox-root:last-of-type":
                        { maxHeight: 132, overflowY: "auto" },
                    }}
                  >
                    <FileActionCard
                      attachmentTarget={
                        contractNo
                          ? {
                              attachmentType:
                                WORK_OVERLAP_CONTRACT_EVIDENCE_ATTACHMENT_TYPE,
                              ownerId: contractNo,
                              ownerType:
                                WORK_OVERLAP_CONTRACT_ATTACHMENT_OWNER_TYPE,
                            }
                          : undefined
                      }
                      deleteDisabled={false}
                      description={
                        contractNo
                          ? "업무중복도 계약 증빙파일을 관리합니다."
                          : "계약 저장 후 증빙파일을 업로드할 수 있습니다."
                      }
                      multiple
                      showPdfPrintButton
                      title="파일 목록"
                      uploadDisabled={!contractNo}
                      uploadLabel="파일 업로드"
                    />
                  </Box>
                </Box>
              }
            />

            <DetailRow
              left={
                <Box sx={{ display: "grid", gap: 2.25, minWidth: 0 }}>
                  <Section title="기간 정보">
                    <Box
                      sx={{
                        alignContent: "start",
                        display: "grid",
                        minHeight: 0,
                      }}
                    >
                      <Box
                        sx={{
                          alignContent: "start",
                          display: "grid",
                          columnGap: 1,
                          rowGap: 0.75,
                          gridAutoRows: "max-content",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(3, minmax(0, 1fr))",
                          },
                        }}
                      >
                        <TextField
                          label="공사시작일"
                          onChange={(event) =>
                            updateField(
                              "constructionStartDate",
                              event.target.value || null,
                            )
                          }
                          size="small"
                          sx={standardFieldSx}
                          type="date"
                          value={formatDateInputValue(
                            draft.constructionStartDate,
                          )}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                          label="공사준공일"
                          onChange={(event) =>
                            updateField(
                              "constructionCompleteDate",
                              event.target.value || null,
                            )
                          }
                          size="small"
                          sx={standardFieldSx}
                          type="date"
                          value={formatDateInputValue(
                            draft.constructionCompleteDate,
                          )}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                          label="관리용역 준공일"
                          onChange={(event) =>
                            updateField(
                              "managementServiceCompleteDate",
                              event.target.value || null,
                            )
                          }
                          size="small"
                          sx={standardFieldSx}
                          type="date"
                          value={formatDateInputValue(
                            draft.managementServiceCompleteDate,
                          )}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                          label="중지 시작일"
                          onChange={(event) =>
                            updateField(
                              "constructionStopFromDate",
                              event.target.value || null,
                          )
                          }
                          size="small"
                          sx={{ ...standardFieldSx, mt: 0.5 }}
                          type="date"
                          value={formatDateInputValue(
                            draft.constructionStopFromDate,
                          )}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                          label="중지 종료일"
                          onChange={(event) =>
                            updateField(
                              "constructionStopToDate",
                              event.target.value || null,
                          )
                          }
                          size="small"
                          sx={{ ...standardFieldSx, mt: 0.5 }}
                          type="date"
                          value={formatDateInputValue(
                            draft.constructionStopToDate,
                          )}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                          label="재개일"
                          onChange={(event) =>
                            updateField(
                              "restartDate",
                              event.target.value || null,
                          )
                          }
                          size="small"
                          sx={{ ...standardFieldSx, mt: 0.5 }}
                          type="date"
                          value={formatDateInputValue(draft.restartDate)}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Box>
                      {hasPeriodChanges ? (
                        <TextField
                          helperText="기간 정보를 수정한 경우 간략한 사유를 입력해 주세요."
                          label="변경사유"
                          multiline
                          minRows={2}
                          maxRows={2}
                          onChange={(event) => setPeriodChangeReason(event.target.value)}
                          size="small"
                          sx={{ ...standardFieldSx, mt: 1 }}
                          value={periodChangeReason}
                        />
                      ) : null}
                    </Box>
                  </Section>

                  <Section title="기타">
                    <TextField
                      label="비고"
                      multiline
                      minRows={3}
                      maxRows={3}
                      onChange={(event) =>
                        updateField("remark", event.target.value || null)
                      }
                      size="small"
                      sx={{
                        ...standardFieldSx,
                        "& .MuiInputBase-inputMultiline": {
                          overflowY: "auto",
                        },
                      }}
                      value={toText(draft.remark)}
                    />
                  </Section>
                </Box>
              }
              right={
                <Box sx={{ display: "grid", gap: 2.25, minWidth: 0 }}>
                  <Section dense title="기간 정보 변경 이력">
                    <Stack spacing={1} sx={{ minWidth: 0 }}>
                      <SubHeader
                        title="기간 정보 변경 이력"
                        action={
                          <Button
                            color="error"
                            disabled={
                              !canDelete ||
                              !contractNo ||
                              !selectedPeriodHistory ||
                              deletePeriodHistoryMutation.isPending
                            }
                            title="기간 정보 변경 이력 삭제"
                            onClick={() =>
                              selectedPeriodHistory &&
                              setPeriodHistoryDeleteTarget(selectedPeriodHistory)
                            }
                            size="small"
                            startIcon={<DeleteOutlineOutlinedIcon />}
                            sx={{ minWidth: 72 }}
                            variant="outlined"
                          >
                            삭제
                          </Button>
                        }
                      />
                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                          minHeight: 0,
                          overflow: "hidden",
                        }}
                      >
                        <EnterpriseDataGrid<WorkOverlapContractPeriodHistoryRecord>
                          columns={periodHistoryColumns}
                          getRowId={(row) => row.id}
                          checkboxSelection
                          hideFooterSelectedRowCount
                          loading={
                            periodHistoriesQuery.isLoading ||
                            periodHistoriesQuery.isFetching
                          }
                          onRowClick={(
                            params: GridRowParams<WorkOverlapContractPeriodHistoryRecord>,
                          ) => {
                            setPeriodHistorySelectionModel({
                              ids: new Set([params.row.id]),
                              type: "include",
                            });
                          }}
                          onRowSelectionModelChange={setPeriodHistorySelectionModel}
                          readOnly
                          rowHeight={30}
                          rowSelectionModel={periodHistorySelectionModel}
                          rows={periodHistoryRows}
                          showPageNumbers
                          showToolbar={false}
                          wrapperMinHeight={255}
                          sx={{
                            border: 0,
                            flex: 1,
                            height: 255,
                            maxWidth: "100%",
                            minHeight: 255,
                            width: "100%",
                            "& .MuiDataGrid-footerContainer": {
                              minHeight: 32,
                              py: 0.25,
                            },
                            "& .MuiDataGrid-columnHeaders": {
                              bgcolor: "rgba(15, 23, 42, 0.02)",
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </Section>
                </Box>
              }
            />
            <DetailRow
              left={
                <Section title="참여 기술인">
                  <Stack spacing={1.5} sx={{ minWidth: 0 }}>
                      <SubHeader
                        title="참여 기술인"
                        action={
                        <Box
                          sx={{
                            display: "flex",
                            flexShrink: 0,
                            flexWrap: "nowrap",
                            gap: 0.75,
                          }}
                          title="참여 기술인 관리"
                        >
                          <Button
                            disabled={
                              saveDisabled ||
                              !canCreate ||
                              !contractNo ||
                              createEngineerMutation.isPending
                            }
                            onClick={handleAddEngineer}
                            size="small"
                            startIcon={<AddOutlinedIcon />}
                            sx={{ minWidth: 72 }}
                            variant="outlined"
                          >
                            신규
                          </Button>
                          <Button
                            color="error"
                            disabled={
                              saveDisabled ||
                              !canDelete ||
                              !contractNo ||
                              !selectedEngineer ||
                              Boolean(selectedEngineer.isNew) ||
                              deleteEngineerMutation.isPending
                            }
                            onClick={() =>
                              selectedEngineer &&
                              setDeleteTarget(selectedEngineer)
                            }
                            size="small"
                            startIcon={<DeleteOutlineOutlinedIcon />}
                            sx={{ minWidth: 72 }}
                            variant="outlined"
                          >
                            삭제
                          </Button>
                        </Box>
                      }
                      tooltip="참여 기술인 입력전 계약 기본정보가 먼저 저장이 되어야 합니다. 기술인 데이터 추가 후 Enter 키를 누르면 저장이 됩니다."
                    />

                    <Box
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        minHeight: 0,
                        overflow: "hidden",
                      }}
                    >
                      <EnterpriseDataGrid<WorkOverlapContractEngineerRecord>
                        columns={engineerColumns}
                        editMode="row"
                        getRowId={(row) =>
                          row.isNew
                            ? (row.tempRowId ?? toText(row.engineerId))
                            : toText(row.engineerId)
                        }
                        hideFooterSelectedRowCount
                        isCellEditable={(params) =>
                          !saveDisabled &&
                          (params.row.isNew ? canCreate : canUpdate)
                        }
                        loading={
                          engineersQuery.isLoading ||
                          engineersQuery.isFetching ||
                          createEngineerMutation.isPending ||
                          updateEngineerMutation.isPending ||
                          deleteEngineerMutation.isPending
                        }
                        onProcessRowUpdateError={(error) => {
                          showError(
                            error instanceof Error
                              ? error.message
                              : "참여기술인을 저장하지 못했습니다.",
                          );
                        }}
                        onNewRowEditCancel={handleNewEngineerRowEditCancel}
                        onRowEditStart={(params, event) => {
                          if (params.reason === "cellDoubleClick") {
                            event.defaultMuiPrevented = true;
                          }
                        }}
                        onRowClick={(
                          params: GridRowParams<WorkOverlapContractEngineerRecord>,
                        ) => {
                          const rowId = params.row.isNew
                            ? params.row.tempRowId
                            : toText(params.row.engineerId);
                          setRowSelectionModel({
                            ids: new Set(rowId ? [rowId] : []),
                            type: "include",
                          });
                        }}
                        onRowDoubleClick={(
                          params: GridRowParams<WorkOverlapContractEngineerRecord>,
                        ) => {
                          if (
                            saveDisabled ||
                            !canUpdate ||
                            params.row.isNew ||
                            updateEngineerMutation.isPending
                          ) {
                            return;
                          }
                          const rowId = toText(params.row.engineerId);
                          setRowSelectionModel({
                            ids: new Set(rowId ? [rowId] : []),
                            type: "include",
                          });
                          openChangeDialog(params.row);
                        }}
                        onRowModesModelChange={setRowModesModel}
                        onRowSelectionModelChange={setRowSelectionModel}
                        processRowUpdate={processEngineerRowUpdate}
                        rowHeight={30}
                        rowModesModel={rowModesModel}
                        rowSelectionModel={rowSelectionModel}
                        rows={engineerRows}
                        showPageNumbers
                        showToolbar={false}
                        wrapperMinHeight={360}
                        sx={{
                          border: 0,
                          flex: 1,
                          height: 360,
                          maxWidth: "100%",
                          minHeight: 360,
                          width: "100%",
                          "& .MuiDataGrid-columnHeaders": {
                            bgcolor: "rgba(15, 23, 42, 0.02)",
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Section>
              }
              right={
                <Section title="기술인 변경 이력">
                  <Stack spacing={1} sx={{ minWidth: 0 }}>
                    <SubHeader
                      title="기술인 변경 이력"
                      action={
                        <Button
                          color="error"
                          disabled={
                            !canDelete ||
                            !contractNo ||
                            !selectedHistory ||
                            deleteHistoryMutation.isPending
                          }
                          title="기술인 변경 이력 삭제"
                          onClick={handleDeleteHistoryClick}
                          size="small"
                          startIcon={<DeleteOutlineOutlinedIcon />}
                          sx={{ minWidth: 72 }}
                          variant="outlined"
                        >
                          삭제
                        </Button>
                      }
                    />
                    <Box
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        minHeight: 0,
                        overflow: "hidden",
                      }}
                    >
                      <EnterpriseDataGrid<WorkOverlapContractEngineerHistoryRecord>
                        columns={historyColumns}
                        getRowId={(row) => row.id}
                        checkboxSelection
                        hideFooterSelectedRowCount
                        loading={
                          historiesQuery.isLoading || historiesQuery.isFetching
                        }
                        onRowClick={(
                          params: GridRowParams<WorkOverlapContractEngineerHistoryRecord>,
                        ) => {
                          setHistorySelectionModel({
                            ids: new Set([params.row.id]),
                            type: "include",
                          });
                        }}
                        onRowSelectionModelChange={setHistorySelectionModel}
                        readOnly
                        rowHeight={30}
                        rowSelectionModel={historySelectionModel}
                        rows={historyRows}
                        showPageNumbers
                        showToolbar={false}
                        wrapperMinHeight={360}
                        sx={{
                          border: 0,
                          flex: 1,
                          height: 360,
                          maxWidth: "100%",
                          minHeight: 360,
                          width: "100%",
                          "& .MuiDataGrid-columnHeaders": {
                            bgcolor: "rgba(15, 23, 42, 0.02)",
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Section>
              }
            />
          </Stack>
        )}
      </DialogContent>

      <WorkOverlapContractEngineerChangeDialog
        draft={changeDraft}
        loading={engineerCandidatesQuery.isFetching}
        onClose={() => {
          setChangeTarget(null);
          setChangeDraft(null);
        }}
        onDraftChange={setChangeDraft}
        onSearch={setEngineerKeyword}
        onSubmit={submitChangeDialog}
        options={changeEngineerOptions}
        submitDisabled={changeSubmitDisabled}
      />

      <ConfirmDeleteDialog
        message="선택한 참여기술인을 삭제하시겠습니까?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget && deleteEngineerMutation.mutate(deleteTarget)
        }
        open={Boolean(deleteTarget)}
        targetLabel={
          deleteTarget?.name ?? deleteTarget?.engineerId ?? undefined
        }
        title="참여기술인 삭제"
      />

      <ConfirmDeleteDialog
        message="선택한 변경이력을 삭제하시겠습니까?"
        onClose={() => setHistoryDeleteTarget(null)}
        onConfirm={() =>
          historyDeleteTarget &&
          deleteHistoryMutation.mutate(historyDeleteTarget)
        }
        open={Boolean(historyDeleteTarget)}
        targetLabel={
          historyDeleteTarget?.changeContent ??
          `${historyDeleteTarget?.beforeEngineerName ?? ""} → ${historyDeleteTarget?.afterEngineerName ?? ""}`.trim()
        }
        title="변경이력 삭제"
      />

      <ConfirmDeleteDialog
        message="선택한 기간정보 변경이력을 삭제하시겠습니까?"
        onClose={() => setPeriodHistoryDeleteTarget(null)}
        onConfirm={() =>
          periodHistoryDeleteTarget &&
          deletePeriodHistoryMutation.mutate(periodHistoryDeleteTarget)
        }
        open={Boolean(periodHistoryDeleteTarget)}
        targetLabel={
          periodHistoryDeleteTarget?.periodName ??
          periodHistoryDeleteTarget?.changeContent ??
          undefined
        }
        title="기간정보 변경이력 삭제"
      />

      <DialogActions
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          {isEdit && onDelete ? (
            <Button
              color="error"
              disabled={!canDelete || deleting || deleteDisabled}
              onClick={() => onDelete(draft)}
              variant="outlined"
            >
              삭제
            </Button>
          ) : null}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            onClick={onClose}
            startIcon={<CloseOutlinedIcon />}
            variant="outlined"
          >
            취소
          </Button>
          <Button
            disabled={
              saving ||
              saveDisabled ||
              (isEdit ? !canUpdate : !canCreate) ||
              (hasPeriodChanges && !periodChangeReason.trim())
            }
            onClick={() =>
              onSave({
                periodChangeReason: hasPeriodChanges
                  ? periodChangeReason.trim()
                  : null,
                record: draft,
              })
            }
            startIcon={<SaveOutlinedIcon />}
            variant="contained"
          >
            저장
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
