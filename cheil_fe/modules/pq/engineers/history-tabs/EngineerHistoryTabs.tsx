"use client";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { Box, Button, Card, CardContent, Tab, Tabs, Typography } from "@mui/material";
import {
  type DataGridProps,
  type GridApi,
  type GridColDef,
  type GridRowId,
  type GridRowModesModel,
  GridRowModes,
} from "@mui/x-data-grid";
import { useState, type KeyboardEvent, type RefObject } from "react";

import type {
  AwardRecord,
  CareerRecord,
  CareerDetailRecord,
  CertificateRecord,
  DetailTab,
  EducationRecord,
  EngineerProfile,
  SelectedDetailRows,
  TrainingRecord,
} from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { EngineerHistorySummaryDialog } from "@/modules/pq/engineers/history-tabs/EngineerHistorySummaryDialog";
import { AwardHistoryTab } from "@/modules/pq/engineers/history-tabs/AwardHistoryTab";
import { CareerHistoryTab } from "@/modules/pq/engineers/history-tabs/CareerHistoryTab";
import { CertificateHistoryTab } from "@/modules/pq/engineers/history-tabs/CertificateHistoryTab";
import { EducationHistoryTab } from "@/modules/pq/engineers/history-tabs/EducationHistoryTab";
import { TabPanel } from "@/modules/pq/engineers/history-tabs/historyTabCommon";
import type { NewHistoryRowEditCancelHandler } from "@/modules/pq/engineers/history-tabs/historyTabTypes";
import { PerformanceHistoryTab } from "@/modules/pq/engineers/history-tabs/PerformanceHistoryTab";
import { TrainingHistoryTab } from "@/modules/pq/engineers/history-tabs/TrainingHistoryTab";

type HistoryTabsProps = {
  awardGridApiRef: RefObject<GridApi | null>;
  awardGridColumns: GridColDef<AwardRecord>[];
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  careerGridApiRef: RefObject<GridApi | null>;
  careerGridColumns: GridColDef<CareerRecord>[];
  certificateGridApiRef: RefObject<GridApi | null>;
  certificateGridColumns: GridColDef<CertificateRecord>[];
  certificateLabelByValue?: Record<string, string>;
  detailTabs: Array<{ label: string; value: DetailTab }>;
  educationGridApiRef: RefObject<GridApi | null>;
  educationGridColumns: GridColDef<EducationRecord>[];
  handleAwardProcessRowUpdate: DataGridProps<AwardRecord>["processRowUpdate"];
  handleCareerProcessRowUpdate: DataGridProps<CareerRecord>["processRowUpdate"];
  handleCertificateProcessRowUpdate: DataGridProps<CertificateRecord>["processRowUpdate"];
  handleEducationProcessRowUpdate: DataGridProps<EducationRecord>["processRowUpdate"];
  handleRowEditEnterKeyDown: (tab: DetailTab) => (event: KeyboardEvent<HTMLDivElement>) => void;
  handleRowEditStop: DataGridProps<CareerRecord>["onRowEditStop"];
  onNewRowEditCancel: NewHistoryRowEditCancelHandler;
  handleTrainingProcessRowUpdate: DataGridProps<TrainingRecord>["processRowUpdate"];
  onAttachmentUpload: (tab: DetailTab, recordId: string, files: File[]) => void;
  onOpenAwardCreate: () => void;
  onOpenCareerCreate: () => void;
  onOpenCertificateCreate: () => void;
  onOpenEducationCreate: () => void;
  onOpenTrainingCreate: () => void;
  onSelectedTabChange: (tab: DetailTab) => void;
  onStartRowEdit: (tab: DetailTab, id: GridRowId, fieldToFocus: string) => void;
  rowModesModel: Record<DetailTab, GridRowModesModel>;
  onRowModesModelChange: (tab: DetailTab, model: GridRowModesModel) => void;
  readOnly?: boolean;
  rows: SelectedDetailRows;
  selectedEngineer: EngineerProfile | null;
  selectedAwardRow: AwardRecord | null;
  selectedCareerRow: CareerRecord | null;
  selectedCertificateRow: CertificateRecord | null;
  selectedCertificateLabel?: string;
  selectedEducationRow: EducationRecord | null;
  selectedEngineerId: string;
  selectedEngineerIsNew: boolean;
  selectedPerformanceRefs: CareerDetailRecord[];
  selectedTab: DetailTab;
  selectedTrainingRow: TrainingRecord | null;
  selectedJobFieldLabel?: string;
  selectedQualificationGradeLabel?: string;
  selectedSpecialtyFieldLabel?: string;
  selectedSupervisionQualificationLabel?: string;
  selectedTechnicalFieldLabel?: string;
  selectedWorkFieldLabel?: string;
  setSelectedAwardRowId: (id: string) => void;
  setSelectedCareerRowId: (id: string) => void;
  setSelectedCertificateRowId: (id: string) => void;
  setSelectedEducationRowId: (id: string) => void;
  setSelectedTrainingRowId: (id: string) => void;
  trainingGridApiRef: RefObject<GridApi | null>;
  trainingGridColumns: GridColDef<TrainingRecord>[];
};

