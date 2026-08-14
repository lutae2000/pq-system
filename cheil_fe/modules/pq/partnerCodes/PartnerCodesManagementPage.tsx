"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  PartnerCodeDetailDialog,
} from "@/modules/pq/partnerCodes/PartnerCodeDetailDialog";
import type {
  PartnerOrderCompanyFilters,
  PartnerOrderCompanyRecord,
} from "@/modules/pq/partnerCodes/partnerCodes.types";

const initialRecords: PartnerOrderCompanyRecord[] = [
  {
    id: "111",
    code: "111",
    shortName: "대성",
    longName: "(주)대성종합기술공사",
    representative: "강태중",
    industry: "기술용역",
    businessType: "설계",
    capital: 0,
    companyType: "동종",
    specialtyTech: "상하수도",
    englishName: "",
    businessNo: "",
    corporateNo: "",
    associationNo: "",
    homepage: "",
    postalCode: "",
    address: "",
    addressDetail: "",
    employeeCount: 0,
    phone: "",
    fax: "",
    memo: "",
  },
  {
    id: "112",
    code: "112",
    shortName: "대영",
    longName: "(주)대영엔지니어링",
    representative: "조근환",
    industry: "기술용역",
    businessType: "감리",
    capital: 0,
    companyType: "동종",
    specialtyTech: "도로",
    englishName: "",
    businessNo: "",
    corporateNo: "",
    associationNo: "",
    homepage: "",
    postalCode: "",
    address: "",
    addressDetail: "",
    employeeCount: 0,
    phone: "",
    fax: "",
    memo: "",
  },
  {
    id: "135",
    code: "135",
    shortName: "도화",
    longName: "(주)도화종합기술공사",
    representative: "이윤한(설계)",
    industry: "기술용역 설계 감리",
    businessType: "",
    capital: 0,
    companyType: "동종",
    specialtyTech: "기술용역 설계 감리",
    englishName: "",
    businessNo: "211-81-08009",
    corporateNo: "1101110037740",
    associationNo: "",
    homepage: "",
    postalCode: "135-080",
    address: "서울 강남구 역삼동",
    addressDetail: "736-6",
    employeeCount: 0,
    phone: "02-2050-6049",
    fax: "",
    memo: "",
  },
];

const initialFilters: PartnerOrderCompanyFilters = {
  keyword: "",
};

const fieldSx = {
  "& .MuiInputBase-root": {
    minHeight: 40,
  },
  "& .MuiInputBase-input": {
    py: 1.1,
  },
} as const;

const columns: GridColDef<PartnerOrderCompanyRecord>[] = [
  { field: "code", headerName: "코드", width: 90 },
  { field: "shortName", headerName: "회원사단명", width: 170 },
  { field: "longName", headerName: "회원사장명", flex: 1, minWidth: 220 },
  { field: "representative", headerName: "대표자", width: 130 },
  { field: "industry", headerName: "업종", width: 180 },
  { field: "businessType", headerName: "업태", width: 140 },
  {
    field: "capital",
    headerName: "자본금",
    width: 130,
    align: "right",
    headerAlign: "right",
    valueFormatter: ({ value }) => new Intl.NumberFormat("ko-KR").format(Number(value ?? 0)),
  },
];

const filterRecords = (records: PartnerOrderCompanyRecord[], keywordInput: string) => {
  const keyword = keywordInput.trim().toLowerCase();
  if (!keyword) {
    return records;
  }

  return records.filter((record) =>
    [
      record.code,
      record.shortName,
      record.longName,
      record.representative,
      record.industry,
      record.businessType,
      record.specialtyTech,
      record.businessNo,
      record.corporateNo,
      record.associationNo,
      record.homepage,
      record.address,
      record.phone,
      record.fax,
      record.memo,
    ].some((value) => value.toLowerCase().includes(keyword)),
  );
};

