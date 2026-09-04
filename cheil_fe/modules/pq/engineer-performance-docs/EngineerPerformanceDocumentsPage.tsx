"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderEditCellParams, type GridRowParams, type GridRowSelectionModel } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { RelatedProjectHistoryConditionsPanel } from "@/components/common/RelatedProjectHistoryConditionsPanel";
import { ResizeHandle } from "@/components/common/ResizeHandle";
import { compactFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { formatPaddedLevel2CodeLabel, formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import { downloadEngineerPerformanceReviewWorkbook } from "@/modules/pq/engineer-performance-docs/engineerPerformanceDocumentsExcel";
import {
  createEngineerProjectHistoryReviewResults,
  deleteEngineerProjectHistoryReviewResult,
  listEngineerDocumentValueSettings,
  listEngineerProjectHistories,
  listEngineerProjectHistoryReviewResults,
  syncEngineerProjectHistoryReviewResults,
  saveEngineerDocumentValueSetting,
  updateEngineerProjectHistoryReviewResult,
  type EngineerProjectHistoryReviewRecord,
} from "@/modules/pq/engineer-performance-docs/api";
import { listSelectedEngineerProfilesForBidNotice } from "@/modules/pq/engineers/api";
import { deletePqParticipatingEngineer, listPqParticipatingEngineers } from "@/modules/pq/pq-participating-engineers/api";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import type { EngineerDocumentValueSetting } from "@/modules/pq/engineer-performance-docs/EngineerDocumentValueSettingDialog";

const BidNoticeSelectDialog = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeSelectDialog").then((module) => module.BidNoticeSelectDialog),
  { ssr: false },
);
const BidNoticeDetailPopup = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeDetailPopup").then((module) => module.BidNoticeDetailPopup),
  { ssr: false },
);
const CompanyPerformanceDetailPopup = dynamic(
  () => import("@/modules/pq/company-performance/CompanyPerformanceDetailPopup").then((module) => module.CompanyPerformanceDetailPopup),
  { ssr: false },
);
const HwpxTemplateGenerationPanel = dynamic(
  () => import("@/modules/pq/engineer-performance-docs/HwpxTemplateGenerationPanel").then((module) => module.HwpxTemplateGenerationPanel),
  { ssr: false },
);
const EngineerDocumentValueSettingDialog = dynamic(
  () => import("@/modules/pq/engineer-performance-docs/EngineerDocumentValueSettingDialog").then((module) => module.EngineerDocumentValueSettingDialog),
  { ssr: false },
);

type EngineerDocumentRow = {
  birthDate: string;
  department: string;
  engineerId: string;
  jobField: string;
  name: string;
  position: string;
  specialtyField: string;
  selectedCount: number;
  status: string;
  documentValueConfigured: boolean;
};

type PerformanceHistoryRow = EngineerProjectHistoryReviewRecord & {
  engineerId: string;
  engineerName: string;
};

type ReviewSelectionClickEvent = {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

const fieldSx = {
  ...compactFieldSx,
  minWidth: 180,
} as const;

const center = {
  align: "center",
  headerAlign: "center",
} as const;

const selectorGridHeight = { xs: 520, md: 580 } as const;
const DEFAULT_SELECTOR_PANEL_WIDTH = 360;
const SELECTOR_PANEL_MIN_WIDTH = 300;
const SELECTOR_PANEL_MAX_WIDTH = 560;
const DEFAULT_HISTORY_CARD_HEIGHT = 520;
const HISTORY_CARD_MIN_HEIGHT = 320;
const HISTORY_CARD_MAX_HEIGHT = 900;
const HISTORY_CARD_RESERVED_HEIGHT = 112;
const reviewGridHeight = { xs: 240, md: "clamp(260px, calc(100vh - 400px), 440px)" } as const;

const text = (value: string | number | null | undefined) => String(value ?? "").trim();

const historySelectionKey = (row: PerformanceHistoryRow) => {
  const rowId = text(row.id);
  return rowId || `${row.engineerId}-${row.seq}`;
};

const formatMoney = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString("ko-KR") : String(value);
};

const formatDivisionRate = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

