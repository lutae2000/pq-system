"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import { Autocomplete, Box, Chip, Paper, TextField, Typography } from "@mui/material";
import { GridActionsCellItem, type GridCellParams, type GridColDef, type GridPaginationModel, type GridRenderCellParams, type GridRenderEditCellParams, type GridValidRowModel } from "@mui/x-data-grid";
import { useMemo, useState, type ReactNode } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { markEditedMergedValues, PDF_MERGE_STATUS_FIELD } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionMerge";
import type { EngineerPdfExtraction, EngineerPdfExtractionRow } from "@/modules/pq/engineers/pdf-extraction/pdfExtractionApi";

type ExtractionGridRow = GridValidRowModel & {
  comparisonSide: "db" | "pdf" | "single";
  confidence: number;
  id: string;
  sourceRowNumber: number;
  values: Record<string, string>;
};

export const personnelSections = [
  { key: "licenses", label: "국가기술자격 · 자격증" },
  { key: "education", label: "학력" },
  { key: "career", label: "근무처 · 경력" },
  { key: "training", label: "교육훈련" },
  { key: "awards", label: "상훈" },
  { key: "sanctions", label: "벌점 및 제재사항" },
] as const;

const sectionColumns: Record<string, Array<{ field: string; headerName: string; minWidth?: number }>> = {
  licenses: [
    { field: "date_of_issue", headerName: "취득일", minWidth: 120 },
    { field: "license_code", headerName: "자격증명" },
    { field: "license_no", headerName: "자격증 번호" },
  ],
  education: [
    { field: "graduation_date", headerName: "졸업일", minWidth: 120 },
    { field: "schname", headerName: "학교명" },
    { field: "major", headerName: "전공" },
    { field: "career", headerName: "과정" },
    { field: "valid_major_yn", headerName: "관련학과", minWidth: 100 },
  ],
  training: [
    { field: "startdt", headerName: "시작일", minWidth: 120 },
    { field: "enddt", headerName: "종료일", minWidth: 120 },
    { field: "eduname", headerName: "교육훈련명" },
    { field: "organname", headerName: "기관" },
  ],
  awards: [
    { field: "dt", headerName: "수상일", minWidth: 120 },
    { field: "prizetag", headerName: "구분" },
    { field: "kind", headerName: "종류" },
    { field: "organname", headerName: "기관" },
    { field: "jobname", headerName: "사업명" },
    { field: "spec", headerName: "근거" },
  ],
  sanctions: [
    { field: "dt", headerName: "일자", minWidth: 120 },
    { field: "kind", headerName: "종류" },
    { field: "organname", headerName: "기관" },
    { field: "remark", headerName: "내용" },
  ],
  career: [
    { field: "entrydt", headerName: "입사일", minWidth: 120 },
    { field: "retiredt", headerName: "퇴사일", minWidth: 120 },
    { field: "compname", headerName: "근무처" },
  ],
  companyPerformances: [
    { field: "job_own_yn", headerName: "자사/타사", minWidth: 80 },
    { field: "job_name", headerName: "사업명", minWidth: 280 },
    { field: "business_type", headerName: "사업 유형", minWidth: 130 },
    { field: "job_type", headerName: "용역구분", minWidth: 140 },
    { field: "match_similarity", headerName: "사업명 유사도", minWidth: 120 },
    { field: "summary", headerName: "공사(용역)개요", minWidth: 260 },
    { field: "order_client", headerName: "발주처", minWidth: 180 },
    { field: "construction_type", headerName: "공사종류", minWidth: 160 },
    { field: "contract_amt_million", headerName: "공사(용역)금액(백만원)", minWidth: 190 },
    { field: "remark", headerName: "비고", minWidth: 220 },
  ],
  projectHistories: [
    { field: "seq", headerName: "회사실적 SEQ", minWidth: 110 },
    { field: "jobname", headerName: "사업명", minWidth: 260 },
    { field: "startdt", headerName: "참여시작일", minWidth: 120 },
    { field: "enddt", headerName: "참여종료일", minWidth: 120 },
    { field: "jobclass", headerName: "참여분야직위", minWidth: 160 },
    { field: "jobpart", headerName: "직무분야", minWidth: 120 },
    { field: "propart", headerName: "전문분야", minWidth: 130 },
    { field: "englevel", headerName: "등급", minWidth: 90 },
    { field: "compname", headerName: "참여회사", minWidth: 170 },
    { field: "deptname", headerName: "참여부서", minWidth: 140 },
    { field: "grade", headerName: "참여직급", minWidth: 110 },
    { field: "duty", headerName: "업무", minWidth: 150 },
    { field: "returnyn", headerName: "복귀", minWidth: 80 },
    { field: "joinyn", headerName: "참여", minWidth: 80 },
    { field: "remark", headerName: "비고", minWidth: 280 },
  ],
};

