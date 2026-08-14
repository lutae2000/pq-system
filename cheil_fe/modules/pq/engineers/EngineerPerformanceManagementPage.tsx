"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { standardFieldSx } from "@/components/common/FormControls";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

type EngineerStatus = "재직" | "휴직" | "퇴직";
type PerformanceStatus = "대기" | "진행" | "준공";
type PerformanceType = "설계" | "감리";

type EngineerSummary = {
  active: boolean;
  department: string;
  id: string;
  name: string;
  position: string;
  rrn: string;
  status: EngineerStatus;
  workField: string;
};

type EngineerPerformanceRecord = {
  actualParticipation: boolean;
  clientName: string;
  contractEndDate: string;
  contractStartDate: string;
  duty: string;
  id: string;
  memo: string;
  ownContractAmount: string;
  participatingCompany: string;
  participatingDepartment: string;
  participatingPosition: string;
  participationPosition: string;
  participationEndDate: string;
  participationField: string;
  participationStartDate: string;
  participatingTitle: string;
  performanceType: PerformanceType;
  projectName: string;
  reported: boolean;
  round: string;
  status: PerformanceStatus;
  supervisor: boolean;
  specialtyField: string;
  totalContractAmount: string;
  workField: string;
  jointRate: string;
};

type EngineerProfile = {
  performances: EngineerPerformanceRecord[];
  summary: EngineerSummary;
};

type PerformanceFilters = {
  keyword: string;
  status: "전체" | EngineerStatus;
};

const standardInputSx = {
  ...standardFieldSx,
  "& .MuiInputBase-root": {
    minHeight: 40,
  },
} as const;

const engineerColumns: GridColDef<EngineerSummary>[] = [
  { field: "name", headerName: "성명", width: 90 },
  { field: "department", headerName: "부서", flex: 1, minWidth: 140 },
  { field: "position", headerName: "직위", width: 90 },
  { field: "workField", headerName: "직무분야", width: 100 },
  {
    field: "status",
    headerName: "재직상태",
    width: 100,
    renderCell: (params) => {
      const color = params.value === "재직" ? "success" : params.value === "휴직" ? "warning" : "default";
      return <Chip color={color} label={params.value} size="small" variant="outlined" />;
    },
  },
];

const performanceColumns: GridColDef<EngineerPerformanceRecord>[] = [
  {
    field: "status",
    headerName: "상태",
    width: 90,
    renderCell: (params) => {
      const color = params.value === "준공" ? "success" : params.value === "진행" ? "warning" : "default";
      return <Chip color={color} label={params.value} size="small" variant="outlined" />;
    },
  },
  { field: "round", headerName: "차수", width: 70 },
  {
    field: "supervisor",
    headerName: "총괄",
    width: 80,
    renderCell: (params) => <Checkbox checked={Boolean(params.value)} disabled size="small" />,
  },
  { field: "projectName", headerName: "사업명", flex: 1.4, minWidth: 240 },
  { field: "performanceType", headerName: "설계/감리", width: 100 },
  { field: "contractStartDate", headerName: "계약시작일", width: 110 },
  { field: "contractEndDate", headerName: "계약종료일", width: 110 },
  { field: "clientName", headerName: "발주처", width: 150 },
  { field: "participationPosition", headerName: "참여분야지위", width: 120 },
  { field: "participationField", headerName: "참여분야", width: 100 },
  { field: "participatingCompany", headerName: "참여당시회사", width: 190 },
  { field: "participatingDepartment", headerName: "참여당시부서", width: 120 },
  { field: "participatingPosition", headerName: "참여당시직위", width: 120 },
  { field: "duty", headerName: "담당업무", width: 120 },
  { field: "workField", headerName: "직무분야", width: 100 },
  { field: "specialtyField", headerName: "전문분야", width: 110 },
  { field: "totalContractAmount", headerName: "총계약금액", width: 120, align: "right", headerAlign: "right" },
  { field: "ownContractAmount", headerName: "당사금액", width: 110, align: "right", headerAlign: "right" },
];

