"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import type { GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { NotificationPreferenceButton } from "@/components/common/NotificationPreferenceButton";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { readAuthSession } from "@/lib/auth/authSession";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useCommonCodeLevel2Options, useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import { apiDate, apiDateTime, boolToYn, dateOnly, dateTimeText, formatMoney, text } from "@/modules/common/formatters";
import { createBidNotice, getBidNotice, updateBidNotice, type BidNoticeApiRecord, type BidNoticeDetailOptions, type BidNoticeUpsertRequest } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";
import {
  G2B_BID_NOTICE_CANDIDATE_PAGE_SIZE,
  deleteG2bBidNoticeCandidates,
  getG2bBidNoticeCandidateSyncStatus,
  getImportedG2bBidNoticeCandidate,
  getImportedG2bBidNoticeCandidateByNoticeNumber,
  markG2bBidNoticeCandidateImported,
  syncG2bBidNoticeCandidates,
  type G2bBidNoticeCandidateSearchParams,
} from "@/modules/pq/g2b-bid-notice-candidates/api";
import { useG2bBidNoticeCandidateQueries } from "@/modules/pq/g2b-bid-notice-candidates/application/useG2bBidNoticeCandidateQueries";
import {
  emptyG2bBidNoticeCandidateSearchFilters,
  toG2bBidNoticeCandidateRow,
  type G2bBidNoticeCandidateSearchFilters,
} from "@/modules/pq/g2b-bid-notice-candidates/domain/models";
import { G2bBidNoticeCandidateFilters } from "@/modules/pq/g2b-bid-notice-candidates/presentation/G2bBidNoticeCandidateFilters";
import { G2bBidNoticeCandidateGrid } from "@/modules/pq/g2b-bid-notice-candidates/presentation/G2bBidNoticeCandidateGrid";

const G2bBidNoticeCandidateDetailDialog = dynamic(
  () => import("@/modules/pq/g2b-bid-notice-candidates/presentation/G2bBidNoticeCandidateDetailDialog").then((module) => module.G2bBidNoticeCandidateDetailDialog),
  { ssr: false },
);

const BidNoticeDetailDialog = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeDetailDialog").then((module) => module.BidNoticeDetailDialog),
  { ssr: false },
);

const bidNoticeChangeFields = [
  ["projectName", "사업명"],
  ["bidClosingDate", "PQ심사 신청 마감일"],
  ["bidDate", "입찰서 마감일"],
  ["bidSubmissionDate", "투찰 마감일"],
  ["estimateAmount", "설계금액"],
  ["noticeDate", "공고일자"],
  ["pqSubmissionDate", "PQ 제출일자"],
] as const satisfies ReadonlyArray<[keyof BidNoticeRecord, string]>;

const changeValue = (field: keyof BidNoticeRecord, value: BidNoticeRecord[keyof BidNoticeRecord]) =>
  field === "estimateAmount" ? formatMoney(Number(value ?? 0)) : String(value ?? "");

const comparableChangeValue = (field: keyof BidNoticeRecord, value: BidNoticeRecord[keyof BidNoticeRecord]) =>
  field === "estimateAmount"
    ? String(Number(value ?? 0))
    : String(value ?? "").replace(/\s+/g, " ").trim();

const attachmentNames = (attachments: ReadonlyArray<{ fileName?: string | null; originalFilename?: string | null }>) =>
  [...new Set(attachments.map((attachment) => (attachment.fileName ?? attachment.originalFilename ?? "").trim()).filter(Boolean))]
    .sort()
    .join("\n");

const emptyBidNoticeDraft = (): BidNoticeRecord => ({
  active: true,
  baseAmount: 0,
  bidDate: "",
  interviewDate: "",
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
  category: "怨듦퀬" as BidNoticeRecord["category"],
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
  reasonOfAbsenceCode: "",
  orderMethodLabel: "",
  representativeVendor: "",
  bidSubmissionDate: "",
  writerName: "",
  seqNo: 0,
  sortOrder: 0,
  startDate: "",
  tpSubmissionDate: "",
  bidSuccessYn: "",
  bidSuccessYnLabel: "",
  visible: true,
});

