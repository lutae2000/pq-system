"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRowParams } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { NotificationPreferenceButton } from "@/components/common/NotificationPreferenceButton";
import { AuditFields } from "@/components/common/AuditFields";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { FileActionCard } from "@/components/common/FileActionCard";
import { DateRangeField } from "@/components/common/DateRangeField";
import { standardFieldSx } from "@/components/common/FormControls";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { createTechnologyNotice } from "@/modules/system/notices/api";
import {
  createNewTechnologyDevelopment,
  deleteNewTechnologyDevelopment,
  getNewTechnologyDevelopment,
  listNewTechnologyDevelopments,
  NEW_TECHNOLOGY_ATTACHMENT_OWNER_TYPE,
  NEW_TECHNOLOGY_ATTACHMENT_TYPE,
  NEW_TECHNOLOGY_DEVELOPMENT_PAGE_SIZE,
  updateNewTechnologyDevelopment,
  type NewTechnologyDevelopmentPageResponse,
  type NewTechnologyDevelopmentRecord,
  type NewTechnologyDevelopmentRequest,
  type NewTechnologyDevelopmentSearchParams,
} from "@/modules/pq/new-technology-developments/api";

const EMPTY_ROWS: NewTechnologyDevelopmentRecord[] = [];
const TECHNOLOGY_TYPES = ["신기술", "특허", "신안"] as const;

const today = () => new Date().toISOString().slice(0, 10).replaceAll("-", "");

const emptyDraft = (): NewTechnologyDevelopmentRecord => ({
  id: 0,
  sequenceLabel: "",
  title: "",
  technologyType: "신기술",
  applicantCount: 1,
  useYn: true,
  applicationDate: "",
  elapsedYears: null,
  calculatedScore: null,
  targetField: "",
  applicationNo: "",
  registrationNo: "",
  validUntil: "",
  summary: "",
  remark: "",
  createdAt: null,
  createdId: null,
  lastChangedAt: null,
  lastChangedId: null,
});

const emptyPage = (page: number, size: number): NewTechnologyDevelopmentPageResponse => ({
  content: EMPTY_ROWS,
  page,
  size,
  totalElements: 0,
  totalPages: 0,
});

const text = (value: string | null | undefined) => value ?? "";
const compactDate = (value: string | null | undefined) => text(value).replace(/\D/g, "").slice(0, 8);
const formatGridDate = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "-";
};
const toDateInputValue = (value: string | null | undefined) => {
  const normalized = compactDate(value);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "";
};
const display = (value: string | null | undefined) => (value?.trim() ? value : "-");
const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? "-" : Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const calculateAutoScore = (
  technologyType: string | null | undefined,
  applicantCount: number | null | undefined,
  elapsedYears: number | null | undefined,
) => {
  if (applicantCount === null || applicantCount === undefined || applicantCount <= 0) {
    return null;
  }

  const normalizedType = text(technologyType).trim();
  const years = elapsedYears ?? 0;

  if (normalizedType === "신기술") {
    return Number((2 / applicantCount).toFixed(2));
  }

  let baseScore = 0;
  if (normalizedType === "특허") {
    baseScore = years < 5 ? 1 : years < 10 ? 0.8 : 0.6;
  } else if (normalizedType === "신안") {
    baseScore = years < 5 ? 0.5 : years < 10 ? 0.4 : 0;
  }

  return Number((baseScore / applicantCount).toFixed(2));
};

const getValidityLabel = (validUntil: string | null | undefined, referenceDate: string | null | undefined) => {
  const normalizedValidUntil = compactDate(validUntil);
  const normalizedReferenceDate = compactDate(referenceDate);

  if (normalizedValidUntil.length !== 8 || normalizedReferenceDate.length !== 8) {
    return "-";
  }

  return normalizedValidUntil >= normalizedReferenceDate ? "유효" : "만료";
};

