"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getEngineerProfile } from "@/modules/pq/engineers/api";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import { deletePqParticipatingEngineer, listPqParticipatingEngineers } from "@/modules/pq/pq-participating-engineers/api";
import {
  createEngineerProjectHistoryReviewResults,
  deleteEngineerProjectHistoryReviewResult,
  listEngineerProjectHistoryReviewResults,
  saveEngineerDocumentValueSetting,
  syncEngineerProjectHistoryReviewResults,
  updateEngineerProjectHistoryReviewResult,
  type EngineerProjectHistoryReviewRecord,
} from "@/modules/pq/engineer-performance-docs/api";
import { engineerPerformanceDocumentsQueryKeys } from "@/modules/pq/engineer-performance-docs/application/queryKeys";
import { downloadEngineerPerformanceReviewWorkbook } from "@/modules/pq/engineer-performance-docs/engineerPerformanceDocumentsExcel";

type InlineDocumentValueChange = {
  educationId: number | null;
  engineerId: string;
  licenseId: number | null;
};

type UseEngineerPerformanceDocumentsParams = {
  activeEngineerId: string;
  bidSeq: number | null;
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  engLevelLabelByCode: Record<string, string>;
  getSortedReviewRows: () => EngineerProjectHistoryReviewRecord[];
  onActiveEngineerDeleted: () => void;
  onReviewSelectionCleared: () => void;
  onReviewAdded: () => void;
  onReviewDeleted: () => void;
  onReviewRenumbered: () => void;
  pendingBulkDeleteEngineerIds: string[] | null;
  pendingBulkDeleteReviewIds: string[] | null;
  profiles: Array<{ summary: { id: string } }>;
  projectName: string;
  selectedHistoryRows: Array<EngineerProjectHistoryReviewRecord & { id?: string | number | null }>;
  reviewRowById: Map<string, EngineerProjectHistoryReviewRecord & { reviewId?: number | null }>;
  reviewRows: EngineerProjectHistoryReviewRecord[];
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const invalidateReviewResults = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: engineerPerformanceDocumentsQueryKeys.reviewResultsRoot });

const text = (value: string | number | null | undefined) => String(value ?? "").trim();

const dateSortValue = (value: string | number | null | undefined) => {
  const digits = text(value).replace(/\D/g, "").slice(0, 8);
  return digits.length === 8 ? Number(digits) : Number.MAX_SAFE_INTEGER;
};

const compareHistoryRowsForDisplayOrder = (left: EngineerProjectHistoryReviewRecord, right: EngineerProjectHistoryReviewRecord) =>
  dateSortValue(left.contractFromDate) - dateSortValue(right.contractFromDate) ||
  dateSortValue(left.startDate) - dateSortValue(right.startDate);