const toEditableBidNoticeRecord = (item: BidNoticeApiRecord): BidNoticeRecord => ({
  ...emptyBidNoticeDraft(),
  bidDate: dateTimeText(item.bidDate),
  bidClosingDate: dateTimeText(item.bidClosingDate),
  bidMethod: text(item.bidMethod),
  bidMethodLabel: text(item.bidMethodLabel),
  bidNo: item.bidSeq ? String(item.bidSeq) : "",
  bidSubmissionDate: dateTimeText(item.bidSubmissionDate),
  bidStyle: text(item.processTag),
  bidSuccessYn: text(item.bidSuccessYn),
  bidSuccessYnLabel: text(item.bidSuccessYnLabel),
  bidType: text(item.bidType),
  bidTypeLabel: text(item.bidTypeLabel),
  businessField: text(item.fieldOfWorkCode) as BidNoticeRecord["businessField"],
  businessType: text(item.businessType),
  client: text(item.orderClient),
  department: text(item.departmentCode),
  departmentName: text(item.departmentName),
  draftNote: text(item.remark),
  estimateAmount: Number(item.designAmt ?? 0),
  finalParticipationStatus: text(item.participateYn),
  id: item.bidSeq ? String(item.bidSeq) : "",
  managerConfirmed: item.bidSuccessYn === "Y",
  noticeDate: dateOnly(item.announceDate),
  onSiteMeetingDate: dateTimeText(item.siteBriefingDate),
  pqRegistrationDate: dateTimeText(item.pqRegistDate),
  pqSubmissionDate: dateTimeText(item.pqSubmitDate),
  projectName: item.projectName,
  procurementMethod: text(item.orderMethod),
  reasonOfAbsenceCode: text(item.reasonOfAbsenceCode),
  representativeVendor: text(item.primeContractor),
  seqNo: item.bidSeq ?? 0,
  startDate: dateOnly(item.announceDate),
  tpSubmissionDate: dateTimeText(item.tpSubmitDate),
  writerName: text(item.superDecideEmpno),
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
  interviewDate: apiDate(draft.interviewDate) || null,
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
  reasonOfAbsenceCode: draft.reasonOfAbsenceCode.trim(),
  siteBriefingDate: apiDateTime(draft.onSiteMeetingDate),
  tpSubmitDate: apiDateTime(draft.tpSubmissionDate),
  tpPassYn: "",
  primeContractor: draft.representativeVendor.trim(),
  remark: draft.draftNote.trim(),
  refmatYn: "",
  createdId: "admin",
  lastChangedId: "admin",
});

const toCandidateBidNoticeDraft = (record: ReturnType<typeof toG2bBidNoticeCandidateRow>): BidNoticeRecord => {
  const amount = Number(record.asignBdgtAmt.replaceAll(",", "")) || 0;

  return {
    ...emptyBidNoticeDraft(),
    bidDate: dateTimeText(record.bidDate),
    bidClosingDate: dateTimeText(record.pqApplDocRcptDt),
    bidSubmissionDate: dateTimeText(record.bidSubmissionDate),
    bidStyle: record.sucsfbidMthdNm,
    estimateAmount: amount,
    designAmt: amount,
    noticeDate: dateOnly(record.bidNtceDate),
    projectName: record.bidNtceNm,
    pqSubmissionDate: dateTimeText(record.pqSubmitDate),
    endDate: dateOnly(record.bidClseDt),
    startDate: dateOnly(record.bidNtceDate),
  };
};

const normalizeAutoMappingText = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, "").trim().toLowerCase();

