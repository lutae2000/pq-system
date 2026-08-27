"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowId, GridRowParams } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { AuditFields } from "@/components/common/AuditFields";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

import { createCertification, deleteCertification, listCertifications, updateCertification } from "./api";
import type { CertificationRecord, CertificationUpsertRequest } from "./certificates.types";

type CertificationFilters = {
  certKind: "All" | string;
  keyword: string;
  useYn: "All" | "Y" | "N";
};

type FieldErrorState = {
  certCode?: string;
  certName?: string;
  satisCode?: string;
  satisName?: string;
};

const MAX_CERT_CODE = 20;
const MAX_CERT_NAME = 200;
const MAX_SATIS_CODE = 20;
const MAX_SATIS_NAME = 200;

const certKindOptions = [
  { value: "All", label: "전체" },
  { value: "1", label: "기능사" },
  { value: "2", label: "산업기사" },
  { value: "3", label: "기사" },
  { value: "4", label: "기술사" },
] as const;

const editableCertKindOptions = certKindOptions.filter((option) => option.value !== "All");

const certKindLabelMap: Record<number, string> = {
  1: "기능사",
  2: "산업기사",
  3: "기사",
  4: "기술사",
};

const emptyFilters: CertificationFilters = {
  certKind: "All",
  keyword: "",
  useYn: "All",
};

const emptyDraft = (): CertificationUpsertRequest => ({
  certCode: "",
  certKind: 1,
  certName: "",
  satisCode: "",
  satisName: "",
  useYn: true,
});

const fieldSx = {
  ...standardFieldSx,
  "& .MuiInputBase-root": { minHeight: 40 },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    py: 1.1,
  },
} as const;

const normalizeText = (value: string | null | undefined) => (value ?? "").trim();

const certificationKindLabel = (value: number) => certKindLabelMap[value] ?? String(value);

const supportedCertKind = (value: number) => (value >= 1 && value <= 4 ? value : 1);

const toDraft = (record: CertificationRecord): CertificationUpsertRequest => ({
  certCode: record.certCode,
  certKind: supportedCertKind(record.certKind),
  certName: record.certName,
  satisCode: record.satisCode ?? "",
  satisName: record.satisName ?? "",
  useYn: record.useYn,
});

