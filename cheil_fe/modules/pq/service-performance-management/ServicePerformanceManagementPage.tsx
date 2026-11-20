"use client";
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import type { GridColDef } from "@mui/x-data-grid";
import { AutoCompleteField } from "@/components/common/AutoCompleteField";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import type {
  ServicePerformanceImportFilters,
  ServicePerformanceImportRecord,
  ServicePerformanceImportRow,
} from "./api";
import { useServicePerformanceImport } from "./application/useServicePerformanceImport";
import { workTypeLabels, type ServicePerformanceWorkType } from "./domain/workType";
import {
  columns,
  readServicePerformanceExcel,
} from "./servicePerformanceExcel";

const numeric = new Set<string>([
  "serviceFeeThousand",
  "shareRate",
  "serviceAmountMillion",
  "score",
]);
const dates = new Set<string>([
  "serviceStartDate",
  "serviceEndDate",
  "evaluationEndDate",
]);
const emptyFilters = (): ServicePerformanceImportFilters => ({
  workType: "",
  client: "",
  serviceName: "",
  serviceCategory: "",
  detailField: "",
});
const workTypeOptions = Object.entries(workTypeLabels).map(([value, label]) => ({ value, label }));

function toWorkType(value: string): ServicePerformanceWorkType | "" {
  return value === "DESIGN" || value === "SUPERVISION" ? value : "";
}
const filterFields = [
  ["client", "발주청"],
  ["serviceCategory", "업역분류"],
  ["detailField", "세부분야"],
] as const;
const columnWidths: Record<string, number> = {
  constructionNo: 125,
  client: 200,
  serviceName: 320,
  serviceCategory: 150,
  detailField: 175,
  serviceFeeThousand: 145,
  serviceStartDate: 135,
  serviceEndDate: 135,
  shareRate: 105,
  serviceAmountMillion: 160,
  score: 100,
  evaluationEndDate: 135,
};
const excelGridColumns: GridColDef<ServicePerformanceImportRecord>[] = columns.map(
  ([field, label]) => ({
    field,
    headerName: label,
    width: columnWidths[field] ?? 150,
    align: [
      "constructionNo",
      "client",
      "serviceCategory",
      "detailField",
      "serviceStartDate",
      "serviceEndDate",
      "shareRate",
      "score",
      "evaluationEndDate",
    ].includes(field)
      ? "center"
      : undefined,
    headerAlign: [
      "constructionNo",
      "client",
      "serviceCategory",
      "detailField",
      "serviceStartDate",
      "serviceEndDate",
      "shareRate",
      "score",
      "evaluationEndDate",
    ].includes(field)
      ? "center"
      : undefined,
    valueFormatter: (value: unknown) => {
      if (
        dates.has(field) &&
        typeof value === "string" &&
        /^\d{8}$/.test(value)
      )
        return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
      if (numeric.has(field) && value != null)
        return Number(value).toLocaleString("ko-KR");
      return value ?? "";
    },
  }),
);
const gridColumns: GridColDef<ServicePerformanceImportRecord>[] = [
  {
    field: "workType",
    headerName: "업무 구분",
    width: 110,
    align: "center",
    headerAlign: "center",
    valueFormatter: (value: ServicePerformanceWorkType | null) =>
      value ? workTypeLabels[value] : "미지정",
  },
  ...excelGridColumns,
];

