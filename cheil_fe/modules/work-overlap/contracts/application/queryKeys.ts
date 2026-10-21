const root = ["work-overlap-contracts"] as const;

export const workOverlapContractQueryKeys = {
  all: root,
  detail: (contractNo: string) => [...root, "detail", contractNo] as const,
  engineers: (contractNo: string) => [...root, "engineers", contractNo] as const,
  engineerHistories: (contractNo: string) =>
    [...root, "engineer-histories", contractNo] as const,
  periodHistories: (contractNo: string) =>
    [...root, "period-histories", contractNo] as const,
  engineerCandidates: (keyword: string) =>
    [...root, "engineer-candidates", keyword] as const,
  engineersRoot: () => [...root, "engineers"] as const,
  list: (params: unknown) => [...root, "list", params] as const,
  summary: (params: unknown) => [...root, "summary", params] as const,
} as const;