const dateFields = new Set(["date_of_issue", "graduation_date", "startdt", "enddt", "dt", "entrydt", "retiredt"]);
const amountFields = new Set(["contract_amt_million"]);
const selectFields = new Set(["business_type", "job_own_yn", "job_type"]);

function toStorageDate(value: unknown) {
  const normalized = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? normalized : String(value ?? "").trim();
}

function toDisplayDate(value: unknown) {
  const normalized = toStorageDate(value);
  return /^\d{8}$/.test(normalized)
    ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`
    : normalized;
}

function toDisplayAmount(value: unknown) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return normalized;
  const numberValue = Number(normalized.replaceAll(",", ""));
  return Number.isFinite(numberValue) ? numberValue.toLocaleString("ko-KR") : normalized;
}

export function normalizeExtractionSections(sections: EngineerPdfExtraction["sections"]) {
  return Object.fromEntries(
    Object.entries(sections).map(([key, rows]) => [
      key,
      rows.map((row) => ({
        ...row,
        values: {
          ...Object.fromEntries(
            Object.entries(row.values).map(([field, value]) => [field, dateFields.has(field) ? toStorageDate(value) : value]),
          ),
          ...(key === "education" ? { valid_major_yn: row.values.valid_major_yn?.trim() || "Y" } : {}),
          ...(key === "projectHistories" ? { returnyn: row.values.returnyn?.trim() || "Y" } : {}),
        },
      })),
    ]),
  );
}

export function SectionFrame({ title, count, actions, children }: { title: string; count?: number; actions?: ReactNode; children: ReactNode }) {
  return <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
    <Box sx={{ alignItems: "center", bgcolor: "rgba(15, 23, 42, 0.02)", borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", px: 1.25, py: 0.65 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
      <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
        {count === undefined ? null : <Chip size="small" label={`${count}건`} />}
        {actions}
      </Box>
    </Box>
    {children}
  </Paper>;
}

export function ExtractionGrid({ allowDeleteAll = false, height, onDeleteRow, onLinkRow, onRowsChange, sectionKey, rows, valueLabel, valueLabels }: {
  allowDeleteAll?: boolean;
  height?: number;
  onDeleteRow?: (rowNumber: number) => void;
  onLinkRow?: (rowNumber: number) => void;
  onRowsChange: (rows: EngineerPdfExtractionRow[]) => void;
  sectionKey: string;
  rows: EngineerPdfExtractionRow[];
  valueLabel?: { field: string; labels: ReadonlyMap<string, string> };
  valueLabels?: Readonly<Record<string, ReadonlyMap<string, string>>>;
}) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 100 });
  const gridRows = useMemo<ExtractionGridRow[]>(() => rows.flatMap<ExtractionGridRow>((row): ExtractionGridRow[] => {
    const base = { confidence: row.confidence, sourceRowNumber: row.rowNumber };
    if (row.values[PDF_MERGE_STATUS_FIELD] !== "update") {
      return [{ ...base, comparisonSide: "single" as const, id: String(row.rowNumber), values: row.values }];
    }
    const dbValues: Record<string, string> = { ...row.values, [PDF_MERGE_STATUS_FIELD]: "compare-db" };
    Object.entries(row.values).forEach(([field, value]) => {
      if (!field.startsWith("_db_")) return;
      const sourceField = field.slice(4);
      dbValues[`_pdf_${sourceField}`] = row.values[sourceField] ?? "";
      dbValues[sourceField] = value;
    });
    return [
      { ...base, comparisonSide: "db" as const, id: `${row.rowNumber}-db`, values: dbValues },
      { ...base, comparisonSide: "pdf" as const, id: `${row.rowNumber}-pdf`, values: row.values },
    ];
  }), [rows]);
  const hasMergeStatus = rows.some((row) => Boolean(row.values[PDF_MERGE_STATUS_FIELD]));
  const columns = useMemo<GridColDef<ExtractionGridRow>[]>(() => [
    { field: "id", headerName: "순번", width: 50, valueGetter: (_value: unknown, row: ExtractionGridRow) => row.sourceRowNumber },
    ...(hasMergeStatus ? [{
      field: "mergeStatus",
      headerName: "구분",
      width: 60,
      valueGetter: (_value: unknown, row: ExtractionGridRow) => row.comparisonSide === "db"
        ? "기존 DB"
        : row.values[PDF_MERGE_STATUS_FIELD] === "update" ? sectionKey === "companyPerformances" ? "업데이트" : "PDF 변경"
        : sectionKey === "companyPerformances" && row.values._manual_link === "Y" ? "검토 완료"
        : row.values[PDF_MERGE_STATUS_FIELD] === "excluded" ? "제외" : row.values[PDF_MERGE_STATUS_FIELD] === "insert" ? "신규" : sectionKey === "companyPerformances" ? "검토 필요" : "기존",
    }] : []),
    ...(sectionColumns[sectionKey] ?? []).map(({ field, headerName, minWidth }) => ({
      editable: true,
      field,
      headerName,
      flex: 1,
      minWidth: minWidth ?? 160,
      valueGetter: (_value: unknown, row: ExtractionGridRow) => {
        if (field === "valid_major_yn" || field === "returnyn") return row.values[field]?.trim() || "Y";
        const value = row.values[field] ?? "";
        if (field === "job_own_yn") return value.trim().toUpperCase() === "Y" ? "자사" : "타사";
        if (dateFields.has(field)) return toDisplayDate(value);
        if (amountFields.has(field)) return toDisplayAmount(value);
        const labels = valueLabels?.[field] ?? (valueLabel?.field === field ? valueLabel.labels : undefined);
        return labels?.get(value) ?? value;
      },
      valueSetter: (value: unknown, row: ExtractionGridRow) => {
        const textValue = String(value ?? "");
        const labels = valueLabels?.[field] ?? (valueLabel?.field === field ? valueLabel.labels : undefined);
        const resolvedCode = labels
          ? [...labels.entries()].find(([, label]) => label === textValue)?.[0] ?? textValue
          : textValue;
        return {
          ...row,
          values: {
            ...row.values,
            [field]: dateFields.has(field) ? toStorageDate(value) : amountFields.has(field) ? textValue.replaceAll(",", "").trim() : field === "job_own_yn" ? (textValue === "자사" || textValue.toUpperCase() === "Y" ? "Y" : "N") : resolvedCode,
            ...(sectionKey === "companyPerformances" && field === "job_type" ? { _manual_job_type: "Y" } : {}),
            ...(sectionKey === "projectHistories" && field === "compname" ? { compname_uncertain: "N" } : {}),
          },
        };
      },
      cellClassName: (params: GridCellParams<ExtractionGridRow>) => {
        const classes: string[] = [];
        if (params.row.comparisonSide !== "db" && sectionKey === "projectHistories" && field === "compname" && params.row.values.compname_uncertain === "Y") classes.push("pdf-company-uncertain");
        const dbValue = params.row.values[`_db_${field}`];
        const labels = valueLabels?.[field] ?? (valueLabel?.field === field ? valueLabel.labels : undefined);
        const displayDbValue = dateFields.has(field) ? toDisplayDate(dbValue) : amountFields.has(field) ? toDisplayAmount(dbValue) : labels?.get(dbValue) ?? dbValue;
        if (params.row.values[PDF_MERGE_STATUS_FIELD] === "update" && dbValue !== undefined && displayDbValue !== String(params.value ?? "")) classes.push("pdf-field-changed");
        const pdfValue = params.row.values[`_pdf_${field}`];
        const displayPdfValue = dateFields.has(field) ? toDisplayDate(pdfValue) : amountFields.has(field) ? toDisplayAmount(pdfValue) : labels?.get(pdfValue) ?? pdfValue;
        if (params.row.comparisonSide === "db" && pdfValue !== undefined && displayPdfValue !== String(params.value ?? "")) classes.push("pdf-field-db-changed");
        return classes.join(" ");
      },
      renderCell: (params: GridRenderCellParams<ExtractionGridRow>) => String(params.value ?? ""),
      renderEditCell: selectFields.has(field)
        ? (params: GridRenderEditCellParams<ExtractionGridRow, string>) => {
          const labels = valueLabels?.[field] ?? (valueLabel?.field === field ? valueLabel.labels : undefined);
          const options = field === "job_own_yn" ? ["타사", "자사"] : [...(labels?.values() ?? [])];
          return (
            <Autocomplete
              autoHighlight
              disableClearable
              fullWidth
              options={options}
              value={String(params.value ?? "")}
              onChange={(_, value) => void params.api.setEditCellValue({ id: params.id, field: params.field, value: value ?? "" })}
              renderInput={(inputParams) => <TextField {...inputParams} autoFocus size="small" />}
            />
          );
        }
        : field === "valid_major_yn"
        ? (params: GridRenderEditCellParams<ExtractionGridRow, string>) => (
          <Autocomplete
            autoHighlight
            freeSolo
            fullWidth
            options={["Y", "N"]}
            value={String(params.value ?? "Y")}
            onChange={(_, value) => void params.api.setEditCellValue({ id: params.id, field: params.field, value: value ?? "" })}
            onInputChange={(_, value, reason) => {
              if (reason === "input") void params.api.setEditCellValue({ id: params.id, field: params.field, value });
            }}
            renderInput={(inputParams) => <TextField {...inputParams} autoFocus size="small" />}
          />
        )
        : undefined,
    })),
    ...(onDeleteRow || onLinkRow ? [{
      field: "actions",
      type: "actions" as const,
      headerName: "작업",
      width: onDeleteRow && onLinkRow ? 110 : 70,
      getActions: ({ row }: { row: ExtractionGridRow }) => [
        ...(onLinkRow && row.comparisonSide !== "db"
          ? [<GridActionsCellItem key="link" icon={<ManageSearchOutlinedIcon />} label="기존 회사실적 검색 및 연결" onClick={() => onLinkRow(row.sourceRowNumber)} />]
          : []),
        ...(onDeleteRow ? [
          allowDeleteAll || row.values[PDF_MERGE_STATUS_FIELD] === "insert" || row.values[PDF_MERGE_STATUS_FIELD] === "update"
            ? <GridActionsCellItem key="discard" icon={<DeleteOutlineOutlinedIcon />} label="PDF 반영 대상에서 제외" onClick={() => onDeleteRow(row.sourceRowNumber)} />
            : <GridActionsCellItem key="keep" disabled icon={<span />} label="기존 데이터" />,
        ] : []),
      ],
    }] : []),
  ], [allowDeleteAll, hasMergeStatus, onDeleteRow, onLinkRow, sectionKey, valueLabel, valueLabels]);
  const processRowUpdate = (newRow: ExtractionGridRow) => {
    const currentRow = rows.find((row) => row.rowNumber === newRow.sourceRowNumber);
    const values = currentRow ? markEditedMergedValues(newRow.values, currentRow.values) : newRow.values;
    onRowsChange(rows.map((row) => row.rowNumber === newRow.sourceRowNumber ? { ...row, values } : row));
    return { ...newRow, values };
  };
  const rowHeight = 30;
  const gridHeight = height ?? 280;
  return <Box sx={{ height: gridHeight, minHeight: 0, minWidth: 0, overflow: "hidden" }}>
    <EnterpriseDataGrid<ExtractionGridRow>
      columns={columns}
      disableRowSelectionOnClick
      isCellEditable={({ row }) => row.comparisonSide !== "db"}
      onPaginationModelChange={setPaginationModel}
      pageSizeOptions={[10, 25, 50, 100]}
      pagination
      paginationModel={paginationModel}
      processRowUpdate={processRowUpdate}
      rows={gridRows}
      getRowHeight={() => rowHeight}
      getRowClassName={({ row }) => sectionKey === "projectHistories" && row.comparisonSide !== "db" && row.values.compname_uncertain === "Y"
        ? "pdf-project-review-needed"
        : row.values[PDF_MERGE_STATUS_FIELD] === "update" ? "pdf-merge-update"
        : row.comparisonSide === "db" ? "pdf-merge-db"
        : sectionKey === "companyPerformances" && Boolean(row.values._existing_seq) && row.values._manual_link !== "Y" ? "pdf-merge-review-needed"
        : row.values[PDF_MERGE_STATUS_FIELD] === "insert" ? "pdf-merge-insert" : ""}
      showPageNumbers
      wrapperMinHeight="100%"
      sx={{
        border: 0,
        height: "100%",
        minHeight: 0,
        "& .MuiDataGrid-virtualScroller": { overflow: "auto" },
        "& .pdf-company-uncertain": {
          backgroundColor: "rgba(255, 193, 7, 0.28)",
        },
        "& .MuiDataGrid-row.pdf-merge-update > .MuiDataGrid-cell": { backgroundColor: "rgba(244, 67, 54, 0.14) !important" },
        "& .MuiDataGrid-row.pdf-merge-db > .MuiDataGrid-cell": { backgroundColor: "rgba(33, 150, 243, 0.09) !important" },
        "& .MuiDataGrid-row.pdf-merge-insert > .MuiDataGrid-cell": { backgroundColor: "rgba(255, 193, 7, 0.2) !important" },
        "& .MuiDataGrid-row.pdf-merge-review-needed > .MuiDataGrid-cell": { backgroundColor: "rgba(198, 40, 40, 0.28) !important" },
        "& .MuiDataGrid-row.pdf-project-review-needed > .MuiDataGrid-cell": {
          backgroundColor: "rgba(123, 31, 162, 0.2) !important",
          borderBottomColor: "rgba(123, 31, 162, 0.45)",
        },
        "& .MuiDataGrid-cell.pdf-field-changed": {
          backgroundColor: "rgba(244, 67, 54, 0.24) !important",
          boxShadow: "inset 3px 0 0 #d32f2f",
        },
        "& .MuiDataGrid-cell.pdf-field-db-changed": {
          boxShadow: "inset 3px 0 0 #1976d2",
        },
      }}
    />
  </Box>;
}
