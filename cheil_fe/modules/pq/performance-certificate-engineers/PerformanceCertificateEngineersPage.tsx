"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

type CertificateStatus = "준공" | "진행" | "대기";

type PerformanceCertificateRecord = {
  contractorAmount: string;
  contractEndDate: string;
  contractStartDate: string;
  contractType: string;
  clientName: string;
  id: string;
  round: string;
  status: CertificateStatus;
  totalAmount: string;
  projectName: string;
};

type ParticipatingEngineerRecord = {
  actualParticipation: boolean;
  category: string;
  department: string;
  endDate: string;
  engineerName: string;
  participatingCompany: string;
  participatingDepartment: string;
  participatingPosition: string;
  id: string;
  participationRank: string;
  startDate: string;
  title: string;
  rrn: string;
  role: string;
  reported: boolean;
  jobField: string;
  specialtyField: string;
};

type CertificateFilters = {
  contractEndDateTo: string;
  contractStartDateFrom: string;
  contractType: string;
  projectName: string;
  status: string;
};

const initialCertificates: PerformanceCertificateRecord[] = [
  {
    id: "PC-2026-001",
    status: "준공",
    contractType: "실시설계",
    projectName: "전국역 주차타워 건립사업 설계공모",
    round: "1",
    clientName: "경기도 연천군",
    contractStartDate: "2026-01-12",
    contractEndDate: "2026-05-18",
    totalAmount: "807,400,000",
    contractorAmount: "588,188,964",
  },
  {
    id: "PC-2026-002",
    status: "진행",
    contractType: "실시설계",
    projectName: "서종 스마트 국가산단 환승주차시설 건설공사 기본 및 실시설계",
    round: "2",
    clientName: "서울특별시",
    contractStartDate: "2026-03-01",
    contractEndDate: "2026-07-10",
    totalAmount: "3,113,990,000",
    contractorAmount: "529,378,300",
  },
  {
    id: "PC-2026-003",
    status: "준공",
    contractType: "감리",
    projectName: "위임국도위임수선 및 보수공사",
    round: "1",
    clientName: "경상북도",
    contractStartDate: "2025-10-30",
    contractEndDate: "2026-04-03",
    totalAmount: "515,031,000",
    contractorAmount: "429,550,000",
  },
  {
    id: "PC-2026-004",
    status: "대기",
    contractType: "영향평가",
    projectName: "수원시 자원회수시설 개선사업 환경영향평가 변경협의",
    round: "3",
    clientName: "한국환경공단",
    contractStartDate: "2025-12-02",
    contractEndDate: "2026-06-02",
    totalAmount: "527,700,000",
    contractorAmount: "263,850,000",
  },
];

const participatingEngineersByCertificate: Record<string, ParticipatingEngineerRecord[]> = {
  "PC-2026-001": [
    {
      id: "P-001",
      engineerName: "정무진",
      rrn: "450625-1231515",
      startDate: "2026-01-12",
      endDate: "2026-05-18",
      category: "설계",
      participationRank: "특급",
      title: "특급",
      department: "기술부",
      participatingCompany: "(주)제일엔지니어링종합건축",
      participatingDepartment: "기술부",
      participatingPosition: "이사",
      role: "설계(분야책임)",
      actualParticipation: true,
      reported: true,
      jobField: "설계",
      specialtyField: "토목",
    },
    {
      id: "P-002",
      engineerName: "고종탁",
      rrn: "560409-1057811",
      startDate: "2026-01-20",
      endDate: "2026-05-18",
      category: "설계",
      participationRank: "특급",
      title: "특급",
      department: "도로사업부",
      participatingCompany: "(주)제일엔지니어링종합건축",
      participatingDepartment: "도로사업부",
      participatingPosition: "전무",
      role: "설계(사업책임)",
      actualParticipation: true,
      reported: true,
      jobField: "설계",
      specialtyField: "도로",
    },
  ],
  "PC-2026-002": [
    {
      id: "P-101",
      engineerName: "김지호",
      rrn: "600505-1162211",
      startDate: "2026-03-18",
      endDate: "2026-07-10",
      category: "감리",
      participationRank: "특급",
      title: "특급",
      department: "교통사업부",
      participatingCompany: "(주)제일엔지니어링종합건축",
      participatingDepartment: "교통사업부",
      participatingPosition: "전무",
      role: "감리(분야책임)",
      actualParticipation: true,
      reported: true,
      jobField: "감리",
      specialtyField: "교통",
    },
    {
      id: "P-102",
      engineerName: "이준호",
      rrn: "710911-1466325",
      startDate: "2026-03-18",
      endDate: "2026-07-10",
      category: "설계",
      participationRank: "중급",
      title: "중급",
      department: "도로사업부",
      participatingCompany: "(주)제일엔지니어링종합건축",
      participatingDepartment: "도로사업부",
      participatingPosition: "상무",
      role: "도로",
      actualParticipation: true,
      reported: true,
      jobField: "설계",
      specialtyField: "도로",
    },
  ],
  "PC-2026-003": [
    {
      id: "P-201",
      engineerName: "나동환",
      rrn: "720623-1791920",
      startDate: "2025-10-30",
      endDate: "2026-04-03",
      category: "설계",
      participationRank: "특급",
      title: "참여기술인",
      department: "도시사업부",
      participatingCompany: "(주)제일엔지니어링종합건축",
      participatingDepartment: "도시사업부",
      participatingPosition: "차장",
      role: "토목",
      actualParticipation: true,
      reported: true,
      jobField: "설계",
      specialtyField: "토목",
    },
  ],
  "PC-2026-004": [
    {
      id: "P-301",
      engineerName: "양정인",
      rrn: "740303-1925924",
      startDate: "2025-12-02",
      endDate: "2026-06-02",
      category: "감리",
      participationRank: "중급",
      title: "참여기술인",
      department: "환경사업부",
      participatingCompany: "(주)제일엔지니어링종합건축",
      participatingDepartment: "환경사업부",
      participatingPosition: "차장",
      role: "환경",
      actualParticipation: true,
      reported: true,
      jobField: "감리",
      specialtyField: "환경",
    },
  ],
};

