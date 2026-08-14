"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Autocomplete, Box, Button, Card, CardContent, Chip, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { useGridApiRef, type GridColDef, type GridRowParams } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useCallback, useMemo, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { CheckboxSelectInput } from "@/components/common/CheckboxSelectInput";
import { CommonSelectField } from "@/components/common/CommonSelectField";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { compactFieldSx } from "@/components/common/FormControls";
import { PeriodRangeField } from "@/components/common/PeriodRangeField";
import { apiDate, apiDateTime, boolToYn, dateOnly, dateTimeText, formatMoney, text, ynToBool } from "@/modules/common/formatters";
import { BidNoticeDetailDialog } from "@/modules/pq/bid-notice/BidNoticeDetailDialog";
import { openBidNoticePrintWindow } from "@/modules/pq/bid-notice/bidNoticePrint";
import {
  formatBidSuccessForXlsx,
  formatDepartmentForXlsx,
  formatOrderClientForXlsx,
} from "@/modules/pq/bid-notice/bidNoticeXlsxFormatters";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useCommonCodeLevel2Options, useDepartmentOptions, useUserOptions } from "@/modules/common/reference/useReferenceOptions";
import {
  BID_NOTICE_PAGE_SIZE,
  createBidNotice,
  deleteBidNotice,
  listBidNotices,
  updateBidNotice,
  type BidNoticeDetailOptions,
  type BidNoticeApiRecord,
  type BidNoticeSearchParams,
  type BidNoticeUpsertRequest,
} from "@/modules/pq/bid-notice/bidNoticeApi";
import type {
  BidNoticeFilters,
  BidNoticeRecord,
  BidNoticePeriodType,
} from "@/modules/pq/bid-notice/bidNotice.types";

const periodOptions: { label: string; value: BidNoticePeriodType }[] = [
  { label: "공고기간", value: "NOTICE" },
  { label: "입찰기간", value: "BID" },
  { label: "PQ제출기간", value: "PQ" },
];
const bidSuccessOptions = [
  { label: "낙찰", value: "Y" },
  { label: "미낙찰", value: "N" },
] as const;

const emptyDraft = (): BidNoticeRecord => ({
  active: true,
  baseAmount: 0,
  bidDate: "",
  bidStyle: "",
  bidMethod: "",
  bidNo: "",
  bidClosingDate: "",
  bidType: "",
  bidTypeLabel: "",
  bidMethodLabel: "",
  businessField: "",
  fieldOfWorkLabel: "",
  businessScope: "",
  scopeOfWorkLabel: "",
  businessType: "",
  businessTypeLabel: "",
  category: "공고",
  client: "",
  orderClientName: "",
  content: "",
  department: "",
  departmentName: "",
  draftNote: "",
  electronicVendor: "",
  endDate: "",
  estimateAmount: 0,
  designAmt: 0,
  id: "",
  managerConfirmed: false,
  noticeDate: "",
  onSiteMeetingDate: "",
  participationStatus: "",
  finalParticipationStatus: "",
  pqRegistrationDate: "",
  pqSubmissionDate: "",
  pqDecideEmpno: "",
  projectName: "",
  procurementMethod: "",
  orderMethodLabel: "",
  representativeVendor: "",
  bidSubmissionDate: "",
  writerName: "",
  seqNo: 0,
  sortOrder: 1,
  startDate: "",
  tpSubmissionDate: "",
  bidSuccessYn: "",
  bidSuccessYnLabel: "",
  visible: true,
});


const buildDefaultFilters = (): BidNoticeFilters => {
  return {
    bidMethod: "",
    department: "",
    superDecideEmpno: "",
    keyword: "",
    businessType: "",
    periodType: "NOTICE",
    periodStartDate: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
    periodEndDate: dayjs().add(1, "month").format("YYYY-MM-DD"),
    bidSuccessYn: "",
    participationStatuses: [],
  };
};

const handleSearchEnter =
  (onSearch: () => void) =>
  (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearch();
    }
  };

