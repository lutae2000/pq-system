"use client";

import {
  Box,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  GridActionsCellItem,
  GridRenderEditCellParams,
  GridRenderCellParams,
  GridRowModes,
  type GridColDef,
  type GridRowEditStopReasons,
  type GridRowId,
  type GridRowModesModel,
  type GridRowParams,
  useGridApiRef,
} from "@mui/x-data-grid";
import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useEnterpriseRowActionConfirm } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { standardFieldSx } from "@/components/common/FormControls";
import { ResizableCard } from "@/components/common/ResizableCard";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { createCompanyPerformances, type CompanyPerformanceUpsertRequest } from "@/modules/pq/company-performance/api";
import { EngineerHistoryTabs } from "@/modules/pq/engineers/history-tabs/EngineerHistoryTabs";
import { listCertifications } from "@/modules/code/certifications/api";
import { formatReferenceLabel, toSelectOptions } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import {
  getEngineerProfile,
  listEngineerProfiles,
  deleteEngineerCareer,
  deleteEngineerEducation,
  deleteEngineerLicense,
  deleteEngineerPrize,
  deleteEngineerSchool,
  saveEngineerCareers,
  saveEngineerCareerDetails,
  saveEngineerEducations,
  saveEngineerLicenses,
  saveEngineerMaster,
  saveEngineerPrizes,
  saveEngineerSchools,
} from "@/modules/pq/engineers/api";
import type {
  AssessmentMethod,
  AttachmentItem,
  AwardRecord,
  CareerRecord,
  CertificateRecord,
  DetailTab,
  EducationRecord,
  EngineerDetail,
  EngineerProfile,
  EngineerStatus,
  EngineerSummary,
  SelectedDetailRows,
  TrainingRecord,
} from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { NewHistoryRowEditCancelHandler } from "@/modules/pq/engineers/history-tabs/historyTabTypes";
import { EngineerPdfExtractionReviewDialog, type EngineerPdfExtraction, type EngineerPdfExtractionRow, PDF_RECORD_ID_FIELD } from "@/modules/pq/engineers/pdf-extraction";

type EngineerFilterState = {
  assessmentDate: string;
  assessmentMethod: "전체" | AssessmentMethod;
  certificationCode: string;
  designGrade: string;
  jobField: string;
  keyword: string;
  specialtyField: string;
  supervisionGrade: string;
  status: "전체" | EngineerStatus;
};

type CertificationOption = {
  certCode: string;
  certName: string;
};

type CodeOption = {
  label: string;
  value: string;
};

function toRetireYn(status: EngineerFilterState["status"]) {
  if (status === "퇴직") {
    return "Y" as const;
  }
  if (status === "재직" || status === "휴직") {
    return "N" as const;
  }
  return undefined;
}

const fieldSx = standardFieldSx;

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "\uACBD\uB825", value: "career" },
  { label: "\uC790\uACA9\uC99D", value: "certificate" },
  { label: "\uD559\uB825", value: "education" },
  { label: "상훈/제재", value: "award" },
  { label: "\uAD50\uC721\uD6C8\uB828", value: "training" },
  { label: "실적", value: "performance" },
];

function normalizeDate8(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 8);
}

function formatDate8(value: unknown) {
  const normalized = normalizeDate8(value ?? "");
  if (normalized.length !== 8) {
    return String(value ?? "");
  }

  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
}

function calculateAge(birthDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return null;
  }

  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function formatEngineerAge(birthDate: string, fallbackAge: number) {
  const calculatedAge = calculateAge(birthDate);
  if (calculatedAge != null) {
    return `${calculatedAge}세`;
  }

  return fallbackAge > 0 ? `${fallbackAge}세` : "";
}

function createSummaryColumns(
  jobFieldLabelByCode: Record<string, string>,
  specialtyFieldLabelByCode: Record<string, string>,
): GridColDef<EngineerSummary>[] {
  return [
    { field: "name", headerName: "성명", width: 110 },
    { field: "department", headerName: "부서", width: 120 },
    { field: "position", headerName: "직위", width: 80 },
    {
      field: "workField",
      headerName: "직무분야",
      width: 110,
      renderCell: (params) => {
        const code = String(params.value ?? "").trim();
        const label = jobFieldLabelByCode[code];
        return label ?? (code || "-");
      },
    },
    {
      field: "specialtyField",
      headerName: "전문분야",
      width: 110,
      renderCell: (params) => {
        const code = String(params.value ?? "").trim();
        const label = specialtyFieldLabelByCode[code];
        return label ?? (code || "-");
      },
    },
    {
      field: "status",
      headerName: "재직상태",
      width: 100,
      renderCell: (params) => {
        const isActive = params.value === "재직";
        const color = isActive ? "success" : params.value === "휴직" ? "default" : "warning";
        return <Chip color={color} label={params.value} size="small" variant={isActive ? "filled" : "outlined"} />;
      },
    },
  ];
}

const careerColumns: GridColDef<CareerRecord>[] = [
  { field: "startDate", headerName: "입사일", width: 105, renderCell: (params) => formatDate8(params.value), renderEditCell: renderDate8EditCell },
  { field: "endDate", headerName: "퇴사일", width: 105, renderCell: (params) => formatDate8(params.value), renderEditCell: renderDate8EditCell },
  { field: "company", headerName: "회사명", flex: 1.2, minWidth: 220 },
  { field: "department", headerName: "부서", width: 120 },
  { field: "position", headerName: "직위", width: 100 },
  { field: "jobDuty", headerName: "담당업무", width: 120 },
  { field: "year", headerName: "년", width: 70, align: "right", headerAlign: "right" },
  { field: "month", headerName: "월", width: 70, align: "right", headerAlign: "right" },
  { field: "days", headerName: "일", width: 70, align: "right", headerAlign: "right" },
];

const awardCategoryOptions = [
  { label: "상훈", value: "1" },
  { label: "제재", value: "2" },
];

const relatedMajorOptions = [
  { label: "Y", value: "Y" },
  { label: "N", value: "N" },
];

const DEFAULT_SUMMARY_PANEL_WIDTH = 420;
const DEFAULT_SUMMARY_PANEL_HEIGHT = 1150;
const SUMMARY_PANEL_MIN_WIDTH = 320;
const SUMMARY_PANEL_MAX_WIDTH = 620;
const SUMMARY_PANEL_MIN_HEIGHT = 820;
const SUMMARY_PANEL_RIGHT_MIN_WIDTH = 720;

function formatAwardCategory(value: unknown) {
  return awardCategoryOptions.find((option) => option.value === String(value ?? ""))?.label ?? String(value ?? "");
}

function moveToNextEditableCell(params: GridRenderEditCellParams, shiftKey: boolean) {
  const fields = params.api
    .getAllColumns()
    .filter((column) => column.editable && column.field !== "__actions__")
    .map((column) => column.field);
  const currentIndex = fields.indexOf(params.field);
  const nextField = fields[currentIndex + (shiftKey ? -1 : 1)];

  if (nextField) {
    params.api.setCellFocus(params.id, nextField);
    requestAnimationFrame(() => {
      const nextInput = document.querySelector<HTMLInputElement>(
        `[data-id="${CSS.escape(String(params.id))}"] [data-field="${CSS.escape(nextField)}"] input`,
      );
      nextInput?.focus();
      nextInput?.select();
    });
  }
}

function renderDate8EditCell(params: GridRenderEditCellParams) {
  return <Date8EditInput {...params} />;
}

function Date8EditInput(params: GridRenderEditCellParams) {
  const [value, setValue] = useState(() => String(params.value ?? ""));

  return (
    <TextField
      autoFocus={params.hasFocus}
      fullWidth
      placeholder="YYYYMMDD"
      size="small"
      sx={{
        "& .MuiInputBase-input": {
          fontSize: 13,
          px: 1,
          textAlign: "center",
        },
      }}
      value={value}
      onChange={(event) => {
        const nextValue = event.target.value;
        setValue(nextValue);
        void params.api.setEditCellValue({ id: params.id, field: params.field, value: nextValue }, event);
      }}
      onBlur={(event) => {
        const normalizedValue = normalizeDate8((event.target as HTMLInputElement).value);
        setValue(normalizedValue);
        void params.api.setEditCellValue({ id: params.id, field: params.field, value: normalizedValue });
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const normalizedValue = normalizeDate8((event.target as HTMLInputElement).value);
          setValue(normalizedValue);
          void params.api.setEditCellValue({ id: params.id, field: params.field, value: normalizedValue }, event);
          event.preventDefault();
          event.stopPropagation();
          moveToNextEditableCell(params, event.shiftKey);
        }
        if (event.key === "Enter") {
          const normalizedValue = normalizeDate8((event.target as HTMLInputElement).value);
          setValue(normalizedValue);
          void params.api.setEditCellValue({ id: params.id, field: params.field, value: normalizedValue }, event);
        }
      }}
      slotProps={{
        htmlInput: {
          inputMode: "numeric",
          maxLength: 8,
        },
      }}
    />
  );
}

const certificateColumns: GridColDef<CertificateRecord>[] = [
  { field: "issueDate", headerName: "취득일", width: 110, renderCell: (params) => formatDate8(params.value), renderEditCell: renderDate8EditCell },
  { field: "certificateName", headerName: "자격증명", flex: 1.2, minWidth: 220 },
  { field: "licenseNo", headerName: "자격증 번호", width: 160 },
];

const educationColumns: GridColDef<EducationRecord>[] = [
  { field: "endDate", headerName: "졸업일", width: 110, renderCell: (params) => formatDate8(params.value), renderEditCell: renderDate8EditCell },
  { field: "schoolName", headerName: "학교명", flex: 1.1, minWidth: 220 },
  { field: "major", headerName: "전공", width: 160 },
  { field: "degree", headerName: "학위", width: 100 },
  {
    field: "validMajorYn",
    headerName: "관련학과",
    type: "singleSelect",
    width: 120,
    valueOptions: relatedMajorOptions,
  },
];

const awardColumns: GridColDef<AwardRecord>[] = [
  { field: "issueDate", headerName: "수상일", width: 110, renderCell: (params) => formatDate8(params.value), renderEditCell: renderDate8EditCell },
  {
    field: "category",
    headerName: "구분",
    type: "singleSelect",
    width: 90,
    valueOptions: awardCategoryOptions,
    renderCell: (params) => formatAwardCategory(params.value),
  },
  { field: "kind", headerName: "종류", flex: 1.2, minWidth: 240 },
  { field: "agency", headerName: "기관", width: 160 },
  { field: "businessName", headerName: "사업명", flex: 1.2, minWidth: 220 },
  { field: "basis", headerName: "근거", flex: 1.2, minWidth: 220 },
];

