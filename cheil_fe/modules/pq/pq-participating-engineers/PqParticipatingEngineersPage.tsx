"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import type { GridPaginationModel, GridRowParams } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ResizableCard } from "@/components/common/ResizableCard";
import { attachedVerticalResizeHandleSx } from "@/components/common/ResizeHandle";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { readAuthSessionSnapshot } from "@/lib/auth/authSession";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { listCertifications } from "@/modules/code/certifications/api";
import { toSelectOptions, type SelectOption } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import type { BidNoticeRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { EngineerStatus } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import {
  type PqParticipatingEngineerCandidate,
  type PqParticipatingEngineerRecord,
} from "@/modules/pq/pq-participating-engineers/api";
import { usePqParticipatingEngineerMutations } from "@/modules/pq/pq-participating-engineers/application/usePqParticipatingEngineerMutations";
import { usePqParticipatingEngineerQueries } from "@/modules/pq/pq-participating-engineers/application/usePqParticipatingEngineerQueries";
import { usePqGridSelection } from "@/modules/pq/pq-participating-engineers/application/usePqGridSelection";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import { createCandidateEngineerColumns, createSelectedEngineerColumns, type SelectionClickEvent } from "@/modules/pq/pq-participating-engineers/presentation/gridColumns";
import { CandidateEngineerGrid } from "@/modules/pq/pq-participating-engineers/presentation/CandidateEngineerGrid";
import { PqParticipatingEngineerFilterFields, type PqParticipatingEngineerFilterValues } from "@/modules/pq/pq-participating-engineers/presentation/PqParticipatingEngineerFilterFields";
import { SelectedEngineerCard } from "@/modules/pq/pq-participating-engineers/presentation/SelectedEngineerCard";
import type { SelectedPqEngineer } from "@/modules/pq/pq-participating-engineers/domain/models";

const PqEngineerPerformanceTabs = dynamic(
  () => import("@/modules/pq/pq-participating-engineers/PqEngineerPerformanceTabs").then((module) => module.PqEngineerPerformanceTabs),
  { loading: () => <Box sx={{ minHeight: 240 }} />, ssr: false },
);
const BidNoticeSelectDialog = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeSelectDialog").then((module) => module.BidNoticeSelectDialog),
  { ssr: false },
);
const ConfirmActionDialog = dynamic(
  () => import("@/components/common/ConfirmActionDialog").then((module) => module.ConfirmActionDialog),
  { ssr: false },
);

type CodeOption = SelectOption;

type CandidateFilters = PqParticipatingEngineerFilterValues & {
  certificationCode: string;
  constructionManagementGrade: string;
  designGrade: string;
  jobField: string;
  keyword: string;
  status: EngineerStatus | "전체";
};

function toRetireYn(status: CandidateFilters["status"]) {
  if (status === "퇴직") {
    return "Y" as const;
  }
  if (status === "재직") {
    return "N" as const;
  }
  return undefined;
}

const emptyFilters = (): CandidateFilters => ({
  certificationCode: "",
  constructionManagementGrade: "",
  designGrade: "",
  jobField: "",
  keyword: "",
  referenceDate: todayInputValue(),
  remainingDays: "90",
  relatedProjectHistoryConditions: [],
  specialtyField: "",
  taskPeriodUnit: "일",
  taskPeriodValue: "365",
  status: "재직",
});

const keywordFilterSx = {
  flex: "0 1 220px",
  maxWidth: 240,
  minWidth: 190,
  width: "auto",
} as const;

