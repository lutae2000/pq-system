"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { Alert, Autocomplete, Box, Button, Card, CardContent, Chip, IconButton, MenuItem, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { AuditFields } from "@/components/common/AuditFields";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { FileActionCard } from "@/components/common/FileActionCard";
import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  createShinindoManagement,
  deleteShinindoManagement,
  getShinindoManagement,
  listShinindoManagements,
  SHININDO_MANAGEMENT_ATTACHMENT_OWNER_TYPE,
  SHININDO_MANAGEMENT_ATTACHMENT_TYPE,
  SHININDO_MANAGEMENT_PAGE_SIZE,
  updateShinindoManagement,
  type ShinindoManagementPageResponse,
  type ShinindoManagementRecord,
  type ShinindoManagementRequest,
  type ShinindoManagementSearchParams,
} from "@/modules/pq/shinindo-management/api";
import { getClientCode, listClientCodes } from "@/modules/code/clients/api";

const EMPTY_ROWS: ShinindoManagementRecord[] = [];
const EXPIRING_SOON_DAYS = 90;

const T = {
  active: "해당",
  activeCount: "해당 항목 수",
  addFile: "파일 추가",
  all: "전체",
  attachmentTitle: "첨부파일",
  client: "발주청",
  clientRequired: "발주청을 선택해 주세요.",
  createdAt: "등록일시",
  createdBy: "등록자",
  delete: "삭제",
  deleteFailed: "삭제에 실패했습니다.",
  deleteSuccess: "신인도 정보를 삭제했습니다.",
  detail: "상세 정보",
  expiringSoon: "90일 이내 만료",
  fileDescriptionExisting: "신인도 첨부파일을 관리합니다.",
  fileDescriptionNew: "저장 후 첨부파일을 등록할 수 있습니다.",
  itemName: "신인도 항목",
  itemNameRequired: "신인도 항목을 입력해 주세요.",
  keywordLabel: "신인도 항목",
  keywordPlaceholder: "신인도 항목명, 비고",
  lastChangedAt: "수정일시",
  lastChangedBy: "수정자",
  list: "목록",
  managementTitle: "신인도 관리",
  new: "신규",
  noReadPermission: "신인도 조회 권한이 없습니다.",
  notActive: "미해당",
  notActiveCount: "미해당 항목 수",
  save: "저장",
  saveConfirm: "신인도 정보를 저장하시겠습니까?",
  saveDeniedCreate: "신인도 등록 권한이 없습니다.",
  saveDeniedUpdate: "신인도 수정 권한이 없습니다.",
  saveFailed: "저장에 실패했습니다.",
  saveSuccess: "신인도 정보를 저장했습니다.",
  status: "상태",
  totalCount: "신인도 항목 수",
  validUntil: "유효기간",
  validityExpired: "만료",
  validityExpiring: "예정 만료",
  validityValid: "유효",
  acquiredDate: "취득일",
  appliedYn: "해당여부",
  score: "배점",
  remark: "비고",
} as const;

