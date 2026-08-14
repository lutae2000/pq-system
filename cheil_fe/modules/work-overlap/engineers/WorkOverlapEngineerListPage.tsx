﻿﻿"use client";

import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { Alert, Box, Card, CardContent, Chip, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography } from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowId,
  GridRowParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { ResizableCard } from "@/components/common/ResizableCard";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabActivity } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { listEngineerProfiles, type EngineerProfileListFilters } from "@/modules/pq/engineers/api";
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { WorkOverlapContractDetailDialog } from "@/modules/work-overlap/contracts/WorkOverlapContractDetailDialog";
import {
  listWorkOverlapEngineerContracts,
  type WorkOverlapEngineerContractPageResponse,
  type WorkOverlapEngineerContractRecord,
} from "@/modules/work-overlap/engineers/api";

type EmploymentStatus = "재직" | "퇴사";

type EngineerListFilters = {
  jobField: string;
  keyword: string;
  taskPeriodUnit: "일" | "개월";
  taskPeriodValue: string;
  remainingDays: string;
  referenceDate: string;
  specialtyField: string;
  status: "" | EmploymentStatus;
};

const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const DEFAULT_FILTERS: EngineerListFilters = {
  jobField: "",
  keyword: "",
  taskPeriodUnit: "일",
  taskPeriodValue: "365",
  remainingDays: "90",
  referenceDate: todayInputValue(),
  specialtyField: "",
  status: "재직",
};

const DEFAULT_CONTRACT_PAGINATION: GridPaginationModel = {
  page: 0,
  pageSize: 25,
};

const DEFAULT_ENGINEER_PAGINATION: GridPaginationModel = {
  page: 0,
  pageSize: 25,
};

const ENGINEER_LIST_MIN_WIDTH = 360;
const ENGINEER_LIST_MAX_WIDTH = 760;
const ENGINEER_LIST_DEFAULT_WIDTH = 520;
const ENGINEER_LIST_CARD_HEIGHT = 640;
const ENGINEER_LIST_GRID_HEIGHT = 560;
const ENGINEER_CONTRACT_GRID_HEIGHT = 480;

const STATUS_OPTIONS: Array<{ label: string; value: "" | EmploymentStatus }> = [
  { label: "전체", value: "" },
  { label: "재직", value: "재직" },
  { label: "퇴사", value: "퇴사" },
];

type WorkOverlapEngineerRow = {
  departmentName: string;
  engineerId: string;
  grade: string;
  jobField: string;
  name: string;
  participationDays: number;
  specialtyField: string;
  status: EmploymentStatus;
};

type WorkOverlapEngineerContractRow = WorkOverlapEngineerContractRecord & {
  recognizedDays: string;
  selectedEngineerId: string;
  selectedEngineerName: string;
};

const clampEngineerListWidth = (width: number) =>
  Math.min(Math.max(Math.round(width), ENGINEER_LIST_MIN_WIDTH), ENGINEER_LIST_MAX_WIDTH);

const normalizeDateKey = (value: string | null | undefined) => {
  const normalized = (value ?? "").replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? normalized : "";
};

const formatDateText = (value: string | null | undefined) => {
  const key = normalizeDateKey(value);
  if (!key) {
    return "";
  }
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
};

const formatSignedDays = (days: number) => `${days.toLocaleString("ko-KR")}일`;

const uniqueBy = <T,>(rows: T[], getKey: (row: T) => string) => {
  const seen = new Set<string>();
  const uniqueRows: T[] = [];

  for (const row of rows) {
    const key = getKey(row);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueRows.push(row);
  }

  return uniqueRows;
};

const calculateRecognizedDays = (row: WorkOverlapEngineerContractRecord) => {
  if (row.remainDate === null || row.remainDate === undefined) {
    return null;
  }

  return Math.max(0, row.remainDate);
};

const getRecognizedDays = (
  row: WorkOverlapEngineerContractRecord,
  taskPeriodDays: number,
) => {
  const recognizedDays = calculateRecognizedDays(row);
  if (recognizedDays === null) {
    return null;
  }

  return taskPeriodDays > 0 ? Math.min(recognizedDays, taskPeriodDays) : recognizedDays;
};

const normalizePositiveInteger = (value: string) => {
  const normalized = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return normalized;
};