const trainingColumns: GridColDef<TrainingRecord>[] = [
  { field: "startDate", headerName: "시작일", width: 110, renderCell: (params) => formatDate8(params.value), renderEditCell: renderDate8EditCell },
  { field: "endDate", headerName: "종료일", width: 110, renderCell: (params) => formatDate8(params.value), renderEditCell: renderDate8EditCell },
  { field: "trainingName", headerName: "교육훈련명", flex: 1.2, minWidth: 240 },
  { field: "institution", headerName: "기관", width: 180 },
];

const initialFilters: EngineerFilterState = {
  status: "전체",
  keyword: "",
  assessmentDate: "",
  assessmentMethod: "전체",
  certificationCode: "",
  jobField: "",
  specialtyField: "",
  designGrade: "",
  supervisionGrade: "",
};

function createEmptyCareerRecord(nextId = ""): CareerRecord {
  return {
    id: nextId,
    company: "",
    days: 0,
    department: "",
    endDate: "",
    jobDuty: "",
    month: 0,
    position: "",
    startDate: "",
    year: 0,
    attachments: [],
  };
}

function createCareerId(existing: CareerRecord[]) {
  const nextNumber =
    existing.reduce((max, record) => {
      const numeric = Number(record.id.replace(/[^0-9]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0) + 1;

  return `C-${String(nextNumber).padStart(3, "0")}`;
}

function createSequentialId(prefix: string, existingIds: string[]) {
  const nextNumber =
    existingIds.reduce((max, id) => {
      const numeric = Number(id.replace(/[^0-9]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0) + 1;

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

function createTemporaryId(id: string) {
  return id.startsWith("tmp-") ? id : `tmp-${id}`;
}

function isTemporaryRecordId(id: unknown) {
  return String(id ?? "").startsWith("tmp-");
}

function createAttachmentItems(files: File[]): AttachmentItem[] {
  return files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${index}`,
    lastModified: file.lastModified,
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file),
  }));
}

function mergeAttachmentLists(current: AttachmentItem[] = [], incoming: AttachmentItem[]) {
  return [...incoming, ...current];
}

const createEmptyCertificateRecord = (nextId = ""): CertificateRecord => ({
  id: nextId,
  issueDate: "",
  certificateName: "",
  licenseNo: "",
  active: true,
  attachments: [],
});

const createEmptyEducationRecord = (nextId = ""): EducationRecord => ({
  id: nextId,
  startDate: "",
  endDate: "",  
  schoolName: "",
  major: "",
  degree: "",
  validMajorYn: "N",
  active: true,
  attachments: [],
});

const createEmptyAwardRecord = (nextId = ""): AwardRecord => ({
  id: nextId,
  issueDate: "",
  category: "",
  basis: "",
  businessName: "",
  kind: "",
  agency: "",
  remark: "",
  active: true,
  attachments: [],
});

const createEmptyTrainingRecord = (nextId = ""): TrainingRecord => ({
  id: nextId,
  startDate: "",
  endDate: "",
  trainingName: "",
  institution: "",
  hours: 0,
  active: true,
  attachments: [],
});

function createNewEngineerId(existingIds: string[]) {
  const nextNumber =
    existingIds.reduce((max, id) => {
      const match = id.match(/^E(\d{7})$/);
      if (!match) {
        return max;
      }

      return Math.max(max, Number(match[1]));
    }, 0) + 1;

  return `E${String(nextNumber).padStart(7, "0")}`;
}

function createEmptyEngineerProfile(nextId: string, filters: EngineerFilterState): EngineerProfile {
  const keyword = filters.keyword.trim();
  const matchedLabel = keyword ? `${keyword} \uC2E0\uADDC \uAE30\uC220\uC790` : "\uC2E0\uADDC \uAE30\uC220\uC790";

  return {
    summary: {
      id: nextId,
      rrn: "",
      name: matchedLabel,
      department: "\uBBF8\uC9C0\uC815",
      position: "\uBBF8\uC9C0\uC815",
      status: filters.status === "전체" ? "재직" : filters.status,
      active: true,
      workField: filters.jobField || "\uBBF8\uC9C0\uC815",
      specialtyField: filters.specialtyField || "\uBBF8\uC9C0\uC815",
      isNew: true,
      assessmentDate: filters.assessmentDate || initialFilters.assessmentDate,
      assessmentMethod: filters.assessmentMethod === "전체" ? "자체평정" : filters.assessmentMethod,
    },
    detail: {
      title: matchedLabel,
      address: "",
      hometown: "",
      age: 0,
      birthDate: "",
      educationException: false,
      educationGrade: "",
      educationLevel: "",
      jobField: filters.jobField,
      participationDays: 0,
      retired: false,
      designScore: "0.00",
      qualificationGrade: filters.designGrade,
      supervisionScore: "0.00",
      supervisionEducation: "",
      supervisionQualification: filters.supervisionGrade,
      certificationCount: "0",
      specialtyField: filters.specialtyField,
      technicalField: filters.designGrade,
    },
    career: [],
    careerDetails: [],
    certificates: [],
    education: [],
    awards: [],
    schools: [],
    trainings: [],
  };
}

function getNextSelectedId<T extends { id: string }>(rows: T[], deletedId: string) {
  const nextRows = rows.filter((row) => row.id !== deletedId);
  return nextRows[0]?.id ?? "";
}

export function EngineerPersonalInfoPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const { showError, showSuccess } = useAppSnackbar();
  const careerGridApiRef = useGridApiRef();
  const certificateGridApiRef = useGridApiRef();
  const educationGridApiRef = useGridApiRef();
  const awardGridApiRef = useGridApiRef();
  const trainingGridApiRef = useGridApiRef();
  const {
    confirmationDialog,
    requestConfirmation,
  } = useEnterpriseRowActionConfirm();
  const gradeReferences = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const degreeReferences = useCommonCodeLevel2Options("ED", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const gradeOptions = useMemo<CodeOption[]>(() => toSelectOptions(gradeReferences.options), [gradeReferences.options]);
  const jobFieldOptions = useMemo<CodeOption[]>(() => toSelectOptions(jobFieldReferences.options), [jobFieldReferences.options]);
  const specialtyFieldOptions = useMemo<CodeOption[]>(() => toSelectOptions(specialtyFieldReferences.options), [specialtyFieldReferences.options]);
  const degreeOptions = useMemo<CodeOption[]>(() => toSelectOptions(degreeReferences.options), [degreeReferences.options]);
  const gradeLabelByCode = gradeReferences.labelByValue;
  const jobFieldLabelByCode = jobFieldReferences.labelByValue;
  const specialtyFieldLabelByCode = specialtyFieldReferences.labelByValue;
  const summaryColumns = useMemo(
    () => createSummaryColumns(jobFieldLabelByCode, specialtyFieldLabelByCode),
    [jobFieldLabelByCode, specialtyFieldLabelByCode],
  );
  const degreeLabelByCode = degreeReferences.labelByValue;
  const degreeNameByCode = useMemo(
    () => new Map(Object.entries(degreeLabelByCode)),
    [degreeLabelByCode],
  );
  const certificationsQuery = useQuery({
    queryKey: ["code-certifications"],
    queryFn: listCertifications,
    enabled: tabQueryEnabled,
  });
  const certificationOptions = useMemo<CertificationOption[]>(
    () =>
      (certificationsQuery.data ?? []).map((certification) => ({
        certCode: certification.certCode,
        certName: certification.certName,
      })),
    [certificationsQuery.data],
  );
  const certificationNameByCode = useMemo(
    () => new Map(certificationOptions.map((option) => [option.certCode, option.certName])),
    [certificationOptions],
  );
  const certificationLabelByCode = useMemo(
    () => Object.fromEntries(certificationOptions.map((option) => [option.certCode, option.certName])),
    [certificationOptions],
  );
  const [profiles, setProfiles] = useState<EngineerProfile[]>([]);
  const [filters, setFilters] = useState<EngineerFilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<EngineerFilterState>(initialFilters);
  const [selectedEngineerId, setSelectedEngineerId] = useState("");
  const [selectedTab, setSelectedTab] = useState<DetailTab>("career");
  const [selectedCareerRowId, setSelectedCareerRowId] = useState("");
  const [selectedCertificateRowId, setSelectedCertificateRowId] = useState("");
  const [selectedEducationRowId, setSelectedEducationRowId] = useState("");
  const [selectedAwardRowId, setSelectedAwardRowId] = useState("");
  const [selectedTrainingRowId, setSelectedTrainingRowId] = useState("");
  const [rowModesModel, setRowModesModel] = useState<Record<DetailTab, GridRowModesModel>>({
    award: {},
    career: {},
    certificate: {},
    education: {},
    performance: {},
    training: {},
  });
  const [summaryPanelWidth, setSummaryPanelWidth] = useState(DEFAULT_SUMMARY_PANEL_WIDTH);
  const summaryPanelHeight = DEFAULT_SUMMARY_PANEL_HEIGHT;
  const historyCardRef = useRef<HTMLDivElement | null>(null);
  const [historyCardHeight, setHistoryCardHeight] = useState(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const historyCard = historyCardRef.current;
    if (!historyCard) {
      return;
    }

    const updateHistoryCardHeight = () => {
      setHistoryCardHeight(Math.ceil(historyCard.getBoundingClientRect().height));
    };

    updateHistoryCardHeight();
    const resizeObserver = new ResizeObserver(updateHistoryCardHeight);
    resizeObserver.observe(historyCard);
    return () => resizeObserver.disconnect();
  }, []);
  const searchSpecialtyFieldOptions = useMemo<CodeOption[]>(
    () => {
      const options = [...specialtyFieldOptions];
      const currentCode = filters.specialtyField;
      if (currentCode && !options.some((option) => option.value === currentCode)) {
        options.unshift({ label: formatReferenceLabel(specialtyFieldLabelByCode, currentCode), value: currentCode });
      }
      return options;
    },
    [filters.specialtyField, specialtyFieldLabelByCode, specialtyFieldOptions],
  );
  const searchJobFieldOptions = useMemo<CodeOption[]>(
    () => {
      const options = [...jobFieldOptions];
      const currentCode = filters.jobField;
      if (currentCode && !options.some((option) => option.value === currentCode)) {
        options.unshift({ label: formatReferenceLabel(jobFieldLabelByCode, currentCode), value: currentCode });
      }
      return options;
    },
    [filters.jobField, jobFieldLabelByCode, jobFieldOptions],
  );
  const engineerQueryFilters = useMemo(() => {
    return {
      certificationName: appliedFilters.certificationCode || undefined,
      designGrade: appliedFilters.designGrade || undefined,
      jobField: appliedFilters.jobField || undefined,
      keyword: appliedFilters.keyword.trim() || undefined,
      retireYn: toRetireYn(appliedFilters.status),
      specialtyField: appliedFilters.specialtyField || undefined,
      constructionManagementGrade: appliedFilters.supervisionGrade || undefined,
    };
  }, [appliedFilters]);
  const engineersQuery = useQuery({
    queryKey: ["pq-engineers", engineerQueryFilters],
    queryFn: () => listEngineerProfiles(engineerQueryFilters),
    enabled: tabQueryEnabled,
  });
  const designGradeOptions = useMemo<CodeOption[]>(
    () => {
      const options = [...gradeOptions];
      for (const code of [appliedFilters.designGrade]) {
        if (code && !options.some((option) => option.value === code)) {
          options.push({ label: formatReferenceLabel(gradeLabelByCode, code), value: code });
        }
      }
      for (const profile of profiles) {
        const code = profile.detail.technicalField;
        if (code && !options.some((option) => option.value === code)) {
          options.push({ label: formatReferenceLabel(gradeLabelByCode, code), value: code });
        }
      }
      return options;
    },
    [appliedFilters.designGrade, gradeLabelByCode, gradeOptions, profiles],
  );
  const constructionManagementGradeOptions = useMemo<CodeOption[]>(
    () => {
      const options = [...gradeOptions];
      for (const code of [appliedFilters.supervisionGrade]) {
        if (code && !options.some((option) => option.value === code)) {
          options.push({ label: formatReferenceLabel(gradeLabelByCode, code), value: code });
        }
      }
      for (const profile of profiles) {
        const code = profile.detail.supervisionQualification;
        if (code && !options.some((option) => option.value === code)) {
          options.push({ label: formatReferenceLabel(gradeLabelByCode, code), value: code });
        }
      }
      return options;
    },
    [appliedFilters.supervisionGrade, gradeLabelByCode, gradeOptions, profiles],
  );

  useEffect(() => {
    if (!engineersQuery.data) {
      return;
    }

    startTransition(() => {
      setProfiles(engineersQuery.data);
      setSelectedEngineerId((current) => current || (engineersQuery.data?.[0]?.summary.id ?? ""));
    });
  }, [engineersQuery.data]);

  const deferredProfiles = useDeferredValue(profiles);

  const filteredEngineers = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return deferredProfiles.filter((profile) => {
      const matchesStatus =
        appliedFilters.status === "전체" || profile.summary.status === appliedFilters.status;
      const matchesMethod =
        appliedFilters.assessmentMethod === "전체" ||
        profile.summary.assessmentMethod === appliedFilters.assessmentMethod;
      const matchesJobField = !appliedFilters.jobField || profile.detail.jobField === appliedFilters.jobField;
      const matchesSpecialtyField =
        !appliedFilters.specialtyField || profile.detail.specialtyField === appliedFilters.specialtyField;
      const matchesDesignGrade = !appliedFilters.designGrade || profile.detail.technicalField === appliedFilters.designGrade;
      const matchesSupervisionGrade =
        !appliedFilters.supervisionGrade || profile.detail.supervisionQualification === appliedFilters.supervisionGrade;
      const matchesDate =
        !appliedFilters.assessmentDate || profile.summary.assessmentDate === appliedFilters.assessmentDate;
      const matchesKeyword =
        !keyword ||
        [profile.summary.id, profile.summary.name, profile.summary.department, profile.detail.title].some(
          (value) => value.toLowerCase().includes(keyword),
        );

      return (
        matchesStatus &&
        matchesMethod &&
        matchesJobField &&
        matchesSpecialtyField &&
        matchesDesignGrade &&
        matchesSupervisionGrade &&
        matchesDate &&
        matchesKeyword
      );
    });
  }, [appliedFilters, deferredProfiles]);

  const activeSelectedEngineerId =
    filteredEngineers.some((profile) => profile.summary.id === selectedEngineerId)
      ? selectedEngineerId
      : filteredEngineers[0]?.summary.id ?? "";

  const selectedListEngineer =
    profiles.find((profile) => profile.summary.id === activeSelectedEngineerId) ??
    filteredEngineers.find((profile) => profile.summary.id === activeSelectedEngineerId) ??
    null;
  const selectedEngineerDetailQuery = useQuery({
    enabled: tabQueryEnabled && Boolean(activeSelectedEngineerId) && !selectedListEngineer?.summary.isNew,
    queryKey: ["pq-engineer", activeSelectedEngineerId],
    queryFn: () => getEngineerProfile(activeSelectedEngineerId),
  });

  useEffect(() => {
    const detail = selectedEngineerDetailQuery.data;
    if (!detail) {
      return;
    }

    startTransition(() => {
      setProfiles((current) => current.map((profile) => (profile.summary.id === detail.summary.id ? detail : profile)));
    });
  }, [selectedEngineerDetailQuery.data]);

  const selectedEngineer = selectedListEngineer;

  const handleCancelNewEngineer = useCallback(() => {
    if (!selectedEngineer?.summary.isNew) {
      return;
    }

    const nextEngineer = profiles.find((profile) => !profile.summary.isNew && profile.summary.id !== selectedEngineer.summary.id) ?? null;
    setProfiles((current) => current.filter((profile) => profile.summary.id !== selectedEngineer.summary.id));
    setSelectedEngineerId(nextEngineer?.summary.id ?? "");
    setSelectedTab("career");
    setSelectedCareerRowId("");
    setSelectedCertificateRowId("");
    setSelectedEducationRowId("");
    setSelectedAwardRowId("");
    setSelectedTrainingRowId("");
    setRowModesModel({
      award: {},
      career: {},
      certificate: {},
      education: {},
      performance: {},
      training: {},
    });
  }, [profiles, selectedEngineer]);

  useEffect(() => {
    if (!selectedEngineer?.summary.isNew) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('[role="dialog"], .MuiDataGrid-root')) {
        return;
      }

      event.preventDefault();
      handleCancelNewEngineer();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleCancelNewEngineer, selectedEngineer]);

  const replaceProfile = (saved: EngineerProfile, tab?: DetailTab) => {
    setProfiles((current) => current.map((profile) => (profile.summary.id === saved.summary.id ? saved : profile)));

    if (tab) {
      setRowModesModel((current) => ({ ...current, [tab]: {} }));
    }
  };

  const resolveSavedRowId = <T extends { id: string }>(rows: T[], preferredId: string) =>
    rows.find((record) => record.id === preferredId)?.id ?? rows[0]?.id ?? "";

  const selectedTechnicalField = selectedEngineer?.detail.technicalField ?? "";
  const selectedSupervisionQualification = selectedEngineer?.detail.supervisionQualification ?? "";
  const selectedSpecialtyField = selectedEngineer?.detail.specialtyField ?? "";
  const selectedJobField = selectedEngineer?.detail.jobField ?? "";
  const selectedWorkFieldLabel = formatReferenceLabel(jobFieldLabelByCode, selectedEngineer?.summary.workField ?? "");
  const selectedJobFieldLabel = formatReferenceLabel(jobFieldLabelByCode, selectedJobField);
  const selectedSpecialtyFieldLabel = formatReferenceLabel(specialtyFieldLabelByCode, selectedSpecialtyField);
  const selectedTechnicalFieldLabel = formatReferenceLabel(gradeLabelByCode, selectedTechnicalField);
  const selectedQualificationGradeLabel = formatReferenceLabel(gradeLabelByCode, selectedEngineer?.detail.qualificationGrade ?? "");
  const selectedSupervisionQualificationLabel = formatReferenceLabel(gradeLabelByCode, selectedSupervisionQualification);
  const jobFieldSelectOptions = [...jobFieldOptions];
  if (selectedJobField && !jobFieldSelectOptions.some((option) => option.value === selectedJobField)) {
    jobFieldSelectOptions.unshift({
      label: formatReferenceLabel(jobFieldLabelByCode, selectedJobField),
      value: selectedJobField,
    });
  }
  const specialtyFieldSelectOptions = [...specialtyFieldOptions];
  if (selectedSpecialtyField && !specialtyFieldSelectOptions.some((option) => option.value === selectedSpecialtyField)) {
    specialtyFieldSelectOptions.unshift({
      label: formatReferenceLabel(specialtyFieldLabelByCode, selectedSpecialtyField),
      value: selectedSpecialtyField,
    });
  }

  const selectedEngineerAge = selectedEngineer
    ? formatEngineerAge(selectedEngineer.detail.birthDate, selectedEngineer.detail.age)
    : "";

  const selectedDetailRows = useMemo<SelectedDetailRows>(() => {
    if (!selectedEngineer) {
      return {
        awards: [],
        certificates: [],
        career: [],
        careerDetails: [],
        education: [],
        schools: [],
        trainings: [],
      };
    }

    return {
      awards: selectedEngineer.awards,
      certificates: selectedEngineer.certificates,
      career: selectedEngineer.career,
      careerDetails: selectedEngineer.careerDetails,
      education: selectedEngineer.education,
      schools: selectedEngineer.schools,
      trainings: selectedEngineer.trainings,
    };
  }, [selectedEngineer]);

  const handleSearch = (keyword: string) => {
    const nextFilters = { ...filters, keyword };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedTab("career");
    setSelectedEngineerId(profiles[0]?.summary.id ?? "");
    setSelectedCareerRowId("");
    setSelectedCertificateRowId("");
    setSelectedEducationRowId("");
    setSelectedAwardRowId("");
    setSelectedTrainingRowId("");
  };

  const handleNew = () => {
    if (selectedEngineer?.summary.isNew) {
      return;
    }

    const nextId = createNewEngineerId(profiles.map((profile) => profile.summary.id));
    const nextProfile = createEmptyEngineerProfile(nextId, filters);

    setProfiles((current) => [nextProfile, ...current]);
    setSelectedEngineerId(nextId);
    setSelectedTab("career");
    setSelectedCareerRowId("");
    setSelectedCertificateRowId("");
    setSelectedEducationRowId("");
    setSelectedAwardRowId("");
    setSelectedTrainingRowId("");
  };

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.type !== "application/pdf") {
      showError("PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    setPdfFile(file);
    setPdfDialogOpen(true);
  };

  const createProfileFromPdfExtraction = (extraction: EngineerPdfExtraction) => {
    const nextId = createNewEngineerId(profiles.map((profile) => profile.summary.id));
    const nextProfile = createEmptyEngineerProfile(nextId, filters);
    const birthDate = formatDate8(extraction.basic.birthDate);
    nextProfile.summary.name = extraction.basic.name || nextProfile.summary.name;
    nextProfile.summary.department = extraction.basic.department || "";
    nextProfile.summary.position = extraction.basic.position || "";
    nextProfile.summary.workField = extraction.basic.workField || nextProfile.summary.workField;
    nextProfile.detail.birthDate = birthDate;
    nextProfile.detail.age = calculateAge(birthDate) ?? 0;
    nextProfile.detail.jobField = extraction.basic.workField || nextProfile.detail.jobField;
    nextProfile.detail.specialtyField = extraction.basic.specialtyField || nextProfile.detail.specialtyField;
    nextProfile.detail.technicalField = extraction.basic.designGrade || nextProfile.detail.technicalField;
    nextProfile.detail.supervisionQualification = extraction.basic.constructionManagementGrade || nextProfile.detail.supervisionQualification;
    nextProfile.detail.title = nextProfile.summary.name;
    const sectionRows = (key: string) => extraction.sections[key] ?? [];
    nextProfile.certificates = sectionRows("licenses").map((row, index) => {
      const values = row.values;
      return {
        ...createEmptyCertificateRecord(values[PDF_RECORD_ID_FIELD] || `tmp-pdf-license-${index + 1}`),
        certificateName: values.license_code ?? "",
        issueDate: formatDate8(values.date_of_issue),
        licenseNo: values.license_no ?? "",
      };
    });
    nextProfile.education = sectionRows("education").map((row, index) => {
      const values = row.values;
      return {
        ...createEmptyEducationRecord(values[PDF_RECORD_ID_FIELD] || `tmp-pdf-education-${index + 1}`),
        endDate: formatDate8(values.graduation_date),
        schoolName: values.schname ?? "",
        major: values.major ?? "",
        degree: values.career ?? "",
        validMajorYn: values.valid_major_yn ?? "N",
      };
    });
    nextProfile.trainings = sectionRows("training").map((row, index) => {
      const values = row.values;
      return {
        ...createEmptyTrainingRecord(values[PDF_RECORD_ID_FIELD] || `tmp-pdf-training-${index + 1}`),
        startDate: formatDate8(values.startdt),
        endDate: formatDate8(values.enddt),
        trainingName: values.eduname ?? "",
        institution: values.organname ?? "",
      };
    });
    nextProfile.awards = sectionRows("awards").map((row, index) => {
      const values = row.values;
      return {
        ...createEmptyAwardRecord(values[PDF_RECORD_ID_FIELD] || `tmp-pdf-award-${index + 1}`),
        issueDate: formatDate8(values.dt),
        category: values.prizetag ?? "",
        kind: values.kind ?? "",
        agency: values.organname ?? "",
        businessName: values.jobname ?? "",
        basis: values.spec ?? "",
        remark: values.remark ?? "",
      };
    });
    nextProfile.career = sectionRows("career").map((row, index) => {
      const values = row.values;
      return {
        ...createEmptyCareerRecord(values[PDF_RECORD_ID_FIELD] || `tmp-pdf-career-${index + 1}`),
        startDate: formatDate8(values.entrydt),
        endDate: formatDate8(values.retiredt),
        company: values.compname ?? "",
        department: values.deptname ?? "",
        position: values.grade ?? "",
        jobDuty: values.duty ?? "",
      };
    });
    nextProfile.careerDetails = sectionRows("projectHistories").map((row, index) => {
      const values = row.values;
      return {
        active: true,
        attachments: [],
        compName: values.compname ?? "",
        deptName: values.deptname ?? "",
        duty: values.duty ?? "",
        engLevel: Number(values.englevel) || 0,
        endDate: formatDate8(values.enddt),
        grade: values.grade ?? "",
        id: values[PDF_RECORD_ID_FIELD] || `tmp-pdf-project-history-${index + 1}`,
        jobClass: values.jobclass ?? "",
        jobName: values.jobname ?? "",
        jobPart: values.jobpart ?? "",
        jobTag: values.jobtag ?? "",
        joinDay: 0,
        joinYn: values.joinyn ?? "Y",
        method: "",
        partDay: 0,
        proPart: values.propart ?? "",
        recordId: /^\d+$/.test(values[PDF_RECORD_ID_FIELD] ?? "") ? Number(values[PDF_RECORD_ID_FIELD]) : null,
        remark: values.remark ?? "",
        returnYn: values.returnyn?.trim() || "Y",
        selectDay: 0,
        seq: Number(values.seq) || index + 1,
        startDate: formatDate8(values.startdt),
      };
    });
    return nextProfile;
  };

  const handleRegisterPdfPersonnel = async (extraction: EngineerPdfExtraction, allowDuplicate: boolean) => {
    const profile = createProfileFromPdfExtraction(extraction);
    const personnelProfile = { ...profile, careerDetails: [] };
    let saved = await saveEngineerMaster(personnelProfile.summary.id, personnelProfile, { allowDuplicate });
    const engineerId = saved.summary.id;
    if (profile.certificates.length > 0) saved = await saveEngineerLicenses(engineerId, profile.certificates);
    if (profile.education.length > 0) saved = await saveEngineerSchools(engineerId, profile.education);
    if (profile.career.length > 0) saved = await saveEngineerCareers(engineerId, profile.career);
    if (profile.trainings.length > 0) saved = await saveEngineerEducations(engineerId, profile.trainings);
    if (profile.awards.length > 0) saved = await saveEngineerPrizes(engineerId, profile.awards);
    setProfiles((current) => [saved, ...current.filter((item) => item.summary.id !== engineerId)]);
    setSelectedEngineerId(engineerId);
    setSelectedTab("career");
    showSuccess("기술인 인사정보를 등록했습니다.");
    return engineerId;
  };

  const handleUpdatePdfPersonnelBasic = async (engineerId: string, extraction: EngineerPdfExtraction) => {
    const current = await getEngineerProfile(engineerId);
    const parsed = createProfileFromPdfExtraction(extraction);
    const nextProfile: EngineerProfile = {
      ...current,
      summary: {
        ...current.summary,
        name: parsed.summary.name,
        department: parsed.summary.department,
        position: parsed.summary.position,
        workField: parsed.summary.workField,
      },
      detail: {
        ...current.detail,
        birthDate: parsed.detail.birthDate,
        jobField: parsed.detail.jobField,
        specialtyField: parsed.detail.specialtyField,
        technicalField: parsed.detail.technicalField,
        supervisionQualification: parsed.detail.supervisionQualification,
      },
    };
    const saved = await saveEngineerMaster(engineerId, nextProfile);
    replaceProfile(saved);
    setSelectedEngineerId(engineerId);
    showSuccess("기술인 기본정보를 업데이트했습니다.");
  };

  const handleUpsertPdfPersonnelSection = async (engineerId: string, sectionKey: string, rows: EngineerPdfExtractionRow[]) => {
    const sectionExtraction: EngineerPdfExtraction = {
      basic: { name: "", birthDate: "", department: "", position: "", workField: "", specialtyField: "", designGrade: "", constructionManagementGrade: "" },
      extractedText: "",
      fileName: "",
      sections: { [sectionKey]: rows },
      warnings: [],
    };
    const parsed = createProfileFromPdfExtraction(sectionExtraction);
    let saved: EngineerProfile;
    if (sectionKey === "licenses") saved = await saveEngineerLicenses(engineerId, parsed.certificates);
    else if (sectionKey === "education") saved = await saveEngineerSchools(engineerId, parsed.education);
    else if (sectionKey === "career") saved = await saveEngineerCareers(engineerId, parsed.career);
    else if (sectionKey === "training") saved = await saveEngineerEducations(engineerId, parsed.trainings);
    else if (sectionKey === "awards") saved = await saveEngineerPrizes(engineerId, parsed.awards);
    else throw new Error("저장을 지원하지 않는 PDF 추출 항목입니다.");
    replaceProfile(saved);
    setSelectedEngineerId(engineerId);
    showSuccess(`${sectionKey === "licenses" ? "자격증" : sectionKey === "education" ? "학력" : sectionKey === "career" ? "근무처·경력" : sectionKey === "training" ? "교육훈련" : "상훈"} 정보를 업데이트했습니다.`);
  };

  const handleRegisterPdfProjectHistories = async (engineerId: string, rows: EngineerPdfExtractionRow[]) => {
    const careerDetails = rows.map((row, index) => {
      const values = row.values;
      return {
        active: true,
        attachments: [],
        compName: values.compname ?? "",
        deptName: values.deptname ?? "",
        duty: values.duty ?? "",
        engLevel: Number(values.englevel) || 0,
        endDate: formatDate8(values.enddt),
        grade: values.grade ?? "",
        id: values[PDF_RECORD_ID_FIELD] || `tmp-pdf-project-history-${index + 1}`,
        jobClass: values.jobclass ?? "",
        jobName: values.jobname ?? "",
        jobPart: values.jobpart ?? "",
        jobTag: values.jobtag ?? "",
        joinDay: 0,
        joinYn: values.joinyn ?? "Y",
        method: "",
        partDay: 0,
        proPart: values.propart ?? "",
        recordId: /^\d+$/.test(values[PDF_RECORD_ID_FIELD] ?? "") ? Number(values[PDF_RECORD_ID_FIELD]) : null,
        remark: values.remark ?? "",
        returnYn: values.returnyn?.trim() || "Y",
        selectDay: 0,
        seq: Number(values.seq) || 0,
        startDate: formatDate8(values.startdt),
      };
    });
    const saved = await saveEngineerCareerDetails(engineerId, careerDetails);
    setProfiles((current) => current.map((profile) => profile.summary.id === engineerId ? saved : profile));
    setSelectedEngineerId(engineerId);
    setSelectedTab("performance");
    showSuccess("기술경력을 등록했습니다.");
  };

  const handleRegisterPdfCompanyPerformances = async (rows: EngineerPdfExtractionRow[]) => {
    const newRows = rows.filter((row) => row.values._excluded !== "Y" && !/^\d+$/.test(row.values._existing_seq ?? ""));
    const requests: CompanyPerformanceUpsertRequest[] = newRows.map((row) => {
      const values = row.values;
      const amountInMillions = Number((values.contract_amt_million ?? "").replace(/,/g, ""));
      return {
        businessType: values.business_type?.trim() || null,
        clientKind: null,
        contractAmt: Number.isFinite(amountInMillions) && amountInMillions !== 0 ? Math.round(amountInMillions * 1_000_000) : null,
        contractFromDate: null,
        contractToDate: null,
        createdId: null,
        divisionRate: null,
        generalManagementYn: false,
        jobFinishYn: null,
        jobOwnYn: values.job_own_yn?.trim().toUpperCase() === "Y",
        jobRatio: null,
        jobSeq: null,
        jobType: values.job_type?.trim() || null,
        jobName: values.job_name?.trim() || null,
        lastChangedId: null,
        orderClient: values.order_client?.trim() || null,
        overseeYn: false,
        ownAmt: null,
        remark: values.remark?.trim() || null,
        stopDate: null,
        summary: values.summary?.trim() || null,
      };
    });
    const saved = requests.length > 0 ? await createCompanyPerformances(requests) : [];
    const existingLinks = rows.flatMap((row) => /^\d+$/.test(row.values._existing_seq ?? "")
      ? [{ companyRowNumber: row.rowNumber, jobName: row.values.job_name?.trim() || undefined, seq: Number(row.values._existing_seq) }]
      : []);
    const newLinks = saved.map((record, index) => ({ companyRowNumber: newRows[index].rowNumber, jobName: newRows[index].values.job_name?.trim() || undefined, seq: record.seq }));
    showSuccess(`회사 실적 신규 ${saved.length}건을 등록하고 기존 ${existingLinks.length}건을 연결했습니다.`);
    return [...existingLinks, ...newLinks];
  };

  const handleSaveMaster = async () => {
    if (!selectedEngineer) {
      return;
    }

    try {
      const saved = await saveEngineerMaster(selectedEngineer.summary.id, selectedEngineer);
      replaceProfile(saved);
      setSelectedEngineerId(saved.summary.id);
    } catch (error) {
      showError(error instanceof Error && error.message === "중복된 기술인이 있습니다." ? error.message : "기술인 정보 저장에 실패했습니다.");
    }
  };

  const confirmSaveMaster = () => {
    if (!selectedEngineer) {
      return;
    }

    const isNew = Boolean(selectedEngineer.summary.isNew);
    requestConfirmation({
      confirmColor: "primary",
      confirmLabel: isNew ? "저장" : "업데이트",
      message: isNew ? "새 기술인 정보를 저장하시겠습니까?" : "수정한 기술인 정보를 업데이트하시겠습니까?",
      onConfirm: () => handleSaveMaster(),
      title: isNew ? "저장 확인" : "업데이트 확인",
    });
  };

  const handleRowClick = (params: GridRowParams<EngineerSummary>) => {
    setSelectedEngineerId(params.row.id);
    setSelectedCareerRowId("");
    setSelectedCertificateRowId("");
    setSelectedEducationRowId("");
    setSelectedAwardRowId("");
    setSelectedTrainingRowId("");
  };

  const clampSummaryPanelWidth = useCallback((nextWidth: number) => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : Number.POSITIVE_INFINITY;
    const maxWidthFromViewport =
      Number.isFinite(viewportWidth) && viewportWidth > 0
        ? Math.max(SUMMARY_PANEL_MIN_WIDTH, viewportWidth - SUMMARY_PANEL_RIGHT_MIN_WIDTH)
        : SUMMARY_PANEL_MAX_WIDTH;

    return Math.min(Math.max(Math.round(nextWidth), SUMMARY_PANEL_MIN_WIDTH), Math.min(SUMMARY_PANEL_MAX_WIDTH, maxWidthFromViewport));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSummaryPanelWidth((current) => clampSummaryPanelWidth(current));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [clampSummaryPanelWidth]);

  const selectedCareerRows = selectedEngineer?.career ?? [];
  const selectedCareerRow =
    selectedCareerRows.find((record) => record.id === selectedCareerRowId) ?? selectedCareerRows[0] ?? null;

  const openCareerDialogForCreate = () => {
    if (!selectedEngineer) {
      return;
    }

    const existingTemporaryRow = selectedCareerRows.find((record) => isTemporaryRecordId(record.id));
    const nextId = existingTemporaryRow?.id ?? createTemporaryId(createCareerId(selectedCareerRows));
    const newRow = existingTemporaryRow ?? createEmptyCareerRecord(nextId);

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id && !existingTemporaryRow
          ? { ...profile, career: [newRow, ...profile.career] }
          : profile,
      ),
    );
    setSelectedCareerRowId(nextId);
    setRowModesModel((current) => ({
      ...current,
      career: {
        ...current.career,
        [nextId]: { mode: GridRowModes.Edit, fieldToFocus: "company" },
      },
    }));
  };

  const updateSelectedEngineerRecords = <K extends keyof Pick<
    EngineerProfile,
    "awards" | "certificates" | "career" | "education" | "trainings"
  >>(
    key: K,
    nextRecords: EngineerProfile[K],
  ) => {
    if (!selectedEngineer) {
      return;
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id ? { ...profile, [key]: nextRecords } : profile,
      ),
    );
  };

  const handleCareerProcessRowUpdate = async (updatedRow: CareerRecord) => {
    const nextRow: CareerRecord = {
      ...updatedRow,
      company: updatedRow.company.trim(),
      department: updatedRow.department.trim(),
      endDate: normalizeDate8(updatedRow.endDate),
      jobDuty: updatedRow.jobDuty.trim(),
      position: updatedRow.position.trim(),
      startDate: normalizeDate8(updatedRow.startDate),
      year: Number(updatedRow.year) || 0,
      month: Number(updatedRow.month) || 0,
      days: Number(updatedRow.days) || 0,
    };

    if (!selectedEngineer) {
      return nextRow;
    }

    const nextRecords = selectedEngineer.career.map((record) =>
      record.id === nextRow.id ? { ...record, ...nextRow, attachments: record.attachments ?? nextRow.attachments } : record,
    );
    const saved = await saveEngineerCareers(selectedEngineer.summary.id, nextRecords);
    replaceProfile(saved, "career");
    setSelectedCareerRowId(resolveSavedRowId(saved.career, nextRow.id));
    return nextRow;
  };

  const handleCertificateProcessRowUpdate = async (updatedRow: CertificateRecord) => {
    const nextRow: CertificateRecord = {
      ...updatedRow,
      certificateName: updatedRow.certificateName.trim(),
      issueDate: normalizeDate8(updatedRow.issueDate),
      licenseNo: updatedRow.licenseNo.trim(),
    };

    if (!selectedEngineer) {
      return nextRow;
    }

    const nextRecords = selectedEngineer.certificates.map((record) =>
      record.id === nextRow.id ? { ...record, ...nextRow, attachments: record.attachments ?? nextRow.attachments } : record,
    );
    const saved = await saveEngineerLicenses(selectedEngineer.summary.id, nextRecords);
    replaceProfile(saved, "certificate");
    setSelectedCertificateRowId(resolveSavedRowId(saved.certificates, nextRow.id));
    return nextRow;
  };

  const handleEducationProcessRowUpdate = async (updatedRow: EducationRecord) => {
  const nextRow: EducationRecord = {
    ...updatedRow,
    degree: updatedRow.degree.trim(),
    endDate: normalizeDate8(updatedRow.endDate),
    major: updatedRow.major.trim(),
    schoolName: updatedRow.schoolName.trim(),
    startDate: normalizeDate8(updatedRow.startDate),
    validMajorYn: updatedRow.validMajorYn === "Y" ? "Y" : "N",
  };

    if (!selectedEngineer) {
      return nextRow;
    }

    const nextRecords = selectedEngineer.education.map((record) =>
      record.id === nextRow.id ? { ...record, ...nextRow, attachments: record.attachments ?? nextRow.attachments } : record,
    );
    const saved = await saveEngineerSchools(selectedEngineer.summary.id, nextRecords);
    replaceProfile(saved, "education");
    setSelectedEducationRowId(resolveSavedRowId(saved.education, nextRow.id));
    return nextRow;
  };

  const handleAwardProcessRowUpdate = async (updatedRow: AwardRecord) => {
  const nextRow: AwardRecord = {
    ...updatedRow,
    agency: updatedRow.agency.trim(),
    category: updatedRow.category.trim(),
    issueDate: normalizeDate8(updatedRow.issueDate),
    kind: updatedRow.kind.trim(),
  };

    if (!selectedEngineer) {
      return nextRow;
    }

    const nextRecords = selectedEngineer.awards.map((record) =>
      record.id === nextRow.id ? { ...record, ...nextRow, attachments: record.attachments ?? nextRow.attachments } : record,
    );
    const saved = await saveEngineerPrizes(selectedEngineer.summary.id, nextRecords);
    replaceProfile(saved, "award");
    setSelectedAwardRowId(resolveSavedRowId(saved.awards, nextRow.id));
    return nextRow;
  };

  const handleTrainingProcessRowUpdate = async (updatedRow: TrainingRecord) => {
    const nextRow: TrainingRecord = {
      ...updatedRow,
      endDate: normalizeDate8(updatedRow.endDate),
      institution: updatedRow.institution.trim(),
      startDate: normalizeDate8(updatedRow.startDate),
      trainingName: updatedRow.trainingName.trim(),
      hours: Number(updatedRow.hours) || 0,
    };

    if (!selectedEngineer) {
      return nextRow;
    }

    const nextRecords = selectedEngineer.trainings.map((record) =>
      record.id === nextRow.id ? { ...record, ...nextRow, attachments: record.attachments ?? nextRow.attachments } : record,
    );
    const saved = await saveEngineerEducations(selectedEngineer.summary.id, nextRecords);
    replaceProfile(saved, "training");
    setSelectedTrainingRowId(resolveSavedRowId(saved.trainings, nextRow.id));
    return nextRow;
  };

  const handleRowEditStop = (
    _params: unknown,
    event: { defaultMuiPrevented?: boolean },
    details: { reason?: GridRowEditStopReasons } | undefined,
  ) => {
    if (details?.reason === "rowFocusOut") {
      event.defaultMuiPrevented = true;
    }
  };

  const stopRowEditMode = (tab: DetailTab, rowId: string, ignoreModifications = false) => {
    const apiRef =
      tab === "career"
        ? careerGridApiRef
        : tab === "certificate"
          ? certificateGridApiRef
          : tab === "education"
            ? educationGridApiRef
            : tab === "award"
              ? awardGridApiRef
              : trainingGridApiRef;

    const gridApi = apiRef.current;
    if (!gridApi) {
      return;
    }

    gridApi.stopRowEditMode({ id: rowId, ignoreModifications });
  };

  const confirmRowSave = (tab: DetailTab, rowId: string) => {
    requestConfirmation({
      confirmColor: "primary",
      confirmLabel: "저장",
      message: "수정한 내용을 저장하시겠습니까?",
      onConfirm: () => {
        stopRowEditMode(tab, rowId);
      },
      title: "저장 확인",
    });
  };

  const handleRowEditEnterKeyDown = (tab: DetailTab) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    const editingRowId = Object.entries(rowModesModel[tab]).find(([, rowMode]) => rowMode.mode === GridRowModes.Edit)?.[0];
    if (!editingRowId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    (event.nativeEvent as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();

    confirmRowSave(tab, String(editingRowId));
  };

  const handleCareerDelete = async (recordId = selectedCareerRow?.id) => {
    if (!selectedEngineer || !recordId) {
      return;
    }

    if (isTemporaryRecordId(recordId)) {
      updateSelectedEngineerRecords(
        "career",
        selectedEngineer.career.filter((record) => record.id !== recordId),
      );
      setSelectedCareerRowId(getNextSelectedId(selectedEngineer.career, recordId));
      return;
    }

    const saved = await deleteEngineerCareer(selectedEngineer.summary.id, recordId);
    setProfiles((current) =>
      current.map((profile) => (profile.summary.id === saved.summary.id ? saved : profile)),
    );
    setSelectedCareerRowId(getNextSelectedId(saved.career, recordId));
  };

  const handleCertificateDelete = async (recordId = selectedCertificateRow?.id) => {
    if (!selectedEngineer || !recordId) {
      return;
    }

    if (isTemporaryRecordId(recordId)) {
      updateSelectedEngineerRecords(
        "certificates",
        selectedEngineer.certificates.filter((record) => record.id !== recordId),
      );
      setSelectedCertificateRowId(getNextSelectedId(selectedEngineer.certificates, recordId));
      return;
    }

    const saved = await deleteEngineerLicense(selectedEngineer.summary.id, recordId);
    setProfiles((current) =>
      current.map((profile) => (profile.summary.id === saved.summary.id ? saved : profile)),
    );
    setSelectedCertificateRowId(getNextSelectedId(saved.certificates, recordId));
  };

  const handleEducationDelete = async (recordId = selectedEducationRow?.id) => {
    if (!selectedEngineer || !recordId) {
      return;
    }

    if (isTemporaryRecordId(recordId)) {
      updateSelectedEngineerRecords(
        "education",
        selectedEngineer.education.filter((record) => record.id !== recordId),
      );
      setSelectedEducationRowId(getNextSelectedId(selectedEngineer.education, recordId));
      return;
    }

    const saved = await deleteEngineerSchool(selectedEngineer.summary.id, recordId);
    setProfiles((current) =>
      current.map((profile) => (profile.summary.id === saved.summary.id ? saved : profile)),
    );
    setSelectedEducationRowId(getNextSelectedId(saved.education, recordId));
  };

  const handleAwardDelete = async (recordId = selectedAwardRow?.id) => {
    if (!selectedEngineer || !recordId) {
      return;
    }

    if (isTemporaryRecordId(recordId)) {
      updateSelectedEngineerRecords(
        "awards",
        selectedEngineer.awards.filter((record) => record.id !== recordId),
      );
      setSelectedAwardRowId(getNextSelectedId(selectedEngineer.awards, recordId));
      return;
    }

    const saved = await deleteEngineerPrize(selectedEngineer.summary.id, recordId);
    setProfiles((current) =>
      current.map((profile) => (profile.summary.id === saved.summary.id ? saved : profile)),
    );
    setSelectedAwardRowId(getNextSelectedId(saved.awards, recordId));
  };

  const handleTrainingDelete = async (recordId = selectedTrainingRow?.id) => {
    if (!selectedEngineer || !recordId) {
      return;
    }

    if (isTemporaryRecordId(recordId)) {
      updateSelectedEngineerRecords(
        "trainings",
        selectedEngineer.trainings.filter((record) => record.id !== recordId),
      );
      setSelectedTrainingRowId(getNextSelectedId(selectedEngineer.trainings, recordId));
      return;
    }

    const saved = await deleteEngineerEducation(selectedEngineer.summary.id, recordId);
    setProfiles((current) =>
      current.map((profile) => (profile.summary.id === saved.summary.id ? saved : profile)),
    );
    setSelectedTrainingRowId(getNextSelectedId(saved.trainings, recordId));
  };

  const updateSelectedEngineerSummaryField = <K extends keyof EngineerSummary>(field: K, value: EngineerSummary[K]) => {
    if (!selectedEngineer) {
      return;
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id
          ? { ...profile, summary: { ...profile.summary, [field]: value } }
          : profile,
      ),
    );
  };

  const updateSelectedEngineerDetailField = <K extends keyof EngineerDetail>(field: K, value: EngineerDetail[K]) => {
    if (!selectedEngineer) {
      return;
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id
          ? { ...profile, detail: { ...profile.detail, [field]: value } }
          : profile,
      ),
    );
  };

  const removeTemporaryHistoryRow = (tab: Exclude<DetailTab, "performance">, rowId: string) => {
    if (!selectedEngineer || !isTemporaryRecordId(rowId)) {
      return;
    }

    if (tab === "career") {
      updateSelectedEngineerRecords("career", selectedEngineer.career.filter((record) => record.id !== rowId));
    } else if (tab === "certificate") {
      updateSelectedEngineerRecords("certificates", selectedEngineer.certificates.filter((record) => record.id !== rowId));
    } else if (tab === "education") {
      updateSelectedEngineerRecords("education", selectedEngineer.education.filter((record) => record.id !== rowId));
    } else if (tab === "award") {
      updateSelectedEngineerRecords("awards", selectedEngineer.awards.filter((record) => record.id !== rowId));
    } else {
      updateSelectedEngineerRecords("trainings", selectedEngineer.trainings.filter((record) => record.id !== rowId));
    }
    setRowModesModel((current) => {
      const nextTabModes = { ...current[tab] };
      delete nextTabModes[rowId];
      return { ...current, [tab]: nextTabModes };
    });
  };

  const isEmptyTemporaryHistoryRow = (row: Record<string, unknown>) =>
    Object.entries(row).every(([key, value]) => {
      if (key === "id" || key === "attachments" || key === "active") {
        return true;
      }
      return value === "" || value === null || value === undefined || value === 0 || value === false || value === "N";
    });

  const handleNewHistoryRowEditCancel: NewHistoryRowEditCancelHandler = (row, params) => {
    const rowId = String(row.id ?? "");
    if (!isTemporaryRecordId(rowId)) {
      return;
    }

    if (params.reason === "rowFocusOut" && !isEmptyTemporaryHistoryRow(row)) {
      return false;
    }

    const tab = (["career", "certificate", "education", "award", "training"] as const).find((candidate) => {
      const records = candidate === "career"
        ? selectedEngineer?.career
        : candidate === "certificate"
          ? selectedEngineer?.certificates
          : candidate === "education"
            ? selectedEngineer?.education
            : candidate === "award"
              ? selectedEngineer?.awards
              : selectedEngineer?.trainings;
      return records?.some((record) => record.id === rowId);
    });

    if (tab) {
      removeTemporaryHistoryRow(tab, rowId);
    }
    return true;
  };

  const updateSelectedEngineerRetired = (retired: boolean) => {
    if (!selectedEngineer) {
      return;
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id
          ? {
              ...profile,
              detail: { ...profile.detail, retired },
              summary: {
                ...profile.summary,
                active: !retired,
                status: retired ? "퇴직" : "재직",
              },
            }
          : profile,
      ),
    );
  };

  const selectedCertificateRows = selectedEngineer?.certificates ?? [];
  const selectedCertificateRow =
    selectedCertificateRows.find((record) => record.id === selectedCertificateRowId) ?? selectedCertificateRows[0] ?? null;

  const openCertificateDialogForCreate = () => {
    if (!selectedEngineer) return;
    const nextId = createTemporaryId(createSequentialId("CE-", selectedCertificateRows.map((record) => record.id)));
    const newRow = createEmptyCertificateRecord(nextId);

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id ? { ...profile, certificates: [newRow, ...profile.certificates] } : profile,
      ),
    );
    setSelectedCertificateRowId(nextId);
    setRowModesModel((current) => ({
      ...current,
      certificate: {
        ...current.certificate,
        [nextId]: { mode: GridRowModes.Edit, fieldToFocus: "certificateName" },
      },
    }));
  };

  const selectedEducationRows = selectedEngineer?.education ?? [];
  const selectedEducationRow =
    selectedEducationRows.find((record) => record.id === selectedEducationRowId) ?? selectedEducationRows[0] ?? null;

  const openEducationDialogForCreate = () => {
    if (!selectedEngineer) return;
    const nextId = createTemporaryId(createSequentialId("ED-", selectedEducationRows.map((record) => record.id)));
    const newRow = createEmptyEducationRecord(nextId);

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id ? { ...profile, education: [newRow, ...profile.education] } : profile,
      ),
    );
    setSelectedEducationRowId(nextId);
    setRowModesModel((current) => ({
      ...current,
      education: {
        ...current.education,
        [nextId]: { mode: GridRowModes.Edit, fieldToFocus: "schoolName" },
      },
    }));
  };

  const selectedAwardRows = selectedEngineer?.awards ?? [];
  const selectedAwardRow = selectedAwardRows.find((record) => record.id === selectedAwardRowId) ?? selectedAwardRows[0] ?? null;

  const openAwardDialogForCreate = () => {
    if (!selectedEngineer) return;
    const nextId = createTemporaryId(createSequentialId("AW-", selectedAwardRows.map((record) => record.id)));
    const newRow = createEmptyAwardRecord(nextId);

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id ? { ...profile, awards: [newRow, ...profile.awards] } : profile,
      ),
    );
    setSelectedAwardRowId(nextId);
    setRowModesModel((current) => ({
      ...current,
      award: {
        ...current.award,
        [nextId]: { mode: GridRowModes.Edit, fieldToFocus: "issueDate" },
      },
    }));
  };

  const selectedTrainingRows = selectedEngineer?.trainings ?? [];
  const selectedTrainingRow =
    selectedTrainingRows.find((record) => record.id === selectedTrainingRowId) ?? selectedTrainingRows[0] ?? null;

  const openTrainingDialogForCreate = () => {
    if (!selectedEngineer) return;
    const nextId = createTemporaryId(createSequentialId("TR-", selectedTrainingRows.map((record) => record.id)));
    const newRow = createEmptyTrainingRecord(nextId);

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id ? { ...profile, trainings: [newRow, ...profile.trainings] } : profile,
      ),
    );
    setSelectedTrainingRowId(nextId);
    setRowModesModel((current) => ({
      ...current,
      training: {
        ...current.training,
        [nextId]: { mode: GridRowModes.Edit, fieldToFocus: "trainingName" },
      },
    }));
  };

  const handleAttachmentUpload = (tab: DetailTab, recordId: string, files: File[]) => {
    if (!selectedEngineer || files.length === 0) {
      return;
    }

    const incomingAttachments = createAttachmentItems(files);

    setProfiles((current) =>
      current.map((profile) => {
        if (profile.summary.id !== selectedEngineer.summary.id) {
          return profile;
        }

        if (tab === "career") {
          return {
            ...profile,
            career: profile.career.map((record) =>
              record.id === recordId ? { ...record, attachments: mergeAttachmentLists(record.attachments, incomingAttachments) } : record,
            ),
          };
        }

        if (tab === "certificate") {
          return {
            ...profile,
            certificates: profile.certificates.map((record) =>
              record.id === recordId ? { ...record, attachments: mergeAttachmentLists(record.attachments, incomingAttachments) } : record,
            ),
          };
        }

        if (tab === "education") {
          return {
            ...profile,
            education: profile.education.map((record) =>
              record.id === recordId ? { ...record, attachments: mergeAttachmentLists(record.attachments, incomingAttachments) } : record,
            ),
          };
        }

        if (tab === "award") {
          return {
            ...profile,
            awards: profile.awards.map((record) =>
              record.id === recordId ? { ...record, attachments: mergeAttachmentLists(record.attachments, incomingAttachments) } : record,
            ),
          };
        }

        if (tab === "training") {
          return {
            ...profile,
            trainings: profile.trainings.map((record) =>
              record.id === recordId ? { ...record, attachments: mergeAttachmentLists(record.attachments, incomingAttachments) } : record,
            ),
          };
        }

        return profile;
      }),
    );
  };

  function makeEditableColumns<T extends object>(columns: GridColDef<T>[]) {
    return columns.map((column) => ({ ...column, editable: true })) as GridColDef<T>[];
  }

  function createActionColumn<T extends { id: string }>(
    tab: DetailTab,
    onDelete: (recordId: string) => void,
    headerName = "작업",
  ): GridColDef<T> {
    return {
      field: "__actions__",
      type: "actions",
      headerName,
      width: 160,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      getActions: (params) => {
        const rowIsEditing = rowModesModel[tab][params.id]?.mode === GridRowModes.Edit;

        if (rowIsEditing) {
          return [
            <GridActionsCellItem
              key="save"
              icon={<SaveOutlinedIcon />}
              label="저장"
              onClick={() => confirmRowSave(tab, String(params.id))}
              color="primary"
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CancelOutlinedIcon />}
              label="취소"
              onClick={() => {
                stopRowEditMode(tab, String(params.id), true);

                if (isTemporaryRecordId(params.id)) {
                  setProfiles((current) =>
                    current.map((profile) => {
                      if (profile.summary.id !== selectedEngineer?.summary.id) {
                        return profile;
                      }

                      if (tab === "career") {
                        return { ...profile, career: profile.career.filter((record) => record.id !== params.id) };
                      }

                      if (tab === "certificate") {
                        return { ...profile, certificates: profile.certificates.filter((record) => record.id !== params.id) };
                      }

                      if (tab === "education") {
                        return { ...profile, education: profile.education.filter((record) => record.id !== params.id) };
                      }

                      if (tab === "award") {
                        return { ...profile, awards: profile.awards.filter((record) => record.id !== params.id) };
                      }

                      if (tab === "training") {
                        return { ...profile, trainings: profile.trainings.filter((record) => record.id !== params.id) };
                      }

                      return profile;
                    }),
                  );
                }
              }}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditOutlinedIcon />}
            label="수정"
            disabled={!canUpdate}
            onClick={() => {
              const apiRef =
                tab === "career"
                  ? careerGridApiRef
                  : tab === "certificate"
                    ? certificateGridApiRef
                    : tab === "education"
                      ? educationGridApiRef
                      : tab === "award"
                        ? awardGridApiRef
                        : trainingGridApiRef;
              const gridApi = apiRef.current;
              if (!gridApi) {
                return;
              }

              gridApi.startRowEditMode({ id: params.id, fieldToFocus: undefined });
            }}
            color="inherit"
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteOutlineOutlinedIcon />}
            label="삭제"
            disabled={!canDelete}
            onClick={() => {
              requestConfirmation({
                confirmColor: "error",
                confirmLabel: "삭제",
                message: "이 항목을 삭제하시겠습니까?",
                onConfirm: () => onDelete(String(params.id)),
                title: "삭제 확인",
              });
            }}
            color="inherit"
          />,
        ];
      },
    };
  }

  const startHistoryRowEdit = (tab: DetailTab, id: GridRowId, fieldToFocus: string) => {
    setRowModesModel((current) => ({
      ...current,
      [tab]: {
        ...current[tab],
        [id]: { mode: GridRowModes.Edit, fieldToFocus },
      },
    }));
  };

  const renderCertificateNameEditCell = (params: GridRenderEditCellParams) => {
    const resolveLicenseCode = (value: string) =>
      certificationOptions.find((option) => option.certCode === value || option.certName === value)?.certCode ?? value;
    const selectedOption = certificationOptions.find(
      (option) => option.certCode === String(params.value ?? "") || option.certName === String(params.value ?? ""),
    );

    return (
      <Autocomplete<CertificationOption, false, false, true>
        autoHighlight
        freeSolo
        fullWidth
        getOptionLabel={(option) => (typeof option === "string" ? option : `${option.certCode} - ${option.certName}`)}
        isOptionEqualToValue={(option, value) =>
          typeof value !== "string" && option.certCode === value.certCode
        }
        options={certificationOptions}
        size="small"
        value={selectedOption ?? String(params.value ?? "")}
        onChange={(event, option) => {
          const nextValue = typeof option === "string" ? resolveLicenseCode(option) : option?.certCode ?? "";
          void params.api.setEditCellValue({ id: params.id, field: params.field, value: nextValue }, event);
        }}
        onInputChange={(event, nextValue, reason) => {
          if (reason === "input" || reason === "clear") {
            void params.api.setEditCellValue({ id: params.id, field: params.field, value: resolveLicenseCode(nextValue) }, event);
          }
        }}
        renderInput={(inputParams) => (
          <TextField
            {...inputParams}
            autoFocus={params.hasFocus}
            placeholder="자격증 코드"
            sx={{
              "& .MuiInputBase-input": {
                fontSize: 13,
                px: 1,
              },
            }}
          />
        )}
      />
    );
  };

  const careerGridColumns = [...makeEditableColumns(careerColumns), createActionColumn<CareerRecord>("career", handleCareerDelete)];
  const certificateGridColumns = [
    ...makeEditableColumns(certificateColumns).map((column) =>
      column.field === "certificateName"
        ? {
            ...column,
            renderCell: (params: GridRenderCellParams<CertificateRecord>) =>
              certificationNameByCode.get(String(params.value ?? "")) ?? String(params.value ?? ""),
            renderEditCell: renderCertificateNameEditCell,
          }
        : column,
    ),
    createActionColumn<CertificateRecord>("certificate", handleCertificateDelete),
  ];
  const educationGridColumns = [
    ...makeEditableColumns(educationColumns).map((column) =>
      column.field === "degree"
        ? {
            ...column,
            type: "singleSelect" as const,
            valueOptions: degreeOptions,
            renderCell: (params: GridRenderCellParams<EducationRecord>) => formatReferenceLabel(degreeLabelByCode, params.value),
          }
        : column,
    ),
    createActionColumn<EducationRecord>("education", handleEducationDelete),
  ];
  const awardGridColumns = [...makeEditableColumns(awardColumns), createActionColumn<AwardRecord>("award", handleAwardDelete)];
  const trainingGridColumns = [...makeEditableColumns(trainingColumns), createActionColumn<TrainingRecord>("training", handleTrainingDelete, "비고")];
  return (
    <Box>
      <PageHeader
        title="기술인 인사 정보"
      />

      <SearchPanel
        keywordIndex={1}
        keyword={filters.keyword}
        keywordLabel="성명"
        keywordPlaceholder="성명 검색"
        keywordSx={{ flex: "1 1 220px", maxWidth: 240, minWidth: 190, width: "auto" }}
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={engineersQuery.isFetching}
      >
        <TextField
          fullWidth
          label="재직상태"
          select
          size="small"
          sx={[fieldSx, { flex: "0 1 160px", minWidth: 160, maxWidth: 180, width: "auto" }]}
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as EngineerFilterState["status"] }))}
          >
          <MenuItem value="전체">전체</MenuItem>
          <MenuItem value="재직">재직</MenuItem>
          <MenuItem value="휴직">휴직</MenuItem>
          <MenuItem value="퇴직">퇴직</MenuItem>
        </TextField>
        <Autocomplete
          disableClearable={false}
          fullWidth
          getOptionLabel={(option) => option.certName}
          isOptionEqualToValue={(option, value) => option.certCode === value.certCode}
          options={certificationOptions}
          sx={{ flex: "1 1 200px", minWidth: 200, maxWidth: 240, width: "auto" }}
          value={certificationOptions.find((option) => option.certCode === filters.certificationCode) ?? null}
          onChange={(_, option) =>
            setFilters((current) => ({
              ...current,
              certificationCode: option?.certCode ?? "",
            }))
          }
          renderInput={(params) => <TextField {...params} label="보유 자격증" size="small" sx={fieldSx} />}
        />
        <Autocomplete
          disableClearable={false}
          fullWidth
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          options={designGradeOptions}
          sx={{ flex: "1 1 170px", minWidth: 170, maxWidth: 210, width: "auto" }}
          value={designGradeOptions.find((option) => option.value === filters.designGrade) ?? null}
          onChange={(_, option) =>
            setFilters((current) => ({
              ...current,
              designGrade: option?.value ?? "",
            }))
          }
          renderInput={(params) => <TextField {...params} label="설계등급" size="small" sx={fieldSx} />}
        />
        <Autocomplete
          disableClearable={false}
          fullWidth
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          options={constructionManagementGradeOptions}
          sx={{ flex: "1 1 210px", minWidth: 190, maxWidth: 240, width: "auto" }}
          value={constructionManagementGradeOptions.find((option) => option.value === filters.supervisionGrade) ?? null}
          onChange={(_, option) =>
            setFilters((current) => ({
              ...current,
              supervisionGrade: option?.value ?? "",
            }))
          }
          renderInput={(params) => <TextField {...params} label="건설사업 관리 등급" size="small" sx={fieldSx} />}
        />
        <Autocomplete<CodeOption>
          disableClearable={false}
          fullWidth
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          options={searchSpecialtyFieldOptions}
          sx={{ flex: "0 1 180px", minWidth: 180, maxWidth: 210, width: "auto" }}
          value={searchSpecialtyFieldOptions.find((option) => option.value === filters.specialtyField) ?? null}
          onChange={(_, option) =>
            setFilters((current) => ({
              ...current,
              specialtyField: option?.value ?? "",
            }))
          }
          renderInput={(params) => <TextField {...params} label="전문분야" size="small" sx={fieldSx} />}
        />
        <Autocomplete<CodeOption>
          disableClearable={false}
          fullWidth
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          options={searchJobFieldOptions}
          sx={{ flex: "0 1 180px", minWidth: 180, maxWidth: 210, width: "auto" }}
          value={searchJobFieldOptions.find((option) => option.value === filters.jobField) ?? null}
          onChange={(_, option) =>
            setFilters((current) => ({
              ...current,
              jobField: option?.value ?? "",
            }))
          }
          renderInput={(params) => <TextField {...params} label="직무분야" size="small" sx={fieldSx} />}
        />
      </SearchPanel>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: `${summaryPanelWidth}px minmax(0, 1fr)` },
          alignItems: { xs: "start", lg: "stretch" },
        }}
      >
        <ResizableCard
          height={summaryPanelHeight}
          minWidth={SUMMARY_PANEL_MIN_WIDTH}
          maxWidth={SUMMARY_PANEL_MAX_WIDTH}
          onWidthChange={(nextWidth) => setSummaryPanelWidth(clampSummaryPanelWidth(nextWidth))}
          resizeEdges={["right"]}
          sx={{
            alignSelf: "stretch",
            height: {
              xs: summaryPanelHeight,
              lg: historyCardHeight || summaryPanelHeight,
            },
            minHeight: { xs: SUMMARY_PANEL_MIN_HEIGHT, lg: 0 },
          }}
          width={summaryPanelWidth}
        >
          <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  기술인 목록
                </Typography>
              </Box>
              <Chip label={`${filteredEngineers.length}명`} size="small" variant="outlined" />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <EnterpriseDataGrid
                columns={summaryColumns}
                getRowId={(row) => row.id}
                hideFooterSelectedRowCount
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
                loading={false}
                onRowClick={handleRowClick}
                pageSizeOptions={[50, 100, 200]}
                showPageInfo
                showPageNumbers
                wrapperMinHeight="100%"
                rows={filteredEngineers.map((profile) => profile.summary)}
                sx={{
                  border: 0,
                  height: "100%",
                  minHeight: 0,
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
                  "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                  "& .selected-row": { bgcolor: "rgba(25, 118, 210, 0.08)" },
                }}
                getRowClassName={(params) => (params.id === activeSelectedEngineerId ? "selected-row" : "")}
              />
            </Box>
          </CardContent>
        </ResizableCard>

        <Box sx={{ minWidth: 0 }}>
          <Stack ref={historyCardRef} spacing={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }} variant="h6">
                      {selectedEngineer?.summary.name ?? "선택된 기술인가 없습니다."}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                      {selectedEngineer
                        ? selectedEngineer.summary.department + " · " + selectedEngineer.summary.position
                        : "왼쪽 목록에서 기술인를 선택하세요."}
                    </Typography>
                  </Box>
                  {selectedEngineer ? (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <input ref={pdfInputRef} accept="application/pdf,.pdf" hidden type="file" onChange={handlePdfFileChange} />
                      <Button
                        disabled={(!canCreate && !canUpdate) || Boolean(selectedEngineer.summary.isNew)}
                        onClick={() => pdfInputRef.current?.click()}
                        startIcon={<UploadFileOutlinedIcon />}
                        variant="outlined"
                      >
                        경력증명서 PDF 자동입력
                      </Button>
                      <Button
                        disabled={!canCreate || Boolean(selectedEngineer.summary.isNew)}
                        onClick={handleNew}
                        startIcon={<AddOutlinedIcon />}
                        variant="contained"
                      >
                        신규
                      </Button>
                      <Button
                        disabled={!selectedEngineer || (selectedEngineer.summary.isNew ? !canCreate : !canUpdate)}
                        onClick={confirmSaveMaster}
                        startIcon={<SaveOutlinedIcon />}
                        variant="outlined"
                      >
                        {selectedEngineer?.summary.isNew ? "저장" : "업데이트"}
                      </Button>
                    </Box>
                  ) : null}
                </Box>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="성명"
                      size="small"
                      sx={fieldSx}
                      value={selectedEngineer?.summary.name ?? ""}
                      onChange={(event) => updateSelectedEngineerSummaryField("name", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="생일"
                      size="small"
                      type="date"
                      sx={fieldSx}
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={selectedEngineer?.detail.birthDate ?? ""}
                      onChange={(event) => updateSelectedEngineerDetailField("birthDate", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="나이"
                      size="small"
                      sx={fieldSx}
                      value={selectedEngineerAge}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="부서"
                      size="small"
                      sx={fieldSx}
                      value={selectedEngineer?.summary.department ?? ""}
                      onChange={(event) => updateSelectedEngineerSummaryField("department", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="직위"
                      size="small"
                      sx={fieldSx}
                      value={selectedEngineer?.summary.position ?? ""}
                      onChange={(event) => updateSelectedEngineerSummaryField("position", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(selectedEngineer?.detail.educationException)}
                          onChange={(event) => updateSelectedEngineerDetailField("educationException", event.target.checked)}
                        />
                      }
                      label="교육예외"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(selectedEngineer?.detail.retired)}
                          onChange={(event) => updateSelectedEngineerRetired(event.target.checked)}
                        />
                      }
                      label="퇴직"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete<CodeOption>
                      fullWidth
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      options={jobFieldSelectOptions}
                      value={jobFieldSelectOptions.find((option) => option.value === selectedJobField) ?? null}
                      onChange={(_, nextValue) => updateSelectedEngineerDetailField("jobField", nextValue?.value ?? "")}
                      renderInput={(params) => <TextField {...params} label="직무분야" size="small" sx={fieldSx} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete<CodeOption>
                      fullWidth
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      options={specialtyFieldSelectOptions}
                      value={specialtyFieldSelectOptions.find((option) => option.value === selectedSpecialtyField) ?? null}
                      onChange={(_, nextValue) =>
                        updateSelectedEngineerDetailField("specialtyField", nextValue?.value ?? "")
                      }
                      renderInput={(params) => <TextField {...params} label="전문분야" size="small" sx={fieldSx} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete
                      fullWidth
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      options={gradeOptions}
                      value={gradeOptions.find((option) => option.value === selectedTechnicalField) ?? null}
                      onChange={(_, nextValue) => updateSelectedEngineerDetailField("technicalField", nextValue?.value ?? "")}
                      renderInput={(params) => <TextField {...params} label="설계 등급" size="small" sx={fieldSx} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete
                      fullWidth
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      options={constructionManagementGradeOptions}
                      value={constructionManagementGradeOptions.find((option) => option.value === selectedSupervisionQualification) ?? null}
                      onChange={(_, nextValue) =>
                        updateSelectedEngineerDetailField("supervisionQualification", nextValue?.value ?? "")
                      }
                      renderInput={(params) => <TextField {...params} label="건설사업 관리 등급" size="small" sx={fieldSx} />}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {confirmationDialog}

            {pdfDialogOpen ? (
              <EngineerPdfExtractionReviewDialog
                key={pdfFile?.name ?? "pdf-extraction"}
                canCreate={canCreate}
                canUpdate={canUpdate}
                certificationNameByCode={certificationNameByCode}
                degreeNameByCode={degreeNameByCode}
                file={pdfFile}
                onClose={() => {
                  setPdfDialogOpen(false);
                  setPdfFile(null);
                }}
                onRegisterCompanyPerformances={handleRegisterPdfCompanyPerformances}
                onRegisterPersonnel={handleRegisterPdfPersonnel}
                onRegisterProjectHistories={handleRegisterPdfProjectHistories}
                onUpdatePersonnelBasic={handleUpdatePdfPersonnelBasic}
                onUpsertPersonnelSection={handleUpsertPdfPersonnelSection}
                open={pdfDialogOpen}
                selectedEngineer={selectedEngineer}
              />
            ) : null}

            <Box>
            <EngineerHistoryTabs
              awardGridApiRef={awardGridApiRef}
              awardGridColumns={awardGridColumns}
              onAttachmentUpload={handleAttachmentUpload}
              canCreate={canCreate}
              canRead={canRead}
              canUpdate={canUpdate}
              careerGridApiRef={careerGridApiRef}
              careerGridColumns={careerGridColumns}
              certificateGridApiRef={certificateGridApiRef}
              certificateGridColumns={certificateGridColumns}
              certificateLabelByValue={certificationLabelByCode}
              detailTabs={detailTabs}
              educationGridApiRef={educationGridApiRef}
              educationGridColumns={educationGridColumns}
              handleAwardProcessRowUpdate={handleAwardProcessRowUpdate}
              handleCareerProcessRowUpdate={handleCareerProcessRowUpdate}
              handleCertificateProcessRowUpdate={handleCertificateProcessRowUpdate}
              handleEducationProcessRowUpdate={handleEducationProcessRowUpdate}
              handleRowEditEnterKeyDown={handleRowEditEnterKeyDown}
              handleRowEditStop={handleRowEditStop}
              onNewRowEditCancel={handleNewHistoryRowEditCancel}
              handleTrainingProcessRowUpdate={handleTrainingProcessRowUpdate}
              onOpenAwardCreate={openAwardDialogForCreate}
              onOpenCareerCreate={openCareerDialogForCreate}
              onOpenCertificateCreate={openCertificateDialogForCreate}
              onOpenEducationCreate={openEducationDialogForCreate}
              onOpenTrainingCreate={openTrainingDialogForCreate}
              onSelectedTabChange={setSelectedTab}
              onStartRowEdit={startHistoryRowEdit}
              onRowModesModelChange={(tab, model) => setRowModesModel((current) => ({ ...current, [tab]: model }))}
              rowModesModel={rowModesModel}
              rows={selectedDetailRows}
              selectedAwardRow={selectedAwardRow}
              selectedCareerRow={selectedCareerRow}
              selectedCertificateRow={selectedCertificateRow}
              selectedCertificateLabel={
                certificationNameByCode.get(selectedCertificateRow?.certificateName ?? "") ??
                selectedCertificateRow?.certificateName ??
                ""
              }
              selectedEducationRow={selectedEducationRow}
              selectedEngineer={selectedEngineer ?? null}
              selectedEngineerIsNew={Boolean(selectedEngineer?.summary.isNew) || !selectedEngineer}
              selectedEngineerId={selectedEngineer?.summary.id ?? ""}
              selectedPerformanceRefs={selectedDetailRows.careerDetails}
              selectedTab={selectedTab}
              selectedTrainingRow={selectedTrainingRow}
              selectedJobFieldLabel={selectedJobFieldLabel}
              selectedQualificationGradeLabel={selectedQualificationGradeLabel}
              selectedSpecialtyFieldLabel={selectedSpecialtyFieldLabel}
              selectedSupervisionQualificationLabel={selectedSupervisionQualificationLabel}
              selectedTechnicalFieldLabel={selectedTechnicalFieldLabel}
              selectedWorkFieldLabel={selectedWorkFieldLabel}
              setSelectedAwardRowId={setSelectedAwardRowId}
              setSelectedCareerRowId={setSelectedCareerRowId}
              setSelectedCertificateRowId={setSelectedCertificateRowId}
              setSelectedEducationRowId={setSelectedEducationRowId}
              setSelectedTrainingRowId={setSelectedTrainingRowId}
              trainingGridApiRef={trainingGridApiRef}
              trainingGridColumns={trainingGridColumns}
            />
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