const findAutoMappedOptionValue = (
  options: ReadonlyArray<{ label: string; value: string }>,
  sourceValue: string,
  allowPartialMatch = false,
) => {
  const normalizedSource = normalizeAutoMappingText(sourceValue);
  if (!normalizedSource) return "";
  const exactMatch = options.find((option) =>
    [option.label, option.value].some((candidate) => normalizeAutoMappingText(candidate) === normalizedSource),
  );
  if (exactMatch) return exactMatch.value;
  if (!allowPartialMatch) return "";
  return options.find((option) =>
    [option.label, option.value].some((candidate) => {
      const normalizedCandidate = normalizeAutoMappingText(candidate);
      return normalizedCandidate && (normalizedSource.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedSource));
    }),
  )?.value ?? "";
};

export function G2bBidNoticeCandidatePage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const { showError, showSuccess } = useAppSnackbar();
  const queryClient = useQueryClient();
  const queryEnabled = useTabQueryEnabled(canRead);
  const routeSearchParams = useSearchParams();
  const notificationBidNtceNo = routeSearchParams.get("bidNtceNo")?.trim() ?? "";
  const [draftFilters, setDraftFilters] = useState<G2bBidNoticeCandidateSearchFilters>(() => {
    const filters = emptyG2bBidNoticeCandidateSearchFilters();
    filters.bidNtceNo = notificationBidNtceNo;
    return filters;
  });
  const [appliedFilters, setAppliedFilters] = useState<G2bBidNoticeCandidateSearchFilters>(() => {
    const filters = emptyG2bBidNoticeCandidateSearchFilters();
    filters.bidNtceNo = notificationBidNtceNo;
    return filters;
  });
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: G2B_BID_NOTICE_CANDIDATE_PAGE_SIZE });
  const [detailRecord, setDetailRecord] = useState<ReturnType<typeof toG2bBidNoticeCandidateRow> | null>(null);
  const [inputDraft, setInputDraft] = useState<BidNoticeRecord | null>(null);
  const [inputCandidateId, setInputCandidateId] = useState<number | null>(null);
  const [inputAttachmentOwnerId, setInputAttachmentOwnerId] = useState<number | null>(null);
  const [inputSourceNotice, setInputSourceNotice] = useState<ReturnType<typeof toG2bBidNoticeCandidateRow> | null>(null);
  const [inputChangeSummary, setInputChangeSummary] = useState<ReadonlyArray<{ current: string; label: string; previous: string }>>([]);
  const [inputSourceAttachments, setInputSourceAttachments] = useState<ReturnType<typeof toG2bBidNoticeCandidateRow>["attachments"]>([]);
  const [inputClientSearchHint, setInputClientSearchHint] = useState("");
  const [inputMappingSource, setInputMappingSource] = useState({
    bidMethod: "",
    businessScope: "",
    businessType: "",
    businessField: "",
    orderMethod: "",
  });
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });

  const inputOpen = Boolean(inputDraft);
  const bidMethodOptions = useCommonCodeLevel2Options("ZA", undefined, { enabled: inputOpen });
  const businessFieldOptions = useCommonCodeLevel2Options("DA", undefined, { enabled: inputOpen });
  const orderMethodOptions = useCommonCodeLevel2Options("FA", { useYn: "Y" }, { enabled: inputOpen }, "level2Code");
  const bidTypeOptions = useCommonCodeLevel2Options("MB", undefined, { enabled: inputOpen });
  const businessTypeOptions = useCommonCodeLevel2Options("CA", undefined, { enabled: inputOpen });
  const businessScopeOptions = useCommonCodeLevel2Options("T2", undefined, { enabled: inputOpen });
  const finalParticipationOptions = useCommonCodeLevel2Options("YA", undefined, { enabled: inputOpen });
  const reasonOfAbsenceOptions = useCommonCodeLevel2Options("T3", undefined, { enabled: inputOpen });
  const departmentOptions = useDepartmentOptions({ useYn: true }, { enabled: inputOpen });
  const inputOptions = useMemo<BidNoticeDetailOptions>(() => ({
    bidMethods: bidMethodOptions.options,
    businessFields: businessFieldOptions.options,
    orderMethods: orderMethodOptions.options,
    bidTypes: bidTypeOptions.options,
    businessTypes: businessTypeOptions.options,
    businessScopes: businessScopeOptions.options,
    finalParticipationStatuses: finalParticipationOptions.options,
    reasonsOfAbsence: reasonOfAbsenceOptions.options,
    clients: [],
    departments: departmentOptions.options,
  }), [
    bidMethodOptions.options,
    businessFieldOptions.options,
    orderMethodOptions.options,
    bidTypeOptions.options,
    businessTypeOptions.options,
    businessScopeOptions.options,
    finalParticipationOptions.options,
    reasonOfAbsenceOptions.options,
    departmentOptions.options,
  ]);

  const autoMappedInputFields = useMemo(() => ({
    bidMethod: findAutoMappedOptionValue(bidMethodOptions.options, inputMappingSource.bidMethod, true),
    businessScope: findAutoMappedOptionValue(businessScopeOptions.options, inputMappingSource.businessType),
    businessType: findAutoMappedOptionValue(businessTypeOptions.options, inputMappingSource.businessType),
    businessField: findAutoMappedOptionValue(businessFieldOptions.options, inputMappingSource.businessField),
    procurementMethod: findAutoMappedOptionValue(orderMethodOptions.options, inputMappingSource.orderMethod),
  }), [
    bidMethodOptions.options,
    businessFieldOptions.options,
    businessScopeOptions.options,
    businessTypeOptions.options,
    inputMappingSource.businessField,
    inputMappingSource.businessType,
    inputMappingSource.bidMethod,
    inputMappingSource.orderMethod,
    orderMethodOptions.options,
  ]);

  useEffect(() => {
    if (!notificationBidNtceNo) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftFilters((current) => current.bidNtceNo === notificationBidNtceNo ? current : { ...current, bidNtceNo: notificationBidNtceNo });
    setAppliedFilters((current) => current.bidNtceNo === notificationBidNtceNo ? current : { ...current, bidNtceNo: notificationBidNtceNo });
    setPaginationModel((current) => current.page === 0 ? current : { ...current, page: 0 });
  }, [notificationBidNtceNo]);

  useEffect(() => {
    if (!inputDraft || Object.values(autoMappedInputFields).every((value) => !value)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputDraft((current) => {
      if (!current) return current;
      const next = { ...current };
      let changed = false;
      if (!next.bidMethod && autoMappedInputFields.bidMethod) {
        next.bidMethod = autoMappedInputFields.bidMethod;
        changed = true;
      }
      if (!next.businessType && autoMappedInputFields.businessType) {
        next.businessType = autoMappedInputFields.businessType;
        changed = true;
      }
      if (!next.businessScope && autoMappedInputFields.businessScope) {
        next.businessScope = autoMappedInputFields.businessScope;
        changed = true;
      }
      if (!next.businessField && autoMappedInputFields.businessField) {
        next.businessField = autoMappedInputFields.businessField;
        changed = true;
      }
      if (!next.procurementMethod && autoMappedInputFields.procurementMethod) {
        next.procurementMethod = autoMappedInputFields.procurementMethod;
        changed = true;
      }
      return changed ? next : current;
    });
  }, [autoMappedInputFields, inputDraft]);

  const inputSaveMutation = useMutation({
    mutationFn: async ({ candidateId, draft }: { candidateId: number; draft: BidNoticeRecord }) => {
      const participationOption = finalParticipationOptions.options.find((option) => option.value === draft.finalParticipationStatus);
      const isAbsent = draft.finalParticipationStatus === "N" || participationOption?.label.includes("\uBD88\uCC38") === true;
      if (isAbsent && !draft.reasonOfAbsenceCode.trim()) throw new Error("불참 사유를 선택해주세요.");
      const draftWithMappedBidMethod = draft.bidMethod.trim() || autoMappedInputFields.bidMethod
        ? { ...draft, bidMethod: draft.bidMethod.trim() || autoMappedInputFields.bidMethod }
        : draft;
      const request = toBidNoticeRequest(draftWithMappedBidMethod);
      const saved = draft.seqNo ? await updateBidNotice(draft.seqNo, request) : await createBidNotice(request);
      if (!saved.bidSeq) throw new Error("저장된 공고 식별자를 확인할 수 없습니다.");
      await markG2bBidNoticeCandidateImported(candidateId, saved.bidSeq);
      return saved;
    },
    onSuccess: (saved) => {
      setInputDraft(toEditableBidNoticeRecord(saved));
      setInputAttachmentOwnerId(saved.bidSeq ?? null);
      queryClient.invalidateQueries({ queryKey: ["bid-notices"] });
      queryClient.invalidateQueries({ queryKey: ["g2b-bid-notice-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["file-attachments", "BID_NOTICE", String(saved.bidSeq)] });
      showSuccess("공고문이 저장되었습니다. 첨부파일을 추가할 수 있습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "공고문 저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteG2bBidNoticeCandidates(ids),
    onSuccess: () => {
      setRowSelectionModel({ ids: new Set(), type: "include" });
      queryClient.invalidateQueries({ queryKey: ["g2b-bid-notice-candidates"] });
      showSuccess("선택한 나라장터 공고가 삭제되었습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "나라장터 공고 삭제에 실패했습니다."),
  });

  const syncMutation = useMutation({
    mutationFn: syncG2bBidNoticeCandidates,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["g2b-bid-notice-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["g2b-bid-notice-candidates", "sync-status"] });
      showSuccess(result.message || "나라장터 용역 API 조회가 완료되었습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "나라장터 용역 API 조회에 실패했습니다."),
  });

  const searchParams = useMemo<G2bBidNoticeCandidateSearchParams>(
    () => ({ ...appliedFilters, page: paginationModel.page, size: paginationModel.pageSize }),
    [appliedFilters, paginationModel.page, paginationModel.pageSize],
  );
  const candidatesQuery = useG2bBidNoticeCandidateQueries({ enabled: queryEnabled, searchParams });
  const syncStatusQuery = useQuery({
    queryKey: ["g2b-bid-notice-candidates", "sync-status"],
    queryFn: getG2bBidNoticeCandidateSyncStatus,
    enabled: queryEnabled,
  });
  const rows = useMemo(
    () => (candidatesQuery.data?.content ?? []).map(toG2bBidNoticeCandidateRow),
    [candidatesQuery.data?.content],
  );

  const updateFilter = (field: keyof G2bBidNoticeCandidateSearchFilters, value: string | string[]) => {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = () => {
    const filtersChanged = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
    setAppliedFilters({ ...draftFilters });
    setPaginationModel((current) => ({ ...current, page: 0 }));
    if (!filtersChanged && paginationModel.page === 0) void candidatesQuery.refetch();
  };

  const handleReset = () => {
    const emptyFilters = emptyG2bBidNoticeCandidateSearchFilters();
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(rowSelectionModel.ids).map(Number).filter((id) => Number.isFinite(id) && id > 0);
    if (!canDelete || ids.length === 0 || deleteMutation.isPending) return;
    if (!window.confirm(`선택한 ${ids.length}건의 나라장터 공고를 삭제하시겠습니까?`)) return;
    deleteMutation.mutate(ids);
  };

  const handleDeleteDetailCandidate = () => {
    if (!canDelete || !detailRecord || deleteMutation.isPending) return;
    if (!window.confirm("현재 나라장터 공고를 삭제하시겠습니까?")) return;
    deleteMutation.mutate([detailRecord.id], {
      onSuccess: () => setDetailRecord(null),
    });
  };

  const openDetail = async (row: ReturnType<typeof toG2bBidNoticeCandidateRow>) => {
    const isChangeOrCancel = row.ntceKindNm.includes("변경") || row.ntceKindNm.includes("취소");
    if (!isChangeOrCancel || row.importedBidSeq) {
      setDetailRecord(row);
      return;
    }

    const importedCandidate = await getImportedG2bBidNoticeCandidateByNoticeNumber(row.bidNtceNo).catch(() => null);
    setDetailRecord(importedCandidate ? { ...row, importedBidSeq: importedCandidate.importedBidSeq } : row);
  };

  const openBidNoticeInput = async () => {
    if (!detailRecord) return;
    const canEditImportedNotice = detailRecord.importedBidSeq ? canUpdate : canCreate;
    if (!canEditImportedNotice) {
      showError("공고문 등록 권한이 없습니다.");
      return;
    }
    setInputSourceAttachments(detailRecord.attachments);
    setInputSourceNotice(detailRecord);
    setInputCandidateId(detailRecord.id);
    setInputAttachmentOwnerId(detailRecord.importedBidSeq);
    setInputClientSearchHint(detailRecord.dminsttNm);
    setInputMappingSource({
      bidMethod: detailRecord.bidMethdNm,
      businessScope: detailRecord.pubPrcrmntMidClsfcNm,
      businessType: detailRecord.pubPrcrmntMidClsfcNm,
      businessField: detailRecord.pubPrcrmntClsfcNm,
      orderMethod: detailRecord.cntrctCnclsMthdNm,
    });
    const session = readAuthSession();
    const candidateDraft = toCandidateBidNoticeDraft(detailRecord);
    const [existingRecord, existingAttachments] = await Promise.all([
      detailRecord.importedBidSeq ? getBidNotice(detailRecord.importedBidSeq) : Promise.resolve(null),
      detailRecord.importedBidSeq
        ? getImportedG2bBidNoticeCandidate(detailRecord.importedBidSeq).catch(() => null)
        : Promise.resolve(null),
    ]);
    const baseDraft = existingRecord ? toEditableBidNoticeRecord(existingRecord) : emptyBidNoticeDraft();
    const mergedDraft = existingRecord ? {
      ...baseDraft,
      bidClosingDate: candidateDraft.bidClosingDate || baseDraft.bidClosingDate,
      bidDate: candidateDraft.bidDate || baseDraft.bidDate,
      bidSubmissionDate: candidateDraft.bidSubmissionDate || baseDraft.bidSubmissionDate,
      bidStyle: candidateDraft.bidStyle || baseDraft.bidStyle,
      designAmt: candidateDraft.designAmt || baseDraft.designAmt,
      estimateAmount: candidateDraft.estimateAmount || baseDraft.estimateAmount,
      noticeDate: candidateDraft.noticeDate || baseDraft.noticeDate,
      pqSubmissionDate: candidateDraft.pqSubmissionDate || baseDraft.pqSubmissionDate,
      projectName: candidateDraft.projectName || baseDraft.projectName,
    } : candidateDraft;
    const fieldChanges = existingRecord
      ? bidNoticeChangeFields
        .map(([field, label]) => ({
          field,
          current: changeValue(field, mergedDraft[field]),
          label,
          previous: changeValue(field, baseDraft[field]),
        }))
        .filter((change) => comparableChangeValue(change.field, mergedDraft[change.field]) !== comparableChangeValue(change.field, baseDraft[change.field]))
        .map(({ current, label, previous }) => ({ current, label, previous }))
      : [];
    const previousAttachmentNames = attachmentNames(existingAttachments?.attachments ?? []);
    const currentAttachmentNames = attachmentNames(detailRecord.attachments);
    const attachmentChanges = existingRecord && previousAttachmentNames !== currentAttachmentNames
      ? [{ current: currentAttachmentNames, label: "첨부파일", previous: previousAttachmentNames }]
      : [];
    setInputChangeSummary([...fieldChanges, ...attachmentChanges]);
    setInputDraft({
      ...mergedDraft,
      seqNo: existingRecord?.bidSeq ?? 0,
      department: baseDraft.department || session?.deptCode || "",
      writerName: baseDraft.writerName || session?.employeeNo || "",
    });
    setDetailRecord(null);
  };

  const updateInputDraft = <K extends keyof BidNoticeRecord>(field: K, value: BidNoticeRecord[K]) => {
    setInputDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const closeInput = () => {
    if (!inputSaveMutation.isPending) {
      setInputDraft(null);
      setInputCandidateId(null);
      setInputAttachmentOwnerId(null);
      setInputSourceNotice(null);
      setInputChangeSummary([]);
      setInputSourceAttachments([]);
      setInputClientSearchHint("");
      setInputMappingSource({ bidMethod: "", businessScope: "", businessType: "", businessField: "", orderMethod: "" });
    }
  };

  return (
    <Box>
      <PageHeader action={<NotificationPreferenceButton menuPath="/pq/g2b-bid-notice-candidates" />} title="공고문(나라장터 연계)" />
      <SearchPanel
        keyword={draftFilters.bidNtceNo}
        keywordLabel="입찰공고번호"
        keywordPlaceholder="입찰공고번호를 입력하세요"
        localKeyword={false}
        onKeywordChange={(value) => updateFilter("bidNtceNo", value)}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <G2bBidNoticeCandidateFilters filters={draftFilters} onChange={updateFilter} />
      </SearchPanel>

      {!canRead ? (
        <Alert severity="warning">공고문 연계 후보 조회 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                <Box sx={{ alignItems: "baseline", display: "flex", gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">나라장터 공고 목록</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                    조회 기준시간: {dateTimeText(syncStatusQuery.data?.lastSeenAt) || "-"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    disabled={!canRead || syncMutation.isPending}
                    onClick={() => syncMutation.mutate()}
                    variant="outlined"
                  >
                    {syncMutation.isPending ? "나라장터 용역API 조회 중..." : "나라장터 용역API 조회"}
                  </Button>
                  <Button
                    color="error"
                    disabled={!canDelete || rowSelectionModel.ids.size === 0 || deleteMutation.isPending}
                    onClick={handleDeleteSelected}
                    startIcon={<DeleteOutlineOutlinedIcon />}
                    variant="outlined"
                  >
                    선택 삭제
                  </Button>
                </Box>
              </Box>
              <G2bBidNoticeCandidateGrid
                loading={candidatesQuery.isLoading || candidatesQuery.isFetching}
                onPaginationModelChange={(model) => setPaginationModel(model)}
                paginationModel={paginationModel}
                rowCount={candidatesQuery.data?.totalElements ?? 0}
                rows={rows}
                onRowDoubleClick={(row) => void openDetail(row)}
                onRowSelectionModelChange={setRowSelectionModel}
                rowSelectionModel={rowSelectionModel}
              />
            </CardContent>
          </Card>
        </Stack>
      )}
      {detailRecord ? (
        <G2bBidNoticeCandidateDetailDialog
          open
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onDeleteCandidate={canDelete ? handleDeleteDetailCandidate : undefined}
          onEnterBidNoticeInput={(detailRecord.importedBidSeq ? canUpdate : canCreate)
            && (!detailRecord.ntceKindNm.includes("변경") && !detailRecord.ntceKindNm.includes("취소") || Boolean(detailRecord.importedBidSeq))
            ? openBidNoticeInput
            : undefined}
          bidNoticeInputLabel={detailRecord.ntceKindNm.includes("변경") || detailRecord.ntceKindNm.includes("취소") ? "공고문 업데이트" : "공고문 입력"}
        />
      ) : null}
      {inputDraft ? (
        <BidNoticeDetailDialog
          attachmentOwnerId={inputAttachmentOwnerId ?? undefined}
          attachments={{ announcement: [], evaluation: [], guide: [], specification: [], submission: [] }}
          changeSummary={inputChangeSummary}
          clientSearchHint={inputClientSearchHint}
          onClose={closeInput}
          onDeleteRequest={closeInput}
          onFieldChange={updateInputDraft}
          onSave={(draft) => inputCandidateId && inputSaveMutation.mutate({ candidateId: inputCandidateId, draft })}
          open
          options={inputOptions}
          record={inputDraft}
          readOnly={false}
          saveDisabled={inputSaveMutation.isPending || (inputDraft.seqNo ? !canUpdate : !canCreate)}
          deleteDisabled
          deferChanges
          sourceAttachments={inputSourceAttachments}
          sourceNotice={inputSourceNotice ?? undefined}
        />
      ) : null}
    </Box>
  );
}
