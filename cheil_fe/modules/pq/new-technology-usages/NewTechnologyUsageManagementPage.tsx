"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import {
  createNewTechnologyUsage,
  deleteNewTechnologyUsage,
  getNewTechnologyUsage,
  listNewTechnologyUsages,
  NEW_TECHNOLOGY_USAGE_ATTACHMENT_OWNER_TYPE,
  NEW_TECHNOLOGY_USAGE_ATTACHMENT_TYPE,
  NEW_TECHNOLOGY_USAGE_PAGE_SIZE,
  updateNewTechnologyUsage,
  type NewTechnologyUsagePageResponse,
  type NewTechnologyUsageRecord,
  type NewTechnologyUsageRequest,
  type NewTechnologyUsageSearchParams,
} from "@/modules/pq/new-technology-usages/api";

const EMPTY_ROWS: NewTechnologyUsageRecord[] = [];

const emptyDraft = (): NewTechnologyUsageRecord => ({
  id: 0,
  designationNo: "",
  title: "",
  developers: "",
  projectName: "",
  client: "",
  noticeDate: "",
  usageExpirationDate: "",
  usageCount: null,
  amountThousand: null,
  score: null,
  summary: "",
  weight: null,
  disasterPreventionScore: null,
  remark: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

const emptyPage = (page: number, size: number): NewTechnologyUsagePageResponse => ({
  content: EMPTY_ROWS,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const text = (value: string | null | undefined) => value ?? "";
const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
const numberValue = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));
const compactDateValue = (value: string | null | undefined) => text(value).replaceAll("-", "").replace(/\D/g, "").slice(0, 8);
const formatCompactDate = (value: string | null | undefined) => {
  const compact = compactDateValue(value);
  return compact.length === 8 ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}` : text(value);
};
const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const calculateEvaluationScore = (score: number | null | undefined, weight: number | null | undefined) => {
  if (score === null || score === undefined || weight === null || weight === undefined) {
    return null;
  }

  const nextScore = Number(score);
  const nextWeight = Number(weight);
  if (!Number.isFinite(nextScore) || !Number.isFinite(nextWeight)) {
    return null;
  }

  return Math.round(nextScore * nextWeight * 100) / 100;
};
const formatInteger = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR");
const toUsageRequest = (draft: NewTechnologyUsageRecord): NewTechnologyUsageRequest => ({
  amountThousand: draft.amountThousand,
  client: text(draft.client).trim(),
  designationNo: text(draft.designationNo).trim(),
  developers: text(draft.developers).trim(),
  disasterPreventionScore: draft.disasterPreventionScore,
  noticeDate: compactDateValue(draft.noticeDate),
  projectName: text(draft.projectName).trim(),
  remark: text(draft.remark).trim(),
  score: draft.score,
  summary: text(draft.summary).trim(),
  weight: draft.weight,
  title: text(draft.title).trim(),
  usageCount: draft.usageCount,
  usageExpirationDate: compactDateValue(draft.usageExpirationDate),
});

export function NewTechnologyUsageManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [designationNo, setDesignationNo] = useState("");
  const [client, setClient] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = NEW_TECHNOLOGY_USAGE_PAGE_SIZE;
  const [draft, setDraft] = useState<NewTechnologyUsageRecord>(() => emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<NewTechnologyUsageRecord | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const { showSnackbar } = useAppSnackbar();

  const searchParams = useMemo<NewTechnologyUsageSearchParams>(
    () => ({ client, designationNo, keyword: appliedKeyword, noticeDateFrom: "", noticeDateTo: "", page, size: pageSize }),
    [appliedKeyword, client, designationNo, page, pageSize],
  );

  const usagesQuery = useQuery({
    queryKey: ["new-technology-usages", searchParams],
    queryFn: () => listNewTechnologyUsages(searchParams),
    enabled: tabQueryEnabled,
  });

  const selectedUsageId = draft.id;
  const detailQuery = useQuery({
    queryKey: ["new-technology-usage", selectedUsageId],
    queryFn: () => getNewTechnologyUsage(selectedUsageId),
    enabled: tabQueryEnabled && selectedUsageId > 0,
  });

  const pageData = usagesQuery.data ?? emptyPage(page, pageSize);
  const selectedRecord = detailQuery.data ?? draft;
  const paginationModel = useMemo(() => ({ page, pageSize }), [page, pageSize]);
  const currentPageScoreTotal = pageData.content.reduce((sum, row) => sum + Number(calculateEvaluationScore(row.score, row.weight) ?? 0), 0);
  const currentPageAmountTotal = pageData.content.reduce((sum, row) => sum + Number(row.amountThousand ?? 0), 0);
  const fileOwnerId = selectedUsageId > 0 ? selectedUsageId : "";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const request = toUsageRequest(draft);
      if (!request.designationNo) {
        throw new Error("지정번호를 입력해 주세요.");
      }
      if (!request.title) {
        throw new Error("명칭을 입력해 주세요.");
      }
      return draft.id > 0 ? updateNewTechnologyUsage(draft.id, request) : createNewTechnologyUsage(request);
    },
    onSuccess: async (saved) => {
      setDraft(saved);
      setSaveConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["new-technology-usages"] });
      await queryClient.invalidateQueries({ queryKey: ["new-technology-usage", saved.id] });
      showSnackbar({ message: "신인도 사용실적이 저장되었습니다.", severity: "success" });
    },
    onError: (error) => showSnackbar({ message: error instanceof Error ? error.message : "저장에 실패했습니다.", severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: NewTechnologyUsageRecord) => deleteNewTechnologyUsage(target.id),
    onSuccess: async () => {
      setDraft(emptyDraft());
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["new-technology-usages"] });
      showSnackbar({ message: "신인도 사용실적이 삭제되었습니다.", severity: "success" });
    },
    onError: (error) => showSnackbar({ message: error instanceof Error ? error.message : "삭제에 실패했습니다.", severity: "error" }),
  });

  const columns = useMemo<GridColDef<NewTechnologyUsageRecord>[]>(
    () => [
      { field: "designationNo", headerName: "지정번호", width: 90, align: "center", headerAlign: "center" },
      { field: "title", headerName: "명칭", minWidth: 300, flex: 1.4 },
      { field: "projectName", headerName: "공사명", minWidth: 220, flex: 1, valueGetter: (_value, row) => display(row.projectName) },
      { field: "client", headerName: "발주청", width: 150, valueGetter: (_value, row) => display(row.client) },
      { field: "noticeDate", headerName: "고시일", width: 115, align: "center", headerAlign: "center", valueGetter: (_value, row) => formatCompactDate(row.noticeDate) },
      { field: "usageExpirationDate", headerName: "사용 만료일", width: 120, align: "center", headerAlign: "center", valueGetter: (_value, row) => formatCompactDate(row.usageExpirationDate) },
      { field: "usageCount", headerName: "건수", width: 80, align: "right", headerAlign: "center", valueFormatter: (value) => formatInteger(value as number | null) },
      { field: "amountThousand", headerName: "금액", width: 120, align: "right", headerAlign: "center", valueFormatter: (value) => formatInteger(value as number | null) },
      { field: "score", headerName: "기준점수", width: 90, align: "right", headerAlign: "center", valueFormatter: (value) => formatNumber(value as number | null, 2) },
      { field: "weight", headerName: "가중치", width: 95, align: "right", headerAlign: "center", valueFormatter: (value) => formatNumber(value as number | null, 2) },
      {
        field: "evaluationScore",
        headerName: "평가점수",
        width: 100,
        align: "right",
        headerAlign: "center",
        valueGetter: (_value, row) => calculateEvaluationScore(row.score, row.weight),
        valueFormatter: (value) => formatNumber(value as number | null, 2),
      },
      { field: "disasterPreventionScore", headerName: "방재점수", width: 95, align: "right", headerAlign: "center", valueFormatter: (value) => formatNumber(value as number | null, 2) },
      { field: "summary", headerName: "내용", width: 220, valueGetter: (_value, row) => row.summary ?? "" },
    ],
    [],
  );

  const updateDraft = (field: keyof NewTechnologyUsageRecord, value: string | number | null) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateNumberDraft = (field: keyof NewTechnologyUsageRecord, value: string, integerOnly = false) => {
    updateDraft(field, value === "" ? null : integerOnly ? Math.trunc(Number(value)) : Number(value));
  };

  const updateDateDraft = (field: keyof NewTechnologyUsageRecord, value: string) => {
    updateDraft(field, compactDateValue(value));
  };

  const handleSearch = (nextKeyword: string) => {
    const normalizedKeyword = nextKeyword.trim();
    const shouldRefetch = page === 0 && appliedKeyword === normalizedKeyword;

    setPage(0);
    setAppliedKeyword(normalizedKeyword);

    if (shouldRefetch) {
      void usagesQuery.refetch();
    }
  };

  const handleReset = () => {
    const shouldRefetch = keyword === "" && appliedKeyword === "" && designationNo === "" && client === "" && page === 0;

    setKeyword("");
    setAppliedKeyword("");
    setDesignationNo("");
    setClient("");
    setPage(0);

    if (shouldRefetch) {
      void usagesQuery.refetch();
    }
  };

  const handleNew = () => {
    setDraft(emptyDraft());
  };

  const handleSaveClick = () => {
    if (draft.id > 0 && !canUpdate) {
      showSnackbar({ message: "신인도 사용실적 수정 권한이 없습니다.", severity: "error" });
      return;
    }
    if (draft.id === 0 && !canCreate) {
      showSnackbar({ message: "신인도 사용실적 등록 권한이 없습니다.", severity: "error" });
      return;
    }
    setSaveConfirmOpen(true);
  };

  const canSave = draft.id > 0 ? canUpdate : canCreate;

  return (
    <Box>
      <PageHeader
        title="신규 사용실적"
      />

      <SearchPanel
        keyword={keyword}
        keywordLabel="통합검색"
        keywordPlaceholder="품목명, 개발자, 공사명, 발주처, 내용"
        onKeywordChange={setKeyword}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <TextField label="지정번호" onChange={(event) => setDesignationNo(event.target.value)} size="small" sx={standardFieldSx} value={designationNo} />
        <TextField label="발주처" onChange={(event) => setClient(event.target.value)} size="small" sx={standardFieldSx} value={client} />
      </SearchPanel>

      {!canRead ? (
        <Alert severity="warning">신인도 사용실적 조회 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
            <SummaryBox label="전체 건수" value={`${pageData.totalElements.toLocaleString("ko-KR")}건`} />
            <SummaryBox label="현재 페이지 금액" value={`${formatInteger(currentPageAmountTotal)}천원`} />
            <SummaryBox label="현재 페이지 평가점수" value={formatNumber(currentPageScoreTotal, 2)} />
          </Box>

          <Box
            sx={{
              alignItems: "start",
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.25fr) minmax(460px, 0.75fr)" },
            }}
          >
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    사용실적 목록
                  </Typography>
                  <Chip label={`총 ${pageData.totalElements.toLocaleString("ko-KR")}건`} size="small" variant="outlined" />
                </Box>
                <EnterpriseDataGrid<NewTechnologyUsageRecord>
                  columns={columns}
                  getRowId={(row) => row.id}
                  loading={usagesQuery.isLoading || usagesQuery.isFetching}
                  onPaginationModelChange={(model) => {
                    setPage((currentPage) => (currentPage === model.page ? currentPage : model.page));
                  }}
                  onRowClick={(params: GridRowParams<NewTechnologyUsageRecord>) => setDraft(params.row)}
                  paginationMode="server"
                  paginationModel={paginationModel}
                  rowCount={pageData.totalElements}
                  rows={pageData.content ?? EMPTY_ROWS}
                  pageSizeOptions={[100]}
                  showXlsxExportButton
                  showPageNumbers
                  wrapperMinHeight={620}
                  sx={{ height: 620, "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    상세 정보
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="outlined">
                      신규
                    </Button>
                    <Button disabled={!canSave || saveMutation.isPending} onClick={handleSaveClick} startIcon={<SaveOutlinedIcon />} variant="contained">
                      저장
                    </Button>
                    <Button
                      color="error"
                      disabled={!canDelete || draft.id === 0 || deleteMutation.isPending}
                      onClick={() => setDeleteTarget(draft)}
                      startIcon={<DeleteOutlineOutlinedIcon />}
                      variant="outlined"
                    >
                      삭제
                    </Button>
                  </Stack>
                </Box>

                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                  <TextField label="지정번호" onChange={(event) => updateDraft("designationNo", event.target.value)} required size="small" sx={standardFieldSx} value={text(draft.designationNo)} />
                  <TextField label="발주청" onChange={(event) => updateDraft("client", event.target.value)} size="small" sx={standardFieldSx} value={text(draft.client)} />
                  <TextField label="명칭" onChange={(event) => updateDraft("title", event.target.value)} required size="small" sx={{ ...standardFieldSx, gridColumn: "1 / -1" }} value={text(draft.title)} />
                  <TextField label="개발자" onChange={(event) => updateDraft("developers", event.target.value)} size="small" sx={{ ...standardFieldSx, gridColumn: "1 / -1" }} value={text(draft.developers)} />
                  <TextField label="공사명" onChange={(event) => updateDraft("projectName", event.target.value)} size="small" sx={{ ...standardFieldSx, gridColumn: "1 / -1" }} value={text(draft.projectName)} />
                  <TextField label="고시일" onChange={(event) => updateDateDraft("noticeDate", event.target.value)} placeholder="YYYY-MM-DD" size="small" slotProps={{ htmlInput: { maxLength: 10 } }} sx={standardFieldSx} value={formatCompactDate(draft.noticeDate)} />
                  <TextField label="사용 만료일" onChange={(event) => updateDateDraft("usageExpirationDate", event.target.value)} placeholder="YYYY-MM-DD" size="small" slotProps={{ htmlInput: { maxLength: 10 } }} sx={standardFieldSx} value={formatCompactDate(draft.usageExpirationDate)} />
                  <TextField label="건수" onChange={(event) => updateNumberDraft("usageCount", event.target.value, true)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.usageCount)} />
                  <TextField label="금액" onChange={(event) => updateNumberDraft("amountThousand", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.amountThousand)} />
                  <TextField label="기준점수" onChange={(event) => updateNumberDraft("score", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.score)} />
                  <TextField label="가중치" onChange={(event) => updateNumberDraft("weight", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.weight)} />
                  <TextField
                    label="평가점수"
                    size="small"
                    sx={standardFieldSx}
                    type="number"
                    value={numberValue(calculateEvaluationScore(draft.score, draft.weight))}
                    slotProps={{ htmlInput: { readOnly: true, step: 0.01 } }}
                  />
                  <TextField label="방재점수" onChange={(event) => updateNumberDraft("disasterPreventionScore", event.target.value)} size="small" sx={standardFieldSx} type="number" value={numberValue(draft.disasterPreventionScore)} />
                  <TextField label="내용" minRows={4} multiline onChange={(event) => updateDraft("summary", event.target.value)} sx={{ gridColumn: "1 / -1" }} value={text(draft.summary)} />
                  <TextField label="비고" minRows={2} multiline onChange={(event) => updateDraft("remark", event.target.value)} sx={{ gridColumn: "1 / -1" }} value={text(draft.remark)} />
                </Box>

                <FileActionCard
                  attachmentTarget={fileOwnerId ? { attachmentType: NEW_TECHNOLOGY_USAGE_ATTACHMENT_TYPE, ownerId: fileOwnerId, ownerType: NEW_TECHNOLOGY_USAGE_ATTACHMENT_OWNER_TYPE } : undefined}
                  deleteDisabled={!canDelete}
                  description={fileOwnerId ? "신인도 사용실적 첨부파일을 관리합니다." : "저장 후 첨부파일을 등록할 수 있습니다."}
                  multiple
        title="신규 사용실적"
                  uploadDisabled={!fileOwnerId || (!canCreate && !canUpdate)}
                  uploadLabel="파일 추가"
                />

                <AuditFields
                    createdAt={selectedRecord.createdAt}
                    createdBy={selectedRecord.createdId}
                    updatedAt={selectedRecord.lastChangedAt}
                    updatedBy={selectedRecord.lastChangedId}
                />
              </CardContent>
            </Card>
          </Box>
        </Stack>
      )}

      <ConfirmActionDialog
        confirmLabel="저장"
        loading={saveMutation.isPending}
        message="신인도 사용실적을 저장하시겠습니까?"
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={() => saveMutation.mutate()}
        open={saveConfirmOpen}
        targetLabel={draft.title}
        title="신규 사용실적"
      />
      <ConfirmDeleteDialog
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        open={Boolean(deleteTarget)}
        targetLabel={deleteTarget?.title}
      />
    </Box>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, px: 2, py: 1.25 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, mt: 0.25 }} variant="h6">
        {value}
      </Typography>
    </Box>
  );
}
