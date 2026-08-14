export type ServiceTypeRecord = {
  serviceTypeCode: string;
  serviceTypeName: string;
  useYn: boolean;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type ServiceTypeUpsertRequest = {
  serviceTypeCode: string;
  serviceTypeName: string;
  useYn: boolean;
};
