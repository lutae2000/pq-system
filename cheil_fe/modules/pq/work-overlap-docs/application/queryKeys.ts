const root = ["work-overlap-docs"] as const;

export const workOverlapDocumentsQueryKeys = {
  all: root,
  engineers: (bidSeq: number | null | undefined, workDutyId: string, keyword: string) =>
    [...root, "document-engineers", bidSeq ?? "none", workDutyId || "none", keyword] as const,
  engineersRoot: () => [...root, "document-engineers"] as const,
  contracts: (params: {
    activeEngineerId: string;
    bidSeq: number | null | undefined;
    contractPage: number;
    contractPageSize: number;
    referenceDate: string;
    remainingDays: string;
    workDutyId: string;
  }) => [...root, "contracts", params] as const,
  engineerProfile: (engineerId: string) =>
    [...root, "engineer-profile", engineerId || "none"] as const,
} as const;
