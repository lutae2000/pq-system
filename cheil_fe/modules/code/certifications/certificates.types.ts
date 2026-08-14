export type CertificationRecord = {
  certCode: string;
  certName: string;
  certKind: number;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
  satisCode: string | null;
  satisName: string | null;
  useYn: boolean;
};

export type CertificationUpsertRequest = {
  certCode: string;
  certKind: number;
  certName: string;
  satisCode: string | null;
  satisName: string | null;
  useYn: boolean;
};