const getNextCode = (records: PartnerOrderCompanyRecord[]) => {
  const max = records.reduce((currentMax, record) => {
    const numeric = Number(record.code.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(currentMax, numeric) : currentMax;
  }, 0);
  return String(max + 1).padStart(3, "0");
};

const createBlankRecord = (code = ""): PartnerOrderCompanyRecord => ({
  id: code,
  code,
  shortName: "",
  longName: "",
  representative: "",
  industry: "",
  businessType: "",
  capital: 0,
  companyType: "동종",
  specialtyTech: "",
  englishName: "",
  businessNo: "",
  corporateNo: "",
  associationNo: "",
  homepage: "",
  postalCode: "",
  address: "",
  addressDetail: "",
  employeeCount: 0,
  phone: "",
  fax: "",
  memo: "",
});

export function PartnerCodesManagementPage() {
  const { canCreate, canDelete, canRead } = useCurrentMenuPermission();
  const [records, setRecords] = useState<PartnerOrderCompanyRecord[]>(initialRecords);
  const [filters, setFilters] = useState<PartnerOrderCompanyFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<PartnerOrderCompanyFilters>(initialFilters);
  const [selectedId, setSelectedId] = useState<string>(initialRecords[0]?.id ?? "");
  const [draft, setDraft] = useState<PartnerOrderCompanyRecord>(initialRecords[0] ?? createBlankRecord());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PartnerOrderCompanyRecord | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const filteredRecords = useMemo(() => filterRecords(records, appliedFilters.keyword), [appliedFilters.keyword, records]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);

  const openRecord = (record: PartnerOrderCompanyRecord) => {
    setSelectedId(record.id);
    setDraft(record);
    setDialogOpen(true);
  };

  const updateDraftField = <K extends keyof PartnerOrderCompanyRecord>(field: K, value: PartnerOrderCompanyRecord[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    if (filterRecords(records, filters.keyword).length === 0) {
      setSnackbar({ message: "조회 결과가 없습니다.", severity: "info" });
    }
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleNew = () => {
    const nextCode = getNextCode(records);
    setDraft(createBlankRecord(nextCode));
    setSelectedId("");
    setDialogOpen(true);
    setSnackbar({ message: "신규 회원사 코드 입력 상태로 전환했습니다.", severity: "info" });
  };

  const handleSave = () => {
    if (!draft.code.trim() || !draft.shortName.trim() || !draft.longName.trim()) {
      setSnackbar({ message: "회원사번호, 회원사단명, 회원사장명은 필수입니다.", severity: "error" });
      return;
    }

    const targetId = selectedId || draft.id || draft.code;
    const normalizedCode = draft.code.trim();
    const duplicateCode = records.some((record) => record.id === normalizedCode && record.id !== targetId);
    if (duplicateCode) {
      setSnackbar({ message: "이미 사용 중인 회원사번호입니다.", severity: "error" });
      return;
    }

    const nextRecord: PartnerOrderCompanyRecord = {
      ...draft,
      id: normalizedCode,
      code: normalizedCode,
      shortName: draft.shortName.trim(),
      longName: draft.longName.trim(),
      representative: draft.representative.trim(),
      industry: draft.industry.trim(),
      businessType: draft.businessType.trim(),
      capital: Number.isFinite(Number(draft.capital)) ? Number(draft.capital) : 0,
      companyType: draft.companyType,
      specialtyTech: draft.specialtyTech.trim(),
      englishName: draft.englishName.trim(),
      businessNo: draft.businessNo.trim(),
      corporateNo: draft.corporateNo.trim(),
      associationNo: draft.associationNo.trim(),
      homepage: draft.homepage.trim(),
      postalCode: draft.postalCode.trim(),
      address: draft.address.trim(),
      addressDetail: draft.addressDetail.trim(),
      employeeCount: Number.isFinite(Number(draft.employeeCount)) ? Number(draft.employeeCount) : 0,
      phone: draft.phone.trim(),
      fax: draft.fax.trim(),
      memo: draft.memo.trim(),
    };

    setRecords((current) => {
      const exists = current.some((record) => record.id === targetId);
      return exists ? current.map((record) => (record.id === targetId ? nextRecord : record)) : [nextRecord, ...current];
    });
    setSelectedId(nextRecord.id);
    setDraft(nextRecord);
    setDialogOpen(false);
    setSnackbar({ message: "회원사 코드를 저장했습니다.", severity: "success" });
  };

  const handleDelete = () => {
    const targetId = selectedRecord?.id || draft.id;
    const target = targetId ? records.find((record) => record.id === targetId) ?? null : null;
    if (!target) {
      setSnackbar({ message: "삭제할 회원사 코드를 먼저 선택하세요.", severity: "error" });
      return;
    }
    setDeleteTarget(target);
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    const nextRecords = records.filter((record) => record.id !== deleteTarget.id);
    setRecords(nextRecords);
    setDeleteTarget(null);
    setDialogOpen(false);

    if (nextRecords.length > 0) {
      openRecord(nextRecords[0]);
    } else {
      setSelectedId("");
      setDraft(createBlankRecord());
    }

    setSnackbar({ message: "선택한 회원사 코드를 삭제했습니다.", severity: "success" });
  };

  const handleOpenContactManager = () => {
    setSnackbar({ message: "회원사담당자 기능은 추후 연동합니다.", severity: "info" });
  };

  return (
    <Box>
      <PageHeader
        title="회원사 코드(수주)"
        description="PQ관리 > 기준정보 > 회원사 코드(수주) 화면입니다. 행을 더블클릭하면 상세 팝업이 열립니다."
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
              추가
            </Button>
            <Button color="error" disabled={!canDelete} onClick={handleDelete} startIcon={<DeleteOutlineOutlinedIcon />} variant="outlined">
              삭제
            </Button>
          </Box>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.75 }}>
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              gap: 1.5,
              alignItems: { xs: "stretch", lg: "center" },
            }}
          >
            <TextField
              fullWidth
              label="회원사명"
              placeholder="코드, 단명, 장명, 대표자 검색"
              size="small"
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              sx={{ maxWidth: 420, ...fieldSx }}
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
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button disabled={!canRead} onClick={handleSearch} startIcon={<SearchOutlinedIcon />} variant="contained">
                조회
              </Button>
              <Button onClick={handleReset} startIcon={<RefreshOutlinedIcon />} variant="outlined">
                초기화
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                회원사 코드 목록
              </Typography>
              <Typography color="text.secondary" variant="body2">
                행을 더블클릭하면 상세 팝업이 열리고, 추가/수정/삭제를 처리할 수 있습니다.
              </Typography>
            </Box>
            <Chip label={`${filteredRecords.length}건`} size="small" variant="outlined" />
          </Box>

          <EnterpriseDataGrid<PartnerOrderCompanyRecord>
            columns={columns}
            getRowId={(row) => row.id}
            hideFooterSelectedRowCount
            onRowClick={(params) => setSelectedId(params.row.id)}
            onRowDoubleClick={(params: GridRowParams<PartnerOrderCompanyRecord>) => openRecord(params.row)}
            rows={filteredRecords}
            sx={{
              border: 0,
              minHeight: 420,
              "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
              "& .MuiDataGrid-row:hover": { cursor: "pointer" },
              "& .MuiDataGrid-row.Mui-selected": {
                bgcolor: "rgba(37, 99, 235, 0.10) !important",
              },
            }}
          />
        </CardContent>
      </Card>

      <PartnerCodeDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onDelete={handleDelete}
        onOpenContactManager={handleOpenContactManager}
        onSave={handleSave}
        record={draft}
        onChangeField={updateDraftField}
      />

      <Dialog fullWidth maxWidth="xs" onClose={() => setDeleteTarget(null)} open={Boolean(deleteTarget)}>
        <DialogTitle>회원사 코드를 삭제하시겠습니까?</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" variant="body2">
            선택된 회원사 코드
          </Typography>
          <Typography sx={{ mt: 0.75, fontWeight: 700 }} variant="body1">
            {deleteTarget ? `${deleteTarget.code} - ${deleteTarget.shortName}` : ""}
          </Typography>
          <Typography sx={{ mt: 1.5 }} variant="body2">
            삭제하면 목록에서 제거됩니다. 계속하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setDeleteTarget(null)} variant="outlined">
            취소
          </Button>
          <Button color="error" onClick={confirmDelete} variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar autoHideDuration={2400} message={snackbar?.message} onClose={() => setSnackbar(null)} open={Boolean(snackbar)} />
    </Box>
  );
}