const performanceStatusOptions: PerformanceStatus[] = ["대기", "진행", "준공"];
const performanceTypeOptions: PerformanceType[] = ["설계", "감리"];
const engineerStatusOptions: Array<EngineerStatus | "전체"> = ["전체", "재직", "휴직", "퇴직"];
const workFieldOptions = ["토목", "건축", "전기", "기계", "환경"];
const participationFieldOptions = ["설계", "감리", "시공", "기타"];
const positionOptions = ["대표", "전무", "상무", "이사", "부장", "차장", "과장", "대리", "사원"];

const initialProfiles: EngineerProfile[] = [
  {
    summary: {
      id: "ENG-2401",
      rrn: "770602-1067920",
      name: "이의종",
      department: "도시종합관리계획 수립용역",
      position: "토목",
      status: "재직",
      active: true,
      workField: "토목",
    },
    performances: [
      {
        id: "PF-2401-001",
        status: "준공",
        round: "1",
        supervisor: true,
        projectName: "동작구 도시종합관리계획 수립용역(1차)",
        performanceType: "설계",
        contractStartDate: "2001-10-11",
        contractEndDate: "2002-12-11",
        clientName: "동작구청",
        participationPosition: "참여기술인",
        participationField: "설계",
        participatingCompany: "동작구청",
        participatingDepartment: "토목",
        participatingPosition: "대리",
        duty: "총괄",
        workField: "토목",
        specialtyField: "토목",
        participatingTitle: "대리",
        participationStartDate: "2001-10-11",
        participationEndDate: "2002-12-11",
        totalContractAmount: "213,500,000",
        ownContractAmount: "213,500,000",
        jointRate: "100",
        reported: true,
        actualParticipation: true,
        memo: "",
      },
      {
        id: "PF-2401-002",
        status: "준공",
        round: "2",
        supervisor: false,
        projectName: "동작구 도시종합관리계획 수립용역(2차)",
        performanceType: "감리",
        contractStartDate: "2002-12-12",
        contractEndDate: "2003-12-12",
        clientName: "서울특별시 동작구청",
        participationPosition: "참여기술인",
        participationField: "감리",
        participatingCompany: "서울특별시 동작구청",
        participatingDepartment: "토목",
        participatingPosition: "대리",
        duty: "보조",
        workField: "토목",
        specialtyField: "토목",
        participatingTitle: "대리",
        participationStartDate: "2002-12-12",
        participationEndDate: "2003-12-12",
        totalContractAmount: "315,700,000",
        ownContractAmount: "147,000,000",
        jointRate: "46.6",
        reported: true,
        actualParticipation: true,
        memo: "분담참여",
      },
    ],
  },
  {
    summary: {
      id: "ENG-2402",
      rrn: "681110-1403010",
      name: "오차진",
      department: "강남사업부",
      position: "감리사업부",
      status: "재직",
      active: true,
      workField: "감리",
    },
    performances: [
      {
        id: "PF-2402-001",
        status: "진행",
        round: "1",
        supervisor: false,
        projectName: "양평군 강상·강하 읍 개명군 정방처리구역 하수관거",
        performanceType: "감리",
        contractStartDate: "2002-07-15",
        contractEndDate: "2002-10-25",
        clientName: "삼성엔지니어링 주식회사",
        participationPosition: "참여기술인",
        participationField: "감리",
        participatingCompany: "삼성엔지니어링",
        participatingDepartment: "감리",
        participatingPosition: "대리",
        duty: "감리",
        workField: "감리",
        specialtyField: "상하수도",
        participatingTitle: "대리",
        participationStartDate: "2002-07-15",
        participationEndDate: "2002-10-25",
        totalContractAmount: "128,000,000",
        ownContractAmount: "128,000,000",
        jointRate: "100",
        reported: true,
        actualParticipation: true,
        memo: "",
      },
    ],
  },
  {
    summary: {
      id: "ENG-2403",
      rrn: "590424-1009913",
      name: "이상우",
      department: "감리사업부",
      position: "상무",
      status: "재직",
      active: true,
      workField: "감리",
    },
    performances: [
      {
        id: "PF-2403-001",
        status: "준공",
        round: "3",
        supervisor: true,
        projectName: "수원시 도시기본계획 수립용역",
        performanceType: "설계",
        contractStartDate: "2003-03-24",
        contractEndDate: "2004-05-29",
        clientName: "수원시청",
        participationPosition: "참여분야지위",
        participationField: "설계",
        participatingCompany: "수원시청",
        participatingDepartment: "계획",
        participatingPosition: "상무",
        duty: "총괄",
        workField: "토목",
        specialtyField: "도시계획",
        participatingTitle: "상무",
        participationStartDate: "2003-03-24",
        participationEndDate: "2004-05-29",
        totalContractAmount: "291,100,000",
        ownContractAmount: "291,100,000",
        jointRate: "100",
        reported: true,
        actualParticipation: true,
        memo: "",
      },
    ],
  },
];