const emptyDraft = (clientCode = ""): ShinindoManagementRecord => ({
  id: 0,
  clientCode,
  clientName: "",
  itemName: "",
  appliedYn: "Y",
  score: null,
  acquiredDate: "",
  validUntil: "",
  remark: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

const emptyPage = (page: number, size: number): ShinindoManagementPageResponse => ({
  content: EMPTY_ROWS,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const text = (value: string | null | undefined) => value ?? "";
const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
const numberValue = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));
const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const compactDate = (value: string | null | undefined) => text(value).replace(/\D/g, "").slice(0, 8);
const dashedDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "";
};
const parseDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  if (normalized.length !== 8) {
    return null;
  }
  const parsed = new Date(`${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const daysBetween = (left: Date, right: Date) => Math.floor((right.getTime() - left.getTime()) / 86400000);
const formatGridDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "-";
};
const toRequestDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? normalized : null;
};

const isExpiringSoon = (validUntil: string | null | undefined, referenceDate: string | null | undefined) => {
  const validDate = parseDate(validUntil);
  const refDate = parseDate(referenceDate);
  if (!validDate || !refDate) {
    return false;
  }
  const diff = daysBetween(refDate, validDate);
  return diff >= 0 && diff <= EXPIRING_SOON_DAYS;
};

const getValidityStatus = (row: Pick<ShinindoManagementRecord, "appliedYn" | "validUntil">, referenceDate: string | null | undefined) => {
  if (row.appliedYn !== "Y") {
    return T.notActive;
  }

  const validDate = parseDate(row.validUntil);
  const refDate = parseDate(referenceDate);
  if (!validDate || !refDate) {
    return "-";
  }

  if (validDate < refDate) {
    return T.validityExpired;
  }

  return daysBetween(refDate, validDate) <= EXPIRING_SOON_DAYS ? T.validityExpiring : T.validityValid;
};

const getValidityColor = (value: string) => {
  if (value === T.validityValid) return "success";
  if (value === T.validityExpiring) return "warning";
  if (value === T.validityExpired) return "error";
  return "default";
};

const toRequest = (draft: ShinindoManagementRecord): ShinindoManagementRequest => ({
  acquiredDate: toRequestDate(draft.acquiredDate),
  appliedYn: draft.appliedYn,
  clientCode: text(draft.clientCode).trim(),
  itemName: text(draft.itemName).trim(),
  remark: text(draft.remark).trim() || null,
  score: draft.score,
  validUntil: toRequestDate(draft.validUntil),
});

function ClientAutocompleteField({
  disabled = false,
  onChange,
  sx,
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  sx?: SxProps<Theme>;
  value: string;
}) {
  const tabQueryEnabled = useTabQueryEnabled();
  const [keyword, setKeyword] = useState("");
  const searchKeyword = keyword || value;
  const selectedClientQuery = useQuery({
    queryKey: ["shinindo-client", value],
    queryFn: () => getClientCode(value),
    enabled: tabQueryEnabled && Boolean(value),
    staleTime: 5 * 60 * 1000,
  });
  const clientsQuery = useQuery({
    queryKey: ["shinindo-client-options", searchKeyword],
    queryFn: () =>
      listClientCodes({
        businessName: searchKeyword,
        companyType: "",
        orderClass: "",
        page: 0,
        size: 50,
      }),
    enabled: tabQueryEnabled,
    staleTime: 60 * 1000,
  });
  const options = useMemo(() => {
    const mapped = (clientsQuery.data?.content ?? []).map((client) => ({
      label: client.orderNameLong?.trim() ? `${client.orderName} (${client.orderNameLong})` : client.orderName,
      value: client.clientCode,
    }));
    const selectedClient = selectedClientQuery.data
      ? {
          label: selectedClientQuery.data.orderNameLong?.trim()
            ? `${selectedClientQuery.data.orderName} (${selectedClientQuery.data.orderNameLong})`
            : selectedClientQuery.data.orderName,
          value: selectedClientQuery.data.clientCode,
        }
      : null;
    const uniqueOptions = new Map<string, { label: string; value: string }>();

    [selectedClient, ...mapped].forEach((option) => {
      if (option && !uniqueOptions.has(option.value)) {
        uniqueOptions.set(option.value, option);
      }
    });

    return [...uniqueOptions.values()];
  }, [clientsQuery.data?.content, selectedClientQuery.data]);
  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <Box>
      <Autocomplete
        autoHighlight
        disabled={disabled}
        filterOptions={(items) => items}
        getOptionLabel={(option) => option.label}
        fullWidth
        isOptionEqualToValue={(option, selected) => option.value === selected.value}
        loading={clientsQuery.isLoading || selectedClientQuery.isLoading}
        onChange={(_, nextValue) => {
          onChange(nextValue?.value ?? "");
          setKeyword("");
        }}
        onInputChange={(_, nextInputValue, reason) => {
          if (reason === "input") {
            setKeyword(nextInputValue);
          } else if (reason === "clear") {
            setKeyword("");
          }
        }}
        options={options}
        sx={sx}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            label={T.client}
            placeholder="발주청명 또는 코드 검색"
            size="small"
            sx={standardFieldSx}
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps.htmlInput,
              },
            }}
          />
        )}
        value={selectedOption}
      />
    </Box>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Box
      sx={{
        alignItems: "center",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        display: "flex",
        gap: 1.5,
        minWidth: 0,
        px: 2,
        py: 1.5,
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "50%",
          color: "primary.main",
          display: "inline-flex",
          height: 64,
          justifyContent: "center",
          width: 64,
          "& .MuiSvgIcon-root": { fontSize: 34 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800 }} variant="body1">
          {label}
        </Typography>
        <Typography sx={{ color: "primary.main", fontWeight: 900, lineHeight: 1.1 }} variant="h4">
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export function ShinindoManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [referenceDate, setReferenceDate] = useState(dashedDate(new Date().toISOString()));
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<ShinindoManagementRecord>(() => emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<ShinindoManagementRecord | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [clientGuidanceOpen, setClientGuidanceOpen] = useState(false);
  const [notice, setNotice] = useState<{ message: string; severity: "error" | "info" | "success" } | null>(null);

  const searchParams = useMemo<ShinindoManagementSearchParams>(
    () => ({
      clientCode,
      keyword: appliedKeyword,
      referenceDate,
      page,
      size: SHININDO_MANAGEMENT_PAGE_SIZE,
    }),
    [appliedKeyword, clientCode, page, referenceDate],
  );

  const managementsQuery = useQuery({
    queryKey: ["shinindo-managements", searchParams],
    queryFn: () => listShinindoManagements(searchParams),
    enabled: tabQueryEnabled,
  });

  const selectedId = draft.id;
  const detailQuery = useQuery({
    queryKey: ["shinindo-management", selectedId],
    queryFn: () => getShinindoManagement(selectedId),
    enabled: tabQueryEnabled && selectedId > 0,
  });

  const pageData = managementsQuery.data ?? emptyPage(page, SHININDO_MANAGEMENT_PAGE_SIZE);
  const selectedRecord = detailQuery.data ?? draft;
  const fileOwnerId = selectedId > 0 ? selectedId : "";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const request = toRequest(draft);
      if (!request.clientCode) {
        throw new Error(T.clientRequired);
      }
      if (!request.itemName) {
        throw new Error(T.itemNameRequired);
      }
      return draft.id > 0 ? updateShinindoManagement(draft.id, request) : createShinindoManagement(request);
    },
    onSuccess: async (saved) => {
      setDraft(saved);
      setSaveConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["shinindo-managements"] });
      await queryClient.invalidateQueries({ queryKey: ["shinindo-management", saved.id] });
      setNotice({ message: T.saveSuccess, severity: "success" });
    },
    onError: (error) => setNotice({ message: error instanceof Error ? error.message : T.saveFailed, severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: ShinindoManagementRecord) => deleteShinindoManagement(target.id),
    onSuccess: async () => {
      setDraft(emptyDraft(clientCode));
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["shinindo-managements"] });
      setNotice({ message: T.deleteSuccess, severity: "success" });
    },
    onError: (error) => setNotice({ message: error instanceof Error ? error.message : T.deleteFailed, severity: "error" }),
  });

  const columns = useMemo<GridColDef<ShinindoManagementRecord>[]>(
    () => [
      { field: "clientName", headerName: T.client, minWidth: 180, flex: 1 },
      { field: "itemName", headerName: T.itemName, minWidth: 260, flex: 1.4 },
      {
        field: "appliedYn",
        headerName: T.appliedYn,
        width: 110,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const isActive = params.value === "Y";
          return <Chip color={isActive ? "success" : "default"} label={isActive ? T.active : T.notActive} size="small" variant={isActive ? "filled" : "outlined"} />;
        },
      },
      {
        field: "score",
        headerName: T.score,
        width: 100,
        align: "right",
        headerAlign: "center",
        valueFormatter: (value) => formatNumber(value as number | null, 1),
      },
      {
        field: "acquiredDate",
        headerName: T.acquiredDate,
        width: 120,
        align: "center",
        headerAlign: "center",
        valueGetter: (_value, row) => (row.appliedYn === "Y" ? formatGridDate(row.acquiredDate) : "-"),
      },
      {
        field: "validUntil",
        headerName: T.validUntil,
        width: 120,
        align: "center",
        headerAlign: "center",
        valueGetter: (_value, row) => (row.appliedYn === "Y" ? formatGridDate(row.validUntil) : "-"),
      },
      {
        field: "status",
        headerName: T.status,
        width: 110,
        align: "center",
        headerAlign: "center",
        sortable: false,
        filterable: false,
        disableExport: true,
        valueGetter: (_value, row) => getValidityStatus(row, referenceDate),
        renderCell: (params) => {
          const status = String(params.value ?? "");
          return <Chip color={getValidityColor(status)} label={status || "-"} size="small" variant={status === T.validityValid ? "filled" : "outlined"} />;
        },
      },
      { field: "remark", headerName: T.remark, minWidth: 200, flex: 1, valueGetter: (_value, row) => display(row.remark) },
    ],
    [referenceDate],
  );

  const updateDraft = <K extends keyof ShinindoManagementRecord>(field: K, value: ShinindoManagementRecord[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };
  const updateNumberDraft = <K extends keyof ShinindoManagementRecord>(field: K, value: string) => {
    updateDraft(field, (value === "" ? null : Number(value)) as ShinindoManagementRecord[K]);
  };

  const handleSearch = (nextKeyword: string) => {
    const normalizedKeyword = nextKeyword.trim();
    const shouldRefetch = page === 0 && appliedKeyword === normalizedKeyword;

    setPage(0);
    setAppliedKeyword(normalizedKeyword);

    if (shouldRefetch) {
      void managementsQuery.refetch();
    }
  };

  const handleReset = () => {
    const nextReferenceDate = dashedDate(new Date().toISOString());
    const shouldRefetch = keyword === "" && appliedKeyword === "" && clientCode === "" && referenceDate === nextReferenceDate && page === 0;

    setKeyword("");
    setAppliedKeyword("");
    setClientCode("");
    setReferenceDate(nextReferenceDate);
    setPage(0);

    if (shouldRefetch) {
      void managementsQuery.refetch();
    }
  };

  const handleNew = () => {
    setDraft(emptyDraft(clientCode));
  };

  const handleSaveClick = () => {
    if (draft.id > 0 && !canUpdate) {
      setNotice({ message: T.saveDeniedUpdate, severity: "error" });
      return;
    }
    if (draft.id === 0 && !canCreate) {
      setNotice({ message: T.saveDeniedCreate, severity: "error" });
      return;
    }
    setSaveConfirmOpen(true);
  };

  const canSave = draft.id > 0 ? canUpdate : canCreate;
  const totalCount = pageData.totalElements;
  const appliedCount = pageData.content.filter((row) => row.appliedYn === "Y").length;
  const notAppliedCount = pageData.content.filter((row) => row.appliedYn === "N").length;
  const expiringSoonCount = pageData.content.filter((row) => isExpiringSoon(row.validUntil, referenceDate) && row.appliedYn === "Y").length;

  return (
    <Box>
      <PageHeader title={T.managementTitle} />

      <SearchPanel
        keyword={keyword}
        keywordLabel={T.keywordLabel}
        keywordPlaceholder={T.keywordPlaceholder}
        onKeywordChange={setKeyword}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <ClientAutocompleteField onChange={setClientCode} sx={{ flex: "0 1 320px", minWidth: 320 }} value={clientCode} />
        <TextField
          label="기준일"
          onChange={(event) => setReferenceDate(dashedDate(event.target.value))}
          size="small"
          sx={standardFieldSx}
          type="date"
          value={referenceDate}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </SearchPanel>

      {!canRead ? (
        <Alert severity="warning">{T.noReadPermission}</Alert>
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" } }}>
            <SummaryCard icon={<ListAltOutlinedIcon />} label={T.totalCount} value={`${totalCount.toLocaleString("ko-KR")}건`} />
            <SummaryCard icon={<CheckCircleOutlineOutlinedIcon />} label={T.activeCount} value={`${appliedCount.toLocaleString("ko-KR")}건`} />
            <SummaryCard icon={<CancelOutlinedIcon />} label={T.notActiveCount} value={`${notAppliedCount.toLocaleString("ko-KR")}건`} />
            <SummaryCard icon={<ScheduleOutlinedIcon />} label={T.expiringSoon} value={`${expiringSoonCount.toLocaleString("ko-KR")}건`} />
          </Box>

          <Box sx={{ alignItems: "start", display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.15fr) minmax(440px, 0.85fr)" } }}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    {T.list}
                  </Typography>
                  <Chip label={`총 ${totalCount.toLocaleString("ko-KR")}건`} size="small" variant="outlined" />
                </Box>
                <EnterpriseDataGrid<ShinindoManagementRecord>
                  columns={columns}
                  getRowId={(row) => row.id}
                  loading={managementsQuery.isLoading || managementsQuery.isFetching}
                  onRowClick={(params: GridRowParams<ShinindoManagementRecord>) => setDraft(params.row)}
                  paginationMode="server"
                  rowCount={pageData.totalElements}
                  rows={pageData.content ?? EMPTY_ROWS}
                  showXlsxExportButton
                  hideFooter
                  wrapperMinHeight={620}
                  sx={{ height: 620, "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Box sx={{ alignItems: "center", display: "flex", gap: 0.5, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} variant="h6">
                      {T.detail}
                    </Typography>
                    <Tooltip title="발주청 정보가 없으면 발주처 관리에 등록한 후 사용하세요.">
                      <IconButton aria-label="발주청 안내" onClick={() => setClientGuidanceOpen((current) => !current)} size="small">
                        <HelpOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
                      {T.new}
                    </Button>
                    <Button disabled={!canSave || saveMutation.isPending} onClick={handleSaveClick} startIcon={<SaveOutlinedIcon />} variant="contained">
                      {T.save}
                    </Button>
                    <Button color="error" disabled={!canDelete || draft.id === 0 || deleteMutation.isPending} onClick={() => setDeleteTarget(draft)} startIcon={<DeleteOutlineOutlinedIcon />} variant="outlined">
                      {T.delete}
                    </Button>
                  </Stack>
                </Box>

                {clientGuidanceOpen ? (
                  <Alert severity="info" sx={{ mb: 1.5 }} variant="outlined">
                    발주청 정보가 없으면 발주처 관리에 등록한 후 사용하세요.
                  </Alert>
                ) : null}

                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                  <ClientAutocompleteField disabled={draft.id > 0} onChange={(value) => updateDraft("clientCode", value)} value={text(draft.clientCode)} />
                  <TextField label={T.appliedYn} onChange={(event) => updateDraft("appliedYn", event.target.value as "Y" | "N")} select size="small" sx={standardFieldSx} value={draft.appliedYn}>
                    <MenuItem value="Y">{T.active}</MenuItem>
                    <MenuItem value="N">{T.notActive}</MenuItem>
                  </TextField>
                  <TextField label={T.itemName} onChange={(event) => updateDraft("itemName", event.target.value)} required size="small" sx={{ ...standardFieldSx, gridColumn: "1 / -1" }} value={text(draft.itemName)} />
                  <TextField label={T.score} onChange={(event) => updateNumberDraft("score", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.score)} />
                  <TextField
                    label={T.acquiredDate}
                    disabled={text(draft.appliedYn) !== "Y"}
                    onChange={(event) => updateDraft("acquiredDate", event.target.value)}
                    size="small"
                    sx={standardFieldSx}
                    type="date"
                    value={dashedDate(draft.acquiredDate)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label={T.validUntil}
                    disabled={text(draft.appliedYn) !== "Y"}
                    onChange={(event) => updateDraft("validUntil", event.target.value)}
                    size="small"
                    sx={standardFieldSx}
                    type="date"
                    value={dashedDate(draft.validUntil)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField label={T.status} disabled size="small" sx={standardFieldSx} value={getValidityStatus(draft, referenceDate)} />
                  <TextField label={T.remark} minRows={4} multiline onChange={(event) => updateDraft("remark", event.target.value)} sx={{ gridColumn: "1 / -1" }} value={text(draft.remark)} />
                </Box>

                <AuditFields
                  createdAt={selectedRecord.createdAt}
                  createdBy={selectedRecord.createdId}
                  updatedAt={selectedRecord.lastChangedAt}
                  updatedBy={selectedRecord.lastChangedId}
                />

                <FileActionCard
                  attachmentTarget={fileOwnerId ? { attachmentType: SHININDO_MANAGEMENT_ATTACHMENT_TYPE, ownerId: fileOwnerId, ownerType: SHININDO_MANAGEMENT_ATTACHMENT_OWNER_TYPE } : undefined}
                  deleteDisabled={!canDelete}
                  description={fileOwnerId ? T.fileDescriptionExisting : T.fileDescriptionNew}
                  multiple
                  title={T.attachmentTitle}
                  uploadDisabled={!fileOwnerId || (!canCreate && !canUpdate)}
                  uploadLabel={T.addFile}
                />
              </CardContent>
            </Card>
          </Box>
        </Stack>
      )}

      <ConfirmActionDialog
        confirmLabel={T.save}
        loading={saveMutation.isPending}
        message={T.saveConfirm}
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={() => saveMutation.mutate()}
        open={saveConfirmOpen}
        targetLabel={draft.itemName}
        title={T.save}
      />

      <ConfirmDeleteDialog
        loading={deleteMutation.isPending}
        message="신인도 정보를 삭제하시겠습니까?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        open={Boolean(deleteTarget)}
        targetLabel={deleteTarget ? `${deleteTarget.clientName} - ${deleteTarget.itemName}` : ""}
        title={T.delete}
      />

      {notice ? (
        <Snackbar
          anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
          autoHideDuration={2500}
          onClose={() => setNotice(null)}
          open
        >
          <Alert onClose={() => setNotice(null)} severity={notice.severity} variant="filled">
            {notice.message}
          </Alert>
        </Snackbar>
      ) : null}
    </Box>
  );
}