const getTaskPeriodDays = (value: string, unit: EngineerListFilters["taskPeriodUnit"]) => {
  const normalized = normalizePositiveInteger(value);
  if (!normalized) {
    return 0;
  }

  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return unit === "개월" ? numericValue * 30 : numericValue;
};

const getContractStatus = (row: WorkOverlapEngineerContractRecord, referenceDate: string) => {
  const baseKey = normalizeDateKey(referenceDate);
  const startKey = normalizeDateKey(row.constructionStartDate);
  const stopFromKey = normalizeDateKey(row.constructionStopFromDate);
  const stopToKey = normalizeDateKey(row.constructionStopToDate);
  const completeKey = normalizeDateKey(row.constructionCompleteDate);

  if (baseKey && completeKey && baseKey > completeKey) {
    if (stopFromKey && stopToKey) {
      return { color: "success" as const, label: "준공" };
    }

    if (!stopFromKey && !stopToKey) {
      return { color: "success" as const, label: "준공" };
    }
  }

  if (baseKey && startKey && stopFromKey && !stopToKey && baseKey > startKey) {
    return { color: "warning" as const, label: "중지" };
  }

  return { color: "primary" as const, label: "진행" };
};

const mapEngineerProfileToRow = (profile: EngineerProfile): WorkOverlapEngineerRow => ({
  departmentName: profile.summary.department,
  engineerId: profile.summary.id,
  grade: profile.summary.position,
  jobField: profile.detail.jobField,
  name: profile.summary.name,
  participationDays: profile.detail.participationDays,
  specialtyField: profile.detail.specialtyField,
  status: profile.summary.status === "퇴직" ? "퇴사" : "재직",
});

const buildEngineerColumns = (
  jobFieldLabelByCode: Record<string, string>,
  specialtyFieldLabelByCode: Record<string, string>,
  taskPeriodDays: number,
): GridColDef<WorkOverlapEngineerRow>[] => [
  {
    field: "name",
    headerName: "성명",
    minWidth: 120,
    flex: 0.8,
    renderCell: ({ row }: GridRenderCellParams<WorkOverlapEngineerRow>) => (
      <Typography color="primary.main" sx={{ fontSize: 13, fontWeight: 800 }}>
        {row.name}
      </Typography>
    ),
  },
  {
    field: "jobField",
    headerName: "직무분야",
    minWidth: 120,
    flex: 0.8,
    valueGetter: (_value, row) => jobFieldLabelByCode[row.jobField] ?? row.jobField,
  },
  {
    field: "specialtyField",
    headerName: "전문분야",
    minWidth: 150,
    flex: 1,
    valueGetter: (_value, row) => specialtyFieldLabelByCode[row.specialtyField] ?? row.specialtyField,
  },
  {
    field: "workOverlapRate",
    headerName: "업무 중복도",
    width: 110,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }: GridRenderCellParams<WorkOverlapEngineerRow>) =>
      taskPeriodDays > 0 ? `${((row.participationDays / taskPeriodDays) * 100).toFixed(1)}%` : "-",
  },
  {
    field: "status",
    headerName: "상태",
    width: 90,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }: GridRenderCellParams<WorkOverlapEngineerRow>) => (
      <Chip
        color={row.status === "재직" ? "success" : "default"}
        label={row.status}
        size="small"
        variant={row.status === "재직" ? "filled" : "outlined"}
      />
    ),
  },
];

