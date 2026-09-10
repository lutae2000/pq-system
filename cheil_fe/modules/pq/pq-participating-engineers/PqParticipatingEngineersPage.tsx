"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRowParams } from "@mui/x-data-grid";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { RelatedProjectHistoryConditionsPanel } from "@/components/common/RelatedProjectHistoryConditionsPanel";
import { ResizableCard } from "@/components/common/ResizableCard";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { readAuthSessionSnapshot } from "@/lib/auth/authSession";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { listCertifications } from "@/modules/code/certifications/api";
import { formatReferenceLabel, toSelectOptions, type SelectOption } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import type { BidNoticeRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { EngineerStatus } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import {
  deletePqParticipatingEngineer,
  listPqParticipatingEngineerCandidates,
  listPqParticipatingEngineers,
  replacePqParticipatingEngineers,
  type PqParticipatingEngineerCandidate,
  type PqParticipatingEngineerRecord,
} from "@/modules/pq/pq-participating-engineers/api";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import { deleteWorkOverlapDocumentEngineer, replaceWorkOverlapDocumentEngineers } from "@/modules/work-overlap/engineers/api";

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

type CandidateFilters = {
  certificationCode: string;
  constructionManagementGrade: string;
  designGrade: string;
  jobField: string;
  keyword: string;
  referenceDate: string;
  remainingDays: string;
  relatedProjectHistoryConditions: RelatedProjectHistoryCondition[];
  specialtyField: string;
  taskPeriodUnit: "일" | "개월";
  taskPeriodValue: string;
  status: EngineerStatus | "전체";
};

type SelectedPqEngineer = {
  birthDate: string;
  department: string;
  engineerId: string;
  jobField: string;
  memo: string;
  name: string;
  priority: number;
  role: string;
  specialtyField: string;
  status: EngineerStatus;
  title: string;
};

type SelectionClickEvent = {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
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

const filterAutocompleteSx = {
  flex: "0 1 140px",
  maxWidth: 155,
  minWidth: 125,
  width: "auto",
} as const;

const keywordFilterSx = {
  flex: "0 1 220px",
  maxWidth: 240,
  minWidth: 190,
  width: "auto",
} as const;

const certificationFilterSx = {
  ...filterAutocompleteSx,
  flex: "0 1 220px",
  maxWidth: 240,
  minWidth: 190,
} as const;

const companyPerformanceRowSx = {
  flex: "0 0 100% !important",
  flexBasis: "100% !important",
  maxWidth: "100% !important",
  minWidth: 0,
  width: "100%",
} as const;

const companyPerformanceFilterSx = {
  display: "flex",
  gap: 0.75,
  maxWidth: 760,
  minWidth: 0,
  width: "100%",
} as const;

const panelScrollHeight = { xs: 420, lg: "clamp(620px, calc(100vh - 300px), 800px)" } as const;
const todayInputValue = () => {
  const current = new Date();
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
};
const formatBirthDate = (value: string | null | undefined) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length !== 8) {
    return value ?? "";
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};
const SELECTED_ENGINEER_CARD_DEFAULT_HEIGHT = 320;
const SELECTED_ENGINEER_CARD_MIN_HEIGHT = 240;
const SELECTED_ENGINEER_CARD_MAX_HEIGHT = 560;
const SELECTED_ENGINEER_CARD_GRID_OFFSET = 104;
const CANDIDATE_CARD_DEFAULT_WIDTH = 420;
const CANDIDATE_CARD_MIN_WIDTH = 320;
const CANDIDATE_CARD_MAX_WIDTH = 760;
const CANDIDATE_CARD_GRID_OFFSET = 104;
const PERFORMANCE_CARD_DEFAULT_HEIGHT = 520;
const PERFORMANCE_CARD_EXPANDED_HEIGHT = 920;
const PERFORMANCE_CARD_MIN_HEIGHT = 360;
const PERFORMANCE_CARD_MAX_HEIGHT = 1300;
const selectedEngineerActionButtonSx = { minWidth: 128 } as const;

const gridSx = {
  border: 0,
  height: panelScrollHeight,
  "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
  "& .MuiDataGrid-main": { overflow: "hidden" },
  "& .MuiDataGrid-virtualScroller": {
    overflowY: "auto",
    overscrollBehavior: "contain",
  },
} as const;


function formatStatusChip(status: EngineerStatus) {
  const color = status === "재직" ? "success" : status === "퇴직" ? "warning" : "default";
  return <Chip color={color} label={status} size="small" variant={status === "재직" ? "filled" : "outlined"} />;
}

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
  const queryClient = useQueryClient();
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
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);
  const [selectedEngineerSelectionAnchorId, setSelectedEngineerSelectionAnchorId] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [candidateSelectionAnchorId, setCandidateSelectionAnchorId] = useState<string | null>(null);
  const [pendingBulkDeleteEngineerIds, setPendingBulkDeleteEngineerIds] = useState<string[] | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const gradeReferences = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: tabQueryEnabled });

  const certificationsQuery = useQuery({
    queryKey: ["code-certifications"],
    queryFn: listCertifications,
    enabled: tabQueryEnabled && Boolean(selectedCompanyPerformance?.bidSeq),
  });

  const candidateQueryFilters = useMemo(
    () => ({
      bidSeq: selectedCompanyPerformance?.bidSeq ?? undefined,
      certificationName: appliedFilters.certificationCode || undefined,
      constructionManagementGrade: appliedFilters.constructionManagementGrade || undefined,
      designGrade: appliedFilters.designGrade || undefined,
      jobField: appliedFilters.jobField || undefined,
      keyword: appliedFilters.keyword.trim() || undefined,
      page: candidatePage,
      projectHistoryConditions: appliedFilters.relatedProjectHistoryConditions,
      retireYn: toRetireYn(appliedFilters.status),
      size: candidatePageSize,
      specialtyField: appliedFilters.specialtyField || undefined,
      workDutyId: workDutyId || undefined,
    }),
    [appliedFilters, candidatePage, candidatePageSize, selectedCompanyPerformance?.bidSeq, workDutyId],
  );

  const candidatesQuery = useQuery({
    queryKey: ["pq-participating-engineer-candidates", candidateQueryFilters, candidateSearchRevision],
    queryFn: () => listPqParticipatingEngineerCandidates(candidateQueryFilters),
    enabled: tabQueryEnabled && Boolean(selectedCompanyPerformance?.bidSeq),
    placeholderData: keepPreviousData,
  });

  const selectedEngineersQuery = useQuery({
    queryKey: ["pq-participating-engineers", selectedCompanyPerformance?.bidSeq, workDutyId],
    queryFn: () => listPqParticipatingEngineers({ bidSeq: selectedCompanyPerformance?.bidSeq ?? 0, workDutyId }),
    enabled: tabQueryEnabled && Boolean(selectedCompanyPerformance?.bidSeq),
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
      setSelectedEngineerIds([]);
      setSelectedEngineerSelectionAnchorId(null);
      setPendingBulkDeleteEngineerIds(null);
      setHistoryEngineerId((current) =>
        current && nextSelectedEngineers.some((engineer) => engineer.engineerId === current)
          ? current
          : nextSelectedEngineers[0]?.engineerId ?? "",
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [selectedEngineersQuery.data]);

  const emptyCandidatePage = useMemo(
    () => ({
      content: [] as PqParticipatingEngineerCandidate[],
      page: candidatePage,
      size: candidatePageSize,
      totalElements: 0,
      totalPages: 0,
    }),
    [candidatePage, candidatePageSize],
  );
  const candidatesPage = candidatesQuery.data ?? emptyCandidatePage;
  const candidates = useMemo(() => candidatesPage.content ?? [], [candidatesPage.content]);
  const selectedEngineerRowIds = useMemo(() => selectedEngineers.map((engineer) => engineer.engineerId), [selectedEngineers]);
  const selectedEngineerIdSet = useMemo(() => new Set(selectedEngineerIds), [selectedEngineerIds]);
  const candidateRowIds = useMemo(() => candidates.map((candidate) => candidate.engrId), [candidates]);
  const selectedCandidateIdSet = useMemo(() => new Set(selectedCandidateIds), [selectedCandidateIds]);
  const selectedCandidateRows = useMemo(
    () => candidates.filter((candidate) => selectedCandidateIdSet.has(candidate.engrId)),
    [candidates, selectedCandidateIdSet],
  );
  const candidateRowCount = candidatesPage.totalElements;
  const selectedEngineerSignature = useMemo(() => serializeSelectedEngineers(selectedEngineers), [selectedEngineers]);
  const hasUnsavedSelectedEngineerChanges = selectedEngineerSignature !== selectedEngineerSnapshot;

  const saveSelectedEngineersMutation = useMutation({
    mutationFn: () => {
      const bidSeq = selectedCompanyPerformance?.bidSeq;
      if (!bidSeq) {
        throw new Error("PQ참여할 공고문을 먼저 선택하세요.");
      }
      if (!workDutyId) {
        throw new Error("로그인 작업자 정보를 확인할 수 없습니다.");
      }
      const requestBody = {
        bidSeq,
        workDutyId,
        engineers: selectedEngineers.map((engineer, index) => ({
          engrId: engineer.engineerId,
          memo: engineer.memo || null,
          priority: index + 1,
          role: engineer.role || null,
        })),
      };
      return Promise.all([
        replacePqParticipatingEngineers(requestBody),
        replaceWorkOverlapDocumentEngineers({
          bidSeq,
          workDutyId: currentSession?.loginId ?? "",
          engineers: requestBody.engineers.map((engineer) => ({
            engrId: engineer.engrId,
            displayOrder: engineer.priority ?? null,
            responsibility: null,
          })),
        }),
      ]);
    },
    onSuccess: async ([records]) => {
      const nextSelectedEngineers = records.map(toSelectedEngineerFromRecord);
      setSelectedEngineers(nextSelectedEngineers);
      setSelectedEngineerSnapshot(serializeSelectedEngineers(nextSelectedEngineers));
      await queryClient.invalidateQueries({ queryKey: ["pq-participating-engineer-candidates"] });
      await queryClient.invalidateQueries({ queryKey: ["pq-participating-engineers", selectedCompanyPerformance?.bidSeq, workDutyId] });
      await queryClient.invalidateQueries({ queryKey: ["work-overlap-docs", "document-engineers", selectedCompanyPerformance?.bidSeq, currentSession?.loginId] });
      setSnackbar({ message: "PQ참여 기술인 목록을 저장했습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({ message: error instanceof Error ? error.message : "PQ참여 기술인 목록 저장에 실패했습니다.", severity: "error" });
    },
  });

  const removeSelectedEngineersMutation = useMutation({
    mutationFn: (engineerIds: string[]) => {
      const bidSeq = selectedCompanyPerformance?.bidSeq;
      if (!bidSeq || !workDutyId || !currentSession?.loginId) {
        throw new Error("로그인 작업자 정보를 확인할 수 없습니다.");
      }
      return Promise.all(
        engineerIds.map(async (engrId) => {
          await deletePqParticipatingEngineer(bidSeq, workDutyId, engrId);
          await deleteWorkOverlapDocumentEngineer(bidSeq, currentSession.loginId, engrId).catch(() => undefined);
        }),
      );
    },
    onSuccess: async (_, removedIds) => {
      const removedIdSet = new Set(removedIds);
      const nextSelectedEngineers = selectedEngineers
        .filter((engineer) => !removedIdSet.has(engineer.engineerId))
        .map((engineer, index) => ({ ...engineer, priority: index + 1 }));
      setSelectedEngineers(nextSelectedEngineers);
      setSelectedEngineerSnapshot(serializeSelectedEngineers(nextSelectedEngineers));
      setSelectedEngineerIds((current) => current.filter((id) => !removedIdSet.has(id)));
      setSelectedEngineerSelectionAnchorId((current) => (current && removedIdSet.has(current) ? null : current));
      setPendingBulkDeleteEngineerIds(null);
      setHistoryEngineerId((current) => removedIdSet.has(current) ? nextSelectedEngineers[0]?.engineerId ?? "" : current);
      await queryClient.invalidateQueries({ queryKey: ["pq-participating-engineer-candidates"] });
      await queryClient.invalidateQueries({ queryKey: ["pq-participating-engineers", selectedCompanyPerformance?.bidSeq, workDutyId] });
      await queryClient.invalidateQueries({ queryKey: ["work-overlap-docs", "document-engineers", selectedCompanyPerformance?.bidSeq, currentSession?.loginId] });
      setSnackbar({ message: `선정 기술인 ${removedIds.length}명을 삭제했습니다.`, severity: "success" });
    },
    onError: (error) => {
      setSnackbar({ message: error instanceof Error ? error.message : "선정 기술인을 삭제하지 못했습니다.", severity: "error" });
    },
  });

  const stageCandidates = useCallback(
    (candidatesToAdd: PqParticipatingEngineerCandidate[]) => {
      if (!canCreate) {
        setSnackbar({ message: "PQ참여 기술인 추가 권한이 없습니다.", severity: "error" });
        return;
      }
      if (!selectedCompanyPerformance?.bidSeq) {
        setSnackbar({ message: "PQ참여할 공고문을 먼저 선택하세요.", severity: "error" });
        return;
      }
      if (!workDutyId) {
        setSnackbar({ message: "로그인 작업자 정보를 확인할 수 없습니다.", severity: "error" });
        return;
      }

      const existingIds = new Set(selectedEngineers.map((engineer) => engineer.engineerId));
      const uniqueCandidates = candidatesToAdd.filter((candidate) => !existingIds.has(candidate.engrId));

      if (uniqueCandidates.length === 0) {
        setSnackbar({ message: "이미 선정 목록에 포함된 기술인입니다.", severity: "info" });
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
      setSnackbar({
        message: `후보 기술인 ${uniqueCandidates.length}명을 선정 목록에 추가했습니다. 저장 버튼을 눌러 반영하세요.`,
        severity: "success",
      });
    },
    [canCreate, selectedCompanyPerformance?.bidSeq, selectedEngineers, workDutyId],
  );

  const clearCandidateClickTimer = useCallback(() => {
    if (candidateClickTimerRef.current !== null) {
      window.clearTimeout(candidateClickTimerRef.current);
      candidateClickTimerRef.current = null;
    }
  }, []);

  const handleCandidateSelection = useCallback(
    (id: string, event?: SelectionClickEvent, source: "row" | "checkbox" = "row") => {
      const isModifierClick = Boolean(event?.ctrlKey || event?.metaKey);
      const isRangeClick = Boolean(event?.shiftKey);

      setSelectedCandidateIds((current) => {
        if (!isModifierClick && !isRangeClick) {
          setCandidateSelectionAnchorId(id);
          if (source === "checkbox") {
            return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
          }
          return [id];
        }

        if (isRangeClick) {
          const anchorId = candidateSelectionAnchorId ?? current[current.length - 1] ?? id;
          const anchorIndex = candidateRowIds.indexOf(anchorId);
          const targetIndex = candidateRowIds.indexOf(id);

          if (anchorIndex < 0 || targetIndex < 0) {
            setCandidateSelectionAnchorId(id);
            return Array.from(new Set([...current, id]));
          }

          const [startIdx, endIdx] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
          const rangeIds = candidateRowIds.slice(startIdx, endIdx + 1);
          setCandidateSelectionAnchorId(anchorId);
          return Array.from(new Set([...current, ...rangeIds]));
        }

        setCandidateSelectionAnchorId(id);
        return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      });
    },
    [candidateRowIds, candidateSelectionAnchorId],
  );

  const addSelectedCandidates = useCallback(() => {
    if (!canCreate) {
      setSnackbar({ message: "PQ참여 기술인 추가 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!selectedCompanyPerformance?.bidSeq) {
      setSnackbar({ message: "PQ참여할 공고문을 먼저 선택하세요.", severity: "error" });
      return;
    }

    const candidatesToAdd = candidates.filter((candidate) => selectedCandidateIdSet.has(candidate.engrId));
    if (candidatesToAdd.length === 0) {
      setSnackbar({ message: "추가할 후보기술인를 먼저 선택해 주세요.", severity: "info" });
      return;
    }

    setSelectedEngineers((current) => {
      const existing = new Set(current.map((engineer) => engineer.engineerId));
      const nextEntries = candidatesToAdd.filter((candidate) => !existing.has(candidate.engrId));

      if (nextEntries.length === 0) {
        setSnackbar({ message: "이미 선정 목록에 포함된 기술인입니다.", severity: "info" });
        return current;
      }

      return [...nextEntries.map((candidate, index) => toSelectedEngineer(candidate, current.length + index + 1)), ...current];
    });

    setSelectedCandidateIds([]);
    setCandidateSelectionAnchorId(null);
  }, [canCreate, candidates, selectedCandidateIdSet, selectedCompanyPerformance?.bidSeq]);

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

  const handleSelectedEngineerSelection = useCallback(
    (id: string, event?: SelectionClickEvent, source: "row" | "checkbox" = "row") => {
      const isModifierClick = Boolean(event?.ctrlKey || event?.metaKey);
      const isRangeClick = Boolean(event?.shiftKey);

      setSelectedEngineerIds((current) => {
        if (!isModifierClick && !isRangeClick) {
          setSelectedEngineerSelectionAnchorId(id);
          if (source === "checkbox") {
            return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
          }
          return [id];
        }

        if (isRangeClick) {
          const anchorId = selectedEngineerSelectionAnchorId ?? current[current.length - 1] ?? id;
          const anchorIndex = selectedEngineerRowIds.indexOf(anchorId);
          const targetIndex = selectedEngineerRowIds.indexOf(id);

          if (anchorIndex < 0 || targetIndex < 0) {
            setSelectedEngineerSelectionAnchorId(id);
            return Array.from(new Set([...current, id]));
          }

          const [startIdx, endIdx] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
          const rangeIds = selectedEngineerRowIds.slice(startIdx, endIdx + 1);
          setSelectedEngineerSelectionAnchorId(anchorId);
          return Array.from(new Set([...current, ...rangeIds]));
        }

        setSelectedEngineerSelectionAnchorId(id);
        return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      });
    },
    [selectedEngineerRowIds, selectedEngineerSelectionAnchorId],
  );

  const removeSelectedEngineers = useCallback(() => {
    if (!canDelete) {
      setSnackbar({ message: "PQ참여 기술인를 제외할 권한이 없습니다.", severity: "error" });
      return;
    }

    const nextIds = selectedEngineerIds.length > 0 ? selectedEngineerIds : [];
    if (nextIds.length === 0) {
      setSnackbar({ message: "삭제할 선정 기술인를 먼저 선택해 주세요.", severity: "info" });
      return;
    }

    setPendingBulkDeleteEngineerIds(nextIds);
  }, [canDelete, selectedEngineerIds]);

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

  const handleReset = () => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setCandidatePage(0);
    setSelectedCompanyPerformance(null);
    setSelectedEngineers([]);
    setSelectedEngineerSnapshot("");
    setSelectedEngineerIds([]);
    setSelectedEngineerSelectionAnchorId(null);
    setPendingBulkDeleteEngineerIds(null);
    setSelectedCandidateIds([]);
    setCandidateSelectionAnchorId(null);
    setHistoryEngineerId("");
  };

  const handleSave = () => {
    if (!canUpdate && !canCreate) {
      setSnackbar({ message: "PQ참여 기술인 목록을 저장할 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!selectedCompanyPerformance?.bidSeq) {
      setSnackbar({ message: "PQ참여할 공고문을 먼저 선택하세요.", severity: "error" });
      return;
    }
    if (!hasUnsavedSelectedEngineerChanges) {
      setSnackbar({ message: "저장할 변경사항이 없습니다.", severity: "info" });
      return;
    }
    saveSelectedEngineersMutation.mutate();
  };

  const allCandidatesSelected = candidates.length > 0 && candidates.every((candidate) => selectedCandidateIdSet.has(candidate.engrId));
  const someCandidatesSelected = candidates.some((candidate) => selectedCandidateIdSet.has(candidate.engrId));
  const toggleAllCandidates = useCallback(
    (checked: boolean) => {
      setSelectedCandidateIds((current) => {
        if (checked) {
          return Array.from(new Set([...current, ...candidateRowIds]));
        }
        return current.filter((id) => !candidateRowIds.includes(id));
      });
    },
    [candidateRowIds],
  );
  const allSelectedEngineersSelected = selectedEngineers.length > 0 && selectedEngineers.every((engineer) => selectedEngineerIdSet.has(engineer.engineerId));
  const someSelectedEngineersSelected = selectedEngineers.some((engineer) => selectedEngineerIdSet.has(engineer.engineerId));
  const toggleAllSelectedEngineers = useCallback(
    (checked: boolean) => {
      setSelectedEngineerIds(checked ? selectedEngineerRowIds : []);
      setSelectedEngineerSelectionAnchorId(null);
    },
    [selectedEngineerRowIds],
  );

  const candidateColumns = useMemo<GridColDef<PqParticipatingEngineerCandidate>[]>(
    () => [
      {
        field: "__select__",
        headerName: "선택",
        width: 64,
        align: "center",
        headerAlign: "center",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => (
          <Checkbox
            checked={allCandidatesSelected}
            disabled={candidates.length === 0}
            indeterminate={!allCandidatesSelected && someCandidatesSelected}
            onChange={(event) => toggleAllCandidates(event.target.checked)}
            size="small"
            sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: 18 } }}
          />
        ),
        renderCell: (params) => (
          <Checkbox
            checked={selectedCandidateIdSet.has(params.row.engrId)}
            onClick={(event) => {
              event.stopPropagation();
              handleCandidateSelection(params.row.engrId, event, "checkbox");
            }}
            size="small"
            sx={{
              p: 0,
              "& .MuiSvgIcon-root": {
                fontSize: 18,
              },
            }}
          />
        ),
      },
      { field: "name", headerName: "성명", width: 100, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.name ?? "" },
      { field: "position", headerName: "직위", width: 90, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.position ?? "" },
      {
        field: "jobField",
        headerName: "직무분야",
        width: 120,
        align: "center",
        headerAlign: "center",
        valueGetter: (_value, row) => row.jobField ?? "",
        valueFormatter: (value) => formatReferenceLabel(labelByJobField, value),
      },
      {
        field: "specialtyField",
        headerName: "전문분야",
        width: 120,
        align: "center",
        headerAlign: "center",
        valueGetter: (_value, row) => row.specialtyField ?? "",
        valueFormatter: (value) => formatReferenceLabel(labelBySpecialtyField, value),
      },
      {
        field: "designGrade",
        headerName: "설계등급",
        flex: 1,
        minWidth: 110,
        align: "center",
        headerAlign: "center",
        valueGetter: (_value, row) => row.designGrade ?? "",
        valueFormatter: (value) => formatReferenceLabel(labelByGrade, value),
      },
    ],
    [allCandidatesSelected, candidates.length, handleCandidateSelection, labelByGrade, labelByJobField, labelBySpecialtyField, selectedCandidateIdSet, someCandidatesSelected, toggleAllCandidates],
  );

  const selectedColumns = useMemo<GridColDef<SelectedPqEngineer>[]>(
    () => [
      {
        field: "__select__",
        headerName: "선택",
        width: 64,
        align: "center",
        headerAlign: "center",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => (
          <Checkbox
            checked={allSelectedEngineersSelected}
            disabled={selectedEngineers.length === 0}
            indeterminate={!allSelectedEngineersSelected && someSelectedEngineersSelected}
            onChange={(event) => toggleAllSelectedEngineers(event.target.checked)}
            size="small"
            sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: 18 } }}
          />
        ),
        renderCell: (params) => (
          <Checkbox
            checked={selectedEngineerIdSet.has(params.row.engineerId)}
            onClick={(event) => {
              event.stopPropagation();
              handleSelectedEngineerSelection(params.row.engineerId, event, "checkbox");
            }}
            size="small"
            sx={{
              p: 0,
              "& .MuiSvgIcon-root": {
                fontSize: 18,
              },
            }}
          />
        ),
      },
      { field: "priority", headerName: "순번", width: 70, align: "center", headerAlign: "center" },
      { field: "name", headerName: "성명", width: 100, align: "center", headerAlign: "center" },
      { field: "birthDate", headerName: "생년월일", width: 120, align: "center", headerAlign: "center", valueGetter: (_value, row) => formatBirthDate(row.birthDate) },
      { field: "department", headerName: "부서", minWidth: 100, flex: 0.8, align: "center", headerAlign: "center" },
      { field: "title", headerName: "직위", width: 90, align: "center", headerAlign: "center" },
      {
        field: "jobField",
        headerName: "직무분야",
        width: 120,
        align: "center",
        headerAlign: "center",
        valueFormatter: (value) => formatReferenceLabel(labelByJobField, value),
      },
      {
        field: "specialtyField",
        headerName: "전문분야",
        width: 150,
        align: "center",
        headerAlign: "center",
        valueFormatter: (value) => formatReferenceLabel(labelBySpecialtyField, value),
      },
      {
        field: "status",
        headerName: "재직상태",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => formatStatusChip(params.value as EngineerStatus),
      },
    ],
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
  const handleSelectedEngineerResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = selectedEngineerCardHeight;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextHeight = Math.min(
          SELECTED_ENGINEER_CARD_MAX_HEIGHT,
          Math.max(SELECTED_ENGINEER_CARD_MIN_HEIGHT, startHeight + moveEvent.clientY - startY),
        );
        setSelectedEngineerCardHeight(nextHeight);
      };
      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [selectedEngineerCardHeight],
  );

  const renderSelectedEngineerCard = () => (
    <ResizableCard
      height={performanceFocusMode ? performanceCardHeight : selectedEngineerCardHeight}
      maxWidth={CANDIDATE_CARD_MAX_WIDTH}
      minWidth={CANDIDATE_CARD_MIN_WIDTH}
      onWidthChange={setCandidateCardWidth}
      resizeEdges={performanceFocusMode ? ["right"] : []}
      handleSx={{ display: { xs: "none", lg: "flex" }, zIndex: 4 }}
      width={performanceFocusMode ? candidateCardWidth : undefined}
      sx={{ height: { lg: performanceFocusMode ? performanceCardHeight : selectedEngineerCardHeight }, minHeight: SELECTED_ENGINEER_CARD_MIN_HEIGHT, minWidth: 0, position: "relative", width: { xs: "100%", lg: performanceFocusMode ? candidateCardWidth : "100%" } }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", pb: 2.5 }}>
        <Box
          sx={{
            alignItems: performanceFocusMode ? "stretch" : "center",
            display: "flex",
            flexDirection: performanceFocusMode ? "column" : "row",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              {"선정 기술인"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: performanceFocusMode ? "flex-end" : "initial", width: performanceFocusMode ? "100%" : "auto" }}>
            <Chip label={`선택 ${selectedEngineerIds.length}명`} size="small" variant={selectedEngineerIds.length > 0 ? "filled" : "outlined"} />
            {hasUnsavedSelectedEngineerChanges ? <Chip color="warning" label="저장 필요" size="small" variant="outlined" /> : null}
            <Button
              color="error"
              disabled={!canDelete || selectedEngineerIds.length === 0}
              onClick={removeSelectedEngineers}
              startIcon={<DeleteOutlineOutlinedIcon />}
              size="small"
              sx={selectedEngineerActionButtonSx}
              variant="outlined"
            >
              {"선택 삭제"}
            </Button>
            <Button
              disabled={(!canCreate && !canUpdate) || saveSelectedEngineersMutation.isPending || !hasUnsavedSelectedEngineerChanges}
              onClick={handleSave}
              size="small"
              startIcon={<SaveOutlinedIcon />}
              sx={selectedEngineerActionButtonSx}
              variant="contained"
            >
              {"선정 목록 저장"}
            </Button>
            <Tooltip title={performanceFocusMode ? "기본 배치로 보기" : "선정 기술인 기준으로 보기"}>
              <IconButton
                aria-label={performanceFocusMode ? "기본 배치로 보기" : "선정 기술인 기준으로 보기"}
                color="primary"
                onClick={() => setPerformanceFocusMode((focused) => !focused)}
                size="small"
                sx={{ mt: -0.25 }}
              >
                {performanceFocusMode ? <KeyboardDoubleArrowRightOutlinedIcon fontSize="small" /> : <KeyboardDoubleArrowLeftOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <EnterpriseDataGrid<SelectedPqEngineer>
          columns={selectedColumns}
          getRowId={(row) => row.engineerId}
          hideFooter
          hideFooterSelectedRowCount
          onRowClick={(params: GridRowParams<SelectedPqEngineer>, event) => {
            setHistoryEngineerId(params.row.engineerId);
            handleSelectedEngineerSelection(params.row.engineerId, event);
          }}
          paginationMode="server"
          rowCount={selectedEngineers.length}
          rows={selectedEngineers}
          getRowClassName={({ row }) => (selectedEngineerIdSet.has(row.engineerId) ? "engineer-row-selected" : "")}
          wrapperMinHeight={selectedEngineerGridHeight}
          sx={{
            ...gridSx,
            height: selectedEngineerGridHeight,
            "& .MuiDataGrid-row.engineer-row-selected": {
              backgroundColor: "rgba(25, 118, 210, 0.10)",
            },
          }}
        />
      </CardContent>
      <Box
        aria-label="선정 기술인 영역 높이 조정"
        onPointerDown={handleSelectedEngineerResizeStart}
        role="separator"
        sx={{
          alignItems: "center",
          bottom: 0,
          cursor: "row-resize",
          display: { xs: "none", lg: performanceFocusMode ? "none" : "flex" },
          height: 14,
          justifyContent: "center",
          left: 0,
          position: "absolute",
          right: 0,
          touchAction: "none",
          "&::before": {
            bgcolor: "divider",
            borderRadius: 1,
            content: '""',
            height: 3,
            width: 48,
          },
          "&:hover::before": {
            bgcolor: "primary.main",
          },
        }}
      />
    </ResizableCard>
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
        <Stack sx={companyPerformanceRowSx}>
          <Stack direction="row" sx={companyPerformanceFilterSx}>
            <TextField
              fullWidth
              label="PQ참여할 공고문 선택"
              placeholder="공고문 선택"
              size="small"
              sx={standardFieldSx}
              value={selectedCompanyPerformance?.projectName ?? ""}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
            <Button
              disabled={!canRead}
              onClick={() => setCompanyPerformanceDialogOpen(true)}
              startIcon={<SearchOutlinedIcon />}
              sx={{ flex: "0 0 auto", minWidth: 88, whiteSpace: "nowrap" }}
              type="button"
              variant="outlined"
            >
              {"선택"}
            </Button>
          </Stack>
        </Stack>
        <Autocomplete
          options={certificationOptions}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          sx={certificationFilterSx}
          value={certificationOptions.find((option) => option.value === filters.certificationCode) ?? null}
          onChange={(_, option) => setFilters((current) => ({ ...current, certificationCode: option?.value ?? "" }))}
          renderInput={(params) => <TextField {...params} label="보유 자격증" size="small" sx={standardFieldSx} />}
        />
        <Autocomplete
          options={specialtyFieldOptions}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          sx={filterAutocompleteSx}
          value={specialtyFieldOptions.find((option) => option.value === filters.specialtyField) ?? null}
          onChange={(_, option) => setFilters((current) => ({ ...current, specialtyField: option?.value ?? "" }))}
          renderInput={(params) => <TextField {...params} label="전문분야" size="small" sx={standardFieldSx} />}
        />
        <Autocomplete
          options={jobFieldOptions}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          sx={filterAutocompleteSx}
          value={jobFieldOptions.find((option) => option.value === filters.jobField) ?? null}
          onChange={(_, option) => setFilters((current) => ({ ...current, jobField: option?.value ?? "" }))}
          renderInput={(params) => <TextField {...params} label="직무분야" size="small" sx={standardFieldSx} />}
        />
        <Autocomplete
          options={gradeOptions}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          sx={filterAutocompleteSx}
          value={gradeOptions.find((option) => option.value === filters.designGrade) ?? null}
          onChange={(_, option) => setFilters((current) => ({ ...current, designGrade: option?.value ?? "" }))}
          renderInput={(params) => <TextField {...params} label="설계등급" size="small" sx={standardFieldSx} />}
        />

        <Box sx={companyPerformanceRowSx}>
          <Box sx={{ display: "grid", gap: 0.75, width: "100%" }}>
            <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>
              업무중복도 조회조건
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }}>
            <TextField
              label="기준일"
              size="small"
              type="date"
              value={filters.referenceDate}
              onChange={(event) => setFilters((current) => ({ ...current, referenceDate: event.target.value }))}
              sx={{ ...standardFieldSx, width: { xs: "100%", sm: 170 } }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="과업기간"
              size="small"
              value={filters.taskPeriodValue}
              onChange={(event) => setFilters((current) => ({ ...current, taskPeriodValue: event.target.value.replace(/\D/g, "") }))}
              sx={{ ...standardFieldSx, width: { xs: "100%", sm: 120 } }}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
            <TextField
              select
              label="단위"
              size="small"
              value={filters.taskPeriodUnit}
              onChange={(event) => setFilters((current) => ({ ...current, taskPeriodUnit: event.target.value as CandidateFilters["taskPeriodUnit"] }))}
              sx={{ ...standardFieldSx, width: { xs: "100%", sm: 100 } }}
            >
              <MenuItem value="일">일</MenuItem>
              <MenuItem value="개월">개월</MenuItem>
            </TextField>
            <TextField
              label="잔여일"
              size="small"
              value={filters.remainingDays}
              onChange={(event) => setFilters((current) => ({ ...current, remainingDays: event.target.value.replace(/\D/g, "") }))}
              sx={{ ...standardFieldSx, width: { xs: "100%", sm: 100 } }}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
            </Stack>
          </Box>
        </Box>
        <Box sx={companyPerformanceRowSx}>
          <RelatedProjectHistoryConditionsPanel
            bidSeq={selectedCompanyPerformance?.bidSeq ?? null}
            disabled={!canRead}
            onApply={applyRelatedProjectHistoryConditions}
            value={filters.relatedProjectHistoryConditions}
          />
        </Box>
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
              handleSx={{ display: { xs: "none", lg: "flex" }, zIndex: 4 }}
              width={candidateCardWidth}
              sx={{ boxSizing: "border-box", height: { xs: "auto", lg: candidateCardHeight }, overflow: "visible", width: { xs: "100%", lg: candidateCardWidth } }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
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
                <EnterpriseDataGrid<PqParticipatingEngineerCandidate>
                  columns={candidateColumns}
                  getRowId={(row) => row.engrId}
                  hideFooter
                  hideFooterSelectedRowCount
                  loading={candidatesQuery.isLoading || candidatesQuery.isFetching}
                  onPaginationModelChange={(model) => {
                    setCandidatePage(model.pageSize !== candidatePageSize ? 0 : model.page);
                    setCandidatePageSize(model.pageSize);
                    setSelectedCandidateIds([]);
                    setCandidateSelectionAnchorId(null);
                  }}
                  onRowClick={handleCandidateRowClick}
                  onRowDoubleClick={handleCandidateRowDoubleClick}
                  pageSizeOptions={[25, 50, 100]}
                  paginationMode="server"
                  paginationModel={candidatePaginationModel}
                  rowCount={candidateRowCount}
                  rows={candidates}
                  getRowClassName={({ row }) => (selectedCandidateIdSet.has(row.engrId) ? "candidate-row-selected" : "")}
                  wrapperMinHeight={candidateGridHeight}
                  sx={{
                    ...gridSx,
                    height: { xs: 420, lg: candidateGridHeight },
                    "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                    "& .MuiDataGrid-row.candidate-row-selected": {
                      backgroundColor: "rgba(25, 118, 210, 0.10)",
                    },
                  }}
                />
              </CardContent>
            </ResizableCard>
            : renderSelectedEngineerCard()}
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
              {!performanceFocusMode ? <Card sx={{ height: { lg: selectedEngineerCardHeight }, minHeight: SELECTED_ENGINEER_CARD_MIN_HEIGHT, minWidth: 0, position: "relative" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", pb: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }} variant="h6">
                        {"선정 기술인"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Chip label={`선택 ${selectedEngineerIds.length}명`} size="small" variant={selectedEngineerIds.length > 0 ? "filled" : "outlined"} />
                      {hasUnsavedSelectedEngineerChanges ? <Chip color="warning" label="저장 필요" size="small" variant="outlined" /> : null}
                      <Button
                        color="error"
                        disabled={!canDelete || selectedEngineerIds.length === 0}
                        onClick={removeSelectedEngineers}
                        startIcon={<DeleteOutlineOutlinedIcon />}
                        size="small"
                        sx={selectedEngineerActionButtonSx}
                        variant="outlined"
                      >
                        {"선택 삭제"}
                      </Button>
                      <Button
                        disabled={(!canCreate && !canUpdate) || saveSelectedEngineersMutation.isPending || !hasUnsavedSelectedEngineerChanges}
                        onClick={handleSave}
                        size="small"
                        startIcon={<SaveOutlinedIcon />}
                        sx={selectedEngineerActionButtonSx}
                        variant="contained"
                      >
                        {"선정 목록 저장"}
                      </Button>
                      <Tooltip title={performanceFocusMode ? "기본 배치로 보기" : "선정 기술인 기준으로 보기"}>
                        <IconButton
                          aria-label={performanceFocusMode ? "기본 배치로 보기" : "선정 기술인 기준으로 보기"}
                          color="primary"
                          onClick={() => setPerformanceFocusMode((focused) => !focused)}
                          size="small"
                          sx={{ mt: -0.25 }}
                        >
                          {performanceFocusMode ? <KeyboardDoubleArrowRightOutlinedIcon fontSize="small" /> : <KeyboardDoubleArrowLeftOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                  <EnterpriseDataGrid<SelectedPqEngineer>
                    columns={selectedColumns}
                    getRowId={(row) => row.engineerId}
                    hideFooter
                    hideFooterSelectedRowCount
                    onRowClick={(params: GridRowParams<SelectedPqEngineer>, event) => {
                      setHistoryEngineerId(params.row.engineerId);
                      handleSelectedEngineerSelection(params.row.engineerId, event);
                    }}
                    paginationMode="server"
                    rowCount={selectedEngineers.length}
                    rows={selectedEngineers}
                    getRowClassName={({ row }) => (selectedEngineerIdSet.has(row.engineerId) ? "engineer-row-selected" : "")}
                    wrapperMinHeight={selectedEngineerGridHeight}
                    sx={{
                      ...gridSx,
                      height: selectedEngineerGridHeight,
                      "& .MuiDataGrid-row.engineer-row-selected": {
                        backgroundColor: "rgba(25, 118, 210, 0.10)",
                      },
                    }}
                  />
                </CardContent>
                <Box
                  aria-label="선정 기술인 영역 높이 조정"
                  onPointerDown={handleSelectedEngineerResizeStart}
                  role="separator"
                  sx={{
                    alignItems: "center",
                    bottom: 0,
                    cursor: "row-resize",
                    display: { xs: "none", lg: "flex" },
                    height: 14,
                    justifyContent: "center",
                    left: 0,
                    position: "absolute",
                    right: 0,
                    touchAction: "none",
                    "&::before": {
                      bgcolor: "divider",
                      borderRadius: 1,
                      content: '""',
                      height: 3,
                      width: 48,
                    },
                    "&:hover::before": {
                      bgcolor: "primary.main",
                    },
                  }}
                />
              </Card> : null}

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
                handleSx={{ display: { xs: "none", lg: "flex" }, zIndex: 4 }}
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

      <Snackbar
        autoHideDuration={2500}
        message={snackbar?.message}
        onClose={() => setSnackbar(null)}
        open={Boolean(snackbar)}
      />

      {companyPerformanceDialogOpen ? (
        <BidNoticeSelectDialog
        onClose={() => setCompanyPerformanceDialogOpen(false)}
        onSelect={(record) => {
          setSelectedCompanyPerformance(record);
          setCandidatePage(0);
          setSelectedEngineers([]);
          setSelectedEngineerSnapshot("");
          setSelectedEngineerIds([]);
          setSelectedEngineerSelectionAnchorId(null);
          setPendingBulkDeleteEngineerIds(null);
          setSelectedCandidateIds([]);
          setCandidateSelectionAnchorId(null);
          setHistoryEngineerId("");
          setCompanyPerformanceDialogOpen(false);
        }}
        open
        />
      ) : null}
    </Box>
  );
}
