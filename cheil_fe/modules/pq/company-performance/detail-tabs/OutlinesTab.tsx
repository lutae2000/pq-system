"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, MenuItem, TextField } from "@mui/material";
import {
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  type DataGridProps,
  type GridColDef,
  type GridRowModesModel,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { EnterpriseDataGrid, type EnterpriseRowActionConfirm } from "@/components/common/EnterpriseDataGrid";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { listCommonCodes, type CommonCodeRecord } from "@/modules/code/common-codes/api";
import { formatReferenceLabel, toSelectOptions } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options } from "@/modules/common/reference/useReferenceOptions";
import {
  createCompanyPerformanceOutline,
  deleteCompanyPerformanceOutline,
  listCompanyPerformanceOutlines,
  updateCompanyPerformanceOutline,
  type CompanyPerformanceOutlineRecord,
  type CompanyPerformanceOutlineRequest,
  type CompanyPerformanceRecord,
} from "@/modules/pq/company-performance/api";
import { display, displayTarget, tempId, text, toNullableNumber, type CodeOption } from "@/modules/pq/company-performance/detail-tabs/detailTabUtils";

type OutlinesTabProps = {
  readOnly?: boolean;
  record: CompanyPerformanceRecord;
  requestConfirmation: (action: EnterpriseRowActionConfirm) => void;
};

type OutlineCommonCodeMeta = {
  ddlbGroupCode?: unknown;
  ddlbYn?: unknown;
  subcateUnit?: unknown;
};

const parseOutlineCommonCodeMeta = (refValue1: string | null): OutlineCommonCodeMeta => {
  if (!refValue1) {
    return {};
  }

  try {
    const parsed = JSON.parse(refValue1);
    return parsed && typeof parsed === "object" ? parsed as OutlineCommonCodeMeta : {};
  } catch {
    return {};
  }
};

const metadataText = (value: unknown) => (typeof value === "string" ? value : "");

