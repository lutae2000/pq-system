"use client";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRowParams } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { BidNoticeSelectDialog } from "@/modules/pq/bid-notice/BidNoticeSelectDialog";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import { CompanyPerformanceDetailPopup } from "@/modules/pq/company-performance/CompanyPerformanceDetailPopup";
import { HancomWebHwpPanel } from "@/modules/pq/engineer-performance-docs/HancomWebHwpPanel";
import { HwpxTemplateGenerationPanel } from "@/modules/pq/engineer-performance-docs/HwpxTemplateGenerationPanel";
import {
  createEngineerProjectHistoryReviewResults,
  deleteEngineerProjectHistoryReviewResult,
  listEngineerProjectHistories,
  listEngineerProjectHistoryReviewResults,
  type EngineerProjectHistoryReviewRecord,
} from "@/modules/pq/engineer-performance-docs/api";
import { listSelectedEngineerProfilesForBidNotice } from "@/modules/pq/engineers/api";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";

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

const clampHistoryCardHeight = (height: number) =>
  Math.min(Math.max(Math.round(height), HISTORY_CARD_MIN_HEIGHT), HISTORY_CARD_MAX_HEIGHT);

const clampSelectorPanelWidth = (width: number) =>
  Math.min(Math.max(Math.round(width), SELECTOR_PANEL_MIN_WIDTH), SELECTOR_PANEL_MAX_WIDTH);