export function ServicePerformanceManagementPage() {
  const { canCreate, canRead } = useCurrentMenuPermission();
  const { showSnackbar } = useAppSnackbar();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [uploadWorkType, setUploadWorkType] = useState<ServicePerformanceWorkType | "">("");
  const [preview, setPreview] = useState<{
    filename: string;
    workType: ServicePerformanceWorkType;
    rows: ServicePerformanceImportRow[];
  } | null>(null);
  const isPreviewing = preview !== null;
  const previewRows = useMemo<ServicePerformanceImportRecord[]>(() =>
    preview?.rows.map((row, index) => ({
      ...row,
      id: index + 1,
      workType: preview.workType,
      uploadedAt: null,
      uploadedBy: null,
    })) ?? [], [preview]);
  const [parsing, setParsing] = useState(false);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<ServicePerformanceImportFilters>(emptyFilters);
  const [filters, setFilters] =
    useState<ServicePerformanceImportFilters>(emptyFilters);
  const { query, replacement } = useServicePerformanceImport(page, pageSize, filters, canRead, canCreate);
  const busy = parsing || replacement.isPending;
  const error = (reason: unknown) =>
    showSnackbar({
      message:
        reason instanceof Error
          ? reason.message
          : "처리 중 오류가 발생했습니다.",
      severity: "error",
    });
  const choose = async (file: File | undefined) => {
    if (!file || !uploadWorkType || !canCreate || busy) return;
    setParsing(true);
    try {
      const parsed = await readServicePerformanceExcel(file);
      setPreview({ filename: file.name, workType: uploadWorkType, rows: parsed });
      setPage(0);
      showSnackbar({
        message: `${parsed.length}건을 확인했습니다.`,
        severity: "success",
      });
    } catch (reason) {
      setPreview(null);
      error(reason);
    } finally {
      setParsing(false);
    }
  };
  const replace = async () => {
    if (!preview?.rows.length || busy) return;
    try {
      const count = await replacement.mutateAsync({ workType: preview.workType, rows: preview.rows });
      setPreview(null);
      setUploadWorkType("");
      setPage(0);
      showSnackbar({
        message: `${workTypeLabels[preview.workType]} 데이터를 ${count}건으로 교체했습니다.`,
        severity: "success",
      });
    } catch (reason) {
      error(reason);
    }
  };
  return (
    <Box>
      <PageHeader title="용역 수행성과 관리" />
      {!canRead ? (
        <Alert severity="warning">조회 권한이 없습니다.</Alert>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <SearchPanel
            keyword={draftFilters.serviceName}
            keywordLabel="용역명"
            keywordPlaceholder="용역명을 입력하세요"
            localKeyword={false}
            onKeywordChange={(value) =>
              setDraftFilters((current) => ({ ...current, serviceName: value }))
            }
            onSearch={(serviceName) => {
              setPage(0);
              setFilters({
                workType: draftFilters.workType,
                client: draftFilters.client.trim(),
                serviceName: serviceName.trim(),
                serviceCategory: draftFilters.serviceCategory.trim(),
                detailField: draftFilters.detailField.trim(),
              });
            }}
            onReset={() => {
              setDraftFilters(emptyFilters());
              setFilters(emptyFilters());
              setPage(0);
            }}
          >
            <AutoCompleteField
              mode="select"
              label="업무 구분"
              size="small"
              sx={{ minWidth: 116 }}
              options={workTypeOptions}
              includeAll
              value={draftFilters.workType}
              onChange={(value) =>
                setDraftFilters((current) => ({ ...current, workType: toWorkType(value) }))
              }
            />
            {filterFields.map(([field, label]) => (
              <TextField
                key={field}
                label={label}
                size="small"
                value={draftFilters[field]}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            ))}
          </SearchPanel>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  mb: 1,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "center" }}
                >
                  <Chip
                    label={`총 ${(query.data?.totalElements ?? 0).toLocaleString("ko-KR")}건`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    업로드 일시: {query.data?.content[0]?.uploadedAt
                      ? new Intl.DateTimeFormat("ko-KR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(query.data.content[0].uploadedAt))
                      : "정보 없음"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    업로드자: {query.data?.content[0]?.uploadedBy || "정보 없음"}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", flexWrap: "wrap" }}
                >
                  {preview && (
                    <Typography variant="body2" color="text.secondary">
                      {preview.filename} · {preview.rows.length}건
                    </Typography>
                  )}
                  <Button
                    component="a"
                    href="http://www.csi.go.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    startIcon={<OpenInNewOutlinedIcon />}
                  >
                    건설공사 안전관리 종합정보망
                  </Button>
                  <AutoCompleteField
                    mode="select"
                    label="업로드 업무 구분"
                    size="small"
                    fullWidth={false}
                    sx={{ minWidth: 155 }}
                    required
                    options={workTypeOptions}
                    value={uploadWorkType}
                    disabled={!canCreate || busy || isPreviewing}
                    onChange={(value) => setUploadWorkType(toWorkType(value))}
                  />
                  <Button
                    component="label"
                    variant="outlined"
                    disabled={!canCreate || busy || !uploadWorkType}
                    startIcon={<UploadFileOutlinedIcon />}
                  >
                    엑셀 업로드
                    <input
                      hidden
                      type="file"
                      accept=".xlsx"
                      disabled={!canCreate || busy || !uploadWorkType}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = "";
                        void choose(file);
                      }}
                    />
                  </Button>
                  {preview && (
                    <Button
                      disabled={busy}
                      onClick={() => {
                        setPreview(null);
                        setPage(0);
                      }}
                    >
                      미리보기 취소
                    </Button>
                  )}
                  {preview && preview.rows.length > 0 && (
                    <Button
                      variant="contained"
                      disabled={!canCreate || busy}
                      onClick={() => setReplaceConfirmOpen(true)}
                    >
                      데이터 교체
                    </Button>
                  )}
                </Stack>
              </Stack>
              <EnterpriseDataGrid<ServicePerformanceImportRecord>
                columns={gridColumns}
                rows={isPreviewing ? previewRows : query.data?.content ?? []}
                getRowId={(row) => row.id}
                getRowClassName={() => isPreviewing ? "excel-preview-row" : ""}
                loading={!isPreviewing && query.isFetching}
                paginationMode={isPreviewing ? "client" : "server"}
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                rowCount={isPreviewing ? previewRows.length : query.data?.totalElements ?? 0}
                pageSizeOptions={[25, 50, 100]}
                showXlsxExportButton
                showPageNumbers
                wrapperMinHeight={650}
                sx={{
                  height: 700,
                  ...(isPreviewing && {
                    "& .MuiDataGrid-row.excel-preview-row": {
                      backgroundColor: "#fff3bf !important",
                    },
                    "& .MuiDataGrid-row.excel-preview-row:hover": {
                      backgroundColor: "#ffe69c !important",
                    },
                  }),
                }}
              />
            </CardContent>
          </Card>
        </Stack>
      )}
      {replaceConfirmOpen && preview && (
        <ConfirmActionDialog
          open
          loading={busy}
          title="데이터 교체 확인"
          message={`기존 ‘${workTypeLabels[preview.workType]}’ 데이터를 삭제하고 ${preview.rows.length}건으로 교체하시겠습니까?`}
          confirmColor="warning"
          confirmLabel="교체"
          onClose={() => setReplaceConfirmOpen(false)}
          onConfirm={() => {
            setReplaceConfirmOpen(false);
            void replace();
          }}
        />
      )}
    </Box>
  );
}
