export type CertificationRecord = {
  certCode: string;
  certName: string;
  certKind: number;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
  useYn: boolean;
};

export type CertificationUpsertRequest = {
  certCode: string;
  certKind: number;
  certName: string;
  useYn: boolean;
};
