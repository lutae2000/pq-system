"use client";

import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import type { DataGridProps, GridColDef } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listCertifications } from "@/modules/code/certifications/api";
import { getEngineerProfile } from "@/modules/pq/engineers/api";
import type {
  AwardRecord,
  CareerRecord,
  CertificateRecord,
  DetailTab,
  EducationRecord,
  EngineerProfile,
  SelectedDetailRows,
  TrainingRecord,
} from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { EngineerHistoryTabs } from "@/modules/pq/engineers/history-tabs/EngineerHistoryTabs";
import type { HistoryRowModesModel } from "@/modules/pq/engineers/history-tabs/historyTabTypes";

type EngineerHistoryReadonlyCardProps = {
  canRead?: boolean;
  engineerId: string;
};

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "경력", value: "career" },
  { label: "자격증", value: "certificate" },
  { label: "학력", value: "education" },
  { label: "상훈/제재", value: "award" },
  { label: "교육훈련", value: "training" },
  { label: "실적", value: "performance" },
];

const emptyRows: SelectedDetailRows = {
  awards: [],
  career: [],
  careerDetails: [],
  certificates: [],
  education: [],
  schools: [],
  trainings: [],
};

const emptyRowModesModel: HistoryRowModesModel = {
  award: {},
  career: {},
  certificate: {},
  education: {},
  performance: {},
  training: {},
};

function formatDate(value: unknown) {
  const normalized = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (normalized.length !== 8) {
    return String(value ?? "");
  }
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
}

