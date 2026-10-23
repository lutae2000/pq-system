export const qualificationCriteriaQueryKeys = {
  agencies: (keyword: string, useYn: boolean | undefined) => ["qualification-criteria", "agencies", keyword, useYn] as const,
  criteria: (agencyId: number | null, keyword: string, useYn: boolean | undefined) => ["qualification-criteria", "criteria", agencyId, keyword, useYn] as const,
  scoreBands: (criterionId: number | null) => ["qualification-criteria", "score-bands", criterionId] as const,
};