const buildHwpHtml = (
  bidNotice: BidNoticeApiRecord | null,
  rows: PerformanceHistoryRow[],
  relatedProjectHistoryConditions: RelatedProjectHistoryCondition[],
) => {
  const relatedConditionLabels = relatedProjectHistoryConditions.map((condition) => condition.label || "조건 입력 중");
  const title = "기술인실적 문서";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: "Malgun Gothic", Arial, sans-serif; font-size: 12px; color: #111827; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    h2 { font-size: 15px; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #9ca3af; padding: 6px; word-break: break-all; }
    th { background: #eef2ff; font-weight: 700; }
    .meta td:first-child { width: 120px; background: #f8fafc; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table class="meta">
    <tbody>
      <tr><td>공고명</td><td>${text(bidNotice?.projectName) || "-"}</td></tr>
      <tr><td>발주처</td><td>${text(bidNotice?.orderClientName ?? bidNotice?.orderClient) || "-"}</td></tr>
      <tr><td>입찰등록 마감</td><td>${text(bidNotice?.bidClosingDate).slice(0, 10) || "-"}</td></tr>
      <tr><td>관련공사 참여 이력</td><td>${relatedConditionLabels.length > 0 ? relatedConditionLabels.join(" / ") : "-"}</td></tr>
    </tbody>
  </table>
  <h2>기술인 실적 목록</h2>
  <table>
    <thead>
      <tr>
        <th>용역명</th>
        <th>발주처</th>
        <th>계약금액</th>
        <th>계약시작</th>
        <th>계약종료</th>
        <th>참여시작</th>
        <th>참여종료</th>
        <th>담당업무</th>
        <th>전문분야</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length > 0
          ? rows
              .map(
                (row) => `<tr>
        <td>${text(row.jobName) || "-"}</td>
        <td>${text(row.orderClient) || "-"}</td>
        <td>${formatMoney(row.contractAmt)}</td>
        <td>${formatDateYmd(row.contractFromDate) || "-"}</td>
        <td>${formatDateYmd(row.contractToDate) || "-"}</td>
        <td>${formatDateYmd(row.startDate) || "-"}</td>
        <td>${formatDateYmd(row.endDate) || "-"}</td>
        <td>${text(row.duty) || "-"}</td>
        <td>${text(row.proPart) || "-"}</td>
      </tr>`,
              )
              .join("")
          : `<tr><td colspan="9">선택된 실적이 없습니다.</td></tr>`
      }
    </tbody>
  </table>
</body>
</html>`;
};

const downloadHwp = (filename: string, html: string) => {
  const blob = new Blob([html], { type: "application/x-hwp;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

function PerformanceDocumentPreview({ rows }: { rows: PerformanceHistoryRow[] }) {
  return (
    <TableContainer sx={{ maxHeight: 420, overflowX: "auto" }}>
      <Table aria-label="기술인 실적 산출물 미리보기" size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>용역명</TableCell>
            <TableCell>발주처</TableCell>
            <TableCell align="right">계약금액</TableCell>
            <TableCell>계약시작</TableCell>
            <TableCell>계약종료</TableCell>
            <TableCell>참여시작</TableCell>
            <TableCell>참여종료</TableCell>
            <TableCell>담당업무</TableCell>
            <TableCell>전문분야</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell align="center" colSpan={9}>
                선택된 실적이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={`${row.engineerId}-${row.id}`} hover>
                <TableCell>{text(row.jobName) || "-"}</TableCell>
                <TableCell>{text(row.orderClient) || "-"}</TableCell>
                <TableCell align="right">{formatMoney(row.contractAmt)}</TableCell>
                <TableCell>{formatDateYmd(row.contractFromDate) || "-"}</TableCell>
                <TableCell>{formatDateYmd(row.contractToDate) || "-"}</TableCell>
                <TableCell>{formatDateYmd(row.startDate) || "-"}</TableCell>
                <TableCell>{formatDateYmd(row.endDate) || "-"}</TableCell>
                <TableCell>{text(row.duty) || "-"}</TableCell>
                <TableCell>{text(row.proPart) || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function EngineerPerformanceDocumentsPage() {
  const { canCreate, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const canGenerate = canCreate || canUpdate;
  const queryClient = useQueryClient();
  const [bidNoticeDialogOpen, setBidNoticeDialogOpen] = useState(false);
  const [selectedBidNotice, setSelectedBidNotice] = useState<BidNoticeApiRecord | null>(null);
  const [keyword, setKeyword] = useState("");
  const [activeEngineerId, setActiveEngineerId] = useState("");
  const [performanceDetailSeq, setPerformanceDetailSeq] = useState<number | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");
  const [outputTestPanel, setOutputTestPanel] = useState<"hwpx" | "webhwp" | null>(null);
  const [relatedProjectHistoryConditions, setRelatedProjectHistoryConditions] = useState<RelatedProjectHistoryCondition[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [historySelectionAnchorId, setHistorySelectionAnchorId] = useState<string | null>(null);
  const [reviewSelectionAnchorId, setReviewSelectionAnchorId] = useState<string | null>(null);
  const [addConfirmOpen, setAddConfirmOpen] = useState(false);
  const [pendingBulkDeleteReviewIds, setPendingBulkDeleteReviewIds] = useState<string[] | null>(null);
  const [selectorPanelWidth, setSelectorPanelWidth] = useState(DEFAULT_SELECTOR_PANEL_WIDTH);
  const selectorResizeStartXRef = useRef(0);
  const selectorResizeStartWidthRef = useRef(DEFAULT_SELECTOR_PANEL_WIDTH);
  const [historyCardHeight, setHistoryCardHeight] = useState(DEFAULT_HISTORY_CARD_HEIGHT);
  const historyResizeStartYRef = useRef(0);
  const historyResizeStartHeightRef = useRef(DEFAULT_HISTORY_CARD_HEIGHT);
  const historyGridHeight = Math.max(160, historyCardHeight - HISTORY_CARD_RESERVED_HEIGHT);

  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: canRead });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: canRead });

  const engineersQuery = useQuery({
    queryKey: ["engineer-performance-docs", "selected-engineers", selectedBidNotice?.bidSeq ?? "none"],
    queryFn: () =>
      listSelectedEngineerProfilesForBidNotice({
        bidSeq: selectedBidNotice?.bidSeq ?? 0,
        keyword,
      }),
    enabled: tabQueryEnabled && Boolean(selectedBidNotice?.bidSeq),
  });

  const profiles = useMemo(() => engineersQuery.data ?? [], [engineersQuery.data]);
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
      })),
    [profiles],
  );

  const activeEngineerProfile = useMemo(
    () => profiles.find((profile) => profile.summary.id === activeEngineerId) ?? null,
    [activeEngineerId, profiles],
  );

  const selectedBidSeq = selectedBidNotice?.bidSeq ?? null;

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
      relatedProjectHistoryConditions,
    ],
    queryFn: () =>
      listEngineerProjectHistoryReviewResults({
        bidSeq: selectedBidSeq ?? 0,
        engineerId: activeEngineerId,
        relatedProjectHistoryConditions,
      }),
    enabled: tabQueryEnabled && Boolean(selectedBidSeq) && Boolean(activeEngineerId),
  });

  const reviewRows = useMemo(() => reviewRowsQuery.data ?? [], [reviewRowsQuery.data]);
  const reviewDocumentRows = useMemo<PerformanceHistoryRow[]>(
    () =>
      reviewRows.map((row) => ({
        ...row,
        engineerName: profiles.find((profile) => profile.summary.id === row.engineerId)?.summary.name ?? row.engineerId,
      })),
    [profiles, reviewRows],
  );
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

  const engineerColumns = useMemo<GridColDef<EngineerDocumentRow>[]>(
    () => [
      // { field: "engineerId", headerName: "기술인ID", width: 96, ...center },
      { field: "name", headerName: "성명", width: 92, ...center },
      { field: "birthDate", headerName: "생년월일", width: 105, ...center },
      { field: "position", headerName: "직위", width: 90, ...center },
      {
        field: "status",
        headerName: "퇴직여부",
        width: 92,
        ...center,
        renderCell: ({ value }) => {
          const label = String(value ?? "");
          return <Chip color={label === "재직" ? "success" : "default"} label={label} size="small" variant={label === "재직" ? "filled" : "outlined"} />;
        },
      },
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
      { field: "orderClient", headerName: "발주처", width: 150 },
      { field: "contractAmt", headerName: "계약금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatMoney(value) },
      { field: "ownAmt", headerName: "자사금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatMoney(value) },
      { field: "contractFromDate", headerName: "계약시작", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "contractToDate", headerName: "계약종료", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "startDate", headerName: "참여시작", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "endDate", headerName: "참여종료", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "duty", headerName: "담당업무", width: 120, ...center },
      { field: "proPart", headerName: "전문분야", width: 120, ...center },
      { field: "returnYn", headerName: "신고여부", width: 90, ...center },
    ],
    [handleHistorySelection, handleToggleAllHistorySelection, historyAllSelected, historySomeSelected, selectedHistoryIds],
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
      { field: "jobName", headerName: "용역명", minWidth: 220, flex: 1.2 },
      { field: "orderClient", headerName: "발주처", width: 150 },
      { field: "contractAmt", headerName: "계약금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatMoney(value) },
      { field: "ownAmt", headerName: "자사금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatMoney(value) },
      { field: "contractFromDate", headerName: "계약시작", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "contractToDate", headerName: "계약종료", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "startDate", headerName: "참여시작", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "endDate", headerName: "참여종료", width: 110, ...center, valueFormatter: (value) => formatDateYmd(value) },
      { field: "duty", headerName: "담당업무", width: 120, ...center },
      { field: "proPart", headerName: "전문분야", width: 120, ...center },
      { field: "returnYn", headerName: "신고여부", width: 90, ...center },
    ],
    [handleReviewSelection, handleToggleAllReviewSelection, reviewAllSelected, reviewSomeSelected, selectedReviewIds],
  );

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

  const handleDownload = () => {
    if (!canGenerate || !selectedBidNotice) {
      return;
    }

    const html = buildHwpHtml(selectedBidNotice, reviewDocumentRows, relatedProjectHistoryConditions);
    const dateStamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const safeProjectName = text(selectedBidNotice.projectName).replace(/[\\/:*?"<>|]/g, "_") || "공고문";
    downloadHwp(`${safeProjectName}_기술인실적_${dateStamp}.hwp`, html);
    setGeneratedAt(new Date().toLocaleString("ko-KR"));
  };

  const handleReset = () => {
    setKeyword("");
    setActiveEngineerId("");
    setSelectedHistoryIds([]);
    setSelectedReviewIds([]);
    setReviewSelectionAnchorId(null);
    setPendingBulkDeleteReviewIds(null);
    setRelatedProjectHistoryConditions([]);
    setGeneratedAt("");
  };

  const invalidateReviewRows = async () => {
    await queryClient.invalidateQueries({ queryKey: ["engineer-performance-docs", "review-results"] });
  };

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBidNotice?.bidSeq) {
        throw new Error("공고문을 먼저 선택하세요.");
      }
      if (!activeEngineerProfile) {
        throw new Error("기술인을 먼저 선택하세요.");
      }

      const bidSeq = selectedBidNotice.bidSeq;
      const uniqueRowsBySourceHistoryId = Array.from(new Map(selectedHistoryRows.map((row) => [text(row.id), row])).values());
      const requestBodies = uniqueRowsBySourceHistoryId.map((row) => ({
        bidSeq,
        engineerId: activeEngineerProfile.summary.id,
        sourceSeq: Number(row.id),
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
      if (!selectedBidNotice?.bidSeq) {
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

  function openBulkDeleteConfirm() {
    if (selectedReviewIds.length === 0) {
      return;
    }
    setPendingBulkDeleteReviewIds(selectedReviewIds);
  }

  return (
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
                <Grid size={{ xs: 12, md: 6 }}>
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
                  </Stack>
                </Grid>
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
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    label="공고일"
                    size="small"
                    sx={fieldSx}
                    value={text(selectedBidNotice?.announceDate).slice(0, 10)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    label="입찰등록 마감"
                    size="small"
                    sx={fieldSx}
                    value={text(selectedBidNotice?.bidClosingDate).slice(0, 10)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="기술인 검색"
                    onChange={(event) => setKeyword(event.target.value)}
                    size="small"
                    sx={fieldSx}
                    value={keyword}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
                    <Button disabled={!selectedBidNotice || engineersQuery.isFetching} onClick={handleLoad} startIcon={<SearchOutlinedIcon />} variant="contained">
                      조회
                    </Button>
                    <Button onClick={handleReset} startIcon={<RefreshOutlinedIcon />} variant="outlined">
                      초기화
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <Box
            sx={{
              alignItems: "start",
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", xl: `${selectorPanelWidth}px minmax(0, 1fr)` },
            }}
          >
            <Card sx={{ minWidth: 0, position: "relative" }} variant="outlined">
              <CardContent>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }} variant="h6">
                      선택 기술인 목록
                    </Typography>
                  </Box>
                  <Chip label={`${engineerRows.length}명`} size="small" variant="outlined" />
                </Box>
                <EnterpriseDataGrid<EngineerDocumentRow>
                  columns={engineerColumns}
                  getRowId={(row) => row.engineerId}
                  hideFooter
                  hideFooterSelectedRowCount
                  loading={engineersQuery.isLoading || engineersQuery.isFetching}
                  onRowClick={(params: GridRowParams<EngineerDocumentRow>) => {
                    setActiveEngineerId(params.row.engineerId);
                    setSelectedHistoryIds([]);
                    setHistorySelectionAnchorId(null);
                    setSelectedReviewIds([]);
                    setReviewSelectionAnchorId(null);
                    setPendingBulkDeleteReviewIds(null);
                    setPerformanceDetailSeq(null);
                  }}
                  paginationMode="server"
                  rowCount={engineerRows.length}
                  rows={engineerRows}
                  columnHeaderHeight={36}
                  rowHeight={30}
                  showToolbar={false}
                  wrapperMinHeight={selectorGridHeight}
                  sx={{
                    border: 0,
                    height: selectorGridHeight,
                    "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                    "& .MuiDataGrid-main": { overflow: "hidden" },
                    "& .MuiDataGrid-virtualScroller": {
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                    },
                  }}
                />
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
            </Card>

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
                      <Button
                        disabled={!canGenerate || selectedHistoryRows.length === 0}
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
                      columns={historyColumns}
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
                      rowHeight={23}
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
                        disabled={!canRead}
                        onApply={setRelatedProjectHistoryConditions}
                        value={relatedProjectHistoryConditions}
                      />
                      <Chip color="success" label={`검토결과 ${reviewRows.length}건`} size="small" />
                      <Button
                        color="error"
                        disabled={selectedReviewIds.length === 0}
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
                    columns={reviewColumns}
                    getRowId={(row) => row.reviewId ?? row.id}
                    hideFooter
                    hideFooterSelectedRowCount
                    loading={reviewRowsQuery.isLoading || reviewRowsQuery.isFetching}
                    onRowClick={(params: GridRowParams<EngineerProjectHistoryReviewRecord>, event) => {
                      if (params.row.reviewId != null) {
                        handleReviewSelection(String(params.row.reviewId), event);
                      }
                    }}
                    onRowDoubleClick={(params: GridRowParams<EngineerProjectHistoryReviewRecord>) => {
                      if (params.row.seq) {
                        setPerformanceDetailSeq(params.row.seq);
                      }
                    }}
                    paginationMode="server"
                    rowCount={reviewRows.length}
                    rows={reviewRows}
                    columnHeaderHeight={36}
                    rowHeight={23}
                    showToolbar={false}
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
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                    생성 상태
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {generatedAt ? `${generatedAt} 한글파일을 생성했습니다.` : "생성 전입니다. 검토결과를 확인한 뒤 문서를 생성하세요."}
                  </Typography>
                </Box>
                <Button
                  disabled={!selectedBidNotice || reviewRows.length === 0 || !canGenerate}
                  onClick={handleDownload}
                  startIcon={<DescriptionOutlinedIcon />}
                  variant="contained"
                >
                  검토결과 한글파일 생성
                </Button>
              </Box>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                    산출물 표 미리보기
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    현재 선택한 기술인의 검토결과를 테스트 산출물 형식으로 확인합니다.
                  </Typography>
                </Box>
                <Chip label={`${reviewDocumentRows.length}건`} size="small" variant="outlined" />
              </Box>
              <PerformanceDocumentPreview rows={reviewDocumentRows} />
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                    산출물 생성 방식 테스트
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    HWPX 양식 업로드 매핑 또는 한컴 웹 기안기 연동을 선택해 테스트합니다.
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button disabled={!canGenerate} onClick={() => setOutputTestPanel((current) => (current === "hwpx" ? null : "hwpx"))} variant={outputTestPanel === "hwpx" ? "contained" : "outlined"}>
                    1. HWPX 업로드 매핑
                  </Button>
                  <Button disabled={!canGenerate} onClick={() => setOutputTestPanel((current) => (current === "webhwp" ? null : "webhwp"))} variant={outputTestPanel === "webhwp" ? "contained" : "outlined"}>
                    2. 한컴 웹 기안기
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
          <HwpxTemplateGenerationPanel bidNotice={selectedBidNotice} open={outputTestPanel === "hwpx"} profiles={profiles} relatedProjectHistoryConditions={relatedProjectHistoryConditions} />
          <HancomWebHwpPanel bidNotice={selectedBidNotice} open={outputTestPanel === "webhwp"} profiles={profiles} />
        </Stack>
      )}

      <BidNoticeSelectDialog
        open={bidNoticeDialogOpen}
        onClose={() => setBidNoticeDialogOpen(false)}
        stateCacheKey="engineer-performance-docs:bid-notice-select"
        onSelect={(record) => {
          setSelectedBidNotice(record);
          setBidNoticeDialogOpen(false);
          setActiveEngineerId("");
          setPerformanceDetailSeq(null);
          setSelectedHistoryIds([]);
          setHistorySelectionAnchorId(null);
          setSelectedReviewIds([]);
          setReviewSelectionAnchorId(null);
          setAddConfirmOpen(false);
          setPendingBulkDeleteReviewIds(null);
          setGeneratedAt("");
          setRelatedProjectHistoryConditions([]);
        }}
      />
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
      <CompanyPerformanceDetailPopup onClose={() => setPerformanceDetailSeq(null)} open={Boolean(performanceDetailSeq)} seq={performanceDetailSeq} />
    </Box>
  );
}