const certificateColumns: GridColDef<PerformanceCertificateRecord>[] = [
  {
    field: "status",
    headerName: "상태",
    width: 90,
    renderCell: (params) => {
      const color = params.value === "준공" ? "success" : params.value === "진행" ? "warning" : "default";
      return <Chip color={color} label={params.value} size="small" />;
    },
  },
  { field: "contractType", headerName: "구분", width: 110 },
  { field: "projectName", headerName: "용역명", flex: 1.2, minWidth: 260 },
  { field: "round", headerName: "차수", width: 70, align: "center", headerAlign: "center" },
  { field: "clientName", headerName: "발주처", width: 150 },
  { field: "contractStartDate", headerName: "계약시작일", width: 110 },
  { field: "contractEndDate", headerName: "계약종료일", width: 110 },
  { field: "totalAmount", headerName: "총계약금액", width: 140, align: "right", headerAlign: "right" },
  { field: "contractorAmount", headerName: "당사금액", width: 140, align: "right", headerAlign: "right" },
];

const engineerColumns: GridColDef<ParticipatingEngineerRecord>[] = [
  { field: "engineerName", headerName: "성명", width: 100 },
  { field: "startDate", headerName: "참여시작", width: 110 },
  { field: "endDate", headerName: "참여종료", width: 110 },
  { field: "category", headerName: "구분", width: 90 },
  { field: "participationRank", headerName: "참여분야직위", width: 120 },
  {
    field: "actualParticipation",
    headerName: "실질참여",
    width: 90,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => <Checkbox checked={Boolean(params.value)} disabled size="small" sx={{ p: 0 }} />,
  },
  {
    field: "reported",
    headerName: "신고",
    width: 80,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => <Checkbox checked={Boolean(params.value)} disabled size="small" sx={{ p: 0 }} />,
  },
  { field: "title", headerName: "참여등급", width: 100 },
  { field: "participatingCompany", headerName: "참여당시회사", width: 180 },
  { field: "participatingDepartment", headerName: "참여당시부서", width: 140 },
  { field: "participatingPosition", headerName: "참여당시직위", width: 120 },
  { field: "role", headerName: "담당업무", width: 120 },
  { field: "jobField", headerName: "직무분야", width: 100 },
  { field: "specialtyField", headerName: "전문분야", width: 100 },
];

const fieldStyles = {
  "& .MuiInputBase-root": {
    minHeight: 40,
  },
  "& .MuiInputBase-input": {
    py: 1.1,
  },
} as const;

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitialFilters = (): CertificateFilters => {
  const today = new Date();
  return {
    contractEndDateTo: formatLocalDate(today),
    contractStartDateFrom: `${today.getFullYear()}-01-01`,
    contractType: "",
    projectName: "",
    status: "",
  };
};