const initialFilters: PerformanceFilters = {
  keyword: "",
  status: "전체",
};

const emptyPerformanceRecord = (id: string): EngineerPerformanceRecord => ({
  id,
  status: "대기",
  round: "1",
  supervisor: false,
  projectName: "",
  performanceType: "설계",
  contractStartDate: "",
  contractEndDate: "",
  clientName: "",
  participationPosition: "참여기술인",
  participationField: "설계",
  participatingCompany: "",
  participatingDepartment: "",
  participatingPosition: "대리",
  duty: "",
  workField: "토목",
  specialtyField: "토목",
  participatingTitle: "대리",
  participationStartDate: "",
  participationEndDate: "",
  totalContractAmount: "",
  ownContractAmount: "",
  jointRate: "",
  reported: true,
  actualParticipation: true,
  memo: "",
});

const formatMoney = (value: string) => {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return "";
  }
  return new Intl.NumberFormat("ko-KR").format(Number(digits));
};

const filterEngineerProfiles = (sourceProfiles: EngineerProfile[], currentFilters: PerformanceFilters) => {
  const keyword = currentFilters.keyword.trim().toLowerCase();

  return sourceProfiles.filter((profile) => {
    const matchesStatus = currentFilters.status === "전체" || profile.summary.status === currentFilters.status;
    const matchesKeyword =
      !keyword ||
      [profile.summary.name, profile.summary.department, profile.summary.position, profile.summary.workField]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword));

    return matchesStatus && matchesKeyword;
  });
};