export function EngineerHistoryReadonlyCard({ canRead = true, engineerId }: EngineerHistoryReadonlyCardProps) {
  const [selectedTab, setSelectedTab] = useState<DetailTab>("career");
  const [selectedCareerRowId, setSelectedCareerRowId] = useState("");
  const [selectedCertificateRowId, setSelectedCertificateRowId] = useState("");
  const [selectedEducationRowId, setSelectedEducationRowId] = useState("");
  const [selectedAwardRowId, setSelectedAwardRowId] = useState("");
  const [selectedTrainingRowId, setSelectedTrainingRowId] = useState("");

  const careerGridApiRef = useGridApiRef();
  const certificateGridApiRef = useGridApiRef();
  const educationGridApiRef = useGridApiRef();
  const awardGridApiRef = useGridApiRef();
  const trainingGridApiRef = useGridApiRef();

  const profileQuery = useQuery({
    queryKey: ["engineer-history-readonly-card", engineerId],
    queryFn: () => getEngineerProfile(engineerId) as Promise<EngineerProfile>,
    enabled: canRead && Boolean(engineerId),
  });

  const certificationsQuery = useQuery({
    queryKey: ["code-certifications"],
    queryFn: listCertifications,
    enabled: canRead && Boolean(engineerId),
  });

  const certificationNameByCode = useMemo(
    () => new Map((certificationsQuery.data ?? []).map((certification) => [certification.certCode, certification.certName])),
    [certificationsQuery.data],
  );

  const profile = profileQuery.data ?? null;
  const rows = useMemo<SelectedDetailRows>(
    () =>
      profile
        ? {
            awards: profile.awards,
            career: profile.career,
            careerDetails: profile.careerDetails,
            certificates: profile.certificates,
            education: profile.education,
            schools: profile.schools,
            trainings: profile.trainings,
          }
        : emptyRows,
    [profile],
  );

  const selectedCareerRow = useMemo(
    () => rows.career.find((row) => row.id === selectedCareerRowId) ?? null,
    [rows.career, selectedCareerRowId],
  );
  const selectedCertificateRow = useMemo(
    () => rows.certificates.find((row) => row.id === selectedCertificateRowId) ?? null,
    [rows.certificates, selectedCertificateRowId],
  );
  const selectedEducationRow = useMemo(
    () => rows.education.find((row) => row.id === selectedEducationRowId) ?? null,
    [rows.education, selectedEducationRowId],
  );
  const selectedAwardRow = useMemo(
    () => rows.awards.find((row) => row.id === selectedAwardRowId) ?? null,
    [rows.awards, selectedAwardRowId],
  );
  const selectedTrainingRow = useMemo(
    () => rows.trainings.find((row) => row.id === selectedTrainingRowId) ?? null,
    [rows.trainings, selectedTrainingRowId],
  );

  const careerGridColumns = useMemo<GridColDef<CareerRecord>[]>(
    () => [
      { field: "startDate", headerName: "입사일", width: 105, valueFormatter: (value) => formatDate(value) },
      { field: "endDate", headerName: "퇴사일", width: 105, valueFormatter: (value) => formatDate(value) },
      { field: "company", headerName: "회사명", minWidth: 180, flex: 1 },
      { field: "department", headerName: "부서", width: 110 },
      { field: "position", headerName: "직위", width: 90 },
      { field: "jobDuty", headerName: "담당업무", width: 120 },
    ],
    [],
  );

  const certificateGridColumns = useMemo<GridColDef<CertificateRecord>[]>(
    () => [
      {
        field: "certificateName",
        headerName: "자격증",
        minWidth: 180,
        flex: 1,
        valueFormatter: (value) => certificationNameByCode.get(String(value ?? "")) ?? String(value ?? ""),
      },
      { field: "licenseNo", headerName: "자격번호", width: 140 },
      { field: "issueDate", headerName: "발급일", width: 105, valueFormatter: (value) => formatDate(value) },
    ],
    [certificationNameByCode],
  );

  const educationGridColumns = useMemo<GridColDef<EducationRecord>[]>(
    () => [
      { field: "schoolName", headerName: "학교명", minWidth: 180, flex: 1 },
      { field: "major", headerName: "전공", width: 140 },
      { field: "degree", headerName: "학위", width: 90 },
      { field: "endDate", headerName: "졸업일", width: 105, valueFormatter: (value) => formatDate(value) },
    ],
    [],
  );

  const awardGridColumns = useMemo<GridColDef<AwardRecord>[]>(
    () => [
      { field: "issueDate", headerName: "일자", width: 105, valueFormatter: (value) => formatDate(value) },
      { field: "category", headerName: "구분", width: 90 },
      { field: "kind", headerName: "종류", width: 120 },
      { field: "agency", headerName: "기관", width: 140 },
      { field: "businessName", headerName: "업무명", minWidth: 180, flex: 1 },
      { field: "remark", headerName: "비고", minWidth: 140, flex: 0.6 },
    ],
    [],
  );

  const trainingGridColumns = useMemo<GridColDef<TrainingRecord>[]>(
    () => [
      { field: "startDate", headerName: "시작일", width: 105, valueFormatter: (value) => formatDate(value) },
      { field: "endDate", headerName: "종료일", width: 105, valueFormatter: (value) => formatDate(value) },
      { field: "trainingName", headerName: "교육명", minWidth: 180, flex: 1 },
      { field: "institution", headerName: "기관", width: 140 },
    ],
    [],
  );

  const noopProcessRowUpdate = <Row,>(row: Row) => row;
  const noopRowEditStop: DataGridProps<CareerRecord>["onRowEditStop"] = () => undefined;
  const noopKeyDown = () => () => undefined;

  if (!canRead) {
    return <Alert severity="warning">인사이력을 조회할 권한이 없습니다.</Alert>;
  }

  if (!engineerId) {
    return <Alert severity="info">후보 또는 선정 기술인를 선택하면 인사이력을 확인할 수 있습니다.</Alert>;
  }

  if (profileQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileQuery.isError) {
    return <Alert severity="error">기술인 인사이력을 불러오지 못했습니다.</Alert>;
  }

  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      <Box>
        <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
          {profile?.summary.name ?? "인사이력"}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {profile ? `${profile.summary.department || "-"} · ${profile.summary.position || "-"}` : "기술인 인사이력"}
        </Typography>
      </Box>
      <EngineerHistoryTabs
        awardGridApiRef={awardGridApiRef}
        awardGridColumns={awardGridColumns}
        canCreate={false}
        canRead={canRead}
        canUpdate={false}
        careerGridApiRef={careerGridApiRef}
        careerGridColumns={careerGridColumns}
        certificateGridApiRef={certificateGridApiRef}
        certificateGridColumns={certificateGridColumns}
        detailTabs={detailTabs}
        educationGridApiRef={educationGridApiRef}
        educationGridColumns={educationGridColumns}
        handleAwardProcessRowUpdate={noopProcessRowUpdate}
        handleCareerProcessRowUpdate={noopProcessRowUpdate}
        handleCertificateProcessRowUpdate={noopProcessRowUpdate}
        handleEducationProcessRowUpdate={noopProcessRowUpdate}
        handleRowEditEnterKeyDown={noopKeyDown}
        handleRowEditStop={noopRowEditStop}
        onNewRowEditCancel={() => undefined}
        handleTrainingProcessRowUpdate={noopProcessRowUpdate}
        onAttachmentUpload={() => undefined}
        onOpenAwardCreate={() => undefined}
        onOpenCareerCreate={() => undefined}
        onOpenCertificateCreate={() => undefined}
        onOpenEducationCreate={() => undefined}
        onOpenTrainingCreate={() => undefined}
        onRowModesModelChange={() => undefined}
        onSelectedTabChange={setSelectedTab}
        onStartRowEdit={() => undefined}
        readOnly
        rowModesModel={emptyRowModesModel}
        rows={rows}
        selectedAwardRow={selectedAwardRow}
        selectedCareerRow={selectedCareerRow}
        selectedCertificateLabel={
          certificationNameByCode.get(selectedCertificateRow?.certificateName ?? "") ??
          selectedCertificateRow?.certificateName ??
          ""
        }
        selectedCertificateRow={selectedCertificateRow}
        selectedEducationRow={selectedEducationRow}
        selectedEngineer={profile ?? null}
        selectedEngineerId={engineerId}
        selectedEngineerIsNew={false}
        selectedPerformanceRefs={rows.careerDetails}
        selectedTab={selectedTab}
        selectedTrainingRow={selectedTrainingRow}
        setSelectedAwardRowId={setSelectedAwardRowId}
        setSelectedCareerRowId={setSelectedCareerRowId}
        setSelectedCertificateRowId={setSelectedCertificateRowId}
        setSelectedEducationRowId={setSelectedEducationRowId}
        setSelectedTrainingRowId={setSelectedTrainingRowId}
        trainingGridApiRef={trainingGridApiRef}
        trainingGridColumns={trainingGridColumns}
      />
    </Box>
  );
}