const toDevelopmentRequest = (draft: NewTechnologyDevelopmentRecord): NewTechnologyDevelopmentRequest => ({
  applicantCount: draft.applicantCount,
  applicationDate: compactDate(draft.applicationDate),
  applicationNo: text(draft.applicationNo).trim(),
  calculatedScore: draft.calculatedScore,
  registrationNo: text(draft.registrationNo).trim(),
  remark: text(draft.remark).trim(),
  sequenceLabel: text(draft.sequenceLabel).trim(),
  summary: text(draft.summary).trim(),
  targetField: text(draft.targetField).trim(),
  technologyType: text(draft.technologyType).trim(),
  title: text(draft.title).trim(),
  validUntil: compactDate(draft.validUntil),
  useYn: draft.useYn,
});

export function NewTechnologyDevelopmentManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [technologyType, setTechnologyType] = useState("");
  const [useYn, setUseYn] = useState(true);
  const [targetField, setTargetField] = useState("");
  const [applicationDateFrom, setApplicationDateFrom] = useState("");
  const [applicationDateTo, setApplicationDateTo] = useState("");
  const [scoreReferenceDate, setScoreReferenceDate] = useState(today);
  const [page, setPage] = useState(0);
  const pageSize = NEW_TECHNOLOGY_DEVELOPMENT_PAGE_SIZE;
  const [draft, setDraft] = useState<NewTechnologyDevelopmentRecord>(() => emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<NewTechnologyDevelopmentRecord | null>(null);
  const { showSnackbar } = useAppSnackbar();

  const searchParams = useMemo<NewTechnologyDevelopmentSearchParams>(
    () => ({
      applicationDateFrom: compactDate(applicationDateFrom),
      applicationDateTo: compactDate(applicationDateTo),
      keyword: appliedKeyword,
      page,
      scoreReferenceDate: compactDate(scoreReferenceDate),
      size: pageSize,
      targetField,
      technologyType,
      useYn,
    }),
    [applicationDateFrom, applicationDateTo, appliedKeyword, page, pageSize, scoreReferenceDate, targetField, technologyType, useYn],
  );

  const developmentsQuery = useQuery({
    queryKey: ["new-technology-developments", searchParams],
    queryFn: () => listNewTechnologyDevelopments(searchParams),
    enabled: tabQueryEnabled,
  });

  const selectedDevelopmentId = draft.id;
  const detailQuery = useQuery({
    queryKey: ["new-technology-development", selectedDevelopmentId, scoreReferenceDate],
    queryFn: () => getNewTechnologyDevelopment(selectedDevelopmentId, scoreReferenceDate),
    enabled: tabQueryEnabled && selectedDevelopmentId > 0,
  });

  const pageData = developmentsQuery.data ?? emptyPage(page, pageSize);
  const selectedRecord = detailQuery.data ?? draft;
  const fileOwnerId = selectedDevelopmentId > 0 ? selectedDevelopmentId : "";
  const paginationModel = useMemo<GridPaginationModel>(() => ({ page, pageSize }), [page, pageSize]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const request = toDevelopmentRequest(draft);
      if (!request.title) {
        throw new Error("출원명을 입력하세요.");
      }
      if (!request.technologyType) {
        throw new Error("구분을 선택하세요.");
      }
      if (request.applicantCount === null || request.applicantCount <= 0) {
        throw new Error("출원인수는 0보다 커야 합니다.");
      }
      const created = draft.id === 0;
      const saved = created ? await createNewTechnologyDevelopment(request) : await updateNewTechnologyDevelopment(draft.id, request);
      return { created, saved };
    },
    onSuccess: async ({ created, saved }) => {
      setDraft(saved);
      await queryClient.invalidateQueries({ queryKey: ["new-technology-developments"] });
      await queryClient.invalidateQueries({ queryKey: ["new-technology-development", saved.id] });
      showSnackbar({ message: "신기술 개발실적을 저장했습니다.", severity: "success" });
      if (created) {
        try {
          await createTechnologyNotice({ title: "신기술 개발실적 신규 등록", content: `${saved.title} 개발실적이 등록되었습니다.`, targetPath: "/pq/new-technology-developments" });
          await queryClient.invalidateQueries({ queryKey: ["system-notices"] });
        } catch {
          showSnackbar({ message: "실적은 저장되었지만 알림 생성에 실패했습니다.", severity: "warning" });
        }
      }
    },
    onError: (error) => showSnackbar({ message: error instanceof Error ? error.message : "저장에 실패했습니다.", severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: NewTechnologyDevelopmentRecord) => deleteNewTechnologyDevelopment(target.id),
    onSuccess: async () => {
      setDraft(emptyDraft());
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["new-technology-developments"] });
      showSnackbar({ message: "신기술 개발실적을 삭제했습니다.", severity: "success" });
    },
    onError: (error) => showSnackbar({ message: error instanceof Error ? error.message : "삭제에 실패했습니다.", severity: "error" }),
  });

  const columns = useMemo<GridColDef<NewTechnologyDevelopmentRecord>[]>(
    () => [
      { field: "sequenceLabel", headerName: "\uc5f0\ubc88", width: 80, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.sequenceLabel ?? "" },
      { field: "targetField", headerName: "\uc801\uc6a9\ub300\uc0c1", width: 120, valueGetter: (_value, row) => row.targetField ?? "" },
      { field: "title", headerName: "\ucd9c\uc6d0\uba85", minWidth: 320, flex: 1.5 },
      {
        field: "technologyType",
        headerName: "\uad6c\ubd84",
        width: 95,
        renderCell: (params) => <Chip color={params.row.technologyType === "\uc2e0\uae30\uc220" ? "primary" : "default"} label={display(params.row.technologyType)} size="small" variant="outlined" />,
      },
      {
        field: "applicantCount",
        headerName: "\ucd9c\uc6d0\uc778 \uc218",
        width: 95,
        align: "right",
        headerAlign: "center",
        valueFormatter: (value) => (value === null || value === undefined ? "" : Number(value).toLocaleString("ko-KR")),
      },
      { field: "applicationDate", headerName: "\ucd9c\uc6d0\uc77c", width: 120, align: "center", headerAlign: "center", valueFormatter: (value) => formatGridDate(value as string | null) },
      { field: "validUntil", headerName: "\uc720\ud6a8\uae30\uac04", width: 120, align: "center", headerAlign: "center", valueFormatter: (value) => formatGridDate(value as string | null) },
      {
        field: "validityStatus",
        headerName: "\uc720\ud6a8\uc5ec\ubd80",
        width: 100,
        align: "center",
        headerAlign: "center",
        sortable: false,
        filterable: false,
        disableExport: true,
        valueGetter: (_value, row) => getValidityLabel(row.validUntil, scoreReferenceDate),
        renderCell: (params) => (
          <Chip
            color={params.value === "\uc720\ud6a8" ? "success" : params.value === "\ub9cc\ub8cc" ? "error" : "default"}
            label={params.value as string}
            size="small"
            variant={params.value === "유효" ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "elapsedYears",
        headerName: "\uacbd\uacfc\uae30\uac04(\ub144)",
        width: 120,
        align: "right",
        headerAlign: "center",
        valueFormatter: (value) => formatNumber(value as number | null, 2),
      },
      {
        field: "calculatedScore",
        headerName: "\uae30\uc900\uc810\uc218",
        width: 110,
        align: "right",
        headerAlign: "center",
        valueFormatter: (value) => formatNumber(value as number | null, 2),
      },
      {
        field: "autoCalculatedScore",
        headerName: "\uc790\ub3d9\uc0b0\uc815\uc810\uc218",
        width: 120,
        align: "right",
        headerAlign: "center",
        valueGetter: (_value, row) => calculateAutoScore(row.technologyType, row.applicantCount, row.elapsedYears),
        valueFormatter: (value) => formatNumber(value as number | null, 2),
      },
      { field: "applicationNo", headerName: "\ucd9c\uc6d0\ubc88\ud638", width: 150, valueGetter: (_value, row) => row.applicationNo ?? "" },
      { field: "registrationNo", headerName: "\ub4f1\ub85d\ubc88\ud638", width: 130, valueGetter: (_value, row) => row.registrationNo ?? "" },
      { field: "summary", headerName: "\ub0b4\uc6a9", width: 220, valueGetter: (_value, row) => row.summary ?? "" },
    ],
    [scoreReferenceDate],
  ).map<GridColDef<NewTechnologyDevelopmentRecord>>((column) => ({
    ...column,
    align: column.align ?? "center",
    headerAlign: column.headerAlign ?? "center",
  }));

  const updateDraft = (field: keyof NewTechnologyDevelopmentRecord, value: string | number | boolean | null) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = (nextKeyword: string) => {
    const normalizedKeyword = nextKeyword.trim();
    const shouldRefetch = page === 0 && appliedKeyword === normalizedKeyword;

    setPage(0);
    setAppliedKeyword(normalizedKeyword);

    if (shouldRefetch) {
      void developmentsQuery.refetch();
    }
  };

  const handleReset = () => {
    const nextScoreReferenceDate = today();
    const shouldRefetch =
      keyword === "" &&
      appliedKeyword === "" &&
      technologyType === "" &&
      useYn &&
      targetField === "" &&
      applicationDateFrom === "" &&
      applicationDateTo === "" &&
      scoreReferenceDate === nextScoreReferenceDate &&
      page === 0;

    setKeyword("");
    setAppliedKeyword("");
    setTechnologyType("");
    setUseYn(true);
    setTargetField("");
    setApplicationDateFrom("");
    setApplicationDateTo("");
    setScoreReferenceDate(nextScoreReferenceDate);
    setPage(0);

    if (shouldRefetch) {
      void developmentsQuery.refetch();
    }
  };

  const handleNew = () => {
    setDraft(emptyDraft());
  };

  const handleSave = () => {
    if (draft.id > 0 && !canUpdate) {
      showSnackbar({ message: "신기술 개발실적을 수정할 권한이 없습니다.", severity: "error" });
      return;
    }
    if (draft.id === 0 && !canCreate) {
      showSnackbar({ message: "신기술 개발실적을 등록할 권한이 없습니다.", severity: "error" });
      return;
    }
    saveMutation.mutate();
  };

  const canSave = draft.id > 0 ? canUpdate : canCreate;

  return (
    <Box>
      <PageHeader title="신기술 개발실적" action={<NotificationPreferenceButton menuPath="/pq/new-technology-developments" />} />

      <SearchPanel
        keyword={keyword}
        keywordLabel="검색어"
        keywordPlaceholder="출원명, 출원번호, 등록번호, 내용"
        onKeywordChange={setKeyword}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      >
        <TextField label="구분" onChange={(event) => setTechnologyType(event.target.value)} select size="small" sx={standardFieldSx} value={technologyType}>
          <MenuItem value="">전체</MenuItem>
          {TECHNOLOGY_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="사용여부" onChange={(event) => setUseYn(event.target.value === "Y")} select size="small" sx={standardFieldSx} value={useYn ? "Y" : "N"}>
          <MenuItem value="Y">사용</MenuItem>
          <MenuItem value="N">미사용</MenuItem>
        </TextField>
        <TextField
          label="공고일"
          onChange={(event) => setScoreReferenceDate(compactDate(event.target.value))}
          placeholder="YYYYMMDD"
          size="small"
          slotProps={{ htmlInput: { maxLength: 8 } }}
          sx={standardFieldSx}
          value={compactDate(scoreReferenceDate)}
        />
        <TextField label="적용대상" onChange={(event) => setTargetField(event.target.value)} size="small" sx={standardFieldSx} value={targetField} />
        <div aria-hidden style={{ flex: "0 0 100%", minWidth: "100%", width: "100%" }} />
        <DateRangeField
          endValue={toDateInputValue(applicationDateTo)}
          label="출원일"
          onEndChange={(value) => setApplicationDateTo(compactDate(value))}
          onStartChange={(value) => setApplicationDateFrom(compactDate(value))}
          startValue={toDateInputValue(applicationDateFrom)}
          sx={{ minWidth: { xs: "100%", sm: 340 }, width: "100%" }}
        />
      </SearchPanel>

      {!canRead ? (
        <Alert severity="warning">신기술 개발실적을 조회할 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2}>
          <Box
            sx={{
              alignItems: "start",
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(380px, 0.65fr)" },
            }}
          >
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    개발실적 목록
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    *산정점수는 현 날짜 기준 산정
                  </Typography>
                </Box>
                <EnterpriseDataGrid<NewTechnologyDevelopmentRecord>
                  columns={columns}
                  getRowId={(row) => row.id}
                  loading={developmentsQuery.isLoading || developmentsQuery.isFetching}
                  onPaginationModelChange={(model) => {
                    setPage((currentPage) => (currentPage === model.page ? currentPage : model.page));
                  }}
                  onRowClick={(params: GridRowParams<NewTechnologyDevelopmentRecord>) => setDraft(params.row)}
                  paginationMode="server"
                  paginationModel={paginationModel}
                  rowCount={pageData.totalElements}
                  rows={pageData.content ?? EMPTY_ROWS}
                  pageSizeOptions={[pageSize]}
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
                    <Button disabled={!canSave || saveMutation.isPending} onClick={handleSave} startIcon={<SaveOutlinedIcon />} variant="contained">
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
                  <TextField label="연번" onChange={(event) => updateDraft("sequenceLabel", event.target.value)} size="small" sx={standardFieldSx} value={text(draft.sequenceLabel)} />
                  <TextField label="구분" onChange={(event) => updateDraft("technologyType", event.target.value)} required select size="small" sx={standardFieldSx} value={text(draft.technologyType)}>
                    {TECHNOLOGY_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="적용대상"
                    onChange={(event) => updateDraft("targetField", event.target.value)}
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ ...standardFieldSx, gridColumn: "1 / -1" }}
                    value={draft.targetField}
                  />
                  <TextField label="출원명" onChange={(event) => updateDraft("title", event.target.value)} required size="small" sx={{ ...standardFieldSx, gridColumn: "1 / -1" }} value={text(draft.title)} />
                  <TextField label="출원인수" onChange={(event) => updateDraft("applicantCount", event.target.value === "" ? null : Number(event.target.value))} required size="small" sx={standardFieldSx} type="number" value={draft.applicantCount ?? ""} />
                  <TextField
                    label="자동산정"
                    disabled
                    size="small"
                    sx={standardFieldSx}
                    value={formatNumber(calculateAutoScore(selectedRecord.technologyType, selectedRecord.applicantCount, selectedRecord.elapsedYears), 2)}
                  />
                  <TextField
                    label="기준점수"
                    onChange={(event) => updateDraft("calculatedScore", event.target.value === "" ? null : Number(event.target.value))}
                    size="small"
                    sx={standardFieldSx}
                    type="number"
                    value={draft.calculatedScore ?? ""}
                  />
                  <TextField label="사용여부" onChange={(event) => updateDraft("useYn", event.target.value === "Y")} select size="small" sx={standardFieldSx} value={draft.useYn ? "Y" : "N"}>
                    <MenuItem value="Y">사용</MenuItem>
                    <MenuItem value="N">미사용</MenuItem>
                  </TextField>
                  <TextField label="출원번호" onChange={(event) => updateDraft("applicationNo", event.target.value)} size="small" sx={standardFieldSx} value={text(draft.applicationNo)} />
                  <TextField label="등록번호" onChange={(event) => updateDraft("registrationNo", event.target.value)} size="small" sx={standardFieldSx} value={text(draft.registrationNo)} />
                  <TextField
                      label="출원일"
                      onChange={(event) => updateDraft("applicationDate", compactDate(event.target.value))}
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={standardFieldSx}
                      type="date"
                      value={toDateInputValue(draft.applicationDate)}
                  />
                  <TextField
                    label="유효기간"
                    onChange={(event) => updateDraft("validUntil", compactDate(event.target.value))}
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={standardFieldSx}
                    type="date"
                    value={toDateInputValue(draft.validUntil)}
                  />
                  <TextField label="내용" minRows={5} multiline onChange={(event) => updateDraft("summary", event.target.value)} sx={{ gridColumn: "1 / -1" }} value={text(draft.summary)} />
                  <TextField label="비고" minRows={3} multiline onChange={(event) => updateDraft("remark", event.target.value)} sx={{ gridColumn: "1 / -1" }} value={text(draft.remark)} />
                </Box>



                <FileActionCard
                  attachmentTarget={fileOwnerId ? { attachmentType: NEW_TECHNOLOGY_ATTACHMENT_TYPE, ownerId: fileOwnerId, ownerType: NEW_TECHNOLOGY_ATTACHMENT_OWNER_TYPE } : undefined}
                  deleteDisabled={!canDelete}
                  description={fileOwnerId ? "관련 증빙 파일을 관리합니다." : "저장 후 첨부파일을 등록할 수 있습니다."}
                  multiple
                  title="첨부파일"
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
 
