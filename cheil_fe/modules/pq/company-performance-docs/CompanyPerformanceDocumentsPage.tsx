"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";

type CompanyPerformanceStatus = "대기" | "작성중" | "완료";

type CompanyPerformanceRecord = {
  clientName: string;
  documentStatus: CompanyPerformanceStatus;
  endDate: string;
  engineerCount: number;
  id: string;
  manager: string;
  period: string;
  projectName: string;
  region: string;
  startDate: string;
  totalAmount: string;
  workType: string;
};

const initialRecords: CompanyPerformanceRecord[] = [
  {
    id: "CP-2024-001",
    projectName: "수도권 통합관제센터 구축",
    workType: "정보통신",
    clientName: "서울시청",
    region: "서울",
    period: "2024-01-01 ~ 2024-12-31",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    totalAmount: "18,400,000,000",
    engineerCount: 12,
    manager: "김민수",
    documentStatus: "완료",
  },
  {
    id: "CP-2024-002",
    projectName: "스마트물류센터 증축",
    workType: "건축",
    clientName: "한강물류",
    region: "경기",
    period: "2024-03-01 ~ 2025-02-28",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    totalAmount: "9,200,000,000",
    engineerCount: 7,
    manager: "이서연",
    documentStatus: "작성중",
  },
  {
    id: "CP-2024-003",
    projectName: "도시철도 연장구간 실시설계",
    workType: "토목",
    clientName: "국가철도공단",
    region: "대전",
    period: "2024-05-15 ~ 2025-04-30",
    startDate: "2024-05-15",
    endDate: "2025-04-30",
    totalAmount: "25,800,000,000",
    engineerCount: 15,
    manager: "박준호",
    documentStatus: "대기",
  },
];

const columns: GridColDef<CompanyPerformanceRecord>[] = [
  { field: "id", headerName: "문서번호", width: 120 },
  { field: "projectName", headerName: "회사실적명", flex: 1.2, minWidth: 220 },
  { field: "workType", headerName: "공종", width: 110 },
  { field: "clientName", headerName: "발주처", width: 140 },
  { field: "region", headerName: "지역", width: 90 },
  { field: "period", headerName: "수행기간", width: 180 },
  { field: "totalAmount", headerName: "계약금액", width: 140, align: "right", headerAlign: "right" },
  { field: "engineerCount", headerName: "기술인", width: 90, align: "right", headerAlign: "right" },
  {
    field: "documentStatus",
    headerName: "상태",
    width: 100,
    renderCell: (params) => {
      const color = params.value === "완료" ? "success" : params.value === "작성중" ? "warning" : "default";
      return <Chip color={color} label={params.value} size="small" />;
    },
  },
];

const drawerStyles = {
  "& .MuiDrawer-paper": {
    width: { xs: "100%", sm: 420, lg: 540 },
  },
} as const;

const fieldStyles = {
  "& .MuiInputBase-root": {
    minHeight: 40,
  },
  "& .MuiInputBase-input": {
    py: 1.1,
  },
} as const;

const detailRows = [
  { label: "문서번호", key: "id" },
  { label: "실적명", key: "projectName" },
  { label: "발주처", key: "clientName" },
  { label: "공종", key: "workType" },
  { label: "지역", key: "region" },
  { label: "담당자", key: "manager" },
  { label: "수행기간", key: "period" },
  { label: "착수일", key: "startDate" },
  { label: "준공일", key: "endDate" },
  { label: "계약금액", key: "totalAmount" },
  { label: "참여기술인 수", key: "engineerCount" },
  { label: "문서상태", key: "documentStatus" },
] as const;

const overviewText = {
  purpose:
    "본 실적은 공공 발주처의 정보통신 기반 시설 구축 사업으로, 용역개요와 참여기술인 실적을 PQ 제출 기준에 맞게 정리한다.",
  scope:
    "수행 범위는 사업 기획, 설계 검토, 구축 지원, 준공 검토, 실적증명서 작성에 필요한 자료 정리까지 포함한다.",
  notes:
    "문서생성 전 발주처명, 수행기간, 참여기술인, 실적 범위가 일치하는지 반드시 확인한다.",
  items: [
    "발주처 요구사항 반영",
    "참여기술인 실적 정합성 검토",
    "실적증명서 출력 전 상태 확인",
  ],
  contact: "02-123-4567",
} as const;