const createNextPerformanceId = (records: EngineerPerformanceRecord[]) => {
  const nextNumber = records.reduce((max, record) => {
    const match = record.id.match(/(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return Math.max(max, value);
  }, 0) + 1;

  return `PF-${String(nextNumber).padStart(4, "0")}`;
};

export function EngineerPerformanceManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [filters, setFilters] = useState<PerformanceFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<PerformanceFilters>(initialFilters);
  const [selectedEngineerId, setSelectedEngineerId] = useState(initialProfiles[0]?.summary.id ?? "");
  const [selectedPerformanceId, setSelectedPerformanceId] = useState(initialProfiles[0]?.performances[0]?.id ?? "");
  const [performanceDraft, setPerformanceDraft] = useState<EngineerPerformanceRecord>(
    initialProfiles[0]?.performances[0] ?? emptyPerformanceRecord(createNextPerformanceId([])),
  );

  const filteredEngineers = useMemo(() => filterEngineerProfiles(profiles, appliedFilters), [appliedFilters, profiles]);

  const activeSelectedEngineerId =
    filteredEngineers.some((profile) => profile.summary.id === selectedEngineerId)
      ? selectedEngineerId
      : filteredEngineers[0]?.summary.id ?? "";

  const selectedEngineer =
    filteredEngineers.find((profile) => profile.summary.id === activeSelectedEngineerId) ?? null;

  const selectedEngineerPerformances = selectedEngineer?.performances ?? [];

  const selectedPerformanceRow =
    selectedEngineerPerformances.find((record) => record.id === selectedPerformanceId) ??
    selectedEngineerPerformances[0] ??
    null;

  const updateSelectedEngineerPerformance = (updater: (records: EngineerPerformanceRecord[]) => EngineerPerformanceRecord[]) => {
    if (!selectedEngineer) {
      return;
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.summary.id === selectedEngineer.summary.id ? { ...profile, performances: updater(profile.performances) } : profile,
      ),
    );
  };

  const updateDraftField = <K extends keyof EngineerPerformanceRecord>(field: K, value: EngineerPerformanceRecord[K]) => {
    setPerformanceDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = () => {
    const nextFiltered = filterEngineerProfiles(profiles, filters);
    const nextSelectedEngineerId = nextFiltered.some((profile) => profile.summary.id === selectedEngineerId)
      ? selectedEngineerId
      : nextFiltered[0]?.summary.id ?? "";

    setAppliedFilters(filters);
    setSelectedEngineerId(nextSelectedEngineerId);

    const nextEngineer = nextFiltered.find((profile) => profile.summary.id === nextSelectedEngineerId) ?? null;
    const nextFirstRecord = nextEngineer?.performances[0];
    if (nextFirstRecord) {
      setSelectedPerformanceId(nextFirstRecord.id);
      setPerformanceDraft(nextFirstRecord);
    } else {
      setSelectedPerformanceId("");
      setPerformanceDraft(emptyPerformanceRecord(createNextPerformanceId([])));
    }
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedEngineerId(initialProfiles[0]?.summary.id ?? "");
    setSelectedPerformanceId(initialProfiles[0]?.performances[0]?.id ?? "");
    setPerformanceDraft(initialProfiles[0]?.performances[0] ?? emptyPerformanceRecord(createNextPerformanceId([])));
  };

  const handleEngineerRowClick = (params: GridRowParams<EngineerSummary>) => {
    setSelectedEngineerId(params.row.id);
    const targetEngineer = profiles.find((profile) => profile.summary.id === params.row.id) ?? null;
    const firstRecord = targetEngineer?.performances[0];
    if (firstRecord) {
      setSelectedPerformanceId(firstRecord.id);
      setPerformanceDraft(firstRecord);
    } else {
      const nextId = createNextPerformanceId([]);
      setSelectedPerformanceId("");
      setPerformanceDraft(emptyPerformanceRecord(nextId));
    }
  };

  const handlePerformanceRowClick = (params: GridRowParams<EngineerPerformanceRecord>) => {
    setSelectedPerformanceId(params.row.id);
    setPerformanceDraft(params.row);
  };

  const handleNewRecord = () => {
    if (!selectedEngineer) {
      return;
    }

    const nextId = createNextPerformanceId(selectedEngineerPerformances);
    setSelectedPerformanceId("");
    setPerformanceDraft(emptyPerformanceRecord(nextId));
  };

  const handleDeleteRecord = () => {
    if (!selectedEngineer || !selectedPerformanceRow) {
      return;
    }

    const nextRecords = selectedEngineerPerformances.filter((record) => record.id !== selectedPerformanceRow.id);
    updateSelectedEngineerPerformance(() => nextRecords);
    setSelectedPerformanceId(nextRecords[0]?.id ?? "");
    setPerformanceDraft(nextRecords[0] ?? emptyPerformanceRecord(createNextPerformanceId(nextRecords)));
  };

  const handleSaveRecord = () => {
    if (!selectedEngineer) {
      return;
    }

    if (!performanceDraft.projectName.trim() || !performanceDraft.clientName.trim()) {
      return;
    }

    const nextRecord: EngineerPerformanceRecord = {
      ...performanceDraft,
      id: performanceDraft.id || createNextPerformanceId(selectedEngineerPerformances),
      projectName: performanceDraft.projectName.trim(),
      clientName: performanceDraft.clientName.trim(),
      contractStartDate: performanceDraft.contractStartDate.trim(),
      contractEndDate: performanceDraft.contractEndDate.trim(),
      participationStartDate: performanceDraft.participationStartDate.trim(),
      participationEndDate: performanceDraft.participationEndDate.trim(),
      totalContractAmount: formatMoney(performanceDraft.totalContractAmount),
      ownContractAmount: formatMoney(performanceDraft.ownContractAmount),
      jointRate: performanceDraft.jointRate.trim(),
      participatingCompany: performanceDraft.participatingCompany.trim(),
      participatingDepartment: performanceDraft.participatingDepartment.trim(),
      participatingPosition: performanceDraft.participatingPosition.trim(),
      duty: performanceDraft.duty.trim(),
      specialtyField: performanceDraft.specialtyField.trim(),
      memo: performanceDraft.memo.trim(),
    };

    const exists = selectedEngineerPerformances.some((record) => record.id === nextRecord.id);

    updateSelectedEngineerPerformance((records) =>
      exists ? records.map((record) => (record.id === nextRecord.id ? nextRecord : record)) : [nextRecord, ...records],
    );
    setSelectedPerformanceId(nextRecord.id);
    setPerformanceDraft(nextRecord);
  };

  const selectedEngineerLabel = selectedEngineer
    ? `${selectedEngineer.summary.name} / ${selectedEngineer.summary.department} / ${selectedEngineer.summary.position}`
    : "선택된 기술인가 없습니다";
  const canSaveCurrent = Boolean(selectedPerformanceRow) ? canUpdate : canCreate;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100%", p: { xs: 1.5, md: 2 } }}>
      <PageHeader
        title="기술인별 실적관리"
        description="기술인별 실적을 조회하고 사업별 참여 내역과 상세 정보를 관리합니다."
      />

      <Card sx={{ mb: 2, borderColor: "rgba(0, 0, 0, 0.08)" }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                조회조건
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button disabled={!canRead} startIcon={<SearchOutlinedIcon />} variant="contained" onClick={handleSearch}>
                  조회
                </Button>
                <Button startIcon={<RefreshOutlinedIcon />} variant="outlined" onClick={handleReset}>
                  초기화
                </Button>
              </Box>
            </Box>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                <TextField
                  fullWidth
                  label="재직상태"
                  select
                  size="small"
                  sx={standardInputSx}
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as PerformanceFilters["status"] }))}
                >
                  {engineerStatusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 8, md: 5 }}>
                <TextField
                  fullWidth
                  label="사번/성명"
                  size="small"
                  sx={standardInputSx}
                  value={filters.keyword}
                  onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderColor: "rgba(0, 0, 0, 0.08)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25, gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                    기술인 목록
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {filteredEngineers.length}명
                  </Typography>
                </Box>
                <Chip label={selectedEngineer?.summary.status ?? "대기"} size="small" variant="outlined" />
              </Box>
              <EnterpriseDataGrid<EngineerSummary>
                columns={engineerColumns}
                getRowId={(row) => row.id}
                hideFooterSelectedRowCount
                onRowClick={handleEngineerRowClick}
                rows={filteredEngineers.map((profile) => profile.summary)}
                sx={{
                  border: 0,
                  height: 720,
                  "& .MuiDataGrid-columnHeaders": {
                    bgcolor: "rgba(15, 23, 42, 0.04)",
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          <Stack spacing={2}>
            <Card sx={{ borderColor: "rgba(0, 0, 0, 0.08)" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                      실적 목록
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {selectedEngineerLabel}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Chip label={`${selectedEngineerPerformances.length}건`} size="small" variant="outlined" />
                    <Button disabled={!canCreate} startIcon={<AddOutlinedIcon />} variant="outlined" onClick={handleNewRecord}>
                      신규
                    </Button>
                    <Button
                      disabled={!selectedPerformanceRow || !canUpdate}
                      startIcon={<EditOutlinedIcon />}
                      variant="outlined"
                      onClick={() => {
                        if (selectedPerformanceRow) {
                          setSelectedPerformanceId(selectedPerformanceRow.id);
                          setPerformanceDraft(selectedPerformanceRow);
                        }
                      }}
                    >
                      수정
                    </Button>
                    <Button
                      color="error"
                      disabled={!selectedPerformanceRow || !canDelete}
                      startIcon={<DeleteOutlineOutlinedIcon />}
                      variant="outlined"
                      onClick={handleDeleteRecord}
                    >
                      삭제
                    </Button>
                  </Stack>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <EnterpriseDataGrid<EngineerPerformanceRecord>
                  columns={performanceColumns}
                  getRowId={(row) => row.id}
                  hideFooterSelectedRowCount
                  onRowClick={handlePerformanceRowClick}
                  onRowDoubleClick={handlePerformanceRowClick}
                  rows={selectedEngineerPerformances}
                  sx={{
                    border: 0,
                    height: 300,
                    "& .MuiDataGrid-columnHeaders": {
                      bgcolor: "rgba(15, 23, 42, 0.04)",
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card sx={{ borderColor: "rgba(0, 0, 0, 0.08)" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                      실적 상세
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      선택된 실적을 바로 수정할 수 있습니다.
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button disabled={!canSaveCurrent} startIcon={<SaveOutlinedIcon />} variant="contained" onClick={handleSaveRecord}>
                        저장
                      </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        if (selectedPerformanceRow) {
                          setPerformanceDraft(selectedPerformanceRow);
                          setSelectedPerformanceId(selectedPerformanceRow.id);
                        } else if (selectedEngineer) {
                          handleNewRecord();
                        }
                      }}
                    >
                      취소
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="용역명"
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.projectName}
                      onChange={(event) => updateDraftField("projectName", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3, md: 1.5 }}>
                    <TextField
                      fullWidth
                      label="차수"
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.round}
                      onChange={(event) => updateDraftField("round", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3, md: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(performanceDraft.supervisor)}
                          onChange={(event) => updateDraftField("supervisor", event.target.checked)}
                        />
                      }
                      label="총괄"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      fullWidth
                      label="상태"
                      select
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.status}
                      onChange={(event) => updateDraftField("status", event.target.value as PerformanceStatus)}
                    >
                      {performanceStatusOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      fullWidth
                      label="설계/감리"
                      select
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.performanceType}
                      onChange={(event) => updateDraftField("performanceType", event.target.value as PerformanceType)}
                    >
                      {performanceTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                    <TextField
                      fullWidth
                      label="계약시작일"
                      size="small"
                      type="date"
                      sx={standardInputSx}
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={performanceDraft.contractStartDate}
                      onChange={(event) => updateDraftField("contractStartDate", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                    <TextField
                      fullWidth
                      label="계약종료일"
                      size="small"
                      type="date"
                      sx={standardInputSx}
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={performanceDraft.contractEndDate}
                      onChange={(event) => updateDraftField("contractEndDate", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="발주처"
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.clientName}
                      onChange={(event) => updateDraftField("clientName", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="총계약금액"
                      size="small"
                      sx={standardInputSx}
                      slotProps={{ htmlInput: { inputMode: "numeric" } }}
                      value={performanceDraft.totalContractAmount}
                      onChange={(event) => updateDraftField("totalContractAmount", formatMoney(event.target.value))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="당사금액"
                      size="small"
                      sx={standardInputSx}
                      slotProps={{ htmlInput: { inputMode: "numeric" } }}
                      value={performanceDraft.ownContractAmount}
                      onChange={(event) => updateDraftField("ownContractAmount", formatMoney(event.target.value))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="공동도급비율"
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.jointRate}
                      onChange={(event) => updateDraftField("jointRate", event.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 0.5 }} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="참여시작일"
                      size="small"
                      type="date"
                      sx={standardInputSx}
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={performanceDraft.participationStartDate}
                      onChange={(event) => updateDraftField("participationStartDate", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="참여종료일"
                      size="small"
                      type="date"
                      sx={standardInputSx}
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={performanceDraft.participationEndDate}
                      onChange={(event) => updateDraftField("participationEndDate", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="참여분야지위"
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.participationPosition}
                      onChange={(event) => updateDraftField("participationPosition", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="참여분야"
                      select
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.participationField}
                      onChange={(event) => updateDraftField("participationField", event.target.value)}
                    >
                      {participationFieldOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="참여당시회사"
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.participatingCompany}
                      onChange={(event) => updateDraftField("participatingCompany", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="참여당시부서"
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.participatingDepartment}
                      onChange={(event) => updateDraftField("participatingDepartment", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="참여당시직위"
                      select
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.participatingPosition}
                      onChange={(event) => updateDraftField("participatingPosition", event.target.value)}
                    >
                      {positionOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="구분"
                      select
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.performanceType}
                      onChange={(event) => updateDraftField("performanceType", event.target.value as PerformanceType)}
                    >
                      {performanceTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="직무분야"
                      select
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.workField}
                      onChange={(event) => updateDraftField("workField", event.target.value)}
                    >
                      {workFieldOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="전문분야"
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.specialtyField}
                      onChange={(event) => updateDraftField("specialtyField", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(performanceDraft.reported)}
                          onChange={(event) => updateDraftField("reported", event.target.checked)}
                        />
                      }
                      label="신고"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(performanceDraft.actualParticipation)}
                          onChange={(event) => updateDraftField("actualParticipation", event.target.checked)}
                        />
                      }
                      label="실질참여"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="비고"
                      multiline
                      minRows={3}
                      size="small"
                      sx={standardInputSx}
                      value={performanceDraft.memo}
                      onChange={(event) => updateDraftField("memo", event.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
