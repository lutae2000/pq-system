"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Autocomplete, Box, Button, MenuItem, Popover, TextField, Typography } from "@mui/material";
import {
  GridActionsCellItem,
  GridRowEditStartReasons,
  GridRowEditStopReasons,
  GridRowModes,
  type DataGridProps,
  type GridColDef,
  type GridRenderEditCellParams,
  type GridRowModesModel,
  type GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { EnterpriseDataGrid, type EnterpriseRowActionConfirm } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
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
  ddlbHeadYn?: unknown;
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

const outlineDetailCodeName = (code: CommonCodeRecord) =>
  text(code.codeDetailName) || text(code.codeName) || code.level3Code;

function OutlineDetailAutocompleteEditCell({
  params,
}: {
  params: GridRenderEditCellParams<CompanyPerformanceOutlineRecord, string | null>;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const categoryCode = text(params.row.categoryCode);
  const detailCodesQuery = useQuery({
    queryKey: ["common-codes", "company-performance-outline-details", categoryCode],
    queryFn: () => listCommonCodes({
      codeLevel: 3,
      level1Code: "PQCT",
      level2Code: categoryCode,
      sort: "level3Code",
      useYn: "Y",
    }),
    enabled: Boolean(categoryCode),
  });
  const options = detailCodesQuery.data ?? [];
  const value = options.find((code) => code.level3Code === text(params.row.subcategoryCode))
    ?? options.find((code) => outlineDetailCodeName(code) === text(params.value))
    ?? null;

  return (
    <Autocomplete
      autoHighlight
      disablePortal
      disabled={!categoryCode}
      fullWidth
      getOptionLabel={outlineDetailCodeName}
      isOptionEqualToValue={(option, currentValue) => option.codeId === currentValue.codeId}
      loading={detailCodesQuery.isLoading || detailCodesQuery.isFetching}
      noOptionsText={categoryCode ? "선택 가능한 공사상세가 없습니다." : "공사종류를 먼저 선택하세요."}
      onChange={(event, nextValue) => {
        const metadata = parseOutlineCommonCodeMeta(nextValue?.refValue1 ?? null);
        void Promise.all([
          params.api.setEditCellValue({ id: params.id, field: "subcategoryCode", value: nextValue?.level3Code ?? "" }, event),
          params.api.setEditCellValue({ id: params.id, field: "subcategoryName", value: nextValue ? outlineDetailCodeName(nextValue) : "" }, event),
          params.api.setEditCellValue({ id: params.id, field: "subcategoryUnit", value: metadataText(metadata.subcateUnit) }, event),
          params.api.setEditCellValue({ id: params.id, field: "ddlbYn", value: metadataText(metadata.ddlbYn).toUpperCase() === "Y" ? "Y" : "N" }, event),
          params.api.setEditCellValue({ id: params.id, field: "ddlbGroupCode", value: metadataText(metadata.ddlbGroupCode) }, event),
        ]);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && popupOpen && !event.nativeEvent.isComposing) {
          event.stopPropagation();
        }
      }}
      onClose={() => setPopupOpen(false)}
      onOpen={() => setPopupOpen(true)}
      options={options}
      renderInput={(inputParams) => (
        <TextField {...inputParams} autoFocus={params.hasFocus} size="small" sx={standardFieldSx} />
      )}
      value={value}
    />
  );
}

const outlineGroupSeqFromCategoryCode = (categoryCode: string) => {
  const parsed = Number.parseInt(categoryCode.replace(/^\D+/, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const listOutlineDetailCodes = async (categoryCode: string) => {
  const detailCodes = await listCommonCodes({
    codeLevel: 3,
    level1Code: "PQCT",
    level2Code: categoryCode,
    sort: "level3Code",
    useYn: "Y",
  });

  return detailCodes.filter((code) => (
    metadataText(parseOutlineCommonCodeMeta(code.refValue1).ddlbHeadYn).toUpperCase() === "Y"
  ));
};

const toOutlineRequest = (row: CompanyPerformanceOutlineRecord): CompanyPerformanceOutlineRequest => ({
  categoryCode: text(row.categoryCode) || null,
  categoryName: text(row.categoryName) || null,
  ddlbGroupCode: text(row.ddlbGroupCode) || null,
  ddlbYn: text(row.ddlbYn).toUpperCase() === "Y" ? "Y" : "N",
  outlineContent: text(row.outlineContent) || null,
  outlineGroupSeq: toNullableNumber(row.outlineGroupSeq) ?? outlineGroupSeqFromCategoryCode(text(row.categoryCode)),
  outlineLineSeq: toNullableNumber(row.outlineLineSeq),
  sortSeq: toNullableNumber(row.sortSeq),
  subcategoryCode: text(row.subcategoryCode) || null,
  subcategoryName: text(row.subcategoryName) || null,
  subcategoryUnit: text(row.subcategoryUnit) || null,
});

const comparableOutlineRequest = (row: CompanyPerformanceOutlineRecord) => ({
  ...toOutlineRequest(row),
  categoryName: null,
});

const hasOutlineChanges = (
  updatedRow: CompanyPerformanceOutlineRecord,
  originalRow: CompanyPerformanceOutlineRecord,
) => JSON.stringify(comparableOutlineRequest(updatedRow)) !== JSON.stringify(comparableOutlineRequest(originalRow));

const isTemplateInputRow = (row: CompanyPerformanceOutlineRecord) =>
  row.isNew === true && row.outlineLineSeq !== null;

export function OutlinesTab({ readOnly = false, record, requestConfirmation }: OutlinesTabProps) {
  const queryClient = useQueryClient();
  const { canCreate, canDelete, canUpdate } = useCurrentMenuPermission();
  const [newRows, setNewRows] = useState<CompanyPerformanceOutlineRecord[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });
  const [selectedCategoryCode, setSelectedCategoryCode] = useState("");
  const [guideAnchorEl, setGuideAnchorEl] = useState<HTMLElement | null>(null);

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
  const hasTemplateInputRows = useMemo(() => rows.some(isTemplateInputRow), [rows]);

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
      setRowSelectionModel((current) => ({
        ...current,
        ids: new Set([...current.ids].filter((id) => id !== row.id)),
      }));
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
          subcategoryName: text(code.codeDetailName) || text(code.codeName) || code.level3Code,
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
    (
      row: CompanyPerformanceOutlineRecord,
      originalRow: CompanyPerformanceOutlineRecord,
    ): Omit<EnterpriseRowActionConfirm, "onConfirm"> | null => {
      if (row.isNew && !text(row.outlineContent)) {
        return null;
      }
      if (!row.isNew && !hasOutlineChanges(row, originalRow)) {
        return null;
      }

      return {
        confirmColor: "primary",
        confirmLabel: row.isNew ? "등록" : "수정",
        message: row.isNew ? "공사개요를 등록하시겠습니까?" : "공사개요를 수정하시겠습니까?",
        targetLabel: displayTarget(row.subcategoryName || row.categoryName, row.isNew ? "신규 공사개요" : String(row.id)),
        title: row.isNew ? "공사개요 등록" : "공사개요 수정",
      };
    },
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

  const removeNewRow = useCallback((id: number) => {
    setRowModesModel((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setNewRows((current) => current.filter((row) => row.id !== id));
    setRowSelectionModel((current) => ({
      ...current,
      ids: new Set([...current.ids].filter((selectedId) => selectedId !== id)),
    }));
  }, []);

  const removeSelectedNewRows = useCallback(() => {
    const selectedIds = rowSelectionModel.ids;
    if (selectedIds.size === 0) {
      return;
    }

    setNewRows((current) => current.filter((row) => !selectedIds.has(row.id)));
    setRowModesModel((current) => {
      const next = { ...current };
      selectedIds.forEach((id) => delete next[id]);
      return next;
    });
    setRowSelectionModel({ ids: new Set(), type: "include" });
  }, [rowSelectionModel.ids]);

  const addRow = () => {
    const id = tempId();
    const defaultCategory = outlineCategoryReferences.options[0];
    const defaultCategoryCode = defaultCategory?.value ?? "";
    const newRow: CompanyPerformanceOutlineRecord = {
      categoryCode: defaultCategoryCode,
      categoryName: defaultCategory?.label ?? "",
      ddlbGroupCode: "",
      ddlbYn: "N",
      id,
      isNew: true,
      outlineContent: "",
      outlineGroupSeq: outlineGroupSeqFromCategoryCode(defaultCategoryCode),
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
            outlineGroupSeq: outlineGroupSeqFromCategoryCode(categoryCode),
          };
        },
      },
      {
        field: "subcategoryName",
        headerName: "공사상세",
        width: 150,
        editable: true,
        renderCell: (params) => display(params.row.subcategoryName),
        renderEditCell: (params) => <OutlineDetailAutocompleteEditCell params={params} />,
      },
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
              disabled={params.row.isNew ? !canCreate : !canDelete || deleteMutation.isPending}
              icon={<DeleteOutlineOutlinedIcon />}
              key="delete"
              label="삭제"
              onClick={() => {
                if (params.row.isNew) {
                  removeNewRow(params.row.id);
                  return;
                }
                confirmDeleteRow(params.row);
              }}
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
      removeNewRow,
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
    const hasEditableValue = [updatedRow.ddlbGroupCode, updatedRow.outlineContent, updatedRow.subcategoryCode, updatedRow.subcategoryName, updatedRow.subcategoryUnit].some((value) => text(value));
    if (updatedRow.isNew && !hasEditableValue) {
      setRowModesModel((current) => {
        const next = { ...current };
        delete next[String(updatedRow.id)];
        return next;
      });
      setNewRows((current) => current.filter((row) => row.id !== updatedRow.id));
      return originalRow;
    }

    if (updatedRow.isNew && !text(updatedRow.outlineContent)) {
      setNewRows((current) => current.map((row) => (
        row.id === updatedRow.id ? { ...updatedRow, isNew: true } : row
      )));
      return updatedRow;
    }

    if (readOnly) {
      return updatedRow;
    }
    if (!updatedRow.isNew && !hasOutlineChanges(updatedRow, originalRow)) {
      return originalRow;
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
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
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
            onClick={(event) => setGuideAnchorEl(event.currentTarget)}
            size="small"
            startIcon={<HelpOutlineOutlinedIcon />}
            variant="text"
          >
            사용 가이드
          </Button>
          <Popover
            anchorEl={guideAnchorEl}
            anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
            onClose={() => setGuideAnchorEl(null)}
            open={Boolean(guideAnchorEl)}
            transformOrigin={{ horizontal: "left", vertical: "top" }}
          >
            <Box sx={{ maxWidth: "calc(100vw - 32px)", p: 2, width: 520 }}>
              <Typography sx={{ fontWeight: 800, mb: 0.75 }} variant="subtitle2">
                공사개요 입력 가이드
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.5 }, "& li:last-child": { mb: 0 } }}>
                <li>템플릿을 선택하면 지정된 공사상세 행이 자동으로 입력됩니다.</li>
                <li>공사상세를 선택하면 공통코드의 측량기준이 함께 입력됩니다.</li>
                <li>템플릿 행을 여러 개 선택하고 Delete 키를 누르면 선택한 행을 일괄 삭제할 수 있습니다.</li>
                <li>행 입력을 취소하려면 ESC 키를 누르세요.</li>
                <li>측량수치를 입력한 행만 등록 확인 후 저장됩니다.</li>
              </Box>
            </Box>
          </Popover>
        </Box>
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
        checkboxSelection={!readOnly && canCreate && hasTemplateInputRows}
        columns={gridColumns}
        confirmProcessRowUpdate={readOnly ? undefined : confirmProcessRowUpdate}
        disableRowSelectionExcludeModel
        editMode={readOnly ? undefined : "row"}
        getRowId={(row) => row.id}
        getRowClassName={(params) => (isTemplateInputRow(params.row) ? "outline-template-input-row" : "")}
        isRowSelectable={(params) => isTemplateInputRow(params.row)}
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
        onCellClick={(params) => {
          if (
            params.field === "outlineContent" &&
            params.row.isNew &&
            rowModesModel[params.id]?.mode !== GridRowModes.Edit
          ) {
            setRowModesModel((current) => ({
              ...current,
              [params.id]: { mode: GridRowModes.Edit, fieldToFocus: "outlineContent" },
            }));
          }
        }}
        onCellKeyDown={(params, event) => {
          if (
            event.key === "Delete" &&
            rowSelectionModel.ids.size > 0 &&
            !Object.values(rowModesModel).some((mode) => mode.mode === GridRowModes.Edit)
          ) {
            event.preventDefault();
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
            event.defaultMuiPrevented = true;
            removeSelectedNewRows();
            return;
          }

          if (rowModesModel[params.id]?.mode !== GridRowModes.Edit || event.nativeEvent.isComposing) {
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
            event.defaultMuiPrevented = true;
            setRowModesModel((current) => ({
              ...current,
              [params.id]: { mode: GridRowModes.View, ignoreModifications: true },
            }));
            if (params.row.isNew) {
              setNewRows((current) => current.filter((row) => row.id !== params.row.id));
            }
            return;
          }

          if (event.key !== "Enter") {
            return;
          }

          event.defaultMuiPrevented = true;
          if (params.field !== "categoryCode") {
            setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View } }));
          }
        }}
        onRowEditStart={(params, event) => {
          if (
            params.field !== "outlineContent" ||
            !params.row.isNew ||
            params.reason !== GridRowEditStartReasons.printableKeyDown
          ) {
            return;
          }

          event.defaultMuiPrevented = true;
          setRowModesModel((current) => ({
            ...current,
            [params.id]: { mode: GridRowModes.Edit, fieldToFocus: "outlineContent" },
          }));
        }}
        onRowEditStop={readOnly ? undefined : handleRowEditStop}
        onRowModesModelChange={readOnly ? undefined : setRowModesModel}
        onRowSelectionModelChange={setRowSelectionModel}
        processRowUpdate={readOnly ? undefined : processRowUpdate}
        readOnly={readOnly}
        wrapperMinHeight={475}
        rowHeight={34}
        rowModesModel={readOnly ? undefined : rowModesModel}
        rowSelectionModel={rowSelectionModel}
        rows={rows}
        showPageNumbers
        showToolbar={false}
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
          "& .MuiDataGrid-row:not(.outline-template-input-row) .MuiDataGrid-cellCheckbox": { visibility: "hidden" },
        }}
      />
    </Box>
  );
}
