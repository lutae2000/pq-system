"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import { deletePqParticipatingEngineer, listPqParticipatingEngineers } from "@/modules/pq/pq-participating-engineers/api";
import {
  createEngineerProjectHistoryReviewResults,
  deleteEngineerProjectHistoryReviewResult,
  saveEngineerDocumentValueSetting,
  syncEngineerProjectHistoryReviewResults,
  updateEngineerProjectHistoryReviewResult,
  type EngineerProjectHistoryReviewRecord,
} from "@/modules/pq/engineer-performance-docs/api";
import { engineerPerformanceDocumentsQueryKeys } from "@/modules/pq/engineer-performance-docs/application/queryKeys";

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
  getSortedReviewRows: () => EngineerProjectHistoryReviewRecord[];
  onActiveEngineerDeleted: () => void;
  onReviewSelectionCleared: () => void;
  onReviewAdded: () => void;
  onReviewDeleted: () => void;
  onReviewRenumbered: () => void;
  pendingBulkDeleteEngineerIds: string[] | null;
  pendingBulkDeleteReviewIds: string[] | null;
  profiles: Array<{ summary: { id: string } }>;
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
  getSortedReviewRows,
  onActiveEngineerDeleted,
  onReviewSelectionCleared,
  onReviewAdded,
  onReviewDeleted,
  onReviewRenumbered,
  pendingBulkDeleteEngineerIds,
  pendingBulkDeleteReviewIds,
  profiles,
  selectedHistoryRows,
  reviewRowById,
  reviewRows,
  showError,
  showSuccess,
}: UseEngineerPerformanceDocumentsParams) {
  const queryClient = useQueryClient();

  const saveInlineDocumentValueMutation = useMutation({
    mutationFn: (change: InlineDocumentValueChange) => {
      if (!bidSeq) throw new Error("怨듦퀬瑜?癒쇱? ?좏깮?섏꽭??");
      return saveEngineerDocumentValueSetting({ bidSeq, ...change });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: engineerPerformanceDocumentsQueryKeys.documentValueSettings(bidSeq) });
      showSuccess("?좏깮 ?숇젰쨌?먭꺽????λ릺?덉뒿?덈떎.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "?좏깮 ?숇젰쨌?먭꺽????ν븯吏 紐삵뻽?듬땲??"),
  });

  const syncReviewResults = async (conditions: RelatedProjectHistoryCondition[]) => {
    if ((!canCreate && !canUpdate) || !bidSeq || profiles.length === 0) return;
    try {
      await Promise.all(profiles.map((profile) => syncEngineerProjectHistoryReviewResults({ bidSeq, engineerId: profile.summary.id, relatedProjectHistoryConditions: conditions })));
      await invalidateReviewResults(queryClient);
      showSuccess("愿??怨듭궗 李몄뿬 ?대젰??寃?좉껐怨쇱뿉 諛섏쁺?덉뒿?덈떎.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "愿??怨듭궗 李몄뿬 ?대젰??寃?좉껐怨쇱뿉 諛섏쁺?섏? 紐삵뻽?듬땲??");
      throw error;
    }
  };

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!canCreate || !bidSeq) throw new Error("怨듦퀬臾몄쓣 癒쇱? ?좏깮?섏꽭??");
      const uniqueRows = Array.from(new Map(selectedHistoryRows.map((row) => [text(row.id), row])).values()).sort(compareHistoryRowsForDisplayOrder);
      const nextDisplayOrder = Math.max(0, ...reviewRows.map((row) => row.displayOrder ?? 0)) + 1;
      return createEngineerProjectHistoryReviewResults(uniqueRows.map((row, index) => ({ bidSeq, engineerId: activeEngineerId, sourceSeq: Number(row.id), displayOrder: nextDisplayOrder + index, sourceRow: row })));
    },
    onSuccess: async () => { onReviewSelectionCleared(); onReviewAdded(); await invalidateReviewResults(queryClient); },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      if (!canDelete || !bidSeq) throw new Error("??젣??寃?좉껐怨쇨? ?놁뒿?덈떎.");
      const targetRows = (pendingBulkDeleteReviewIds ?? []).map((id) => reviewRowById.get(id)).filter((row): row is EngineerProjectHistoryReviewRecord & { reviewId: number } => Boolean(row?.reviewId));
      if (!targetRows.length) throw new Error("??젣??寃?좉껐怨쇨? ?놁뒿?덈떎.");
      await Promise.all(targetRows.map((row) => deleteEngineerProjectHistoryReviewResult({ bidSeq, engineerId: row.engineerId, reviewId: row.reviewId })));
    },
    onSuccess: async () => { onReviewDeleted(); await invalidateReviewResults(queryClient); },
  });

  const renumberReviewMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(getSortedReviewRows().filter((row) => row.reviewId != null).map((row, index) => updateEngineerProjectHistoryReviewResult({ bidSeq: row.bidSeq ?? bidSeq ?? 0, engineerId: row.engineerId, sourceSeq: row.sourceSeq, displayOrder: index + 1, sourceRow: row }, row.reviewId!)));
    },
    onSuccess: async () => { onReviewRenumbered(); await invalidateReviewResults(queryClient); showSuccess("?꾩옱 ?뺣젹 ?쒖꽌濡??쒕쾲????ν뻽?듬땲??"); },
    onError: (error) => showError(error instanceof Error ? error.message : "?꾩옱 ?뺣젹 ?쒖꽌濡??쒕쾲????ν븯吏 紐삵뻽?듬땲??"),
  });

  const deleteEngineerMutation = useMutation({
    mutationFn: async () => {
      if (!canDelete || !bidSeq || !pendingBulkDeleteEngineerIds?.length) throw new Error("??젣??湲곗닠?몄씠 ?놁뒿?덈떎.");
      const participatingEngineers = await listPqParticipatingEngineers({ bidSeq });
      const targets = participatingEngineers.filter((row) => pendingBulkDeleteEngineerIds.includes(row.engrId));
      if (!targets.length) throw new Error("??젣??湲곗닠?몄씠 ?놁뒿?덈떎.");
      await Promise.all(targets.map((row) => deletePqParticipatingEngineer(row.bidSeq, row.workDutyId, row.engrId)));
    },
    onSuccess: async () => {
      if (pendingBulkDeleteEngineerIds?.includes(activeEngineerId)) onActiveEngineerDeleted();
      await queryClient.invalidateQueries({ queryKey: engineerPerformanceDocumentsQueryKeys.selectedEngineersRoot });
      showSuccess("?좏깮??湲곗닠?몄쓣 ??젣?덉뒿?덈떎.");
    },
  });

  const processReviewRowUpdate = async (updatedRow: EngineerProjectHistoryReviewRecord, originalRow: EngineerProjectHistoryReviewRecord) => {
    if (!canUpdate || updatedRow.reviewId == null) return originalRow;
    const displayOrder = Number(updatedRow.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 1) throw new Error("?쒕쾲? 1 ?댁긽???뺤닔濡??낅젰??二쇱꽭??");
    try {
      const saved = await updateEngineerProjectHistoryReviewResult({ bidSeq: updatedRow.bidSeq ?? bidSeq ?? 0, engineerId: updatedRow.engineerId, sourceSeq: updatedRow.sourceSeq, displayOrder, sourceRow: originalRow }, updatedRow.reviewId);
      showSuccess("寃?좉껐怨??쒕쾲????ν뻽?듬땲??");
      return saved;
    } catch (error) {
      showError(error instanceof Error ? error.message : "寃?좉껐怨??쒕쾲????ν븯吏 紐삵뻽?듬땲??");
      throw error;
    }
  };

  return {
    saveInlineDocumentValueMutation,
    addReviewMutation,
    deleteReviewMutation,
    renumberReviewMutation,
    deleteEngineerMutation,
    processReviewRowUpdate,
    syncReviewResults,
  };
}
