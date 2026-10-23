"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useQualificationCriteriaMutations<TAgency, TAgencyRow, TCriterion, TCriterionRow, TBand, TBandRow, TDeleteTarget>({
  saveAgency, saveCriterion, saveScoreBand, deleteTarget,
  onAgencySaved, onCriterionSaved, onScoreBandSaved, onDeleted, onError,
}: {
  saveAgency: (row: TAgencyRow) => Promise<TAgency>;
  saveCriterion: (row: TCriterionRow) => Promise<TCriterion>;
  saveScoreBand: (row: TBandRow) => Promise<TBand>;
  deleteTarget: (target: TDeleteTarget) => Promise<TDeleteTarget>;
  onAgencySaved: (saved: TAgency, row: TAgencyRow) => void;
  onCriterionSaved: (saved: TCriterion, row: TCriterionRow) => void;
  onScoreBandSaved: (saved: TBand, row: TBandRow) => void;
  onDeleted: (target: TDeleteTarget) => void;
  onError: (error: unknown) => void;
}) {
  const client = useQueryClient();
  const invalidate = (part: "agencies" | "criteria" | "score-bands") => client.invalidateQueries({ queryKey: ["qualification-criteria", part] });
  const saveAgencyMutation = useMutation({ mutationFn: saveAgency, onSuccess: async (saved, row) => { onAgencySaved(saved, row); await invalidate("agencies"); }, onError });
  const saveCriterionMutation = useMutation({ mutationFn: saveCriterion, onSuccess: async (saved, row) => { onCriterionSaved(saved, row); await invalidate("criteria"); }, onError });
  const saveScoreBandMutation = useMutation({ mutationFn: saveScoreBand, onSuccess: async (saved, row) => { onScoreBandSaved(saved, row); await invalidate("score-bands"); }, onError });
  const deleteMutation = useMutation({ mutationFn: deleteTarget, onSuccess: async (target) => { onDeleted(target); await Promise.all([invalidate("agencies"), invalidate("criteria"), invalidate("score-bands")]); }, onError });
  return { deleteMutation, saveAgencyMutation, saveCriterionMutation, saveScoreBandMutation };
}