const panelScrollHeight = { xs: 420, lg: "clamp(620px, calc(100vh - 300px), 800px)" } as const;
const todayInputValue = () => {
  const current = new Date();
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
};
const SELECTED_ENGINEER_CARD_DEFAULT_HEIGHT = 320;
const SELECTED_ENGINEER_CARD_GRID_OFFSET = 64;
const CANDIDATE_CARD_DEFAULT_WIDTH = 420;
const CANDIDATE_CARD_MIN_WIDTH = 320;
const CANDIDATE_CARD_MAX_WIDTH = 760;
const CANDIDATE_CARD_GRID_OFFSET = 68;
const PERFORMANCE_CARD_DEFAULT_HEIGHT = 520;
const PERFORMANCE_CARD_EXPANDED_HEIGHT = 920;
const PERFORMANCE_CARD_MIN_HEIGHT = 360;
const PERFORMANCE_CARD_MAX_HEIGHT = 1300;
const gridSx = {
  border: 0,
  "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
  "& .MuiDataGrid-columnHeader": { overflow: "hidden" },
  "& .MuiDataGrid-columnHeaderTitleContainer": { minWidth: 0, overflow: "hidden" },
  "& .MuiDataGrid-sortIcon": { flexShrink: 0, marginLeft: 0.5 },
  "& .MuiDataGrid-main": { overflow: "hidden" },
  "& .MuiDataGrid-virtualScroller": {
    overflowY: "auto",
    overscrollBehavior: "contain",
  },
} as const;

function toEngineerStatus(retireYn: "Y" | "N" | null | undefined): EngineerStatus {
  return retireYn === "Y" ? "퇴직" : "재직";
}

function toSelectedEngineer(candidate: PqParticipatingEngineerCandidate, nextPriority: number): SelectedPqEngineer {
  return {
    birthDate: candidate.birthDate ?? "",
    department: candidate.department ?? "",
    engineerId: candidate.engrId,
    jobField: candidate.jobField ?? "",
    memo: "",
    name: candidate.name ?? "",
    priority: nextPriority,
    role: "참여기술인",
    specialtyField: candidate.specialtyField ?? "",
    status: toEngineerStatus(candidate.retireYn),
    title: candidate.position ?? "",
  };
}

function toSelectedEngineerFromRecord(record: PqParticipatingEngineerRecord, index: number): SelectedPqEngineer {
  return {
    birthDate: record.birthDate ?? "",
    department: record.department ?? "",
    engineerId: record.engrId,
    jobField: record.jobField ?? "",
    memo: record.memo ?? "",
    name: record.name ?? "",
    priority: record.priority ?? index + 1,
    role: record.role ?? "참여기술인",
    specialtyField: record.specialtyField ?? "",
    status: toEngineerStatus(record.retireYn),
    title: record.position ?? "",
  };
}

function serializeSelectedEngineers(items: SelectedPqEngineer[]) {
  return items
    .map((engineer) => [engineer.engineerId, engineer.priority, engineer.role ?? "", engineer.memo ?? ""].join(":"))
    .join("|");
}

