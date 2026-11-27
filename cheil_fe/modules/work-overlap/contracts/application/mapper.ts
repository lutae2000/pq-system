import type {
  WorkOverlapContractEngineerChangeRequest,
  WorkOverlapContractEngineerRecord,
  WorkOverlapContractEngineerRequest,
} from "@/modules/work-overlap/contracts/api";

export const normalizeDateValue = (value: string | null | undefined) =>
  (value ?? "").replace(/\D/g, "").slice(0, 8) || null;

export const toEngineerRequest = (
  row: WorkOverlapContractEngineerRecord,
): WorkOverlapContractEngineerRequest => ({
  engineerId: (row.engineerId ?? "") || null,
  field: (row.field ?? "") || null,
  participationDate: normalizeDateValue(row.participationDate),
  participationEndDate: normalizeDateValue(row.participationEndDate),
  participationType: (row.participationType ?? "") || null,
  pqTargetYn: Boolean(row.pqTargetYn),
  remark: (row.remark ?? "") || null,
});

const engineerEditableFields = [
  "field", "participationDate", "participationEndDate", "participationType", "pqTargetYn", "remark",
] as const;

export const toInlineEngineerUpdate = (
  updatedRow: WorkOverlapContractEngineerRecord,
  originalRow: WorkOverlapContractEngineerRecord,
  originalFieldLabel: string,
): WorkOverlapContractEngineerChangeRequest | null => {
  const original = toEngineerRequest(originalRow);
  const { engineerId, ...values } = toEngineerRequest({
    ...updatedRow,
    engineerId: original.engineerId,
  });
  if (values.field === (originalFieldLabel || null)) {
    values.field = original.field;
  }
  if (engineerEditableFields.every((field) => values[field] === original[field])) {
    return null;
  }

  return {
    ...values,
    beforeEngineerId: engineerId,
    afterEngineerId: engineerId,
    changeContent: "",
    historyField: null,
    historyParticipationType: null,
    historyParticipationStartDate: null,
    historyParticipationEndDate: null,
  };
};