export function CompanyPerformanceDocumentsPage() {
  const [records] = useState(initialRecords);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CompanyPerformanceRecord | null>(initialRecords[0] ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;

    return records.filter((record) =>
      [record.id, record.projectName, record.clientName, record.workType, record.manager, record.documentStatus].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [keyword, records]);

  const handleSearch = () => {
    setKeyword(searchInput.trim());
  };

  const openDrawer = (record: CompanyPerformanceRecord) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  const handleRowDoubleClick = (params: GridRowParams<CompanyPerformanceRecord>) => {
    openDrawer(params.row);
  };

  const handlePreview = () => {
    if (selectedRecord) setDrawerOpen(true);
  };

  const handleGenerate = () => {
    if (selectedRecord) setDrawerOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="회사실적 문서생성"
        description="목록에서 실적을 선택한 후 더블클릭하면 우측 용역개요 팝업에서 문서 생성에 필요한 항목을 확인할 수 있습니다."
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button onClick={handlePreview} startIcon={<PreviewOutlinedIcon />} variant="outlined">
              미리보기
            </Button>
            <Button onClick={handleGenerate} startIcon={<DescriptionOutlinedIcon />} variant="contained">
              문서생성
            </Button>
          </Box>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            sx={{
              alignItems: { xs: "stretch", md: "center" },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 1,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", gap: 1, flex: 1, minWidth: 0 }}>
              <TextField
                fullWidth
                label="회사실적 검색"
                placeholder="문서번호, 실적명, 발주처, 담당자, 상태"
                size="small"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                sx={{ maxWidth: 480, ...fieldStyles }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button onClick={handleSearch} startIcon={<RefreshOutlinedIcon />} variant="contained">
                조회
              </Button>
            </Box>
            <Typography color="text.secondary" variant="body2" sx={{ alignSelf: "center" }}>
              행을 더블클릭하면 우측 용역개요 팝업이 열립니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                회사실적 목록
              </Typography>
              <Typography color="text.secondary" variant="body2">
                문서생성 대상이 되는 실적을 조회합니다.
              </Typography>
            </Box>
            <Chip label={`${filteredRecords.length}건`} size="small" variant="outlined" />
          </Box>
          <EnterpriseDataGrid
            columns={columns}
            getRowId={(row) => row.id}
            hideFooterSelectedRowCount
            onRowDoubleClick={handleRowDoubleClick}
            rows={filteredRecords}
            sx={{
              border: 0,
              minHeight: 520,
              "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
              "& .MuiDataGrid-row:hover": {
                cursor: "pointer",
              },
            }}
          />
        </CardContent>
      </Card>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={drawerStyles}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              용역개요
            </Typography>
            <Typography color="text.secondary" variant="body2">
              더블클릭한 회사실적의 문서 생성용 상세 내용을 확인합니다.
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseOutlinedIcon />
          </IconButton>
        </Box>
        <Divider />

        <Box sx={{ px: 2.5, py: 2.5 }}>
          {selectedRecord ? (
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                        {selectedRecord.projectName}
                      </Typography>
                      <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                        {selectedRecord.clientName} · {selectedRecord.workType} · {selectedRecord.region}
                      </Typography>
                    </Box>
                    <Chip
                      color={
                        selectedRecord.documentStatus === "완료"
                          ? "success"
                          : selectedRecord.documentStatus === "작성중"
                            ? "warning"
                            : "default"
                      }
                      label={selectedRecord.documentStatus}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography sx={{ fontWeight: 800, mb: 1.5 }} variant="subtitle2">
                    기본 정보
                  </Typography>
                  <Grid container spacing={1.5}>
                    {detailRows.map((item) => (
                      <Grid key={item.key} size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label={item.label}
                          size="small"
                          value={String(selectedRecord[item.key])}
                          sx={fieldStyles}
                          slotProps={{ input: { readOnly: true } }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography sx={{ fontWeight: 800, mb: 1.5 }} variant="subtitle2">
                    용역개요
                  </Typography>
                  <Stack spacing={1.5}>
                    <TextField fullWidth label="용역목적" multiline minRows={3} value={overviewText.purpose} sx={fieldStyles} slotProps={{ input: { readOnly: true } }} />
                    <TextField fullWidth label="용역범위" multiline minRows={3} value={overviewText.scope} sx={fieldStyles} slotProps={{ input: { readOnly: true } }} />
                    <TextField fullWidth label="비고" multiline minRows={3} value={overviewText.notes} sx={fieldStyles} slotProps={{ input: { readOnly: true } }} />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography sx={{ fontWeight: 800, mb: 1.5 }} variant="subtitle2">
                    확인 항목
                  </Typography>
                  <Stack spacing={0.75}>
                    {overviewText.items.map((item) => (
                      <Typography key={item} color="text.secondary" variant="body2">
                        • {item}
                      </Typography>
                    ))}
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <TextField
                    fullWidth
                    label="발주처 연락처"
                    size="small"
                    value={overviewText.contact}
                    sx={fieldStyles}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </CardContent>
              </Card>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button fullWidth variant="outlined" startIcon={<PreviewOutlinedIcon />} onClick={handlePreview}>
                  미리보기
                </Button>
                <Button fullWidth variant="contained" startIcon={<DescriptionOutlinedIcon />} onClick={handleGenerate}>
                  문서생성
                </Button>
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">선택된 회사실적이 없습니다.</Typography>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