const outlineGroupSeqFromCategoryCode = (categoryCode: string) => {
  const parsed = Number.parseInt(categoryCode.replace(/^\D+/, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const listOutlineDetailCodes = (categoryCode: string) =>
  listCommonCodes({
    codeLevel: 3,
    level1Code: "PQCT",
    level2Code: categoryCode,
    refValue1Contains: "\"ddlbHeadYn\":\"Y\"",
    sort: "level3Code",
    useYn: "Y",
  });

const toOutlineRequest = (row: CompanyPerformanceOutlineRecord): CompanyPerformanceOutlineRequest => ({
  categoryCode: text(row.categoryCode) || null,
  categoryName: text(row.categoryName) || null,
  ddlbGroupCode: text(row.ddlbGroupCode) || null,
  ddlbYn: text(row.ddlbYn).toUpperCase() === "Y" ? "Y" : "N",
  outlineContent: text(row.outlineContent) || null,
  outlineGroupSeq: toNullableNumber(row.outlineGroupSeq),
  outlineLineSeq: toNullableNumber(row.outlineLineSeq),
  sortSeq: toNullableNumber(row.sortSeq),
  subcategoryCode: text(row.subcategoryCode) || null,
  subcategoryName: text(row.subcategoryName) || null,
  subcategoryUnit: text(row.subcategoryUnit) || null,
});

export function OutlinesTab({ readOnly = false, record, requestConfirmation }: OutlinesTabProps) {
  const queryClient = useQueryClient();
  const { canCreate, canDelete, canUpdate } = useCurrentMenuPermission();
  const [newRows, setNewRows] = useState<CompanyPerformanceOutlineRecord[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [selectedCategoryCode, setSelectedCategoryCode] = useState("");

  const outlinesQuery = useQuery({
    queryKey: ["company-performance-outlines", record.seq],
    queryFn: () => listCompanyPerformanceOutlines(record.seq),
    enabled: Boolean(record.seq),
  });
  const outlineCategoryReferences = useCommonCodeLevel2Options(
    "PQCT",
    { level2CodePrefix: "Z", level3Code: "", useYn: "Y" },
    undefined,
    "level2Code",
  );

  const outlineCategoryOptions = useMemo<CodeOption[]>(
    () => toSelectOptions(outlineCategoryReferences.options),
    [outlineCategoryReferences.options],
  );
  const outlineCategoryNameByCode = outlineCategoryReferences.labelByValue;

  const rows = useMemo(
    () => [...newRows, ...(outlinesQuery.data ?? [])],
    [newRows, outlinesQuery.data],
  );

  const invalidateOutlines = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["company-performance-outlines", record.seq] }),
    [queryClient, record.seq],
  );

  const saveMutation = useMutation({
    mutationFn: async (row: CompanyPerformanceOutlineRecord) => {
      if (!record.seq) {
        throw new Error("회사 실적 저장 후 공사개요를 등록할 수 있습니다.");
      }
      if (row.isNew && !canCreate) {
        throw new Error("공사개요를 등록할 권한이 없습니다.");
      }
      if (!row.isNew && !canUpdate) {
        throw new Error("공사개요를 수정할 권한이 없습니다.");
      }
      const requestBody = toOutlineRequest(row);
      return row.isNew ? createCompanyPerformanceOutline(record.seq, requestBody) : updateCompanyPerformanceOutline(record.seq, row.id, requestBody);
    },
    onSuccess: (_saved, row) => {
      setNewRows((current) => current.filter((item) => item.id !== row.id));
      void invalidateOutlines();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      if (!record.seq) {
        throw new Error("회사 실적 저장 후 공사개요를 삭제할 수 있습니다.");
      }
      if (!canDelete) {
        throw new Error("공사개요를 삭제할 권한이 없습니다.");
      }
      return deleteCompanyPerformanceOutline(record.seq, id);
    },
    onSuccess: () => {
      void invalidateOutlines();
    },
  });

  const createOutlineRowsFromCodes = useCallback(
    (categoryCode: string, detailCodes: CommonCodeRecord[], baseRowCount: number) => {
      const categoryName = formatReferenceLabel(outlineCategoryNameByCode, categoryCode) || (detailCodes[0]?.codeName ?? "");
      const outlineGroupSeq = outlineGroupSeqFromCategoryCode(categoryCode);
      const rowIdBase = Date.now();

      return detailCodes.map((code, index): CompanyPerformanceOutlineRecord => {
        const metadata = parseOutlineCommonCodeMeta(code.refValue1);
        return {
          categoryCode,
          categoryName,
          ddlbGroupCode: metadataText(metadata.ddlbGroupCode),
          ddlbYn: metadataText(metadata.ddlbYn).toUpperCase() === "Y" ? "Y" : "N",
          id: -(rowIdBase + index),
          isNew: true,
          outlineContent: "",
          outlineGroupSeq,
          outlineLineSeq: index + 1,
          seq: record.seq,
          sortSeq: baseRowCount + index + 1,
          subcategoryCode: code.level3Code,
          subcategoryName: code.codeDetailName ?? "",
          subcategoryUnit: metadataText(metadata.subcateUnit),
        };
      });
    },
    [outlineCategoryNameByCode, record.seq],
  );

  const appendOutlineRowsFromCodes = useCallback(
    (categoryCode: string, detailCodes: CommonCodeRecord[], excludedRowId?: number) => {
      if (detailCodes.length === 0) {
        return;
      }

      const retainedRows = newRows.filter((row) => text(row.categoryCode) !== categoryCode && row.id !== excludedRowId);
      const baseRowCount = retainedRows.length + (outlinesQuery.data?.length ?? 0);
      const generatedRows = createOutlineRowsFromCodes(categoryCode, detailCodes, baseRowCount);
      setNewRows([...generatedRows, ...retainedRows]);
    },
    [createOutlineRowsFromCodes, newRows, outlinesQuery.data],
  );

  const outlineDetailCodesMutation = useMutation({
    mutationFn: listOutlineDetailCodes,
    onSuccess: (detailCodes, categoryCode) => {
      appendOutlineRowsFromCodes(categoryCode, detailCodes);
    },
  });

  const confirmProcessRowUpdate = useCallback(
    (row: CompanyPerformanceOutlineRecord): Omit<EnterpriseRowActionConfirm, "onConfirm"> => ({
        confirmColor: "primary",
        confirmLabel: row.isNew ? "등록" : "수정",
        message: row.isNew ? "공사개요를 등록하시겠습니까?" : "공사개요를 수정하시겠습니까?",
        targetLabel: displayTarget(row.subcategoryName || row.categoryName, row.isNew ? "신규 공사개요" : String(row.id)),
        title: row.isNew ? "공사개요 등록" : "공사개요 수정",
      }),
    [],
  );

  const confirmDeleteRow = useCallback(
    (row: CompanyPerformanceOutlineRecord) => {
      requestConfirmation({
        confirmColor: "error",
        confirmLabel: "삭제",
        message: "공사개요를 삭제하시겠습니까?",
        targetLabel: displayTarget(row.subcategoryName || row.categoryName, String(row.id)),
        title: "공사개요 삭제",
        onConfirm: () => deleteMutation.mutateAsync(row.id),
      });
    },
    [deleteMutation, requestConfirmation],
  );

  const handleOutlineCategoryChange = (categoryCode: string) => {
    setSelectedCategoryCode(categoryCode);
    if (!categoryCode || !record.seq || !canCreate) {
      return;
    }

    outlineDetailCodesMutation.mutate(categoryCode);
  };

  const addRow = () => {
    const id = tempId();
    const defaultCategory = outlineCategoryReferences.options[0];
    const newRow: CompanyPerformanceOutlineRecord = {
      categoryCode: defaultCategory?.value ?? "",
      categoryName: defaultCategory?.label ?? "",
      ddlbGroupCode: "",
      ddlbYn: "N",
      id,
      isNew: true,
      outlineContent: "",
      outlineGroupSeq: null,
      outlineLineSeq: null,
      seq: record.seq,
      sortSeq: rows.length + 1,
      subcategoryCode: "",
      subcategoryName: "",
      subcategoryUnit: "",
    };
    setNewRows((current) => [newRow, ...current]);
    setRowModesModel((current) => ({ ...current, [id]: { mode: GridRowModes.Edit, fieldToFocus: defaultCategory ? "subcategoryName" : "categoryCode" } }));
  };

  const handleRowEditStop: NonNullable<DataGridProps<CompanyPerformanceOutlineRecord>["onRowEditStop"]> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
      return;
    }

    if (params.reason === GridRowEditStopReasons.escapeKeyDown) {
      setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
      setNewRows((current) => current.filter((row) => row.id !== params.id));
    }
  };

  const handleNewRowEditCancel = (
    row: CompanyPerformanceOutlineRecord,
    params: { reason?: GridRowEditStopReasons },
  ) => {
    if (params.reason !== GridRowEditStopReasons.rowFocusOut || !row.isNew) {
      return;
    }

    if (
      text(row.ddlbGroupCode) ||
      text(row.outlineContent) ||
      text(row.subcategoryCode) ||
      text(row.subcategoryName) ||
      text(row.subcategoryUnit)
    ) {
      return false;
    }

    setRowModesModel((current) => {
      const next = { ...current };
      delete next[String(row.id)];
      return next;
    });
    setNewRows((current) => current.filter((item) => item.id !== row.id));
    return true;
  };

  const shouldShowGroupSeq = useCallback((row: CompanyPerformanceOutlineRecord) => {
    const rowIndex = rows.findIndex((item) => item.id === row.id);
    if (rowIndex <= 0) {
      return true;
    }
    return rows[rowIndex - 1].outlineGroupSeq !== row.outlineGroupSeq;
  }, [rows]);

  const shouldShowCategoryName = useCallback((row: CompanyPerformanceOutlineRecord) => {
    const rowIndex = rows.findIndex((item) => item.id === row.id);
    if (rowIndex <= 0) {
      return true;
    }
    const previous = rows[rowIndex - 1];
    return previous.outlineGroupSeq !== row.outlineGroupSeq || previous.categoryName !== row.categoryName;
  }, [rows]);

  const columns = useMemo<GridColDef<CompanyPerformanceOutlineRecord>[]>(
    () => [
      {
        field: "outlineGroupSeq",
        headerName: "공사종류번호",
        width: 110,
        align: "right",
        editable: false,
        headerAlign: "right",
        renderCell: (params) => (shouldShowGroupSeq(params.row) ? display(params.row.outlineGroupSeq) : ""),
        type: "number",
      },
      {
        field: "categoryCode",
        headerName: "공사종류",
        width: 130,
        editable: true,
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        renderCell: (params) =>
          shouldShowCategoryName(params.row)
            ? display(formatReferenceLabel(outlineCategoryNameByCode, params.row.categoryCode) || params.row.categoryName)
            : "",
        type: "singleSelect",
        valueOptions: outlineCategoryOptions,
        valueSetter: (value, row) => {
          const categoryCode = text(String(value ?? ""));
          return {
            ...row,
            categoryCode,
            categoryName: formatReferenceLabel(outlineCategoryNameByCode, categoryCode),
          };
        },
      },
      { field: "subcategoryName", headerName: "공사상세", width: 150, editable: true, renderCell: (params) => display(params.row.subcategoryName) },
      { field: "subcategoryUnit", headerName: "측량기준", width: 95, editable: true, renderCell: (params) => display(params.row.subcategoryUnit) },
      { field: "outlineContent", headerName: "측량수치", minWidth: 150, flex: 1, editable: true, renderCell: (params) => display(params.row.outlineContent) },
      {
        field: "actions",
        type: "actions",
        headerName: "관리",
        width: 96,
        getActions: (params) => {
          const rowIsEditing = rowModesModel[params.id]?.mode === GridRowModes.Edit;
          if (rowIsEditing) {
            return [
              <GridActionsCellItem
                color="primary"
                disabled={params.row.isNew ? !canCreate : !canUpdate}
                icon={<SaveOutlinedIcon />}
                key="save"
                label="저장"
                onClick={() => setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View } }))}
              />,
              <GridActionsCellItem
                color="inherit"
                icon={<CancelOutlinedIcon />}
                key="cancel"
                label="취소"
                onClick={() => {
                  setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
                  if (params.row.isNew) {
                    setNewRows((current) => current.filter((row) => row.id !== params.row.id));
                  }
                }}
              />,
            ];
          }

          return [
            <GridActionsCellItem
              color="inherit"
              disabled={!canUpdate}
              icon={<EditOutlinedIcon />}
              key="edit"
              label="수정"
              onClick={() => setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.Edit } }))}
            />,
            <GridActionsCellItem
              color="inherit"
              disabled={!canDelete || deleteMutation.isPending || params.row.isNew}
              icon={<DeleteOutlineOutlinedIcon />}
              key="delete"
              label="삭제"
              onClick={() => confirmDeleteRow(params.row)}
            />,
          ];
        },
      },
    ],
    [
      canCreate,
      canDelete,
      canUpdate,
      confirmDeleteRow,
      deleteMutation.isPending,
      outlineCategoryNameByCode,
      outlineCategoryOptions,
      rowModesModel,
      shouldShowCategoryName,
      shouldShowGroupSeq,
    ],
  );

  const orderedColumns = useMemo(() => {
    const outlineContentIndex = columns.findIndex((column) => column.field === "outlineContent");
    const subcategoryUnitIndex = columns.findIndex((column) => column.field === "subcategoryUnit");
    if (outlineContentIndex < 0 || subcategoryUnitIndex < 0 || outlineContentIndex < subcategoryUnitIndex) {
      return columns;
    }

    const nextColumns = [...columns];
    const [outlineContentColumn] = nextColumns.splice(outlineContentIndex, 1);
    const nextSubcategoryUnitIndex = nextColumns.findIndex((column) => column.field === "subcategoryUnit");
    nextColumns.splice(nextSubcategoryUnitIndex, 0, outlineContentColumn);
    return nextColumns;
  }, [columns]);

  const processRowUpdate = async (updatedRow: CompanyPerformanceOutlineRecord, originalRow: CompanyPerformanceOutlineRecord) => {
    if (readOnly) {
      return updatedRow;
    }
    const updatedCategoryCode = text(updatedRow.categoryCode);
    const originalCategoryCode = text(originalRow.categoryCode);

    if (updatedCategoryCode && updatedCategoryCode !== originalCategoryCode && canCreate) {
      const detailCodes = await listOutlineDetailCodes(updatedCategoryCode);
      appendOutlineRowsFromCodes(updatedCategoryCode, detailCodes, updatedRow.isNew ? updatedRow.id : undefined);

      if (updatedRow.isNew) {
        return originalRow;
      }
    }

    const saved = await saveMutation.mutateAsync(updatedRow);
    return saved;
  };
  const gridColumns = useMemo(
    () => (readOnly ? orderedColumns.filter((column) => column.type !== "actions") : orderedColumns),
    [orderedColumns, readOnly],
  );

  return (
    <Box sx={{ p: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, gap: 1, alignItems: "center" }}>
        <TextField
          disabled={readOnly || !canCreate || !record.seq || outlineCategoryReferences.isLoading || outlineDetailCodesMutation.isPending}
          label="공사 추가 템플릿"
          onChange={(event) => handleOutlineCategoryChange(event.target.value)}
          select
          size="small"
          sx={{ minWidth: 180 }}
          value={selectedCategoryCode}
        >
          <MenuItem value="">선택</MenuItem>
          {outlineCategoryOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          disabled={
            !canCreate ||
            readOnly ||
            !record.seq ||
            saveMutation.isPending ||
            outlineCategoryReferences.isLoading ||
            outlineCategoryReferences.isFetching ||
            outlineDetailCodesMutation.isPending
          }
          onClick={addRow}
          size="small"
          startIcon={<AddOutlinedIcon />}
          variant="outlined"
        >
          추가
        </Button>
      </Box>
      <EnterpriseDataGrid<CompanyPerformanceOutlineRecord>
        columns={gridColumns}
        confirmProcessRowUpdate={readOnly ? undefined : confirmProcessRowUpdate}
        editMode={readOnly ? undefined : "row"}
        getRowId={(row) => row.id}
        isNewRow={(row) => row.isNew === true}
        hideFooterSelectedRowCount
        loading={
          outlinesQuery.isLoading ||
          outlinesQuery.isFetching ||
          outlineCategoryReferences.isLoading ||
          outlineCategoryReferences.isFetching ||
          outlineDetailCodesMutation.isPending ||
          saveMutation.isPending ||
          deleteMutation.isPending
        }
        onProcessRowUpdateError={() => undefined}
        onNewRowEditCancel={readOnly ? undefined : handleNewRowEditCancel}
        onRowEditStop={readOnly ? undefined : handleRowEditStop}
        onRowModesModelChange={readOnly ? undefined : setRowModesModel}
        processRowUpdate={readOnly ? undefined : processRowUpdate}
        readOnly={readOnly}
        wrapperMinHeight={475}
        rowHeight={34}
        rowModesModel={readOnly ? undefined : rowModesModel}
        rows={rows}
        showPageNumbers
        showToolbar={false}
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
        }}
      />
    </Box>
  );
}
