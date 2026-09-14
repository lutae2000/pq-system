"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FormatListNumberedOutlinedIcon from "@mui/icons-material/FormatListNumberedOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRenderEditCellParams, GridRowParams, GridRowSelectionModel } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { ConfirmActionDialog, ConfirmDeleteDialog } from "@/components/common/ConfirmActionDialog";
import { EngineerSelectDialog } from "@/components/common/EngineerSelectDialog";
import { compactFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { ResizableCard } from "@/components/common/ResizableCard";
import { ResizeHandle } from "@/components/common/ResizeHandle";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { readAuthSessionSnapshot } from "@/lib/auth/authSession";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeGroupOptions } from "@/modules/common/reference/useReferenceOptions";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import { getEngineerProfile } from "@/modules/pq/engineers/api";
import { deleteWorkOverlapDocumentTarget, deleteWorkOverlapDocumentEngineer, listWorkOverlapDocumentEngineerContracts, listWorkOverlapDocumentEngineers, replaceWorkOverlapDocumentEngineers, replaceWorkOverlapDocumentTargets, updateWorkOverlapDocumentEngineer, type WorkOverlapEngineerContractRecord } from "@/modules/work-overlap/engineers/api";
import { buildWorkOverlapContractColumns } from "@/modules/work-overlap/engineers/workOverlapContractColumns";

const BidNoticeSelectDialog = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeSelectDialog").then((module) => module.BidNoticeSelectDialog),
  { ssr: false },
);
const BidNoticeDetailPopup = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeDetailPopup").then((module) => module.BidNoticeDetailPopup),
  { ssr: false },
);
const WorkOverlapContractDetailDialog = dynamic(
  () => import("@/modules/work-overlap/contracts/WorkOverlapContractDetailDialog").then((module) => module.WorkOverlapContractDetailDialog),
  { ssr: false },
);
const WorkOverlapHwpxTemplateGenerationPanel = dynamic(
  () => import("@/modules/pq/work-overlap-docs/WorkOverlapHwpxTemplateGenerationPanel").then((module) => module.WorkOverlapHwpxTemplateGenerationPanel),
  { ssr: false },
);

type EngineerRow = {
  birthDate: string;
  engineerId: string;
  jobField: string;
  name: string;
  priority: number | null;
  position: string;
  responsibility: string;
  specialtyField: string;
};

type SavedContractRow = WorkOverlapEngineerContractRecord & {
  displayOrder: number | null;
  responsibility: string;
};