const buildContractColumns = (
  referenceDate: string,
  taskPeriodDays: number,
): GridColDef<WorkOverlapEngineerContractRow>[] => [
  {
    field: "status",
    headerName: "상태",
    width: 62,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }: GridRenderCellParams<WorkOverlapEngineerContractRow>) => {
      const status = getContractStatus(row, referenceDate);
      return <Chip color={status.color} label={status.label} size="small" variant="filled" />;
    },
  },
  { field: "contractNo", headerName: "계약번호", width: 80 },
  { field: "serviceType", headerName: "구분", width: 40, valueGetter: (_value, row) => row.serviceType ?? "" },
  {
    field: "serviceName",
    headerName: "용역명",
    minWidth: 220,
    flex: 1.2,
    renderCell: ({ row }: GridRenderCellParams<WorkOverlapEngineerContractRow>) => (
      <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 700 }}>
        {row.serviceName}
      </Typography>
    ),
  },
  { field: "clientName", headerName: "발주처", minWidth: 120, flex: 0.8, valueGetter: (_value, row) => row.clientName ?? "" },
  {
    field: "contractAmount",
    headerName: "계약금액",
    width: 130,
    align: "right",
    headerAlign: "center",
    valueGetter: (_value, row) => (row.contractAmount === null ? "" : row.contractAmount.toLocaleString("ko-KR")),
  },
  {
    field: "shareAmount",
    headerName: "지분금액",
    width: 130,
    align: "right",
    headerAlign: "center",
    valueGetter: (_value, row) => (row.shareAmount === null ? "" : row.shareAmount.toLocaleString("ko-KR")),
  },
  { field: "constructionStartDate", headerName: "착수일", width: 105, valueGetter: (_value, row) => formatDateText(row.constructionStartDate) },
  { field: "constructionCompleteDate", headerName: "준공일", width: 105, valueGetter: (_value, row) => formatDateText(row.constructionCompleteDate) },
  {
    field: "managementServiceCompleteDate",
    headerName: "관리용역 준공일",
    width: 113,
    valueGetter: (_value, row) => formatDateText(row.managementServiceCompleteDate),
  },
  { field: "constructionStopFromDate", headerName: "중지일", width: 105, valueGetter: (_value, row) => formatDateText(row.constructionStopFromDate) },
  { field: "constructionStopToDate", headerName: "중지종료일", width: 105, valueGetter: (_value, row) => formatDateText(row.constructionStopToDate) },
  {
    field: "remainDate",
    headerName: "잔여일",
    width: 90,
    align: "center",
    headerAlign: "center",
    valueGetter: (_value, row) => row.remainDate ?? "",
  },
  {
    field: "recognizedDays",
    headerName: "인정일수",
    width: 80,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }: GridRenderCellParams<WorkOverlapEngineerContractRow>) => {
      const recognizedDays = getRecognizedDays(row, taskPeriodDays);
      return recognizedDays === null ? "" : formatSignedDays(recognizedDays);
    },
  },
  {
    field: "participationType",
    headerName: "참여구분",
    minWidth: 80,
    flex: 0.8,
    valueGetter: (_value, row) => row.participationType || "",
  },
  {
    field: "pqTargetYn",
    headerName: "PQ대상자 여부",
    width: 110,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }: GridRenderCellParams<WorkOverlapEngineerContractRow>) => {
      const pqTargetYn = row.pqTargetYn;
      if (pqTargetYn === null) {
        return "";
      }

      return (
        <Chip
          color={pqTargetYn ? "success" : "default"}
          label={pqTargetYn ? "대상" : "미대상"}
          size="small"
          variant={pqTargetYn ? "filled" : "outlined"}
        />
      );
    },
  },
  {
    field: "remark",
    headerName: "비고",
    minWidth: 160,
    flex: 1,
    valueGetter: (_value, row) => row.remark || "-",
  },
];

const toContractRecord = (contract: WorkOverlapEngineerContractRow) => {
  return {
    contractNo: contract.contractNo,
    serviceType: contract.serviceType,
    clientName: contract.clientName,
    serviceName: contract.serviceName,
    constructionStartDate: contract.constructionStartDate,
    constructionCompleteDate: contract.constructionCompleteDate,
    managementServiceCompleteDate: contract.managementServiceCompleteDate,
    constructionStopFromDate: contract.constructionStopFromDate,
    constructionStopToDate: contract.constructionStopToDate,
    restartDate: contract.restartDate,
    contractAmount: contract.contractAmount,
    shareAmount: contract.shareAmount,
    performanceCertification: contract.performanceCertification,
    participateListDocument: contract.participateListDocument,
    cemsConfirm: contract.cemsConfirm,
    remark: contract.remark,
    createdAt: contract.createdAt,
    createdId: contract.createdId,
    lastChangedAt: contract.lastChangedAt,
    lastChangedId: contract.lastChangedId,
  };
};

const includesKeyword = (row: WorkOverlapEngineerRow, keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.engineerId, row.name, row.departmentName, row.grade, row.jobField, row.specialtyField]
    .map((value) => value.toLowerCase())
    .some((value) => value.includes(normalized));
};