export function PqParticipatingEngineersPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const currentSession = useMemo(() => readAuthSessionSnapshot(), []);
  const workDutyId = currentSession?.loginId ?? "";
  const candidateClickTimerRef = useRef<number | null>(null);
  const [filters, setFilters] = useState<CandidateFilters>(() => emptyFilters());
  const [appliedFilters, setAppliedFilters] = useState<CandidateFilters>(() => emptyFilters());
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidatePageSize, setCandidatePageSize] = useState(100);
  const [candidateSearchRevision, setCandidateSearchRevision] = useState(0);
  const [candidateCardWidth, setCandidateCardWidth] = useState(CANDIDATE_CARD_DEFAULT_WIDTH);
  const [historyEngineerId, setHistoryEngineerId] = useState("");
  const [selectedCompanyPerformance, setSelectedCompanyPerformance] = useState<BidNoticeRecord | null>(null);
  const [companyPerformanceDialogOpen, setCompanyPerformanceDialogOpen] = useState(false);
  const [performanceFocusMode, setPerformanceFocusMode] = useState(false);
  const [performanceCardHeight, setPerformanceCardHeight] = useState(PERFORMANCE_CARD_DEFAULT_HEIGHT);
  const [selectedEngineerCardHeight, setSelectedEngineerCardHeight] = useState(SELECTED_ENGINEER_CARD_DEFAULT_HEIGHT);
  const [selectedEngineers, setSelectedEngineers] = useState<SelectedPqEngineer[]>([]);
  const [selectedEngineerSnapshot, setSelectedEngineerSnapshot] = useState("");
  const [pendingBulkDeleteEngineerIds, setPendingBulkDeleteEngineerIds] = useState<string[] | null>(null);
  const { showSnackbar } = useAppSnackbar();

  const gradeReferences = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: tabQueryEnabled });

  const certificationsQuery = useQuery({
    queryKey: ["code-certifications"],
    queryFn: listCertifications,
    enabled: tabQueryEnabled && Boolean(selectedCompanyPerformance?.bidSeq),
  });

  const { candidates, candidatesPage, candidatesQuery, selectedEngineersQuery } = usePqParticipatingEngineerQueries({
    appliedFilters,
    bidSeq: selectedCompanyPerformance?.bidSeq ?? undefined,
    candidatePage,
    candidatePageSize,
    candidateSearchRevision,
    enabled: tabQueryEnabled,
    retireYn: toRetireYn(appliedFilters.status),
    workDutyId,
  });

  const gradeOptions = useMemo<CodeOption[]>(() => toSelectOptions(gradeReferences.options), [gradeReferences.options]);
  const jobFieldOptions = useMemo<CodeOption[]>(() => toSelectOptions(jobFieldReferences.options), [jobFieldReferences.options]);
  const specialtyFieldOptions = useMemo<CodeOption[]>(() => toSelectOptions(specialtyFieldReferences.options), [specialtyFieldReferences.options]);

  const certificationOptions = useMemo<CodeOption[]>(
    () =>
      (certificationsQuery.data ?? []).map((certification) => ({
        label: certification.certName,
        value: certification.certCode,
      })),
    [certificationsQuery.data],
  );

  const labelByJobField = jobFieldReferences.labelByValue;
  const labelBySpecialtyField = specialtyFieldReferences.labelByValue;
  const labelByGrade = gradeReferences.labelByValue;

  useEffect(() => {
    if (!selectedEngineersQuery.data) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      const nextSelectedEngineers = selectedEngineersQuery.data.map(toSelectedEngineerFromRecord);
      setSelectedEngineers(nextSelectedEngineers);
      setSelectedEngineerSnapshot(serializeSelectedEngineers(nextSelectedEngineers));
      setPendingBulkDeleteEngineerIds(null);
      setHistoryEngineerId((current) =>
        current && nextSelectedEngineers.some((engineer) => engineer.engineerId === current)
          ? current
          : nextSelectedEngineers[0]?.engineerId ?? "",
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [selectedEngineersQuery.data]);

  const selectedEngineerRowIds = useMemo(() => selectedEngineers.map((engineer) => engineer.engineerId), [selectedEngineers]);
  const candidateRowIds = useMemo(() => candidates.map((candidate) => candidate.engrId), [candidates]);
  const candidateSelection = usePqGridSelection({ rowIds: candidateRowIds });
  const selectedEngineerSelection = usePqGridSelection({ rowIds: selectedEngineerRowIds });
  const {
    allSelected: allCandidatesSelected,
    clear: clearCandidateSelection,
    handleSelection: handleCandidateSelection,
    selectedIdSet: selectedCandidateIdSet,
    setSelectedIds: setSelectedCandidateIds,
    setSelectionAnchorId: setCandidateSelectionAnchorId,
    someSelected: someCandidatesSelected,
    toggleAll: toggleAllCandidates,
  } = candidateSelection;
  const {
    allSelected: allSelectedEngineersSelected,
    clear: clearSelectedEngineerSelection,
    handleSelection: handleSelectedEngineerSelection,
    selectedIdSet: selectedEngineerIdSet,
    selectedIds: selectedEngineerIds,
    setSelectedIds: setSelectedEngineerIds,
    someSelected: someSelectedEngineersSelected,
    toggleAll: toggleAllSelectedEngineers,
  } = selectedEngineerSelection;
  const selectedCandidateRows = useMemo(
    () => candidates.filter((candidate) => selectedCandidateIdSet.has(candidate.engrId)),
    [candidates, selectedCandidateIdSet],
  );
  const candidateRowCount = candidatesPage.totalElements;
  const selectedEngineerSignature = useMemo(() => serializeSelectedEngineers(selectedEngineers), [selectedEngineers]);
  const hasUnsavedSelectedEngineerChanges = selectedEngineerSignature !== selectedEngineerSnapshot;

  const handleSavedSelectedEngineers = useCallback((records: PqParticipatingEngineerRecord[]) => {
    const nextSelectedEngineers = records.map(toSelectedEngineerFromRecord);
    setSelectedEngineers(nextSelectedEngineers);
    setSelectedEngineerSnapshot(serializeSelectedEngineers(nextSelectedEngineers));
    showSnackbar({ message: "PQ참여 기술인 목록을 저장했습니다.", severity: "success" });
  }, [showSnackbar]);

  const handleRemovedSelectedEngineers = useCallback((removedIds: string[]) => {
    const removedIdSet = new Set(removedIds);
    const nextSelectedEngineers = selectedEngineers
      .filter((engineer) => !removedIdSet.has(engineer.engineerId))
      .map((engineer, index) => ({ ...engineer, priority: index + 1 }));
    setSelectedEngineers(nextSelectedEngineers);
    setSelectedEngineerSnapshot(serializeSelectedEngineers(nextSelectedEngineers));
    setSelectedEngineerIds((current) => current.filter((id) => !removedIdSet.has(id)));
    setPendingBulkDeleteEngineerIds(null);
    setHistoryEngineerId((current) => removedIdSet.has(current) ? nextSelectedEngineers[0]?.engineerId ?? "" : current);
    showSnackbar({ message: `선정 기술인 ${removedIds.length}명을 삭제했습니다.`, severity: "success" });
  }, [selectedEngineers, setSelectedEngineerIds, showSnackbar]);

  const handleEngineerMutationError = useCallback((error: unknown) => {
    showSnackbar({ message: error instanceof Error ? error.message : "선정 기술인 처리에 실패했습니다.", severity: "error" });
  }, [showSnackbar]);

  const { removeMutation: removeSelectedEngineersMutation, saveMutation: saveSelectedEngineersMutation } = usePqParticipatingEngineerMutations({
    bidSeq: selectedCompanyPerformance?.bidSeq ?? null,
    currentLoginId: currentSession?.loginId ?? "",
    onError: handleEngineerMutationError,
    onRemoved: handleRemovedSelectedEngineers,
    onSaved: handleSavedSelectedEngineers,
    selectedEngineers,
    workDutyId,
  });

  const stageCandidates = useCallback(
    (candidatesToAdd: PqParticipatingEngineerCandidate[]) => {
      if (!canCreate) {
        showSnackbar({ message: "PQ참여 기술인 추가 권한이 없습니다.", severity: "error" });
        return;
      }
      if (!selectedCompanyPerformance?.bidSeq) {
        showSnackbar({ message: "PQ참여할 공고문을 먼저 선택하세요.", severity: "error" });
        return;
      }
      if (!workDutyId) {
        showSnackbar({ message: "로그인 작업자 정보를 확인할 수 없습니다.", severity: "error" });
        return;
      }

      const existingIds = new Set(selectedEngineers.map((engineer) => engineer.engineerId));
      const uniqueCandidates = candidatesToAdd.filter((candidate) => !existingIds.has(candidate.engrId));

      if (uniqueCandidates.length === 0) {
        showSnackbar({ message: "이미 선정 목록에 포함된 기술인입니다.", severity: "info" });
        return;
      }

      setSelectedEngineers((current) => {
        const currentIds = new Set(current.map((engineer) => engineer.engineerId));
        const nextEntries = uniqueCandidates.filter((candidate) => !currentIds.has(candidate.engrId));

        if (nextEntries.length === 0) {
          return current;
        }

        return [...nextEntries.map((candidate, index) => toSelectedEngineer(candidate, current.length + index + 1)), ...current];
      });
      setSelectedCandidateIds([]);
      setCandidateSelectionAnchorId(null);
      setHistoryEngineerId((current) => current || uniqueCandidates[0]?.engrId || "");
      showSnackbar({
        message: `후보 기술인 ${uniqueCandidates.length}명을 선정 목록에 추가했습니다. 저장 버튼을 눌러 반영하세요.`,
        severity: "success",
      });
    },
    [canCreate, selectedCompanyPerformance?.bidSeq, selectedEngineers, setCandidateSelectionAnchorId, setSelectedCandidateIds, showSnackbar, workDutyId],
  );

  const clearCandidateClickTimer = useCallback(() => {
    if (candidateClickTimerRef.current !== null) {
      window.clearTimeout(candidateClickTimerRef.current);
      candidateClickTimerRef.current = null;
    }
  }, []);

  const addSelectedCandidates = useCallback(() => {
    if (!canCreate) {
      showSnackbar({ message: "PQ참여 기술인 추가 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!selectedCompanyPerformance?.bidSeq) {
      showSnackbar({ message: "PQ참여할 공고문을 먼저 선택하세요.", severity: "error" });
      return;
    }

    const candidatesToAdd = candidates.filter((candidate) => selectedCandidateIdSet.has(candidate.engrId));
    if (candidatesToAdd.length === 0) {
      showSnackbar({ message: "추가할 후보기술인를 먼저 선택해 주세요.", severity: "info" });
      return;
    }

    setSelectedEngineers((current) => {
      const existing = new Set(current.map((engineer) => engineer.engineerId));
      const nextEntries = candidatesToAdd.filter((candidate) => !existing.has(candidate.engrId));

      if (nextEntries.length === 0) {
        showSnackbar({ message: "이미 선정 목록에 포함된 기술인입니다.", severity: "info" });
        return current;
      }

      return [...nextEntries.map((candidate, index) => toSelectedEngineer(candidate, current.length + index + 1)), ...current];
    });

    setSelectedCandidateIds([]);
    setCandidateSelectionAnchorId(null);
  }, [canCreate, candidates, selectedCandidateIdSet, selectedCompanyPerformance?.bidSeq, setCandidateSelectionAnchorId, setSelectedCandidateIds, showSnackbar]);

  const handleCandidateRowClick = useCallback(
    (params: GridRowParams<PqParticipatingEngineerCandidate>, event: SelectionClickEvent) => {
      clearCandidateClickTimer();
      setHistoryEngineerId(params.row.engrId);
      handleCandidateSelection(params.row.engrId, event);
    },
    [clearCandidateClickTimer, handleCandidateSelection],
  );

  const handleCandidateRowDoubleClick = useCallback(
    (params: GridRowParams<PqParticipatingEngineerCandidate>) => {
      clearCandidateClickTimer();
      setHistoryEngineerId(params.row.engrId);
      stageCandidates([params.row]);
    },
    [clearCandidateClickTimer, stageCandidates],
  );

  useEffect(() => () => clearCandidateClickTimer(), [clearCandidateClickTimer]);

  const handleSelectedEngineerRowClick = useCallback(
    (params: GridRowParams<SelectedPqEngineer>, event: SelectionClickEvent) => {
      setHistoryEngineerId(params.row.engineerId);
      handleSelectedEngineerSelection(params.row.engineerId, event);
    },
    [handleSelectedEngineerSelection],
  );

  const removeSelectedEngineers = useCallback(() => {
    if (!canDelete) {
      showSnackbar({ message: "PQ참여 기술인를 제외할 권한이 없습니다.", severity: "error" });
      return;
    }

    const nextIds = selectedEngineerIds.length > 0 ? selectedEngineerIds : [];
    if (nextIds.length === 0) {
      showSnackbar({ message: "삭제할 선정 기술인를 먼저 선택해 주세요.", severity: "info" });
      return;
    }

    setPendingBulkDeleteEngineerIds(nextIds);
  }, [canDelete, selectedEngineerIds, showSnackbar]);

  const confirmRemoveSelectedEngineers = useCallback(() => {
    if (!pendingBulkDeleteEngineerIds || pendingBulkDeleteEngineerIds.length === 0) {
      return;
    }
    removeSelectedEngineersMutation.mutate(pendingBulkDeleteEngineerIds);
  }, [pendingBulkDeleteEngineerIds, removeSelectedEngineersMutation]);

  const cancelRemoveSelectedEngineers = useCallback(() => {
    setPendingBulkDeleteEngineerIds(null);
  }, []);


  const applyRelatedProjectHistoryConditions = (conditions: RelatedProjectHistoryCondition[]) => {
    setCandidatePage(0);
    setSelectedCandidateIds([]);
    setCandidateSelectionAnchorId(null);
    const nextFilters = {
      ...filters,
      relatedProjectHistoryConditions: conditions,
    };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  const handleSearch = (keyword: string) => {
    setCandidatePage(0);
    setSelectedCandidateIds([]);
    setCandidateSelectionAnchorId(null);
    setCandidateSearchRevision((revision) => revision + 1);
    setAppliedFilters({ ...filters, keyword });
  };

  const resetEngineerContext = useCallback((clearCompanyPerformance = false) => {
    setCandidatePage(0);
    setSelectedEngineers([]);
    setSelectedEngineerSnapshot("");
    clearSelectedEngineerSelection();
    setPendingBulkDeleteEngineerIds(null);
    clearCandidateSelection();
    setHistoryEngineerId("");
    if (clearCompanyPerformance) {
      setSelectedCompanyPerformance(null);
    }
  }, [clearCandidateSelection, clearSelectedEngineerSelection]);

  const handleReset = () => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    resetEngineerContext(true);
  };

  const handleSave = () => {
    if (!canUpdate && !canCreate) {
      showSnackbar({ message: "PQ참여 기술인 목록을 저장할 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!selectedCompanyPerformance?.bidSeq) {
      showSnackbar({ message: "PQ참여할 공고문을 먼저 선택하세요.", severity: "error" });
      return;
    }
    if (!hasUnsavedSelectedEngineerChanges) {
      showSnackbar({ message: "저장할 변경사항이 없습니다.", severity: "info" });
      return;
    }
    saveSelectedEngineersMutation.mutate();
  };

  const candidateColumns = useMemo(
    () => createCandidateEngineerColumns({
      allSelected: allCandidatesSelected,
      candidatesCount: candidates.length,
      labelByGrade,
      labelByJobField,
      labelBySpecialtyField,
      onSelect: handleCandidateSelection,
      onToggleAll: toggleAllCandidates,
      selectedIds: selectedCandidateIdSet,
      someSelected: someCandidatesSelected,
    }),
    [allCandidatesSelected, candidates.length, handleCandidateSelection, labelByGrade, labelByJobField, labelBySpecialtyField, selectedCandidateIdSet, someCandidatesSelected, toggleAllCandidates],
  );

  const selectedColumns = useMemo(
    () => createSelectedEngineerColumns({
      allSelected: allSelectedEngineersSelected,
      engineersCount: selectedEngineers.length,
      labelByJobField,
      labelBySpecialtyField,
      onSelect: handleSelectedEngineerSelection,
      onToggleAll: toggleAllSelectedEngineers,
      selectedIds: selectedEngineerIdSet,
      someSelected: someSelectedEngineersSelected,
    }),
    [allSelectedEngineersSelected, handleSelectedEngineerSelection, labelByJobField, labelBySpecialtyField, selectedEngineerIdSet, selectedEngineers.length, someSelectedEngineersSelected, toggleAllSelectedEngineers],
  );

  const candidatePaginationModel = useMemo<GridPaginationModel>(
    () => ({ page: candidatePage, pageSize: candidatePageSize }),
    [candidatePage, candidatePageSize],
  );
  const selectedEngineerGridHeight = Math.max(
    140,
    (performanceFocusMode ? performanceCardHeight : selectedEngineerCardHeight) - SELECTED_ENGINEER_CARD_GRID_OFFSET,
  );
  const candidateCardHeight = selectedEngineerCardHeight + performanceCardHeight + 16;
  const candidateGridHeight = Math.max(180, candidateCardHeight - CANDIDATE_CARD_GRID_OFFSET);
  const selectedEngineerCard = (
    <SelectedEngineerCard
      canCreate={canCreate}
      canDelete={canDelete}
      canUpdate={canUpdate}
      candidateCardWidth={candidateCardWidth}
      columns={selectedColumns}
      focusHeight={performanceCardHeight}
      gridHeight={selectedEngineerGridHeight}
      hasUnsavedChanges={hasUnsavedSelectedEngineerChanges}
      height={selectedEngineerCardHeight}
      onHeightChange={setSelectedEngineerCardHeight}
      onRemove={removeSelectedEngineers}
      onRowClick={handleSelectedEngineerRowClick}
      onSave={handleSave}
      onToggleFocus={() => setPerformanceFocusMode((focused) => !focused)}
      onWidthChange={setCandidateCardWidth}
      performanceFocusMode={performanceFocusMode}
      rows={selectedEngineers}
      savePending={saveSelectedEngineersMutation.isPending}
      selectedIds={selectedEngineerIdSet}
      sx={gridSx}
    />
  );

  return (
    <Box>
      <PageHeader title="PQ참여 기술인 관리" />

      <SearchPanel
        keyword={filters.keyword}
        keywordLabel="기술인명"
        keywordPlaceholder="성명, 부서, 직위"
        keywordSx={keywordFilterSx}
        keywordIndex={1}
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <PqParticipatingEngineerFilterFields
          bidSeq={selectedCompanyPerformance?.bidSeq ?? null}
          certificationOptions={certificationOptions}
          companyPerformanceName={selectedCompanyPerformance?.projectName ?? ""}
          designGradeOptions={gradeOptions}
          disabled={!canRead}
          filters={filters}
          jobFieldOptions={jobFieldOptions}
          onApplyRelatedProjectHistoryConditions={applyRelatedProjectHistoryConditions}
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          onOpenCompanyPerformance={() => setCompanyPerformanceDialogOpen(true)}
          specialtyFieldOptions={specialtyFieldOptions}
        />
      </SearchPanel>

      {!canRead ? (
        <Alert severity="warning">PQ참여 기술인를 조회할 권한이 없습니다.</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid
            size={{ xs: 12, lg: "auto" }}
            sx={{
              flex: { lg: `0 0 ${candidateCardWidth}px !important` },
              flexBasis: { lg: `${candidateCardWidth}px !important` },
              flexShrink: { lg: "0 !important" },
              maxWidth: { lg: `${candidateCardWidth}px !important` },
              overflow: "visible",
              position: "relative",
              width: { lg: `${candidateCardWidth}px !important` },
              zIndex: 2,
            }}
          >
            {!performanceFocusMode ? <ResizableCard
              maxWidth={CANDIDATE_CARD_MAX_WIDTH}
              minWidth={CANDIDATE_CARD_MIN_WIDTH}
              onWidthChange={setCandidateCardWidth}
              resizeEdges={["right"]}
              handleSx={attachedVerticalResizeHandleSx}
              width={candidateCardWidth}
              sx={{ boxSizing: "border-box", height: { xs: "auto", lg: candidateCardHeight }, overflow: "visible", width: { xs: "100%", lg: candidateCardWidth } }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", pb: 0, px: 2, pt: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Box>
                    <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
                      <Typography sx={{ fontWeight: 800 }} variant="h6">
                        {"후보 기술인"}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Chip label={`선택 ${selectedCandidateRows.length}명`} size="small" variant={selectedCandidateRows.length > 0 ? "filled" : "outlined"} />
                    <Chip label={`총 ${candidatesPage.totalElements}명`} size="small" variant="outlined" />
                    <Button
                      disabled={!canCreate || selectedCandidateRows.length === 0}
                      onClick={addSelectedCandidates}
                      startIcon={<AddOutlinedIcon />}
                      size="small"
                      variant="contained"
                    >
                      {"추가"}
                    </Button>
                  </Stack>
                </Box>
                <CandidateEngineerGrid
                  columns={candidateColumns}
                  loading={candidatesQuery.isLoading || candidatesQuery.isFetching}
                  onPaginationModelChange={(model) => {
                    setCandidatePage(model.pageSize !== candidatePageSize ? 0 : model.page);
                    setCandidatePageSize(model.pageSize);
                    setSelectedCandidateIds([]);
                    setCandidateSelectionAnchorId(null);
                  }}
                  onRowClick={handleCandidateRowClick}
                  onRowDoubleClick={handleCandidateRowDoubleClick}
                  paginationModel={candidatePaginationModel}
                  rowCount={candidateRowCount}
                  rows={candidates}
                  selectedCandidateIdSet={selectedCandidateIdSet}
                  height={candidateGridHeight}
                  sx={{ ...gridSx, height: { xs: 420, lg: candidateGridHeight } }}
                />
              </CardContent>
            </ResizableCard>
            : selectedEngineerCard}
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }} sx={{ flex: { lg: "1 1 0" }, flexBasis: { lg: 0 }, minWidth: 0, width: { lg: 0 } }}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateRows: performanceFocusMode
                  ? { xs: "auto", lg: "1fr" }
                  : { xs: "auto auto", lg: `${selectedEngineerCardHeight}px ${performanceCardHeight}px` },
                height: performanceFocusMode
                  ? { xs: "auto", lg: `${performanceCardHeight}px` }
                  : { xs: "auto", lg: `${selectedEngineerCardHeight + performanceCardHeight + 16}px` },
                minHeight: 0,
              }}
            >
              {!performanceFocusMode ? selectedEngineerCard : null}

              <ResizableCard
                height={performanceCardHeight}
                maxHeight={PERFORMANCE_CARD_MAX_HEIGHT}
                minHeight={PERFORMANCE_CARD_MIN_HEIGHT}
                onHeightChange={setPerformanceCardHeight}
                onResizeHandleClick={(edge) => {
                  if (edge !== "bottom") {
                    return;
                  }
                  setPerformanceCardHeight((currentHeight) =>
                    currentHeight >= PERFORMANCE_CARD_EXPANDED_HEIGHT
                      ? PERFORMANCE_CARD_DEFAULT_HEIGHT
                      : PERFORMANCE_CARD_EXPANDED_HEIGHT,
                  );
                }}
                resizeEdges={["bottom"]}
                sx={{ height: { xs: "auto", lg: performanceFocusMode ? "100%" : performanceCardHeight }, minHeight: 0, minWidth: 0 }}
              >
                  <CardContent
                    sx={{
                    height: { xs: panelScrollHeight, lg: "100%" },
                    minHeight: 0,
                    overflowY: "auto",
                    overscrollBehavior: "contain",
                    p: 2,
                  }}
                >
                  {historyEngineerId ? <PqEngineerPerformanceTabs
                    canRead={canRead}
                    engineerId={historyEngineerId}
                    relatedProjectHistoryConditions={filters.relatedProjectHistoryConditions}
                    referenceDate={appliedFilters.referenceDate}
                    remainingDays={appliedFilters.remainingDays}
                    taskPeriodUnit={appliedFilters.taskPeriodUnit}
                    taskPeriodValue={appliedFilters.taskPeriodValue}
                    cardHeight={performanceCardHeight}
                    defaultPageSize={performanceFocusMode ? 25 : 10}
                  /> : (
                    <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 240 }}>
                      <Typography color="text.secondary" variant="body2">
                        기술인을 선택하면 실적이 표시됩니다.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </ResizableCard>
            </Box>
          </Grid>
        </Grid>
      )}

      {pendingBulkDeleteEngineerIds?.length ? (
        <ConfirmActionDialog
        confirmColor="error"
        confirmLabel="제외"
        enableKeyboardActions
        loading={removeSelectedEngineersMutation.isPending}
        message={`선택된 ${pendingBulkDeleteEngineerIds?.length ?? 0}명의 선정 기술인를 목록에서 제외합니다.`}
        open
        targetLabel="선정 기술인"
        title="선택 제외 확인"
        onClose={cancelRemoveSelectedEngineers}
        onConfirm={confirmRemoveSelectedEngineers}
        />
      ) : null}

      {companyPerformanceDialogOpen ? (
        <BidNoticeSelectDialog
        onClose={() => setCompanyPerformanceDialogOpen(false)}
        onSelect={(record) => {
          resetEngineerContext();
          setSelectedCompanyPerformance(record);
          setCompanyPerformanceDialogOpen(false);
        }}
        open
        />
      ) : null}
    </Box>
  );
}