export function EngineerHistoryTabs({
  awardGridApiRef,
  awardGridColumns,
  canCreate,
  canRead,
  canUpdate,
  careerGridApiRef,
  careerGridColumns,
  certificateGridApiRef,
  certificateGridColumns,
  certificateLabelByValue,
  detailTabs,
  educationGridApiRef,
  educationGridColumns,
  handleAwardProcessRowUpdate,
  handleCareerProcessRowUpdate,
  handleCertificateProcessRowUpdate,
  handleEducationProcessRowUpdate,
  handleRowEditEnterKeyDown,
  handleRowEditStop,
  onNewRowEditCancel,
  handleTrainingProcessRowUpdate,
  onAttachmentUpload,
  onOpenAwardCreate,
  onOpenCareerCreate,
  onOpenCertificateCreate,
  onOpenEducationCreate,
  onOpenTrainingCreate,
  onSelectedTabChange,
  onStartRowEdit,
  onRowModesModelChange,
  readOnly = false,
  rows,
  selectedEngineer,
  selectedAwardRow,
  selectedCareerRow,
  selectedCertificateLabel,
  selectedCertificateRow,
  selectedEducationRow,
  selectedEngineerId,
  selectedEngineerIsNew,
  selectedPerformanceRefs,
  selectedTab,
  selectedTrainingRow,
  selectedJobFieldLabel,
  selectedQualificationGradeLabel,
  selectedSpecialtyFieldLabel,
  selectedSupervisionQualificationLabel,
  selectedTechnicalFieldLabel,
  selectedWorkFieldLabel,
  setSelectedAwardRowId,
  setSelectedCareerRowId,
  setSelectedCertificateRowId,
  setSelectedEducationRowId,
  setSelectedTrainingRowId,
  trainingGridApiRef,
  trainingGridColumns,
  rowModesModel,
}: HistoryTabsProps) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const hasEditingRow = Object.values(rowModesModel[selectedTab] ?? {}).some(
    (rowMode) => rowMode.mode === GridRowModes.Edit,
  );
  const createDisabled = readOnly || !canCreate || selectedEngineerIsNew || hasEditingRow;
  const baseTabProps = {
    canCreate,
    canUpdate: readOnly ? false : canUpdate,
    createDisabled,
    handleRowEditEnterKeyDown,
    handleRowEditStop,
    onNewRowEditCancel,
    onAttachmentUpload,
    onRowModesModelChange,
    onStartRowEdit,
    readOnly,
    rowModesModel,
  };
  const summaryTabProps = {
    ...baseTabProps,
    canCreate: false,
    canUpdate: false,
    createDisabled: true,
    readOnly: true,
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              인사 이력
            </Typography>
          </Box>
          <Button onClick={() => setSummaryOpen(true)} startIcon={<DescriptionOutlinedIcon />} variant="outlined">
            요약
          </Button>
        </Box>
        <Tabs
          sx={{ mt: 1.5, borderBottom: 1, borderColor: "divider" }}
          value={selectedTab}
          onChange={(_, nextValue) => onSelectedTabChange(nextValue as DetailTab)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {detailTabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>

        <TabPanel panelValue="career" readOnly={readOnly} value={selectedTab}>
          <CareerHistoryTab
            {...baseTabProps}
            careerGridApiRef={careerGridApiRef}
            careerGridColumns={careerGridColumns}
            handleCareerProcessRowUpdate={handleCareerProcessRowUpdate}
            onOpenCareerCreate={onOpenCareerCreate}
            rows={rows.career}
            selectedCareerRow={selectedCareerRow}
            setSelectedCareerRowId={setSelectedCareerRowId}
          />
        </TabPanel>

        <TabPanel panelValue="certificate" readOnly={readOnly} value={selectedTab}>
          <CertificateHistoryTab
            {...baseTabProps}
            certificateGridApiRef={certificateGridApiRef}
            certificateGridColumns={certificateGridColumns}
            handleCertificateProcessRowUpdate={handleCertificateProcessRowUpdate}
            onOpenCertificateCreate={onOpenCertificateCreate}
            rows={rows.certificates}
            selectedCertificateLabel={selectedCertificateLabel}
            selectedCertificateRow={selectedCertificateRow}
            setSelectedCertificateRowId={setSelectedCertificateRowId}
          />
        </TabPanel>

        <TabPanel panelValue="education" readOnly={readOnly} value={selectedTab}>
          <EducationHistoryTab
            {...baseTabProps}
            educationGridApiRef={educationGridApiRef}
            educationGridColumns={educationGridColumns}
            handleEducationProcessRowUpdate={handleEducationProcessRowUpdate}
            onOpenEducationCreate={onOpenEducationCreate}
            rows={rows.education}
            selectedEducationRow={selectedEducationRow}
            setSelectedEducationRowId={setSelectedEducationRowId}
          />
        </TabPanel>

        <TabPanel panelValue="award" readOnly={readOnly} value={selectedTab}>
          <AwardHistoryTab
            {...baseTabProps}
            awardGridApiRef={awardGridApiRef}
            awardGridColumns={awardGridColumns}
            handleAwardProcessRowUpdate={handleAwardProcessRowUpdate}
            onOpenAwardCreate={onOpenAwardCreate}
            rows={rows.awards}
            selectedAwardRow={selectedAwardRow}
            setSelectedAwardRowId={setSelectedAwardRowId}
          />
        </TabPanel>

        <TabPanel panelValue="training" readOnly={readOnly} value={selectedTab}>
          <TrainingHistoryTab
            {...baseTabProps}
            handleTrainingProcessRowUpdate={handleTrainingProcessRowUpdate}
            onOpenTrainingCreate={onOpenTrainingCreate}
            rows={rows.trainings}
            selectedTrainingRow={selectedTrainingRow}
            setSelectedTrainingRowId={setSelectedTrainingRowId}
            trainingGridApiRef={trainingGridApiRef}
            trainingGridColumns={trainingGridColumns}
          />
        </TabPanel>

        <TabPanel panelValue="performance" readOnly={readOnly} value={selectedTab}>
          <PerformanceHistoryTab canRead={canRead} engineerId={selectedEngineerId} performanceRefs={selectedPerformanceRefs} />
        </TabPanel>

        <EngineerHistorySummaryDialog
          awardTabProps={{
            ...summaryTabProps,
            awardGridApiRef,
            awardGridColumns,
            handleAwardProcessRowUpdate,
            onOpenAwardCreate,
            rows: rows.awards,
            selectedAwardRow,
            setSelectedAwardRowId,
          }}
          certificateTabProps={{
            ...summaryTabProps,
            certificateGridApiRef,
            certificateGridColumns,
            handleCertificateProcessRowUpdate,
            onOpenCertificateCreate,
            rows: rows.certificates,
            selectedCertificateLabel,
            selectedCertificateRow,
            setSelectedCertificateRowId,
          }}
          certificateLabelByValue={certificateLabelByValue}
          careerTabProps={{
            ...summaryTabProps,
            careerGridApiRef,
            careerGridColumns,
            handleCareerProcessRowUpdate,
            onOpenCareerCreate,
            rows: rows.career,
            selectedCareerRow,
            setSelectedCareerRowId,
          }}
          educationTabProps={{
            ...summaryTabProps,
            educationGridApiRef,
            educationGridColumns,
            handleEducationProcessRowUpdate,
            onOpenEducationCreate,
            rows: rows.education,
            selectedEducationRow,
            setSelectedEducationRowId,
          }}
          engineer={selectedEngineer}
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          selectedJobFieldLabel={selectedJobFieldLabel}
          selectedQualificationGradeLabel={selectedQualificationGradeLabel}
          selectedSpecialtyFieldLabel={selectedSpecialtyFieldLabel}
          selectedSupervisionQualificationLabel={selectedSupervisionQualificationLabel}
          selectedTechnicalFieldLabel={selectedTechnicalFieldLabel}
          selectedWorkFieldLabel={selectedWorkFieldLabel}
          trainingTabProps={{
            ...summaryTabProps,
            handleTrainingProcessRowUpdate,
            onOpenTrainingCreate,
            rows: rows.trainings,
            selectedTrainingRow,
            setSelectedTrainingRowId,
            trainingGridApiRef,
            trainingGridColumns,
          }}
        />
      </CardContent>
    </Card>
  );
}
