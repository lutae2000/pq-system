import type { DataGridProps, GridApi, GridColDef, GridRowId, GridRowModesModel, GridValidRowModel } from "@mui/x-data-grid";
import type { KeyboardEvent, RefObject } from "react";

import type { EnterpriseDataGridProps } from "@/components/common/EnterpriseDataGrid";
import type {
  AwardRecord,
  CareerRecord,
  CertificateRecord,
  DetailTab,
  EducationRecord,
  TrainingRecord,
} from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

export type HistoryRowModesModel = Record<DetailTab, GridRowModesModel>;
export type NewHistoryRowEditCancelHandler = NonNullable<EnterpriseDataGridProps<GridValidRowModel>["onNewRowEditCancel"]>;

export type BaseHistoryTabProps = {
  canCreate: boolean;
  canUpdate: boolean;
  createDisabled: boolean;
  handleRowEditEnterKeyDown: (tab: DetailTab) => (event: KeyboardEvent<HTMLDivElement>) => void;
  handleRowEditStop: DataGridProps<CareerRecord>["onRowEditStop"];
  onNewRowEditCancel: NewHistoryRowEditCancelHandler;
  onAttachmentUpload: (tab: DetailTab, recordId: string, files: File[]) => void;
  onRowModesModelChange: (tab: DetailTab, model: GridRowModesModel) => void;
  onStartRowEdit: (tab: DetailTab, id: GridRowId, fieldToFocus: string) => void;
  readOnly?: boolean;
  rowModesModel: HistoryRowModesModel;
};

export type CareerHistoryTabProps = BaseHistoryTabProps & {
  careerGridApiRef: RefObject<GridApi | null>;
  careerGridColumns: GridColDef<CareerRecord>[];
  handleCareerProcessRowUpdate: DataGridProps<CareerRecord>["processRowUpdate"];
  onOpenCareerCreate: () => void;
  rows: CareerRecord[];
  selectedCareerRow: CareerRecord | null;
  setSelectedCareerRowId: (id: string) => void;
};

export type CertificateHistoryTabProps = BaseHistoryTabProps & {
  certificateGridApiRef: RefObject<GridApi | null>;
  certificateGridColumns: GridColDef<CertificateRecord>[];
  handleCertificateProcessRowUpdate: DataGridProps<CertificateRecord>["processRowUpdate"];
  onOpenCertificateCreate: () => void;
  rows: CertificateRecord[];
  selectedCertificateLabel?: string;
  selectedCertificateRow: CertificateRecord | null;
  setSelectedCertificateRowId: (id: string) => void;
};

export type EducationHistoryTabProps = BaseHistoryTabProps & {
  educationGridApiRef: RefObject<GridApi | null>;
  educationGridColumns: GridColDef<EducationRecord>[];
  handleEducationProcessRowUpdate: DataGridProps<EducationRecord>["processRowUpdate"];
  onOpenEducationCreate: () => void;
  rows: EducationRecord[];
  selectedEducationRow: EducationRecord | null;
  setSelectedEducationRowId: (id: string) => void;
};

export type AwardHistoryTabProps = BaseHistoryTabProps & {
  awardGridApiRef: RefObject<GridApi | null>;
  awardGridColumns: GridColDef<AwardRecord>[];
  handleAwardProcessRowUpdate: DataGridProps<AwardRecord>["processRowUpdate"];
  onOpenAwardCreate: () => void;
  rows: AwardRecord[];
  selectedAwardRow: AwardRecord | null;
  setSelectedAwardRowId: (id: string) => void;
};

export type TrainingHistoryTabProps = BaseHistoryTabProps & {
  handleTrainingProcessRowUpdate: DataGridProps<TrainingRecord>["processRowUpdate"];
  onOpenTrainingCreate: () => void;
  rows: TrainingRecord[];
  selectedTrainingRow: TrainingRecord | null;
  setSelectedTrainingRowId: (id: string) => void;
  trainingGridApiRef: RefObject<GridApi | null>;
  trainingGridColumns: GridColDef<TrainingRecord>[];
};