export function PerformanceCertificateEngineersPage() {
  const { canRead } = useCurrentMenuPermission();
  const [filters, setFilters] = useState<CertificateFilters>(getInitialFilters());
  const [selectedCertificateId, setSelectedCertificateId] = useState(initialCertificates[0]?.id ?? "");

  const filteredCertificates = useMemo(() => {
    return initialCertificates.filter((record) => {
      const matchesProjectName = !filters.projectName.trim() || record.projectName.toLowerCase().includes(filters.projectName.trim().toLowerCase());
      const matchesContractType = !filters.contractType.trim() || record.contractType.toLowerCase().includes(filters.contractType.trim().toLowerCase());
      const matchesStatus = !filters.status.trim() || record.status === filters.status;
      const matchesStartDate = !filters.contractStartDateFrom || record.contractStartDate >= filters.contractStartDateFrom;
      const matchesEndDate = !filters.contractEndDateTo || record.contractEndDate <= filters.contractEndDateTo;

      return matchesProjectName && matchesContractType && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [filters]);

  const selectedCertificate =
    filteredCertificates.find((record) => record.id === selectedCertificateId) ?? filteredCertificates[0] ?? null;

  const selectedEngineers = selectedCertificate ? participatingEngineersByCertificate[selectedCertificate.id] ?? [] : [];

  const handleReset = () => {
    setFilters(getInitialFilters());
  };

  const handleSearch = () => {
    if (filteredCertificates.length > 0 && !filteredCertificates.some((record) => record.id === selectedCertificateId)) {
      setSelectedCertificateId(filteredCertificates[0].id);
    }
  };

  const handleRowClick = (params: GridRowParams<PerformanceCertificateRecord>) => {
    setSelectedCertificateId(params.row.id);
  };

  return (
    <Box>
      <PageHeader
        title="실적증명서 참여기술인 출력"
        description="실적증명서 발행 대상 용역을 조회하고, 선택한 건의 참여기술인를 아래 목록에서 확인합니다."
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button startIcon={<DownloadOutlinedIcon />} variant="outlined">
              자료받기
            </Button>
            <Button startIcon={<DownloadOutlinedIcon />} variant="outlined">
              출력
            </Button>
          </Box>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 800, mb: 1.5 }} variant="subtitle1">
            조회 조건
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="사업명"
                size="small"
                value={filters.projectName}
                sx={fieldStyles}
                onChange={(event) => setFilters((current) => ({ ...current, projectName: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                fullWidth
                label="사업구분"
                size="small"
                select
                value={filters.contractType}
                sx={fieldStyles}
                onChange={(event) => setFilters((current) => ({ ...current, contractType: event.target.value }))}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="실시설계">실시설계</MenuItem>
                <MenuItem value="감리">감리</MenuItem>
                <MenuItem value="영향평가">영향평가</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                fullWidth
                label="진행상태"
                size="small"
                select
                value={filters.status}
                sx={fieldStyles}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="준공">준공</MenuItem>
                <MenuItem value="진행">진행</MenuItem>
                <MenuItem value="대기">대기</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                fullWidth
                label="계약시작일"
                size="small"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.contractStartDateFrom}
                sx={fieldStyles}
                onChange={(event) => setFilters((current) => ({ ...current, contractStartDateFrom: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                fullWidth
                label="계약종료일"
                size="small"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.contractEndDateTo}
                sx={fieldStyles}
                onChange={(event) => setFilters((current) => ({ ...current, contractEndDateTo: event.target.value }))}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mt: 2 }}>
            <Typography color="text.secondary" variant="caption">
              조회 대상 {filteredCertificates.length}건
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button onClick={handleReset} startIcon={<RefreshOutlinedIcon />} variant="outlined">
                초기화
              </Button>
              <Button disabled={!canRead} onClick={handleSearch} startIcon={<SearchOutlinedIcon />} variant="contained">
                조회
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                실적증명서 목록
              </Typography>
              <Typography color="text.secondary" variant="body2">
                행을 선택하면 아래 참여기술인 목록이 바뀝니다.
              </Typography>
            </Box>
            <Chip label={`${filteredCertificates.length}건`} size="small" variant="outlined" />
          </Box>
          <EnterpriseDataGrid
            columns={certificateColumns}
            getRowId={(row) => row.id}
            hideFooterSelectedRowCount
            onRowClick={handleRowClick}
            rows={filteredCertificates}
            sx={{
              border: 0,
              minHeight: 340,
              "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
              "& .MuiDataGrid-row:hover": { cursor: "pointer" },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                참여기술인 목록
              </Typography>
              <Typography color="text.secondary" variant="body2">
                선택된 실적증명서 기준으로 참여기술인를 확인합니다.
              </Typography>
            </Box>
            <Chip label={`${selectedEngineers.length}명`} size="small" variant="outlined" />
          </Box>

          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  <Box sx={{ minWidth: 180 }}>
                    <Typography color="text.secondary" variant="caption">
                      사업명
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {selectedCertificate?.projectName ?? "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 140 }}>
                    <Typography color="text.secondary" variant="caption">
                      발주처
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {selectedCertificate?.clientName ?? "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography color="text.secondary" variant="caption">
                      사업구분
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {selectedCertificate?.contractType ?? "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography color="text.secondary" variant="caption">
                      계약기간
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {selectedCertificate ? `${selectedCertificate.contractStartDate} ~ ${selectedCertificate.contractEndDate}` : "-"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <EnterpriseDataGrid
              columns={engineerColumns}
              getRowId={(row) => row.id}
              hideFooterSelectedRowCount
              rows={selectedEngineers}
              sx={{
                border: 0,
                minHeight: 280,
                "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
              }}
            />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