const BID_NOTICE_GRID_CARD_DEFAULT_HEIGHT = 560;
const BID_NOTICE_GRID_CARD_MIN_HEIGHT = 420;
const BID_NOTICE_GRID_CARD_MAX_HEIGHT = 860;
const BID_NOTICE_GRID_CARD_OFFSET = 32;

type BidNoticeGridColDef = GridColDef<BidNoticeRecord> & {
  excludeFromXlsxExport?: boolean;
};

const toBidNoticeRecord = (item: BidNoticeApiRecord): BidNoticeRecord => ({
  active: true,
  baseAmount: 0,
  bidDate: dateTimeText(item.bidDate),
  bidStyle: text(item.processTag),
  bidMethod: text(item.bidMethod),
  bidMethodLabel: text(item.bidMethodLabel),
  bidNo: item.bidSeq ? String(item.bidSeq) : "",
  bidClosingDate: dateTimeText(item.bidClosingDate),
  bidType: text(item.bidType),
  bidTypeLabel: text(item.bidTypeLabel),
  businessField: text(item.fieldOfWorkCode) as BidNoticeRecord["businessField"],
  fieldOfWorkLabel: text(item.fieldOfWorkLabel),
  businessScope: text(item.scopeOfWorkCode) as BidNoticeRecord["businessScope"],
  scopeOfWorkLabel: text(item.scopeOfWorkLabel),
  businessType: text(item.businessType),
  businessTypeLabel: text(item.businessTypeLabel),
  category: "공고",
  client: text(item.orderClient),
  orderClientName: text(item.orderClientName),
  content: "",
  department: text(item.departmentCode) as BidNoticeRecord["department"],
  departmentName: text(item.departmentName),
  draftNote: text(item.remark),
  electronicVendor: "",
  endDate: dateOnly(item.bidClosingDate),
  designAmt: Number(item.designAmt ?? 0),
  estimateAmount: Number(item.designAmt ?? 0),
  id: item.bidSeq ? String(item.bidSeq) : "",
  managerConfirmed: ynToBool(item.bidSuccessYn),
  noticeDate: dateOnly(item.announceDate),
  onSiteMeetingDate: dateTimeText(item.siteBriefingDate),
  participationStatus: text(item.participateYnLabel) || text(item.participateYn),
  finalParticipationStatus: text(item.participateYn),
  pqRegistrationDate: dateTimeText(item.pqRegistDate),
  pqSubmissionDate: dateTimeText(item.pqSubmitDate),
  pqDecideEmpno: text(item.pqDecideEmpno),
  projectName: item.projectName,
  procurementMethod: text(item.orderMethod),
  orderMethodLabel: text(item.orderMethodLabel),
  representativeVendor: text(item.primeContractor),
  bidSubmissionDate: dateTimeText(item.bidSubmissionDate),
  writerName: text(item.superDecideEmpno),
  seqNo: item.bidSeq ?? 0,
  sortOrder: item.bidSeq ?? 0,
  startDate: dateOnly(item.announceDate),
  tpSubmissionDate: dateTimeText(item.tpSubmitDate),
  bidSuccessYn: text(item.bidSuccessYn),
  bidSuccessYnLabel: item.bidSuccessYn === "Y" ? "낙찰" : "미낙찰",
  visible: true,
});

