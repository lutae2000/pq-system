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
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

import { createServiceType, deleteServiceType, listServiceTypes, updateServiceType } from "./api";
import type { ServiceTypeRecord, ServiceTypeUpsertRequest } from "./serviceTypes.types";

type ServiceTypeFilters = {
  keyword: string;
  useYn: "All" | "Y" | "N";
};

type FieldErrorState = {
  serviceTypeCode?: string;
  serviceTypeName?: string;
};

const MAX_SERVICE_TYPE_CODE = 20;
const MAX_SERVICE_TYPE_NAME = 200;

const emptyFilters: ServiceTypeFilters = {
  keyword: "",
  useYn: "All",
};

const emptyDraft = (): ServiceTypeUpsertRequest => ({
  serviceTypeCode: "",
  serviceTypeName: "",
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

const matchesKeyword = (record: ServiceTypeRecord, keyword: string) => {
  if (!keyword) {
    return true;
  }

  return [record.serviceTypeCode, record.serviceTypeName].join(" ").toLowerCase().includes(keyword);
};

const toDraft = (record: ServiceTypeRecord): ServiceTypeUpsertRequest => ({
  serviceTypeCode: record.serviceTypeCode,
  serviceTypeName: record.serviceTypeName,
  useYn: record.useYn,
});

export function ServiceTypesManagementPage() {
  const { canCreate, canDelete, canUpdate } = useCurrentMenuPermission();
  const queryClient = useQueryClient();
  const serviceTypesQuery = useQuery({
    queryKey: ["pq-service-types"],
    queryFn: listServiceTypes,
  });

  const records = useMemo(() => serviceTypesQuery.data ?? [], [serviceTypesQuery.data]);
  const [filters, setFilters] = useState<ServiceTypeFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<ServiceTypeFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<GridRowId>("");
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<ServiceTypeUpsertRequest>(emptyDraft());
  const [submitted, setSubmitted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceTypeRecord | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const filteredRecords = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();
    return records.filter((record) => {
      const matchesUseYn =
        appliedFilters.useYn === "All" || (appliedFilters.useYn === "Y" ? record.useYn : !record.useYn);
      return matchesKeyword(record, keyword) && matchesUseYn;
    });
  }, [appliedFilters, records]);

  const effectiveSelectedId =
    !isCreating && selectedId && filteredRecords.some((record) => record.serviceTypeCode === selectedId)
      ? selectedId
      : !isCreating
        ? filteredRecords[0]?.serviceTypeCode ?? ""
        : "";

  const selectedRow = useMemo(
    () => filteredRecords.find((record) => record.serviceTypeCode === effectiveSelectedId) ?? null,
    [effectiveSelectedId, filteredRecords],
  );

  const detailDraft = isCreating
    ? draft
    : selectedRow
      ? draft.serviceTypeCode === selectedRow.serviceTypeCode
        ? draft
        : toDraft(selectedRow)
      : emptyDraft();
  const rowSelectionModel = useMemo(
    () => ({ type: "include" as const, ids: new Set<GridRowId>(effectiveSelectedId ? [effectiveSelectedId] : []) }),
    [effectiveSelectedId],
  );

  const errors = useMemo<FieldErrorState>(() => {
    const next: FieldErrorState = {};
    const serviceTypeCode = normalizeText(detailDraft.serviceTypeCode);
    const serviceTypeName = normalizeText(detailDraft.serviceTypeName);

    if (!serviceTypeCode) {
      next.serviceTypeCode = "용역구분 코드를 입력하세요.";
    } else if (serviceTypeCode.length > MAX_SERVICE_TYPE_CODE) {
      next.serviceTypeCode = `용역구분 코드는 ${MAX_SERVICE_TYPE_CODE}자 이내로 입력하세요.`;
    }

    if (!serviceTypeName) {
      next.serviceTypeName = "용역구분명을 입력하세요.";
    } else if (serviceTypeName.length > MAX_SERVICE_TYPE_NAME) {
      next.serviceTypeName = `용역구분명은 ${MAX_SERVICE_TYPE_NAME}자 이내로 입력하세요.`;
    }

    return next;
  }, [detailDraft.serviceTypeCode, detailDraft.serviceTypeName]);

  const isValid = Object.keys(errors).length === 0;
  const detailDisabled = !isCreating && !selectedRow;
  const canSaveCurrent = isCreating ? canCreate : canUpdate;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const requestBody: ServiceTypeUpsertRequest = {
        serviceTypeCode: normalizeText(detailDraft.serviceTypeCode),
        serviceTypeName: normalizeText(detailDraft.serviceTypeName),
        useYn: detailDraft.useYn,
      };

      if (isCreating) {
        return createServiceType(requestBody);
      }
      return updateServiceType(String(effectiveSelectedId), requestBody);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ["pq-service-types"] });
      setSelectedId(saved.serviceTypeCode);
      setIsCreating(false);
      setDraft(toDraft(saved));
      setSubmitted(false);
      setSnackbar({ message: "용역구분 정보가 저장되었습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({
        message: error instanceof Error ? error.message : "저장에 실패했습니다.",
        severity: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServiceType,
    onSuccess: async (_, deletedCode) => {
      await queryClient.invalidateQueries({ queryKey: ["pq-service-types"] });
      const nextRecord = filteredRecords.find((record) => record.serviceTypeCode !== deletedCode) ?? null;
      setSelectedId(nextRecord?.serviceTypeCode ?? "");
      setDraft(nextRecord ? toDraft(nextRecord) : emptyDraft());
      setIsCreating(false);
      setDeleteTarget(null);
      setSnackbar({ message: "용역구분을 삭제했습니다.", severity: "success" });
    },
    onError: (error) => {
      setSnackbar({
        message: error instanceof Error ? error.message : "삭제에 실패했습니다.",
        severity: "error",
      });
    },
  });

  const handleSelect = (record: ServiceTypeRecord) => {
    setSelectedId(record.serviceTypeCode);
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

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid || detailDisabled || !canSaveCurrent) {
      return;
    }
    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteMutation.mutate(deleteTarget.serviceTypeCode);
  };

  const showError = (key: keyof FieldErrorState) => submitted && Boolean(errors[key]);

  const columns: GridColDef<ServiceTypeRecord>[] = [
    { field: "serviceTypeCode", headerName: "용역구분 코드", width: 140 },
    { field: "serviceTypeName", headerName: "용역구분명", minWidth: 220, flex: 1 },
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
      <PageHeader title="용역 구분 관리" />

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
              placeholder="용역구분 코드, 용역구분명 검색"
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
              label="사용여부"
              size="small"
              value={filters.useYn}
              onChange={(event) => setFilters((current) => ({ ...current, useYn: event.target.value as ServiceTypeFilters["useYn"] }))}
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
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 7fr) minmax(360px, 4fr)" },
          alignItems: "start",
        }}
      >
        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                용역구분 목록
              </Typography>
              <Chip label={`총 ${filteredRecords.length}건`} size="small" variant="outlined" />
            </Box>

            <EnterpriseDataGrid<ServiceTypeRecord>
              columns={columns}
              getRowId={(row) => row.serviceTypeCode}
              hideFooterSelectedRowCount
              loading={serviceTypesQuery.isLoading}
              onRowClick={(params) => handleSelect(params.row)}
              onRowDoubleClick={(params: GridRowParams<ServiceTypeRecord>) => handleSelect(params.row)}
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
                  용역구분 상세
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {isCreating
                    ? "새 용역구분을 등록합니다."
                    : selectedRow
                      ? `${selectedRow.serviceTypeCode} - ${selectedRow.serviceTypeName}`
                      : "목록에서 용역구분을 선택하세요."}
                </Typography>
              </Box>
              <Chip color={detailDraft.useYn ? "success" : "default"} label={detailDraft.useYn ? "사용" : "미사용"} size="small" />
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
                error={showError("serviceTypeCode")}
                helperText={showError("serviceTypeCode") ? errors.serviceTypeCode : `${normalizeText(detailDraft.serviceTypeCode).length}/${MAX_SERVICE_TYPE_CODE}`}
                label="용역구분 코드"
                onChange={(event) => setDraft((current) => ({ ...current, serviceTypeCode: event.target.value }))}
                size="small"
                slotProps={{ htmlInput: { maxLength: MAX_SERVICE_TYPE_CODE } }}
                sx={fieldSx}
                value={detailDraft.serviceTypeCode}
              />
              <TextField
                fullWidth
                disabled={detailDisabled}
                error={showError("serviceTypeName")}
                helperText={showError("serviceTypeName") ? errors.serviceTypeName : `${normalizeText(detailDraft.serviceTypeName).length}/${MAX_SERVICE_TYPE_NAME}`}
                label="용역구분명"
                onChange={(event) => setDraft((current) => ({ ...current, serviceTypeName: event.target.value }))}
                size="small"
                slotProps={{ htmlInput: { maxLength: MAX_SERVICE_TYPE_NAME } }}
                sx={fieldSx}
                value={detailDraft.serviceTypeName}
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
        <DialogTitle>용역구분 삭제 확인</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" variant="body2">
            선택한 용역구분
          </Typography>
          <Typography sx={{ mt: 0.75, fontWeight: 700 }} variant="body1">
            {deleteTarget ? `${deleteTarget.serviceTypeCode} - ${deleteTarget.serviceTypeName}` : ""}
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