function SummaryCard({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card sx={{ border: "1px solid", borderColor: "divider", height: 80 }}>
      <CardContent
        sx={{
          alignItems: "center",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          p: 1.25,
          "&:last-child": { pb: 1.25 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" variant="caption">
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 900, lineHeight: 1.15, mt: 0.5 }} variant="h5">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: color,
            borderRadius: 1.5,
            color: "common.white",
            display: "flex",
            flexShrink: 0,
            height: 38,
            justifyContent: "center",
            width: 38,
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}

type ContractQueryResult = {
  rowCount: number;
  rows: WorkOverlapEngineerContractRow[];
};

async function loadSelectedEngineerContracts(
  selectedEngineer: WorkOverlapEngineerRow,
  referenceDate: string,
  remainingDays: number,
  page: number,
  pageSize: number,
): Promise<ContractQueryResult> {
  const response: WorkOverlapEngineerContractPageResponse = await listWorkOverlapEngineerContracts(selectedEngineer.engineerId, {
    page,
    referenceDate,
    remainingDays,
    size: pageSize,
  });

  const rows = (response.content ?? []).map(
    (contract) =>
      ({
        ...contract,
        recognizedDays: "",
        selectedEngineerId: selectedEngineer.engineerId,
        selectedEngineerName: selectedEngineer.name,
      }) satisfies WorkOverlapEngineerContractRow,
  );

  return {
    rowCount: response.totalElements,
    rows,
  };
}

export function WorkOverlapEngineerListPage() {
  const { canRead } = useCurrentMenuPermission();
  const isTabActive = useTabActivity();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [selectedEngineerId, setSelectedEngineerId] = useState("");
  const [engineerListWidth, setEngineerListWidth] = useState(ENGINEER_LIST_DEFAULT_WIDTH);
  const [engineerListCollapsed, setEngineerListCollapsed] = useState(false);
  const [contractDetailRecord, setContractDetailRecord] = useState<WorkOverlapEngineerContractRow | null>(null);
  const [engineerPaginationModel, setEngineerPaginationModel] = useState<GridPaginationModel>(DEFAULT_ENGINEER_PAGINATION);
  const [contractPaginationModel, setContractPaginationModel] = useState<GridPaginationModel>(DEFAULT_CONTRACT_PAGINATION);
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<Set<string>>(() => new Set());
  const [selectedContractIds, setSelectedContractIds] = useState<Set<string>>(() => new Set());
  const [showSelectedEngineersOnly, setShowSelectedEngineersOnly] = useState(false);

  const engineerQueryFilters = useMemo<EngineerProfileListFilters>(
    () => ({
      jobField: appliedFilters.jobField || undefined,
      keyword: appliedFilters.keyword.trim() || undefined,
      retireYn: appliedFilters.status === "재직" ? "N" : appliedFilters.status === "퇴사" ? "Y" : undefined,
      specialtyField: appliedFilters.specialtyField || undefined,
    }),
    [appliedFilters],
  );

  const engineerProfilesQuery = useQuery({
    queryKey: ["pq-engineers", engineerQueryFilters],
    queryFn: () => listEngineerProfiles(engineerQueryFilters),
    enabled: canRead && isTabActive,
  });

  const jobFieldReferencesQuery = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: canRead && isTabActive });
  const specialtyFieldReferencesQuery = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: canRead && isTabActive });

  const engineers = useMemo(
    () => uniqueBy((engineerProfilesQuery.data ?? []).map(mapEngineerProfileToRow), (row) => row.engineerId),
    [engineerProfilesQuery.data],
  );

  const jobFieldLabelByCode = useMemo(
    () => jobFieldReferencesQuery.labelByValue ?? {},
    [jobFieldReferencesQuery.labelByValue],
  );
  const specialtyFieldLabelByCode = useMemo(
    () => specialtyFieldReferencesQuery.labelByValue ?? {},
    [specialtyFieldReferencesQuery.labelByValue],
  );
  const selectedEngineer = useMemo(
    () => (selectedEngineerId ? engineers.find((engineer) => engineer.engineerId === selectedEngineerId) ?? null : null),
    [engineers, selectedEngineerId],
  );

  const isReferenceDateValid = Boolean(appliedFilters.referenceDate.trim());
  const isRemainingDaysValid = Boolean(appliedFilters.remainingDays.trim());
  const isQueryValid = isReferenceDateValid && isRemainingDaysValid;
  const remainingDaysValue = Number(normalizePositiveInteger(appliedFilters.remainingDays)) || 0;

  const jobFieldOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        engineers
          .map((row) => row.jobField.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right, "ko-KR"));
    if (filters.jobField && !options.includes(filters.jobField)) {
      options.unshift(filters.jobField);
    }
    return options;
  }, [engineers, filters.jobField]);

  const specialtyFieldOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        engineers
          .map((row) => row.specialtyField.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right, "ko-KR"));
    if (filters.specialtyField && !options.includes(filters.specialtyField)) {
      options.unshift(filters.specialtyField);
    }
    return options;
  }, [engineers, filters.specialtyField]);

  const filteredEngineers = useMemo(
    () =>
      engineers.filter((row) => {
        if (!includesKeyword(row, appliedFilters.keyword)) {
          return false;
        }
        if (appliedFilters.jobField && row.jobField !== appliedFilters.jobField) {
          return false;
        }
        if (appliedFilters.specialtyField && row.specialtyField !== appliedFilters.specialtyField) {
          return false;
        }
        if (appliedFilters.status && row.status !== appliedFilters.status) {
          return false;
        }
        return true;
      }),
    [appliedFilters, engineers],
  );

  const visibleEngineers = useMemo(
    () => (showSelectedEngineersOnly ? filteredEngineers.filter((row) => selectedEngineerIds.has(row.engineerId)) : filteredEngineers),
    [filteredEngineers, selectedEngineerIds, showSelectedEngineersOnly],
  );
  const appliedReferenceDate = appliedFilters.referenceDate || todayInputValue();
  const selectedEngineerIdForQuery = selectedEngineer?.engineerId ?? "";

  const selectedEngineerRowId = visibleEngineers.some((row) => row.engineerId === selectedEngineerIdForQuery)
    ? selectedEngineerIdForQuery
    : "";

  const selectedEngineerSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ ids: new Set<GridRowId>(selectedEngineerIds), type: "include" }),
    [selectedEngineerIds],
  );

  const contractsQuery = useQuery({
    queryKey: [
      "work-overlap-engineer-contracts",
      selectedEngineerIdForQuery,
      appliedReferenceDate,
      remainingDaysValue,
      contractPaginationModel.page,
      contractPaginationModel.pageSize,
    ],
    queryFn: () =>
      selectedEngineer
        ? loadSelectedEngineerContracts(
            selectedEngineer,
            appliedReferenceDate,
            remainingDaysValue,
            contractPaginationModel.page,
            contractPaginationModel.pageSize,
          )
        : Promise.resolve({ rowCount: 0, rows: [] }),
    enabled: canRead && isTabActive && isQueryValid && Boolean(selectedEngineerIdForQuery),
    placeholderData: keepPreviousData,
  });

  const selectedContracts = useMemo(() => contractsQuery.data?.rows ?? [], [contractsQuery.data]);
  const selectedContractsUnique = useMemo(() => uniqueBy(selectedContracts, (row) => row.contractNo), [selectedContracts]);
  const selectedContractDefaultIds = useMemo(
    () => selectedContractsUnique.filter((row) => row.checkYn).map((row) => row.contractNo),
    [selectedContractsUnique],
  );
  const selectedContractResolvedIds = useMemo(
    () => new Set([...selectedContractDefaultIds, ...selectedContractIds]),
    [selectedContractDefaultIds, selectedContractIds],
  );
  const selectedContractRowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ ids: new Set<GridRowId>(selectedContractResolvedIds), type: "include" }),
    [selectedContractResolvedIds],
  );
  const selectedContractsRowCount = contractsQuery.data?.rowCount ?? 0;
  const selectedContractRows = useMemo(
    () => selectedContractsUnique.filter((row) => selectedContractResolvedIds.has(row.contractNo)),
    [selectedContractResolvedIds, selectedContractsUnique],
  );

  const selectedContractCount = selectedContractRows.length;

  const taskPeriodDays = useMemo(() => getTaskPeriodDays(appliedFilters.taskPeriodValue, appliedFilters.taskPeriodUnit), [
    appliedFilters.taskPeriodUnit,
    appliedFilters.taskPeriodValue,
  ]);

  const contractColumns = useMemo(
    () => buildContractColumns(appliedReferenceDate, taskPeriodDays),
    [appliedReferenceDate, taskPeriodDays],
  );

  const recognizedDaysTotal = useMemo(
    () =>
      selectedContractRows.reduce((sum, row) => {
        const recognizedDays = getRecognizedDays(row, taskPeriodDays);
        return sum + (recognizedDays ?? 0);
      }, 0),
    [selectedContractRows, taskPeriodDays],
  );

  const engineerColumns = useMemo(
    () => buildEngineerColumns(jobFieldLabelByCode, specialtyFieldLabelByCode, taskPeriodDays),
    [jobFieldLabelByCode, specialtyFieldLabelByCode, taskPeriodDays],
  );

  const overlapRate = taskPeriodDays > 0 ? (recognizedDaysTotal / taskPeriodDays) * 100 : null;

  const handleSearch = (keyword: string) => {
    if (!isQueryValid) {
      return;
    }
    setAppliedFilters({ ...filters, keyword });
    setEngineerPaginationModel((current) => ({ ...current, page: 0 }));
    setContractPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSelectedEngineerId("");
    setSelectedEngineerIds(new Set());
    setSelectedContractIds(new Set());
    setShowSelectedEngineersOnly(false);
    setEngineerPaginationModel(DEFAULT_ENGINEER_PAGINATION);
    setContractPaginationModel(DEFAULT_CONTRACT_PAGINATION);
  };

  const handleSelectEngineer = (id: string) => {
    setSelectedEngineerId(id);
    setSelectedContractIds(new Set());
    setContractPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const handleOpenContractDetail = (params: GridRowParams<WorkOverlapEngineerContractRow>) => {
    setContractDetailRecord(params.row);
  };

  const handleContractSelectionModelChange = (model: GridRowSelectionModel) => {
    setSelectedContractIds(new Set(model.ids));
  };

  const handleEngineerSelectionModelChange = (model: GridRowSelectionModel) => {
    const nextIds = new Set(Array.from(model.ids, (id) => String(id)));
    setSelectedEngineerIds(nextIds);
  };

  return (
    <Box>
      <PageHeader
        title="기술인 목록 조회"
      />

      {!canRead ? (
        <Alert severity="warning">기술인 목록 조회 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <SearchPanel
            keyword={filters.keyword}
            keywordLabel="통합검색"
            keywordPlaceholder="성명, 직무분야, 전문분야"
            keywordSx={{ flex: "1 1 360px", maxWidth: 560, minWidth: 260 }}
            onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
            onReset={handleReset}
            onSearch={handleSearch}
            resetLabel="초기화"
            searchDisabled={!canRead || !isQueryValid}
            searchLabel="조회"
          >
            <TextField
              select
              label="전문분야"
              onChange={(event) => setFilters((current) => ({ ...current, specialtyField: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.specialtyField}
            >
              <MenuItem value="">전체</MenuItem>
              {specialtyFieldOptions.map((option, index) => (
                <MenuItem key={`specialty-field-${index}-${option}`} value={option}>
                  {specialtyFieldLabelByCode[option] ?? option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="직무분야"
              onChange={(event) => setFilters((current) => ({ ...current, jobField: event.target.value }))}
              size="small"
              sx={standardFieldSx}
              value={filters.jobField}
            >
              <MenuItem value="">전체</MenuItem>
              {jobFieldOptions.map((option, index) => (
                <MenuItem key={`job-field-${index}-${option}`} value={option}>
                  {jobFieldLabelByCode[option] ?? option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="상태"
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as EngineerListFilters["status"] }))}
              size="small"
              sx={standardFieldSx}
              value={filters.status}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value || "all"} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Box
              sx={{
                display: "flex",
                flex: "0 0 100% !important",
                flexBasis: "100% !important",
                flexWrap: "nowrap",
                gap: 1.25,
                maxWidth: "none !important",
                width: "100%",
              }}
            >
              <TextField
                label="기준일"
                onChange={(event) => setFilters((current) => ({ ...current, referenceDate: event.target.value }))}
                error={!isReferenceDateValid}
                helperText={isReferenceDateValid ? undefined : "필수값입니다."}
                size="small"
                sx={{ ...standardFieldSx, flex: "0 0 180px", width: "auto" }}
                type="date"
                value={filters.referenceDate}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="과업기간"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, taskPeriodValue: normalizePositiveInteger(event.target.value) }))
                }
                size="small"
                sx={{ ...standardFieldSx, flex: "0 0 140px", width: "auto" }}
                type="text"
                value={filters.taskPeriodValue}
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
              />
              <TextField
                select
                label="단위"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, taskPeriodUnit: event.target.value as EngineerListFilters["taskPeriodUnit"] }))
                }
                size="small"
                sx={{ ...standardFieldSx, flex: "0 0 110px", width: "auto" }}
                value={filters.taskPeriodUnit}
              >
                <MenuItem value="일">일</MenuItem>
                <MenuItem value="개월">개월</MenuItem>
              </TextField>
              <TextField
                label="잔여일"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, remainingDays: normalizePositiveInteger(event.target.value) }))
                }
                error={!isRemainingDaysValid}
                helperText={isRemainingDaysValid ? undefined : "필수값입니다."}
                size="small"
                sx={{ ...standardFieldSx, flex: "0 0 110px", width: "auto" }}
                type="text"
                value={filters.remainingDays}
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
              />
            </Box>
          </SearchPanel>

          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
            <SummaryCard
              color="primary.main"
              icon={<BadgeOutlinedIcon fontSize="small" />}
              label="선택 건수"
              value={`${selectedContractCount}건`}
            />
            <SummaryCard
              color="success.main"
              icon={<WorkOutlineOutlinedIcon fontSize="small" />}
              label="인정일수 합계"
              value={`${recognizedDaysTotal.toLocaleString("ko-KR")}일`}
            />
            <SummaryCard
              color="warning.main"
              icon={<EngineeringOutlinedIcon fontSize="small" />}
              label="업무 중복도"
              value={overlapRate === null ? "-" : `${overlapRate.toFixed(1)}%`}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                xl: engineerListCollapsed ? "1fr" : `${engineerListWidth}px minmax(0, 1fr)`,
              },
            }}
          >
            {!engineerListCollapsed ? (
              <ResizableCard
                width={engineerListWidth}
                minWidth={ENGINEER_LIST_MIN_WIDTH}
                maxWidth={ENGINEER_LIST_MAX_WIDTH}
                onWidthChange={(nextWidth) => setEngineerListWidth(clampEngineerListWidth(nextWidth))}
                resizeEdges={["right"]}
                sx={{ alignSelf: "stretch", height: ENGINEER_LIST_CARD_HEIGHT, width: { xs: "100%", xl: engineerListWidth } }}
              >
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%", minHeight: 0, p: 2 }}>
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 800 }} variant="h6">
                      기술인 목록
                    </Typography>
                    <FormControlLabel
                        control={
                          <Switch
                              checked={showSelectedEngineersOnly}
                              onChange={(_event, checked) => {
                                setShowSelectedEngineersOnly(checked);
                                setEngineerPaginationModel((current) => ({ ...current, page: 0 }));
                              }}
                              size="small"
                          />
                        }
                        label="선택된 목록"
                        sx={{ ml: 0.25 }}
                    />
                  </Box>
                  {engineerProfilesQuery.isError ? (
                    <Alert severity="error">기술인 목록을 불러오지 못했습니다.</Alert>
                  ) : (
                    <EnterpriseDataGrid<WorkOverlapEngineerRow>
                      checkboxSelection
                      columns={engineerColumns}
                      enableRowClickCheckboxSelection={!showSelectedEngineersOnly}
                      getRowId={(row) => row.engineerId}
                      getRowClassName={(params) => (params.row.engineerId === selectedEngineerRowId ? "Mui-selected" : "")}
                      loading={engineerProfilesQuery.isLoading || engineerProfilesQuery.isFetching}
                      onRowClick={(params) => handleSelectEngineer(params.row.engineerId)}
                      onPaginationModelChange={(model) => setEngineerPaginationModel(model)}
                      onRowSelectionModelChange={handleEngineerSelectionModelChange}
                      paginationModel={engineerPaginationModel}
                      pageSizeOptions={[25, 50, 100]}
                      readOnly
                      rowHeight={30}
                      rowSelectionModel={selectedEngineerSelectionModel}
                      rows={visibleEngineers}
                      showPageNumbers
                      showXlsxExportButton
                      wrapperMinHeight={ENGINEER_LIST_GRID_HEIGHT}
                      sx={{ height: ENGINEER_LIST_GRID_HEIGHT }}
                    />
                  )}
                </CardContent>
              </ResizableCard>
            ) : null}

            <Card sx={{ display: "flex", height: ENGINEER_LIST_CARD_HEIGHT, minWidth: 0, overflow: "hidden", width: "100%" }}>
              <CardContent sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 1.5, minHeight: 0, minWidth: 0, overflow: "hidden", p: 2 }}>
                <Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between", gap: 1, mb: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} variant="h6">
                      참여 계약 현황
                    </Typography>
                    {selectedEngineer ? (
                      <Box
                        sx={{
                          bgcolor: "rgba(25, 118, 210, 0.06)",
                          border: "1px solid",
                          borderColor: "rgba(25, 118, 210, 0.22)",
                          borderRadius: 1,
                          color: "text.secondary",
                          display: "grid",
                          gap: 1,
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "minmax(180px, 1.2fr) minmax(160px, 1fr) minmax(160px, 1fr)",
                          },
                          mt: 0.75,
                          px: 1.25,
                          py: 0.75,
                          width: "100%",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }} variant="caption">
                            기술인
                          </Typography>
                          <Typography sx={{ color: "text.primary", fontSize: 14, fontWeight: 800, lineHeight: 1.25, mt: 0.25 }} noWrap>
                            {selectedEngineer.name} ({selectedEngineer.engineerId})
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }} variant="caption">
                            직무분야
                          </Typography>
                          <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 700, lineHeight: 1.25, mt: 0.25 }} noWrap>
                            {jobFieldLabelByCode[selectedEngineer.jobField] ?? selectedEngineer.jobField ?? "-"}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }} variant="caption">
                            전문분야
                          </Typography>
                          <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 700, lineHeight: 1.25, mt: 0.25 }} noWrap>
                            {specialtyFieldLabelByCode[selectedEngineer.specialtyField] ?? selectedEngineer.specialtyField ?? "-"}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.25 }} variant="body2">
                        선택된 기술인이 없습니다.
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title={engineerListCollapsed ? "기술인 목록 펼치기" : "기술인 목록 접기"}>
                    <IconButton
                      color="primary"
                      onClick={() => setEngineerListCollapsed((current) => !current)}
                      size="small"
                      sx={{ mt: -0.25 }}
                    >
                      {engineerListCollapsed ? <KeyboardDoubleArrowRightOutlinedIcon fontSize="small" /> : <KeyboardDoubleArrowLeftOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>

                {!selectedEngineer ? (
                  <Alert severity="info">조회된 기술인이 없습니다.</Alert>
                ) : contractsQuery.isError ? (
                  <Alert severity="error">참여 계약 현황을 불러오지 못했습니다.</Alert>
                ) : selectedContracts.length === 0 ? (
                  <Alert severity="info">선택한 기술인과 연결된 참여 계약이 없습니다.</Alert>
                ) : (
                  <EnterpriseDataGrid<WorkOverlapEngineerContractRow>
                    checkboxSelection
                    columns={contractColumns}
                    getRowId={(row) => row.contractNo}
                    loading={contractsQuery.isLoading || contractsQuery.isFetching}
                    onPaginationModelChange={(model) => setContractPaginationModel(model)}
                    onRowDoubleClick={handleOpenContractDetail}
                    paginationMode="server"
                    paginationModel={contractPaginationModel}
                    pageSizeOptions={[25, 50, 100]}
                    readOnly
                    rowCount={selectedContractsRowCount}
                    rowHeight={30}
                    rowSelectionModel={selectedContractRowSelectionModel}
                    rows={selectedContractsUnique}
                    onRowSelectionModelChange={handleContractSelectionModelChange}
                    showPageNumbers
                    showXlsxExportButton
                    wrapperMinHeight={ENGINEER_CONTRACT_GRID_HEIGHT}
                    sx={{ height: ENGINEER_CONTRACT_GRID_HEIGHT, maxWidth: "100%", minWidth: 0, width: "100%" }}
                  />
                )}
              </CardContent>
            </Card>
          </Box>
        </Stack>
      )}

      <WorkOverlapContractDetailDialog
        deleteDisabled
        key={`work-overlap-contract-readonly-${contractDetailRecord?.contractNo ?? "none"}`}
        onClose={() => setContractDetailRecord(null)}
        onSave={() => undefined}
        open={Boolean(contractDetailRecord)}
        record={contractDetailRecord ? toContractRecord(contractDetailRecord) : null}
        saveDisabled
      />
    </Box>
  );
}
