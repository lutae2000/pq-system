"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { KakaoPostcodeFields } from "@/components/common/KakaoPostcodeFields";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useCommonCodeLevel2Options } from "@/modules/common/reference/useReferenceOptions";
import {
  CLIENT_CODE_PAGE_SIZE,
  createClientCode,
  deleteClientCode,
  listClientCodes,
  updateClientCode,
  type ClientCodeRecord,
  type ClientCodeSearchParams,
  type ClientCodeUpsertRequest,
} from "@/modules/code/clients/api";

const EMPTY_ROWS: ClientCodeRecord[] = [];

const emptyDraft = (): ClientCodeRecord => ({
  clientCode: "",
  orderName: "",
  orderEngName: "",
  businessNo: "",
  corpNo: "",
  orderNameLong: "",
  owner: "",
  businessSectors: "",
  businessItems: "",
  orderClass: "",
  zipCode: "",
  addr1: "",
  addr2: "",
  remark: "",
  companyType: "",
  homeUrl: "",
  otype: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

const text = (value: string | null | undefined) => value ?? "";
const display = (value: string | null | undefined) => (value?.trim() ? value : "-");

const toCodeOptions = (options: Array<{ label: string; value: string }>) =>
  options.map((item) => ({
    label: `${item.value} - ${item.label}`,
    name: item.label,
    value: item.value,
  }));

const optionName = (options: Array<{ name: string; value: string }>, value: string | null | undefined) =>
  options.find((item) => item.value === value)?.name ?? display(value);

const toRequest = (draft: ClientCodeRecord): ClientCodeUpsertRequest => ({
  clientCode: draft.clientCode.trim(),
  orderName: draft.orderName.trim(),
  orderEngName: text(draft.orderEngName).trim(),
  businessNo: text(draft.businessNo).trim(),
  corpNo: text(draft.corpNo).trim(),
  orderNameLong: text(draft.orderNameLong).trim(),
  owner: text(draft.owner).trim(),
  businessSectors: text(draft.businessSectors).trim(),
  businessItems: text(draft.businessItems).trim(),
  orderClass: text(draft.orderClass).trim(),
  zipCode: text(draft.zipCode).trim(),
  addr1: text(draft.addr1).trim(),
  addr2: text(draft.addr2).trim(),
  remark: text(draft.remark).trim(),
  companyType: text(draft.companyType).trim(),
  homeUrl: text(draft.homeUrl).trim(),
  otype: text(draft.otype).trim(),
  createdId: text(draft.createdId).trim() || "admin",
  lastChangedId: "admin",
});

export function ClientCodesManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const queryClient = useQueryClient();
  const initialSelectionApplied = useRef(false);
  const [businessName, setBusinessName] = useState("");
  const [appliedBusinessName, setAppliedBusinessName] = useState("");
  const [orderClassFilter, setOrderClassFilter] = useState("All");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [searchTick, setSearchTick] = useState(0);
  const [selectedClientCode, setSelectedClientCode] = useState("");
  const [draft, setDraft] = useState<ClientCodeRecord>(() => emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<ClientCodeRecord | null>(null);
  const [notice, setNotice] = useState<{ message: string; severity: "error" | "info" | "success" } | null>(null);

  const orderClassReferences = useCommonCodeLevel2Options("QA", { useYn: "Y" });
  const companyTypeReferences = useCommonCodeLevel2Options("T7", { useYn: "Y" });

  const orderClassOptions = useMemo(() => toCodeOptions(orderClassReferences.options), [orderClassReferences.options]);
  const companyTypeOptions = useMemo(() => toCodeOptions(companyTypeReferences.options), [companyTypeReferences.options]);

  const searchParams = useMemo<ClientCodeSearchParams>(
    () => ({
      businessName: appliedBusinessName,
      companyType: companyTypeFilter,
      orderClass: orderClassFilter,
      page,
    }),
    [appliedBusinessName, companyTypeFilter, orderClassFilter, page],
  );

  const clientCodesQuery = useQuery({
    queryKey: ["client-codes", searchParams, searchTick],
    queryFn: () => listClientCodes(searchParams),
  });

  const clientCodesPage = clientCodesQuery.data ?? {
    content: EMPTY_ROWS,
    page,
    size: CLIENT_CODE_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  };
  const rows = clientCodesPage.content;

  const columns = useMemo<GridColDef<ClientCodeRecord>[]>(
    () => [
      { field: "clientCode", headerName: "코드", width: 90 },
      { field: "orderName", headerName: "거래처명", minWidth: 180, flex: 1 },
      {
        field: "orderNameLong",
        headerName: "거래처명(정식)",
        minWidth: 220,
        flex: 1.2,
        valueGetter: (_value, row) => display(row.orderNameLong),
      },
      { field: "businessNo", headerName: "사업자번호", width: 130, valueGetter: (_value, row) => display(row.businessNo) },
      {
        field: "orderClass",
        headerName: "거래처 분류",
        width: 140,
        valueGetter: (_value, row) => optionName(orderClassOptions, row.orderClass),
      },
      {
        field: "companyType",
        headerName: "상위기관",
        width: 140,
        valueGetter: (_value, row) => optionName(companyTypeOptions, row.companyType),
      },
      { field: "owner", headerName: "대표자", width: 110, valueGetter: (_value, row) => display(row.owner) },
    ],
    [companyTypeOptions, orderClassOptions],
  );

  const selectedRowModel = useMemo(
    () => ({ type: "include" as const, ids: new Set(selectedClientCode ? [selectedClientCode] : []) }),
    [selectedClientCode],
  );
  const paginationModel = useMemo<GridPaginationModel>(() => ({ page, pageSize: CLIENT_CODE_PAGE_SIZE }), [page]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (clientCodesQuery.isLoading || clientCodesQuery.isFetching) {
      return;
    }

    if (rows.length === 0) {
      setSelectedClientCode("");
      setDraft((current) => (current.clientCode ? emptyDraft() : current));
      return;
    }

    if (!initialSelectionApplied.current) {
      initialSelectionApplied.current = true;
      setSelectedClientCode(rows[0].clientCode);
      setDraft(rows[0]);
      return;
    }

    if (selectedClientCode && !rows.some((row) => row.clientCode === selectedClientCode)) {
      setSelectedClientCode(rows[0].clientCode);
      setDraft(rows[0]);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [clientCodesQuery.isFetching, clientCodesQuery.isLoading, rows, selectedClientCode]);

  const saveMutation = useMutation({
    mutationFn: (requestBody: ClientCodeUpsertRequest) =>
      selectedClientCode ? updateClientCode(selectedClientCode, requestBody) : createClientCode(requestBody),
    onSuccess: (saved) => {
      setSelectedClientCode(saved.clientCode);
      setDraft(saved);
      queryClient.invalidateQueries({ queryKey: ["client-codes"] });
      setNotice({ message: "거래처 정보를 저장했습니다.", severity: "success" });
    },
    onError: (error) => {
      setNotice({ message: error instanceof Error ? error.message : "거래처 저장에 실패했습니다.", severity: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientCode,
    onSuccess: () => {
      setDeleteTarget(null);
      setSelectedClientCode("");
      setDraft(emptyDraft());
      queryClient.invalidateQueries({ queryKey: ["client-codes"] });
      setNotice({ message: "거래처 정보를 삭제했습니다.", severity: "success" });
    },
    onError: (error) => {
      setNotice({ message: error instanceof Error ? error.message : "거래처 삭제에 실패했습니다.", severity: "error" });
    },
  });

  const updateDraft = <K extends keyof ClientCodeRecord>(field: K, value: ClientCodeRecord[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = (keyword: string) => {
    setBusinessName(keyword);
    setAppliedBusinessName(keyword);
    setPage(0);
    setSearchTick((current) => current + 1);
  };

  const handleReset = () => {
    setBusinessName("");
    setAppliedBusinessName("");
    setOrderClassFilter("All");
    setCompanyTypeFilter("All");
    setPage(0);
    setSearchTick((current) => current + 1);
  };

  const handleNew = () => {
    setSelectedClientCode("");
    setDraft(emptyDraft());
    setNotice({ message: "신규 거래처 입력 상태로 전환했습니다.", severity: "info" });
  };

  const handleSave = () => {
    if (!canUpdate && selectedClientCode) {
      setNotice({ message: "수정 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!canCreate && !selectedClientCode) {
      setNotice({ message: "등록 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!draft.clientCode.trim() || !draft.orderName.trim()) {
      setNotice({ message: "거래처 코드와 거래처명은 필수입니다.", severity: "error" });
      return;
    }
    saveMutation.mutate(toRequest(draft));
  };

  const handleDelete = () => {
    if (!canDelete) {
      setNotice({ message: "삭제 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!selectedClientCode || !draft.clientCode) {
      setNotice({ message: "발주처를 먼저 선택하세요.", severity: "error" });
      return;
    }
    setDeleteTarget(draft);
  };

  return (
    <Box>
      <PageHeader title="발주처 관리"/>

      {notice ? (
        <Box sx={{ position: "sticky", top: 16, zIndex: 2, mb: 2 }}>
          <Alert severity={notice.severity} variant="filled">
            {notice.message}
          </Alert>
        </Box>
      ) : null}

      <SearchPanel
        keyword={businessName}
        keywordLabel="거래처명"
        keywordPlaceholder="거래처명, 코드, 사업자번호 검색"
        onKeywordChange={setBusinessName}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
        resetLabel="초기화"
        searchLabel="조회"
      >
        <TextField
          label="거래처 분류"
          onChange={(event) => setOrderClassFilter(event.target.value)}
          select
          size="small"
          sx={{ ...standardFieldSx, minWidth: 180 }}
          value={orderClassFilter}
        >
          <MenuItem value="All">전체</MenuItem>
          {orderClassOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="상위기관"
          onChange={(event) => setCompanyTypeFilter(event.target.value)}
          select
          size="small"
          sx={{ ...standardFieldSx, minWidth: 180 }}
          value={companyTypeFilter}
        >
          <MenuItem value="All">전체</MenuItem>
          {companyTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </SearchPanel>

      <Box
        sx={{
          alignItems: "start",
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 7fr) minmax(420px, 5fr)" },
        }}
      >
        <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, minWidth: 0, p: 2 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 2, justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              거래처 목록
            </Typography>
            <Chip label={`총 ${clientCodesPage.totalElements}건`} size="small" variant="outlined" />
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <EnterpriseDataGrid<ClientCodeRecord>
            columns={columns}
            getRowId={(row) => row.clientCode}
            hideFooterSelectedRowCount
            loading={clientCodesQuery.isLoading || clientCodesQuery.isFetching}
            onPaginationModelChange={(model) => setPage((current) => (current === model.page ? current : model.page))}
            onRowClick={(params) => {
              setSelectedClientCode(params.row.clientCode);
              setDraft(params.row);
            }}
            pageSizeOptions={[CLIENT_CODE_PAGE_SIZE]}
            paginationMode="server"
            paginationModel={paginationModel}
            rowCount={clientCodesPage.totalElements}
            rowSelectionModel={selectedRowModel}
            rows={rows}
            showToolbar={false}
            sx={{
              border: 0,
              minHeight: 560,
              "& .MuiDataGrid-row:hover": { cursor: "pointer" },
            }}
          />
        </Box>

        <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, minWidth: 0, p: 2 }}>
          <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2, justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                거래처 상세
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {selectedClientCode ? `${selectedClientCode} / ${display(draft.orderName)}` : "신규 거래처를 작성 중입니다."}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
              <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
                신규
              </Button>
              <Button
                disabled={saveMutation.isPending || (selectedClientCode ? !canUpdate : !canCreate)}
                onClick={handleSave}
                startIcon={<SaveOutlinedIcon />}
                variant="contained"
              >
                저장
              </Button>
              <Button
                color="error"
                disabled={!selectedClientCode || !canDelete || deleteMutation.isPending}
                onClick={handleDelete}
                startIcon={<DeleteOutlineOutlinedIcon />}
                variant="outlined"
              >
                삭제
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                fullWidth
                label="거래처 코드"
                disabled={Boolean(selectedClientCode)}
                onChange={(event) => updateDraft("clientCode", event.target.value)}
                required
                size="small"
                sx={standardFieldSx}
                value={draft.clientCode}
              />
              <TextField
                fullWidth
                label="거래처 분류"
                onChange={(event) => updateDraft("orderClass", event.target.value)}
                select
                size="small"
                sx={standardFieldSx}
                value={text(draft.orderClass)}
              >
                <MenuItem value="">선택</MenuItem>
                {orderClassOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                fullWidth
                label="거래처명(약식)"
                onChange={(event) => updateDraft("orderName", event.target.value)}
                required
                size="small"
                sx={standardFieldSx}
                value={draft.orderName}
              />
              <TextField
                fullWidth
                label="거래처 영문명"
                onChange={(event) => updateDraft("orderEngName", event.target.value)}
                size="small"
                sx={standardFieldSx}
                value={text(draft.orderEngName)}
              />
            </Box>

            <TextField
              fullWidth
              label="거래처명(정식)"
              onChange={(event) => updateDraft("orderNameLong", event.target.value)}
              size="small"
              sx={standardFieldSx}
              value={text(draft.orderNameLong)}
            />

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                fullWidth
                label="사업자번호"
                onChange={(event) => updateDraft("businessNo", event.target.value)}
                size="small"
                sx={standardFieldSx}
                value={text(draft.businessNo)}
              />
              <TextField
                fullWidth
                label="법인번호"
                onChange={(event) => updateDraft("corpNo", event.target.value)}
                size="small"
                sx={standardFieldSx}
                value={text(draft.corpNo)}
              />
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                fullWidth
                label="대표자"
                onChange={(event) => updateDraft("owner", event.target.value)}
                size="small"
                sx={standardFieldSx}
                value={text(draft.owner)}
              />
              <TextField
                fullWidth
                label="상위기관"
                onChange={(event) => updateDraft("companyType", event.target.value)}
                select
                size="small"
                sx={standardFieldSx}
                value={text(draft.companyType)}
              >
                <MenuItem value="">선택</MenuItem>
                {companyTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                fullWidth
                label="업종"
                onChange={(event) => updateDraft("businessSectors", event.target.value)}
                size="small"
                sx={standardFieldSx}
                value={text(draft.businessSectors)}
              />
              <TextField
                fullWidth
                label="업태"
                onChange={(event) => updateDraft("businessItems", event.target.value)}
                size="small"
                sx={standardFieldSx}
                value={text(draft.businessItems)}
              />
            </Box>

            <KakaoPostcodeFields
              address={text(draft.addr1)}
              addressDetail={text(draft.addr2)}
              onChange={({ address, addressDetail, postalCode }) => {
                updateDraft("zipCode", postalCode);
                updateDraft("addr1", address);
                updateDraft("addr2", addressDetail);
              }}
              postalCode={text(draft.zipCode)}
            />

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                fullWidth
                label="홈페이지 URL"
                onChange={(event) => updateDraft("homeUrl", event.target.value)}
                size="small"
                sx={standardFieldSx}
                value={text(draft.homeUrl)}
              />
              <TextField
                fullWidth
                label="OTYPE"
                onChange={(event) => updateDraft("otype", event.target.value)}
                size="small"
                sx={standardFieldSx}
                value={text(draft.otype)}
              />
            </Box>

            <TextField
              fullWidth
              label="비고"
              minRows={3}
              multiline
              onChange={(event) => updateDraft("remark", event.target.value)}
              size="small"
              sx={standardFieldSx}
              value={text(draft.remark)}
            />
          </Box>
        </Box>
      </Box>

      <Dialog fullWidth maxWidth="xs" onClose={() => setDeleteTarget(null)} open={Boolean(deleteTarget)}>
        <DialogTitle>거래처를 삭제하시겠습니까?</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" variant="body2">
            {deleteTarget ? `${deleteTarget.clientCode} - ${deleteTarget.orderName}` : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)} variant="outlined">
            취소
          </Button>
          <Button color="error" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.clientCode)} variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