export function useEngineerPerformanceDocuments({
  activeEngineerId,
  bidSeq,
  canCreate,
  canDelete,
  canUpdate,
  engLevelLabelByCode,
  getSortedReviewRows,
  onActiveEngineerDeleted,
  onReviewSelectionCleared,
  onReviewAdded,
  onReviewDeleted,
  onReviewRenumbered,
  pendingBulkDeleteEngineerIds,
  pendingBulkDeleteReviewIds,
  profiles,
  projectName,
  selectedHistoryRows,
  reviewRowById,
  reviewRows,
  showError,
  showSuccess,
}: UseEngineerPerformanceDocumentsParams) {
  const queryClient = useQueryClient();

  const saveInlineDocumentValueMutation = useMutation({
    mutationFn: (change: InlineDocumentValueChange) => {
      if (!bidSeq) throw new Error("공고를 먼저 선택하세요.");
      return saveEngineerDocumentValueSetting({ bidSeq, ...change });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: engineerPerformanceDocumentsQueryKeys.documentValueSettings(bidSeq) });
      showSuccess("선택 학력과 자격이 저장되었습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "선택 학력과 자격을 저장하지 못했습니다."),
  });

  const downloadReviewWorkbookMutation = useMutation({
    mutationFn: async () => {
      if (!bidSeq || profiles.length === 0) {
        throw new Error("엑셀로 내보낼 기술인 정보가 없습니다.");
      }

      const reviewResultsByEngineer = await Promise.all(
        profiles.map(async (profile) => {
          const engineerId = profile.summary.id;
          const results = await listEngineerProjectHistoryReviewResults({ bidSeq, engineerId });
          return { engineerId, results };
        }),
      );
      const detailedProfiles = await Promise.all(profiles.map((profile) => getEngineerProfile(profile.summary.id)));

      return downloadEngineerPerformanceReviewWorkbook({
        profiles: detailedProfiles,
        projectName,
        reviewResultsByEngineer,
        engLevelLabelByCode,
      });
    },
    onError: (error) => showError(error instanceof Error ? error.message : "기술인 검토결과 엑셀 다운로드에 실패했습니다."),
  });

  const syncReviewResults = async (conditions: RelatedProjectHistoryCondition[]) => {
    if ((!canCreate && !canUpdate) || !bidSeq || profiles.length === 0) return;
    try {
      await Promise.all(profiles.map((profile) => syncEngineerProjectHistoryReviewResults({ bidSeq, engineerId: profile.summary.id, relatedProjectHistoryConditions: conditions })));
      await invalidateReviewResults(queryClient);
      showSuccess("관련 공사 참여 이력을 검토 결과에 반영했습니다.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "관련 공사 참여 이력을 검토 결과에 반영하지 못했습니다.");
      throw error;
    }
  };

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!canCreate || !bidSeq) throw new Error("공고문을 먼저 선택하세요.");
      const uniqueRows = Array.from(new Map(selectedHistoryRows.map((row) => [text(row.id), row])).values()).sort(compareHistoryRowsForDisplayOrder);
      const nextDisplayOrder = Math.max(0, ...reviewRows.map((row) => row.displayOrder ?? 0)) + 1;
      return createEngineerProjectHistoryReviewResults(uniqueRows.map((row, index) => ({ bidSeq, engineerId: activeEngineerId, sourceSeq: Number(row.id), displayOrder: nextDisplayOrder + index, sourceRow: row })));
    },
    onSuccess: async () => { onReviewSelectionCleared(); onReviewAdded(); await invalidateReviewResults(queryClient); },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      if (!canDelete || !bidSeq) throw new Error("삭제할 검토 결과가 없습니다.");
      const targetRows = (pendingBulkDeleteReviewIds ?? []).map((id) => reviewRowById.get(id)).filter((row): row is EngineerProjectHistoryReviewRecord & { reviewId: number } => Boolean(row?.reviewId));
      if (!targetRows.length) throw new Error("삭제할 검토 결과가 없습니다.");
      await Promise.all(targetRows.map((row) => deleteEngineerProjectHistoryReviewResult({ bidSeq, engineerId: row.engineerId, reviewId: row.reviewId })));
    },
    onSuccess: async () => { onReviewDeleted(); await invalidateReviewResults(queryClient); },
  });

  const renumberReviewMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(getSortedReviewRows().filter((row) => row.reviewId != null).map((row, index) => updateEngineerProjectHistoryReviewResult({ bidSeq: row.bidSeq ?? bidSeq ?? 0, engineerId: row.engineerId, sourceSeq: row.sourceSeq, displayOrder: index + 1, sourceRow: row }, row.reviewId!)));
    },
    onSuccess: async () => { onReviewRenumbered(); await invalidateReviewResults(queryClient); showSuccess("현재 정렬 순서로 순번을 저장했습니다."); },
    onError: (error) => showError(error instanceof Error ? error.message : "현재 정렬 순서로 순번을 저장하지 못했습니다."),
  });

  const deleteEngineerMutation = useMutation({
    mutationFn: async () => {
      if (!canDelete || !bidSeq || !pendingBulkDeleteEngineerIds?.length) throw new Error("삭제할 기술인이 없습니다.");
      const participatingEngineers = await listPqParticipatingEngineers({ bidSeq });
      const targets = participatingEngineers.filter((row) => pendingBulkDeleteEngineerIds.includes(row.engrId));
      if (!targets.length) throw new Error("삭제할 기술인이 없습니다.");
      await Promise.all(targets.map((row) => deletePqParticipatingEngineer(row.bidSeq, row.workDutyId, row.engrId)));
    },
    onSuccess: async () => {
      if (pendingBulkDeleteEngineerIds?.includes(activeEngineerId)) onActiveEngineerDeleted();
      await queryClient.invalidateQueries({ queryKey: engineerPerformanceDocumentsQueryKeys.selectedEngineersRoot });
      showSuccess("선택한 기술인을 삭제했습니다.");
    },
  });

  const processReviewRowUpdate = async (updatedRow: EngineerProjectHistoryReviewRecord, originalRow: EngineerProjectHistoryReviewRecord) => {
    if (!canUpdate || updatedRow.reviewId == null) return originalRow;
    const displayOrder = Number(updatedRow.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 1) throw new Error("순번은 1 이상의 정수로 입력해 주세요.");
    try {
      const saved = await updateEngineerProjectHistoryReviewResult({ bidSeq: updatedRow.bidSeq ?? bidSeq ?? 0, engineerId: updatedRow.engineerId, sourceSeq: updatedRow.sourceSeq, displayOrder, sourceRow: originalRow }, updatedRow.reviewId);
      showSuccess("검토 결과 순번을 저장했습니다.");
      return saved;
    } catch (error) {
      showError(error instanceof Error ? error.message : "검토 결과 순번을 저장하지 못했습니다.");
      throw error;
    }
  };

  return {
    saveInlineDocumentValueMutation,
    downloadReviewWorkbookMutation,
    addReviewMutation,
    deleteReviewMutation,
    renumberReviewMutation,
    deleteEngineerMutation,
    processReviewRowUpdate,
    syncReviewResults,
  };
}

