"use client";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import {
  listImportedServicePerformances,
  replaceImportedServicePerformances,
  type ServicePerformanceImportFilters,
  type ServicePerformanceImportRecord,
  type ServicePerformanceImportRow,
} from "./api";
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
  client: "",
  serviceName: "",
  serviceCategory: "",
  detailField: "",
});
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
const gridColumns: GridColDef<ServicePerformanceImportRecord>[] = columns.map(
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
export function ServicePerformanceManagementPage() {
  const { canCreate, canRead } = useCurrentMenuPermission();
  const { showSnackbar } = useAppSnackbar();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [rows, setRows] = useState<ServicePerformanceImportRow[]>([]);
  const [filename, setFilename] = useState("");
  const isPreviewing = Boolean(filename);
  const previewRows: ServicePerformanceImportRecord[] = rows.map((row, index) => ({
    ...row,
    id: index + 1,
    uploadedAt: null,
    uploadedBy: null,
  }));
  const [busy, setBusy] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<ServicePerformanceImportFilters>(emptyFilters);
  const [filters, setFilters] =
    useState<ServicePerformanceImportFilters>(emptyFilters);
  const query = useQuery({
    queryKey: ["service-performances", "imported", page, pageSize, filters],
    queryFn: () => listImportedServicePerformances(page, pageSize, filters),
    enabled: useTabQueryEnabled(canRead),
  });
  const error = (reason: unknown) =>
    showSnackbar({
      message:
        reason instanceof Error
          ? reason.message
          : "처리 중 오류가 발생했습니다.",
      severity: "error",
    });
  const choose = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = await readServicePerformanceExcel(file);
      setRows(parsed);
      setFilename(file.name);
      setPage(0);
      showSnackbar({
        message: `${parsed.length}건을 확인했습니다.`,
        severity: "success",
      });
    } catch (reason) {
      setRows([]);
      setFilename("");
      error(reason);
    }
  };
  const replace = async () => {
    if (
      !rows.length ||
      !window.confirm(
        `기존 데이터를 모두 삭제하고 ${rows.length}건으로 교체하시겠습니까?`,
      )
    )
      return;
    setBusy(true);
    try {
      const count = await replaceImportedServicePerformances(rows);
      setRows([]);
      setFilename("");
      if (input.current) input.current.value = "";
      setPage(0);
      await queryClient.invalidateQueries({
        queryKey: ["service-performances"],
      });
      showSnackbar({
        message: `${count}건으로 교체했습니다.`,
        severity: "success",
      });
    } catch (reason) {
      error(reason);
    } finally {
      setBusy(false);
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
                  {filename && (
                    <Typography variant="body2" color="text.secondary">
                      {filename} · {rows.length}건
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
                  <Button
                    component="label"
                    variant="outlined"
                    disabled={!canCreate || busy}
                    startIcon={<UploadFileOutlinedIcon />}
                  >
                    엑셀 업로드
                    <input
                      ref={input}
                      hidden
                      type="file"
                      accept=".xlsx"
                      onChange={(event) => void choose(event.target.files?.[0])}
                    />
                  </Button>
                  {rows.length > 0 && (
                    <Button
                      variant="contained"
                      disabled={!canCreate || busy}
                      onClick={() => void replace()}
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
    </Box>
  );
}