const fieldSx = { ...compactFieldSx, minWidth: 180 } as const;
const center = { align: "center", headerAlign: "center" } as const;
const today = () => {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

const formatBirthDate = (value: string | null | undefined) => {
  const normalized = value?.trim() ?? "";
  return /^\d{8}$/.test(normalized)
    ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`
    : normalized;
};

const DEFAULT_SELECTOR_PANEL_WIDTH = 360;
const DEFAULT_CONTRACT_CARD_HEIGHT = 520;
const CONTRACT_CARD_MIN_HEIGHT = 320;
const CONTRACT_CARD_MAX_HEIGHT = 900;
const CONTRACT_CARD_RESERVED_HEIGHT = 135;
const DEFAULT_SAVED_CONTRACT_CARD_HEIGHT = 480;
const SAVED_CONTRACT_CARD_MIN_HEIGHT = 320;
const SAVED_CONTRACT_CARD_MAX_HEIGHT = 900;
const selectorGridHeight = { xs: 520, md: 580 } as const;
const WORK_OVERLAP_REFERENCE_GROUPS = [
  { key: "jobFields", codeLevel: 3 as const, level1Code: "PQ", level2Code: "QA", useYn: true },
  { key: "specialtyFields", codeLevel: 3 as const, level1Code: "PQ", level2Code: "PA", useYn: true },
];
const EMPTY_LABEL_BY_VALUE: Record<string, string> = {};

const clampContractCardHeight = (height: number) => Math.min(Math.max(Math.round(height), CONTRACT_CARD_MIN_HEIGHT), CONTRACT_CARD_MAX_HEIGHT);
const clampSavedContractCardHeight = (height: number) => Math.min(Math.max(Math.round(height), SAVED_CONTRACT_CARD_MIN_HEIGHT), SAVED_CONTRACT_CARD_MAX_HEIGHT);
const clampSelectorPanelWidth = (width: number) => Math.min(Math.max(Math.round(width), 300), 720);

export function WorkOverlapDocumentsPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const { showError, showSuccess } = useAppSnackbar();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const currentSession = useMemo(() => readAuthSessionSnapshot(), []);
  const workDutyId = currentSession?.loginId ?? "";
  const [bidNoticeDialogOpen, setBidNoticeDialogOpen] = useState(false);
  const [engineerSelectDialogOpen, setEngineerSelectDialogOpen] = useState(false);
  const [bidNoticeDetailOpen, setBidNoticeDetailOpen] = useState(false);
  const [selectedBidNotice, setSelectedBidNotice] = useState<BidNoticeApiRecord | null>(null);
  const [referenceDate, setReferenceDate] = useState(today());
  const [taskPeriodValue, setTaskPeriodValue] = useState("365");
  const [taskPeriodUnit, setTaskPeriodUnit] = useState<"일" | "개월">("일");
  const [remainingDays, setRemainingDays] = useState("90");
  const [keyword, setKeyword] = useState("");
  const [activeEngineerId, setActiveEngineerId] = useState("");
  const [contractSelectionByEngineer, setContractSelectionByEngineer] = useState<Record<string, string[]>>({});
  const [savedContractNosByEngineer, setSavedContractNosByEngineer] = useState<Record<string, string[]>>({});
  const [savedContractRowsByEngineer, setSavedContractRowsByEngineer] = useState<Record<string, SavedContractRow[]>>({});
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);
  const [deleteEngineerIds, setDeleteEngineerIds] = useState<string[]>([]);
  const [isDeletingEngineers, setIsDeletingEngineers] = useState(false);
  const [autoNumberEngineersOpen, setAutoNumberEngineersOpen] = useState(false);
  const [isAutoNumberingEngineers, setIsAutoNumberingEngineers] = useState(false);
  const [selectedSavedContractNos, setSelectedSavedContractNos] = useState<string[]>([]);
  const [deleteSavedContractNos, setDeleteSavedContractNos] = useState<string[]>([]);
  const [isDeletingSavedContracts, setIsDeletingSavedContracts] = useState(false);
  const [engineerRowOverrides, setEngineerRowOverrides] = useState<Record<string, Pick<EngineerRow, "priority" | "responsibility">>>({});
  const [savedContractPaginationModel, setSavedContractPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 100 });
  const [engineerPaginationModel, setEngineerPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 100 });
  const [contractPaginationModel, setContractPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 100 });
  const [selectorPanelWidth, setSelectorPanelWidth] = useState(DEFAULT_SELECTOR_PANEL_WIDTH);
  const [selectorPanelCollapsed, setSelectorPanelCollapsed] = useState(false);
  const [contractCardHeight, setContractCardHeight] = useState(DEFAULT_CONTRACT_CARD_HEIGHT);
  const [savedContractCardHeight, setSavedContractCardHeight] = useState(DEFAULT_SAVED_CONTRACT_CARD_HEIGHT);
  const [contractDetailRecord, setContractDetailRecord] = useState<WorkOverlapEngineerContractRecord | null>(null);
  const engineerGridApiRef = useGridApiRef();
  const savedContractGridApiRef = useGridApiRef();
  const selectorResizeStartXRef = useRef(0);
  const selectorResizeStartWidthRef = useRef(DEFAULT_SELECTOR_PANEL_WIDTH);
  const contractGridHeight = Math.max(contractCardHeight - CONTRACT_CARD_RESERVED_HEIGHT, 160);

  const handleSelectorResizePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      selectorResizeStartXRef.current = event.clientX;
      selectorResizeStartWidthRef.current = selectorPanelWidth;

      const abortController = new AbortController();
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      const stopResize = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        abortController.abort();
      };

      window.addEventListener(
        "pointermove",
        (moveEvent) => {
          const deltaX = moveEvent.clientX - selectorResizeStartXRef.current;
          setSelectorPanelWidth(clampSelectorPanelWidth(selectorResizeStartWidthRef.current + deltaX));
        },
        { signal: abortController.signal },
      );
      window.addEventListener("pointerup", stopResize, { once: true, signal: abortController.signal });
      window.addEventListener("pointercancel", stopResize, { once: true, signal: abortController.signal });
    },
    [selectorPanelWidth],
  );

  const commonCodeReferences = useCommonCodeGroupOptions(WORK_OVERLAP_REFERENCE_GROUPS, { enabled: canRead });
  const jobFieldLabelByValue = commonCodeReferences.groups.jobFields?.labelByValue ?? EMPTY_LABEL_BY_VALUE;
  const specialtyFieldLabelByValue = commonCodeReferences.groups.specialtyFields?.labelByValue ?? EMPTY_LABEL_BY_VALUE;

  const targetEngineersQuery = useQuery({
    queryKey: ["work-overlap-docs", "document-engineers", selectedBidNotice?.bidSeq ?? "none", currentSession?.loginId ?? "none", keyword.trim()],
    queryFn: () => listWorkOverlapDocumentEngineers(selectedBidNotice?.bidSeq ?? 0, currentSession?.loginId ?? "", keyword),
    enabled: tabQueryEnabled && Boolean(selectedBidNotice?.bidSeq && currentSession?.loginId),
  });

  const activeEngineerContractsQuery = useQuery({
    queryKey: ["work-overlap-docs", "contracts", selectedBidNotice?.bidSeq ?? "none", workDutyId, activeEngineerId, contractPaginationModel, referenceDate, remainingDays],
    queryFn: () => listWorkOverlapDocumentEngineerContracts(activeEngineerId, selectedBidNotice?.bidSeq ?? 0, {
      page: contractPaginationModel.page,
      size: contractPaginationModel.pageSize,
      referenceDate,
      remainingDays: Number(remainingDays) || 1,
      workDutyId,
    }),
    enabled: tabQueryEnabled && Boolean(workDutyId && activeEngineerId),
  });

  const activeEngineerQuery = useQuery({
    queryKey: ["work-overlap-docs", "engineer-profile", activeEngineerId],
    queryFn: () => getEngineerProfile(activeEngineerId),
    enabled: tabQueryEnabled && Boolean(activeEngineerId),
  });

  const engineerRows = useMemo<EngineerRow[]>(
    () => (targetEngineersQuery.data ?? []).map((target) => {
      const engineerId = target.engrId;
      const override = engineerRowOverrides[engineerId];
      return {
        birthDate: formatBirthDate(target.birthday),
        engineerId,
        jobField: target.dutyPart || target.proPart || "",
        name: target.nameKor ?? engineerId,
        position: target.grade ?? "",
        priority: override?.priority ?? target.displayOrder ?? null,
        responsibility: override?.responsibility ?? target.responsibility ?? "",
        specialtyField: target.proPart ?? "",
      };
    }),
    [engineerRowOverrides, targetEngineersQuery.data],
  );
  const activeEngineer = activeEngineerQuery.data ?? null;
  const activeEngineerRow = engineerRows.find((row) => row.engineerId === activeEngineerId) ?? null;
  const contractRows = useMemo(() => activeEngineerContractsQuery.data?.availableContracts.content ?? [], [activeEngineerContractsQuery.data?.availableContracts.content]);
  const persistedSavedContractRows = useMemo<SavedContractRow[]>(
    () => (activeEngineerContractsQuery.data?.savedContracts ?? []).map((target) => ({
      ...target.contract,
      displayOrder: target.displayOrder,
      responsibility: target.responsibility ?? "",
    })),
    [activeEngineerContractsQuery.data?.savedContracts],
  );
  const persistedSavedContractNos = persistedSavedContractRows.map((row) => row.contractNo);
  const savedContractNos = activeEngineerId ? savedContractNosByEngineer[activeEngineerId] ?? persistedSavedContractNos : undefined;
  const hasSavedContractSelection = Boolean(activeEngineerId && (
    savedContractNosByEngineer[activeEngineerId] !== undefined || persistedSavedContractNos.length > 0
  ));
  const selectedContractNos = activeEngineerId
    ? contractSelectionByEngineer[activeEngineerId]
      ?? (hasSavedContractSelection ? savedContractNos ?? [] : contractRows.filter((row) => row.checkYn).map((row) => row.contractNo))
    : [];
  const visibleSavedContractRows = contractRows.filter((row) => (savedContractNos ?? []).includes(row.contractNo));
  const savedContractRows = activeEngineerId ? savedContractRowsByEngineer[activeEngineerId] ?? persistedSavedContractRows : [];
  const taskPeriodDays = Math.max(0, Number(taskPeriodValue) * (taskPeriodUnit === "개월" ? 30 : 1));
  const selectedContractRows = contractRows.filter((row) => selectedContractNos.includes(row.contractNo));
  const recognizedDaysTotal = selectedContractRows.reduce(
    (sum, row) => sum + (row.remainDate == null ? 0 : Math.min(Math.max(0, row.remainDate), taskPeriodDays)),
    0,
  );
  const overlapRate = taskPeriodDays > 0 ? (recognizedDaysTotal / taskPeriodDays) * 100 : null;

  const engineerColumns = useMemo<GridColDef<EngineerRow>[]>(() => [
    {
      field: "priority",
      headerName: "순번",
      width: 40,
      ...center,
      editable: canUpdate,
      renderEditCell: (params: GridRenderEditCellParams<EngineerRow, number | null>) => (
        <TextField
          autoFocus
          fullWidth
          onChange={(event) => void params.api.setEditCellValue({ field: params.field, id: params.id, value: event.target.value.replace(/\D/g, "") })}
          onFocus={(event) => event.currentTarget.select()}
          size="small"
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
          value={params.value ?? ""}
          variant="standard"
        />
      ),
    },
    { field: "name", headerName: "성명", width: 92, ...center },
    {
      field: "responsibility",
      headerName: "책임정도",
      width: 95,
      ...center,
      editable: canUpdate,
      renderEditCell: (params: GridRenderEditCellParams<EngineerRow, string>) => (
        <Autocomplete
          autoFocus
          freeSolo
          fullWidth
          onInputChange={(_, value) => void params.api.setEditCellValue({ field: params.field, id: params.id, value })}
          options={["책임", "참여", "실무", "사업책임"]}
          renderInput={(inputParams) => <TextField {...inputParams} autoFocus size="small" variant="standard" />}
          value={String(params.value ?? "")}
        />
      ),
    },
    { field: "birthDate", headerName: "생년월일", width: 105, ...center },
    { field: "position", headerName: "직위", width: 90, ...center },
    { field: "jobField", headerName: "직무분야", width: 110, ...center, valueFormatter: (value) => formatReferenceLabel(jobFieldLabelByValue, value) },
    { field: "specialtyField", headerName: "전문분야", width: 110, ...center, valueFormatter: (value) => formatReferenceLabel(specialtyFieldLabelByValue, value) },
  ], [canUpdate, jobFieldLabelByValue, specialtyFieldLabelByValue]);

  const contractColumns = useMemo<GridColDef<WorkOverlapEngineerContractRecord>[]>(() => buildWorkOverlapContractColumns(referenceDate, taskPeriodDays), [referenceDate, taskPeriodDays]);
  const savedContractColumns = useMemo<GridColDef<SavedContractRow>[]>(() => [
    {
      field: "displayOrder",
      headerName: "순번",
      width: 40,
      align: "center",
      headerAlign: "center",
      editable: canUpdate,
      sortComparator: (left, right) => Number(left ?? Number.MAX_SAFE_INTEGER) - Number(right ?? Number.MAX_SAFE_INTEGER),
      renderEditCell: (params: GridRenderEditCellParams<SavedContractRow, number | null>) => (
        <TextField
          autoFocus
          fullWidth
          onChange={(event) => void params.api.setEditCellValue({ field: params.field, id: params.id, value: event.target.value.replace(/\D/g, "") })}
          onFocus={(event) => event.currentTarget.select()}
          size="small"
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
          value={params.value ?? ""}
          variant="standard"
        />
      ),
    },
    ...contractColumns.map((column) => column as GridColDef<SavedContractRow>),
  ], [canUpdate, contractColumns]);

  const handleSelectBidNotice = (record: BidNoticeApiRecord) => {
    setSelectedBidNotice(record);
    setBidNoticeDialogOpen(false);
    setKeyword("");
    setActiveEngineerId("");
    setBidNoticeDetailOpen(false);
    setContractSelectionByEngineer({});
    setSavedContractNosByEngineer({});
    setSavedContractRowsByEngineer({});
    setEngineerRowOverrides({});
    setSelectedEngineerIds([]);
    setDeleteEngineerIds([]);
    setSelectedSavedContractNos([]);
    setDeleteSavedContractNos([]);
    setSavedContractPaginationModel((current) => ({ ...current, page: 0 }));
    setEngineerPaginationModel((current) => ({ ...current, page: 0 }));
    setContractPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const handleAddEngineers = async (engineerIds: string[]) => {
    if (!selectedBidNotice?.bidSeq || !workDutyId || engineerIds.length === 0) {
      return;
    }

    const currentRows = await listWorkOverlapDocumentEngineers(selectedBidNotice.bidSeq, workDutyId);
    const currentIds = new Set(currentRows.map((row) => row.engrId));
    const nextEngineers = currentRows.map((row) => ({
      engrId: row.engrId,
      displayOrder: row.displayOrder,
      responsibility: row.responsibility,
    }));
    let nextDisplayOrder = Math.max(0, ...currentRows.map((row) => row.displayOrder ?? 0));
    engineerIds.forEach((engrId) => {
      if (!currentIds.has(engrId)) {
        nextDisplayOrder += 1;
        nextEngineers.push({
          engrId,
          displayOrder: nextDisplayOrder,
          responsibility: null,
        });
      }
    });

    try {
      await replaceWorkOverlapDocumentEngineers({
        bidSeq: selectedBidNotice.bidSeq,
        workDutyId,
        engineers: nextEngineers,
      });
      setEngineerSelectDialogOpen(false);
      await targetEngineersQuery.refetch();
      showSuccess("선택 기술인을 추가했습니다.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "선택 기술인을 추가하지 못했습니다.");
    }
  };

  const handleReset = () => {
    setKeyword("");
    setReferenceDate(today());
    setTaskPeriodValue("365");
    setTaskPeriodUnit("일");
    setRemainingDays("90");
    setActiveEngineerId("");
    setContractSelectionByEngineer({});
    setSavedContractNosByEngineer({});
    setSavedContractRowsByEngineer({});
    setEngineerRowOverrides({});
    setSelectedEngineerIds([]);
    setDeleteEngineerIds([]);
    setSelectedSavedContractNos([]);
    setDeleteSavedContractNos([]);
    setSavedContractPaginationModel((current) => ({ ...current, page: 0 }));
    setEngineerPaginationModel((current) => ({ ...current, page: 0 }));
    setContractPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const handleContractSelectionChange = (model: GridRowSelectionModel) => {
    if (!activeEngineerId) {
      return;
    }

    // MUI DataGrid can represent "select all" as an exclude model. The
    // screen stores concrete contract numbers, so convert that model using
    // the rows currently loaded for the active server page.
    const selectedContractNos = model.type === "exclude"
      ? contractRows.filter((row) => !model.ids.has(row.contractNo)).map((row) => row.contractNo)
      : Array.from(model.ids, String);
    setContractSelectionByEngineer((current) => ({
      ...current,
      [activeEngineerId]: selectedContractNos,
    }));
  };

  const handleEngineerRowUpdate = async (updatedRow: EngineerRow, originalRow: EngineerRow) => {
    if (!canUpdate || !selectedBidNotice?.bidSeq) {
      return originalRow;
    }

    const rawPriority = updatedRow.priority;
    const rawResponsibility = String(updatedRow.responsibility ?? "");
    const nextPriority = rawPriority == null || String(rawPriority).trim() === "" ? null : Number(rawPriority);
    const priorityChanged = nextPriority !== originalRow.priority;
    const responsibilityChanged = rawResponsibility !== originalRow.responsibility;
    if (!priorityChanged && !responsibilityChanged) {
      return originalRow;
    }
    if ((priorityChanged && nextPriority == null) || (responsibilityChanged && !rawResponsibility.trim())) {
      return originalRow;
    }

    if (!workDutyId) {
      showError("PQ 작업자 정보를 확인할 수 없습니다.");
      return originalRow;
    }

    const nextRow = { ...updatedRow, priority: nextPriority, responsibility: rawResponsibility };
    try {
      await updateWorkOverlapDocumentEngineer({
        bidSeq: selectedBidNotice.bidSeq,
        engrId: updatedRow.engineerId,
        workDutyId,
        displayOrder: nextPriority,
        responsibility: rawResponsibility,
      });
      await targetEngineersQuery.refetch();
      setEngineerRowOverrides((current) => ({
        ...current,
        [updatedRow.engineerId]: { priority: nextPriority, responsibility: rawResponsibility },
      }));
      showSuccess("선택 기술인 정보를 저장했습니다.");
      return nextRow;
    } catch (error) {
      showError(error instanceof Error ? error.message : "선택 기술인 정보를 저장하지 못했습니다.");
      return originalRow;
    }
  };

  const handleAutoNumberEngineers = async () => {
    if (!canUpdate || !selectedBidNotice?.bidSeq || isAutoNumberingEngineers) {
      return;
    }

    const bidSeq = selectedBidNotice.bidSeq;
    const orderedRows = (engineerGridApiRef.current?.getSortedRows() ?? []) as EngineerRow[];
    if (orderedRows.length === 0) {
      setAutoNumberEngineersOpen(false);
      return;
    }

    setIsAutoNumberingEngineers(true);
    try {
      const updatedRows = orderedRows.map((row, index) => ({ ...row, priority: index + 1 }));
      await Promise.all(
        updatedRows.map((row) => {
          if (!workDutyId) {
            throw new Error("PQ 작업자 정보를 확인할 수 없습니다.");
          }
          return updateWorkOverlapDocumentEngineer({
            bidSeq,
            engrId: row.engineerId,
            workDutyId,
            displayOrder: Number(row.priority),
            responsibility: row.responsibility,
          });
        }),
      );
      setEngineerRowOverrides((current) => ({
        ...current,
        ...Object.fromEntries(updatedRows.map((row) => [row.engineerId, { priority: row.priority, responsibility: row.responsibility }])),
      }));
      await targetEngineersQuery.refetch();
      setEngineerRowOverrides({});
      showSuccess("현재 Grid 순서대로 순번을 저장했습니다.");
      setAutoNumberEngineersOpen(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : "자동 순번을 저장하지 못했습니다.");
    } finally {
      setIsAutoNumberingEngineers(false);
    }
  };

  const handleSaveContractSelection = async () => {
    if (!activeEngineerId) {
      return;
    }

    const previousRows = savedContractRowsByEngineer[activeEngineerId] ?? [];
    const previousByContractNo = new Map(previousRows.map((row) => [row.contractNo, row]));
    const existingSavedContractNos = savedContractNos ?? [];
    const contractNosToSave = Array.from(new Set([...existingSavedContractNos, ...selectedContractNos]));
    const nextRows = contractNosToSave.reduce<SavedContractRow[]>((rows, contractNo, index) => {
        const source = contractRows.find((row) => row.contractNo === contractNo);
        const previous = previousByContractNo.get(contractNo);
        if (!source && !previous) {
          return rows;
        }
        rows.push({
          ...(source ?? previous!),
          displayOrder: previous?.displayOrder ?? index + 1,
          responsibility: previous?.responsibility ?? "",
        });
        return rows;
      }, []);
    setSavedContractRowsByEngineer((current) => ({ ...current, [activeEngineerId]: nextRows }));
    setSavedContractNosByEngineer((current) => ({ ...current, [activeEngineerId]: contractNosToSave }));
    try {
      await replaceWorkOverlapDocumentTargets({
        bidSeq: selectedBidNotice?.bidSeq ?? 0,
        workDutyId,
        engineerId: activeEngineerId,
        contracts: nextRows.map((row) => ({ contractNo: row.contractNo, displayOrder: row.displayOrder, responsibility: row.responsibility })),
      });
      await activeEngineerContractsQuery.refetch();
      showSuccess("업무중복도 문서 생성 대상 계약을 저장했습니다.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "업무중복도 계약을 저장하지 못했습니다.");
    }
  };

  const handleSavedContractRowUpdate = async (updatedRow: SavedContractRow, originalRow: SavedContractRow) => {
    if (!canUpdate || !activeEngineerId || !selectedBidNotice?.bidSeq) {
      return originalRow;
    }

    const rawDisplayOrder = updatedRow.displayOrder as number | string | null;
    const rawResponsibility = String(updatedRow.responsibility ?? "");
    const isDisplayOrderCleared = rawDisplayOrder == null || String(rawDisplayOrder).trim() === "";
    const isResponsibilityCleared = rawResponsibility.trim() === "";
    const normalizedDisplayOrder = isDisplayOrderCleared ? null : Number(rawDisplayOrder);
    const displayOrderChanged = normalizedDisplayOrder !== originalRow.displayOrder;
    const responsibilityChanged = rawResponsibility !== originalRow.responsibility;
    if (!displayOrderChanged && !responsibilityChanged) {
      return originalRow;
    }
    if ((displayOrderChanged && isDisplayOrderCleared) || (responsibilityChanged && isResponsibilityCleared)) {
      return originalRow;
    }

    const normalizedRow: SavedContractRow = {
      ...updatedRow,
      displayOrder: normalizedDisplayOrder,
      responsibility: rawResponsibility,
    };
    const currentRows = savedContractRowsByEngineer[activeEngineerId] ?? persistedSavedContractRows;
    const nextRows = currentRows.map((row) => row.contractNo === normalizedRow.contractNo ? normalizedRow : row);

    try {
      await replaceWorkOverlapDocumentTargets({
        bidSeq: selectedBidNotice.bidSeq,
        workDutyId,
        engineerId: activeEngineerId,
        contracts: nextRows.map((row) => ({ contractNo: row.contractNo, displayOrder: row.displayOrder, responsibility: row.responsibility })),
      });
      setSavedContractRowsByEngineer((current) => ({ ...current, [activeEngineerId]: nextRows }));
      showSuccess("업무중복도 계약 정보를 저장했습니다.");
      return normalizedRow;
    } catch (error) {
      showError(error instanceof Error ? error.message : "업무중복도 계약 정보를 저장하지 못했습니다.");
      return originalRow;
    }
  };

  const handleSaveCurrentContractOrder = async () => {
    if (!activeEngineerId) {
      return;
    }
    const orderedRows = (savedContractGridApiRef.current?.getSortedRows() ?? []) as SavedContractRow[];
    const nextRows = orderedRows.map((row, index) => ({ ...row, displayOrder: index + 1 }));
    setSavedContractRowsByEngineer((current) => ({
      ...current,
      [activeEngineerId]: nextRows,
    }));
    try {
      await replaceWorkOverlapDocumentTargets({
        bidSeq: selectedBidNotice?.bidSeq ?? 0,
        workDutyId,
        engineerId: activeEngineerId,
        contracts: nextRows.map((row) => ({ contractNo: row.contractNo, displayOrder: row.displayOrder, responsibility: row.responsibility })),
      });
      await activeEngineerContractsQuery.refetch();
      showSuccess("현재 정렬로 순번을 저장했습니다.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "정렬 순서를 저장하지 못했습니다.");
    }
  };

  const handleSavedContractSelectionChange = (model: GridRowSelectionModel) => {
    setSelectedSavedContractNos(model.type === "exclude" ? savedContractRows.map((row) => row.contractNo) : Array.from(model.ids, String));
  };

  const handleRequestDeleteSavedContracts = () => {
    if (selectedSavedContractNos.length > 0) {
      setDeleteSavedContractNos(selectedSavedContractNos);
    }
  };

  const handleDeleteSavedContracts = async () => {
    if (!selectedBidNotice?.bidSeq || !activeEngineerId || deleteSavedContractNos.length === 0) {
      return;
    }
    setIsDeletingSavedContracts(true);
    try {
      await Promise.all(deleteSavedContractNos.map((contractNo) => deleteWorkOverlapDocumentTarget(selectedBidNotice.bidSeq!, workDutyId, activeEngineerId, contractNo)));
      setSelectedSavedContractNos([]);
      setDeleteSavedContractNos([]);
      await activeEngineerContractsQuery.refetch();
      showSuccess("선택한 업무중복도 계약을 삭제했습니다.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "업무중복도 계약을 삭제하지 못했습니다.");
    } finally {
      setIsDeletingSavedContracts(false);
    }
  };

  const handleRequestDeleteEngineers = () => {
    if (selectedEngineerIds.length > 0) {
      setDeleteEngineerIds(selectedEngineerIds);
    }
  };

  const handleDeleteEngineers = async () => {
    if (!selectedBidNotice?.bidSeq || deleteEngineerIds.length === 0) {
      return;
    }
    setIsDeletingEngineers(true);
    try {
      const targetEngineerIds = new Set(deleteEngineerIds);
      const targetRows = (targetEngineersQuery.data ?? []).filter((row) => targetEngineerIds.has(row.engrId));

      if (targetRows.length === 0) {
        throw new Error("삭제할 기술인이 없습니다.");
      }

      await Promise.all(targetRows.map((row) => deleteWorkOverlapDocumentEngineer(row.bidSeq, currentSession?.loginId ?? "", row.engrId)));
      setDeleteEngineerIds([]);
      setSelectedEngineerIds([]);
      if (activeEngineerId && targetEngineerIds.has(activeEngineerId)) {
        setActiveEngineerId("");
      }
      await targetEngineersQuery.refetch();
      showSuccess("선택한 기술인을 삭제했습니다.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "기술인을 삭제하지 못했습니다.");
    } finally {
      setIsDeletingEngineers(false);
    }
  };

  return (
    <>
      <PageHeader title="업무중복도 문서 생성" />
      {!canRead ? (
        <Alert severity="warning">업무중복도 문서 생성 조회 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack direction="row" spacing={1}>
                    <TextField fullWidth label="공고명" placeholder="공고문을 선택하세요." size="small" sx={fieldSx} value={selectedBidNotice?.projectName ?? ""} slotProps={{ input: { readOnly: true } }} />
                    <Button onClick={() => setBidNoticeDialogOpen(true)} disabled={!canRead} startIcon={<SearchOutlinedIcon />} sx={{ flex: "0 0 auto", minWidth: 100, whiteSpace: "nowrap" }} variant="outlined">선택</Button>
                    <Button onClick={() => setBidNoticeDetailOpen(true)} disabled={!selectedBidNotice || !canRead} startIcon={<VisibilityOutlinedIcon />} sx={{ flex: "0 0 auto", minWidth: 112, whiteSpace: "nowrap" }} variant="outlined">상세보기</Button>
                  </Stack>
                </Grid>
                {selectedBidNotice ? (
                  <>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}><TextField fullWidth label="발주처" size="small" sx={fieldSx} value={String(selectedBidNotice.orderClientName ?? selectedBidNotice.orderClient ?? "")} slotProps={{ input: { readOnly: true } }} /></Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.5 }}><TextField fullWidth label="공고일" size="small" sx={fieldSx} value={String(selectedBidNotice.announceDate ?? "").slice(0, 10)} slotProps={{ input: { readOnly: true } }} /></Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.5 }}><TextField fullWidth label="공고마감" size="small" sx={fieldSx} value={String(selectedBidNotice.bidClosingDate ?? "").slice(0, 10)} slotProps={{ input: { readOnly: true } }} /></Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}><TextField fullWidth label="기술인 검색" onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void targetEngineersQuery.refetch(); } }} size="small" sx={fieldSx} value={keyword} /></Grid>
                    <Grid size={{ xs: 12, sm: 8, md: 10 }}><Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "flex-end" }}><Button onClick={() => void targetEngineersQuery.refetch()} disabled={!selectedBidNotice || targetEngineersQuery.isFetching} startIcon={<SearchOutlinedIcon />} variant="contained">조회</Button><Button onClick={handleReset} startIcon={<RefreshOutlinedIcon />} variant="outlined">초기화</Button></Box></Grid>
                  </>
                ) : null}
              </Grid>


              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>
                업무중복도 조회조건
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <TextField fullWidth sx={{ width: { xs: "100%", sm: 170 } }} label="기준일" onChange={(event) => setReferenceDate(event.target.value)} size="small" type="date" value={referenceDate} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <TextField fullWidth sx={{ width: { xs: "100%", sm: 140 } }} label="과업기간" onChange={(event) => setTaskPeriodValue(event.target.value.replace(/\D/g, ""))} size="small" value={taskPeriodValue} slotProps={{ htmlInput: { inputMode: "numeric" } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <TextField fullWidth sx={{ width: { xs: "100%", sm: 140 } }} label="단위" onChange={(event) => setTaskPeriodUnit(event.target.value as "일" | "개월")} select size="small" value={taskPeriodUnit}>
                    <MenuItem value="일">일</MenuItem>
                    <MenuItem value="개월">개월</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <TextField fullWidth sx={{ width: { xs: "100%", sm: 140 } }} label="잔여일" onChange={(event) => setRemainingDays(event.target.value.replace(/\D/g, ""))} size="small" value={remainingDays} slotProps={{ htmlInput: { inputMode: "numeric" } }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box
            sx={{
              alignItems: { xs: "start", lg: "stretch" },
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", lg: selectorPanelCollapsed ? "minmax(0, 1fr)" : `${selectorPanelWidth}px minmax(0, 1fr)` },
            }}
          >
            {!selectorPanelCollapsed ? <Card sx={{ display: "flex", flexDirection: "column", height: { xs: "auto", lg: "100%" }, minWidth: 0, position: "relative", width: selectorPanelWidth }} variant="outlined">
              <CardContent sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">선택 기술인 목록</Typography>
                  <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>

                    <Button
                      disabled={!canUpdate || engineerRows.length === 0 || isAutoNumberingEngineers}
                      onClick={() => setAutoNumberEngineersOpen(true)}
                      size="small"
                      startIcon={<FormatListNumberedOutlinedIcon />}
                      sx={{ whiteSpace: "nowrap" }}
                      variant="outlined"
                    >
                      자동 순번
                    </Button>
                    <IconButton
                        aria-label="선택 기술인 추가"
                        color="primary"
                        disabled={(!canCreate && !canUpdate) || !selectedBidNotice || !workDutyId}
                        onClick={() => setEngineerSelectDialogOpen(true)}
                        size="small"
                        title="선택 기술인 추가"
                    >
                      <AddOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="선택한 기술인 삭제"
                      color="error"
                      disabled={!canDelete || selectedEngineerIds.length === 0 || isDeletingEngineers}
                      onClick={handleRequestDeleteEngineers}
                      size="small"
                      title="선택한 기술인 삭제"
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ flex: { xs: "0 0 auto", lg: 1 }, minHeight: 0 }}>
                  <EnterpriseDataGrid<EngineerRow>
                  apiRef={engineerGridApiRef}
                  columns={engineerColumns}
                  checkboxSelection
                  disableRowSelectionOnClick
                  getRowId={(row) => row.engineerId}
                  loading={targetEngineersQuery.isLoading || targetEngineersQuery.isFetching}
                  onCellClick={(params, event) => {
                    if (canUpdate && (params.field === "priority" || params.field === "responsibility")) {
                      if (params.api.getCellMode(params.id, params.field) !== "edit") {
                        params.api.startCellEditMode({ field: params.field, id: params.id });
                      }
                      event.stopPropagation();
                    }
                  }}
                  onRowClick={(params: GridRowParams<EngineerRow>) => { setActiveEngineerId(params.row.engineerId); setSelectedSavedContractNos([]); setDeleteSavedContractNos([]); setSavedContractPaginationModel((current) => ({ ...current, page: 0 })); setContractPaginationModel((current) => ({ ...current, page: 0 })); }}
                  onPaginationModelChange={setEngineerPaginationModel}
                  onRowSelectionModelChange={(model: GridRowSelectionModel) => setSelectedEngineerIds(Array.from(model.ids, String))}
                  processRowUpdate={canUpdate ? handleEngineerRowUpdate : undefined}
                  paginationModel={engineerPaginationModel}
                  pageSizeOptions={[25, 50, 100]}
                  rows={engineerRows}
                  rowSelectionModel={{ ids: new Set(selectedEngineerIds), type: "include" }}
                  rowHeight={30}
                  showPageNumbers
                    hideFooterSelectedRowCount
                    wrapperMinHeight={{ ...selectorGridHeight, lg: "100%" }}
                    sx={{ border: 0, height: { ...selectorGridHeight, lg: "100%" }, "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                  />
                </Box>
              </CardContent>
              <ResizeHandle
                ariaLabel="선택 기술인 목록 너비 조절"
                orientation="vertical"
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    setSelectorPanelWidth((width) => clampSelectorPanelWidth(width - 10));
                  }
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    setSelectorPanelWidth((width) => clampSelectorPanelWidth(width + 10));
                  }
                }}
                onPointerDown={handleSelectorResizePointerDown}
                sx={{ display: { xs: "none", lg: "flex" } }}
              />
            </Card> : null}

            <Box sx={{ alignContent: "start", display: "grid", gap: 0.5, gridTemplateRows: "auto auto", minWidth: 0 }}>
            <ResizableCard
              height={contractCardHeight}
              maxHeight={CONTRACT_CARD_MAX_HEIGHT}
              minHeight={CONTRACT_CARD_MIN_HEIGHT}
              onHeightChange={(height) => setContractCardHeight(clampContractCardHeight(height))}
              resizeEdges={["bottom"]}
              sx={{ minWidth: 0 }}
              variant="outlined"
            >
              <CardContent sx={{ boxSizing: "border-box", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden", pb: 0 }}>
                <Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} variant="h6">업무중복도 계약 내역</Typography>
                    {activeEngineer ? <Typography color="text.secondary" variant="body2">{activeEngineer.summary.name} ({activeEngineer.summary.id})</Typography> : <Typography color="text.secondary" variant="body2">기술인을 먼저 선택하세요.</Typography>}
                  </Box>
                  <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
                    <Tooltip title={selectorPanelCollapsed ? "선택 기술인 목록 펼치기" : "선택 기술인 목록 접기"}>
                      <IconButton
                        aria-label={selectorPanelCollapsed ? "선택 기술인 목록 펼치기" : "선택 기술인 목록 접기"}
                        color="primary"
                        onClick={() => setSelectorPanelCollapsed((collapsed) => !collapsed)}
                        size="small"
                      >
                        {selectorPanelCollapsed ? <KeyboardDoubleArrowRightOutlinedIcon fontSize="small" /> : <KeyboardDoubleArrowLeftOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Button
                      disabled={!canCreate && !canUpdate || !activeEngineer || activeEngineerContractsQuery.isFetching}
                      onClick={handleSaveContractSelection}
                      size="small"
                      startIcon={<AddOutlinedIcon />}
                      variant="contained"
                    >
                      추가
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: "repeat(3, minmax(0, 1fr))", mb: 1 }}>
                  <Box sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, display: "flex", gap: 0.75, justifyContent: "space-between", minWidth: 0, px: 1, py: 0.5 }}>
                    <BadgeOutlinedIcon color="primary" fontSize="small" />
                    <Typography color="text.secondary" noWrap variant="caption">선택 건수</Typography>
                    <Typography noWrap sx={{ fontWeight: 700, ml: "auto" }} variant="body2">{selectedContractRows.length}건</Typography>
                  </Box>
                  <Box sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, display: "flex", gap: 0.75, justifyContent: "space-between", minWidth: 0, px: 1, py: 0.5 }}>
                    <WorkOutlineOutlinedIcon color="success" fontSize="small" />
                    <Typography color="text.secondary" noWrap variant="caption">인정일수 합계</Typography>
                    <Typography noWrap sx={{ fontWeight: 700, ml: "auto" }} variant="body2">{recognizedDaysTotal.toLocaleString("ko-KR")}일</Typography>
                  </Box>
                  <Box sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, display: "flex", gap: 0.75, justifyContent: "space-between", minWidth: 0, px: 1, py: 0.5 }}>
                    <EngineeringOutlinedIcon color="warning" fontSize="small" />
                    <Typography color="text.secondary" noWrap variant="caption">업무 중복도</Typography>
                    <Typography noWrap sx={{ fontWeight: 700, ml: "auto" }} variant="body2">{overlapRate === null ? "-" : `${overlapRate.toFixed(1)}%`}</Typography>
                  </Box>
                </Box>
                {activeEngineer ? <Box sx={{ height: contractGridHeight, minHeight: 240, minWidth: 0, pb: 0.75 }}>
                  <EnterpriseDataGrid<WorkOverlapEngineerContractRecord>
                    checkboxSelection
                    columns={contractColumns}
                    getRowId={(row) => row.contractNo}
                    loading={activeEngineerContractsQuery.isLoading || activeEngineerContractsQuery.isFetching}
                    onPaginationModelChange={setContractPaginationModel}
                    onRowDoubleClick={(params) => setContractDetailRecord(params.row)}
                    onRowSelectionModelChange={handleContractSelectionChange}
                    paginationMode="server"
                    paginationModel={contractPaginationModel}
                    pageSizeOptions={[25, 50, 100]}
                    readOnly
                    rowCount={activeEngineerContractsQuery.data?.availableContracts.totalElements ?? 0}
                    rows={contractRows}
                    rowHeight={30}
                    rowSelectionModel={{ ids: new Set(selectedContractNos), type: "include" }}
                    showPageNumbers
                    wrapperMinHeight={contractGridHeight}
                    sx={{ height: contractGridHeight, minHeight: 240, width: "100%" }}
                  />
                </Box> : null}
              </CardContent>
            </ResizableCard>

            <ResizableCard
              height={savedContractCardHeight}
              maxHeight={SAVED_CONTRACT_CARD_MAX_HEIGHT}
              minHeight={SAVED_CONTRACT_CARD_MIN_HEIGHT}
              onHeightChange={(height) => setSavedContractCardHeight(clampSavedContractCardHeight(height))}
              resizeEdges={["bottom"]}
              variant="outlined"
            >
              <CardContent sx={{ boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 0.75, height: "100%", minHeight: 0, overflow: "hidden", pb: 0 }}>
                <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} variant="h6">저장된 업무중복도 계약</Typography>
                  </Box>
                  <Box sx={{ alignItems: "center", display: "flex", flex: "0 1 auto", flexWrap: "wrap", gap: 1, justifyContent: "flex-end", minWidth: 0 }}>
                    <Chip color="success" label={`저장 ${savedContractNos?.length ?? 0}건`} size="small" variant="outlined" />
                    <Button disabled={!canUpdate || savedContractRows.length === 0} onClick={handleSaveCurrentContractOrder} size="small" startIcon={<FormatListNumberedOutlinedIcon />} sx={{ whiteSpace: "nowrap" }} variant="outlined">
                      현재 정렬로 순번 저장
                    </Button>
                    <Button color="error" disabled={!canDelete || selectedSavedContractNos.length === 0 || isDeletingSavedContracts} onClick={handleRequestDeleteSavedContracts} size="small" startIcon={<DeleteOutlineOutlinedIcon />} sx={{ whiteSpace: "nowrap" }} variant="outlined">
                      삭제
                    </Button>
                  </Box>
                </Box>
                {selectorPanelCollapsed ? (
                  <Box
                    sx={{
                      bgcolor: "rgba(25, 118, 210, 0.06)",
                      border: "1px solid",
                      borderColor: "rgba(25, 118, 210, 0.22)",
                      borderRadius: 1,
                      color: "text.secondary",
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", sm: "max-content max-content max-content max-content" },
                      px: 1.25,
                      py: 0.75,
                      maxWidth: "100%",
                      width: { xs: "100%", sm: "fit-content" },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }} variant="caption">선택된 기술인</Typography>
                      <Typography noWrap sx={{ color: "text.primary", fontSize: 14, fontWeight: 800, lineHeight: 1.25, mt: 0.25 }}>
                        {activeEngineer ? `${activeEngineer.summary.name} (${activeEngineer.summary.id})` : "선택된 기술인이 없습니다."}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }} variant="caption">책임정도</Typography>
                      <Typography noWrap sx={{ color: "text.primary", fontSize: 13, fontWeight: 700, lineHeight: 1.25, mt: 0.25 }}>
                        {activeEngineerRow?.responsibility || "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }} variant="caption">직무분야</Typography>
                      <Typography noWrap sx={{ color: "text.primary", fontSize: 13, fontWeight: 700, lineHeight: 1.25, mt: 0.25 }}>
                        {activeEngineer ? formatReferenceLabel(jobFieldLabelByValue, activeEngineer.detail.jobField || activeEngineer.summary.workField) : "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }} variant="caption">전문분야</Typography>
                      <Typography noWrap sx={{ color: "text.primary", fontSize: 13, fontWeight: 700, lineHeight: 1.25, mt: 0.25 }}>
                        {activeEngineer ? formatReferenceLabel(specialtyFieldLabelByValue, activeEngineer.detail.specialtyField || activeEngineer.summary.specialtyField) : "-"}
                      </Typography>
                    </Box>
                  </Box>
                ) : null}
                {savedContractRows.length ? (
                  <Box sx={{ flex: 1, minHeight: 140, minWidth: 0, pb: 0.75 }}>
                    <EnterpriseDataGrid<SavedContractRow>
                    checkboxSelection
                    apiRef={savedContractGridApiRef}
                    columns={savedContractColumns}
                    editMode="cell"
                    getRowId={(row) => row.contractNo}
                    onCellClick={(params, event) => {
                      if (canUpdate && params.field === "displayOrder") {
                        if (params.api.getCellMode(params.id, params.field) !== "edit") {
                          params.api.startCellEditMode({ field: params.field, id: params.id });
                        }
                        event.stopPropagation();
                      }
                    }}
                    onRowDoubleClick={(params: GridRowParams<SavedContractRow>) => setContractDetailRecord(params.row)}
                    onPaginationModelChange={setSavedContractPaginationModel}
                    onRowSelectionModelChange={handleSavedContractSelectionChange}
                    processRowUpdate={canUpdate ? handleSavedContractRowUpdate : undefined}
                    readOnly={!canUpdate}
                    rowHeight={30}
                    rows={savedContractRows}
                    paginationModel={savedContractPaginationModel}
                    rowSelectionModel={{ ids: new Set(selectedSavedContractNos), type: "include" }}
                    pageSizeOptions={[25, 50, 100]}
                    showPageNumbers
                    showToolbar={false}
                    stateCacheKey={false}
                      wrapperMinHeight="100%"
                      sx={{ height: "100%", minHeight: 140, width: "100%", "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                    />
                  </Box>
                ) : (
                  <Alert severity="info">저장된 계약이 없습니다.</Alert>
                )}
              </CardContent>
            </ResizableCard>
          </Box>
          </Box>
          {selectedBidNotice ? (
            <WorkOverlapHwpxTemplateGenerationPanel
              bidNotice={selectedBidNotice}
              contracts={savedContractNos?.length ? visibleSavedContractRows : contractRows.filter((row) => selectedContractNos.includes(row.contractNo))}
              engineer={activeEngineer}
              engineerIds={engineerRows.map((row) => row.engineerId)}
              open
              referenceDate={referenceDate}
              workDutyId={workDutyId}
            />
          ) : null}
        </Stack>
      )}
      {bidNoticeDialogOpen ? <BidNoticeSelectDialog open onClose={() => setBidNoticeDialogOpen(false)} stateCacheKey="work-overlap-docs:bid-notice-select" onSelect={handleSelectBidNotice} /> : null}
      {engineerSelectDialogOpen ? (
        <EngineerSelectDialog
          assignedEngineerIds={engineerRows.map((row) => row.engineerId)}
          onClose={() => setEngineerSelectDialogOpen(false)}
          onSave={(engineerIds) => void handleAddEngineers(engineerIds)}
          open
          title={selectedBidNotice?.projectName ?? "선택 기술인"}
        />
      ) : null}
      {bidNoticeDetailOpen ? <BidNoticeDetailPopup bidSeq={selectedBidNotice?.bidSeq ?? null} onClose={() => setBidNoticeDetailOpen(false)} open readOnly /> : null}
      {contractDetailRecord ? <WorkOverlapContractDetailDialog
        deleteDisabled
        key={`work-overlap-contract-detail-${contractDetailRecord.contractNo}`}
        onClose={() => setContractDetailRecord(null)}
        onSave={() => undefined}
        open
        record={contractDetailRecord}
        saveDisabled
      /> : null}
      <ConfirmActionDialog
        loading={isAutoNumberingEngineers}
        message="현재 Grid에 표시된 순서대로 선택 기술인의 순번을 저장하시겠습니까?"
        onClose={() => { if (!isAutoNumberingEngineers) setAutoNumberEngineersOpen(false); }}
        onConfirm={() => void handleAutoNumberEngineers()}
        open={autoNumberEngineersOpen}
        title="자동 순번 저장"
      />
      <ConfirmDeleteDialog
        loading={isDeletingSavedContracts}
        message={`선택한 업무중복도 계약 ${deleteSavedContractNos.length}건을 삭제하시겠습니까?`}
        onClose={() => { if (!isDeletingSavedContracts) setDeleteSavedContractNos([]); }}
        onConfirm={() => void handleDeleteSavedContracts()}
        open={deleteSavedContractNos.length > 0}
      />
      <ConfirmDeleteDialog
        loading={isDeletingEngineers}
        message={`선택한 기술인 ${deleteEngineerIds.length}명을 삭제하시겠습니까?`}
        onClose={() => { if (!isDeletingEngineers) setDeleteEngineerIds([]); }}
        onConfirm={() => void handleDeleteEngineers()}
        open={deleteEngineerIds.length > 0}
      />
    </>
  );
}