const formatDateYmd = (value: string | number | null | undefined) => {
  const raw = text(value);
  if (!raw) {
    return "";
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  return raw;
};

const dateSortValue = (value: string | number | null | undefined) => {
  const digits = text(value).replace(/\D/g, "").slice(0, 8);
  return digits.length === 8 ? Number(digits) : Number.MAX_SAFE_INTEGER;
};

const compareHistoryRowsForDisplayOrder = (left: PerformanceHistoryRow, right: PerformanceHistoryRow) =>
  dateSortValue(left.contractFromDate) - dateSortValue(right.contractFromDate) ||
  dateSortValue(left.startDate) - dateSortValue(right.startDate);

const clampHistoryCardHeight = (height: number) =>
  Math.min(Math.max(Math.round(height), HISTORY_CARD_MIN_HEIGHT), HISTORY_CARD_MAX_HEIGHT);

const clampSelectorPanelWidth = (width: number) =>
  Math.min(Math.max(Math.round(width), SELECTOR_PANEL_MIN_WIDTH), SELECTOR_PANEL_MAX_WIDTH);

export function EngineerPerformanceDocumentsPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const { showError, showSuccess } = useAppSnackbar();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();
  const [bidNoticeDialogOpen, setBidNoticeDialogOpen] = useState(false);
  const [bidNoticeDetailOpen, setBidNoticeDetailOpen] = useState(false);
  const [selectedBidNotice, setSelectedBidNotice] = useState<BidNoticeApiRecord | null>(null);
  const [keyword, setKeyword] = useState("");
  const [activeEngineerId, setActiveEngineerId] = useState("");
  const [performanceDetailSeq, setPerformanceDetailSeq] = useState<number | null>(null);
  const [documentValueSettingOpen, setDocumentValueSettingOpen] = useState(false);
  const [documentValueSetting, setDocumentValueSetting] = useState<EngineerDocumentValueSetting | null>(null);
  const [relatedProjectHistoryConditions, setRelatedProjectHistoryConditions] = useState<RelatedProjectHistoryCondition[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);
  const [historySelectionAnchorId, setHistorySelectionAnchorId] = useState<string | null>(null);
  const [reviewSelectionAnchorId, setReviewSelectionAnchorId] = useState<string | null>(null);
  const [addConfirmOpen, setAddConfirmOpen] = useState(false);
  const [pendingBulkDeleteReviewIds, setPendingBulkDeleteReviewIds] = useState<string[] | null>(null);
  const [pendingBulkDeleteEngineerIds, setPendingBulkDeleteEngineerIds] = useState<string[] | null>(null);
  const [isExcelDownloading, setIsExcelDownloading] = useState(false);
  const [selectorPanelWidth, setSelectorPanelWidth] = useState(DEFAULT_SELECTOR_PANEL_WIDTH);
  const [selectorPanelCollapsed, setSelectorPanelCollapsed] = useState(false);
  const selectorResizeStartXRef = useRef(0);
  const selectorResizeStartWidthRef = useRef(DEFAULT_SELECTOR_PANEL_WIDTH);
  const [historyCardHeight, setHistoryCardHeight] = useState(DEFAULT_HISTORY_CARD_HEIGHT);
  const historyResizeStartYRef = useRef(0);
  const historyResizeStartHeightRef = useRef(DEFAULT_HISTORY_CARD_HEIGHT);
  const historyGridHeight = Math.max(160, historyCardHeight - HISTORY_CARD_RESERVED_HEIGHT);

  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: canRead });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: canRead });
  const engLevelReferences = useCommonCodeLevel2Options("51", { useYn: "Y" }, { enabled: canRead });

  const engineersQuery = useQuery({
    queryKey: ["engineer-performance-docs", "selected-engineers", selectedBidNotice?.bidSeq ?? "none", keyword.trim()],
    queryFn: () =>
      listSelectedEngineerProfilesForBidNotice({
        bidSeq: selectedBidNotice?.bidSeq ?? 0,
        keyword,
      }),
    enabled: tabQueryEnabled && Boolean(selectedBidNotice?.bidSeq),
  });

  const documentValueSettingsQuery = useQuery({
    queryKey: ["engineer-performance-docs", "document-value-settings", selectedBidNotice?.bidSeq ?? "none"],
    queryFn: () => listEngineerDocumentValueSettings(selectedBidNotice?.bidSeq ?? 0),
    enabled: tabQueryEnabled && Boolean(selectedBidNotice?.bidSeq),
  });

  const profiles = useMemo(() => engineersQuery.data ?? [], [engineersQuery.data]);
  const documentValueSettingsByEngineerId = useMemo(
    () => new Map((documentValueSettingsQuery.data ?? []).map((setting) => [setting.engineerId, setting])),
    [documentValueSettingsQuery.data],
  );
  const engineerRows = useMemo<EngineerDocumentRow[]>(
    () =>
      profiles.map((profile) => ({
        birthDate: profile.detail.birthDate,
        department: profile.summary.department,
        engineerId: profile.summary.id,
        jobField: profile.detail.jobField || profile.summary.workField,
        name: profile.summary.name,
        position: profile.summary.position,
        specialtyField: profile.detail.specialtyField,
        selectedCount: profile.careerDetails.length,
        status: profile.summary.status,
        documentValueConfigured: documentValueSettingsByEngineerId.has(profile.summary.id),
      })),
    [documentValueSettingsByEngineerId, profiles],
  );

  const activeEngineerProfile = useMemo(
    () => profiles.find((profile) => profile.summary.id === activeEngineerId) ?? null,
    [activeEngineerId, profiles],
  );

  const selectedBidSeq = selectedBidNotice?.bidSeq ?? null;

  const saveDocumentValueSettingMutation = useMutation({
    mutationFn: (value: EngineerDocumentValueSetting) => {
      if (!selectedBidSeq || !activeEngineerProfile) {
        throw new Error("공고와 기술인을 먼저 선택하세요.");
      }
      return saveEngineerDocumentValueSetting({
        bidSeq: selectedBidSeq,
        engineerId: activeEngineerProfile.summary.id,
        educationId: value.education?.id ? Number(value.education.id) : null,
        licenseId: value.certificate?.id ? Number(value.certificate.id) : null,
      });
    },
    onSuccess: async (_saved, value) => {
      setDocumentValueSetting(value);
      setDocumentValueSettingOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["engineer-performance-docs", "document-value-settings", selectedBidSeq ?? "none"] });
      showSuccess("기술인 문서 작성값이 저장되었습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "기술인 문서 작성값을 저장하지 못했습니다."),
  });

  const projectHistoryRowsQuery = useQuery({
    queryKey: ["engineer-performance-docs", "project-histories", activeEngineerId || "none"],
    queryFn: () => listEngineerProjectHistories(activeEngineerId),
    enabled: tabQueryEnabled && Boolean(activeEngineerId),
  });

  const activeEngineerHistoryRows = useMemo<PerformanceHistoryRow[]>(
    () =>
      (projectHistoryRowsQuery.data ?? []).map((row) => ({
        ...row,
        engineerName: activeEngineerProfile?.summary.name ?? row.engineerId,
      })),
    [activeEngineerProfile?.summary, projectHistoryRowsQuery.data],
  );

  const reviewRowsQuery = useQuery({
    queryKey: [
      "engineer-performance-docs",
      "review-results",
      selectedBidSeq ?? "none",
      activeEngineerId || "none",
    ],
    queryFn: () =>
      listEngineerProjectHistoryReviewResults({
            bidSeq: selectedBidSeq ?? 0,
            engineerId: activeEngineerId,
          }),
    enabled: tabQueryEnabled && Boolean(selectedBidSeq) && Boolean(activeEngineerId),
  });

  const reviewRows = useMemo(() => reviewRowsQuery.data ?? [], [reviewRowsQuery.data]);
  const reviewRowById = useMemo(() => new Map(reviewRows.filter((row) => row.reviewId != null).map((row) => [String(row.reviewId), row])), [reviewRows]);
  const reviewRowIds = useMemo(() => reviewRows.filter((row) => row.reviewId != null).map((row) => String(row.reviewId)), [reviewRows]);
  const reviewSourceHistoryIdSet = useMemo(() => new Set(reviewRows.map((row) => text(row.id))), [reviewRows]);
  const availableHistoryRows = useMemo(
    () => activeEngineerHistoryRows.filter((row) => !reviewSourceHistoryIdSet.has(text(row.id))),
    [activeEngineerHistoryRows, reviewSourceHistoryIdSet],
  );
  const selectedHistoryRows = useMemo(
    () => availableHistoryRows.filter((row) => selectedHistoryIds.includes(historySelectionKey(row))),
    [availableHistoryRows, selectedHistoryIds],
  );
  const historyRowIds = useMemo(() => availableHistoryRows.map(historySelectionKey), [availableHistoryRows]);
  const historyAllSelected = historyRowIds.length > 0 && historyRowIds.every((id) => selectedHistoryIds.includes(id));
  const historySomeSelected = historyRowIds.some((id) => selectedHistoryIds.includes(id)) && !historyAllSelected;
  const reviewAllSelected = reviewRowIds.length > 0 && selectedReviewIds.length === reviewRowIds.length;
  const reviewSomeSelected = selectedReviewIds.length > 0 && selectedReviewIds.length < reviewRowIds.length;
  const handleToggleAllHistorySelection = useCallback(() => {
    setSelectedHistoryIds(historyAllSelected ? [] : historyRowIds);
    setHistorySelectionAnchorId(null);
  }, [historyAllSelected, historyRowIds]);

  const handleHistorySelection = useCallback(
    (id: string, event?: ReviewSelectionClickEvent, source: "row" | "checkbox" = "row") => {
      const isModifierClick = Boolean(event?.ctrlKey || event?.metaKey);
      const isRangeClick = Boolean(event?.shiftKey);

      setSelectedHistoryIds((current) => {
        if (!isModifierClick && !isRangeClick) {
          setHistorySelectionAnchorId(id);
          if (source === "checkbox") {
            return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
          }
          return [id];
        }

        if (isRangeClick) {
          const anchorId = historySelectionAnchorId ?? current[current.length - 1] ?? id;
          const anchorIndex = historyRowIds.indexOf(anchorId);
          const targetIndex = historyRowIds.indexOf(id);

          if (anchorIndex < 0 || targetIndex < 0) {
            setHistorySelectionAnchorId(id);
            return Array.from(new Set([...current, id]));
          }

          const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
          const rangeIds = historyRowIds.slice(start, end + 1);
          setHistorySelectionAnchorId(anchorId);
          return Array.from(new Set([...current, ...rangeIds]));
        }

        setHistorySelectionAnchorId(id);
        return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      });
    },
    [historyRowIds, historySelectionAnchorId],
  );

  const handleToggleAllReviewSelection = useCallback(() => {
    setSelectedReviewIds(reviewAllSelected ? [] : reviewRowIds);
    setReviewSelectionAnchorId(null);
  }, [reviewAllSelected, reviewRowIds]);

  const handleHistoryResizePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      historyResizeStartYRef.current = event.clientY;
      historyResizeStartHeightRef.current = historyCardHeight;

      const abortController = new AbortController();
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";

      const stopResize = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        abortController.abort();
      };

      window.addEventListener(
        "pointermove",
        (moveEvent) => {
          const deltaY = moveEvent.clientY - historyResizeStartYRef.current;
          setHistoryCardHeight(clampHistoryCardHeight(historyResizeStartHeightRef.current + deltaY));
        },
        { signal: abortController.signal },
      );
      window.addEventListener("pointerup", stopResize, { once: true, signal: abortController.signal });
      window.addEventListener("pointercancel", stopResize, { once: true, signal: abortController.signal });
    },
    [historyCardHeight],
  );

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

  const handleReviewSelection = useCallback(
    (reviewId: string, event?: ReviewSelectionClickEvent, source: "row" | "checkbox" = "row") => {
      const isModifierClick = Boolean(event?.ctrlKey || event?.metaKey);
      const isRangeClick = Boolean(event?.shiftKey);

      setSelectedReviewIds((current) => {
        if (!isModifierClick && !isRangeClick) {
          setReviewSelectionAnchorId(reviewId);
          if (source === "checkbox") {
            return current.includes(reviewId) ? current.filter((item) => item !== reviewId) : [...current, reviewId];
          }
          return [reviewId];
        }

        if (isRangeClick) {
          const anchorId = reviewSelectionAnchorId ?? current[current.length - 1] ?? reviewId;
          const anchorIndex = reviewRowIds.indexOf(anchorId);
          const targetIndex = reviewRowIds.indexOf(reviewId);

          if (anchorIndex < 0 || targetIndex < 0) {
            setReviewSelectionAnchorId(reviewId);
            return Array.from(new Set([...current, reviewId]));
          }

          const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
          const rangeIds = reviewRowIds.slice(start, end + 1);
          setReviewSelectionAnchorId(anchorId);
          return Array.from(new Set([...current, ...rangeIds]));
        }

        setReviewSelectionAnchorId(reviewId);
        return current.includes(reviewId) ? current.filter((item) => item !== reviewId) : [...current, reviewId];
      });
    },
    [reviewRowIds, reviewSelectionAnchorId],
  );
  const labelByJobField = jobFieldReferences.labelByValue;
  const labelBySpecialtyField = specialtyFieldReferences.labelByValue;
  const labelByEngLevel = engLevelReferences.labelByValue;

  const engineerColumns = useMemo<GridColDef<EngineerDocumentRow>[]>(
    () => [
      // { field: "engineerId", headerName: "기술인ID", width: 96, ...center },
      { field: "name", headerName: "성명", width: 92, ...center },
      { field: "birthDate", headerName: "생년월일", width: 105, ...center },
      { field: "position", headerName: "직위", width: 90, ...center },
      {
        field: "jobField",
        headerName: "직무분야",
        width: 110,
        ...center,
        valueFormatter: (value) => formatReferenceLabel(labelByJobField, value),
      },
      {
        field: "specialtyField",
        headerName: "전문분야",
        width: 110,
        ...center,
        valueFormatter: (value) => formatReferenceLabel(labelBySpecialtyField, value),
      },
    ],
    [labelByJobField, labelBySpecialtyField],
  );

  const historyColumns = useMemo<GridColDef<PerformanceHistoryRow>[]>(
    () => [
      {
        field: "__select__",
        headerName: "선택",
        width: 64,
        ...center,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => (
          <Checkbox
            checked={historyAllSelected}
            indeterminate={historySomeSelected && !historyAllSelected}
            onChange={handleToggleAllHistorySelection}
            onClick={(event) => event.stopPropagation()}
            size="small"
            sx={{
              p: 0,
              "& .MuiSvgIcon-root": {
                fontSize: 18,
              },
            }}
          />
        ),
        renderCell: ({ row }) => (
          <Checkbox
            checked={selectedHistoryIds.includes(historySelectionKey(row))}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onChange={(event) => {
              event.stopPropagation();
              handleHistorySelection(historySelectionKey(row), undefined, "checkbox");
            }}
            onMouseDown={(event) => event.stopPropagation()}
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
      { field: "jobName", headerName: "용역명", minWidth: 220, flex: 1.2 },
      { field: "compName", headerName: "참여당시 회사", width: 150 },
      {
        field: "engLevel",
        headerName: "참여분야 직위",
        width: 130,
        ...center,
        valueFormatter: (value) => formatPaddedLevel2CodeLabel(labelByEngLevel, value),
      },
      { field: "grade", headerName: "참여당시 직위", width: 120, ...center },
      { field: "orderClient", headerName: "발주처", width: 150 },
      { field: "contractAmt", headerName: "계약금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatMoney(value) },
      { field: "ownAmt", headerName: "자사금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatMoney(value) },
      { field: "divisionRate", headerName: "지분율", width: 90, align: "right", headerAlign: "center", valueFormatter: (value) => formatDivisionRate(value) },
      { field: "contractFromDate", headerName: "계약시작", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "contractToDate", headerName: "계약종료", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "startDate", headerName: "참여시작", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "endDate", headerName: "참여종료", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "duty", headerName: "담당업무", width: 120, ...center },
      { field: "proPart", headerName: "전문분야", width: 120, ...center },
      { field: "returnYn", headerName: "신고여부", width: 90, ...center },
    ],
    [handleHistorySelection, handleToggleAllHistorySelection, historyAllSelected, historySomeSelected, labelByEngLevel, selectedHistoryIds],
  );

  const reviewColumns = useMemo<GridColDef<EngineerProjectHistoryReviewRecord>[]>(
    () => [
      {
        field: "__select__",
        headerName: "선택",
        width: 64,
        ...center,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => (
          <Checkbox
            checked={reviewAllSelected}
            indeterminate={reviewSomeSelected && !reviewAllSelected}
            onChange={handleToggleAllReviewSelection}
            onClick={(event) => event.stopPropagation()}
            size="small"
            sx={{
              p: 0,
              "& .MuiSvgIcon-root": {
                fontSize: 18,
              },
            }}
          />
        ),
        renderCell: ({ row }) => (
          <Checkbox
            checked={row.reviewId != null && selectedReviewIds.includes(String(row.reviewId))}
            onClick={(event) => {
              event.stopPropagation();
              if (row.reviewId != null) {
                handleReviewSelection(String(row.reviewId), event, "checkbox");
              }
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
      {
        field: "displayOrder",
        headerName: "순번",
        width: 75,
        ...center,
        editable: canUpdate,
        sortComparator: (left, right) => Number(left ?? Number.MAX_SAFE_INTEGER) - Number(right ?? Number.MAX_SAFE_INTEGER),
        renderEditCell: (params: GridRenderEditCellParams<EngineerProjectHistoryReviewRecord, number | null>) => (
          <TextField
            autoFocus
            fullWidth
            onChange={(event) => {
              const digitsOnly = event.target.value.replace(/\D/g, "");
              void params.api.setEditCellValue({ field: params.field, id: params.id, value: digitsOnly });
            }}
            onFocus={(event) => {
              // 순번을 편집할 때 기존 값을 전체 선택해 바로 입력한 값으로 대체할 수 있도록 한다.
              event.currentTarget.select();
            }}
            onClick={(event) => event.stopPropagation()}
            size="small"
            slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
            value={params.value ?? ""}
            variant="standard"
          />
        ),
      },
      { field: "jobName", headerName: "용역명", minWidth: 220, flex: 1.2 },
      { field: "compName", headerName: "참여당시 회사", width: 150 },
      {
        field: "engLevel",
        headerName: "참여분야 직위",
        width: 130,
        ...center,
        valueFormatter: (value) => formatPaddedLevel2CodeLabel(labelByEngLevel, value),
      },
      { field: "grade", headerName: "참여당시 직위", width: 120, ...center },
      { field: "orderClient", headerName: "발주처", width: 150 },
      { field: "contractAmt", headerName: "계약금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatMoney(value) },
      { field: "ownAmt", headerName: "자사금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatMoney(value) },
      { field: "divisionRate", headerName: "지분율", width: 90, align: "right", headerAlign: "center", valueFormatter: (value) => formatDivisionRate(value) },
      { field: "contractFromDate", headerName: "계약시작", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "contractToDate", headerName: "계약종료", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "startDate", headerName: "참여시작", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "endDate", headerName: "참여종료", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "duty", headerName: "담당업무", width: 120, ...center },
      { field: "proPart", headerName: "전문분야", width: 120, ...center },
      { field: "returnYn", headerName: "신고여부", width: 90, ...center },
    ],
    [canUpdate, handleReviewSelection, handleToggleAllReviewSelection, labelByEngLevel, reviewAllSelected, reviewSomeSelected, selectedReviewIds],
  );
  const orderedHistoryColumns = useMemo(() => {
    const order = [
      "__select__",
      "jobName",
      "orderClient",
      "contractAmt",
      "ownAmt",
      "contractFromDate",
      "contractToDate",
      "startDate",
      "endDate",
      "compName",
      "grade",
      "duty",
      "divisionRate",
      "proPart",
      "returnYn",
    ];
    const orderByField = new Map(order.map((field, index) => [field, index]));
    return historyColumns
      .filter((column) => orderByField.has(column.field))
      .sort((left, right) => orderByField.get(left.field)! - orderByField.get(right.field)!);
  }, [historyColumns]);
  const orderedReviewColumns = useMemo(() => {
    const order = [
      "__select__",
      "displayOrder",
      "jobName",
      "orderClient",
      "contractAmt",
      "ownAmt",
      "contractFromDate",
      "contractToDate",
      "startDate",
      "endDate",
      "compName",
      "grade",
      "duty",
      "divisionRate",
      "proPart",
      "returnYn",
    ];
    const orderByField = new Map(order.map((field, index) => [field, index]));
    return reviewColumns
      .filter((column) => orderByField.has(column.field))
      .sort((left, right) => orderByField.get(left.field)! - orderByField.get(right.field)!);
  }, [reviewColumns]);

  const handleLoad = () => {
    if (!canRead || !selectedBidNotice) {
      return;
    }
    setSelectedHistoryIds([]);
    setHistorySelectionAnchorId(null);
    setSelectedReviewIds([]);
    setReviewSelectionAnchorId(null);
    setPendingBulkDeleteReviewIds(null);
    setPerformanceDetailSeq(null);
    void engineersQuery.refetch();
    if (activeEngineerId) {
      void projectHistoryRowsQuery.refetch();
    }
  };

  const handleReset = () => {
    setKeyword("");
    setActiveEngineerId("");
    setSelectedHistoryIds([]);
    setSelectedReviewIds([]);
    setReviewSelectionAnchorId(null);
    setPendingBulkDeleteReviewIds(null);
    setRelatedProjectHistoryConditions([]);
  };

  const invalidateReviewRows = async () => {
    await queryClient.invalidateQueries({ queryKey: ["engineer-performance-docs", "review-results"] });
  };

  const syncReviewResultsForConditions = useCallback(
    async (conditions: RelatedProjectHistoryCondition[]) => {
      if ((!canCreate && !canUpdate) || !selectedBidSeq || profiles.length === 0) {
        return;
      }

      try {
        await Promise.all(
          profiles.map((profile) =>
            syncEngineerProjectHistoryReviewResults({
              bidSeq: selectedBidSeq,
              engineerId: profile.summary.id,
              relatedProjectHistoryConditions: conditions,
            }),
          ),
        );
        await queryClient.invalidateQueries({ queryKey: ["engineer-performance-docs", "review-results"] });
        showSuccess("관련 공사 참여 이력을 검토결과에 반영했습니다.");
      } catch (error) {
        showError(error instanceof Error ? error.message : "관련 공사 참여 이력을 검토결과에 반영하지 못했습니다.");
        throw error;
      }
    },
    [canCreate, canUpdate, profiles, queryClient, selectedBidSeq, showError, showSuccess],
  );

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!canCreate || !selectedBidNotice?.bidSeq) {
        throw new Error("공고문을 먼저 선택하세요.");
      }
      if (!activeEngineerProfile) {
        throw new Error("기술인을 먼저 선택하세요.");
      }

      const bidSeq = selectedBidNotice.bidSeq;
      const uniqueRowsBySourceHistoryId = Array.from(new Map(selectedHistoryRows.map((row) => [text(row.id), row])).values());
      const orderedRows = [...uniqueRowsBySourceHistoryId].sort(compareHistoryRowsForDisplayOrder);
      const nextDisplayOrder = Math.max(0, ...reviewRows.map((row) => row.displayOrder ?? 0)) + 1;
      const requestBodies = orderedRows.map((row, index) => ({
        bidSeq,
        engineerId: activeEngineerProfile.summary.id,
        sourceSeq: Number(row.id),
        displayOrder: nextDisplayOrder + index,
        sourceRow: row,
      }));

      return createEngineerProjectHistoryReviewResults(requestBodies);
    },
    onSuccess: async () => {
      setSelectedHistoryIds([]);
      setAddConfirmOpen(false);
      await invalidateReviewRows();
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      if (!canDelete || !selectedBidNotice?.bidSeq) {
        throw new Error("삭제할 검토결과가 없습니다.");
      }

      const bidSeq = selectedBidNotice.bidSeq;
      const targetReviews =
        pendingBulkDeleteReviewIds && pendingBulkDeleteReviewIds.length > 0
          ? pendingBulkDeleteReviewIds
              .map((reviewId) => reviewRowById.get(reviewId))
              .filter((row): row is EngineerProjectHistoryReviewRecord & { reviewId: number } => Boolean(row?.reviewId))
          : [];

      if (targetReviews.length === 0) {
        throw new Error("삭제할 검토결과가 없습니다.");
      }

      await Promise.all(
        targetReviews.map((row) =>
          deleteEngineerProjectHistoryReviewResult({
            bidSeq,
            engineerId: row.engineerId,
            reviewId: row.reviewId,
          }),
        ),
      );
    },
    onSuccess: async () => {
      setPendingBulkDeleteReviewIds(null);
      setSelectedReviewIds([]);
      await invalidateReviewRows();
    },
  });

  const deleteEngineerMutation = useMutation({
    mutationFn: async () => {
      if (!canDelete || !selectedBidSeq || !pendingBulkDeleteEngineerIds?.length) {
        throw new Error("삭제할 기술인이 없습니다.");
      }

      const participatingEngineers = await listPqParticipatingEngineers({ bidSeq: selectedBidSeq });
      const targetEngineerIds = new Set(pendingBulkDeleteEngineerIds);
      const targetRows = participatingEngineers.filter((row) => targetEngineerIds.has(row.engrId));

      if (targetRows.length === 0) {
        throw new Error("삭제할 기술인이 없습니다.");
      }

      await Promise.all(
        targetRows.map((row) => deletePqParticipatingEngineer(row.bidSeq, row.workDutyId, row.engrId)),
      );
    },
    onSuccess: async () => {
      const deletedEngineerIds = pendingBulkDeleteEngineerIds ?? [];
      setPendingBulkDeleteEngineerIds(null);
      setSelectedEngineerIds([]);
      if (deletedEngineerIds.includes(activeEngineerId)) {
        setActiveEngineerId("");
      }
      await queryClient.invalidateQueries({
        queryKey: ["engineer-performance-docs", "selected-engineers", selectedBidSeq ?? "none"],
      });
      showSuccess("선택한 기술인을 삭제했습니다.");
    },
  });

  const processReviewRowUpdate = useCallback(
    async (updatedRow: EngineerProjectHistoryReviewRecord, originalRow: EngineerProjectHistoryReviewRecord) => {
      if (!canUpdate || updatedRow.reviewId == null) {
        return originalRow;
      }

      const displayOrder = Number(updatedRow.displayOrder);
      if (!Number.isInteger(displayOrder) || displayOrder < 1) {
        throw new Error("순번은 1 이상의 정수로 입력해 주세요.");
      }

      try {
        const saved = await updateEngineerProjectHistoryReviewResult(
          {
            bidSeq: updatedRow.bidSeq ?? selectedBidSeq ?? 0,
            engineerId: updatedRow.engineerId,
            sourceSeq: updatedRow.sourceSeq,
            displayOrder,
            sourceRow: originalRow,
          },
          updatedRow.reviewId,
        );
        showSuccess("검토결과 순번을 저장했습니다.");
        return saved;
      } catch (error) {
        showError(error instanceof Error ? error.message : "검토결과 순번을 저장하지 못했습니다.");
        throw error;
      }
    },
    [canUpdate, selectedBidSeq, showError, showSuccess],
  );

  const handleExcelDownload = useCallback(async () => {
    if (!canRead || !selectedBidNotice?.bidSeq || profiles.length === 0 || isExcelDownloading) {
      return;
    }

    const bidSeq = selectedBidNotice.bidSeq;
    setIsExcelDownloading(true);

    try {
      const reviewResultsByEngineer = await Promise.all(
        profiles.map(async (profile) => {
          const engineerId = profile.summary.id;
          const results = await listEngineerProjectHistoryReviewResults({
            bidSeq,
            engineerId,
          });

          return { engineerId, results };
        }),
      );

      await downloadEngineerPerformanceReviewWorkbook({
        profiles,
        projectName: text(selectedBidNotice.projectName),
        reviewResultsByEngineer,
        engLevelLabelByCode: labelByEngLevel,
      });
    } catch (error) {
      showError(error instanceof Error ? error.message : "기술인 검토결과 엑셀을 다운로드하지 못했습니다.");
    } finally {
      setIsExcelDownloading(false);
    }
  }, [canRead, isExcelDownloading, labelByEngLevel, profiles, selectedBidNotice, showError]);

  function openBulkDeleteConfirm() {
    if (selectedReviewIds.length === 0) {
      return;
    }
    setPendingBulkDeleteReviewIds(selectedReviewIds);
  }

  function openEngineerDeleteConfirm() {
    if (selectedEngineerIds.length === 0) {
      return;
    }
    setPendingBulkDeleteEngineerIds(selectedEngineerIds);
  }

  return (
    <>
      <Box>
      <PageHeader
        title="기술인실적 문서생성"
      />

      {!canRead ? (
        <Alert severity="warning">기술인실적 문서를 조회할 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      label="공고명"
                      placeholder="공고문을 선택하세요"
                      size="small"
                      sx={fieldSx}
                      value={selectedBidNotice?.projectName ?? ""}
                      slotProps={{ input: { readOnly: true } }}
                    />
                    <Button
                      disabled={!canRead}
                      onClick={() => setBidNoticeDialogOpen(true)}
                      startIcon={<SearchOutlinedIcon />}
                      sx={{ flex: "0 0 auto", minWidth: 88, whiteSpace: "nowrap" }}
                      type="button"
                      variant="outlined"
                    >
                      선택
                    </Button>
                    <Button
                      disabled={!selectedBidNotice || !canRead}
                      onClick={() => setBidNoticeDetailOpen(true)}
                      startIcon={<VisibilityOutlinedIcon />}
                      sx={{ flex: "0 0 auto", minWidth: 112, whiteSpace: "nowrap" }}
                      type="button"
                      variant="outlined"
                    >
                      상세보기
                    </Button>
                  </Stack>
                </Grid>
                {selectedBidNotice ? (
                  <>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    label="발주처"
                    size="small"
                    sx={fieldSx}
                    value={text(selectedBidNotice?.orderClientName ?? selectedBidNotice?.orderClient)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
                  <TextField
                    fullWidth
                    label="공고일"
                    size="small"
                    sx={fieldSx}
                    value={text(selectedBidNotice?.announceDate).slice(0, 10)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
                  <TextField
                    fullWidth
                    label="입찰등록 마감"
                    size="small"
                    sx={fieldSx}
                    value={text(selectedBidNotice?.bidClosingDate).slice(0, 10)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                  <TextField
                    fullWidth
                    label="기술인 검색"
                    onChange={(event) => setKeyword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleLoad();
                      }
                    }}
                    size="small"
                    sx={fieldSx}
                    value={keyword}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8, md: 10 }}>
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" }, gap: 1, flexWrap: "wrap" }}>
                    <Button disabled={!canRead || !selectedBidNotice || engineersQuery.isFetching} onClick={handleLoad} startIcon={<SearchOutlinedIcon />} variant="contained">
                      조회
                    </Button>
                    <Button onClick={handleReset} startIcon={<RefreshOutlinedIcon />} variant="outlined">
                      초기화
                    </Button>
                  </Box>
                </Grid>
                  </>
                ) : null}
              </Grid>
            </CardContent>
          </Card>
          <Box
            sx={{
              alignItems: { xs: "start", xl: "stretch" },
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", xl: selectorPanelCollapsed ? "minmax(0, 1fr)" : `${selectorPanelWidth}px minmax(0, 1fr)` },
            }}
          >
            {!selectorPanelCollapsed ? <Card sx={{ display: "flex", flexDirection: "column", height: { xs: "auto", xl: "100%" }, minWidth: 0, position: "relative" }} variant="outlined">
              <CardContent sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }} variant="h6">
                      선택 기술인 목록
                    </Typography>
                  </Box>
                  <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
                    <Chip label={`${engineerRows.length}명`} size="small" variant="outlined" />
                    <IconButton
                      aria-label="선택한 기술인 삭제"
                      color="error"
                      disabled={!canDelete || selectedEngineerIds.length === 0 || deleteEngineerMutation.isPending}
                      onClick={openEngineerDeleteConfirm}
                      size="small"
                      title="선택한 기술인 삭제"
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="기술인별 검토결과 엑셀로 내보내기"
                      disabled={!selectedBidNotice || profiles.length === 0 || engineersQuery.isFetching || isExcelDownloading}
                      onClick={() => void handleExcelDownload()}
                      size="small"
                      title={isExcelDownloading ? "엑셀 생성 중" : "기술인별 검토결과 엑셀로 내보내기"}
                    >
                      <FileDownloadOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ flex: { xs: "0 0 auto", xl: 1 }, minHeight: 0 }}>
                <EnterpriseDataGrid<EngineerDocumentRow>
                  checkboxSelection
                  columns={engineerColumns}
                  disableRowSelectionOnClick
                  getRowId={(row) => row.engineerId}
                  hideFooter
                  hideFooterSelectedRowCount
                  loading={engineersQuery.isLoading || engineersQuery.isFetching}
                  onRowClick={(params: GridRowParams<EngineerDocumentRow>) => {
                    setActiveEngineerId(params.row.engineerId);
                    setDocumentValueSettingOpen(false);
                    setDocumentValueSetting(null);
                    setSelectedHistoryIds([]);
                    setHistorySelectionAnchorId(null);
                    setSelectedReviewIds([]);
                    setReviewSelectionAnchorId(null);
                    setPendingBulkDeleteReviewIds(null);
                    setPerformanceDetailSeq(null);
                  }}
                  onRowDoubleClick={(params: GridRowParams<EngineerDocumentRow>) => {
                    const profile = profiles.find((item) => item.summary.id === params.row.engineerId) ?? null;
                    if (profile) {
                      const saved = documentValueSettingsByEngineerId.get(params.row.engineerId);
                      setActiveEngineerId(params.row.engineerId);
                      setDocumentValueSetting(
                        saved
                          ? {
                              certificate: profile.certificates.find((item) => String(item.id) === String(saved.licenseId)) ?? null,
                              education: profile.education.find((item) => String(item.id) === String(saved.educationId)) ?? null,
                            }
                          : null,
                      );
                      setDocumentValueSettingOpen(true);
                    }
                  }}
                  getRowClassName={(params) =>
                    documentValueSettingsQuery.isSuccess && !params.row.documentValueConfigured
                      ? "document-value-setting-required"
                      : ""
                  }
                  onRowSelectionModelChange={(model: GridRowSelectionModel) => {
                    setSelectedEngineerIds(Array.from(model.ids, String));
                  }}
                  paginationMode="server"
                  rowCount={engineerRows.length}
                  rows={engineerRows}
                  rowSelectionModel={{ ids: new Set(selectedEngineerIds), type: "include" }}
                  columnHeaderHeight={36}
                  rowHeight={30}
                  showToolbar={false}
                  wrapperMinHeight={{ ...selectorGridHeight, xl: "100%" }}
                  sx={{
                    border: 0,
                    height: { ...selectorGridHeight, xl: "100%" },
                    "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                    "& .MuiDataGrid-main": { overflow: "hidden" },
                    "& .MuiDataGrid-virtualScroller": {
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                    },
                    "& .MuiDataGrid-row.document-value-setting-required": {
                      backgroundColor: "#fff8d6 !important",
                    },
                    "& .MuiDataGrid-row.document-value-setting-required:hover": {
                      backgroundColor: "#ffefad !important",
                    },
                  }}
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
              />
            </Card> : null}

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateRows: "auto auto",
                minWidth: 0,
              }}
            >
              <Card
                sx={{
                  height: historyCardHeight,
                  minHeight: HISTORY_CARD_MIN_HEIGHT,
                  minWidth: 0,
                  position: "relative",
                }}
                variant="outlined"
              >
                <CardContent sx={{ boxSizing: "border-box", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, pb: 2.5 }}>
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }} variant="h6">
                        선택한 기술인의 프로젝트 이력
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {activeEngineerProfile
                          ? `${activeEngineerProfile.summary.name} / ${activeEngineerProfile.summary.department || "-"}`
                          : "기술인을 선택하세요."}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Chip label={`${availableHistoryRows.length}건`} size="small" variant="outlined" />
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
                        disabled={!canCreate || selectedHistoryRows.length === 0}
                        onClick={() => setAddConfirmOpen(true)}
                        startIcon={<AddOutlinedIcon />}
                        size="small"
                        variant="contained"
                      >
                        추가
                      </Button>
                    </Stack>
                  </Box>
                  <Box sx={{ minHeight: 0 }}>
                    <EnterpriseDataGrid<PerformanceHistoryRow>
                      columns={orderedHistoryColumns}
                      getRowId={(row) => historySelectionKey(row)}
                      hideFooter
                      hideFooterSelectedRowCount
                      loading={projectHistoryRowsQuery.isLoading || projectHistoryRowsQuery.isFetching}
                      onRowClick={(params: GridRowParams<PerformanceHistoryRow>, event) => {
                        handleHistorySelection(historySelectionKey(params.row), event);
                      }}
                      onRowDoubleClick={(params: GridRowParams<PerformanceHistoryRow>) => {
                        if (params.row.seq) {
                          setPerformanceDetailSeq(params.row.seq);
                        }
                      }}
                      paginationMode="server"
                      rowCount={availableHistoryRows.length}
                      rows={availableHistoryRows}
                      columnHeaderHeight={36}
                      rowHeight={30}
                      showToolbar={false}
                      wrapperMinHeight={historyGridHeight}
                      sx={{
                        border: 0,
                        height: historyGridHeight,
                        "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                        "& .MuiDataGrid-main": { overflow: "hidden" },
                        "& .MuiDataGrid-virtualScroller": {
                          overflowY: "auto",
                          overscrollBehavior: "contain",
                        },
                      }}
                    />
                  </Box>
                </CardContent>
                <ResizeHandle
                  ariaLabel="프로젝트 이력 높이 조절"
                  orientation="horizontal"
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setHistoryCardHeight((height) => clampHistoryCardHeight(height - 10));
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setHistoryCardHeight((height) => clampHistoryCardHeight(height + 10));
                    }
                  }}
                  onPointerDown={handleHistoryResizePointerDown}
                />
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      alignItems: { xs: "flex-start", xl: "center" },
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.5,
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800 }} variant="h6">
                        관련공사 참여이력 검토결과
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {activeEngineerProfile ? "" : "기술인을 먼저 선택하세요."}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        alignItems: "center",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        justifyContent: "flex-end",
                        minWidth: 0,
                      }}
                    >
                      <RelatedProjectHistoryConditionsPanel
                        bidSeq={selectedBidSeq}
                        disabled={!canCreate && !canUpdate}
                        onApply={setRelatedProjectHistoryConditions}
                        onSaved={syncReviewResultsForConditions}
                        value={relatedProjectHistoryConditions}
                      />
                      <Chip color="success" label={`검토결과 ${reviewRows.length}건`} size="small" />
                      <Button
                        color="error"
                        disabled={!canDelete || selectedReviewIds.length === 0}
                        onClick={openBulkDeleteConfirm}
                        startIcon={<DeleteOutlineOutlinedIcon />}
                        size="small"
                        variant="outlined"
                      >
                        체크 항목 삭제
                      </Button>
                    </Box>
                  </Box>
                  <EnterpriseDataGrid<EngineerProjectHistoryReviewRecord>
                    columns={orderedReviewColumns}
                    getRowId={(row) => row.reviewId ?? row.id}
                    hideFooter
                    hideFooterSelectedRowCount
                    loading={reviewRowsQuery.isLoading || reviewRowsQuery.isFetching}
                    onCellClick={(params, event) => {
                      if (canUpdate && params.field === "displayOrder") {
                        params.api.startCellEditMode({ field: params.field, id: params.id });
                        event.stopPropagation();
                      }
                    }}
                    onRowClick={(params: GridRowParams<EngineerProjectHistoryReviewRecord>, event) => {
                      if (params.row.reviewId != null) {
                        handleReviewSelection(String(params.row.reviewId), event);
                      }
                    }}
                    onRowDoubleClick={(params: GridRowParams<EngineerProjectHistoryReviewRecord>, event) => {
                      const clickedField = event.target instanceof HTMLElement
                        ? event.target.closest(".MuiDataGrid-cell")?.getAttribute("data-field")
                        : null;
                      if (clickedField === "displayOrder") {
                        return;
                      }
                      if (params.row.seq) {
                        setPerformanceDetailSeq(params.row.seq);
                      }
                    }}
                    paginationMode="server"
                    editMode="cell"
                    initialState={{ sorting: { sortModel: [{ field: "displayOrder", sort: "asc" }] } }}
                    onProcessRowUpdateError={() => undefined}
                    processRowUpdate={canUpdate ? processReviewRowUpdate : undefined}
                    rowCount={reviewRows.length}
                    rows={reviewRows}
                    columnHeaderHeight={36}
                    rowHeight={30}
                    exportFileNamePrefix="관련공사 참여이력 검토결과"
                    showPrintButton={false}
                    showToolbar
                    showXlsxExportButton
                    wrapperMinHeight={reviewGridHeight}
                    sx={{
                      border: 0,
                      height: reviewGridHeight,
                      "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                      "& .MuiDataGrid-main": { overflow: "hidden" },
                      "& .MuiDataGrid-virtualScroller": {
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Box>
          </Box>
          <HwpxTemplateGenerationPanel bidNotice={selectedBidNotice} open profiles={profiles} relatedProjectHistoryConditions={relatedProjectHistoryConditions} />
        </Stack>
      )}

      {bidNoticeDialogOpen ? (
        <BidNoticeSelectDialog
          open
          onClose={() => setBidNoticeDialogOpen(false)}
          stateCacheKey="engineer-performance-docs:bid-notice-select"
          onSelect={(record) => {
            setSelectedBidNotice(record);
            setBidNoticeDialogOpen(false);
            setKeyword("");
            setActiveEngineerId("");
            setDocumentValueSettingOpen(false);
            setDocumentValueSetting(null);
            setPerformanceDetailSeq(null);
            setSelectedHistoryIds([]);
            setHistorySelectionAnchorId(null);
            setSelectedReviewIds([]);
            setReviewSelectionAnchorId(null);
            setAddConfirmOpen(false);
            setPendingBulkDeleteReviewIds(null);
            setRelatedProjectHistoryConditions([]);
          }}
        />
      ) : null}
      {bidNoticeDetailOpen ? (
        <BidNoticeDetailPopup
          bidSeq={selectedBidNotice?.bidSeq ?? null}
          onClose={() => setBidNoticeDetailOpen(false)}
          open
          readOnly
        />
      ) : null}
      <ConfirmActionDialog
        confirmColor="primary"
        confirmLabel="추가"
        loading={addReviewMutation.isPending}
        message="선택한 기술인의 프로젝트 이력을 관련공사 참여이력 검토결과에 추가합니다."
        onClose={() => setAddConfirmOpen(false)}
        onConfirm={() => void addReviewMutation.mutateAsync()}
        open={addConfirmOpen}
        targetLabel={`${selectedHistoryRows.length}건`}
        title="검토결과 추가 확인"
      />
      <ConfirmDeleteDialog
        loading={deleteReviewMutation.isPending}
        onClose={() => {
          setPendingBulkDeleteReviewIds(null);
        }}
        onConfirm={() => void deleteReviewMutation.mutateAsync()}
        open={Boolean(pendingBulkDeleteReviewIds?.length)}
        targetLabel={pendingBulkDeleteReviewIds?.length ? `${pendingBulkDeleteReviewIds.length}건` : undefined}
      />
      <ConfirmDeleteDialog
        loading={deleteEngineerMutation.isPending}
        onClose={() => {
          setPendingBulkDeleteEngineerIds(null);
        }}
        onConfirm={() => void deleteEngineerMutation.mutateAsync()}
        open={Boolean(pendingBulkDeleteEngineerIds?.length)}
        targetLabel={pendingBulkDeleteEngineerIds?.length ? `${pendingBulkDeleteEngineerIds.length}명` : undefined}
      />
      {performanceDetailSeq ? (
        <CompanyPerformanceDetailPopup onClose={() => setPerformanceDetailSeq(null)} open seq={performanceDetailSeq} />
      ) : null}
      </Box>
      <EngineerDocumentValueSettingDialog
        engineer={activeEngineerProfile}
        onClose={() => setDocumentValueSettingOpen(false)}
        onConfirm={(value) => void saveDocumentValueSettingMutation.mutateAsync(value)}
        open={documentValueSettingOpen}
        projectName={selectedBidNotice?.projectName ?? ""}
        value={documentValueSetting}
      />
    </>
    );
}