const toBidNoticeRequest = (draft: BidNoticeRecord): BidNoticeUpsertRequest => ({
  bidSeq: draft.seqNo || null,
  departmentCode: draft.department.trim(),
  projectName: draft.projectName.trim(),
  orderClient: draft.client.trim(),
  designAmt: draft.estimateAmount || null,
  bidType: draft.bidType.trim(),
  bidMethod: draft.bidMethod.trim(),
  announceDate: apiDate(draft.noticeDate) || null,
  pqRegistDate: apiDateTime(draft.pqRegistrationDate),
  pqSubmitDate: apiDateTime(draft.pqSubmissionDate),
  orderMethod: draft.procurementMethod.trim() || draft.bidMethod.trim(),
  bidDate: apiDateTime(draft.bidDate),
  bidSuccessYn: draft.bidSuccessYn.trim() || boolToYn(draft.managerConfirmed),
  participateYn: draft.finalParticipationStatus.trim(),
  pqDecideEmpno: "",
  pqDecideDate: null,
  superDecideEmpno: draft.writerName.trim(),
  businessType: draft.businessType.trim(),
  bidSubmissionDate: apiDateTime(draft.bidSubmissionDate),
  processTag: draft.bidStyle.trim(),
  bidClosingDate: apiDateTime(draft.bidClosingDate),
  fieldOfWorkCode: draft.businessField.trim(),
  scopeOfWorkCode: draft.businessScope.trim(),
  reasonOfAbsenceCode: draft.participationStatus === "불참" ? draft.participationStatus : "",
  siteBriefingDate: apiDateTime(draft.onSiteMeetingDate),
  tpSubmitDate: apiDateTime(draft.tpSubmissionDate),
  tpPassYn: "",
  primeContractor: draft.representativeVendor.trim(),
  remark: draft.draftNote.trim(),
  refmatYn: "",
  createdId: "admin",
  lastChangedId: "admin",
});

const toSearchParams = (filters: BidNoticeFilters): BidNoticeSearchParams => ({
  keyword: filters.keyword,
  departmentCode: filters.department,
  superDecideEmpno: filters.superDecideEmpno,
  bidType: "",
  businessType: "",
  bidClosingDateFrom: filters.periodType === "NOTICE" ? filters.periodStartDate : "",
  bidClosingDateTo: filters.periodType === "NOTICE" ? filters.periodEndDate : "",
  bidDateFrom: filters.periodType === "BID" ? filters.periodStartDate : "",
  bidDateTo: filters.periodType === "BID" ? filters.periodEndDate : "",
  pqSubmitDateFrom: filters.periodType === "PQ" ? filters.periodStartDate : "",
  pqSubmitDateTo: filters.periodType === "PQ" ? filters.periodEndDate : "",
  bidSuccessYn: filters.bidSuccessYn,
  page: 0,
  size: BID_NOTICE_PAGE_SIZE,
});