const matchesKeyword = (record: CertificationRecord, keyword: string) => {
  if (!keyword) {
    return true;
  }

  const haystack = [
    record.certCode,
    record.certName,
    certificationKindLabel(record.certKind),
    record.satisCode ?? "",
    record.satisName ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(keyword);
};

export function CertificateManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();
  const certificationsQuery = useQuery({
    queryKey: ["pq-certifications"],
    queryFn: listCertifications,
    enabled: tabQueryEnabled,
  });

  const records = useMemo(() => certificationsQuery.data ?? [], [certificationsQuery.data]);
  const [filters, setFilters] = useState<CertificationFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<CertificationFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<GridRowId>("");
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<CertificationUpsertRequest>(emptyDraft());
  const [submitted, setSubmitted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CertificationRecord | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const filteredRecords = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();
    return records.filter((record) => {
      const matchesKind = appliedFilters.certKind === "All" || String(record.certKind) === appliedFilters.certKind;
      const matchesUseYn =
        appliedFilters.useYn === "All" || (appliedFilters.useYn === "Y" ? record.useYn : !record.useYn);
      return matchesKeyword(record, keyword) && matchesKind && matchesUseYn;
    });
  }, [appliedFilters, records]);

  const effectiveSelectedId =
    !isCreating && selectedId && filteredRecords.some((record) => record.certCode === selectedId)
      ? selectedId
      : !isCreating
        ? filteredRecords[0]?.certCode ?? ""
        : "";

  const selectedRow = useMemo(
    () => filteredRecords.find((record) => record.certCode === effectiveSelectedId) ?? null,
    [effectiveSelectedId, filteredRecords],
  );

  const detailDraft = isCreating
    ? draft
    : selectedRow
      ? draft.certCode === selectedRow.certCode
        ? draft
        : toDraft(selectedRow)
      : emptyDraft();

  const rowSelectionModel = useMemo(
    () => ({ type: "include" as const, ids: new Set<GridRowId>(effectiveSelectedId ? [effectiveSelectedId] : []) }),
    [effectiveSelectedId],
  );

  const errors = useMemo<FieldErrorState>(() => {
    const next: FieldErrorState = {};
    const certCode = normalizeText(detailDraft.certCode);
    const certName = normalizeText(detailDraft.certName);
    const satisCode = normalizeText(detailDraft.satisCode);
    const satisName = normalizeText(detailDraft.satisName);

    if (!certCode) {
      next.certCode = "자격증 코드를 입력하세요.";
    } else if (certCode.length > MAX_CERT_CODE) {
      next.certCode = `자격증 코드는 ${MAX_CERT_CODE}자 이내로 입력하세요.`;
    }

    if (!certName) {
      next.certName = "자격증명을 입력하세요.";
    } else if (certName.length > MAX_CERT_NAME) {
      next.certName = `자격증명은 ${MAX_CERT_NAME}자 이내로 입력하세요.`;
    }

    if (satisCode.length > MAX_SATIS_CODE) {
      next.satisCode = `SATIS 코드는 ${MAX_SATIS_CODE}자 이내로 입력하세요.`;
    }

    if (satisName.length > MAX_SATIS_NAME) {
      next.satisName = `SATIS명은 ${MAX_SATIS_NAME}자 이내로 입력하세요.`;
    }

    return next;
  }, [detailDraft.certCode, detailDraft.certName, detailDraft.satisCode, detailDraft.satisName]);

  const isValid = Object.keys(errors).length === 0;
  const detailDisabled = !isCreating && !selectedRow;
  const canSaveCurrent = isCreating ? canCreate : canUpdate;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const requestBody: CertificationUpsertRequest = {
        certCode: normalizeText(detailDraft.certCode),
        certKind: supportedCertKind(detailDraft.certKind),
        certName: normalizeText(detailDraft.certName),
        satisCode: normalizeText(detailDraft.satisCode) || null,
        satisName: normalizeText(detailDraft.satisName) || null,
        useYn: detailDraft.useYn,
      };

      if (isCreating) {
        return createCertification(requestBody);
      }
      return updateCertification(String(effectiveSelectedId), requestBody);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ["pq-certifications"] });
      setSelectedId(saved.certCode);
      setIsCreating(false);
      setDraft(toDraft(saved));
      setSubmitted(false);
      setSnackbar({ message: "자격증 정보가 저장되었습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({
        message: error instanceof Error ? error.message : "저장에 실패했습니다.",
        severity: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCertification,
    onSuccess: async (_, deletedCode) => {
      await queryClient.invalidateQueries({ queryKey: ["pq-certifications"] });
      const nextRecord = filteredRecords.find((record) => record.certCode !== deletedCode) ?? null;
      setSelectedId(nextRecord?.certCode ?? "");
      setDraft(nextRecord ? toDraft(nextRecord) : emptyDraft());
      setIsCreating(false);
      setDeleteTarget(null);
      setSnackbar({ message: "자격증이 삭제되었습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({
        message: error instanceof Error ? error.message : "삭제에 실패했습니다.",
        severity: "error",
      });
    },
  });

  const handleSelect = (record: CertificationRecord) => {
    setSelectedId(record.certCode);
    setDraft(toDraft(record));
    setIsCreating(false);
    setSubmitted(false);
  };

  const handleNew = () => {
    setSelectedId("");
    setDraft(emptyDraft());
    setIsCreating(true);
    setSubmitted(false);
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid || detailDisabled || !canSaveCurrent) {
      return;
    }
    saveMutation.mutate();
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteMutation.mutate(deleteTarget.certCode);
  };

  const showError = (key: keyof FieldErrorState) => submitted && Boolean(errors[key]);

  const columns: GridColDef<CertificationRecord>[] = [
    { field: "certCode", headerName: "자격증 코드", width: 120 },
    { field: "certName", headerName: "자격증명", minWidth: 220, flex: 1 },
    {
      field: "certKind",
      headerName: "구분",
      width: 90,
      align: "center",
      headerAlign: "center",
      valueFormatter: (value) => (typeof value === "number" ? certificationKindLabel(value) : "-"),
    },
    {
      field: "satisCode",
      headerName: "SATIS 코드",
      width: 130,
      renderCell: (params) => (typeof params.value === "string" && params.value.trim() ? params.value : "-"),
    },
    {
      field: "useYn",
      headerName: "사용여부",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip color={params.value ? "success" : "default"} label={params.value ? "사용" : "미사용"} size="small" />
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="자격증 관리" />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, alignItems: "center" }}
          >
            <TextField
              fullWidth
              label="검색"
              placeholder="자격증 코드, 자격증명, SATIS 코드 검색"
              size="small"
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
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
            <TextField
              select
              fullWidth
              label="구분"
              size="small"
              value={filters.certKind}
              onChange={(event) => setFilters((current) => ({ ...current, certKind: event.target.value }))}
              sx={{ maxWidth: 160, ...fieldSx }}
            >
              {certKindOptions.map((kind) => (
                <MenuItem key={kind.value} value={kind.value}>
                  {kind.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="사용여부"
              size="small"
              value={filters.useYn}
              onChange={(event) => setFilters((current) => ({ ...current, useYn: event.target.value as CertificationFilters["useYn"] }))}
              sx={{ maxWidth: 160, ...fieldSx }}
            >
              <MenuItem value="All">전체</MenuItem>
              <MenuItem value="Y">사용</MenuItem>
              <MenuItem value="N">미사용</MenuItem>
            </TextField>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", pb: "2px" }}>
              <Button startIcon={<SearchOutlinedIcon />} sx={{ height: 40 }} type="submit" variant="contained">
                조회
              </Button>
              <Button onClick={handleReset} startIcon={<RefreshOutlinedIcon />} sx={{ height: 40 }} variant="outlined">
                초기화
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 7fr) minmax(380px, 4fr)" },
          alignItems: "start",
        }}
      >
        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                자격증 목록
              </Typography>
              <Chip label={`총 ${filteredRecords.length}건`} size="small" variant="outlined" />
            </Box>

            <EnterpriseDataGrid<CertificationRecord>
              columns={columns}
              getRowId={(row) => row.certCode}
              hideFooterSelectedRowCount
              loading={certificationsQuery.isLoading}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
              onRowClick={(params) => handleSelect(params.row)}
              onRowDoubleClick={(params: GridRowParams<CertificationRecord>) => handleSelect(params.row)}
              pageSizeOptions={[100, 200]}
              wrapperMinHeight={620}
              showPageNumbers
              rowSelectionModel={rowSelectionModel}
              rows={filteredRecords}
              sx={{
                border: 0,
                minHeight: 560,
                "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
                "& .MuiDataGrid-row:hover": { cursor: "pointer" },
              }}
            />
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  자격증 상세
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {isCreating
                    ? "새 자격증을 등록합니다."
                    : selectedRow
                      ? `${selectedRow.certCode} - ${selectedRow.certName}`
                      : "목록에서 자격증을 선택하세요."}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={certificationKindLabel(supportedCertKind(detailDraft.certKind))} size="small" variant="outlined" />
                <Chip color={detailDraft.useYn ? "success" : "default"} label={detailDraft.useYn ? "사용" : "미사용"} size="small" />
              </Stack>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Button disabled={!canCreate || saveMutation.isPending} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
                  신규
                </Button>
                <Button
                  disabled={!canSaveCurrent || detailDisabled || saveMutation.isPending}
                  onClick={handleSave}
                  startIcon={<SaveOutlinedIcon />}
                  variant="contained"
                >
                  저장
                </Button>
                <Button
                  color="error"
                  disabled={!canDelete || !selectedRow || isCreating || deleteMutation.isPending}
                  onClick={() => selectedRow && setDeleteTarget(selectedRow)}
                  startIcon={<DeleteOutlineOutlinedIcon />}
                  variant="outlined"
                >
                  삭제
                </Button>
              </Box>

              <TextField
                fullWidth
                disabled={!isCreating}
                error={showError("certCode")}
                helperText={showError("certCode") ? errors.certCode : `${normalizeText(detailDraft.certCode).length}/${MAX_CERT_CODE}`}
                label="자격증 코드"
                onChange={(event) => setDraft((current) => ({ ...current, certCode: event.target.value }))}
                size="small"
                slotProps={{ htmlInput: { maxLength: MAX_CERT_CODE } }}
                sx={fieldSx}
                value={detailDraft.certCode}
              />
              <TextField
                select
                fullWidth
                disabled={detailDisabled}
                label="구분"
                onChange={(event) => setDraft((current) => ({ ...current, certKind: Number(event.target.value) }))}
                size="small"
                sx={fieldSx}
                value={String(supportedCertKind(detailDraft.certKind))}
              >
                {editableCertKindOptions.map((kind) => (
                  <MenuItem key={kind.value} value={kind.value}>
                    {kind.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                disabled={detailDisabled}
                error={showError("certName")}
                helperText={showError("certName") ? errors.certName : `${normalizeText(detailDraft.certName).length}/${MAX_CERT_NAME}`}
                label="자격증명"
                onChange={(event) => setDraft((current) => ({ ...current, certName: event.target.value }))}
                size="small"
                slotProps={{ htmlInput: { maxLength: MAX_CERT_NAME } }}
                sx={fieldSx}
                value={detailDraft.certName}
              />
              <TextField
                fullWidth
                disabled={detailDisabled}
                error={showError("satisCode")}
                helperText={showError("satisCode") ? errors.satisCode : `${normalizeText(detailDraft.satisCode).length}/${MAX_SATIS_CODE}`}
                label="SATIS 코드"
                onChange={(event) => setDraft((current) => ({ ...current, satisCode: event.target.value }))}
                size="small"
                slotProps={{ htmlInput: { maxLength: MAX_SATIS_CODE } }}
                sx={fieldSx}
                value={detailDraft.satisCode ?? ""}
              />
              <TextField
                fullWidth
                disabled={detailDisabled}
                error={showError("satisName")}
                helperText={showError("satisName") ? errors.satisName : `${normalizeText(detailDraft.satisName).length}/${MAX_SATIS_NAME}`}
                label="SATIS명"
                onChange={(event) => setDraft((current) => ({ ...current, satisName: event.target.value }))}
                size="small"
                slotProps={{ htmlInput: { maxLength: MAX_SATIS_NAME } }}
                sx={fieldSx}
                value={detailDraft.satisName ?? ""}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={detailDraft.useYn}
                    disabled={detailDisabled}
                    onChange={(event) => setDraft((current) => ({ ...current, useYn: event.target.checked }))}
                  />
                }
                label="사용"
              />

              <Divider />

              <AuditFields
                createdAt={selectedRow?.createdAt}
                createdBy={selectedRow?.createdId}
                updatedAt={selectedRow?.lastChangedAt}
                updatedBy={selectedRow?.lastChangedId}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>자격증 삭제 확인</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" variant="body2">
            선택한 자격증
          </Typography>
          <Typography sx={{ mt: 0.75, fontWeight: 700 }} variant="body1">
            {deleteTarget ? `${deleteTarget.certCode} - ${deleteTarget.certName}` : ""}
          </Typography>
          <Typography sx={{ mt: 1.5 }} variant="body2">
            삭제하면 목록에서 제거됩니다. 계속 진행하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)} variant="outlined">
            취소
          </Button>
          <Button color="error" disabled={deleteMutation.isPending} onClick={handleDelete} variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar autoHideDuration={2500} onClose={() => setSnackbar(null)} open={Boolean(snackbar)}>
        <Alert severity={snackbar?.severity ?? "info"} sx={{ width: "100%" }} variant="filled">
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
