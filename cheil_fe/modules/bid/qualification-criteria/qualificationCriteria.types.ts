export type UseYnFilter = "All" | "Y" | "N";

export type QualificationReviewAgencyRecord = {
  id: number;
  agencyCode: string;
  agencyName: string;
  remark: string | null;
  useYn: boolean;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type QualificationReviewCriterionRecord = {
  id: number;
  agencyId: number;
  ruleCode: string;
  revisionNo: string;
  effectiveDate: string | null;
  legalBasis: string | null;
  technicalWeight: number | null;
  priceWeight: number | null;
  decisionMethod: string | null;
  thresholdRatio: number | null;
  useYn: boolean;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type QualificationScoreBandRecord = {
  id: number;
  criterionId: number;
  sortOrder: number;
  minPrice: number | null;
  maxPrice: number | null;
  priceText: string | null;
  passScore: number | null;
  technicalScore: number | null;
  careerScore: number | null;
  regionScore: number | null;
  managementScore: number | null;
  priceScore: number | null;
  priceMultiplier: number | null;
  priceFormula: string | null;
  technicalAverageScore: number | null;
  totalAverageScore: number | null;
  lowestBidPrice: number | null;
  pqAvailableScore: number | null;
  useYn: boolean;
  remark: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type QualificationReviewAgencyUpsertRequest = {
  agencyCode: string;
  agencyName: string;
  remark: string | null;
  useYn: boolean;
};

export type QualificationReviewCriterionUpsertRequest = {
  agencyId: number;
  ruleCode: string;
  revisionNo: string;
  effectiveDate: string | null;
  legalBasis: string | null;
  technicalWeight: number | null;
  priceWeight: number | null;
  decisionMethod: string | null;
  thresholdRatio: number | null;
  useYn: boolean;
};

export type QualificationScoreBandUpsertRequest = {
  criterionId: number;
  sortOrder: number;
  minPrice: number | null;
  maxPrice: number | null;
  priceText: string | null;
  passScore: number | null;
  technicalScore: number | null;
  careerScore: number | null;
  regionScore: number | null;
  managementScore: number | null;
  priceScore: number | null;
  priceMultiplier: number | null;
  priceFormula: string | null;
  technicalAverageScore: number | null;
  totalAverageScore: number | null;
  lowestBidPrice: number | null;
  pqAvailableScore: number | null;
  useYn: boolean;
  remark: string | null;
};

export type QualificationCriteriaSearchParams = {
  keyword?: string;
  useYn?: boolean;
};