export function BidNoticePage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();
  const gridApiRef = useGridApiRef();
  const [draft, setDraft] = useState<BidNoticeRecord>(emptyDraft());
  const [filters, setFilters] = useState<BidNoticeFilters>(() => buildDefaultFilters());
  const [searchDraft, setSearchDraft] = useState<BidNoticeFilters>(() => buildDefaultFilters());
  const [open, setOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [searchRevision, setSearchRevision] = useState(0);
  const [bidNoticeGridCardHeight, setBidNoticeGridCardHeight] = useState(BID_NOTICE_GRID_CARD_DEFAULT_HEIGHT);

  const searchParams = useMemo(() => toSearchParams(filters), [filters]);
  const bidNoticesQuery = useQuery({
    queryKey: ["bid-notices", searchParams, searchRevision],
    queryFn: () => listBidNotices(searchParams),
    enabled: tabQueryEnabled,
  });
  const bidMethodOptions = useCommonCodeLevel2Options("ZA");
  const businessFieldOptions = useCommonCodeLevel2Options("DA");
  const orderMethodOptions = useCommonCodeLevel2Options("FA", { useYn: "Y" }, undefined, "level2Code");
  const bidTypeOptions = useCommonCodeLevel2Options("MB");
  const businessTypeOptions = useCommonCodeLevel2Options("CA");
  const businessTypeSearchOptions = useMemo(
    () => businessTypeOptions.options.map((option) => ({ label: option.label, value: option.label })),
    [businessTypeOptions.options],
  );
  const businessScopeOptions = useCommonCodeLevel2Options("T2");
  const finalParticipationOptions = useCommonCodeLevel2Options("YA");
  const departmentOptions = useDepartmentOptions({ useYn: true });
  const registrantOptions = useUserOptions({ useYn: "Y" });
  const userNameByEmployeeNo = useMemo(
    () => Object.fromEntries(registrantOptions.items.map((user) => [user.employeeNo, user.userName || user.employeeNo])),
    [registrantOptions.items],
  );
  const detailOptions = useMemo<BidNoticeDetailOptions>(
    () => ({
      bidMethods: bidMethodOptions.options,
      businessFields: businessFieldOptions.options,
      orderMethods: orderMethodOptions.options,
      bidTypes: bidTypeOptions.options,
      businessTypes: businessTypeOptions.options,
      businessScopes: businessScopeOptions.options,
      finalParticipationStatuses: finalParticipationOptions.options,
      clients: [],
      departments: departmentOptions.options,
    }),
    [
      bidMethodOptions.options,
      businessFieldOptions.options,
      orderMethodOptions.options,
      bidTypeOptions.options,
      businessTypeOptions.options,
      businessScopeOptions.options,
      finalParticipationOptions.options,
      departmentOptions.options,
    ],
  );

  const records = useMemo(
    () => (bidNoticesQuery.data?.content ?? []).map(toBidNoticeRecord),
    [bidNoticesQuery.data?.content],
  );

  const printLabelMaps = useMemo(
    () => ({
      bidMethod: bidMethodOptions.labelByValue,
      bidType: bidTypeOptions.labelByValue,
      businessType: businessTypeOptions.labelByValue,
      department: departmentOptions.labelByValue,
      orderMethod: orderMethodOptions.labelByValue,
    }),
    [
      bidMethodOptions.labelByValue,
      bidTypeOptions.labelByValue,
      businessTypeOptions.labelByValue,
      departmentOptions.labelByValue,
      orderMethodOptions.labelByValue,
    ],
  );

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const keyword = filters.keyword.trim();
      const matchesKeyword =
        !keyword ||
        [
          record.projectName,
          record.client,
          record.orderClientName,
          record.bidNo,
          record.representativeVendor,
          record.departmentName,
          record.businessTypeLabel,
          record.orderMethodLabel,
          record.participationStatus,
          record.finalParticipationStatus,
          record.bidSuccessYnLabel,
          record.pqDecideEmpno,
          record.writerName,
        ].some((value) => value.includes(keyword));
      const matchesBidMethod = !filters.bidMethod || record.bidMethod === filters.bidMethod;
      const matchesBusinessType = !filters.businessType || record.businessTypeLabel.includes(filters.businessType);
      const matchesDepartment = !filters.department || record.department === filters.department;
      const matchesRegistrant = !filters.superDecideEmpno || record.writerName === filters.superDecideEmpno;
      const matchesStatus = filters.participationStatuses.length === 0 || filters.participationStatuses.includes(record.finalParticipationStatus);
      const periodDate =
        filters.periodType === "NOTICE" ? apiDate(record.noticeDate) : filters.periodType === "BID" ? apiDate(record.bidDate) : apiDate(record.pqSubmissionDate);
      const matchesPeriodStart = !filters.periodStartDate || periodDate >= filters.periodStartDate;
      const matchesPeriodEnd = !filters.periodEndDate || periodDate <= filters.periodEndDate;
      const matchesBidSuccess = !filters.bidSuccessYn || record.bidSuccessYn === filters.bidSuccessYn;

      return (
        matchesKeyword &&
        matchesBidMethod &&
        matchesBusinessType &&
        matchesDepartment &&
        matchesRegistrant &&
        matchesStatus &&
        matchesPeriodStart &&
        matchesPeriodEnd &&
        matchesBidSuccess
      );
    });
  }, [filters, records]);

  const saveMutation = useMutation({
    mutationFn: (requestBody: BidNoticeUpsertRequest) =>
      draft.seqNo ? updateBidNotice(draft.seqNo, requestBody) : createBidNotice({ ...requestBody, bidSeq: null }),
    onSuccess: (saved) => {
      const nextRecord = toBidNoticeRecord(saved);
      setDraft(nextRecord);
      queryClient.invalidateQueries({ queryKey: ["bid-notices"] });
      setSnackMessage("저장되었습니다.");
      setOpen(false);
    },
    onError: (error) => {
      setSnackMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBidNotice,
    onSuccess: (_data, deletedBidSeq) => {
      queryClient.invalidateQueries({ queryKey: ["bid-notices"] });
      queryClient.invalidateQueries({ queryKey: ["file-attachments", "BID_NOTICE", String(deletedBidSeq)] });
      setSnackMessage("삭제되었습니다.");
      setOpen(false);
    },
    onError: (error) => {
      setSnackMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    },
  });

  const openEditor = (record: BidNoticeRecord) => {
    if (!canRead) {
      setSnackMessage("조회 권한이 없습니다.");
      return;
    }
    setDraft({ ...record });
    setOpen(true);
  };

  const openNew = () => {
    if (!canCreate) {
      setSnackMessage("등록 권한이 없습니다.");
      return;
    }
    setDraft(emptyDraft());
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
  };

  const updateDraft = <K extends keyof BidNoticeRecord>(name: K, value: BidNoticeRecord[K]) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const saveRecord = () => {
    const canSaveCurrent = draft.seqNo ? canUpdate : canCreate;
    if (!canSaveCurrent) {
      setSnackMessage(draft.seqNo ? "수정 권한이 없습니다." : "등록 권한이 없습니다.");
      return;
    }
    if (!draft.projectName.trim()) {
      setSnackMessage("사업명을 입력하세요.");
      return;
    }

    saveMutation.mutate(toBidNoticeRequest(draft));
  };

  const requestDeleteRecord = () => {
    if (!canDelete) {
      setSnackMessage("삭제 권한이 없습니다.");
      return;
    }
    if (!draft.seqNo) {
      setOpen(false);
      return;
    }
    deleteMutation.mutate(draft.seqNo);
  };

  const handleSearch = () => {
    if (!canRead) {
      setSnackMessage("조회 권한이 없습니다.");
      return;
    }
    setFilters({ ...searchDraft });
    setSearchRevision((current) => current + 1);
  };

  const columns = useMemo<BidNoticeGridColDef[]>(
    () => [
      { field: "bidNo", headerName: "입찰순번", width: 93, align: "center", headerAlign: "center" },
      {
        field: "participationStatus",
        headerName: "최종 참여",
        width: 80,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row, value }) => {
          const label = String(value ?? "-");
          const isParticipating = row.finalParticipationStatus === "Y" || label === "참여" || label === "Y";
          return (
            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <Chip
                color={isParticipating ? "success" : "default"}
                label={label}
                size="small"
                variant={isParticipating ? "filled" : "outlined"}
              />
            </Box>
          );
        },
      },
      {
        field: "bidSuccessYn",
        headerName: "낙찰여부",
        width: 80,
        align: "center",
        headerAlign: "center",
        excludeFromXlsxExport: true,
        valueFormatter: formatBidSuccessForXlsx,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <Chip
              color={row.bidSuccessYn === "Y" ? "primary" : "default"}
              label={row.bidSuccessYn === "Y" ? "낙찰" : "미낙찰"}
              sx={row.bidSuccessYn === "Y" ? { fontWeight: 400 } : undefined}
              size="small"
              variant={row.bidSuccessYn === "Y" ? "filled" : "outlined"}
            />
          </Box>
        ),
      },
      {
        field: "department",
        headerName: "부서",
        width: 90,
        align: "center",
        headerAlign: "center",
        valueFormatter: formatDepartmentForXlsx,
        renderCell: ({ row, value }) => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            {row.departmentName || String(value ?? "")}
          </Box>
        ),
      },
      { field: "businessTypeLabel", headerName: "구분", width: 60, align: "center", headerAlign: "center" },
      {
        field: "client",
        headerName: "발주처",
        width: 120,
        valueFormatter: formatOrderClientForXlsx,
        renderCell: ({ row, value }) => row.orderClientName || String(value ?? ""),
      },
      { field: "projectName", headerName: "용역명", flex: 1, minWidth: 240 },
      { field: "noticeDate", headerName: "공고일", width: 110 },
      {
        field: "pqSubmissionDate",
        headerName: "PQ제출일",
        width: 110,
        renderCell: ({ row }) => dateOnly(row.pqSubmissionDate),
      },
      { field: "bidClosingDate", headerName: "입찰등록 마감", width: 145 },
      { field: "bidSubmissionDate", headerName: "투찰마감", width: 145 },
      { field: "bidDate", headerName: "입찰일", width: 145 },
      {
        field: "designAmt",
        headerName: "설계금액",
        width: 140,
        renderCell: ({ row }) => formatMoney(Number(row.designAmt ?? row.estimateAmount ?? 0)),
      },
      {
        field: "pqDecideEmpno",
        headerName: "작성자",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => userNameByEmployeeNo[String(value ?? "")] ?? String(value ?? ""),
      },
    ],
    [userNameByEmployeeNo],
  );

  const bidNoticeGridHeight = Math.max(320, bidNoticeGridCardHeight - BID_NOTICE_GRID_CARD_OFFSET);

  const handleBidNoticeGridResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = bidNoticeGridCardHeight;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextHeight = Math.min(
          BID_NOTICE_GRID_CARD_MAX_HEIGHT,
          Math.max(BID_NOTICE_GRID_CARD_MIN_HEIGHT, startHeight + moveEvent.clientY - startY),
        );
        setBidNoticeGridCardHeight(nextHeight);
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [bidNoticeGridCardHeight],
  );

  const handleExportPrint = () => {
    const gridApi = gridApiRef.current;
    const sortedRecords = gridApi
      ? gridApi
          .getSortedRowIds()
          .map((rowId) => gridApi.getRow<BidNoticeRecord>(rowId))
          .filter((row): row is BidNoticeRecord => Boolean(row))
      : filteredRecords;

    openBidNoticePrintWindow(sortedRecords, filters, printLabelMaps, setSnackMessage);
  };

  return (
    <Box>
      <PageHeader
        title="공고문"
        action={
          <Button disabled={!canCreate} onClick={openNew} startIcon={<AddOutlinedIcon />} variant="contained">
            신규 등록
          </Button>
        }
      />

      <Card sx={{ mb: 3 }} variant="outlined">
        <CardContent>
          <Stack spacing={2}>
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", xl: "repeat(5, minmax(0, 1fr))" } }}>
              <Box sx={{ display: "grid", gap: 0.75, gridColumn: { xs: "auto", xl: "span 1" }, alignSelf: "start" }}>
                <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>용역명</Typography>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    onKeyDown={handleSearchEnter(handleSearch)}
                    onChange={(event) => setSearchDraft((current) => ({ ...current, keyword: event.target.value }))}
                    size="small"
                    sx={compactFieldSx}
                    value={searchDraft.keyword}
                  />
                </Box>
              </Box>

              <PeriodRangeField
                label="조회기간"
                options={periodOptions}
                onEndChange={(value) => setSearchDraft((current) => ({ ...current, periodEndDate: value }))}
                onPeriodChange={(value) => setSearchDraft((current) => ({ ...current, periodType: value }))}
                onStartChange={(value) => setSearchDraft((current) => ({ ...current, periodStartDate: value }))}
                periodValue={searchDraft.periodType}
                startValue={searchDraft.periodStartDate}
                endValue={searchDraft.periodEndDate}
                sx={[compactFieldSx, { gridColumn: { xs: "auto", xl: "span 2" } }]}
              />

              <CommonSelectField
                label="업무부서"
                labelPlacement="top"
                onChange={(value) => setSearchDraft((current) => ({ ...current, department: value as BidNoticeFilters["department"] }))}
                options={departmentOptions.options}
                placeholder="전체"
                placeholderDisabled={false}
                sx={compactFieldSx}
                value={searchDraft.department}
              />

              <Box sx={{ display: "grid", gap: 0.75, alignSelf: "start" }}>
                <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>작성자</Typography>
                <Autocomplete
                  disableClearable={false}
                  fullWidth
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  loading={registrantOptions.isLoading}
                  options={registrantOptions.options}
                  sx={compactFieldSx}
                  value={registrantOptions.options.find((option) => option.value === searchDraft.superDecideEmpno) ?? null}
                  onChange={(_, option) =>
                    setSearchDraft((current) => ({
                      ...current,
                      superDecideEmpno: option?.value ?? "",
                    }))
                  }
                  renderInput={(params) => <TextField {...params} size="small" sx={compactFieldSx} />}
                />
              </Box>

              <CheckboxSelectInput
                label="참여 상태"
                name="participationStatuses"
                onChange={(name, value) => setSearchDraft((current) => ({ ...current, [name]: value }))}
                options={finalParticipationOptions.options}
                sx={compactFieldSx}
                value={searchDraft.participationStatuses}
              />

              <CommonSelectField
                label="낙찰여부"
                labelPlacement="top"
                onChange={(value) => setSearchDraft((current) => ({ ...current, bidSuccessYn: value as BidNoticeFilters["bidSuccessYn"] }))}
                options={bidSuccessOptions}
                placeholder="전체"
                placeholderDisabled={false}
                sx={compactFieldSx}
                value={searchDraft.bidSuccessYn}
              />

              <CommonSelectField
                label="사업구분"
                labelPlacement="top"
                onChange={(value) => setSearchDraft((current) => ({ ...current, businessType: value }))}
                options={businessTypeSearchOptions}
                placeholder="전체"
                placeholderDisabled={false}
                sx={compactFieldSx}
                value={searchDraft.businessType}
              />

              <CommonSelectField
                label="입찰방식"
                labelPlacement="top"
                onChange={(value) => setSearchDraft((current) => ({ ...current, bidMethod: value as BidNoticeFilters["bidMethod"] }))}
                options={bidMethodOptions.options}
                placeholder="전체"
                placeholderDisabled={false}
                sx={compactFieldSx}
                value={searchDraft.bidMethod}
              />

            </Box>

            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  const defaultFilters = buildDefaultFilters();
                  setSearchDraft(defaultFilters);
                  setFilters(defaultFilters);
                  setSearchRevision((current) => current + 1);
                }}
                disabled={!canRead}
                startIcon={<RefreshOutlinedIcon />}
                variant="outlined"
              >
                초기화
              </Button>
              <Button disabled={!canRead || bidNoticesQuery.isFetching} onClick={handleSearch} startIcon={<SearchOutlinedIcon />} variant="contained">
                조회
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card
        sx={{
          height: { xs: "auto", lg: bidNoticeGridCardHeight },
          minHeight: BID_NOTICE_GRID_CARD_MIN_HEIGHT,
          minWidth: 0,
          position: "relative",
        }}
        variant="outlined"
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", pb: 2.5 }}>
          <EnterpriseDataGrid<BidNoticeRecord>
            apiRef={gridApiRef}
            columns={columns}
            onExportPrint={handleExportPrint}
            showXlsxExportButton
            showPrintButton
            showPageNumbers
            getRowId={(row) => row.id}
            onRowDoubleClick={(params: GridRowParams<BidNoticeRecord>) => openEditor(params.row)}
            rows={filteredRecords}
            wrapperMinHeight={bidNoticeGridHeight}
            sx={{
              height: bidNoticeGridHeight,
              "& .MuiDataGrid-row:hover": { cursor: "pointer" },
            }}
          />
        </CardContent>
        <Box
          aria-label="공고문 그리드 높이 조정"
          onPointerDown={handleBidNoticeGridResizeStart}
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
      </Card>

      <BidNoticeDetailDialog
        onClose={closeDialog}
        onDeleteRequest={requestDeleteRecord}
        onFieldChange={updateDraft}
        onSave={saveRecord}
        options={detailOptions}
        open={open}
        record={draft}
        saveDisabled={saveMutation.isPending || (draft.seqNo ? !canUpdate : !canCreate)}
        deleteDisabled={deleteMutation.isPending || !draft.seqNo || !canDelete}
      />

      <Snackbar autoHideDuration={2500} message={snackMessage} onClose={() => setSnackMessage("")} open={Boolean(snackMessage)} />
    </Box>
  );
}
